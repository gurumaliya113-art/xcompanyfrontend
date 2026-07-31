import * as React from 'react'
import { AlertTriangle, Inbox, Loader2, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { TableWrap, Table, THead, TBody, TR, TH, TD } from '@/components/ui/table'

/* Loading / Empty / Error — the three states every data view needs.

   The legacy screens handled these inconsistently: some showed nothing,
   some showed "Error loading employees" as raw HTML, most showed a blank
   card. Now all three are one component family with the same rhythm.
*/

export function Skeleton({ className }) {
  return <div className={cn('skeleton rounded-[--radius-sm]', className)} aria-hidden="true" />
}

export function Spinner({ className, label = 'Loading' }) {
  return (
    <>
      <Loader2 className={cn('size-4 animate-spin', className)} aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </>
  )
}

/** Skeleton rows that match a real table, so layout does not jump on load. */
export function TableSkeleton({ columns = 5, rows = 6 }) {
  return (
    <TableWrap>
      <Table>
        <THead>
          <TR>
            {Array.from({ length: columns }).map((_, i) => (
              <TH key={i}>
                <Skeleton className="h-3 w-16" />
              </TH>
            ))}
          </TR>
        </THead>
        <TBody>
          {Array.from({ length: rows }).map((_, r) => (
            <TR key={r}>
              {Array.from({ length: columns }).map((_, c) => (
                <TD key={c}>
                  <Skeleton className={cn('h-4', c === 0 ? 'w-40' : 'w-20')} />
                </TD>
              ))}
            </TR>
          ))}
        </TBody>
      </Table>
    </TableWrap>
  )
}

export function CardSkeleton({ count = 4, className }) {
  return (
    <div className={cn('grid gap-4 sm:grid-cols-2 xl:grid-cols-4', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-[--radius-lg] border border-border bg-card p-4">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-3 h-7 w-32" />
          <Skeleton className="mt-3 h-3 w-20" />
        </div>
      ))}
    </div>
  )
}

/** Empty state. Always offer the primary action that fills the void. */
export function EmptyState({ icon: Icon = Inbox, title, description, action, className, compact = false }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        compact ? 'gap-2 px-4 py-10' : 'gap-3 px-6 py-16',
        className
      )}
    >
      <div className="flex size-10 items-center justify-center rounded-full border border-border bg-muted text-muted-foreground">
        <Icon className="size-5" aria-hidden="true" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        {description && <p className="mx-auto max-w-sm text-sm text-muted-foreground">{description}</p>}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  )
}

/** Error state with a retry affordance. `error` may be an Error or a string. */
export function ErrorState({ error, onRetry, title = 'Could not load this data', className }) {
  const message = typeof error === 'string' ? error : error?.message
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 px-6 py-14 text-center', className)}>
      <div className="flex size-10 items-center justify-center rounded-full border border-[hsl(var(--destructive)/0.2)] bg-[hsl(var(--destructive-soft))] text-[hsl(var(--destructive))]">
        <AlertTriangle className="size-5" aria-hidden="true" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        {message && <p className="mx-auto max-w-md text-sm text-muted-foreground">{message}</p>}
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw aria-hidden="true" />
          Try again
        </Button>
      )}
    </div>
  )
}

/* AsyncView — the standard wrapper around a `useQuery` result.

   Usage keeps every data screen identical in behaviour:
     <AsyncView query={q} empty={{ title: 'No clients yet' }} skeleton="table">
       {(rows) => <ClientsTable rows={rows} />}
     </AsyncView>
*/
export function AsyncView({ query, children, empty, skeleton = 'table', skeletonProps }) {
  const { data, loading, error, refetch } = query

  if (loading && (data == null || (Array.isArray(data) && data.length === 0))) {
    if (skeleton === 'cards') return <CardSkeleton {...skeletonProps} />
    if (skeleton === 'none') return null
    return <TableSkeleton {...skeletonProps} />
  }
  if (error) return <ErrorState error={error} onRetry={refetch} />
  if (empty && Array.isArray(data) && data.length === 0) return <EmptyState {...empty} />
  return children(data)
}
