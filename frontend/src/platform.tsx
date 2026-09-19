import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import * as model from './model'
import { defaultSettings, sampleEntries } from './seed'
import { DurableStateStore, openStorage, storageError, type StateChange } from './storage'
import type { Entry, Platform, StoredState } from './types'

const PlatformContext = createContext<Platform | null>(null)

export function PlatformProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StoredState>(() => model.initialState(defaultSettings))
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')
  const storeRef = useRef<DurableStateStore | null>(null)

  useEffect(() => {
    let cancelled = false
    let opened: DurableStateStore | null = null
    const fallback = model.initialState(defaultSettings)
    void openStorage(fallback)
      .then(async (adapter) => {
        opened = new DurableStateStore(adapter, fallback)
        const restored = await opened.load()
        if (cancelled) {
          opened.close()
          return
        }
        storeRef.current = opened
        setState(restored)
        setReady(true)
      })
      .catch((cause: unknown) => {
        opened?.close()
        if (!cancelled) {
          setError(storageError(cause).message)
          setReady(true)
        }
      })
    return () => {
      cancelled = true
      storeRef.current = null
      opened?.close()
    }
  }, [])

  const commit = useCallback(async (change: StateChange): Promise<void> => {
    const store = storeRef.current
    if (!store) throw new Error('本机存储尚未就绪，当前修改未保存。请重新打开页面。')
    try {
      const next = await store.update(change)
      if (storeRef.current === store) {
        setState(next)
        setError('')
      }
    } catch (cause) {
      const failure = storageError(cause)
      if (storeRef.current === store) setError(failure.message)
      throw failure
    }
  }, [])

  const platform = useMemo<Platform>(() => {
    const writeEntry = (operation: typeof model.saveDraft, incoming: Entry) => {
      // Snapshot submitted fields before waiting for another in-flight IndexedDB write.
      const entry = structuredClone(incoming)
      return commit((current) => operation(current, sampleEntries, entry, new Date().toISOString()))
    }
    return {
      ready,
      error,
      state,
      entries: model.mergedEntries(state, sampleEntries),
      drafts: model.visibleDrafts(state),
      setMode: (mode) => commit((current) => ({ ...current, mode })),
      saveDraft: (entry) => writeEntry(model.saveDraft, entry),
      publishEntry: (entry) => writeEntry(model.publishEntry, entry),
      unpublishEntry: (id) =>
        commit((current) =>
          model.unpublishEntry(current, sampleEntries, id, new Date().toISOString()),
        ),
      deleteEntry: (id) => commit((current) => model.deleteEntry(current, id)),
      updateSettings: (settings) => {
        const submitted = { ...settings }
        return commit((current) => model.updateSettings(current, submitted))
      },
      signIn: (nickname) =>
        commit((current) => model.signIn(current, nickname, crypto.randomUUID())),
      signOut: () => commit((current) => ({ ...current, visitor: null })),
      addMessage: (targetId, body, parentId) =>
        commit((current) =>
          model.addMessage(
            current,
            sampleEntries,
            targetId,
            body,
            parentId,
            crypto.randomUUID(),
            new Date().toISOString(),
          ),
        ),
      editMessage: (id, body) =>
        commit((current) => model.editMessage(current, sampleEntries, id, body)),
      deleteMessage: (id) => commit((current) => model.deleteMessage(current, id)),
      moderateMessage: (id, hidden) =>
        commit((current) => model.moderateMessage(current, id, hidden)),
    }
  }, [commit, error, ready, state])

  return <PlatformContext.Provider value={platform}>{children}</PlatformContext.Provider>
}

export function usePlatform(): Platform {
  const platform = useContext(PlatformContext)
  if (!platform) throw new Error('usePlatform must be used inside PlatformProvider')
  return platform
}
