begin;

-- Application restrictions are independent of Auth login bans. Existing JWTs
-- must lose write privileges immediately when an account is restricted.
create table private.account_access (
  user_id uuid primary key references auth.users(id) on delete cascade,
  restricted boolean not null default false
);
create table private.account_access_events (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null,
  target_id uuid not null,
  old_owner boolean not null,
  new_owner boolean not null,
  old_restricted boolean not null,
  new_restricted boolean not null,
  created_at timestamptz not null default now()
);
alter table private.account_access enable row level security;
alter table private.account_access_events enable row level security;
revoke all on private.account_access, private.account_access_events from public, anon, authenticated;
grant all on private.account_access, private.account_access_events to service_role;

create or replace function private.is_owner() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.site_owners o join auth.users u on u.id = o.user_id
    left join private.account_access a on a.user_id = u.id
    where u.id = (select auth.uid()) and u.email_confirmed_at is not null
      and (u.banned_until is null or u.banned_until <= now())
      and not coalesce(a.restricted, false)
  );
$$;

create or replace function private.require_verified() returns uuid
language plpgsql security definer set search_path = '' as $$
declare actor uuid := auth.uid();
begin
  if actor is null or not exists (
    select 1 from auth.users u left join private.account_access a on a.user_id = u.id
    where u.id = actor and u.email_confirmed_at is not null
      and (u.banned_until is null or u.banned_until <= now())
      and not coalesce(a.restricted, false)
  ) then
    raise exception '请使用已验证且未受限制的账号。' using errcode = '42501';
  end if;
  return actor;
end;
$$;

drop policy owner_self_read on public.site_owners;
create policy owner_self_read on public.site_owners for select to authenticated
  using (user_id = (select auth.uid()) and private.is_owner());

create function public.account_status() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare result jsonb;
begin
  if auth.uid() is null then raise exception '请先登录。' using errcode = '42501'; end if;
  select jsonb_build_object(
    'id', u.id, 'email', u.email, 'email_confirmed_at', u.email_confirmed_at,
    'role', case when exists (select 1 from public.site_owners o where o.user_id = u.id)
      then 'owner' else 'visitor' end,
    'restricted', coalesce(a.restricted, false) or coalesce(u.banned_until > now(), false),
    'created_at', u.created_at
  ) into result from auth.users u left join private.account_access a on a.user_id = u.id
  where u.id = auth.uid();
  if result is null then raise exception '账号不存在。' using errcode = '42501'; end if;
  return result;
end;
$$;

create function public.list_accounts(page_number integer default 0) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare result jsonb;
begin
  perform private.require_owner();
  if page_number is null or page_number < 0 or page_number > 100000 then
    raise exception '页码不正确。' using errcode = '22023';
  end if;
  with page as (
    select u.id, u.email, u.email_confirmed_at, u.created_at, u.last_sign_in_at,
      coalesce(p.nickname, '访客') as nickname,
      case when o.user_id is not null then 'owner' else 'visitor' end as role,
      coalesce(a.restricted, false) or coalesce(u.banned_until > now(), false) as restricted
    from auth.users u left join public.profiles p on p.id = u.id
      left join public.site_owners o on o.user_id = u.id
      left join private.account_access a on a.user_id = u.id
    order by u.created_at desc, u.id desc limit 51 offset (page_number::bigint * 50)
  ), numbered as (
    select *, row_number() over (order by created_at desc, id desc) as position from page
  )
  select jsonb_build_object(
    'accounts', coalesce(jsonb_agg(to_jsonb(numbered) - 'position' order by position)
      filter (where position <= 50), '[]'::jsonb),
    'has_more', count(*) > 50
  ) into result from numbered;
  return result;
end;
$$;

create function public.set_account_access(target_id uuid, owner boolean, restricted boolean) returns void
language plpgsql security definer set search_path = '' as $$
declare
  previous_owner boolean;
  previous_restricted boolean;
  target_user auth.users;
begin
  -- One transaction-level lock serializes role mutations, including concurrent
  -- requests from different owners. Recheck the caller after acquiring it.
  perform pg_advisory_xact_lock(451, 270001);
  perform private.require_owner();
  if target_id is null or owner is null or restricted is null then
    raise exception '账号和权限选项不能为空。' using errcode = '22023';
  end if;
  select * into target_user from auth.users where id = target_id for update;
  if not found then raise exception '账号不存在。' using errcode = '22023'; end if;
  if target_id = auth.uid() and (not owner or restricted) then
    raise exception '不能撤销自己的站主权限或限制自己的账号。' using errcode = '42501';
  end if;
  if owner and (restricted or target_user.email_confirmed_at is null
      or coalesce(target_user.banned_until > now(), false)) then
    raise exception '只能授予已验证且未受限制的账号站主权限。' using errcode = '22023';
  end if;
  if not restricted and coalesce(target_user.banned_until > now(), false) then
    raise exception '该账号已被认证服务停用，请先在认证控制台恢复。' using errcode = '22023';
  end if;
  select exists (select 1 from public.site_owners where user_id = target_id) into previous_owner;
  select coalesce((select a.restricted from private.account_access a where a.user_id = target_id), false)
    into previous_restricted;
  if previous_owner and (not owner or restricted) and not exists (
    select 1 from public.site_owners o join auth.users u on u.id = o.user_id
      left join private.account_access a on a.user_id = u.id
    where u.id <> target_id and u.email_confirmed_at is not null
      and (u.banned_until is null or u.banned_until <= now()) and not coalesce(a.restricted, false)
  ) then
    raise exception '必须保留至少一个有效站主账号。' using errcode = '42501';
  end if;
  if previous_owner = owner and previous_restricted = restricted then return; end if;
  if owner then
    insert into public.site_owners(user_id) values (target_id) on conflict do nothing;
  else
    delete from public.site_owners where user_id = target_id;
  end if;
  insert into private.account_access(user_id, restricted) values (target_id, restricted)
    on conflict (user_id) do update set restricted = excluded.restricted;
  insert into private.account_access_events(actor_id, target_id, old_owner, new_owner, old_restricted, new_restricted)
    values (auth.uid(), target_id, previous_owner, owner, previous_restricted, restricted);
end;
$$;

revoke all on function public.account_status(), public.list_accounts(integer),
  public.set_account_access(uuid, boolean, boolean) from public, anon, authenticated;
grant execute on function public.account_status(), public.list_accounts(integer),
  public.set_account_access(uuid, boolean, boolean) to authenticated;

commit;
