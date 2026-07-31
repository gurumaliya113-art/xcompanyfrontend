import * as React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { ChevronDown, PanelLeftClose, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { navForRole, findNavItem } from './navigation'
import { useSession } from './session'
import { useLocalState } from '@/lib/useQuery'
import { initials } from '@/lib/format'

/* =====================================================================
   Sidebar — grouped, collapsible, one level of nesting.

   The legacy sidebar listed 11 unrelated links in a flat column, mixing
   nouns (Businesses, Assets) with verbs (Add Business, Add Employee) and
   config (Pool OTP Config). There was no way to tell which items were
   related, and the label "Employees of The X Company" wrapped to two lines.

   Design decisions here:
   - Groups are the navigation; items inside are the destinations.
   - The group holding the current route auto-opens, others stay shut, so
     the list is short by default and never scrolls on a laptop.
   - Open/closed state persists per user.
   - Collapsed mode keeps icons only (Linear-style) for wide-table screens.
   - Active state is a filled row, not a coloured left bar, so it reads
     clearly at a glance without adding a second accent colour.
   ===================================================================== */

function SidebarItem({ item, collapsed, onNavigate }) {
  return (
    <NavLink
      to={item.to}
      onClick={onNavigate}
      title={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        cn(
          'group relative flex items-center gap-2.5 rounded-[--radius] text-[13px] font-medium transition-colors',
          collapsed ? 'h-9 w-9 justify-center' : 'px-2.5 py-[7px]',
          isActive
            ? 'bg-[hsl(var(--sidebar-active-bg))] text-[hsl(var(--sidebar-active))]'
            : 'text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-hover-bg))] hover:text-[hsl(var(--sidebar-active))]'
        )
      }
    >
      <item.icon className="size-4 shrink-0" aria-hidden="true" />
      {!collapsed && <span className="truncate">{item.label}</span>}
      {collapsed && <span className="sr-only">{item.label}</span>}
    </NavLink>
  )
}

function SidebarGroup({ group, collapsed, activeGroupId, openMap, setOpenMap, onNavigate }) {
  const isActiveGroup = group.id === activeGroupId
  // Persisted preference wins; otherwise the active group is open.
  const open = openMap[group.id] ?? isActiveGroup
  const single = group.items.length === 1

  // A group with one item is just that item — no disclosure needed.
  if (single || collapsed) {
    return (
      <div className={cn('space-y-0.5', !collapsed && 'px-2')}>
        {!collapsed && !single && (
          <p className="px-2.5 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-[hsl(var(--sidebar-heading))]">
            {group.label}
          </p>
        )}
        {group.items.map((item) => (
          <SidebarItem key={item.to} item={item} collapsed={collapsed} onNavigate={onNavigate} />
        ))}
      </div>
    )
  }

  return (
    <div className="px-2">
      <button
        type="button"
        onClick={() => setOpenMap((m) => ({ ...m, [group.id]: !open }))}
        aria-expanded={open}
        className={cn(
          'flex w-full items-center justify-between gap-2 rounded-[--radius] px-2.5 py-[7px] text-[11px] font-semibold uppercase tracking-wider transition-colors',
          isActiveGroup
            ? 'text-[hsl(var(--sidebar-active))]'
            : 'text-[hsl(var(--sidebar-heading))] hover:text-[hsl(var(--sidebar-foreground))]'
        )}
      >
        <span className="truncate">{group.label}</span>
        <ChevronDown
          className={cn('size-3.5 shrink-0 transition-transform duration-150', !open && '-rotate-90')}
          aria-hidden="true"
        />
      </button>
      {open && (
        <div className="mt-0.5 space-y-0.5">
          {group.items.map((item) => (
            <SidebarItem key={item.to} item={item} collapsed={collapsed} onNavigate={onNavigate} />
          ))}
        </div>
      )}
    </div>
  )
}

export function Sidebar({ collapsed, onToggleCollapse, onNavigate, onOpenSearch, className }) {
  const { role, user } = useSession()
  const location = useLocation()
  const groups = React.useMemo(() => navForRole(role), [role])
  const activeItem = findNavItem(location.pathname)
  const activeGroupId = activeItem?.groupId ?? null
  const [openMap, setOpenMap] = useLocalState('exflow.sidebar.groups', {})

  return (
    <div
      className={cn(
        'flex h-full flex-col bg-[hsl(var(--sidebar))] text-[hsl(var(--sidebar-foreground))]',
        className
      )}
    >
      {/* Brand */}
      <div
        className={cn(
          'flex h-14 shrink-0 items-center border-b border-[hsl(var(--sidebar-border))]',
          collapsed ? 'justify-center px-2' : 'gap-2.5 px-4'
        )}
      >
        <div className="flex size-7 shrink-0 items-center justify-center rounded-[--radius-sm] bg-white text-[13px] font-bold text-[hsl(216_24%_12%)]">
          X
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">ExFlow</p>
            <p className="truncate text-[11px] text-[hsl(var(--sidebar-heading))]">ExCompany</p>
          </div>
        )}
        {!collapsed && onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden rounded-[--radius-sm] p-1 text-[hsl(var(--sidebar-heading))] transition-colors hover:bg-[hsl(var(--sidebar-hover-bg))] hover:text-white lg:block"
          >
            <PanelLeftClose className="size-4" aria-hidden="true" />
            <span className="sr-only">Collapse sidebar</span>
          </button>
        )}
      </div>

      {/* Search trigger — opens the command palette. Keeps one entry point
          for "find anything" instead of a search box on every page. */}
      <div className={cn('shrink-0 pt-3', collapsed ? 'px-2' : 'px-4')}>
        <button
          type="button"
          onClick={onOpenSearch}
          className={cn(
            'flex w-full items-center gap-2 rounded-[--radius] border border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar-hover-bg))] text-[13px] text-[hsl(var(--sidebar-heading))] transition-colors hover:text-white',
            collapsed ? 'h-9 justify-center' : 'px-2.5 py-[7px]'
          )}
        >
          <Search className="size-4 shrink-0" aria-hidden="true" />
          {!collapsed && (
            <>
              <span className="flex-1 text-left">Search…</span>
              <kbd className="rounded border border-[hsl(var(--sidebar-border))] px-1.5 py-0.5 text-[10px] font-medium">
                ⌘K
              </kbd>
            </>
          )}
          {collapsed && <span className="sr-only">Search</span>}
        </button>
      </div>

      {/* Navigation */}
      <nav
        aria-label="Main"
        className={cn('sidebar-scroll min-h-0 flex-1 overflow-y-auto py-3', collapsed && 'px-1')}
      >
        <div className={cn('space-y-0.5', collapsed && 'flex flex-col items-center gap-0.5 space-y-0')}>
          {groups.map((group) => (
            <SidebarGroup
              key={group.id}
              group={group}
              collapsed={collapsed}
              activeGroupId={activeGroupId}
              openMap={openMap}
              setOpenMap={setOpenMap}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      </nav>

      {/* Identity */}
      <div
        className={cn(
          'shrink-0 border-t border-[hsl(var(--sidebar-border))] py-3',
          collapsed ? 'flex justify-center px-2' : 'px-4'
        )}
      >
        <div className={cn('flex items-center gap-2.5', collapsed && 'justify-center')}>
          <div
            className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--sidebar-active-bg))] text-[11px] font-semibold text-white"
            title={user?.name ?? ''}
          >
            {initials(user?.name)}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium text-white">{user?.name ?? 'Signed in'}</p>
              <p className="truncate text-[11px] capitalize text-[hsl(var(--sidebar-heading))]">
                {String(role ?? '').toLowerCase().replace('_', ' ')}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
