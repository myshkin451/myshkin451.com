import {
  noteLimit,
  safeDestination,
  type Entry,
  type Message,
  type Settings,
  type StoredState,
} from './types'

const messageLimit = 1000
const nicknameLimit = 30

export function initialState(settings: Settings): StoredState {
  return {
    version: 1,
    mode: 'empty',
    entries: [],
    drafts: [],
    deletedIds: [],
    messages: [],
    settings: { ...settings },
    visitor: null,
  }
}

export function restoreState(value: unknown): StoredState {
  if (!value || typeof value !== 'object')
    throw new Error('本机保存的数据无法读取，请保留浏览器数据并重新打开。')
  const state = value as Partial<StoredState>
  if (
    state.version !== 1 ||
    !['sample', 'empty'].includes(state.mode ?? '') ||
    !Array.isArray(state.entries) ||
    !Array.isArray(state.drafts) ||
    !Array.isArray(state.messages) ||
    !state.settings ||
    typeof state.settings.name !== 'string' ||
    typeof state.settings.intro !== 'string' ||
    typeof state.settings.about !== 'string' ||
    !['grid', 'list'].includes(state.settings.homeView) ||
    (state.visitor !== null &&
      (!state.visitor ||
        typeof state.visitor.id !== 'string' ||
        typeof state.visitor.nickname !== 'string')) ||
    (state.deletedIds !== undefined &&
      (!Array.isArray(state.deletedIds) ||
        state.deletedIds.some((id) => typeof id !== 'string'))) ||
    [...state.entries, ...state.drafts].some((entry) => !validEntryShape(entry)) ||
    state.messages.some((message) => !validMessageShape(message))
  ) {
    throw new Error('本机保存的数据格式不兼容，未覆盖原有内容。')
  }
  return structuredClone({ ...state, deletedIds: state.deletedIds ?? [] } as StoredState)
}

function validEntryShape(entry: Entry): boolean {
  return Boolean(
    entry &&
    ['writing', 'photo', 'project', 'note'].includes(entry.kind) &&
    ['draft', 'published'].includes(entry.status) &&
    [
      'id',
      'title',
      'summary',
      'body',
      'cover',
      'destination',
      'createdAt',
      'updatedAt',
      'publishedAt',
    ].every((field) => typeof entry[field as keyof Entry] === 'string') &&
    ['featured', 'discussion', 'sample'].every(
      (field) => typeof entry[field as keyof Entry] === 'boolean',
    ) &&
    Array.isArray(entry.topics) &&
    entry.topics.every((topic) => typeof topic === 'string') &&
    Array.isArray(entry.photos) &&
    entry.photos.every(
      (photo) =>
        photo &&
        ['id', 'src', 'alt', 'caption'].every(
          (field) => typeof photo[field as keyof typeof photo] === 'string',
        ) &&
        (photo.credit === undefined || typeof photo.credit === 'string'),
    ),
  )
}

function validMessageShape(message: Message): boolean {
  return Boolean(
    message &&
    ['id', 'targetId', 'authorId', 'authorName', 'body', 'createdAt'].every(
      (field) => typeof message[field as keyof Message] === 'string',
    ) &&
    (message.parentId === null || typeof message.parentId === 'string') &&
    typeof message.hidden === 'boolean',
  )
}

export function mergedEntries(state: StoredState, samples: Entry[]): Entry[] {
  const entries = new Map<string, Entry>()
  if (state.mode === 'sample') samples.forEach((entry) => entries.set(entry.id, entry))
  state.entries.forEach((entry) => {
    if (state.mode === 'sample' || !entry.sample) entries.set(entry.id, entry)
  })
  return [...entries.values()]
    .filter((entry) => !state.deletedIds.includes(entry.id))
    .sort((a, b) => (b.publishedAt || b.createdAt).localeCompare(a.publishedAt || a.createdAt))
}

export function visibleDrafts(state: StoredState): Entry[] {
  return state.drafts
    .filter((entry) => state.mode === 'sample' || !entry.sample)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

function previousEntry(state: StoredState, samples: Entry[], id: string): Entry | undefined {
  return state.entries.find((entry) => entry.id === id) ?? samples.find((entry) => entry.id === id)
}

function cleanEntry(state: StoredState, samples: Entry[], incoming: Entry, now: string): Entry {
  if (!validEntryShape(incoming) || !incoming.id.trim())
    throw new Error('内容格式不完整，请重新打开编辑器。')
  if (incoming.kind === 'note' && [...incoming.body].length > noteLimit)
    throw new Error('随记请控制在 5000 个字符以内。')
  const previous =
    previousEntry(state, samples, incoming.id) ??
    state.drafts.find((entry) => entry.id === incoming.id)
  const sample = samples.find((entry) => entry.id === incoming.id)
  return {
    ...structuredClone(incoming),
    sample: Boolean(sample || previous?.sample),
    createdAt: previous?.createdAt || incoming.createdAt || now,
    updatedAt: now,
    publishedAt: previous?.publishedAt || '',
    topics: [...new Set(incoming.topics.map((topic) => topic.trim()).filter(Boolean))],
    photos: incoming.photos.map((photo) => {
      const source = sample?.photos.find((item) => item.id === photo.id)
      return { ...photo, ...(source?.credit ? { credit: source.credit } : {}) }
    }),
  }
}

function upsert(entries: Entry[], entry: Entry): Entry[] {
  return [...entries.filter((item) => item.id !== entry.id), entry]
}

export function saveDraft(
  state: StoredState,
  samples: Entry[],
  entry: Entry,
  now: string,
): StoredState {
  const draft = { ...cleanEntry(state, samples, entry, now), status: 'draft' as const }
  return { ...state, drafts: upsert(state.drafts, draft) }
}

function safeImage(value: string): boolean {
  return (
    /^data:image\/(?:png|jpeg|webp|gif|avif);base64,[a-z\d+/=\s]+$/i.test(value) ||
    /^(?:\.\/|\/)?assets\/[a-z\d_.\-/]+$/i.test(value)
  )
}

export function publishEntry(
  state: StoredState,
  samples: Entry[],
  entry: Entry,
  now: string,
): StoredState {
  const published = cleanEntry(state, samples, entry, now)
  published.title = published.title.trim()
  published.summary = published.summary.trim()
  published.destination = published.destination.trim()
  if (published.kind !== 'note' && !published.title) throw new Error('请先填写标题。')
  if (published.kind === 'note' && !published.body.trim()) throw new Error('先写一点内容吧。')
  if (published.title.length > 150) throw new Error('标题请控制在 150 个字符以内。')
  if (published.kind === 'writing' && !published.body.trim())
    throw new Error('请先写一点正文，再发布文章。')
  if (published.kind === 'photo' && published.photos.length === 0)
    throw new Error('请至少上传一张照片。')
  if (published.cover && !safeImage(published.cover))
    throw new Error('封面图片无法保存，请重新上传。')
  if (published.photos.some((photo) => !safeImage(photo.src)))
    throw new Error('有一张图片无法保存，请重新上传。')
  if (published.destination) {
    const destination = safeDestination(published.destination)
    if (!destination) throw new Error('项目地址只支持 http、https 或本站页面地址。')
    published.destination = destination
  }
  if (published.kind === 'project' && !published.destination && !published.body.trim()) {
    throw new Error('请填写项目地址或项目介绍。')
  }
  published.status = 'published'
  published.publishedAt ||= now
  return {
    ...state,
    entries: upsert(state.entries, published),
    drafts: state.drafts.filter((draft) => draft.id !== published.id),
    deletedIds: state.deletedIds.filter((id) => id !== published.id),
  }
}

export function unpublishEntry(
  state: StoredState,
  samples: Entry[],
  id: string,
  now: string,
): StoredState {
  const entry = previousEntry(state, samples, id)
  if (!entry) throw new Error('这条内容已经不存在。')
  const draft = state.drafts.find((item) => item.id === id) ?? entry
  return {
    ...state,
    entries: state.entries.filter((item) => item.id !== id),
    drafts: upsert(state.drafts, { ...structuredClone(draft), status: 'draft', updatedAt: now }),
    deletedIds: [...new Set([...state.deletedIds, id])],
  }
}

export function deleteEntry(state: StoredState, id: string): StoredState {
  return {
    ...state,
    entries: state.entries.filter((item) => item.id !== id),
    drafts: state.drafts.filter((item) => item.id !== id),
    messages: state.messages.filter((message) => message.targetId !== id),
    deletedIds: [...new Set([...state.deletedIds, id])],
  }
}

export function updateSettings(state: StoredState, settings: Settings): StoredState {
  const name = settings.name.trim()
  if (!name) throw new Error('请填写网站名称。')
  if (name.length > 60) throw new Error('网站名称请控制在 60 个字符以内。')
  if (!['grid', 'list'].includes(settings.homeView)) throw new Error('请选择首页的展示方式。')
  return { ...state, settings: { ...settings, name } }
}

export function signIn(state: StoredState, nickname: string, id: string): StoredState {
  const name = nickname.trim().replace(/\s+/g, ' ')
  if (!name) throw new Error('请填写昵称。')
  if (name.length > nicknameLimit) throw new Error('昵称请控制在 30 个字符以内。')
  const visitor = { id: state.visitor?.id || id, nickname: name }
  return {
    ...state,
    visitor,
    messages: state.messages.map((message) =>
      message.authorId === visitor.id ? { ...message, authorName: name } : message,
    ),
  }
}

function messageBody(value: string): string {
  const body = value.trim()
  if (!body) throw new Error('请先写一点内容。')
  if (body.length > messageLimit) throw new Error('留言请控制在 1000 个字符以内。')
  return body
}

function requireDiscussion(state: StoredState, samples: Entry[], targetId: string): void {
  if (targetId === 'guestbook') return
  const target = mergedEntries(state, samples).find((entry) => entry.id === targetId)
  if (!target || target.status !== 'published') throw new Error('这条内容尚未公开，无法留言。')
  if (!target.discussion) throw new Error('这条内容的留言已关闭。')
}

export function addMessage(
  state: StoredState,
  samples: Entry[],
  targetId: string,
  body: string,
  parentId: string | undefined,
  id: string,
  now: string,
): StoredState {
  if (!state.visitor) throw new Error('请先选择一个访客昵称。')
  requireDiscussion(state, samples, targetId)
  if (parentId) {
    const parent = state.messages.find((message) => message.id === parentId)
    if (!parent || parent.targetId !== targetId || parent.hidden)
      throw new Error('这条留言暂时不能回复。')
  }
  const message: Message = {
    id,
    targetId,
    authorId: state.visitor.id,
    authorName: state.visitor.nickname,
    body: messageBody(body),
    createdAt: now,
    parentId: parentId || null,
    hidden: false,
  }
  return { ...state, messages: [...state.messages, message] }
}

function ownMessage(state: StoredState, id: string): Message {
  const message = state.messages.find((item) => item.id === id)
  if (!message) throw new Error('这条留言已经不存在。')
  if (!state.visitor || message.authorId !== state.visitor.id)
    throw new Error('只能修改或删除自己留下的内容。')
  return message
}

export function editMessage(
  state: StoredState,
  samples: Entry[],
  id: string,
  body: string,
): StoredState {
  const message = ownMessage(state, id)
  requireDiscussion(state, samples, message.targetId)
  const nextBody = messageBody(body)
  return {
    ...state,
    messages: state.messages.map((item) => (item.id === id ? { ...item, body: nextBody } : item)),
  }
}

export function deleteMessage(state: StoredState, id: string): StoredState {
  ownMessage(state, id)
  const hasReplies = state.messages.some((message) => message.parentId === id)
  return {
    ...state,
    messages: hasReplies
      ? state.messages.map((message) =>
          message.id === id
            ? { ...message, body: '这条留言已被作者删除。', authorId: '', authorName: '已删除' }
            : message,
        )
      : state.messages.filter((message) => message.id !== id),
  }
}

export function moderateMessage(state: StoredState, id: string, hidden: boolean): StoredState {
  if (!state.messages.some((message) => message.id === id)) throw new Error('这条留言已经不存在。')
  return {
    ...state,
    messages: state.messages.map((message) =>
      message.id === id ? { ...message, hidden } : message,
    ),
  }
}
