import * as React from 'react'
import { Building2, Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { businesses as businessApi } from '@/lib/api'
import { useLocalState } from '@/lib/useQuery'

/* =====================================================================
   Workspace context — "which business am I looking at?"

   Before: DceSimple, DceDashboard and pm.html each loaded the business list
   themselves and each kept its own selection in component state. Switching
   business in one screen and navigating to another reset you to the first
   business in the list, which made cross-checking a venture's numbers
   genuinely painful.

   Now the selection lives once, persists across reloads, and every
   business-scoped page reads it. The picker sits in the page header of those
   pages, in the same position every time.
   ===================================================================== */

const WorkspaceContext = React.createContext(null)

export function WorkspaceProvider({ children }) {
  const [list, setList] = React.useState([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState(null)
  const [selectedId, setSelectedId] = useLocalState('exflow.business', null)

  const load = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const rows = await businessApi.listBasic()
      setList(rows)
    } catch (e) {
      setError(e)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    load()
  }, [load])

  // Keep the selection valid: fall back to the first business if the stored
  // id no longer exists (deleted, or a different environment).
  React.useEffect(() => {
    if (list.length === 0) return
    const stillValid = list.some((b) => String(b.id) === String(selectedId))
    if (!stillValid) setSelectedId(list[0].id)
  }, [list, selectedId, setSelectedId])

  const business = React.useMemo(
    () => list.find((b) => String(b.id) === String(selectedId)) ?? null,
    [list, selectedId]
  )

  const value = React.useMemo(
    () => ({ list, business, businessId: business?.id ?? null, loading, error, select: setSelectedId, refresh: load }),
    [list, business, loading, error, setSelectedId, load]
  )

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
}

export function useWorkspace() {
  const ctx = React.useContext(WorkspaceContext)
  if (!ctx) throw new Error('useWorkspace must be used inside <WorkspaceProvider>')
  return ctx
}

/* BusinessPicker — the standard control for switching business.
   Rendered in PageHeader actions on every business-scoped page. */
export function BusinessPicker({ className }) {
  const { list, business, select, loading } = useWorkspace()
  const [open, setOpen] = React.useState(false)
  const rootRef = React.useRef(null)

  React.useEffect(() => {
    if (!open) return
    function onDown(e) {
      if (!rootRef.current?.contains(e.target)) setOpen(false)
    }
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={loading || list.length === 0}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          'flex h-9 min-w-[190px] max-w-[280px] items-center gap-2 rounded-[--radius] border border-input bg-card px-2.5 text-sm shadow-[--shadow-xs] transition-colors',
          'hover:border-[hsl(215_16%_82%)] disabled:cursor-not-allowed disabled:opacity-60'
        )}
      >
        <Building2 className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate text-left font-medium">
          {loading ? 'Loading…' : (business?.name ?? 'No business')}
        </span>
        <ChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute right-0 z-50 mt-1 max-h-72 w-[280px] overflow-y-auto rounded-[--radius] border border-border bg-popover p-1 shadow-[--shadow-lg] animate-slide-up"
        >
          {list.map((b) => {
            const active = String(b.id) === String(business?.id)
            return (
              <button
                key={b.id}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => {
                  select(b.id)
                  setOpen(false)
                }}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-[--radius-sm] px-2.5 py-2 text-left text-sm transition-colors',
                  active ? 'bg-muted' : 'hover:bg-muted/60'
                )}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{b.name}</span>
                  {b.type && <span className="block truncate text-xs capitalize text-muted-foreground">{b.type}</span>}
                </span>
                {active && <Check className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
