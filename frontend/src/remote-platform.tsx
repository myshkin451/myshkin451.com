import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { initialState as emptyState, saveDraft, updateSettings } from './model'
import { defaultSettings } from './seed'
import { safeDestination, type Entry, type Message, type Platform, type StoredState } from './types'

export type RemoteConfig = {
  url: string
  key: string
  emailEnabled?: boolean
  githubEnabled?: boolean
}

const browserClients = new Map<string, SupabaseClient>()

function platformClient(config: RemoteConfig): SupabaseClient {
  if (typeof window === 'undefined') {
    return createClient(config.url, config.key, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    })
  }
  const identity = `${config.url}:${config.key}`
  const existing = browserClients.get(identity)
  if (existing) return existing
  const client = createClient(config.url, config.key, {
    auth: {
      flowType: 'pkce',
      detectSessionInUrl: true,
      persistSession: true,
      autoRefreshToken: true,
    },
  })
  browserClients.set(identity, client)
  return client
}

type MessageRow = {
  id: string
  target_id: string
  author_id: string | null
  author_name: string
  body: string
  created_at: string
  parent_id: string | null
  status: 'pending' | 'approved' | 'hidden'
}

// PostgREST limits each response; every list must read beyond that first page.
const pageSize = 500
async function readRows<T>(client: SupabaseClient, table: string, columns: string): Promise<T[]> {
  const rows: T[] = []
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await client
      .from(table)
      .select(columns)
      .order('id')
      .range(offset, offset + pageSize - 1)
    if (error) throw error
    rows.push(...(data as T[]))
    if (data.length < pageSize) return rows
  }
}

function rejectedSession(error: { name?: string; code?: string; status?: number }): boolean {
  return (
    error.name === 'AuthSessionMissingError' ||
    [
      'bad_jwt',
      'session_not_found',
      'user_not_found',
      'refresh_token_not_found',
      'refresh_token_already_used',
    ].includes(error.code || '') ||
    (error.name !== 'AuthRetryableFetchError' && (error.status === 401 || error.status === 403))
  )
}

const mediaPattern =
  /^\/media\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(png|jpg|webp|avif)$/
const mimeExtensions: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/avif': 'avif',
}

function failure(cause: unknown): Error {
  const error = cause as { message?: string; code?: string; status?: number }
  const translations: Record<string, string> = {
    invalid_credentials: '邮箱或密码不正确。',
    email_not_confirmed: '请先打开验证邮件确认邮箱，再登录。',
    user_already_exists: '这个邮箱已注册，请登录或找回密码。',
    weak_password: '密码强度不足，请使用至少 12 位的密码。',
    same_password: '新密码不能与原密码相同。',
    over_email_send_rate_limit: '邮件发送过于频繁，请稍后再试。',
    over_request_rate_limit: '操作过于频繁，请稍后再试。',
    otp_expired: '验证链接已经失效，请重新申请邮件。',
    flow_state_not_found: '验证链接无法在此浏览器完成，请回到申请邮件的浏览器重试。',
    '42501': '当前账号没有执行此操作的权限。',
    '23505': '这条记录已经存在，请刷新后重试。',
  }
  if (error.code && translations[error.code]) return new Error(translations[error.code])
  if (/fetch|network/i.test(error.message || ''))
    return new Error('暂时无法连接服务。请检查网络后重试，未提交的文字仍保留在页面中。')
  return new Error(error.message || '服务暂时不可用，请稍后重试。')
}

function internalReturn(value: string): string {
  if (!value.startsWith('/') || value.startsWith('//') || /[\\\s#]/.test(value)) return '/account'
  return value
}

function callbackUrl(path: string): string {
  return new URL(path, window.location.origin).href
}

async function signedDraft(
  client: SupabaseClient,
  entry: Entry,
  previews: Map<string, string>,
): Promise<Entry> {
  const sign = async (source: string) => {
    if (!mediaPattern.test(source)) return source
    const { data, error } = await client.storage
      .from('media')
      .createSignedUrl(source.slice('/media/'.length), 3600)
    if (error) throw error
    previews.set(data.signedUrl, source)
    return data.signedUrl
  }
  const photos = await Promise.all(
    entry.photos.map(async (photo) => ({
      ...photo,
      src: await sign(photo.src),
      storagePath: photo.src,
    })),
  )
  const coverPhoto = entry.photos.findIndex((photo) => photo.src === entry.cover)
  return {
    ...entry,
    photos,
    cover: coverPhoto >= 0 ? photos[coverPhoto].src : await sign(entry.cover),
  }
}

/** Shared server data only. IndexedDB demo content is deliberately never consulted. */
export function useRemotePlatform(config: RemoteConfig, initial?: StoredState): Platform {
  const [client] = useState(() => platformClient(config))
  const [state, setState] = useState<StoredState>(() =>
    initial
      ? {
          ...initial,
          mode: 'empty',
          drafts: [],
          visitor: null,
          messages: initial.messages.filter((message) => message.status === 'approved'),
        }
      : emptyState(defaultSettings),
  )
  const [ready, setReady] = useState(Boolean(initial))
  const [authReady, setAuthReady] = useState(false)
  const [isOwner, setIsOwner] = useState(false)
  const [error, setError] = useState('')
  const [recoveryPending, setRecoveryPending] = useState(false)
  const generation = useRef(0)
  const previews = useRef(new Map<string, string>())
  const uploads = useRef(new Map<string, string>())
  const verifiedUserId = useRef<string | null>(null)

  const clearPrivateState = useCallback(() => {
    verifiedUserId.current = null
    previews.current.clear()
    uploads.current.clear()
    setRecoveryPending(false)
    setIsOwner(false)
    setState((previous) => ({
      ...previous,
      drafts: [],
      visitor: null,
      messages: previous.messages.filter((message) => message.status === 'approved'),
    }))
  }, [])

  const refresh = useCallback(async () => {
    const current = ++generation.current
    try {
      const userResult = await client.auth.getUser()
      if (current !== generation.current) return
      if (userResult.error) {
        if (rejectedSession(userResult.error)) clearPrivateState()
        if (userResult.error.name !== 'AuthSessionMissingError') throw userResult.error
      }
      const user = userResult.data.user
      if (!user || (verifiedUserId.current && verifiedUserId.current !== user.id))
        clearPrivateState()
      let owner = false
      let visitor: StoredState['visitor'] = null
      if (user) {
        const [ownerResult, profileResult] = await Promise.all([
          client.from('site_owners').select('user_id').eq('user_id', user.id).maybeSingle(),
          client.from('profiles').select('id,nickname').eq('id', user.id).maybeSingle(),
        ])
        if (current !== generation.current) return
        if (ownerResult.error) throw ownerResult.error
        if (!ownerResult.data) {
          // A successful owner lookup with no row confirms revoked permission.
          // A failed lookup, by contrast, must not unmount an active editor.
          setIsOwner(false)
          setState((previous) => (previous.drafts.length ? { ...previous, drafts: [] } : previous))
          previews.current.clear()
          uploads.current.clear()
        }
        if (profileResult.error) throw profileResult.error
        owner = Boolean(ownerResult.data)
        visitor = { id: user.id, nickname: profileResult.data?.nickname || '访客' }
      }
      const [entries, settingsResult, messages, draftRows] = await Promise.all([
        readRows<{ id: string; data: Entry }>(client, 'published_entries', 'id,data'),
        client.from('site_settings').select('data').eq('id', true).single(),
        readRows<MessageRow>(
          client,
          'messages',
          'id,target_id,author_id,author_name,body,created_at,parent_id,status',
        ),
        owner
          ? readRows<{ id: string; data: Entry }>(client, 'entry_drafts', 'id,data')
          : Promise.resolve([]),
      ])
      if (settingsResult.error) throw settingsResult.error
      const drafts = await Promise.all(
        draftRows.map((row) => signedDraft(client, row.data, previews.current)),
      )
      if (current !== generation.current) return
      const visibleMessages: Message[] = messages
        .map((message) => ({
          id: message.id,
          targetId: message.target_id,
          authorId: message.author_id || '',
          authorName: message.author_name,
          body: message.body,
          createdAt: message.created_at,
          parentId: message.parent_id,
          hidden: message.status === 'hidden',
          status: message.status,
        }))
        .sort(
          (left, right) =>
            left.createdAt.localeCompare(right.createdAt) || left.id.localeCompare(right.id),
        )
      verifiedUserId.current = user?.id || null
      setState({
        version: 1,
        mode: 'empty',
        deletedIds: [],
        entries: entries.map((row) => row.data),
        drafts,
        messages: visibleMessages,
        settings: settingsResult.data!.data,
        visitor,
      })
      setIsOwner(owner)
      setAuthReady(true)
      setReady(true)
      setError('')
    } catch (cause) {
      if (current !== generation.current) return
      const problem = failure(cause)
      setError(problem.message)
      // Keep the last verified identity and mounted editor during a transient
      // refresh failure. Server RLS remains authoritative for every write.
      setAuthReady(true)
      setReady(true)
      throw problem
    }
  }, [clearPrivateState, client])

  const cancelRefresh = useCallback(() => {
    generation.current++
  }, [])

  useEffect(() => {
    let live = true
    const { data } = client.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setRecoveryPending(true)
      if (event === 'SIGNED_OUT') {
        cancelRefresh()
        clearPrivateState()
      }
      // Supabase auth callbacks execute under its session lock. Refresh after releasing it.
      window.setTimeout(() => {
        if (live) void refresh().catch(() => {})
      }, 0)
    })
    const initialRefresh = window.setTimeout(() => {
      if (live) void refresh().catch(() => {})
    }, 0)
    const onFocus = () => {
      void refresh().catch(() => {})
    }
    window.addEventListener('focus', onFocus)
    return () => {
      live = false
      window.clearTimeout(initialRefresh)
      cancelRefresh()
      data.subscription.unsubscribe()
      window.removeEventListener('focus', onFocus)
    }
  }, [cancelRefresh, clearPrivateState, client, refresh])

  return useMemo<Platform>(() => {
    const requireOwner = () => {
      if (!authReady || !isOwner) throw new Error('请使用站主账号登录后再操作。')
    }
    const rpc = async (name: string, args: Record<string, unknown>) => {
      const result = await client.rpc(name, args)
      if (result.error) throw failure(result.error)
      await refresh()
    }
    const storeImage = async (src: string, storagePath?: string): Promise<string> => {
      if (!src) return ''
      if (mediaPattern.test(src)) return src
      if (storagePath && mediaPattern.test(storagePath)) return storagePath
      const previous = previews.current.get(src) || uploads.current.get(src)
      if (previous) return previous
      const dataUrl = /^data:(image\/(?:png|jpeg|webp|avif));base64,([a-z\d+/=\s]+)$/i.exec(src)
      if (!dataUrl) throw new Error('图片来源不受支持，请重新上传 PNG、JPG、WebP 或 AVIF 图片。')
      const bytes = Uint8Array.from(atob(dataUrl[2]), (character) => character.charCodeAt(0))
      if (bytes.length > 10 * 1024 * 1024) throw new Error('单张图片不能超过 10 MiB。')
      const mime = dataUrl[1].toLowerCase()
      const name = `${crypto.randomUUID()}.${mimeExtensions[mime]}`
      const result = await client.storage
        .from('media')
        .upload(name, bytes, { contentType: mime, upsert: false, cacheControl: '3600' })
      if (result.error) throw failure(result.error)
      const canonical = `/media/${name}`
      uploads.current.set(src, canonical)
      return canonical
    }
    const writeEntry = async (incoming: Entry, publish: boolean) => {
      requireOwner()
      const cleaned = saveDraft(
        state,
        [],
        structuredClone(incoming),
        new Date().toISOString(),
      ).drafts.find((entry) => entry.id === incoming.id)!
      if (cleaned.photos.length > 20) throw new Error('每篇内容最多添加 20 张图片。')
      if (publish) {
        if (cleaned.kind !== 'note' && !cleaned.title.trim()) throw new Error('请先填写标题。')
        if (cleaned.kind === 'note' && !cleaned.body.trim()) throw new Error('先写一点内容吧。')
        if (cleaned.kind === 'writing' && !cleaned.body.trim())
          throw new Error('请先写一点正文，再发布文章。')
        if (cleaned.kind === 'photo' && !cleaned.photos.length)
          throw new Error('请至少上传一张照片。')
        if (cleaned.kind === 'project' && !cleaned.body.trim() && !cleaned.destination.trim())
          throw new Error('请填写项目地址或项目介绍。')
      }
      if (cleaned.destination.trim() && !safeDestination(cleaned.destination))
        throw new Error('项目地址只支持 http、https 或本站页面地址。')
      const originalPhotos = cleaned.photos
      cleaned.photos = []
      // Serialize uploads to keep memory and storage request pressure bounded on mobile.
      for (const photo of originalPhotos) {
        const { storagePath, ...rest } = photo
        cleaned.photos.push({ ...rest, src: await storeImage(photo.src, storagePath) })
      }
      const coverPhoto = originalPhotos.findIndex((photo) => photo.src === cleaned.cover)
      cleaned.cover =
        coverPhoto >= 0 ? cleaned.photos[coverPhoto].src : await storeImage(cleaned.cover)
      cleaned.sample = false
      delete cleaned.artwork
      await rpc('save_entry', { entry: cleaned, publish })
    }
    const saveProfile = async (nickname: string) => {
      await rpc('save_profile', { nickname: nickname.trim() })
    }
    return {
      remote: true,
      ready,
      authReady,
      isOwner,
      error,
      state,
      entries: state.entries,
      drafts: state.drafts,
      refresh,
      setMode: async () => {
        throw new Error('公开网站不提供本机样例模式。')
      },
      saveDraft: (entry) => writeEntry(entry, false),
      publishEntry: (entry) => writeEntry(entry, true),
      unpublishEntry: async (id) => {
        requireOwner()
        await rpc('unpublish_entry', { entry_id: id })
      },
      deleteEntry: async (id) => {
        requireOwner()
        await rpc('delete_entry', { entry_id: id })
      },
      updateSettings: async (settings) => {
        requireOwner()
        await rpc('save_settings', { settings: updateSettings(state, settings).settings })
      },
      signIn: saveProfile,
      signOut: async () => {
        const result = await client.auth.signOut({ scope: 'local' })
        if (result.error) throw failure(result.error)
        await refresh()
      },
      addMessage: (targetId, body, parentId) =>
        rpc('add_message', { target_id: targetId, body, parent_id: parentId || null }),
      editMessage: (id, body) => rpc('edit_message', { message_id: id, body }),
      deleteMessage: (id) => rpc('delete_message', { message_id: id }),
      moderateMessage: async (id, hidden) => {
        requireOwner()
        await rpc('moderate_message', { message_id: id, status: hidden ? 'hidden' : 'approved' })
      },
      auth: {
        emailEnabled: config.emailEnabled !== false,
        githubEnabled: Boolean(config.githubEnabled),
        recoveryPending,
        login: async (email, password) => {
          const result = await client.auth.signInWithPassword({ email: email.trim(), password })
          if (result.error) throw failure(result.error)
          await refresh()
        },
        register: async (email, password, nickname) => {
          const result = await client.auth.signUp({
            email: email.trim(),
            password,
            options: {
              data: { nickname: nickname.trim() },
              emailRedirectTo: callbackUrl('/auth/callback'),
            },
          })
          if (result.error) throw failure(result.error)
          await refresh()
        },
        recover: async (email) => {
          const result = await client.auth.resetPasswordForEmail(email.trim(), {
            redirectTo: callbackUrl('/recover'),
          })
          if (result.error) throw failure(result.error)
        },
        updatePassword: async (password) => {
          if (!state.visitor) throw new Error('验证会话已失效，请重新申请找回邮件。')
          const result = await client.auth.updateUser({ password })
          if (result.error) throw failure(result.error)
          setRecoveryPending(false)
          await refresh()
        },
        signInWithGithub: async (destination) => {
          if (!config.githubEnabled) throw new Error('GitHub 登录暂未开放。')
          const result = await client.auth.signInWithOAuth({
            provider: 'github',
            options: {
              redirectTo: callbackUrl(
                `/auth/callback?return=${encodeURIComponent(internalReturn(destination))}`,
              ),
            },
          })
          if (result.error) throw failure(result.error)
        },
        saveProfile,
      },
    }
  }, [
    authReady,
    client,
    config.emailEnabled,
    config.githubEnabled,
    error,
    isOwner,
    ready,
    recoveryPending,
    refresh,
    state,
  ])
}
