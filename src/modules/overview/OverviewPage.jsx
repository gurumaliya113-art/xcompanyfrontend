import * as React from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  Briefcase,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Mail,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react'
import { Page, PageHeader, PageBody } from '@/components/patterns/Page'
import { StatCard, StatGrid } from '@/components/patterns/StatCard'
import { SectionCard, ViewAllLink, SplitLayout } from '@/components/patterns/SectionCard'
import { Badge, StatusBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState, ErrorState, CardSkeleton, Skeleton } from '@/components/ui/states'
import { TableWrap, Table, THead, TBody, TR, TH, TD } from '@/components/ui/table'
import { useQuery } from '@/lib/useQuery'
import { useSession } from '@/app/session'
import { quickActionsForRole } from '@/app/navigation'
import { pool, equity, people, businesses, reports, tasks, leads, dce } from '@/lib/api'
import {
  poolBalances,
  sharePrice,
  businessPerformance,
  reportProfit,
  businessValuation,
} from '@/lib/calc'
import { money, moneyCompact, moneyPrecise, number, date, relativeTime, truncate } from '@/lib/format'

/* =====================================================================
   Overview — the answer to "what needs attention today?"

   The legacy dashboard showed four vanity cards (Employees, Businesses,
   Company Value, Share Price), a share-price chart that fell back to
   hardcoded demo data, a "Value Breakdown" built from three hardcoded
   percentages, a static "Company Layers" panel that linked nowhere, and
   Quick Actions implemented as `.sidebar-nav a:nth-child(3).click()`.
   None of it told the founder what to do next.

   This rebuild keeps the numbers people relied on but leads with work:
     Row 1  Money, equity and portfolio health — the four numbers that matter
     Row 2  Attention list (overdue deadlines, unclaimed tasks, new leads)
     Row 3  Running projects · Upcoming meetings · Recent activity
     Rail   Quick actions, recent clients

   Everything on this page links somewhere. Nothing is decorative.
   ===================================================================== */

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export default function OverviewPage() {
  const { user, role, isLeadership } = useSession()
  const actions = React.useMemo(() => quickActionsForRole(role).slice(0, 6), [role])

  /* One query per concern, run in parallel. Each block degrades on its own,
     so a locked-down table cannot blank the whole dashboard. */

  const financeQuery = useQuery(
    async () => {
      const [latest, companyValue, totalShares] = await Promise.all([
        pool.latest(),
        equity.companyValue().catch(() => 0),
        equity.totalShares().catch(() => 0),
      ])
      return { balances: poolBalances(latest), companyValue, totalShares }
    },
    [],
    { enabled: isLeadership }
  )

  const portfolioQuery = useQuery(async () => {
    const [bizList, reportRows] = await Promise.all([businesses.list(), reports.list().catch(() => [])])
    const byBusiness = new Map()
    for (const r of reportRows) {
      const arr = byBusiness.get(String(r.business_id)) ?? []
      arr.push(r)
      byBusiness.set(String(r.business_id), arr)
    }
    const enriched = bizList.map((b) => {
      const rows = byBusiness.get(String(b.id)) ?? []
      return { ...b, perf: businessPerformance(rows, businessValuation(b)), lastReport: rows[0] ?? null }
    })
    const totals = enriched.reduce(
      (acc, b) => {
        acc.revenue += b.perf.revenue
        acc.invested += b.perf.invested
        acc.net += b.perf.net
        acc.valuation += b.perf.valuation
        return acc
      },
      { revenue: 0, invested: 0, net: 0, valuation: 0 }
    )
    return { list: enriched, totals, reportRows }
  }, [])

  const teamQuery = useQuery(async () => people.list().catch(() => []), [], { enabled: isLeadership })

  const tasksQuery = useQuery(async () => tasks.list().catch(() => []), [])

  const leadsQuery = useQuery(async () => leads.enquiries().catch(() => []), [], { enabled: isLeadership })

  const activityQuery = useQuery(async () => dce.auditLogs({ limit: 8 }).catch(() => []), [])

  /* ---------------- derived: the attention list ---------------- */

  const attention = React.useMemo(() => {
    const items = []
    const today = todayISO()

    const openTasks = (tasksQuery.data ?? []).filter((t) => !t.accepted_by)
    if (openTasks.length > 0) {
      items.push({
        id: 'unclaimed-tasks',
        tone: 'warning',
        icon: ClipboardList,
        title: `${openTasks.length} ${openTasks.length === 1 ? 'task' : 'tasks'} unclaimed`,
        detail: truncate(openTasks[0].title, 48),
        to: '/app/ops/tasks',
      })
    }

    const overdue = (tasksQuery.data ?? []).filter(
      (t) => t.deadline && t.deadline < today && t.status !== 'COMPLETED'
    )
    if (overdue.length > 0) {
      items.push({
        id: 'overdue-tasks',
        tone: 'danger',
        icon: AlertTriangle,
        title: `${overdue.length} past deadline`,
        detail: `Oldest: ${truncate(overdue[0].title, 36)} · ${date(overdue[0].deadline)}`,
        to: '/app/ops/tasks',
      })
    }

    const newLeads = (leadsQuery.data ?? []).filter(
      (l) => l.created_at && Date.now() - new Date(l.created_at).getTime() < 7 * 86400000
    )
    if (newLeads.length > 0) {
      items.push({
        id: 'new-leads',
        tone: 'info',
        icon: Mail,
        title: `${newLeads.length} new ${newLeads.length === 1 ? 'enquiry' : 'enquiries'} this week`,
        detail: truncate(newLeads[0].name, 40),
        to: '/app/clients/enquiries',
      })
    }

    // Businesses that have not reported in over a week are the single most
    // common reason the founder's numbers look wrong.
    const stale = (portfolioQuery.data?.list ?? []).filter((b) => {
      if (!b.lastReport?.created_at) return true
      return Date.now() - new Date(b.lastReport.created_at).getTime() > 7 * 86400000
    })
    if (stale.length > 0) {
      items.push({
        id: 'stale-reports',
        tone: 'warning',
        icon: Briefcase,
        title: `${stale.length} ${stale.length === 1 ? 'project has' : 'projects have'} no recent report`,
        detail: stale.slice(0, 2).map((b) => b.name).join(', '),
        to: '/app/ops/reports',
      })
    }

    const balances = financeQuery.data?.balances
    if (balances && balances.total <= 0) {
      items.push({
        id: 'pool-empty',
        tone: 'danger',
        icon: Wallet,
        title: 'Money pool is empty',
        detail: 'No cash or bank balance recorded',
        to: '/app/finance/pool',
      })
    }

    return items
  }, [tasksQuery.data, leadsQuery.data, portfolioQuery.data, financeQuery.data])

  const runningProjects = React.useMemo(
    () =>
      [...(portfolioQuery.data?.list ?? [])]
        .sort((a, b) => b.perf.net - a.perf.net)
        .slice(0, 6),
    [portfolioQuery.data]
  )

  const recentLeads = React.useMemo(() => (leadsQuery.data ?? []).slice(0, 5), [leadsQuery.data])

  const todaysReports = React.useMemo(() => {
    const today = todayISO()
    return (portfolioQuery.data?.reportRows ?? []).filter(
      (r) => (r.report_date ?? r.created_at ?? '').slice(0, 10) === today
    )
  }, [portfolioQuery.data])

  const price =
    financeQuery.data ? sharePrice(financeQuery.data.companyValue, financeQuery.data.totalShares) : 0

  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  })()

  return (
    <Page>
      <PageHeader
        title={`${greeting}${user?.name ? `, ${String(user.name).split(' ')[0]}` : ''}`}
        description={new Date().toLocaleDateString('en-IN', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })}
        actions={
          <>
            <Button variant="outline" asChild>
              <Link to="/app/ops/daily-entry">
                <ClipboardList aria-hidden="true" />
                Log entry
              </Link>
            </Button>
            <Button asChild>
              <Link to="/app/ai">Ask X-Ai</Link>
            </Button>
          </>
        }
      />

      <PageBody className="space-y-4">
        {/* Row 1 — the four numbers that actually matter */}
        {isLeadership ? (
          financeQuery.loading && portfolioQuery.loading ? (
            <CardSkeleton count={4} />
          ) : (
            <StatGrid cols={4}>
              <StatCard
                label="Money pool"
                value={money(financeQuery.data?.balances.total ?? 0)}
                hint={
                  financeQuery.data
                    ? `Cash ${moneyCompact(financeQuery.data.balances.cash)} · Bank ${moneyCompact(financeQuery.data.balances.bank)}`
                    : undefined
                }
                icon={Wallet}
                to="/app/finance/pool"
                loading={financeQuery.loading}
              />
              <StatCard
                label="Share price"
                value={moneyPrecise(price)}
                hint={
                  financeQuery.data?.totalShares
                    ? `${number(financeQuery.data.totalShares)} shares issued`
                    : 'Set total shares in Settings'
                }
                icon={TrendingUp}
                to="/app/finance/equity"
                loading={financeQuery.loading}
              />
              <StatCard
                label="Portfolio net result"
                value={money(portfolioQuery.data?.totals.net ?? 0)}
                tone={(portfolioQuery.data?.totals.net ?? 0) >= 0 ? 'positive' : 'negative'}
                hint={`Revenue ${moneyCompact(portfolioQuery.data?.totals.revenue ?? 0)} · Spend ${moneyCompact(portfolioQuery.data?.totals.invested ?? 0)}`}
                icon={Briefcase}
                to="/app/projects"
                loading={portfolioQuery.loading}
              />
              <StatCard
                label="Team"
                value={number((teamQuery.data ?? []).length)}
                hint={`${(portfolioQuery.data?.list ?? []).length} active projects`}
                icon={Users}
                to="/app/team"
                loading={teamQuery.loading}
              />
            </StatGrid>
          )
        ) : null}

        {/* Row 2 — needs attention */}
        <SectionCard
          title="Needs attention"
          description={
            attention.length === 0 ? 'Nothing is waiting on you' : `${attention.length} item${attention.length === 1 ? '' : 's'}`
          }
          flush
        >
          {tasksQuery.loading && portfolioQuery.loading ? (
            <div className="space-y-2 p-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : attention.length === 0 ? (
            <EmptyState
              compact
              icon={CheckCircle2}
              title="All clear"
              description="No overdue work, unclaimed tasks or stale reports right now."
            />
          ) : (
            <ul className="divide-y divide-border">
              {attention.map((item) => (
                <li key={item.id}>
                  <Link
                    to={item.to}
                    className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/60 sm:px-5"
                  >
                    <span
                      className={
                        item.tone === 'danger'
                          ? 'flex size-8 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--destructive-soft))] text-[hsl(var(--destructive))]'
                          : item.tone === 'warning'
                            ? 'flex size-8 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--warning-soft))] text-[hsl(var(--warning))]'
                            : 'flex size-8 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--info-soft))] text-[hsl(var(--info))]'
                      }
                    >
                      <item.icon className="size-4" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{item.title}</span>
                      {item.detail && (
                        <span className="block truncate text-[13px] text-muted-foreground">{item.detail}</span>
                      )}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        {/* Row 3 */}
        <SplitLayout
          main={
            <>
              <SectionCard
                title="Running projects"
                description="Ranked by net result"
                actions={<ViewAllLink to="/app/projects" />}
                flush
              >
                {portfolioQuery.error ? (
                  <ErrorState error={portfolioQuery.error} onRetry={portfolioQuery.refetch} />
                ) : runningProjects.length === 0 ? (
                  <EmptyState
                    compact
                    icon={Briefcase}
                    title="No projects yet"
                    description="Add your first venture to start tracking performance."
                    action={
                      <Button size="sm" asChild>
                        <Link to="/app/projects?new=1">Add project</Link>
                      </Button>
                    }
                  />
                ) : (
                  <TableWrap>
                    <Table>
                      <THead>
                        <TR>
                          <TH>Project</TH>
                          <TH numeric>Revenue</TH>
                          <TH numeric>Spend</TH>
                          <TH numeric>Net</TH>
                          <TH>Last report</TH>
                        </TR>
                      </THead>
                      <TBody>
                        {runningProjects.map((b) => (
                          <TR key={b.id} interactive>
                            <TD>
                              <Link to={`/app/projects/${b.id}`} className="font-medium hover:underline">
                                {b.name}
                              </Link>
                              {b.type && (
                                <span className="ml-2 text-xs capitalize text-muted-foreground">{b.type}</span>
                              )}
                            </TD>
                            <TD numeric>{money(b.perf.revenue)}</TD>
                            <TD numeric>{money(b.perf.invested)}</TD>
                            <TD numeric>
                              <span
                                className={
                                  b.perf.net >= 0
                                    ? 'font-medium text-[hsl(var(--success))]'
                                    : 'font-medium text-[hsl(var(--destructive))]'
                                }
                              >
                                {money(b.perf.net)}
                              </span>
                            </TD>
                            <TD>
                              <span className="text-[13px] text-muted-foreground">
                                {b.lastReport?.created_at ? relativeTime(b.lastReport.created_at) : 'Never'}
                              </span>
                            </TD>
                          </TR>
                        ))}
                      </TBody>
                    </Table>
                  </TableWrap>
                )}
              </SectionCard>

              <SectionCard
                title="Recent activity"
                description="Audit trail across every business"
                actions={<ViewAllLink to="/app/activity" />}
                flush
              >
                {(activityQuery.data ?? []).length === 0 ? (
                  <EmptyState
                    compact
                    icon={CalendarClock}
                    title="No activity recorded"
                    description="Events appear here as work happens across the workspace."
                  />
                ) : (
                  <ul className="divide-y divide-border">
                    {(activityQuery.data ?? []).map((log) => (
                      <li key={log.id} className="flex items-start gap-3 px-4 py-2.5 sm:px-5">
                        <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-border" aria-hidden="true" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13px]">{log.event_text}</span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {log.business_name}
                            {log.actor ? ` · ${log.actor}` : ''} · {relativeTime(log.inserted_at)}
                          </span>
                        </span>
                        {log.category && (
                          <Badge size="sm" className="shrink-0">
                            {log.category}
                          </Badge>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </SectionCard>
            </>
          }
          aside={
            <>
              <SectionCard title="Quick actions" bodyClassName="p-2">
                <div className="grid gap-1">
                  {actions.map((action) => (
                    <Link
                      key={action.to + action.label}
                      to={action.to}
                      className="flex items-center gap-2.5 rounded-[--radius] px-2.5 py-2 text-[13px] font-medium transition-colors hover:bg-muted"
                    >
                      <action.icon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                      <span className="truncate">{action.label}</span>
                    </Link>
                  ))}
                </div>
              </SectionCard>

              <SectionCard
                title="Today's entries"
                description={`${todaysReports.length} logged today`}
                flush
              >
                {todaysReports.length === 0 ? (
                  <EmptyState
                    compact
                    icon={ClipboardList}
                    title="Nothing logged today"
                    action={
                      <Button size="sm" variant="outline" asChild>
                        <Link to="/app/ops/daily-entry">Log entry</Link>
                      </Button>
                    }
                  />
                ) : (
                  <ul className="divide-y divide-border">
                    {todaysReports.slice(0, 5).map((r, i) => (
                      <li key={r.id ?? i} className="flex items-center justify-between gap-3 px-4 py-2.5 sm:px-5">
                        <span className="min-w-0 flex-1 truncate text-[13px]">
                          {(portfolioQuery.data?.list ?? []).find((b) => String(b.id) === String(r.business_id))?.name ??
                            'Unknown project'}
                        </span>
                        <span
                          className={
                            reportProfit(r) >= 0
                              ? 'shrink-0 text-[13px] font-medium tabular text-[hsl(var(--success))]'
                              : 'shrink-0 text-[13px] font-medium tabular text-[hsl(var(--destructive))]'
                          }
                        >
                          {money(reportProfit(r))}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </SectionCard>

              {isLeadership && (
                <SectionCard title="Recent clients" actions={<ViewAllLink to="/app/clients/enquiries" />} flush>
                  {recentLeads.length === 0 ? (
                    <EmptyState compact icon={Mail} title="No enquiries yet" />
                  ) : (
                    <ul className="divide-y divide-border">
                      {recentLeads.map((lead) => (
                        <li key={lead.id} className="px-4 py-2.5 sm:px-5">
                          <div className="flex items-center justify-between gap-2">
                            <p className="min-w-0 truncate text-[13px] font-medium">{lead.name}</p>
                            <span className="shrink-0 text-xs text-muted-foreground">
                              {relativeTime(lead.created_at)}
                            </span>
                          </div>
                          <p className="truncate text-xs text-muted-foreground">
                            {lead.company || lead.phone || lead.email || '—'}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </SectionCard>
              )}
            </>
          }
        />
      </PageBody>
    </Page>
  )
}
