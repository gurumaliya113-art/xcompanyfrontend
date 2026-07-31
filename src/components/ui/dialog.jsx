import * as React from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

/* Dialog / Sheet — hand-rolled so we add no new dependency.

   Handles what the old `alert()` / inline-div modals did not:
   - Escape to close, overlay click to close
   - Focus moves into the dialog and is trapped while open
   - Focus returns to the trigger on close
   - Body scroll lock (ref-counted, so nested dialogs behave)
   - role="dialog" aria-modal with a labelled title
*/

let lockCount = 0
function lockScroll() {
  if (lockCount === 0) {
    const width = window.innerWidth - document.documentElement.clientWidth
    document.body.style.overflow = 'hidden'
    if (width > 0) document.body.style.paddingRight = `${width}px`
  }
  lockCount += 1
}
function unlockScroll() {
  lockCount = Math.max(0, lockCount - 1)
  if (lockCount === 0) {
    document.body.style.overflow = ''
    document.body.style.paddingRight = ''
  }
}

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'

const SIZES = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-3xl',
  xl: 'max-w-5xl',
}

export function Dialog({
  open,
  onClose,
  title,
  description,
  size = 'md',
  variant = 'center', // 'center' | 'sheet'
  footer,
  children,
  className,
  closeOnOverlay = true,
}) {
  const panelRef = React.useRef(null)
  const restoreRef = React.useRef(null)
  const titleId = React.useId()
  const descId = React.useId()

  React.useEffect(() => {
    if (!open) return
    restoreRef.current = document.activeElement
    lockScroll()

    const panel = panelRef.current
    const first = panel?.querySelector(FOCUSABLE)
    ;(first ?? panel)?.focus()

    function onKeyDown(e) {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose?.()
        return
      }
      if (e.key !== 'Tab' || !panel) return
      const nodes = Array.from(panel.querySelectorAll(FOCUSABLE)).filter(
        (n) => n.offsetParent !== null
      )
      if (nodes.length === 0) return
      const firstNode = nodes[0]
      const lastNode = nodes[nodes.length - 1]
      if (e.shiftKey && document.activeElement === firstNode) {
        e.preventDefault()
        lastNode.focus()
      } else if (!e.shiftKey && document.activeElement === lastNode) {
        e.preventDefault()
        firstNode.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown, true)
    return () => {
      document.removeEventListener('keydown', onKeyDown, true)
      unlockScroll()
      const node = restoreRef.current
      if (node && typeof node.focus === 'function') node.focus()
    }
  }, [open, onClose])

  if (!open) return null

  const isSheet = variant === 'sheet'

  return createPortal(
    <div className="exflow-app fixed inset-0 z-[100] flex" role="presentation">
      <div
        className="absolute inset-0 bg-[hsl(222_25%_11%/0.45)] backdrop-blur-[2px] animate-fade-in"
        onClick={closeOnOverlay ? onClose : undefined}
        aria-hidden="true"
      />
      <div
        className={cn(
          'relative flex w-full',
          isSheet ? 'justify-end' : 'items-start justify-center overflow-y-auto p-4 sm:p-6'
        )}
      >
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? titleId : undefined}
          aria-describedby={description ? descId : undefined}
          tabIndex={-1}
          className={cn(
            'relative flex flex-col bg-card text-card-foreground shadow-[--shadow-lg] outline-none',
            isSheet
              ? 'h-full w-full max-w-lg animate-slide-in-right border-l border-border'
              : cn('my-auto w-full rounded-[--radius-lg] border border-border animate-slide-up', SIZES[size] ?? SIZES.md),
            className
          )}
        >
          {(title || description) && (
            <header className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
              <div className="min-w-0 space-y-1">
                {title && (
                  <h2 id={titleId} className="truncate text-base font-semibold tracking-tight">
                    {title}
                  </h2>
                )}
                {description && (
                  <p id={descId} className="text-sm text-muted-foreground">
                    {description}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="-mr-1.5 -mt-1 shrink-0 text-muted-foreground hover:bg-muted"
              >
                <X aria-hidden="true" />
                <span className="sr-only">Close</span>
              </Button>
            </header>
          )}

          <div className={cn('min-h-0 flex-1 px-5 py-4', isSheet && 'overflow-y-auto')}>{children}</div>

          {footer && (
            <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-border bg-muted/40 px-5 py-3">
              {footer}
            </footer>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}

/* ConfirmDialog — replaces every `confirm()` and `alert()` in the console.
   Destructive actions get the danger treatment and never auto-focus the
   confirm button, so nobody deletes a business by hitting Enter. */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  busy = false,
}) {
  return (
    <Dialog
      open={open}
      onClose={busy ? undefined : onClose}
      title={title}
      description={description}
      size="sm"
      closeOnOverlay={!busy}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={busy}>
            {cancelLabel}
          </Button>
          <Button
            variant={destructive ? 'destructive' : 'default'}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? 'Working…' : confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm text-muted-foreground">
        {destructive
          ? 'This cannot be undone. Related records may be removed as well.'
          : 'Please confirm you want to continue.'}
      </p>
    </Dialog>
  )
}
