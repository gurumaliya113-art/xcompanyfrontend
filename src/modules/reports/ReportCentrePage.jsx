import * as React from 'react'
import { Link } from 'react-router-dom'
import { Briefcase, Download, FileText, Landmark, Receipt, ShoppingBag, Users, Wallet } from 'lucide-react'
import { Page, PageHeader, PageBody } from '@/components/patterns/Page'
import { SectionCard } from '@/components/patterns/SectionCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/states'
import { pool, reports, people, assets, layers, leads, meesho, businesses, equity } from '@/lib/api'
import { poolBalances, buildStatement, businessPerformance, businessValuation, reportProfit, salaryProjection, assetDepreciation, investorInterest, meeshoOrderResult, sharePrice, shareHolding, DEFAULT_ANNUAL_RATE } from '@/lib/calc'
import { money, moneyPrecise, date, dateTime, monthLabel, number, percent } from '@/lib/format'
import { downloadCsv, downloadTablePdf } from '@/lib/export'
import toast from 'react-hot-toast'

/* =====================================================================
   Report Centre — every export in one place.

   Before, exports were scattered: a "Save Report as PDF" button inside a
   business dashboard you could only reach by calling a function, an "Export
   PDF" on statements, a "Save PDF" on each cash/bank ledger, and a payslip
   button in the employee list. Four different renderers, four different
   layouts, and no single place to answer "what can I hand to an accountant?".

   This page lists the reports, says what each contains, and generates them on
   demand through the shared renderer so they all look like one company's
   documents. Data is fetched only when a report is actually requested — this
   page loads nothing on mount.
   ===================================================================== */

const REPORTS = [
  {
    id: 'portfolio',
    name: 'Portfolio summary',
    description: 'Every project with revenue, spend, net result and variance against valuation.',
    icon: Briefcase,
    formats: ['pdf', 'csv'],
  },
  {
    id: 'pool-statement',
    name: 'Money pool statement',
    description: 'Full ledger of money in and out with running cash and bank balances.',
    icon: Receipt,
    formats: ['pdf', 'csv'],
  },
  {
    id: 'daily-reports',
    name: 'Daily reports',
    description: 'Every entry submitted by managers, across all projects and periods.',
    icon: FileText,
    formats: ['pdf', 'csv'],
  },
  {
    id: 'payroll',
    name: 'Payroll summary',
    description: 'Current gross and accrued total for everyone on a fixed salary.',
    icon: Users,
    formats: ['pdf', 'csv'],
  },
  {
    id: 'assets',
    name: 'Asset register',
    description: 'Purchase value, current value and depreciation for every asset.',
    icon: Landmark,
    formats: ['pdf', 'csv'],
  },
  {
    id: 'cap-table',
    name: 'Cap table',
    description: 'Shareholdings, locked shares and value at the current share price.',
    icon: Wallet,
    formats: ['pdf', 'csv'],
  },
  {
    id: 'investors',
    name: 'Investor liability',
    description: 'Principal, days accrued and total payable per investor.',
    icon: Wallet,
    formats: ['pdf', 'csv'],
  },
  {
    id: 'meesho',
    name: 'Meesho performance',
    description: 'Orders with booked revenue, cost and realised margin.',
    icon: ShoppingBag,
    formats: ['pdf', 'csv'],
  },
  {
    id: 'leads',
    name: 'Client enquiries',
    description: 'Every inbound enquiry with contact details and requirement.',
    icon: FileText,
    formats: ['csv'],
  },
]

/** Each builder returns { title, subtitle, summary, columns, rows, filename, orientation, csv } */
const BUILDERS = {
  async portfolio() {
    const [list, reportRows] = await Promise.all([businesses.list(), reports.list().catch(() => [])])
    const grouped = new Map()
    for (const r of reportRows) {
      const key = String(r.business_id)
      grouped.set(key, [...(grouped.get(key) ?? []), r])
    }
    const enriched = list.map((b) => ({
      name: b.name,
      type: b.type ?? '',
      perf: businessPerformance(grouped.get(String(b.id)) ?? [], businessValuation(b)),
    }))
    const totals = enriched.reduce(
      (a, b) => ({
        revenue: a.revenue + b.perf.revenue,
        invested: a.invested + b.perf.invested,
        net: a.net + b.perf.net,
        valuation: a.valuation + b.perf.valuation,
      }),
      { revenue: 0, invested: 0, net: 0, valuation: 0 }
    )
    return {
      title: 'Portfolio Summary',
      subtitle: `${enriched.length} projects`,
      orientation: 'landscape',
      summary: [
        { label: 'Portfolio value', value: money(totals.valuation) },
        { label: 'Revenue', value: money(totals.revenue) },
        { label: 'Invested', value: money(totals.invested) },
        { label: 'Net result', value: money(totals.net) },
      ],
      columns: [
        { label: 'Project' },
        { label: 'Category', width: 90 },
        { label: 'Valuation', width: 90, align: 'right' },
        { label: 'Revenue', width: 90, align: 'right' },
        { label: 'Invested', width: 90, align: 'right' },
        { label: 'Net result', width: 90, align: 'right' },
        { label: 'Variance', width: 90, align: 'right' },
      ],
      rows: enriched.map((b) => [
        b.name,
        b.type,
        money(b.perf.valuation),
        money(b.perf.revenue),
        money(b.perf.invested),
        money(b.perf.net),
        money(b.perf.variance),
      ]),
      csv: enriched.map((b) => ({
        project: b.name,
        category: b.type,
        valuation: b.perf.valuation,
        revenue: b.perf.revenue,
        invested: b.perf.invested,
        net_result: b.perf.net,
        variance: b.perf.variance,
        reports: b.perf.reportCount,
      })),
      filename: 'TheXCompany_Portfolio_Summary',
    }
  },

  async 'pool-statement'() {
    const [ledgerAsc, latest] = await Promise.all([pool.ledger({ ascending: true }), pool.latest()])
    const st = buildStatement(ledgerAsc, poolBalances(latest))
    return {
      title: 'Money Pool Statement',
      subtitle: 'All time',
      orientation: 'landscape',
      summary: [
        { label: 'Money in', value: money(st.totalIn) },
        { label: 'Money out', value: money(st.totalOut) },
        { label: 'Closing cash', value: money(st.closingCash) },
        { label: 'Closing bank', value: money(st.closingBank) },
      ],
      columns: [
        { label: 'Date', width: 110 },
        { label: 'Account', width: 55 },
        { label: 'Party', width: 110 },
        { label: 'Reason' },
        { label: 'In', width: 75, align: 'right' },
        { label: 'Out', width: 75, align: 'right' },
        { label: 'Cash bal', width: 80, align: 'right' },
        { label: 'Bank bal', width: 80, align: 'right' },
      ],
      rows: st.rows.map((r) => [
        dateTime(r.created_at),
        r.source === 'CASH' ? 'Cash' : 'Bank',
        r.from_text ?? '—',
        r.reason ?? '—',
        r.moneyIn ? money(r.moneyIn) : '',
        r.moneyOut ? money(r.moneyOut) : '',
        money(r.cashBal),
        money(r.bankBal),
      ]),
      csv: st.rows.map((r) => ({
        datetime: r.created_at,
        account: r.source,
        direction: r.type === 'ADD' ? 'IN' : 'OUT',
        party: r.from_text ?? '',
        reason: r.reason ?? '',
        money_in: r.moneyIn || '',
        money_out: r.moneyOut || '',
        cash_balance: r.cashBal,
        bank_balance: r.bankBal,
      })),
      filename: 'TheXCompany_MoneyPool_Statement',
      note: 'Opening balances reconcile the ledger to the recorded pool balance.',
    }
  },

  async 'daily-reports'() {
    const [rows, bizList] = await Promise.all([reports.list(), businesses.listBasic().catch(() => [])])
    const nameById = new Map(bizList.map((b) => [String(b.id), b.name]))
    const totals = rows.reduce(
      (a, r) => ({
        income: a.income + (Number(r.income) || 0),
        expense: a.expense + (Number(r.expense) || 0),
        profit: a.profit + reportProfit(r),
      }),
      { income: 0, expense: 0, profit: 0 }
    )
    return {
      title: 'Daily Reports',
      subtitle: `${rows.length} entries`,
      orientation: 'landscape',
      summary: [
        { label: 'Revenue', value: money(totals.income) },
        { label: 'Expense', value: money(totals.expense) },
        { label: 'Net result', value: money(totals.profit) },
        { label: 'Entries', value: number(rows.length) },
      ],
      columns: [
        { label: 'Date', width: 90 },
        { label: 'Project' },
        { label: 'Period', width: 80 },
        { label: 'Revenue', width: 90, align: 'right' },
        { label: 'Expense', width: 90, align: 'right' },
        { label: 'Result', width: 90, align: 'right' },
      ],
      rows: rows.map((r) => [
        date(r.report_date ?? r.created_at),
        nameById.get(String(r.business_id)) ?? 'Unknown',
        monthLabel(r.month ?? r.report_date),
        money(r.income),
        money(r.expense),
        money(reportProfit(r)),
      ]),
      csv: rows.map((r) => ({
        date: r.report_date ?? r.created_at,
        project: nameById.get(String(r.business_id)) ?? '',
        month: r.month ?? '',
        income: r.income,
        expense: r.expense,
        result: reportProfit(r),
        pool_taken: r.pool_taken ?? 0,
      })),
      filename: 'TheXCompany_Daily_Reports',
    }
  },

  async payroll() {
    const [list, configs] = await Promise.all([people.list(), people.salaryConfigs().catch(() => [])])
    const byEmployee = new Map()
    for (const c of configs) {
      const prev = byEmployee.get(String(c.employee_id))
      if (!prev || String(c.created_at ?? '') > String(prev.created_at ?? '')) byEmployee.set(String(c.employee_id), c)
    }
    const rows = list
      .map((p) => {
        const config = byEmployee.get(String(p.id))
        if (!config?.salary_fixed) return null
        const proj = salaryProjection({
          basicPay: config.basic_pay,
          startDate: config.start_date,
          annualRate: config.annual_rate ?? DEFAULT_ANNUAL_RATE,
        })
        return { name: p.name, role: p.role ?? '', config, proj }
      })
      .filter(Boolean)
    const totals = rows.reduce(
      (a, r) => ({ gross: a.gross + r.proj.current.gross, accrued: a.accrued + r.proj.accumulated }),
      { gross: 0, accrued: 0 }
    )
    return {
      title: 'Payroll Summary',
      subtitle: `${rows.length} people on fixed salary`,
      orientation: 'landscape',
      summary: [
        { label: 'Monthly payroll', value: money(totals.gross) },
        { label: 'Accrued to date', value: money(totals.accrued) },
        { label: 'People', value: number(rows.length) },
      ],
      columns: [
        { label: 'Person' },
        { label: 'Role', width: 110 },
        { label: 'Joined', width: 85 },
        { label: 'Months', width: 55, align: 'right' },
        { label: 'Basic', width: 85, align: 'right' },
        { label: 'Gross', width: 85, align: 'right' },
        { label: 'Accrued', width: 95, align: 'right' },
      ],
      rows: rows.map((r) => [
        r.name,
        r.role,
        date(r.config.start_date),
        number(r.proj.months),
        money(r.proj.current.basicPay),
        money(r.proj.current.gross),
        money(r.proj.accumulated),
      ]),
      csv: rows.map((r) => ({
        person: r.name,
        role: r.role,
        joined: r.config.start_date ?? '',
        months: r.proj.months,
        basic: r.proj.current.basicPay.toFixed(2),
        da: r.proj.current.da.toFixed(2),
        hra: r.proj.current.hra.toFixed(2),
        medical: r.proj.current.medical.toFixed(2),
        wifi: r.proj.current.wifi.toFixed(2),
        gross: r.proj.current.gross.toFixed(2),
        accrued: r.proj.accumulated.toFixed(2),
      })),
      filename: 'TheXCompany_Payroll_Summary',
      note: 'Gross is basic × 1.84. Basic compounds monthly at the configured annual rate.',
    }
  },

  async assets() {
    const list = await assets.list()
    const enriched = list.map((a) => ({ ...a, dep: assetDepreciation(a) }))
    const totals = enriched.reduce(
      (acc, a) => ({ current: acc.current + a.dep.current, purchase: acc.purchase + a.dep.purchase }),
      { current: 0, purchase: 0 }
    )
    return {
      title: 'Asset Register',
      subtitle: `${enriched.length} assets`,
      summary: [
        { label: 'Value today', value: money(totals.current) },
        { label: 'Purchase value', value: money(totals.purchase) },
        { label: 'Depreciation', value: money(totals.purchase - totals.current) },
      ],
      columns: [
        { label: 'Asset' },
        { label: 'Category', width: 80 },
        { label: 'Condition', width: 65 },
        { label: 'Purchase', width: 75, align: 'right' },
        { label: 'Today', width: 75, align: 'right' },
        { label: 'Depreciation', width: 85, align: 'right' },
      ],
      rows: enriched.map((a) => [
        a.name,
        a.category ?? 'General',
        a.condition ?? '',
        money(a.dep.purchase),
        money(a.dep.current),
        `${money(a.dep.amount)} (${percent(a.dep.pct, 0)})`,
      ]),
      csv: enriched.map((a) => ({
        asset: a.name,
        category: a.category ?? '',
        condition: a.condition ?? '',
        purchase_date: a.purchase_date ?? '',
        purchase_value: a.dep.purchase,
        current_value: a.dep.current,
        depreciation: a.dep.amount,
        depreciation_percent: a.dep.pct.toFixed(2),
      })),
      filename: 'TheXCompany_Asset_Register',
    }
  },

  async 'cap-table'() {
    const [companyValue, totalShares, ledger, team] = await Promise.all([
      equity.companyValue().catch(() => 0),
      equity.totalShares().catch(() => 0),
      equity.ledger().catch(() => []),
      people.listBasic().catch(() => []),
    ])
    const price = sharePrice(companyValue, totalShares)
    const nameById = new Map(team.map((p) => [String(p.id), p.name]))
    const byHolder = new Map()
    for (const row of ledger) {
      byHolder.set(String(row.employee_id), [...(byHolder.get(String(row.employee_id)) ?? []), row])
    }
    const holders = [...byHolder.entries()]
      .map(([id, rows]) => ({ name: nameById.get(id) ?? 'Unknown', ...shareHolding(rows) }))
      .filter((h) => h.total !== 0)
      .sort((a, b) => b.total - a.total)
    return {
      title: 'Cap Table',
      subtitle: `Share price ${moneyPrecise(price)}`,
      summary: [
        { label: 'Valuation', value: money(companyValue) },
        { label: 'Total shares', value: number(totalShares) },
        { label: 'Share price', value: moneyPrecise(price) },
        { label: 'Holders', value: number(holders.length) },
      ],
      columns: [
        { label: 'Holder' },
        { label: 'Shares', width: 80, align: 'right' },
        { label: 'Locked', width: 70, align: 'right' },
        { label: 'Sellable', width: 75, align: 'right' },
        { label: 'Ownership', width: 80, align: 'right' },
        { label: 'Value', width: 90, align: 'right' },
      ],
      rows: holders.map((h) => [
        h.name,
        number(h.total),
        number(h.locked),
        number(h.available),
        totalShares > 0 ? percent((h.total / totalShares) * 100, 2) : '—',
        money(h.total * price),
      ]),
      csv: holders.map((h) => ({
        holder: h.name,
        shares: h.total,
        locked: h.locked,
        sellable: h.available,
        ownership_percent: totalShares > 0 ? ((h.total / totalShares) * 100).toFixed(3) : '',
        value: (h.total * price).toFixed(2),
      })),
      filename: 'TheXCompany_Cap_Table',
    }
  },

  async investors() {
    const list = await layers.list(4)
    const enriched = list.map((i) => ({
      ...i,
      calc: investorInterest({ principal: i.amount, annualRate: i.annual_rate, investedOn: i.invested_on }),
    }))
    const totals = enriched.reduce(
      (a, i) => ({
        principal: a.principal + (Number(i.amount) || 0),
        interest: a.interest + i.calc.interest,
        total: a.total + i.calc.total,
      }),
      { principal: 0, interest: 0, total: 0 }
    )
    return {
      title: 'Investor Liability',
      subtitle: `${enriched.length} investors`,
      summary: [
        { label: 'Principal', value: money(totals.principal) },
        { label: 'Interest accrued', value: money(totals.interest) },
        { label: 'Total payable', value: money(totals.total) },
      ],
      columns: [
        { label: 'Investor' },
        { label: 'Invested on', width: 90 },
        { label: 'Days', width: 55, align: 'right' },
        { label: 'Rate', width: 55, align: 'right' },
        { label: 'Principal', width: 90, align: 'right' },
        { label: 'Interest', width: 90, align: 'right' },
        { label: 'Payable', width: 90, align: 'right' },
      ],
      rows: enriched.map((i) => [
        i.name,
        i.invested_on ? date(i.invested_on) : '—',
        number(i.calc.days),
        percent((i.annual_rate ?? 0.12) * 100, 0),
        money(i.amount),
        money(i.calc.interest),
        money(i.calc.total),
      ]),
      csv: enriched.map((i) => ({
        investor: i.name,
        invested_on: i.invested_on ?? '',
        annual_rate: i.annual_rate ?? 0.12,
        days: i.calc.days,
        principal: i.amount,
        interest: i.calc.interest.toFixed(2),
        payable: i.calc.total.toFixed(2),
      })),
      filename: 'TheXCompany_Investor_Liability',
      note: 'Simple interest: principal × rate × days ÷ 365. Repayments are not tracked.',
    }
  },

  async meesho() {
    const list = await meesho.list()
    const enriched = list.map((r) => ({ ...r, res: meeshoOrderResult(r) }))
    const totals = enriched.reduce(
      (a, r) => ({
        revenue: a.revenue + r.res.revenue,
        cost: a.cost + r.res.cost,
        profit: a.profit + r.res.profit,
      }),
      { revenue: 0, cost: 0, profit: 0 }
    )
    return {
      title: 'Meesho Performance',
      subtitle: `${enriched.length} orders`,
      orientation: 'landscape',
      summary: [
        { label: 'Revenue booked', value: money(totals.revenue) },
        { label: 'Cost booked', value: money(totals.cost) },
        { label: 'Profit', value: money(totals.profit) },
        { label: 'Margin', value: totals.revenue > 0 ? percent((totals.profit / totals.revenue) * 100) : '—' },
      ],
      columns: [
        { label: 'Order date', width: 110 },
        { label: 'Sub order ID' },
        { label: 'State', width: 75 },
        { label: 'Cost', width: 80, align: 'right' },
        { label: 'Selling', width: 80, align: 'right' },
        { label: 'Revenue', width: 80, align: 'right' },
        { label: 'Profit', width: 80, align: 'right' },
      ],
      rows: enriched.map((r) => [
        dateTime(r.entry_datetime),
        r.sub_order_id,
        r.res.state.replace('_', ' '),
        money(r.cost_price),
        money(r.selling_price),
        money(r.res.revenue),
        money(r.res.profit),
      ]),
      csv: enriched.map((r) => ({
        order_datetime: r.entry_datetime,
        sub_order_id: r.sub_order_id,
        state: r.res.state,
        cost_price: r.cost_price,
        selling_price: r.selling_price,
        revenue_booked: r.res.revenue,
        cost_booked: r.res.cost,
        profit: r.res.profit,
      })),
      filename: 'TheXCompany_Meesho_Performance',
      note: 'Revenue is booked only on delivered orders. Returns book cost as a loss.',
    }
  },

  async leads() {
    const rows = await leads.enquiries()
    return {
      title: 'Client Enquiries',
      csvOnly: true,
      csv: rows.map((r) => ({
        received: r.created_at,
        name: r.name,
        company: r.company ?? '',
        phone: r.phone ?? '',
        email: r.email ?? '',
        budget: r.budget ?? '',
        timeline: r.timeline ?? '',
        requirement: r.project_details ?? '',
      })),
      filename: 'TheXCompany_Client_Enquiries',
    }
  },
}

export default function ReportCentrePage() {
  const [busy, setBusy] = React.useState(null)

  async function generate(reportId, format) {
    setBusy(`${reportId}-${format}`)
    try {
      const built = await BUILDERS[reportId]()
      if (!built.csv?.length && !built.rows?.length) {
        toast.error('There is no data for this report yet')
        return
      }
      if (format === 'csv') {
        downloadCsv(built.filename, built.csv)
      } else {
        await downloadTablePdf({
          title: built.title,
          subtitle: built.subtitle,
          summary: built.summary ?? [],
          columns: built.columns,
          rows: built.rows,
          filename: built.filename,
          orientation: built.orientation ?? 'portrait',
          note: built.note,
        })
      }
      toast.success(`${built.title} downloaded`)
    } catch (e) {
      toast.error(e.message)
    } finally {
      setBusy(null)
    }
  }

  return (
    <Page>
      <PageHeader
        title="Report Centre"
        description="Generate any report as a PDF document or a spreadsheet"
      />

      <PageBody className="space-y-4">
        <div className="grid gap-4 lg:grid-cols-2">
          {REPORTS.map((r) => (
            <SectionCard key={r.id}>
              <div className="flex items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-[--radius] border border-border bg-muted text-muted-foreground">
                  <r.icon className="size-4" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold">{r.name}</h3>
                  <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{r.description}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {r.formats.includes('pdf') && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busy !== null}
                        onClick={() => generate(r.id, 'pdf')}
                      >
                        {busy === `${r.id}-pdf` ? <Spinner /> : <FileText aria-hidden="true" />}
                        PDF
                      </Button>
                    )}
                    {r.formats.includes('csv') && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busy !== null}
                        onClick={() => generate(r.id, 'csv')}
                      >
                        {busy === `${r.id}-csv` ? <Spinner /> : <Download aria-hidden="true" />}
                        CSV
                      </Button>
                    )}
                    {!r.formats.includes('pdf') && (
                      <Badge size="sm" tone="neutral">
                        Spreadsheet only
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </SectionCard>
          ))}
        </div>

        <SectionCard title="Per-record exports" description="Some documents are generated from the record itself">
          <ul className="space-y-2.5 text-[13px]">
            <li className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-muted-foreground">Project profit &amp; loss for one venture and period</span>
              <Link to="/app/projects" className="font-medium hover:underline">
                Open a project →
              </Link>
            </li>
            <li className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-muted-foreground">Payslip for one person and month</span>
              <Link to="/app/team" className="font-medium hover:underline">
                Open a person →
              </Link>
            </li>
            <li className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-muted-foreground">Filtered pool statement for a date range</span>
              <Link to="/app/finance/statements" className="font-medium hover:underline">
                Open statements →
              </Link>
            </li>
            <li className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-muted-foreground">Employee AR/AP ledger</span>
              <Link to="/app/team" className="font-medium hover:underline">
                Open a person →
              </Link>
            </li>
          </ul>
        </SectionCard>

        <div className="rounded-[--radius] border border-border bg-muted/40 px-4 py-3 text-[13px] text-muted-foreground">
          Reports read live data at the moment you generate them. Spreadsheets are UTF-8 with a byte-order mark, so ₹ and
          Hindi text open correctly in Excel.
        </div>
      </PageBody>
    </Page>
  )
}
