import * as React from 'react'
import { cn } from '@/lib/utils'

/* Table primitives — semantic markup with a scroll container.
   The legacy panels wrote raw <table> with inline styles on every screen;
   column alignment and header casing differed each time. */

export function TableWrap({ className, children, ...props }) {
  return (
    <div
      className={cn('relative w-full overflow-x-auto overscroll-x-contain', className)}
      {...props}
    >
      {children}
    </div>
  )
}

export function Table({ className, ...props }) {
  return <table className={cn('w-full caption-bottom border-collapse text-sm', className)} {...props} />
}

export function THead({ className, ...props }) {
  return <thead className={cn('[&_tr]:border-b [&_tr]:border-border', className)} {...props} />
}

export function TBody({ className, ...props }) {
  return <tbody className={cn('[&_tr:last-child]:border-0', className)} {...props} />
}

export function TFoot({ className, ...props }) {
  return (
    <tfoot
      className={cn('border-t border-border bg-muted/50 font-medium [&_tr]:border-0', className)}
      {...props}
    />
  )
}

export function TR({ className, interactive = false, ...props }) {
  return (
    <tr
      className={cn(
        'border-b border-border transition-colors',
        interactive && 'cursor-pointer hover:bg-muted/60',
        className
      )}
      {...props}
    />
  )
}

/** align: 'left' | 'right' | 'center'. Numbers always go right + tabular. */
export function TH({ className, align = 'left', numeric = false, ...props }) {
  return (
    <th
      scope="col"
      className={cn(
        'h-9 px-3 text-xs font-medium uppercase tracking-wide text-muted-foreground whitespace-nowrap',
        align === 'right' || numeric ? 'text-right' : align === 'center' ? 'text-center' : 'text-left',
        className
      )}
      {...props}
    />
  )
}

export function TD({ className, align = 'left', numeric = false, ...props }) {
  return (
    <td
      className={cn(
        'px-3 py-2.5 align-middle',
        numeric && 'tabular',
        align === 'right' || numeric ? 'text-right' : align === 'center' ? 'text-center' : 'text-left',
        className
      )}
      {...props}
    />
  )
}
