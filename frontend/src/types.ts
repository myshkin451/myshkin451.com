export type EntryKind = 'writing' | 'photo' | 'project'
export type Photo = {
  id: string
  src: string
  alt: string
  caption: string
  credit?: string
  /** Stable private-storage reference; src may temporarily be an owner-only signed preview. */
  storagePath?: string
}
export type Entry = {
  id: string
  kind: EntryKind
  title: string
  summary: string
  body: string
  topics: string[]
  cover: string
  photos: Photo[]
  destination: string
  status: 'draft' | 'published'
  createdAt: string
  updatedAt: string
  publishedAt: string
  featured: boolean
  discussion: boolean
  sample: boolean
  artwork?: 'color' | 'site'
}
export type Visitor = { id: string; nickname: string }
export type Message = {
  id: string
  targetId: string
  authorId: string
  authorName: string
  body: string
  createdAt: string
  parentId: string | null
  hidden: boolean
  status?: 'pending' | 'approved' | 'hidden'
}
export type Settings = { name: string; intro: string; about: string; homeView: 'grid' | 'list' }
export type StoredState = {
  version: 1
  mode: 'sample' | 'empty'
  entries: Entry[]
  drafts: Entry[]
  deletedIds: string[]
  messages: Message[]
  settings: Settings
  visitor: Visitor | null
}
export type Platform = {
  remote?: boolean
  isOwner?: boolean
  authReady?: boolean
  refresh?: () => Promise<void>
  auth?: {
    emailEnabled: boolean
    githubEnabled: boolean
    recoveryPending: boolean
    login: (email: string, password: string) => Promise<void>
    register: (email: string, password: string, nickname: string) => Promise<void>
    recover: (email: string) => Promise<void>
    updatePassword: (password: string) => Promise<void>
    signInWithGithub: (destination: string) => Promise<void>
    saveProfile: (nickname: string) => Promise<void>
  }
  ready: boolean
  error: string
  state: StoredState
  entries: Entry[]
  drafts: Entry[]
  setMode: (mode: StoredState['mode']) => Promise<void>
  saveDraft: (entry: Entry) => Promise<void>
  publishEntry: (entry: Entry) => Promise<void>
  unpublishEntry: (id: string) => Promise<void>
  deleteEntry: (id: string) => Promise<void>
  updateSettings: (settings: Settings) => Promise<void>
  signIn: (nickname: string) => Promise<void>
  signOut: () => Promise<void>
  addMessage: (targetId: string, body: string, parentId?: string) => Promise<void>
  editMessage: (id: string, body: string) => Promise<void>
  deleteMessage: (id: string) => Promise<void>
  moderateMessage: (id: string, hidden: boolean) => Promise<void>
}

export const kindLabels: Record<EntryKind, string> = {
  writing: '文章',
  photo: '影像',
  project: '项目',
}

export function newEntry(kind: EntryKind = 'writing'): Entry {
  const date = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    kind,
    title: '',
    summary: '',
    body: '',
    topics: [],
    cover: '',
    photos: [],
    destination: '',
    status: 'draft',
    createdAt: date,
    updatedAt: date,
    publishedAt: '',
    featured: false,
    discussion: true,
    sample: false,
  }
}

export function safeDestination(value: string): string {
  if (value.startsWith('#/')) return value
  try {
    const url = new URL(value)
    return ['https:', 'http:'].includes(url.protocol) ? url.href : ''
  } catch {
    return ''
  }
}

export function formatDate(value: string): string {
  if (!value) return ''
  const date = new Date(value)
  return Number.isNaN(date.valueOf())
    ? ''
    : new Intl.DateTimeFormat('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(date)
}
