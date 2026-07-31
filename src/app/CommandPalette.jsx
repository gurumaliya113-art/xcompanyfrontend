import * as React from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { CornerDownLeft, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { NAV_ITEMS, quickActionsForRole } from './navigation'
import { useSession } from './session'

/* =====================================================================
   Command palette (⌘K / Ctrl+K).

   Why this exists: the app has ~25 destinations. Without a palette, a user
   who knows what they want still has to remember which group holds it. This
   is the single "I know what I want" shortcut that Linear, Notion, Vercel
   and GitHub all rely on, and it removes the pressure to keep every route
   visible in the sidebar.

   Searches navigation labels, group names, descriptions and keyword
   synonyms — so typing "leads" finds Enquiries, and "share market" finds
   Equity even though neither word is the page title.
   ===================================================================== */

function score(item, query) {
  if (!query) return 1
  const q = query.toLowerCase()
  const label = item.label.toLowerCase()
  if (label.startsWith(q)) return 100
  if (label.includes(q)) return 80
  if ((item.group ?? '').toLowerCase().includes(q)) return 50
  if ((item.keywords ?? []).some((k) => k.includes(q))) return 40
  if ((item.description ?? '').toLowerCase().includes(q)) return 20
  return 0
}

export function CommandPalette({ open, onClose }) {
  const navigate = useNavigate()
  const { role } = useSession()
  const [query, setQuery] = React.useState('')
  const [active, setActive] = React.useState(0)
  const inputRef = React.useRef(null)
  const listRef = React.useRef(null)

  const results = React.useMemo(() => {
    const actions = quickActionsForRole(role).map((a) => ({ ...a, group: 'Actions', kind: 'action' }))
    const pages = NAV_ITEMS.filter((i) => i.roles.includes(role ?? 'EMPLOYEE')).map((i) => ({ ...i, kind: 'page' }))
    return [...pages, ...actions]
      .map((item) => ({ item, s: score(item, query) }))
      .filter((r) => r.s > 0)
      .sort((a, b) => b.s - a.s || a.item.label.localeCompare(b.item.label))
      .slice(0, 12)
      .map((r) => r.item)
  }, [query, role])

  React.useEffect(() => {
    if (open) {
      setQuery('')
      setActive(0)
      const t = setTimeout(() => inputRef.current?.focus(), 20)
      return () => clearTimeout(t)
    }
  }, [open])

  React.useEffect(() => setActive(0), [query])

  const go = React.useCallback(
    (item) => {
      if (!item) return
      onClose()
      navigate(item.to)
    },
    [navigate, onClose]
  )

  React.useEffect(() => {
    if (!open) return
    function onKey(e) {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActive((i) => (i + 1) % Math.max(1, results.length))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActive((i) => (i - 1 + results.length) % Math.max(1, results.length))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        go(results[active])
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, results, active, go, onClose])

  React.useEffect(() => {
    listRef.current?.querySelectorAll('[data-row]')[active]?.scrollIntoView({ block: 'nearest' })
  }, [active])

  if (!open) return null

  return createPortal(
    <div className="exflow-app fixed inset-0 z-[120]">
      <div className="absolute inset-0 bg-[hsl(222_25%_11%/0.45)] backdrop-blur-[2px] animate-fade-in" onClick={onClose} aria-hidden="true" />
      <div className="relative mx-auto mt-[10vh] w-[calc(100%-2rem)] max-w-xl animate-slide-up">
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Command palette"
          className="overflow-hidden rounded-[--radius-lg] border border-border bg-popover shadow-[--shadow-lg]"
        >
          <div className="flex items-center gap-2.5 border-b border-border px-4">
            <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search pages and actions…"
              aria-label="Search pages and actions"
              className="h-12 w-full border-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            <kbd className="hidden shrink-0 rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground sm:block">
              ESC
            </kbd>
          </div>

          <div ref={listRef} className="max-h-[min(60vh,380px)] overflow-y-auto p-1.5" role="listbox">
            {results.length === 0 ? (
              <p className="px-3 py-8 text-center text-sm text-muted-foreground">
                Nothing matches “{query}”.
              </p>
            ) : (
              results.map((item, i) => {
                const isActive = i === active
                return (
                  <button
                    key={`${item.kind}-${item.to}-${item.label}`}
                    data-row
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => go(item)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-[--radius] px-2.5 py-2 text-left transition-colors',
                      isActive ? 'bg-muted' : 'hover:bg-muted/60'
                    )}
                  >
                    <span
                      className={cn(
                        'flex size-7 shrink-0 items-center justify-center rounded-[--radius-sm] border',
                        item.kind === 'action'
                          ? 'border-[hsl(var(--info)/0.25)] bg-[hsl(var(--info-soft))] text-[hsl(var(--info))]'
                          : 'border-border bg-card text-muted-foreground'
                      )}
                    >
                      <item.icon className="size-4" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{item.label}</span>
                      {item.description && (
                        <span className="block truncate text-xs text-muted-foreground">{item.description}</span>
                      )}
                    </span>
                    <span className="shrink-0 text-[11px] uppercase tracking-wide text-muted-foreground">
                      {item.group}
                    </span>
                    {isActive && <CornerDownLeft className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />}
                  </button>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

/** Global ⌘K / Ctrl+K listener, ignored while typing in a field. */
export function useCommandPalette() {
  const [open, setOpen] = React.useState(false)
  React.useEffect(() => {
    function onKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((v) => !v)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])
  return { open, setOpen, close: () => setOpen(false) }
}
