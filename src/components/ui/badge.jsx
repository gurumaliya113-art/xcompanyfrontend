import * as React from 'react'
import { cn } from '@/lib/utils'

/* Badge — one component for every status, tag and count in the console.
   Previously each screen invented its own coloured <span>. */

const TONES = {
  neutral: 'bg-muted text-muted-foreground border-border',
  solid: 'bg-primary text-primary-foreground border-transparent',
  success: 'bg-[hsl(var(--success-soft))] text-[hsl(var(--success))] border-[hsl(var(--success)/0.2)]',
  warning: 'bg-[hsl(var(--warning-soft))] text-[hsl(var(--warning))] border-[hsl(var(--warning)/0.2)]',
  danger: 'bg-[hsl(var(--destructive-soft))] text-[hsl(var(--destructive))] border-[hsl(var(--destructive)/0.2)]',
  info: 'bg-[hsl(var(--info-soft))] text-[hsl(var(--info))] border-[hsl(var(--info)/0.2)]',
}

const SIZES = {
  sm: 'h-5 px-1.5 text-[11px]',
  md: 'h-6 px-2 text-xs',
}

export function Badge({ tone = 'neutral', size = 'md', dot = false, className, children, ...props }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full border font-medium leading-none whitespace-nowrap',
        TONES[tone] ?? TONES.neutral,
        SIZES[size] ?? SIZES.md,
        className
      )}
      {...props}
    >
      {dot && <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />}
      {children}
    </span>
  )
}

/* StatusBadge — maps the domain's status strings to a tone so the same
   status always looks the same, wherever it appears.
   Keys come straight from the existing data: tasks.status, dce_documents.status,
   share_buy_requests.status, dce_financial_decisions.stage, assets.condition. */
const STATUS_TONE = {
  // tasks
  OPEN: 'info',
  ACCEPTED: 'warning',
  COMPLETED: 'success',
  // approvals
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'danger',
  // documents
  Signed: 'success',
  'Awaiting signature': 'warning',
  Draft: 'neutral',
  Expired: 'danger',
  // decision stages
  Proposed: 'neutral',
  'Under review': 'warning',
  'Board Approved': 'success',
  // spend status
  Paid: 'success',
  Unpaid: 'danger',
  // asset condition
  Excellent: 'success',
  Good: 'info',
  Fair: 'warning',
  // confidentiality
  Public: 'neutral',
  Restricted: 'info',
  Confidential: 'warning',
  Privileged: 'danger',
  // generic
  ACTIVE: 'success',
  INACTIVE: 'neutral',
  PROFIT: 'success',
  LOSS: 'danger',
}

export function StatusBadge({ status, className, ...props }) {
  if (status == null || status === '') return <span className="text-muted-foreground">—</span>
  const key = String(status)
  const tone = STATUS_TONE[key] ?? STATUS_TONE[key.toUpperCase()] ?? 'neutral'
  return (
    <Badge tone={tone} dot className={className} {...props}>
      {key}
    </Badge>
  )
}
