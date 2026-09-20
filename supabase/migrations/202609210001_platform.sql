begin;

-- Helpers and rate events are intentionally outside the exposed API schema.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to anon, authenticated, service_role;

create table public.published_entries (
  id uuid primary key,
  data jsonb not null check (jsonb_typeof(data) = 'object' and data->>'id' = id::text)
);
create table public.entry_drafts (
  id uuid primary key,
  data jsonb not null check (jsonb_typeof(data) = 'object' and data->>'id' = id::text)
);
create table public.site_settings (
  id boolean primary key default true check (id),
  data jsonb not null check (jsonb_typeof(data) = 'object')
);
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null default '访客' check (char_length(nickname) between 1 and 30)
);
create table public.site_owners (
  user_id uuid primary key references auth.users(id) on delete cascade
);
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  target_id text not null,
  author_id uuid references auth.users(id) on delete set null,
  author_name text not null,
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now(),
  parent_id uuid references public.messages(id) on delete restrict,
  status text not null default 'pending' check (status in ('pending', 'approved', 'hidden'))
);
create index messages_target_created on public.messages(target_id, created_at);
create index messages_author on public.messages(author_id);
create index messages_parent on public.messages(parent_id);
create table private.message_events (
  user_id uuid not null references auth.users(id) on delete cascade,
  occurred_at timestamptz not null default clock_timestamp()
);
create index message_events_user_time on private.message_events(user_id, occurred_at);

alter table public.published_entries enable row level security;
alter table public.entry_drafts enable row level security;
alter table public.site_settings enable row level security;
alter table public.profiles enable row level security;
alter table public.site_owners enable row level security;
alter table public.messages enable row level security;
alter table private.message_events enable row level security;

create function private.is_owner() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.site_owners where user_id = (select auth.uid()));
$$;

create function private.target_open(target text) returns boolean
language sql stable security definer set search_path = '' as $$
  select target = 'guestbook' or exists (
    select 1 from public.published_entries
    where id::text = target and data->'discussion' = 'true'::jsonb
  );
$$;

create function private.media_readable(object_name text) returns boolean
language sql stable security definer set search_path = '' as $$
  select private.is_owner() or exists (
    select 1 from public.published_entries e
    where e.data->>'cover' = '/media/' || object_name
      or exists (
        select 1 from jsonb_array_elements(e.data->'photos') p
        where p->>'src' = '/media/' || object_name
      )
  );
$$;

create policy published_read on public.published_entries for select to anon, authenticated using (true);
create policy drafts_owner_read on public.entry_drafts for select to authenticated using (private.is_owner());
create policy settings_read on public.site_settings for select to anon, authenticated using (true);
create policy profile_self_read on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy owner_self_read on public.site_owners for select to authenticated using (user_id = (select auth.uid()));
create policy messages_read on public.messages for select to anon, authenticated using (
  private.is_owner()
  or author_id = (select auth.uid())
  or (status = 'approved' and private.target_open(target_id))
);

revoke all on public.published_entries, public.entry_drafts, public.site_settings,
  public.profiles, public.site_owners, public.messages from public, anon, authenticated;
revoke all on private.message_events from public, anon, authenticated;
grant select on public.published_entries, public.site_settings, public.messages to anon, authenticated;
grant select on public.entry_drafts, public.profiles, public.site_owners to authenticated;
grant all on public.published_entries, public.entry_drafts, public.site_settings,
  public.profiles, public.site_owners, public.messages, private.message_events to service_role;

create function private.require_owner() returns void
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or not private.is_owner() then
    raise exception '需要站主管理权限。' using errcode = '42501';
  end if;
end;
$$;

create function private.require_verified() returns uuid
language plpgsql security definer set search_path = '' as $$
declare actor uuid := auth.uid();
begin
  if actor is null or not exists (
    select 1 from auth.users where id = actor and email_confirmed_at is not null
  ) then
    raise exception '请登录并验证邮箱。' using errcode = '42501';
  end if;
  return actor;
end;
$$;

create function private.check_media(source text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if source !~ '^/media/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(png|jpg|webp|avif)$'
    or not exists (select 1 from storage.objects where bucket_id = 'media' and name = substr(source, 8)) then
    raise exception '图片尚未上传或地址无效，请重新上传。' using errcode = '22023';
  end if;
end;
$$;

create function private.consume_message_rate(actor uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare operation_time timestamptz;
begin
  -- Serializes concurrent requests by this identity; a failed transaction consumes no quota.
  perform pg_advisory_xact_lock(hashtextextended(actor::text, 451));
  operation_time := clock_timestamp();
  delete from private.message_events where user_id = actor and occurred_at < operation_time - interval '1 day';
  if (select count(*) from private.message_events where user_id = actor and occurred_at > operation_time - interval '1 minute') >= 5
    or (select count(*) from private.message_events where user_id = actor) >= 30 then
    raise exception '留言操作过于频繁，请稍后再试（每分钟 5 次，每天 30 次）。' using errcode = 'P0001';
  end if;
  insert into private.message_events(user_id, occurred_at) values (actor, operation_time);
end;
$$;

create function private.create_profile() returns trigger
language plpgsql security definer set search_path = '' as $$
declare clean_name text;
begin
  -- A bounded display nickname is the sole accepted signup metadata field.
  -- Role, owner, and every other privilege claim are deliberately ignored.
  if jsonb_typeof(new.raw_user_meta_data->'nickname') = 'string' then
    clean_name := left(btrim(regexp_replace(new.raw_user_meta_data->>'nickname', '[[:space:][:cntrl:]]+', ' ', 'g')), 24);
  end if;
  insert into public.profiles(id, nickname) values (new.id, coalesce(nullif(clean_name, ''), '访客')) on conflict do nothing;
  return new;
end;
$$;
create trigger platform_profile_after_signup after insert on auth.users
for each row execute function private.create_profile();
insert into public.profiles(id, nickname) select id, '访客' from auth.users on conflict do nothing;

create function public.save_entry(entry jsonb, publish boolean default false) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  entry_id uuid;
  previous jsonb;
  result jsonb;
  photos jsonb := '[]'::jsonb;
  topics jsonb;
  photo jsonb;
  field text;
  operation_time text := to_char(clock_timestamp() at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
begin
  perform private.require_owner();
  if entry is null or jsonb_typeof(entry) <> 'object' or publish is null then
    raise exception '内容格式不完整。' using errcode = '22023';
  end if;
  foreach field in array array['id', 'kind', 'title', 'summary', 'body', 'cover', 'destination'] loop
    if jsonb_typeof(entry->field) is distinct from 'string' then
      raise exception '内容字段格式不正确：%', field using errcode = '22023';
    end if;
  end loop;
  if entry->>'kind' not in ('writing', 'photo', 'project')
    or jsonb_typeof(entry->'photos') is distinct from 'array'
    or jsonb_typeof(entry->'topics') is distinct from 'array'
    or jsonb_typeof(entry->'featured') is distinct from 'boolean'
    or jsonb_typeof(entry->'discussion') is distinct from 'boolean' then
    raise exception '内容类型不正确。' using errcode = '22023';
  end if;
  entry_id := (entry->>'id')::uuid;
  perform pg_advisory_xact_lock(hashtextextended(entry_id::text, 452));
  if char_length(entry->>'title') > 150 or char_length(entry->>'summary') > 1000
    or char_length(entry->>'body') > 200000 or char_length(entry->>'destination') > 2048
    or jsonb_array_length(entry->'photos') > 20 or jsonb_array_length(entry->'topics') > 20 then
    raise exception '内容超过长度或数量限制。' using errcode = '22023';
  end if;
  if exists (select 1 from jsonb_array_elements(entry->'topics') t where jsonb_typeof(t) <> 'string' or char_length(t#>>'{}') > 40) then
    raise exception '主题请使用最多 40 个字符的文字。' using errcode = '22023';
  end if;
  select coalesce(jsonb_agg(topic order by first_position), '[]'::jsonb) into topics from (
    select btrim(value) as topic, min(ordinality) as first_position
    from jsonb_array_elements_text(entry->'topics') with ordinality
    where btrim(value) <> '' group by btrim(value)
  ) t;
  if entry->>'cover' <> '' then perform private.check_media(entry->>'cover'); end if;
  for photo in select value from jsonb_array_elements(entry->'photos') loop
    if jsonb_typeof(photo) <> 'object' then raise exception '图片格式不正确。' using errcode = '22023'; end if;
    foreach field in array array['id', 'src', 'alt', 'caption'] loop
      if jsonb_typeof(photo->field) is distinct from 'string' then
        raise exception '图片字段格式不正确：%', field using errcode = '22023';
      end if;
    end loop;
    if char_length(photo->>'id') not between 1 and 100 or char_length(photo->>'alt') > 200
      or char_length(photo->>'caption') > 1000 or char_length(coalesce(photo->>'credit', '')) > 200
      or (photo ? 'credit' and jsonb_typeof(photo->'credit') <> 'string') then
      raise exception '图片说明超过限制。' using errcode = '22023';
    end if;
    perform private.check_media(photo->>'src');
    photos := photos || jsonb_build_array(jsonb_build_object(
      'id', photo->>'id', 'src', photo->>'src', 'alt', photo->>'alt', 'caption', photo->>'caption'
    ) || case when photo ? 'credit' then jsonb_build_object('credit', photo->>'credit') else '{}'::jsonb end);
  end loop;
  if (select count(*) from jsonb_array_elements(photos)) <> (select count(distinct p->>'id') from jsonb_array_elements(photos) p) then
    raise exception '图片标识重复。' using errcode = '22023';
  end if;
  if btrim(entry->>'destination') <> '' and not (
    btrim(entry->>'destination') ~ '^https?://[^[:space:]]+$'
    or btrim(entry->>'destination') ~ '^#/[a-zA-Z0-9/?#&=_.%~-]*$'
    or btrim(entry->>'destination') ~ '^/[^/\\[:space:]][a-zA-Z0-9/?#&=_.%~-]*$'
  ) then raise exception '项目地址只支持 http、https 或本站页面地址。' using errcode = '22023'; end if;
  if publish and (btrim(entry->>'title') = ''
    or (entry->>'kind' = 'writing' and btrim(entry->>'body') = '')
    or (entry->>'kind' = 'photo' and jsonb_array_length(photos) = 0)
    or (entry->>'kind' = 'project' and btrim(entry->>'body') = '' and btrim(entry->>'destination') = '')) then
    raise exception '请填写标题与相应的正文、照片或项目地址后发布。' using errcode = '22023';
  end if;
  select data into previous from public.published_entries where id = entry_id;
  if previous is null then select data into previous from public.entry_drafts where id = entry_id; end if;
  result := jsonb_build_object(
    'id', entry_id, 'kind', entry->>'kind', 'title', btrim(entry->>'title'),
    'summary', btrim(entry->>'summary'), 'body', entry->>'body', 'topics', topics,
    'cover', entry->>'cover', 'photos', photos, 'destination', btrim(entry->>'destination'),
    'status', case when publish then 'published' else 'draft' end,
    'createdAt', coalesce(previous->>'createdAt', operation_time), 'updatedAt', operation_time,
    'publishedAt', case when publish then coalesce(nullif(previous->>'publishedAt', ''), operation_time) else coalesce(previous->>'publishedAt', '') end,
    'featured', entry->'featured', 'discussion', entry->'discussion', 'sample', false
  );
  if entry->>'artwork' in ('color', 'site') then result := result || jsonb_build_object('artwork', entry->>'artwork'); end if;
  if publish then
    insert into public.published_entries(id, data) values (entry_id, result) on conflict (id) do update set data = excluded.data;
    delete from public.entry_drafts where id = entry_id;
  else
    insert into public.entry_drafts(id, data) values (entry_id, result) on conflict (id) do update set data = excluded.data;
  end if;
  return result;
end;
$$;

create function public.unpublish_entry(entry_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare original jsonb;
begin
  perform private.require_owner();
  perform pg_advisory_xact_lock(hashtextextended(entry_id::text, 452));
  select data into original from public.published_entries where id = entry_id;
  if original is null then raise exception '公开内容不存在。' using errcode = '22023'; end if;
  -- Preserve an already edited draft rather than replacing it with the public version.
  insert into public.entry_drafts(id, data) values (entry_id, original || '{"status":"draft"}'::jsonb) on conflict do nothing;
  delete from public.published_entries where id = entry_id;
end;
$$;

create function public.delete_entry(entry_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform private.require_owner();
  perform pg_advisory_xact_lock(hashtextextended(entry_id::text, 452));
  delete from public.published_entries where id = entry_id;
  delete from public.entry_drafts where id = entry_id;
  -- Keep privately accessible comments so their authors can still withdraw them.
end;
$$;

create function public.save_settings(settings jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare result jsonb; field text;
begin
  perform private.require_owner();
  if settings is null or jsonb_typeof(settings) <> 'object' then raise exception '网站设置格式不正确。' using errcode = '22023'; end if;
  foreach field in array array['name', 'intro', 'about', 'homeView'] loop
    if jsonb_typeof(settings->field) is distinct from 'string' then raise exception '网站设置字段格式不正确。' using errcode = '22023'; end if;
  end loop;
  if char_length(btrim(settings->>'name')) not between 1 and 60
    or char_length(settings->>'intro') > 1000 or char_length(settings->>'about') > 50000
    or settings->>'homeView' not in ('grid', 'list') then raise exception '网站设置超过限制。' using errcode = '22023'; end if;
  result := jsonb_build_object('name', btrim(settings->>'name'), 'intro', settings->>'intro', 'about', settings->>'about', 'homeView', settings->>'homeView');
  insert into public.site_settings(id, data) values (true, result) on conflict (id) do update set data = excluded.data;
  return result;
end;
$$;

create function public.save_profile(nickname text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare actor uuid := private.require_verified(); clean text := regexp_replace(btrim(nickname), '[[:space:]]+', ' ', 'g'); result public.profiles;
begin
  if clean is null or char_length(clean) not between 1 and 30 then raise exception '昵称请使用 1 至 30 个字符。' using errcode = '22023'; end if;
  insert into public.profiles(id, nickname) values (actor, clean) on conflict (id) do update set nickname = excluded.nickname returning * into result;
  return to_jsonb(result);
end;
$$;

create function public.add_message(target_id text, body text, parent_id uuid default null) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare actor uuid := private.require_verified(); result public.messages; clean text := btrim(body); parent public.messages;
begin
  if clean is null or char_length(clean) not between 1 and 1000 then raise exception '留言请使用 1 至 1000 个字符。' using errcode = '22023'; end if;
  if target_id is null or not private.target_open(target_id) then raise exception '这条内容尚未公开或留言已关闭。' using errcode = '22023'; end if;
  if parent_id is not null then
    select * into parent from public.messages where id = add_message.parent_id for update;
    if parent.id is null or parent.target_id <> target_id or parent.status <> 'approved' or parent.author_id is null then
      raise exception '无法回复这条留言。' using errcode = '22023';
    end if;
  end if;
  if not private.is_owner() then perform private.consume_message_rate(actor); end if;
  insert into public.messages(target_id, author_id, author_name, body, parent_id, status)
    values (target_id, actor, coalesce((select nickname from public.profiles where id = actor), '访客'), clean, parent_id,
      case when private.is_owner() then 'approved' else 'pending' end) returning * into result;
  return to_jsonb(result);
end;
$$;

create function public.edit_message(message_id uuid, body text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare actor uuid := private.require_verified(); result public.messages; clean text := btrim(body);
begin
  if clean is null or char_length(clean) not between 1 and 1000 then raise exception '留言请使用 1 至 1000 个字符。' using errcode = '22023'; end if;
  select * into result from public.messages where id = message_id for update;
  if result.id is null or result.author_id is distinct from actor then raise exception '只能修改自己的留言。' using errcode = '42501'; end if;
  if not private.target_open(result.target_id) then raise exception '这条内容尚未公开或留言已关闭。' using errcode = '22023'; end if;
  if not private.is_owner() then perform private.consume_message_rate(actor); end if;
  update public.messages set body = clean, status = case when private.is_owner() then 'approved' else 'pending' end
    where id = message_id returning * into result;
  return to_jsonb(result);
end;
$$;

create function public.delete_message(message_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare actor uuid := private.require_verified(); original public.messages;
begin
  select * into original from public.messages where id = message_id for update;
  if original.id is null or (original.author_id is distinct from actor and not private.is_owner()) then
    raise exception '只能删除自己的留言。' using errcode = '42501';
  end if;
  if exists (select 1 from public.messages where parent_id = message_id) then
    update public.messages set author_id = null, author_name = '已删除', body = '留言已删除' where id = message_id;
  else delete from public.messages where id = message_id; end if;
end;
$$;

create function public.moderate_message(message_id uuid, status text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform private.require_owner();
  if status is null or status not in ('pending', 'approved', 'hidden') then raise exception '审核状态不正确。' using errcode = '22023'; end if;
  update public.messages set status = moderate_message.status where id = message_id;
  if not found then raise exception '留言不存在。' using errcode = '22023'; end if;
end;
$$;

-- Uploaded bytes may only be created once. Browser delete/update are denied so
-- a draft cannot overwrite a published asset or remove media from an old backup.
insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', false, 10485760, array['image/png', 'image/jpeg', 'image/webp', 'image/avif']);
create policy media_owner_insert on storage.objects for insert to authenticated with check (
  bucket_id = 'media' and private.is_owner()
  and name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(png|jpg|webp|avif)$'
);
create policy media_reference_read on storage.objects for select to anon, authenticated using (
  bucket_id = 'media' and private.media_readable(name)
);

-- Explicit grants counter the default EXECUTE-to-PUBLIC function privileges.
revoke all on all functions in schema private from public, anon, authenticated;
grant execute on function private.is_owner(), private.target_open(text), private.media_readable(text) to anon, authenticated;
revoke all on function public.save_entry(jsonb, boolean), public.unpublish_entry(uuid), public.delete_entry(uuid),
  public.save_settings(jsonb), public.save_profile(text), public.add_message(text, text, uuid),
  public.edit_message(uuid, text), public.delete_message(uuid), public.moderate_message(uuid, text)
  from public, anon, authenticated;
grant execute on function public.save_entry(jsonb, boolean), public.unpublish_entry(uuid), public.delete_entry(uuid),
  public.save_settings(jsonb), public.save_profile(text), public.add_message(text, text, uuid),
  public.edit_message(uuid, text), public.delete_message(uuid), public.moderate_message(uuid, text) to authenticated;

insert into public.site_settings(id, data) values (true, '{"name":"Myshkin 451","intro":"","about":"","homeView":"grid"}');
commit;
