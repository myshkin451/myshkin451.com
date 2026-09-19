import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import './confirm.css'

export type ConfirmOptions = {
  title: string
  description: string
  confirmLabel: string
  cancelLabel?: string
  danger?: boolean
}

type Confirm = (options: ConfirmOptions) => Promise<boolean>
type Request = ConfirmOptions & {
  resolve: (accepted: boolean) => void
  returnFocus: HTMLElement | null
}
const ConfirmContext = createContext<Confirm | null>(null)

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [request, setRequest] = useState<Request | null>(null)
  const pending = useRef<Request | null>(null)
  const dialog = useRef<HTMLDialogElement>(null)
  const cancelButton = useRef<HTMLButtonElement>(null)
  const titleId = useId()
  const descriptionId = useId()

  const confirm = useCallback<Confirm>(
    (options) =>
      new Promise<boolean>((resolve) => {
        // A second action cannot replace the decision that is already on screen.
        if (pending.current) {
          resolve(false)
          return
        }
        const next = {
          ...options,
          resolve,
          returnFocus:
            document.activeElement instanceof HTMLElement ? document.activeElement : null,
        }
        pending.current = next
        setRequest(next)
      }),
    [],
  )

  const settle = useCallback((accepted: boolean) => {
    const current = pending.current
    if (!current) return
    pending.current = null
    dialog.current?.close()
    setRequest(null)
    // Restore focus before resolving: an accepted action may navigate and unmount its trigger.
    if (current.returnFocus?.isConnected) current.returnFocus.focus()
    current.resolve(accepted)
  }, [])

  useEffect(() => {
    if (!request || !dialog.current) return
    if (!dialog.current.open) dialog.current.showModal()
    cancelButton.current?.focus()
  }, [request])

  useEffect(
    () => () => {
      const current = pending.current
      pending.current = null
      current?.resolve(false)
    },
    [],
  )

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <dialog
        ref={dialog}
        className="confirm-dialog"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        onCancel={(event) => {
          event.preventDefault()
          settle(false)
        }}
        onClose={() => {
          if (!dialog.current?.open) settle(false)
        }}
      >
        {request && (
          <>
            <h2 id={titleId}>{request.title}</h2>
            <p id={descriptionId}>{request.description}</p>
            <div className="confirm-actions">
              <button
                ref={cancelButton}
                type="button"
                className="button secondary"
                onClick={() => settle(false)}
              >
                {request.cancelLabel || '取消'}
              </button>
              <button
                type="button"
                className={`button ${request.danger ? 'danger' : ''}`}
                onClick={() => settle(true)}
              >
                {request.confirmLabel}
              </button>
            </div>
          </>
        )}
      </dialog>
    </ConfirmContext.Provider>
  )
}

export function useConfirm(): Confirm {
  const confirm = useContext(ConfirmContext)
  if (!confirm) throw new Error('useConfirm must be used inside ConfirmProvider')
  return confirm
}
