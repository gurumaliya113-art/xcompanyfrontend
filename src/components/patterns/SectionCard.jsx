import * as React from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

/* SectionCard — the container for every block of content below a PageHeader.

   One card definition means one border radius, one border colour, one header
   height and one padding scale across the app. Tables get `flush` so rows can
   run edge to edge; forms and charts keep the padding.
*/
export function SectionCard({
  title,
  description,
  actions,
  footer,
  flush = false,
  className,
  bodyClassName,
  children,
}) {
  const hasHeader = title || description || actions
  return (
    <section
      className={cn(
        'overflow-hidden rounded-[--radius-lg] border border-border bg-card shadow-[--shadow-xs]',
        className
      )}
    >
      {hasHeader && (
        <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-border px-4 py-3 sm:px-5">
          <div className="min-w-0">
            {title && <h2 className="truncate text-sm font-semibold tracking-tight">{title}</h2>}
            {description && <p className="mt-0.5 text-[13px] text-muted-foreground">{description}</p>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </header>
      )}

      <div className={cn(!flush && 'p-4 sm:p-5', bodyClassName)}>{children}</div>

      {footer && (
        <footer className="border-t border-border bg-muted/40 px-4 py-2.5 text-[13px] sm:px-5">{footer}</footer>
      )}
    </section>
  )
}

/** "View all →" link for section headers. Keeps the affordance identical everywhere. */
export function ViewAllLink({ to, children = 'View all' }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-1 rounded text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
    >
      {children}
      <ArrowRight className="size-3.5" aria-hidden="true" />
    </Link>
  )
}

/** Two-column layout: main content + sidebar rail. Used by dashboards and detail pages. */
export function SplitLayout({ main, aside, className }) {
  return (
    <div className={cn('grid gap-4 xl:grid-cols-3', className)}>
      <div className="space-y-4 xl:col-span-2">{main}</div>
      <div className="space-y-4">{aside}</div>
    </div>
  )
}

/** Definition list row — for detail panels (label left, value right). */
export function DetailRow({ label, children, className }) {
  return (
    <div className={cn('flex items-baseline justify-between gap-4 py-2', className)}>
      <dt className="shrink-0 text-[13px] text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-right text-sm font-medium tabular">{children ?? '—'}</dd>
    </div>
  )
}

export function DetailList({ className, children }) {
  return <dl className={cn('divide-y divide-border', className)}>{children}</dl>
}
