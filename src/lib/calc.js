/* =====================================================================
   Business calculations — ported verbatim from js/app.js and the backend.

   These formulas ARE the business. They were previously spread across
   `js/app.js` (salary engine, investor interest, portfolio maths),
   `pm.html` (profit/loss), `backend/index.js` (share price, pool) and the
   Postgres generated columns (depreciation). Same numbers, one home, so a
   change to the salary rule happens in exactly one place.

   Nothing here has been "improved" — matching the existing output is the
   whole point. Where the legacy behaviour is questionable it is flagged
   with a NOTE and left alone.
   ===================================================================== */

import { monthsElapsed, daysSince, num } from './format'

/* ------------------------------------------------------------------ */
/* Salary engine                                                       */
/* ------------------------------------------------------------------ */

export const SALARY_COMPONENT_RATES = {
  da: 0.5,
  hra: 0.2,
  medical: 0.1,
  wifi: 0.04,
}

export const DEFAULT_ANNUAL_RATE = 0.06 // employees
export const DEFAULT_INVESTOR_RATE = 0.12 // layer 4

/** Gross = basic × 1.84. Source: _salaryComponentsFromBasic in app.js. */
export function salaryComponents(basic) {
  const basicPay = num(basic)
  const da = basicPay * SALARY_COMPONENT_RATES.da
  const hra = basicPay * SALARY_COMPONENT_RATES.hra
  const medical = basicPay * SALARY_COMPONENT_RATES.medical
  const wifi = basicPay * SALARY_COMPONENT_RATES.wifi
  return { basicPay, da, hra, medical, wifi, gross: basicPay + da + hra + medical + wifi }
}

/** Annual rate → equivalent monthly compounding rate. */
export function monthlyRateFromAnnual(annualRate) {
  return Math.pow(1 + num(annualRate), 1 / 12) - 1
}

/**
 * Current salary plus everything accrued since joining.
 * Accumulation uses the annuity sum of a growing series, matching
 * _salaryProjection in app.js exactly (including the rm≈0 branch).
 */
export function salaryProjection({ basicPay, startDate, annualRate = DEFAULT_ANNUAL_RATE }) {
  const months = monthsElapsed(startDate)
  const rm = monthlyRateFromAnnual(annualRate)
  const base = salaryComponents(basicPay)
  const growthFactor = Math.pow(1 + rm, months)
  const current = salaryComponents(base.basicPay * growthFactor)

  let accumulated = 0
  if (months <= 0) accumulated = 0
  else if (Math.abs(rm) < 1e-9) accumulated = base.gross * months
  else accumulated = base.gross * ((growthFactor - 1) / rm)

  return { months, annualRate: num(annualRate, DEFAULT_ANNUAL_RATE), base, current, accumulated, monthlyRate: rm }
}

/** Month-by-month schedule with a running cumulative total. */
export function salarySchedule({ basicPay, startDate, annualRate = DEFAULT_ANNUAL_RATE, maxMonths = 240 }) {
  const baseBasic = num(basicPay)
  if (!startDate || baseBasic <= 0) return []
  const start = new Date(startDate)
  if (Number.isNaN(start.getTime())) return []

  const rm = monthlyRateFromAnnual(annualRate)
  const monthsToShow = Math.min(monthsElapsed(startDate) + 1, Math.max(1, maxMonths))

  const rows = []
  let cumulative = 0
  for (let i = 0; i < monthsToShow; i += 1) {
    const d = new Date(start)
    d.setMonth(d.getMonth() + i)
    const comp = salaryComponents(baseBasic * Math.pow(1 + rm, i))
    cumulative += comp.gross
    rows.push({
      monthNo: i + 1,
      ym: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      ...comp,
      cumulative,
    })
  }
  return rows
}

/* ------------------------------------------------------------------ */
/* Employee ledger (AR / AP)                                           */
/* ------------------------------------------------------------------ */

/**
 * AR = employee owes the company. AP = company owes the employee.
 * The current month's gross is added to AP automatically, matching
 * showEmployeeLedger in app.js.
 */
export function ledgerTotals(entries = [], currentGross = 0) {
  let ar = 0
  let ap = 0
  for (const e of entries) {
    if (e.type === 'AR') ar += num(e.amount)
    else if (e.type === 'AP') ap += num(e.amount)
  }
  ap += num(currentGross)
  const net = ap - ar
  return {
    ar,
    ap,
    net,
    direction: net >= 0 ? 'company_owes' : 'employee_owes',
  }
}

/* ------------------------------------------------------------------ */
/* Business / portfolio performance                                    */
/* ------------------------------------------------------------------ */

/** Stored profit wins; otherwise derive it. Mirrors the legacy fallback. */
export function reportProfit(report) {
  if (report?.profit != null) return num(report.profit)
  return num(report?.income) - num(report?.expense)
}

/**
 * Valuation is read through a fallback chain because the `businesses` table
 * has accumulated several value columns over time.
 * NOTE: this ambiguity should be resolved in the schema (see SRS D-9).
 */
export function businessValuation(business) {
  return num(
    business?.value ??
      business?.valuation ??
      business?.business_value ??
      business?.current_value ??
      business?.amount ??
      business?.total_value ??
      business?.valuation_amount
  )
}

/** Aggregate a business's reports into the numbers shown on cards and detail. */
export function businessPerformance(reports = [], valuation = 0) {
  let revenue = 0
  let invested = 0
  let net = 0
  let profitPositive = 0
  let lossAbs = 0

  for (const r of reports) {
    const p = reportProfit(r)
    revenue += num(r.income)
    invested += num(r.expense)
    net += p
    if (p >= 0) profitPositive += p
    else lossAbs += Math.abs(p)
  }

  const variance = num(valuation) - invested
  const variancePct = invested > 0 ? (variance / invested) * 100 : null

  return {
    revenue,
    invested,
    net,
    profitPositive,
    lossAbs,
    valuation: num(valuation),
    variance,
    variancePct,
    reportCount: reports.length,
    result: net >= 0 ? 'PROFIT' : 'LOSS',
  }
}

/** Monthly buckets for charts, sorted oldest → newest. */
export function monthlySeries(reports = []) {
  const buckets = new Map()
  for (const r of reports) {
    const key = r.month ?? (typeof r.report_date === 'string' ? r.report_date.slice(0, 7) : null)
    if (!key) continue
    const acc = buckets.get(key) ?? { month: key, income: 0, expense: 0, profit: 0 }
    acc.income += num(r.income)
    acc.expense += num(r.expense)
    acc.profit += reportProfit(r)
    buckets.set(key, acc)
  }
  return Array.from(buckets.values()).sort((a, b) => a.month.localeCompare(b.month))
}

/* ------------------------------------------------------------------ */
/* Money pool                                                          */
/* ------------------------------------------------------------------ */

/**
 * layer1_amount is CASH, layer2_amount is BANK. This naming is an
 * application convention with no meaning in the schema — see SRS BR-9.
 */
export function poolBalances(latestRow) {
  const cash = num(latestRow?.layer1_amount)
  const bank = num(latestRow?.layer2_amount)
  return { cash, bank, total: cash + bank }
}

/** Apply an ADD/MINUS movement, returning the next snapshot or a rejection. */
export function applyPoolMovement({ cash, bank, type, source, amount }) {
  const amt = num(amount)
  if (amt <= 0) return { ok: false, error: 'Enter an amount greater than zero.' }

  let nextCash = cash
  let nextBank = bank

  if (type === 'ADD') {
    if (source === 'CASH') nextCash += amt
    else nextBank += amt
  } else {
    const available = source === 'CASH' ? cash : bank
    if (amt > available) {
      return { ok: false, error: `Insufficient ${source === 'CASH' ? 'cash' : 'bank'} balance.`, available }
    }
    if (source === 'CASH') nextCash -= amt
    else nextBank -= amt
  }

  return { ok: true, cash: nextCash, bank: nextBank }
}

/**
 * Running statement with reconciliation offsets.
 * The ledger may not sum to the actual pool balance (share buybacks and
 * pool_taken never wrote ledger rows, and submits silently failed — SRS D-6).
 * The offset absorbs that difference so the closing balance always matches
 * reality, behaving like an opening balance. Ported from showMoneyPoolStatements.
 */
export function buildStatement(ledgerAsc = [], actual = { cash: 0, bank: 0 }) {
  let rawCash = 0
  let rawBank = 0
  for (const row of ledgerAsc) {
    const signed = row.type === 'ADD' ? num(row.amount) : -num(row.amount)
    if (row.source === 'CASH') rawCash += signed
    else rawBank += signed
  }

  let cashBal = num(actual.cash) - rawCash
  let bankBal = num(actual.bank) - rawBank
  const openingCash = cashBal
  const openingBank = bankBal

  let totalIn = 0
  let totalOut = 0
  const rows = ledgerAsc.map((row, i) => {
    const amount = num(row.amount)
    const isIn = row.type === 'ADD'
    if (isIn) totalIn += amount
    else totalOut += amount
    const signed = isIn ? amount : -amount
    if (row.source === 'CASH') cashBal += signed
    else bankBal += signed
    return { ...row, index: i + 1, moneyIn: isIn ? amount : 0, moneyOut: isIn ? 0 : amount, cashBal, bankBal }
  })

  return { rows, totalIn, totalOut, net: totalIn - totalOut, openingCash, openingBank, closingCash: cashBal, closingBank: bankBal }
}

/* ------------------------------------------------------------------ */
/* Equity                                                              */
/* ------------------------------------------------------------------ */

export const WEEKLY_SHARE_BUY_CAP = 500

export function sharePrice(companyValue, totalShares) {
  const total = num(totalShares)
  if (total <= 0) return 0
  return num(companyValue) / total
}

/** Locked grants are excluded from sellable quantity. */
export function shareHolding(ledgerRows = []) {
  let total = 0
  let locked = 0
  for (const row of ledgerRows) {
    const qty = num(row.shares)
    total += qty
    if (row.locked) locked += qty
  }
  return { total, locked, available: total - locked }
}

export function sharesBoughtThisWeek(ledgerRows = []) {
  const cutoff = Date.now() - 7 * 86400000
  return ledgerRows.reduce((sum, row) => {
    const qty = num(row.shares)
    if (qty <= 0) return sum
    const t = row.created_at ? new Date(row.created_at).getTime() : 0
    return t > cutoff ? sum + qty : sum
  }, 0)
}

/** Sell payouts drain cash first, then bank. Ported from sellCompanyShares. */
export function splitPayout(amount, cash, bank) {
  const amt = num(amount)
  if (amt > num(cash) + num(bank)) return { ok: false, error: 'Pool does not hold enough for this payout.' }
  const fromCash = Math.min(num(cash), amt)
  const fromBank = amt - fromCash
  return { ok: true, fromCash, fromBank, cash: num(cash) - fromCash, bank: num(bank) - fromBank }
}

export function makeTransactionId() {
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase()
  return `TXN-${Date.now().toString(36).toUpperCase()}-${rand}`
}

/* ------------------------------------------------------------------ */
/* Assets                                                              */
/* ------------------------------------------------------------------ */

/**
 * Depreciation mirrors the Postgres generated columns so previews match what
 * the database will store. Falls back to computing when columns are absent.
 */
export function assetDepreciation(asset) {
  const current = num(asset?.current_value ?? asset?.value)
  const purchase = num(asset?.purchase_value ?? asset?.purchaseValue) || current
  const amount = asset?.depreciation_amount != null ? num(asset.depreciation_amount) : purchase - current
  const pct =
    asset?.depreciation_percent != null
      ? num(asset.depreciation_percent)
      : purchase > 0
        ? (amount / purchase) * 100
        : 0
  return { current, purchase, amount, pct }
}

export function assetTotals(assets = []) {
  let current = 0
  let purchase = 0
  const categories = new Set()
  for (const a of assets) {
    const d = assetDepreciation(a)
    current += d.current
    purchase += d.purchase
    categories.add(a.category || 'General')
  }
  const depreciation = purchase - current
  return {
    current,
    purchase,
    depreciation,
    depreciationPct: purchase > 0 ? (depreciation / purchase) * 100 : 0,
    count: assets.length,
    categoryCount: categories.size,
  }
}

/* ------------------------------------------------------------------ */
/* Investors (Layer 4)                                                 */
/* ------------------------------------------------------------------ */

/** Simple interest, day-based. Ported from _calcSimpleInterest. */
export function investorInterest({ principal, annualRate = DEFAULT_INVESTOR_RATE, investedOn }) {
  const p = num(principal)
  const r = num(annualRate, DEFAULT_INVESTOR_RATE)
  if (p <= 0 || !investedOn) return { days: 0, interest: 0, total: Math.max(0, p) }
  const days = daysSince(investedOn)
  const interest = p * r * (days / 365)
  return { days, interest, total: p + interest }
}

export function investorTotals(investors = []) {
  return investors.reduce(
    (acc, inv) => {
      const calc = investorInterest({
        principal: inv.amount,
        annualRate: inv.annual_rate,
        investedOn: inv.invested_on,
      })
      acc.principal += num(inv.amount)
      acc.interest += calc.interest
      acc.total += calc.total
      return acc
    },
    { principal: 0, interest: 0, total: 0 }
  )
}

/* ------------------------------------------------------------------ */
/* Meesho — new: the legacy tracker stored prices but never computed margin  */
/* ------------------------------------------------------------------ */

/**
 * Order economics. Returns null revenue for orders that never earned money
 * (cancelled or returned), so totals do not overstate performance.
 * This closes SRS gap FR-N9 without changing any stored data.
 */
export function meeshoOrderResult(entry) {
  const cost = num(entry?.cost_price)
  const selling = num(entry?.selling_price)
  const cancelled = entry?.cancelled_by && entry.cancelled_by !== 'NONE'
  const returned = entry?.return_status && entry.return_status !== 'NONE'
  const delivered = Boolean(entry?.delivered)

  if (cancelled) return { state: 'cancelled', revenue: 0, cost: 0, profit: 0 }
  if (returned) return { state: 'returned', revenue: 0, cost, profit: -cost }
  if (delivered) return { state: 'delivered', revenue: selling, cost, profit: selling - cost }
  return { state: 'in_transit', revenue: 0, cost, profit: 0, expectedProfit: selling - cost }
}

export function meeshoTotals(entries = []) {
  const totals = {
    orders: entries.length,
    delivered: 0,
    inTransit: 0,
    returned: 0,
    cancelled: 0,
    revenue: 0,
    cost: 0,
    profit: 0,
    expectedProfit: 0,
  }
  for (const e of entries) {
    const r = meeshoOrderResult(e)
    if (r.state === 'delivered') totals.delivered += 1
    if (r.state === 'in_transit') totals.inTransit += 1
    if (r.state === 'returned') totals.returned += 1
    if (r.state === 'cancelled') totals.cancelled += 1
    totals.revenue += r.revenue
    totals.cost += r.cost
    totals.profit += r.profit
    totals.expectedProfit += r.expectedProfit ?? 0
  }
  totals.margin = totals.revenue > 0 ? (totals.profit / totals.revenue) * 100 : 0
  return totals
}
