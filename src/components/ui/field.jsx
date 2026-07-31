import * as React from 'react'
import { cn } from '@/lib/utils'
import { ChevronDown } from 'lucide-react'

/* Form controls.
   Native <select> and <textarea> on purpose: zero extra dependencies,
   free mobile pickers, and keyboard/screen-reader behaviour for free. */

const CONTROL =
  'flex w-full rounded-[--radius] border border-input bg-card px-3 text-sm text-foreground shadow-[--shadow-xs] transition-[border-color,box-shadow] ' +
  'placeholder:text-muted-foreground/70 ' +
  'hover:border-[hsl(215_16%_82%)] ' +
  'focus:border-[hsl(var(--ring))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring)/0.12)] ' +
  'disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground'

export const TextInput = React.forwardRef(function TextInput(
  { className, invalid = false, ...props },
  ref
) {
  return (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        CONTROL,
        'h-9',
        invalid && 'border-[hsl(var(--destructive))] focus:border-[hsl(var(--destructive))] focus:ring-[hsl(var(--destructive)/0.12)]',
        className
      )}
      {...props}
    />
  )
})

export const Textarea = React.forwardRef(function Textarea({ className, rows = 3, ...props }, ref) {
  return <textarea ref={ref} rows={rows} className={cn(CONTROL, 'min-h-[72px] resize-y py-2 leading-relaxed', className)} {...props} />
})

export const Select = React.forwardRef(function Select({ className, children, placeholder, ...props }, ref) {
  return (
    <div className="relative">
      <select
        ref={ref}
        className={cn(CONTROL, 'h-9 cursor-pointer appearance-none pr-9', className)}
        {...props}
      >
        {placeholder != null && <option value="">{placeholder}</option>}
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
    </div>
  )
})

/* Field — label + control + hint/error in one place.
   Every form in the app used a different label style; this ends that. */
export function Field({ label, hint, error, required = false, htmlFor, className, children }) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label htmlFor={htmlFor} className="block text-[13px] font-medium text-foreground">
          {label}
          {required && (
            <span className="ml-0.5 text-[hsl(var(--destructive))]" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-xs text-[hsl(var(--destructive))]">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  )
}

/** Responsive form grid. Wrap Fields in this instead of hand-rolling grids. */
export function FieldGrid({ cols = 2, className, children }) {
  return (
    <div
      className={cn(
        'grid gap-4',
        cols === 1 && 'grid-cols-1',
        cols === 2 && 'grid-cols-1 sm:grid-cols-2',
        cols === 3 && 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
        className
      )}
    >
      {children}
    </div>
  )
}

export function Checkbox({ className, label, id, ...props }) {
  return (
    <label htmlFor={id} className="inline-flex cursor-pointer select-none items-center gap-2 text-sm">
      <input
        id={id}
        type="checkbox"
        className={cn(
          'size-4 shrink-0 rounded-[4px] border-input text-[hsl(var(--primary))] accent-[hsl(var(--primary))] shadow-[--shadow-xs]',
          className
        )}
        {...props}
      />
      {label && <span>{label}</span>}
    </label>
  )
}
