import * as React from 'react'
import { Link } from 'react-router-dom'
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/states'

/* StatCard — the single KPI tile for the whole console.

   The legacy dashboard rendered stat cards as inline-styled divs with
   coloured icon chips (blue/purple/green/amber) and a hardcoded "+active team"
   caption that was not a real metric. Assets, Businesses and Money Pool each
   had a different card shape.

   Rules encoded here:
   - Label is small and quiet; the number is the hero.
   - Numbers are tabular so columns of cards align.
   - Delta is only rendered when there is a real comparison to show.
   - Colour is reserved for meaning (up/down), never decoration.
*/

export function StatCard({
  label,
  value,
  hint,
  delta,
  deltaLabel,
  icon: Icon,
  tone = 'default',
  to,
  loading = false,
  className,
}) {
  const dir = delta == null ? null : delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat'
  const DeltaIcon = dir === 'up' ? ArrowUpRight : dir === 'down' ? ArrowDownRight : Minus

  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-medium text-muted-foreground">{label}</p>
        {Icon && <Icon className="size-4 shrink-0 text-muted-foreground/70" aria-hidden="true" />}
      </div>

      {loading ? (
        <Skeleton className="mt-2.5 h-7 w-28" />
      ) : (
        <p
          className={cn(
            'mt-1.5 truncate text-2xl font-semibold tracking-tight tabular',
            tone === 'positive' && 'text-[hsl(var(--success))]',
            tone === 'negative' && 'text-[hsl(var(--destructive))]'
          )}
        >
          {value}
        </p>
      )}

      {(hint || dir) && (
        <div className="mt-2 flex items-center gap-2 text-xs">
          {dir && (
            <span
              className={cn(
                'inline-flex items-center gap-0.5 font-medium tabular',
                dir === 'up' && 'text-[hsl(var(--success))]',
                dir === 'down' && 'text-[hsl(var(--destructive))]',
                dir === 'flat' && 'text-muted-foreground'
              )}
            >
              <DeltaIcon className="size-3.5" aria-hidden="true" />
              {Math.abs(delta).toFixed(1)}%
            </span>
          )}
          {(deltaLabel || hint) && (
            <span className="truncate text-muted-foreground">{deltaLabel || hint}</span>
          )}
        </div>
      )}
    </>
  )

  const shell = cn(
    'rounded-[--radius-lg] border border-border bg-card p-4 shadow-[--shadow-xs] transition-colors',
    to && 'hover:border-[hsl(215_16%_82%)] hover:shadow-[--shadow-sm]',
    className
  )

  if (to) {
    return (
      <Link to={to} className={cn(shell, 'block focus-visible:outline-2')}>
        {body}
      </Link>
    )
  }
  return <div className={shell}>{body}</div>
}

/** Responsive grid for stat cards. Default 4-up on desktop, 2-up on tablet. */
export function StatGrid({ cols = 4, className, children }) {
  return (
    <div
      className={cn(
        'grid gap-4',
        cols === 2 && 'grid-cols-1 sm:grid-cols-2',
        cols === 3 && 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
        cols === 4 && 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-4',
        cols === 5 && 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
        className
      )}
    >
      {children}
    </div>
  )
}
