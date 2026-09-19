import { restoreState } from './model'
import type { StoredState } from './types'

export type StateChange = (current: StoredState) => StoredState
export type StateAdapter = {
  read: () => Promise<StoredState | undefined>
  update: (change: StateChange) => Promise<StoredState>
  close: () => void
}

export function storageError(cause: unknown): Error {
  const name = cause && typeof cause === 'object' && 'name' in cause ? cause.name : ''
  if (name === 'QuotaExceededError') {
    return new Error('浏览器的本机存储空间不足。本次修改没有保存，请减少图片大小后重试。')
  }
  if (name === 'SecurityError') {
    return new Error('浏览器禁止了本机存储，请允许此网站保存数据后重新打开。')
  }
  if (
    cause instanceof Error &&
    !['UnknownError', 'InvalidStateError', 'AbortError'].includes(cause.name)
  )
    return cause
  return new Error('本机存储暂时无法使用。本次修改没有保存，请重新打开页面后再试。')
}

export async function openStorage(fallback: StoredState): Promise<StateAdapter> {
  if (typeof indexedDB === 'undefined')
    throw new Error('此浏览器无法保存本机数据，请换用支持 IndexedDB 的浏览器。')
  const database = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open('myshkin451-frontend-v1', 1)
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains('platform'))
        request.result.createObjectStore('platform')
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(storageError(request.error))
    request.onblocked = () =>
      reject(new Error('另一页正在使用旧版本的本机数据，请关闭旧预览后重新打开。'))
  })
  database.onversionchange = () => database.close()

  function transact(change?: StateChange): Promise<StoredState | undefined> {
    return new Promise((resolve, reject) => {
      let next: StoredState | undefined
      let operationError: unknown
      let transaction: IDBTransaction
      try {
        transaction = database.transaction('platform', change ? 'readwrite' : 'readonly')
      } catch (error) {
        reject(storageError(error))
        return
      }
      const store = transaction.objectStore('platform')
      const request = store.get('current')
      request.onsuccess = () => {
        try {
          const stored = request.result === undefined ? undefined : restoreState(request.result)
          next = change ? change(stored ?? structuredClone(fallback)) : stored
          if (change) store.put(next, 'current')
        } catch (error) {
          operationError = error
          transaction.abort()
        }
      }
      request.onerror = () => {
        operationError = request.error
      }
      // Requests can succeed before a transaction fails (for example, on quota). Only
      // oncomplete is a durable success, so callers never show an unsaved optimistic state.
      transaction.oncomplete = () => resolve(next)
      transaction.onabort = () => reject(storageError(operationError ?? transaction.error))
      transaction.onerror = () => {
        operationError ??= transaction.error
      }
    })
  }

  return {
    read: () => transact(),
    update: async (change) => {
      const result = await transact(change)
      if (!result) throw new Error('本机数据未能完成保存。')
      return result
    },
    close: () => database.close(),
  }
}

export class DurableStateStore {
  private current: StoredState
  private queue: Promise<void> = Promise.resolve()

  constructor(
    private adapter: StateAdapter,
    fallback: StoredState,
  ) {
    this.current = structuredClone(fallback)
  }

  get snapshot(): StoredState {
    return this.current
  }

  async load(): Promise<StoredState> {
    this.current = (await this.adapter.read()) ?? this.current
    return this.current
  }

  update(change: StateChange): Promise<StoredState> {
    const operation = this.queue.then(async () => {
      const next = await this.adapter.update(change)
      this.current = next
      return next
    })
    // A failed write rejects its caller, but does not poison the next queued write.
    this.queue = operation.then(
      () => undefined,
      () => undefined,
    )
    return operation
  }

  close(): void {
    this.adapter.close()
  }
}
