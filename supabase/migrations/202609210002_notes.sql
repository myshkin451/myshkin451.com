-- Title-free short posts share the existing owner grants, draft isolation and backup boundary.
create or replace function public.save_entry(entry jsonb, publish boolean default false) returns jsonb
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
  if entry->>'kind' not in ('writing', 'photo', 'project', 'note')
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
  if entry->>'kind' = 'note' and char_length(entry->>'body') > 5000 then
    raise exception '随记请控制在 5000 个字符以内。' using errcode = '22023';
  end if;
  if publish and entry->>'kind' = 'note' and btrim(entry->>'body', E' \t\n\r') = '' then
    raise exception '先写一点内容吧。' using errcode = '22023';
  end if;
  if btrim(entry->>'destination') <> '' and not (
    btrim(entry->>'destination') ~ '^https?://[^[:space:]]+$'
    or btrim(entry->>'destination') ~ '^#/[a-zA-Z0-9/?#&=_.%~-]*$'
    or btrim(entry->>'destination') ~ '^/[^/\\[:space:]][a-zA-Z0-9/?#&=_.%~-]*$'
  ) then raise exception '项目地址只支持 http、https 或本站页面地址。' using errcode = '22023'; end if;
  if publish and ((entry->>'kind' <> 'note' and btrim(entry->>'title') = '')
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
