import * as React from 'react'
import { Link, useParams } from 'react-router-dom'
import { BarChart, Bar, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts'
import { Download, FileText, Pencil, Save, TrendingDown, TrendingUp, Wallet } from 'lucide-react'
import { Page, PageHeader, PageBody, Toolbar, FilterSelect, ToolbarSpacer } from '@/components/patterns/Page'
import { StatCard, StatGrid } from '@/components/patterns/StatCard'
import { SectionCard, DetailList, DetailRow, SplitLayout } from '@/components/patterns/SectionCard'
import { Badge, StatusBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Field, FieldGrid, TextInput } from '@/components/ui/field'
import { AsyncView, EmptyState, ErrorState } from '@/components/ui/states'
import { TableWrap, Table, THead, TBody, TFoot, TR, TH, TD } from '@/components/ui/table'
import { Tabs } from '@/components/ui/tabs'
import { useQuery, useLocalState } from '@/lib/useQuery'
import { businesses, reports } from '@/lib/api'
import { businessPerformance, businessValuation, monthlySeries, reportProfit } from '@/lib/calc'
import { money, moneyCompact, monthLabel, date, number, percent } from '@/lib/format'
import { downloadCsv, downloadTablePdf } from '@/lib/export'
import { breadcrumbsFor } from '@/app/navigation'
import toast from 'react-hot-toast'

/* =====================================================================
   Project detail — one venture, everything about it.

   Merges three legacy screens that were reached in three different ways:
     • openBusiness(id, name, 'view')      profile fields, localStorage only
     • openBusinessDashboard(id, name)     month filter + chart + PDF, and it
                                           had no navigation entry at all —
                                           you could only reach it by calling
                                           the function from the console
     • the P&L PDF export, whose renderer was defined three times

   Now: one route, one header, two tabs. Performance is the default because
   that is why anyone opens a project.

   Profile fields still persist to localStorage under
   `xco_business_profile_v1:<id>`, unchanged, so existing data is not lost.
   The banner makes that limitation visible instead of hiding it — a founder
   should know this data is not on the server (SRS FR-E9).
   ===================================================================== */

const PROFILE_KEY_PREFIX = 'xco_business_profile_v1:'

const PROFILE_FIELDS = [
  { key: 'incorporated_date', label: 'Incorporated on', type: 'date' },
  { key: 'primary_manager_name', label: 'Primary manager', type: 'text', placeholder: 'Name' },
  { key: 'primary_manager_salary', label: 'Manager salary', type: 'number' },
  { key: 'cofounder_name', label: 'Co-founder in charge', type: 'text', placeholder: 'Name' },
  { key: 'cofounder_salary', label: 'Co-founder salary', type: 'number' },
  { key: 'chef_name', label: 'Chef assigned', type: 'text', placeholder: 'Name' },
  { key: 'chef_salary', label: 'Chef salary', type: 'number' },
]

const EMPTY_PROFILE = PROFILE_FIELDS.reduce((acc, f) => ({ ...acc, [f.key]: '' }), {})

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-[--radius] border border-border bg-popover px-3 py-2 text-xs shadow-[--shadow-md]">
      <p className="mb-1 font-medium">{monthLabel(label)}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="flex items-center justify-between gap-4 tabular">
          <span className="text-muted-foreground">{entry.name}</span>
          <span className="font-medium">{money(entry.value)}</span>
        </p>
      ))}
    </div>
  )
}

export default function ProjectDetailPage() {
  const { id } = useParams()
  const [tab, setTab] = React.useState('performance')
  const [month, setMonth] = React.useState('all')
  const [editing, setEditing] = React.useState(false)
  const [profile, setProfile] = useLocalState(`${PROFILE_KEY_PREFIX}${id}`, EMPTY_PROFILE)
  const [draft, setDraft] = React.useState(EMPTY_PROFILE)

  const query = useQuery(async () => {
    const [business, reportRows] = await Promise.all([businesses.get(id), reports.listForBusiness(id)])
    if (!business) throw new Error('This project no longer exists.')
    return { business, reportRows }
  }, [id])

  const business = query.data?.business
  const allReports = query.data?.reportRows ?? []

  const months = React.useMemo(() => {
    const set = new Set()
    for (const r of allReports) {
      const key = r.month ?? (typeof r.report_date === 'string' ? r.report_date.slice(0, 7) : null)
      if (key) set.add(key)
    }
    return [...set].sort((a, b) => b.localeCompare(a))
  }, [allReports])

  const filtered = React.useMemo(() => {
    if (month === 'all') return allReports
    return allReports.filter((r) => {
      const key = r.month ?? (typeof r.report_date === 'string' ? r.report_date.slice(0, 7) : null)
      return key === month
    })
  }, [allReports, month])

  const perf = React.useMemo(
    () => businessPerformance(filtered, business ? businessValuation(business) : 0),
    [filtered, business]
  )
  const series = React.useMemo(() => monthlySeries(allReports), [allReports])

  function startEditing() {
    setDraft({ ...EMPTY_PROFILE, ...profile })
    setEditing(true)
  }

  function saveProfile(e) {
    e.preventDefault()
    setProfile(draft)
    setEditing(false)
    toast.success('Project details saved on this device')
  }

  async function exportPdf() {
    if (filtered.length === 0) {
      toast.error('Nothing to export for this period')
      return
    }
    await downloadTablePdf({
      title: 'Profit & Loss',
      subtitle: `${business.name}${month === 'all' ? ' · All periods' : ` · ${monthLabel(month)}`}`,
      summary: [
        { label: 'Revenue', value: money(perf.revenue) },
        { label: 'Expense', value: money(perf.invested) },
        { label: 'Net result', value: money(perf.net) },
        { label: 'Entries', value: number(perf.reportCount) },
      ],
      columns: [
        { label: 'Date', width: 80 },
        { label: 'Month', width: 70 },
        { label: 'Revenue', align: 'right' },
        { label: 'Expense', align: 'right' },
        { label: 'Profit', align: 'right' },
        { label: 'Pool taken', align: 'right' },
      ],
      rows: filtered.map((r) => [
        date(r.report_date ?? r.created_at),
        monthLabel(r.month ?? r.report_date),
        money(r.income),
        money(r.expense),
        money(reportProfit(r)),
        money(r.pool_taken ?? 0),
      ]),
      filename: `${business.name}_Profit_Loss`,
      note: 'Figures are as submitted by the project manager.',
    })
    toast.success('PDF downloaded')
  }

  if (query.error) {
    return (
      <Page>
        <PageHeader title="Project" breadcrumbs={breadcrumbsFor('/app/projects')} />
        <PageBody>
          <ErrorState
            error={query.error}
            title="Project not available"
            onRetry={query.refetch}
          />
          <div className="mt-4 text-center">
            <Button variant="outline" asChild>
              <Link to="/app/projects">Back to projects</Link>
            </Button>
          </div>
        </PageBody>
      </Page>
    )
  }

  return (
    <Page>
      <PageHeader
        title={business?.name ?? 'Loading…'}
        description={business?.type ? `Category: ${business.type}` : 'Venture performance and details'}
        breadcrumbs={breadcrumbsFor('/app/projects', [{ label: business?.name ?? '…' }])}
        meta={
          business && (
            <>
              <StatusBadge status={perf.result} />
              <Badge size="sm">{number(perf.reportCount)} reports</Badge>
              {perf.valuation > 0 && <Badge size="sm">Valued {moneyCompact(perf.valuation)}</Badge>}
            </>
          )
        }
        actions={
          <>
            <Button
              variant="outline"
              disabled={filtered.length === 0}
              onClick={() => {
                downloadCsv(
                  `${business?.name ?? 'project'}_reports`,
                  filtered.map((r) => ({
                    date: r.report_date ?? r.created_at,
                    month: r.month ?? '',
                    income: r.income,
                    expense: r.expense,
                    profit: reportProfit(r),
                    pool_taken: r.pool_taken ?? 0,
                  }))
                )
                toast.success('Exported')
              }}
            >
              <Download aria-hidden="true" />
              CSV
            </Button>
            <Button onClick={exportPdf} disabled={filtered.length === 0}>
              <FileText aria-hidden="true" />
              P&amp;L PDF
            </Button>
          </>
        }
      >
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { value: 'performance', label: 'Performance' },
            { value: 'profile', label: 'Details' },
          ]}
        />
      </PageHeader>

      <PageBody className="space-y-4">
        {tab === 'performance' ? (
          <>
            <StatGrid cols={4}>
              <StatCard label="Revenue" value={money(perf.revenue)} hint="Income recorded" icon={TrendingUp} />
              <StatCard label="Expense" value={money(perf.invested)} hint="Money spent" icon={Wallet} />
              <StatCard
                label="Net result"
                value={money(perf.net)}
                tone={perf.net >= 0 ? 'positive' : 'negative'}
                hint={perf.result === 'PROFIT' ? 'In profit' : 'In loss'}
                icon={perf.net >= 0 ? TrendingUp : TrendingDown}
              />
              <StatCard
                label="Variance vs invested"
                value={money(perf.variance)}
                tone={perf.variance >= 0 ? 'positive' : 'negative'}
                hint={perf.variancePct != null ? percent(perf.variancePct) : 'Valuation not set'}
              />
            </StatGrid>

            <SectionCard
              title="Monthly performance"
              description="Revenue, expense and profit by month"
              actions={
                months.length > 0 && (
                  <FilterSelect
                    label="Period"
                    value={month}
                    onChange={setMonth}
                    options={[
                      { value: 'all', label: 'All periods' },
                      ...months.map((m) => ({ value: m, label: monthLabel(m) })),
                    ]}
                  />
                )
              }
            >
              {series.length === 0 ? (
                <EmptyState
                  compact
                  icon={FileText}
                  title="No reports yet"
                  description="Once the manager logs daily entries, the trend appears here."
                  action={
                    <Button size="sm" variant="outline" asChild>
                      <Link to="/app/ops/daily-entry">Log an entry</Link>
                    </Button>
                  }
                />
              ) : (
                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={series} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis
                        dataKey="month"
                        tickFormatter={monthLabel}
                        tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                        axisLine={{ stroke: 'hsl(var(--border))' }}
                        tickLine={false}
                      />
                      <YAxis
                        tickFormatter={(v) => moneyCompact(v)}
                        tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                        axisLine={false}
                        tickLine={false}
                        width={60}
                      />
                      <Tooltip content={<ChartTooltip />} cursor={{ fill: 'hsl(var(--muted))' }} />
                      <Legend
                        wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                        iconType="circle"
                        iconSize={8}
                      />
                      <Bar dataKey="income" name="Revenue" fill="hsl(var(--chart-3))" radius={[3, 3, 0, 0]} maxBarSize={28} />
                      <Bar dataKey="expense" name="Expense" fill="hsl(var(--chart-4))" radius={[3, 3, 0, 0]} maxBarSize={28} />
                      <Bar dataKey="profit" name="Profit" fill="hsl(var(--chart-1))" radius={[3, 3, 0, 0]} maxBarSize={28} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </SectionCard>

            <SectionCard
              title="Daily reports"
              description={month === 'all' ? 'Every entry submitted' : `Entries for ${monthLabel(month)}`}
              flush
            >
              <AsyncView query={query} skeletonProps={{ columns: 5 }}>
                {() =>
                  filtered.length === 0 ? (
                    <EmptyState compact icon={FileText} title="No entries for this period" />
                  ) : (
                    <TableWrap>
                      <Table>
                        <THead>
                          <TR>
                            <TH>Date</TH>
                            <TH>Month</TH>
                            <TH numeric>Revenue</TH>
                            <TH numeric>Expense</TH>
                            <TH numeric>Profit</TH>
                            <TH numeric>Pool taken</TH>
                          </TR>
                        </THead>
                        <TBody>
                          {filtered.map((r, i) => {
                            const profit = reportProfit(r)
                            return (
                              <TR key={r.id ?? i}>
                                <TD>{date(r.report_date ?? r.created_at)}</TD>
                                <TD>
                                  <span className="text-[13px] text-muted-foreground">
                                    {monthLabel(r.month ?? r.report_date)}
                                  </span>
                                </TD>
                                <TD numeric>{money(r.income)}</TD>
                                <TD numeric>{money(r.expense)}</TD>
                                <TD numeric>
                                  <span
                                    className={
                                      profit >= 0
                                        ? 'font-medium text-[hsl(var(--success))]'
                                        : 'font-medium text-[hsl(var(--destructive))]'
                                    }
                                  >
                                    {money(profit)}
                                  </span>
                                </TD>
                                <TD numeric>{r.pool_taken ? money(r.pool_taken) : '—'}</TD>
                              </TR>
                            )
                          })}
                        </TBody>
                        <TFoot>
                          <TR>
                            <TD colSpan={2} className="font-medium">
                              {filtered.length} {filtered.length === 1 ? 'entry' : 'entries'}
                            </TD>
                            <TD numeric>{money(perf.revenue)}</TD>
                            <TD numeric>{money(perf.invested)}</TD>
                            <TD numeric>{money(perf.net)}</TD>
                            <TD />
                          </TR>
                        </TFoot>
                      </Table>
                    </TableWrap>
                  )
                }
              </AsyncView>
            </SectionCard>
          </>
        ) : (
          <SplitLayout
            main={
              <SectionCard
                title="Project details"
                description="Ownership and staffing for this venture"
                actions={
                  editing ? (
                    <>
                      <Button variant="outline" size="sm" onClick={() => setEditing(false)}>
                        Cancel
                      </Button>
                      <Button size="sm" type="submit" form="project-profile">
                        <Save aria-hidden="true" />
                        Save
                      </Button>
                    </>
                  ) : (
                    <Button variant="outline" size="sm" onClick={startEditing}>
                      <Pencil aria-hidden="true" />
                      Edit
                    </Button>
                  )
                }
              >
                {/* Honest about where this data lives. */}
                <div className="mb-5 rounded-[--radius] border border-[hsl(var(--warning)/0.25)] bg-[hsl(var(--warning-soft))] px-3 py-2.5 text-[13px] text-[hsl(var(--warning))]">
                  These details are stored in this browser only, not on the server. Clearing site data will remove them.
                </div>

                {editing ? (
                  <form id="project-profile" onSubmit={saveProfile}>
                    <FieldGrid cols={2}>
                      {PROFILE_FIELDS.map((f) => (
                        <Field key={f.key} label={f.label} htmlFor={`pf-${f.key}`}>
                          <TextInput
                            id={`pf-${f.key}`}
                            type={f.type}
                            inputMode={f.type === 'number' ? 'decimal' : undefined}
                            placeholder={f.placeholder}
                            value={draft[f.key] ?? ''}
                            onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
                          />
                        </Field>
                      ))}
                    </FieldGrid>
                  </form>
                ) : (
                  <DetailList>
                    {PROFILE_FIELDS.map((f) => (
                      <DetailRow key={f.key} label={f.label}>
                        {profile[f.key]
                          ? f.type === 'number'
                            ? money(profile[f.key])
                            : f.type === 'date'
                              ? date(profile[f.key])
                              : profile[f.key]
                          : '—'}
                      </DetailRow>
                    ))}
                  </DetailList>
                )}
              </SectionCard>
            }
            aside={
              <SectionCard title="Record">
                <DetailList>
                  <DetailRow label="Category">
                    {business?.type ? <span className="capitalize">{business.type}</span> : '—'}
                  </DetailRow>
                  <DetailRow label="Valuation">{perf.valuation > 0 ? money(perf.valuation) : '—'}</DetailRow>
                  <DetailRow label="Total reports">{number(allReports.length)}</DetailRow>
                  <DetailRow label="Lifetime revenue">{money(businessPerformance(allReports, 0).revenue)}</DetailRow>
                  <DetailRow label="Lifetime spend">{money(businessPerformance(allReports, 0).invested)}</DetailRow>
                  <DetailRow label="Created">{date(business?.created_at)}</DetailRow>
                </DetailList>
              </SectionCard>
            }
          />
        )}
      </PageBody>
    </Page>
  )
}
