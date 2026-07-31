import * as React from 'react'
import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'

/* Tabs — two flavours, one look.

   `Tabs` for local state (inside a page or dialog).
   `RouteTabs` for URL-driven sub-navigation, so a tab is linkable and the
   back button works. The legacy DCE dashboard held 10 tabs in React state,
   which meant you could never share a link to the Finance tab.
*/

export function Tabs({ tabs, value, onChange, className, size = 'md' }) {
  const listRef = React.useRef(null)

  function onKeyDown(e) {
    const keys = ['ArrowLeft', 'ArrowRight', 'Home', 'End']
    if (!keys.includes(e.key)) return
    e.preventDefault()
    const idx = tabs.findIndex((t) => t.value === value)
    let next = idx
    if (e.key === 'ArrowLeft') next = (idx - 1 + tabs.length) % tabs.length
    if (e.key === 'ArrowRight') next = (idx + 1) % tabs.length
    if (e.key === 'Home') next = 0
    if (e.key === 'End') next = tabs.length - 1
    onChange?.(tabs[next].value)
    listRef.current?.querySelectorAll('[role="tab"]')[next]?.focus()
  }

  return (
    <div
      ref={listRef}
      role="tablist"
      onKeyDown={onKeyDown}
      className={cn('flex items-center gap-1 overflow-x-auto border-b border-border', className)}
    >
      {tabs.map((tab) => {
        const active = tab.value === value
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange?.(tab.value)}
            className={cn(
              'relative -mb-px flex shrink-0 items-center gap-2 whitespace-nowrap border-b-2 font-medium transition-colors',
              size === 'sm' ? 'px-2.5 py-2 text-[13px]' : 'px-3 py-2.5 text-sm',
              active
                ? 'border-[hsl(var(--primary))] text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.icon && <tab.icon className="size-4" aria-hidden="true" />}
            {tab.label}
            {tab.count != null && (
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-[11px] tabular',
                  active ? 'bg-muted text-foreground' : 'bg-muted text-muted-foreground'
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

export function RouteTabs({ tabs, className }) {
  return (
    <nav className={cn('flex items-center gap-1 overflow-x-auto border-b border-border', className)} aria-label="Section">
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          className={({ isActive }) =>
            cn(
              '-mb-px flex shrink-0 items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors',
              isActive
                ? 'border-[hsl(var(--primary))] text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )
          }
        >
          {tab.icon && <tab.icon className="size-4" aria-hidden="true" />}
          {tab.label}
        </NavLink>
      ))}
    </nav>
  )
}
