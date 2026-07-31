import * as React from 'react'
import { Link } from 'react-router-dom'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts'
import { Check, Coins, Download, TrendingUp, Users, X } from 'lucide-react'
import { Page, PageHeader, PageBody } from '@/components/patterns/Page'
import { StatCard, StatGrid } from '@/components/patterns/StatCard'
import { SectionCard, DetailList, DetailRow, SplitLayout } from '@/components/patterns/SectionCard'
import { Badge, StatusBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/dialog'
import { AsyncView, EmptyState } from '@/components/ui/states'
import { TableWrap, Table, THead, TBody, TFoot, TR, TH, TD } from '@/components/ui/table'
import { useQuery, useMutation } from '@/lib/useQuery'
import { equity, people, pool } from '@/lib/api'
import { sharePrice, shareHolding, poolBalances, WEEKLY_SHARE_BUY_CAP } from '@/lib/calc'
import { money, moneyPrecise, number, percent, date, dateTime, initials } from '@/lib/format'
import { downloadCsv } from '@/lib/export'
import toast from 'react-hot-toast'

/* =====================================================================
   Equity — share price, cap table and pending purchase approvals.

   This module existed in code but was unreachable: `showCompanyShareMarket()`
   had no sidebar entry, no button, no route. The only way to open it was to
   call the function from the browser console. An entire feature — employees
   buying and selling shares in the company — was effectively invisible.

   It is now a first-class page under Finance.

   Approving a purchase performs the same two writes as before, in the same
   order: credit the shares, then add the money to the bank side of the pool.
   That sequence is not transactional (SRS D-13); the risk is stated in the
   confirmation rather than hidden.

   Selling is intentionally left out of this page for now. The legacy sell path
   burns shares, drains cash then bank, and produces a UPI payout link with no
   ledger entry and no transaction — porting it as-is would spread a known
   money bug into new code. It stays on the founder console until it can be
   moved into a Postgres function.
   ===================================================================== */

function PriceTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-[--radius] border border-border bg-popover px-3 py-2 text-xs shadow-[--shadow-md]">
      <p className="mb-0.5 text-muted-foreground">{date(label)}</p>
      <p className="font-medium tabular">{moneyPrecise(payload[0].value)}</p>
    </div>
  )
}

export default function EquityPage() {
  const [pendingApprove, setPendingApprove] = React.useState(null)
  const [pendingReject, setPendingReject] = React.useState(null)

  const query = useQuery(async () => {
    const [companyValue, totalShares, ledger, team, history] = await Promise.all([
      equity.companyValue().catch(() => 0),
      equity.totalShares().catch(() => 0),
      equity.ledger().catch(() => []),
      people.listBasic().catch(() => []),
      equity.priceHistory(30).catch(() => []),
    ])

    const nameById = new Map(team.map((p) => [String(p.id), p.name]))
    const byHolder = new Map()
    for (const row of ledger) {
      const key = String(row.employee_id)
      const arr = byHolder.get(key) ?? []
      arr.push(row)
      byHolder.set(key, arr)
    }

    const price = sharePrice(companyValue, totalShares)
    const holders = [...byHolder.entries()]
      .map(([employeeId, rows]) => {
        const holding = shareHolding(rows)
        return {
          employeeId,
          name: nameById.get(employeeId) ?? 'Unknown holder',
          ...holding,
          value: holding.total * price,
        }
      })
      .filter((h) => h.total !== 0)
      .sort((a, b) => b.total - a.total)

    const issued = ledger.reduce((s, r) => s + (Number(r.shares) || 0), 0)

    return {
      companyValue,
      totalShares,
      price,
      holders,
      issued,
      unissued: totalShares - issued,
      history,
    }
  }, [])

  const requestsQuery = useQuery(() => equity.buyRequests('PENDING').catch(() => []), [])

  const approve = useMutation(
    async (request) => {
      // Same order as the legacy approveShareBuyRequest: shares first, money second.
      await equity.grant({ employeeId: request.employee_id, shares: Number(request.qty) || 0, locked: false })
      const balances = poolBalances(await pool.latest())
      await pool.recordMovement({
        cash: balances.cash,
        bank: balances.bank + (Number(request.amount) || 0),
        source: 'BANK',
        type: 'ADD',
        amount: Number(request.amount) || 0,
        fromText: 'Share purchase',
        reason: `Share purchase approved — ${number(request.qty)} shares (txn ${request.transaction_id ?? '—'})`,
      })
      await equity.setBuyRequestStatus(request.id, 'APPROVED')
    },
    {
      onSuccess: () => {
        toast.success('Purchase approved and shares credited')
        setPendingApprove(null)
        query.refetch()
        requestsQuery.refetch()
      },
      onError: (e) => toast.error(e.message),
    }
  )

  const reject = useMutation((id) => equity.setBuyRequestStatus(id, 'REJECTED'), {
    onSuccess: () => {
      toast.success('Request rejected')
      setPendingReject(null)
      requestsQuery.refetch()
    },
    onError: (e) => toast.error(e.message),
  })

  const d = query.data
  const chartData = React.useMemo(
    () => (d?.history ?? []).map((h) => ({ at: h.created_at, price: Number(h.price) || 0 })),
    [d]
  )
  const requests = requestsQuery.data ?? []

  return (
    <Page>
      <PageHeader
        title="Equity"
        description="Share price, who holds what, and purchase approvals"
        actions={
          <Button
            variant="outline"
            disabled={!d || d.holders.length === 0}
            onClick={() => {
              downloadCsv(
                'cap_table',
                d.holders.map((h) => ({
                  holder: h.name,
                  total_shares: h.total,
                  locked_shares: h.locked,
                  sellable_shares: h.available,
                  value_at_current_price: h.value.toFixed(2),
                  ownership_percent: d.totalShares > 0 ? ((h.total / d.totalShares) * 100).toFixed(3) : '',
                }))
              )
              toast.success('Exported')
            }}
          >
            <Download aria-hidden="true" />
            Export cap table
          </Button>
        }
      />

      <PageBody className="space-y-4">
        <StatGrid cols={4}>
          <StatCard
            label="Share price"
            value={d ? moneyPrecise(d.price) : '—'}
            hint={d?.totalShares ? `${number(d.totalShares)} shares issued in total` : 'Set total shares in Settings'}
            icon={TrendingUp}
            loading={query.loading}
          />
          <StatCard
            label="Company valuation"
            value={d ? money(d.companyValue) : '—'}
            hint="Set manually in Settings"
            icon={Coins}
            loading={query.loading}
          />
          <StatCard
            label="Shares held"
            value={d ? number(d.issued) : '—'}
            hint={d?.totalShares ? `${percent((d.issued / (d.totalShares || 1)) * 100)} of total` : undefined}
            icon={Users}
            loading={query.loading}
          />
          <StatCard
            label="Available to buy"
            value={d ? number(Math.max(0, d.unissued)) : '—'}
            hint={`Cap ${number(WEEKLY_SHARE_BUY_CAP)} per person per week`}
            loading={query.loading}
          />
        </StatGrid>

        {/* Approvals first — this is the only part of the page that needs action. */}
        {requests.length > 0 && (
          <SectionCard
            title="Pending purchase requests"
            description={`${requests.length} waiting on approval`}
            flush
          >
            <TableWrap>
              <Table>
                <THead>
                  <TR>
                    <TH>Requested</TH>
                    <TH numeric>Shares</TH>
                    <TH numeric>Rate</TH>
                    <TH numeric>Amount</TH>
                    <TH>Transaction</TH>
                    <TH className="w-[190px]" />
                  </TR>
                </THead>
                <TBody>
                  {requests.map((r) => (
                    <TR key={r.id}>
                      <TD>
                        <span className="whitespace-nowrap text-[13px]">{dateTime(r.created_at)}</span>
                      </TD>
                      <TD numeric>{number(r.qty)}</TD>
                      <TD numeric>{moneyPrecise(r.rate)}</TD>
                      <TD numeric>
                        <span className="font-medium">{money(r.amount)}</span>
                      </TD>
                      <TD>
                        <span className="font-mono text-xs">{r.transaction_id ?? '—'}</span>
                      </TD>
                      <TD>
                        <div className="flex items-center justify-end gap-1.5">
                          <Button size="sm" variant="outline" onClick={() => setPendingReject(r)}>
                            <X aria-hidden="true" />
                            Reject
                          </Button>
                          <Button size="sm" onClick={() => setPendingApprove(r)}>
                            <Check aria-hidden="true" />
                            Approve
                          </Button>
                        </div>
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </TableWrap>
          </SectionCard>
        )}

        <SplitLayout
          main={
            <>
              <SectionCard title="Share price history" description="Recorded price points">
                {chartData.length < 2 ? (
                  <EmptyState
                    compact
                    icon={TrendingUp}
                    title="Not enough history"
                    description="Price points are recorded in share_price_history. Two or more are needed to draw a trend."
                  />
                ) : (
                  <div className="h-[240px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 6, right: 10, left: 6, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                        <XAxis
                          dataKey="at"
                          tickFormatter={(v) => date(v).slice(0, 6)}
                          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                          axisLine={{ stroke: 'hsl(var(--border))' }}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                          axisLine={false}
                          tickLine={false}
                          width={56}
                          tickFormatter={(v) => `₹${v}`}
                        />
                        <Tooltip content={<PriceTooltip />} />
                        <Line
                          type="monotone"
                          dataKey="price"
                          stroke="hsl(var(--chart-1))"
                          strokeWidth={2}
                          dot={{ r: 2 }}
                          activeDot={{ r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </SectionCard>

              <SectionCard title="Cap table" description="Who holds shares and what they are worth" flush>
                <AsyncView
                  query={query}
                  skeletonProps={{ columns: 5 }}
                  empty={{
                    icon: Users,
                    title: 'No shares issued yet',
                    description: 'Grants and purchases appear here once recorded in the share ledger.',
                  }}
                >
                  {() =>
                    d.holders.length === 0 ? (
                      <EmptyState compact icon={Users} title="No holders yet" />
                    ) : (
                      <TableWrap>
                        <Table>
                          <THead>
                            <TR>
                              <TH>Holder</TH>
                              <TH numeric>Shares</TH>
                              <TH numeric>Locked</TH>
                              <TH numeric>Sellable</TH>
                              <TH numeric>Ownership</TH>
                              <TH numeric>Value</TH>
                            </TR>
                          </THead>
                          <TBody>
                            {d.holders.map((h) => (
                              <TR key={h.employeeId}>
                                <TD>
                                  <div className="flex items-center gap-2.5">
                                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold">
                                      {initials(h.name)}
                                    </span>
                                    <Link to={`/app/team/${h.employeeId}`} className="font-medium hover:underline">
                                      {h.name}
                                    </Link>
                                  </div>
                                </TD>
                                <TD numeric>{number(h.total)}</TD>
                                <TD numeric>
                                  {h.locked > 0 ? (
                                    <Badge size="sm" tone="warning">
                                      {number(h.locked)}
                                    </Badge>
                                  ) : (
                                    <span className="text-muted-foreground">—</span>
                                  )}
                                </TD>
                                <TD numeric>{number(h.available)}</TD>
                                <TD numeric>
                                  {d.totalShares > 0 ? percent((h.total / d.totalShares) * 100, 2) : '—'}
                                </TD>
                                <TD numeric>
                                  <span className="font-medium">{money(h.value)}</span>
                                </TD>
                              </TR>
                            ))}
                          </TBody>
                          <TFoot>
                            <TR>
                              <TD className="font-medium">
                                {d.holders.length} {d.holders.length === 1 ? 'holder' : 'holders'}
                              </TD>
                              <TD numeric>{number(d.issued)}</TD>
                              <TD colSpan={2} />
                              <TD numeric>
                                {d.totalShares > 0 ? percent((d.issued / d.totalShares) * 100, 2) : '—'}
                              </TD>
                              <TD numeric>{money(d.issued * d.price)}</TD>
                            </TR>
                          </TFoot>
                        </Table>
                      </TableWrap>
                    )
                  }
                </AsyncView>
              </SectionCard>
            </>
          }
          aside={
            <>
              <SectionCard title="How the price is set">
                <DetailList>
                  <DetailRow label="Company valuation">{d ? money(d.companyValue) : '—'}</DetailRow>
                  <DetailRow label="Total shares">{d ? number(d.totalShares) : '—'}</DetailRow>
                  <DetailRow label="Price per share" className="font-semibold">
                    {d ? moneyPrecise(d.price) : '—'}
                  </DetailRow>
                </DetailList>
                <p className="mt-3 text-[13px] text-muted-foreground">
                  Valuation is entered by hand, not derived from project performance. Change it in Settings and every
                  holding is revalued.
                </p>
                <Button variant="outline" size="sm" className="mt-3 w-full" asChild>
                  <Link to="/app/settings">Open settings</Link>
                </Button>
              </SectionCard>

              <SectionCard title="Selling shares" bodyClassName="p-4 space-y-3 text-[13px] text-muted-foreground">
                <p>
                  Buybacks pay out from the pool — cash first, then bank — and generate a UPI payout link. That path has
                  not moved into this console yet because it writes to two tables without a transaction.
                </p>
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <a href="/founder.html" target="_blank" rel="noopener noreferrer">
                    Open on founder console
                  </a>
                </Button>
              </SectionCard>
            </>
          }
        />
      </PageBody>

      <ConfirmDialog
        open={Boolean(pendingApprove)}
        onClose={() => setPendingApprove(null)}
        onConfirm={() => approve.run(pendingApprove)}
        title={`Approve purchase of ${number(pendingApprove?.qty)} shares?`}
        description={`${money(pendingApprove?.amount)} will be added to the bank side of the pool and the shares credited to the buyer. These are two separate writes — if the second fails the shares will already be credited.`}
        confirmLabel="Approve purchase"
        busy={approve.busy}
      />

      <ConfirmDialog
        open={Boolean(pendingReject)}
        onClose={() => setPendingReject(null)}
        onConfirm={() => reject.run(pendingReject.id)}
        title="Reject this purchase request?"
        description="No shares are credited and no money is recorded. Any payment already made must be refunded outside the app."
        confirmLabel="Reject"
        destructive
        busy={reject.busy}
      />
    </Page>
  )
}
