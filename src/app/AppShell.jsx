import * as React from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { ExternalLink, LogOut, Menu, PanelLeftOpen, Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ActionMenu } from '@/components/ui/menu'
import { Sidebar } from './Sidebar'
import { CommandPalette, useCommandPalette } from './CommandPalette'
import { useSession } from './session'
import { findNavItem } from './navigation'
import { useLocalState } from '@/lib/useQuery'
import { initials } from '@/lib/format'

/* =====================================================================
   AppShell — the single frame every console screen renders inside.

   This is the structural fix for "pages don't feel connected". Previously
   each panel owned its own chrome: founder.html had a dark sidebar, pm.html
   had a card-based header, hr.html had no navigation at all, and the two DCE
   dashboards each had their own sticky top bar. Moving between them felt like
   moving between products, because it was.

   Now: one sidebar, one top bar, one content region, one scroll behaviour.
   Pages only render their <Page> content and inherit everything else.

   Layout contract:
   - Sidebar is fixed and independently scrollable; content never shifts it.
   - Only the content region scrolls, so headers and toolbars stay put.
   - Below lg the sidebar becomes an overlay drawer with a focus-visible close.
   ===================================================================== */

const SIDEBAR_W = 248
const SIDEBAR_W_COLLAPSED = 60

export default function AppShell() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, role, signOut } = useSession()
  const palette = useCommandPalette()
  const [collapsed, setCollapsed] = useLocalState('exflow.sidebar.collapsed', false)
  const [drawerOpen, setDrawerOpen] = React.useState(false)
  const activeItem = findNavItem(location.pathname)

  // Close the mobile drawer on navigation — otherwise it covers the page
  // the user just asked for.
  React.useEffect(() => {
    setDrawerOpen(false)
  }, [location.pathname])

  // Escape closes the drawer.
  React.useEffect(() => {
    if (!drawerOpen) return
    function onKey(e) {
      if (e.key === 'Escape') setDrawerOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [drawerOpen])

  // Content region scrolls to top on route change, matching every other SaaS.
  const scrollRef = React.useRef(null)
  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 })
  }, [location.pathname])

  async function handleSignOut() {
    await signOut()
    navigate('/admin-login', { replace: true })
  }

  const width = collapsed ? SIDEBAR_W_COLLAPSED : SIDEBAR_W

  return (
    <div className="exflow-app min-h-screen">
      {/* Skip link — keyboard users should not have to tab the whole nav. */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[130] focus:rounded-[--radius] focus:bg-card focus:px-3 focus:py-2 focus:text-sm focus:shadow-[--shadow-lg]"
      >
        Skip to content
      </a>

      {/* Desktop sidebar */}
      <aside
        className="fixed inset-y-0 left-0 z-40 hidden lg:block"
        style={{ width }}
        aria-label="Sidebar"
      >
        <Sidebar
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(true)}
          onOpenSearch={() => palette.setOpen(true)}
        />
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-[hsl(222_25%_11%/0.5)] animate-fade-in"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
          <div className="relative h-full w-[264px] animate-slide-in-right" style={{ animationName: 'exflow-fade-in' }}>
            <Sidebar collapsed={false} onOpenSearch={() => { setDrawerOpen(false); palette.setOpen(true) }} />
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="absolute -right-11 top-3 rounded-[--radius] bg-card p-2 text-foreground shadow-[--shadow-md]"
            >
              <X className="size-4" aria-hidden="true" />
              <span className="sr-only">Close navigation</span>
            </button>
          </div>
        </div>
      )}

      {/* Main column */}
      <div
        className="flex min-h-screen flex-col transition-[padding] duration-150"
        style={{ paddingLeft: 0 }}
      >
        <div className="lg:pl-[var(--sidebar-w)]" style={{ '--sidebar-w': `${width}px` }}>
          {/* Top bar: mobile nav toggle, current location, global actions.
              Deliberately thin — the page header carries the real title. */}
          <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-card/95 px-3 backdrop-blur supports-[backdrop-filter]:bg-card/80 sm:px-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open navigation"
            >
              <Menu aria-hidden="true" />
            </Button>

            {collapsed && (
              <Button
                variant="ghost"
                size="icon"
                className="hidden lg:inline-flex"
                onClick={() => setCollapsed(false)}
                aria-label="Expand sidebar"
              >
                <PanelLeftOpen aria-hidden="true" />
              </Button>
            )}

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {activeItem?.label ?? 'ExFlow'}
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => palette.setOpen(true)}
              className="hidden text-muted-foreground sm:inline-flex"
            >
              <Search aria-hidden="true" />
              Search
              <kbd className="ml-1 rounded border border-border px-1 text-[10px]">⌘K</kbd>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="sm:hidden"
              onClick={() => palette.setOpen(true)}
              aria-label="Search"
            >
              <Search aria-hidden="true" />
            </Button>

            <ActionMenu
              label="Account"
              items={[
                { label: 'Public website', icon: ExternalLink, onSelect: () => window.open('/', '_blank', 'noopener') },
                { separator: true },
                { label: 'Sign out', icon: LogOut, destructive: true, onSelect: handleSignOut },
              ]}
              trigger={
                <button
                  type="button"
                  className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-foreground transition-colors hover:bg-[hsl(214_20%_86%)]"
                >
                  {initials(user?.name)}
                  <span className="sr-only">Account menu — {role}</span>
                </button>
              }
            />
          </header>

          {/* Content */}
          <main
            id="main-content"
            ref={scrollRef}
            className="min-h-[calc(100vh-3.5rem)] bg-background"
          >
            <Outlet />
          </main>
        </div>
      </div>

      <CommandPalette open={palette.open} onClose={palette.close} />
    </div>
  )
}
