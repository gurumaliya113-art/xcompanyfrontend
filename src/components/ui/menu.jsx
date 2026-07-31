import * as React from 'react'
import { MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

/* ActionMenu — the row-level "…" menu used across every table.

   Replaces the legacy pattern of stacking three coloured buttons
   (Edit / Delete / Payslip) inside every row, which made tables noisy and
   pushed real data off-screen on mobile.

   Keyboard: Enter/Space opens, Escape closes, Arrow keys move, Tab exits.
*/
export function ActionMenu({ items, label = 'Actions', align = 'end', trigger, className }) {
  const [open, setOpen] = React.useState(false)
  const rootRef = React.useRef(null)
  const itemRefs = React.useRef([])

  const visible = React.useMemo(() => (items ?? []).filter((i) => i && !i.hidden), [items])

  React.useEffect(() => {
    if (!open) return
    function onDocDown(e) {
      if (!rootRef.current?.contains(e.target)) setOpen(false)
    }
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDocDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  React.useEffect(() => {
    if (open) itemRefs.current[0]?.focus()
  }, [open])

  function onListKeyDown(e) {
    if (!['ArrowDown', 'ArrowUp'].includes(e.key)) return
    e.preventDefault()
    const nodes = itemRefs.current.filter(Boolean)
    const idx = nodes.indexOf(document.activeElement)
    const next =
      e.key === 'ArrowDown' ? (idx + 1) % nodes.length : (idx - 1 + nodes.length) % nodes.length
    nodes[next]?.focus()
  }

  if (visible.length === 0) return null

  return (
    <div ref={rootRef} className={cn('relative inline-block text-left', className)}>
      {trigger ? (
        React.cloneElement(trigger, {
          onClick: () => setOpen((v) => !v),
          'aria-expanded': open,
          'aria-haspopup': 'menu',
        })
      ) : (
        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-muted-foreground hover:bg-muted"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-haspopup="menu"
        >
          <MoreHorizontal aria-hidden="true" />
          <span className="sr-only">{label}</span>
        </Button>
      )}

      {open && (
        <div
          role="menu"
          aria-label={label}
          onKeyDown={onListKeyDown}
          className={cn(
            'absolute z-50 mt-1 min-w-[180px] overflow-hidden rounded-[--radius] border border-border bg-popover p-1 shadow-[--shadow-lg] animate-slide-up',
            align === 'end' ? 'right-0' : 'left-0'
          )}
        >
          {visible.map((item, i) =>
            item.separator ? (
              <div key={`sep-${i}`} className="my-1 h-px bg-border" role="separator" />
            ) : (
              <button
                key={item.label}
                ref={(el) => (itemRefs.current[i] = el)}
                role="menuitem"
                type="button"
                disabled={item.disabled}
                onClick={() => {
                  setOpen(false)
                  item.onSelect?.()
                }}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-[--radius-sm] px-2.5 py-1.5 text-left text-sm transition-colors',
                  'hover:bg-muted focus:bg-muted focus:outline-none',
                  'disabled:pointer-events-none disabled:opacity-50',
                  item.destructive && 'text-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive-soft))]'
                )}
              >
                {item.icon && <item.icon className="size-4 shrink-0" aria-hidden="true" />}
                <span className="flex-1 truncate">{item.label}</span>
                {item.shortcut && (
                  <kbd className="text-[11px] text-muted-foreground tabular">{item.shortcut}</kbd>
                )}
              </button>
            )
          )}
        </div>
      )}
    </div>
  )
}
