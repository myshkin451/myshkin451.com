import { describe, expect, it } from 'vitest'
import * as model from './model'
import { DurableStateStore, storageError, type StateAdapter } from './storage'
import type { Entry, Settings, StoredState } from './types'

const now = '2026-09-18T08:00:00.000Z'
const later = '2026-09-18T09:00:00.000Z'
const settings: Settings = { name: '测试网站', intro: '', about: '', homeView: 'grid' }
const entry = (changes: Partial<Entry> = {}): Entry => ({
  id: 'local-article',
  kind: 'writing',
  title: '文章',
  summary: '',
  body: '正文',
  topics: [],
  cover: '',
  photos: [],
  destination: '',
  status: 'draft',
  createdAt: now,
  updatedAt: now,
  publishedAt: '',
  featured: false,
  discussion: true,
  sample: false,
  ...changes,
})
const sample = entry({
  id: 'sample',
  title: '样文',
  status: 'published',
  sample: true,
  publishedAt: now,
})
const samples = [sample]
const empty = (): StoredState => ({ ...model.initialState(settings), mode: 'sample' })
const signed = (id = 'visitor-a'): StoredState => model.signIn(empty(), '访客 A', id)
const withArticle = (): StoredState => model.publishEntry(signed(), samples, entry(), now)

describe('drafts and publication', () => {
  it('saves partial work separately and publishes without changing the stable id', () => {
    const partial = entry({ title: '', body: '' })
    const draftState = model.saveDraft(empty(), samples, partial, now)
    expect(draftState.drafts[0].title).toBe('')
    expect(model.mergedEntries(draftState, samples).map((item) => item.id)).toEqual(['sample'])
    const published = model.publishEntry(draftState, samples, entry(), now)
    expect(published.drafts).toEqual([])
    expect(published.entries[0]).toMatchObject({
      id: partial.id,
      status: 'published',
      publishedAt: now,
    })
  })

  it('does not leak a saved edit into the published copy, even after reload', () => {
    const published = model.publishEntry(empty(), samples, entry(), now)
    const saved = model.saveDraft(
      published,
      samples,
      entry({ title: '未发布的修改', body: '新正文' }),
      later,
    )
    const restored = model.restoreState(structuredClone(saved))
    expect(
      model.mergedEntries(restored, samples).find((item) => item.id === 'local-article')?.title,
    ).toBe('文章')
    expect(restored.drafts[0].title).toBe('未发布的修改')
    const republished = model.publishEntry(restored, samples, restored.drafts[0], later)
    expect(republished.entries[0]).toMatchObject({
      title: '未发布的修改',
      publishedAt: now,
      updatedAt: later,
    })
    expect(republished.drafts).toEqual([])
  })

  it('unpublishes to an editable draft and keeps pending edits', () => {
    const published = model.publishEntry(empty(), samples, entry(), now)
    const saved = model.saveDraft(published, samples, entry({ body: '另存的修改' }), later)
    const unpublished = model.unpublishEntry(saved, samples, 'local-article', later)
    expect(
      model.mergedEntries(unpublished, samples).find((item) => item.id === 'local-article'),
    ).toBeUndefined()
    expect(unpublished.drafts[0].body).toBe('另存的修改')
    const restored = model.publishEntry(unpublished, samples, unpublished.drafts[0], later)
    expect(restored.entries[0].publishedAt).toBe(now)
    expect(restored.deletedIds).not.toContain('local-article')
  })

  it('hides sample entries and edits without removing locally created work', () => {
    let state = model.publishEntry(empty(), samples, entry(), now)
    state = model.publishEntry(
      state,
      samples,
      { ...sample, title: '修改的样文', sample: false },
      later,
    )
    state = model.saveDraft(state, samples, { ...sample, title: '样文草稿' }, later)
    const hidden: StoredState = { ...state, mode: 'empty' }
    expect(model.mergedEntries(hidden, samples).map((item) => item.id)).toEqual(['local-article'])
    expect(model.visibleDrafts(hidden)).toEqual([])
    expect(
      model
        .mergedEntries({ ...hidden, mode: 'sample' }, samples)
        .find((item) => item.id === 'sample')?.title,
    ).toBe('修改的样文')
    expect(hidden.drafts).toHaveLength(1)
  })

  it('keeps deleted or unpublished samples from resurfacing on reload or mode changes', () => {
    const removed = model.deleteEntry(empty(), 'sample')
    expect(model.mergedEntries(model.restoreState(removed), samples)).toEqual([])
    const unpublished = model.unpublishEntry(empty(), samples, 'sample', later)
    expect(model.mergedEntries(unpublished, samples)).toEqual([])
    expect(unpublished.drafts[0].sample).toBe(true)
  })

  it('keeps AI-image provenance when a sample is edited', () => {
    const photo = entry({
      id: 'sample-photo',
      kind: 'photo',
      sample: true,
      cover: './assets/sea.png',
      photos: [{ id: 'sea', src: './assets/sea.png', alt: '', caption: '', credit: 'AI 生成样例' }],
    })
    const changed = { ...photo, sample: false, photos: [{ ...photo.photos[0], credit: undefined }] }
    const published = model.publishEntry(empty(), [photo], changed, now)
    expect(published.entries[0].sample).toBe(true)
    expect(published.entries[0].photos[0].credit).toBe('AI 生成样例')
  })

  it('requires content appropriate to the published medium', () => {
    expect(() => model.publishEntry(empty(), [], entry({ title: '' }), now)).toThrow('标题')
    expect(() => model.publishEntry(empty(), [], entry({ body: '  ' }), now)).toThrow('正文')
    expect(() => model.publishEntry(empty(), [], entry({ kind: 'photo' }), now)).toThrow('照片')
    expect(() =>
      model.publishEntry(empty(), [], entry({ kind: 'project', body: '' }), now),
    ).toThrow('项目地址或项目介绍')
    expect(
      model.publishEntry(
        empty(),
        [],
        entry({ kind: 'project', body: '', destination: '#/play/color' }),
        now,
      ).entries,
    ).toHaveLength(1)
    expect(
      model.publishEntry(empty(), [], entry({ kind: 'project', body: '制作介绍' }), now).entries,
    ).toHaveLength(1)
  })

  it.each([
    'javascript:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'file:///private/secret',
    '//example.com',
  ])('rejects unsafe project destinations: %s', (destination) => {
    expect(() =>
      model.publishEntry(empty(), [], entry({ kind: 'project', destination }), now),
    ).toThrow('项目地址')
  })

  it('rejects nonpersistent or executable image sources', () => {
    expect(() =>
      model.publishEntry(empty(), [], entry({ cover: 'javascript:alert(1)' }), now),
    ).toThrow('封面')
    expect(() =>
      model.publishEntry(
        empty(),
        [],
        entry({
          kind: 'photo',
          photos: [{ id: '1', src: 'blob:temporary', alt: '', caption: '' }],
        }),
        now,
      ),
    ).toThrow('图片')
  })
})

describe('local demo visitor and discussion boundaries', () => {
  it('requires a visitor and a nonempty message no longer than 1000 characters', () => {
    expect(() =>
      model.addMessage(empty(), samples, 'guestbook', '你好', undefined, 'm1', now),
    ).toThrow('昵称')
    expect(() =>
      model.addMessage(signed(), samples, 'guestbook', ' ', undefined, 'm1', now),
    ).toThrow('内容')
    expect(() =>
      model.addMessage(signed(), samples, 'guestbook', '字'.repeat(1001), undefined, 'm1', now),
    ).toThrow('1000')
    expect(
      model.addMessage(signed(), samples, 'guestbook', '字'.repeat(1000), undefined, 'm1', now)
        .messages,
    ).toHaveLength(1)
  })

  it('only accepts replies in the same existing, visible discussion', () => {
    const state = model.addMessage(
      withArticle(),
      samples,
      'guestbook',
      '留言',
      undefined,
      'm1',
      now,
    )
    expect(() =>
      model.addMessage(state, samples, 'missing-entry', '回复', undefined, 'm2', now),
    ).toThrow('尚未公开')
    expect(() =>
      model.addMessage(state, samples, 'local-article', '回复', 'm1', 'm2', now),
    ).toThrow('不能回复')
    expect(() =>
      model.addMessage(state, samples, 'guestbook', '回复', 'missing', 'm2', now),
    ).toThrow('不能回复')
    const hidden = model.moderateMessage(state, 'm1', true)
    expect(() => model.addMessage(hidden, samples, 'guestbook', '回复', 'm1', 'm2', now)).toThrow(
      '不能回复',
    )
    const closed = model.publishEntry(state, samples, entry({ discussion: false }), later)
    expect(() =>
      model.addMessage(closed, samples, 'local-article', '留言', undefined, 'm2', now),
    ).toThrow('已关闭')
  })

  it('prevents edit/delete by another visitor, while moderation remains a separate preview operation', () => {
    const state = model.addMessage(signed(), samples, 'guestbook', 'A 的留言', undefined, 'm1', now)
    const other = model.signIn({ ...state, visitor: null }, '访客 B', 'visitor-b')
    expect(() => model.editMessage(other, samples, 'm1', '修改')).toThrow('自己')
    expect(() => model.deleteMessage(other, 'm1')).toThrow('自己')
    const moderated = model.moderateMessage(other, 'm1', true)
    expect(moderated.messages[0].hidden).toBe(true)
    const edited = model.editMessage(
      { ...moderated, visitor: state.visitor },
      samples,
      'm1',
      '作者修改',
    )
    expect(edited.messages[0]).toMatchObject({ body: '作者修改', hidden: true })
  })

  it('does not steal an old identity by reusing its nickname', () => {
    const state = model.addMessage(
      signed(),
      samples,
      'guestbook',
      '原身份留言',
      undefined,
      'm1',
      now,
    )
    const renamed = model.signIn(state, '改名', 'ignored-new-id')
    expect(renamed.visitor?.id).toBe('visitor-a')
    expect(renamed.messages[0].authorName).toBe('改名')
    const newIdentity = model.signIn({ ...renamed, visitor: null }, '改名', 'visitor-b')
    expect(() => model.deleteMessage(newIdentity, 'm1')).toThrow('自己')
  })

  it('removes own leaf messages and preserves another visitor’s reply to a deleted parent', () => {
    let state = model.addMessage(signed(), samples, 'guestbook', '原留言', undefined, 'm1', now)
    const originalVisitor = state.visitor
    state = model.signIn({ ...state, visitor: null }, '访客 B', 'visitor-b')
    state = model.addMessage(state, samples, 'guestbook', '别人的回复', 'm1', 'm2', later)
    state = model.deleteMessage({ ...state, visitor: originalVisitor }, 'm1')
    expect(state.messages).toHaveLength(2)
    expect(state.messages[0]).toMatchObject({
      authorId: '',
      authorName: '已删除',
      body: '这条留言已被作者删除。',
    })
    expect(state.messages[1]).toMatchObject({ body: '别人的回复', parentId: 'm1' })
    expect(() => model.editMessage(state, samples, 'm1', '恢复')).toThrow('自己')
    state = model.signIn({ ...state, visitor: null }, '访客 B', 'visitor-b')
    expect(model.deleteMessage(state, 'm2').messages).toHaveLength(1)
  })
})

describe('durable state writes', () => {
  it('waits for persistence, serializes concurrent operations, and preserves state after a failed write', async () => {
    let persisted = empty()
    let releaseFirst!: () => void
    const blocked = new Promise<void>((resolve) => {
      releaseFirst = resolve
    })
    let calls = 0
    const adapter: StateAdapter = {
      read: async () => structuredClone(persisted),
      update: async (change) => {
        calls += 1
        if (calls === 1) await blocked
        if (calls === 3) throw new DOMException('full', 'QuotaExceededError')
        persisted = structuredClone(change(structuredClone(persisted)))
        return persisted
      },
      close: () => undefined,
    }
    const store = new DurableStateStore(adapter, persisted)
    await store.load()
    const first = store.update((state) => model.saveDraft(state, [], entry({ id: 'one' }), now))
    const second = store.update((state) => model.saveDraft(state, [], entry({ id: 'two' }), now))
    await Promise.resolve()
    expect(calls).toBe(1)
    expect(store.snapshot.drafts).toHaveLength(0)
    releaseFirst()
    await Promise.all([first, second])
    expect(store.snapshot.drafts.map((item) => item.id)).toEqual(['one', 'two'])
    await expect(store.update((state) => model.deleteEntry(state, 'one'))).rejects.toThrow('full')
    expect(store.snapshot.drafts.map((item) => item.id)).toEqual(['one', 'two'])
    await store.update((state) => model.saveDraft(state, [], entry({ id: 'three' }), later))
    expect(store.snapshot.drafts).toHaveLength(3)
    expect(persisted.drafts).toHaveLength(3)
  })

  it('refuses to silently replace corrupt/unsupported data and explains quota errors', () => {
    expect(() => model.restoreState({ version: 2 })).toThrow('格式不兼容')
    expect(() => model.restoreState({ ...empty(), entries: [null] })).toThrow('格式不兼容')
    expect(model.restoreState({ ...empty(), deletedIds: undefined }).deletedIds).toEqual([])
    expect(storageError(new DOMException('full', 'QuotaExceededError')).message).toContain(
      '没有保存',
    )
  })
})
