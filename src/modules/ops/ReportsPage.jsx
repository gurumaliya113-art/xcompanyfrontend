import * as React from 'react'
import { Link } from 'react-router-dom'
import { Download, FileText, TrendingDown, TrendingUp, Wallet } from 'lucide-react'
import { Page, PageHeader, PageBody, Toolbar, SearchInput, FilterSelect, ToolbarSpacer } from '@/components/patterns/Page'
import { StatCard, StatGrid } from '@/components/patterns/StatCard'
import { SectionCard } from '@/components/patterns/SectionCard'
import { Button } from '@/components/ui/button'
import { AsyncView, EmptyState } from '@/components/ui/states'
import { TableWrap, Table, THead, TBody, TFoot, TR, TH, TD } from '@/components/ui/table'
import { useQuery } from '@/lib/useQuery'
import { reports, businesses } from '@/lib/api'
import { reportProfit } from '@/lib/calc'
import { money, date, dateTime, monthLabel, number, relativeTime } from '@/lib/format'
import { downloadCsv, downloadTablePdf } from '@/lib/export'
import toast from 'react-hot-toast'

/* =====================================================================
   Daily Reports — every entry submitted by every manager.

   The legacy "PM Reports" screen was read-only with four summary cards and a
   flat table, but had no filters at all. With a few months of daily entries
   across several projects it became an unusable wall of rows, and there was
   no way to answer "what did Scrapco submit in March?".

   Added: project filter, month filter, search, CSV and PDF export, and a
   project column that links through to the project. The numbers and their
   derivation are unchanged.
   ===================================================================== */

export default function ReportsPage() {
  const [search, setSearch] = React.useState('')
  const [project, setProject] = React.useState('all')
  const [month, setMonth] = React.useState('all')

  const query = useQuery(async () => {
    const [rows, bizList] = await Promise.all([reports.list(), businesses.listBasic().catch(() => [])])
    const nameById = new Map(bizList.map((b) => [String(b.id), b.name]))
    return {
      rows: rows.map((r) => ({
        ...r,
        projectName: nameById.get(String(r.business_id)) ?? 'Unknown project',
        monthKey: r.month ?? String(r.report_date ?? r.created_at ?? '').slice(0, 7),
        profit: reportProfit(r),
      })),
      businesses: bizList,
    }
  }, [])

  const months = React.useMemo(() => {
    const set = new Set((query.data?.rows ?? []).map((r) => r.monthKey).filter(Boolean))
    return [...set].sort((a, b) => b.localeCompare(a))
  }, [query.data])

  const rows = React.useMemo(() => {
    let list = query.data?.rows ?? []
    if (project !== 'all') list = list.filter((r) => String(r.business_id) === project)
    if (month !== 'all') list = list.filter((r) => r.monthKey === month)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter((r) => r.projectName.toLowerCase().includes(q))
    }
    return list
  }, [query.data, project, month, search])

  const totals = React.useMemo(
    () =>
      rows.reduce(
        (acc, r) => {
          acc.income += Number(r.income) || 0
          acc.expense += Number(r.expense) || 0
          acc.profit += r.profit
          acc.pool += Number(r.pool_taken) || 0
          return acc
        },
        { income: 0, expense: 0, profit: 0, pool: 0 }
      ),
    [rows]
  )

  const hasFilters = project !== 'all' || month !== 'all' || Boolean(search)

  async function exportPdf() {
    await downloadTablePdf({
      title: 'Daily Reports',
      subtitle: [
        project === 'all'
          ? 'All projects'
          : (query.data?.businesses.find((b) => String(b.id) === project)?.name ?? 'Project'),
        month === 'all' ? 'All periods' : monthLabel(month),
      ].join(' · '),
      orientation: 'landscape',
      summary: [
        { label: 'Revenue', value: money(totals.income) },
        { label: 'Expense', value: money(totals.expense) },
        { label: 'Net result', value: money(totals.profit) },
        { label: 'Pool drawn', value: money(totals.pool) },
      ],
      columns: [
        { label: 'Date', width: 90 },
        { label: 'Project' },
        { label: 'Month', width: 80 },
        { label: 'Revenue', width: 90, align: 'right' },
        { label: 'Expense', width: 90, align: 'right' },
        { label: 'Result', width: 90, align: 'right' },
        { label: 'Pool taken', width: 90, align: 'right' },
      ],
      rows: rows.map((r) => [
        date(r.report_date ?? r.created_at),
        r.projectName,
        monthLabel(r.monthKey),
        money(r.income),
        money(r.expense),
        money(r.profit),
        r.pool_taken ? money(r.pool_taken) : '—',
      ]),
      filename: 'TheXCompany_Daily_Reports',
      note: 'As submitted by project managers.',
    })
    toast.success('PDF downloaded')
  }

  return (
    <Page>
      <PageHeader
        title="Daily Reports"
        description="Everything managers have submitted, across every project"
        actions={
          <>
            <Button
              variant="outline"
              disabled={rows.length === 0}
              onClick={() => {
                downloadCsv(
                  'daily_reports',
                  rows.map((r) => ({
                    date: r.report_date ?? r.created_at,
                    project: r.projectName,
                    month: r.monthKey,
                    income: r.income,
                    expense: r.expense,
                    result: r.profit,
                    pool_taken: r.pool_taken ?? 0,
                    submitted_at: r.created_at,
                  }))
                )
                toast.success('Exported')
              }}
            >
              <Download aria-hidden="true" />
              CSV
            </Button>
            <Button onClick={exportPdf} disabled={rows.length === 0}>
              <FileText aria-hidden="true" />
              PDF
            </Button>
          </>
        }
      />

      <PageBody className="space-y-4">
        <StatGrid cols={4}>
          <StatCard
            label="Revenue"
            value={money(totals.income)}
            hint={hasFilters ? 'Filtered' : 'All submissions'}
            icon={TrendingUp}
          />
          <StatCard label="Expense" value={money(totals.expense)} hint={hasFilters ? 'Filtered' : 'All submissions'} />
          <StatCard
            label="Net result"
            value={money(totals.profit)}
            tone={totals.profit >= 0 ? 'positive' : 'negative'}
            icon={totals.profit >= 0 ? TrendingUp : TrendingDown}
          />
          <StatCard label="Pool drawn" value={money(totals.pool)} hint="Recorded on entries" icon={Wallet} />
        </StatGrid>

        <SectionCard flush>
          <div className="px-4 pt-4 sm:px-5">
            <Toolbar>
              <SearchInput value={search} onChange={setSearch} placeholder="Search project…" />
              <FilterSelect
                label="Project"
                value={project}
                onChange={setProject}
                options={[
                  { value: 'all', label: 'All projects' },
                  ...(query.data?.businesses ?? []).map((b) => ({ value: String(b.id), label: b.name })),
                ]}
              />
              <FilterSelect
                label="Period"
                value={month}
                onChange={setMonth}
                options={[
                  { value: 'all', label: 'All periods' },
                  ...months.map((m) => ({ value: m, label: monthLabel(m) })),
                ]}
              />
              <ToolbarSpacer />
              <p className="text-[13px] text-muted-foreground">
                {number(rows.length)} {rows.length === 1 ? 'entry' : 'entries'}
              </p>
            </Toolbar>
          </div>

          <AsyncView
            query={query}
            skeletonProps={{ columns: 7 }}
            empty={{
              icon: FileText,
              title: 'No reports submitted yet',
              description: 'Managers log income and expense from Daily Entry.',
              action: (
                <Button asChild>
                  <Link to="/app/ops/daily-entry">Log an entry</Link>
                </Button>
              ),
            }}
          >
            {() =>
              rows.length === 0 ? (
                <EmptyState compact icon={FileText} title="No reports match these filters" />
              ) : (
                <TableWrap>
                  <Table>
                    <THead>
                      <TR>
                        <TH>Date</TH>
                        <TH>Project</TH>
                        <TH>Period</TH>
                        <TH numeric>Revenue</TH>
                        <TH numeric>Expense</TH>
                        <TH numeric>Result</TH>
                        <TH numeric>Pool taken</TH>
                        <TH>Submitted</TH>
                      </TR>
                    </THead>
                    <TBody>
                      {rows.map((r, i) => (
                        <TR key={r.id ?? i}>
                          <TD>
                            <span className="whitespace-nowrap">{date(r.report_date ?? r.created_at)}</span>
                          </TD>
                          <TD>
                            <Link to={`/app/projects/${r.business_id}`} className="font-medium hover:underline">
                              {r.projectName}
                            </Link>
                          </TD>
                          <TD>
                            <span className="whitespace-nowrap text-[13px] text-muted-foreground">
                              {monthLabel(r.monthKey)}
                            </span>
                          </TD>
                          <TD numeric>{money(r.income)}</TD>
                          <TD numeric>{money(r.expense)}</TD>
                          <TD numeric>
                            <span
                              className={
                                r.profit >= 0
                                  ? 'font-medium text-[hsl(var(--success))]'
                                  : 'font-medium text-[hsl(var(--destructive))]'
                              }
                            >
                              {money(r.profit)}
                            </span>
                          </TD>
                          <TD numeric>
                            {r.pool_taken ? money(r.pool_taken) : <span className="text-muted-foreground">—</span>}
                          </TD>
                          <TD>
                            <span
                              className="whitespace-nowrap text-[13px] text-muted-foreground"
                              title={dateTime(r.created_at)}
                            >
                              {relativeTime(r.created_at)}
                            </span>
                          </TD>
                        </TR>
                      ))}
                    </TBody>
                    <TFoot>
                      <TR>
                        <TD colSpan={3} className="font-medium">
                          Totals{hasFilters ? ' (filtered)' : ''}
                        </TD>
                        <TD numeric>{money(totals.income)}</TD>
                        <TD numeric>{money(totals.expense)}</TD>
                        <TD numeric>{money(totals.profit)}</TD>
                        <TD numeric>{money(totals.pool)}</TD>
                        <TD />
                      </TR>
                    </TFoot>
                  </Table>
                </TableWrap>
              )
            }
          </AsyncView>
        </SectionCard>
      </PageBody>
    </Page>
  )
}
