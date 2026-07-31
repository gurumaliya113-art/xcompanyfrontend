import * as React from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TextInput, Select } from '@/components/ui/field'

/* Page layout primitives.

   Problem this solves: every screen invented its own header. `founder.html`
   set `title.innerText` plus an optional subtitle; `pm.html` used an <h1> in a
   card; the DCE dashboards used a sticky bar; the React marketing pages used
   yet another. Titles sat at four different sizes and the primary action was
   sometimes top-right, sometimes at the bottom of a form.

   One <Page> shell fixes hierarchy everywhere:
     Breadcrumb → Title + description → Primary action → Tabs → Toolbar → Content
*/

export function Page({ children, className }) {
  return <div className={cn('flex min-h-full flex-col animate-fade-in', className)}>{children}</div>
}

export function Breadcrumbs({ items = [] }) {
  if (items.length === 0) return null
  return (
    <nav aria-label="Breadcrumb" className="mb-2">
      <ol className="flex items-center gap-1 text-[13px] text-muted-foreground">
        {items.map((item, i) => {
          const last = i === items.length - 1
          return (
            <li key={`${item.label}-${i}`} className="flex items-center gap-1">
              {item.to && !last ? (
                <Link to={item.to} className="rounded px-0.5 hover:text-foreground hover:underline">
                  {item.label}
                </Link>
              ) : (
                <span className={cn(last && 'font-medium text-foreground')} aria-current={last ? 'page' : undefined}>
                  {item.label}
                </span>
              )}
              {!last && <ChevronRight className="size-3.5 shrink-0 opacity-60" aria-hidden="true" />}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

/**
 * PageHeader
 * @param title       string — the one thing this page is about
 * @param description one short line; skip it if the title is self-evident
 * @param actions     primary action on the right (max 1 primary + 1 secondary)
 * @param breadcrumbs array of { label, to }
 * @param meta        small badges/stats shown under the title
 */
export function PageHeader({ title, description, actions, breadcrumbs, meta, className, children }) {
  return (
    <header className={cn('border-b border-border bg-card px-4 pb-4 pt-4 sm:px-6', className)}>
      <Breadcrumbs items={breadcrumbs} />
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-semibold tracking-tight text-foreground">{title}</h1>
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
          {meta && <div className="mt-2 flex flex-wrap items-center gap-2">{meta}</div>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {children && <div className="mt-4 -mb-4">{children}</div>}
    </header>
  )
}

/** Scrollable content region. `width="narrow"` for forms and settings. */
export function PageBody({ children, className, width = 'full', padded = true }) {
  return (
    <div className={cn('flex-1', padded && 'px-4 py-5 sm:px-6')}>
      <div className={cn(width === 'narrow' ? 'mx-auto max-w-3xl' : 'mx-auto max-w-[1600px]', className)}>
        {children}
      </div>
    </div>
  )
}

/* Toolbar — search + filters on the left, view actions on the right.
   Standard position for every list screen so users stop hunting for search. */
export function Toolbar({ children, className }) {
  return (
    <div
      className={cn(
        'mb-4 flex flex-wrap items-center gap-2',
        className
      )}
    >
      {children}
    </div>
  )
}

export function SearchInput({ value, onChange, placeholder = 'Search…', className, autoFocus }) {
  return (
    <div className={cn('relative min-w-0 flex-1 sm:max-w-xs', className)}>
      <Search
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <TextInput
        type="search"
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="pl-9 pr-8 [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
        >
          <X className="size-3.5" aria-hidden="true" />
          <span className="sr-only">Clear search</span>
        </button>
      )}
    </div>
  )
}

/** Compact labelled select for toolbars. */
export function FilterSelect({ label, value, onChange, options, className }) {
  return (
    <label className={cn('flex items-center gap-2 text-[13px] text-muted-foreground', className)}>
      <span className="hidden shrink-0 sm:inline">{label}</span>
      <Select value={value} onChange={(e) => onChange(e.target.value)} aria-label={label} className="h-9 w-auto min-w-[130px]">
        {options.map((o) => (
          <option key={String(o.value)} value={o.value}>
            {o.label}
          </option>
        ))}
      </Select>
    </label>
  )
}

/** Pushes the following toolbar children to the right edge. */
export function ToolbarSpacer() {
  return <div className="flex-1" aria-hidden="true" />
}
