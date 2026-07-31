/* =====================================================================
   Formatting helpers — single source of truth for the whole console.

   Before this file, INR formatting was duplicated in at least five places
   (`_fmtInr` in app.js, `formatINR` in backend/index.js, inline
   `toLocaleString` calls in pm.html and both DCE dashboards) and each one
   rounded differently. Everything now routes through here.
   ===================================================================== */

const INR = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

const INR_PRECISE = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const COMPACT = new Intl.NumberFormat('en-IN', {
  notation: 'compact',
  maximumFractionDigits: 1,
})

const NUM = new Intl.NumberFormat('en-IN')

/** Safe numeric coercion. Never returns NaN. */
export function num(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

/** ₹1,23,456 — the default for all money in the UI. */
export function money(value) {
  return INR.format(num(value))
}

/** ₹1,23,456.78 — only where paise matter (share price, payouts). */
export function moneyPrecise(value) {
  return INR_PRECISE.format(num(value))
}

/** ₹1.2L / ₹4.5Cr — for stat cards where space is tight. */
export function moneyCompact(value) {
  return `₹${COMPACT.format(num(value))}`
}

/** 1,23,456 */
export function number(value) {
  return NUM.format(num(value))
}

/** 12.5% — `digits` controls precision. */
export function percent(value, digits = 1) {
  const n = num(value)
  return `${n.toFixed(digits)}%`
}

/** Signed money for ledgers: +₹500 / −₹500 (true minus sign, not hyphen). */
export function signedMoney(value) {
  const n = num(value)
  if (n === 0) return money(0)
  return `${n > 0 ? '+' : '\u2212'}${money(Math.abs(n))}`
}

/** 12 Mar 2026 */
export function date(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

/** 12 Mar 2026, 4:30 pm */
export function dateTime(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  })
}

/** Mar 2026 — for month buckets (`reports.month` is 'YYYY-MM'). */
export function monthLabel(value) {
  if (!value) return '—'
  const d = value.length === 7 ? new Date(`${value}-01`) : new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
}

/** "3 days ago" / "in 2 days" — for activity feeds and deadlines. */
export function relativeTime(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  const diffMs = d.getTime() - Date.now()
  const abs = Math.abs(diffMs)
  const units = [
    ['year', 31536000000],
    ['month', 2592000000],
    ['week', 604800000],
    ['day', 86400000],
    ['hour', 3600000],
    ['minute', 60000],
  ]
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
  for (const [unit, ms] of units) {
    if (abs >= ms) return rtf.format(Math.round(diffMs / ms), unit)
  }
  return 'just now'
}

/** Today as 'YYYY-MM-DD' — for date input defaults. */
export function todayISO() {
  const d = new Date()
  const offset = d.getTimezoneOffset() * 60000
  return new Date(d.getTime() - offset).toISOString().slice(0, 10)
}

/** 'YYYY-MM-DD' → 'YYYY-MM'. Mirrors `_monthFromISODate` from the legacy code. */
export function monthFromISODate(value) {
  if (!value || typeof value !== 'string') return null
  const [y, m] = value.split('-')
  return y && m ? `${y}-${m}` : null
}

/** Whole months between a date and today, matching the legacy salary engine. */
export function monthsElapsed(startDateStr) {
  if (!startDateStr) return 0
  const start = new Date(startDateStr)
  if (Number.isNaN(start.getTime())) return 0
  const now = new Date()
  let months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth())
  if (now.getDate() < start.getDate()) months -= 1
  return Math.max(0, months)
}

/** Days between a date and now, floored. Used by investor interest. */
export function daysSince(value) {
  if (!value) return 0
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return 0
  return Math.max(0, Math.floor((Date.now() - d.getTime()) / 86400000))
}

/** Truncate with an ellipsis, for table cells. */
export function truncate(value, max = 60) {
  const s = String(value ?? '')
  return s.length > max ? `${s.slice(0, max - 1)}…` : s
}

/** "AG" from "Azad Gupta" — avatar fallbacks. */
export function initials(name) {
  return String(name ?? '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('') || '?'
}

/** Safe filename segment for PDF exports and storage paths. */
export function slug(value) {
  return String(value ?? '')
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'export'
}
