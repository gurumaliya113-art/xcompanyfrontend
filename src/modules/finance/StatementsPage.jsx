import * as React from 'react'
import { useSearchParams } from 'react-router-dom'
import { Download, FileText, Receipt } from 'lucide-react'
import { Page, PageHeader, PageBody, Toolbar, SearchInput, FilterSelect, ToolbarSpacer } from '@/components/patterns/Page'
import { StatCard, StatGrid } from '@/components/patterns/StatCard'
import { SectionCard } from '@/components/patterns/SectionCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Field, TextInput } from '@/components/ui/field'
import { AsyncView, EmptyState } from '@/components/ui/states'
import { TableWrap, Table, THead, TBody, TFoot, TR, TH, TD } from '@/components/ui/table'
import { useQuery } from '@/lib/useQuery'
import { pool } from '@/lib/api'
import { poolBalances, buildStatement } from '@/lib/calc'
import { money, signedMoney, dateTime, truncate } from '@/lib/format'
import { downloadCsv, downloadTablePdf } from '@/lib/export'
import toast from 'react-hot-toast'

/* =====================================================================
   Statements — the full money-in / money-out ledger with running balances.

   This screen already existed and was the most thoughtful thing in the legacy
   codebase: it reconciled the ledger against the real pool balance using an
   offset, so the closing balance always matched reality even though several
   code paths (share buybacks, `pool_taken`, and the silently-failing submit
   ledger insert) never wrote ledger rows.

   That logic is preserved exactly — it now lives in `calc.buildStatement` and
   is unit-testable. What changed is only the surface:

   - Filters were four bare inputs above the table with a "filterStatements()"
     button; they now apply live and are labelled.
   - The reconciliation offset was invisible. It is now shown as an explicit
     "Opening balance" row, so a founder can see why the ledger and the pool
     disagree instead of wondering whether the app is wrong.
   - Export was PDF-only; CSV is added because this is the one screen
     accountants ask for.
   ===================================================================== */

const SOURCE_OPTIONS = [
  { value: 'all', label: 'Cash and bank' },
  { value: 'CASH', label: 'Cash only' },
  { value: 'BANK', label: 'Bank only' },
]

const TYPE_OPTIONS = [
  { value: 'all', label: 'All movements' },
  { value: 'ADD', label: 'Money in' },
  { value: 'MINUS', label: 'Money out' },
]

export default function StatementsPage() {
  const [params, setParams] = useSearchParams()
  const [search, setSearch] = React.useState('')
  const [source, setSource] = React.useState(params.get('source') ?? 'all')
  const [type, setType] = React.useState('all')
  const [from, setFrom] = React.useState('')
  const [to, setTo] = React.useState('')

  const query = useQuery(async () => {
    const [ledgerAsc, latest] = await Promise.all([pool.ledger({ ascending: true }), pool.latest()])
    return { ledgerAsc, actual: poolBalances(latest) }
  }, [])

  // Running balances must be computed over the *full* ledger, then filtered
  // for display — otherwise a date filter would produce wrong balances.
  const statement = React.useMemo(
    () => buildStatement(query.data?.ledgerAsc ?? [], query.data?.actual ?? { cash: 0, bank: 0 }),
    [query.data]
  )

  const rows = React.useMemo(() => {
    let list = statement.rows
    if (source !== 'all') list = list.filter((r) => r.source === source)
    if (type !== 'all') list = list.filter((r) => r.type === type)
    if (from) list = list.filter((r) => String(r.created_at ?? '').slice(0, 10) >= from)
    if (to) list = list.filter((r) => String(r.created_at ?? '').slice(0, 10) <= to)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter((r) => `${r.from_text ?? ''} ${r.reason ?? ''}`.toLowerCase().includes(q))
    }
    return [...list].reverse() // newest first for reading
  }, [statement.rows, source, type, from, to, search])

  const filteredTotals = React.useMemo(
    () =>
      rows.reduce(
        (acc, r) => {
          acc.in += r.moneyIn
          acc.out += r.moneyOut
          return acc
        },
        { in: 0, out: 0 }
      ),
    [rows]
  )

  const hasFilters = source !== 'all' || type !== 'all' || Boolean(from) || Boolean(to) || Boolean(search)
  const periodLabel = from || to ? `${from || 'start'} to ${to || 'today'}` : 'All time'

  function updateSource(next) {
    setSource(next)
    setParams((prev) => {
      const p = new URLSearchParams(prev)
      if (next === 'all') p.delete('source')
      else p.set('source', next)
      return p
    })
  }

  function exportCsv() {
    downloadCsv(
      'money_pool_statement',
      rows.map((r) => ({
        datetime: r.created_at,
        account: r.source,
        direction: r.type === 'ADD' ? 'IN' : 'OUT',
        party: r.from_text ?? '',
        reason: r.reason ?? '',
        money_in: r.moneyIn || '',
        money_out: r.moneyOut || '',
        cash_balance: r.cashBal,
        bank_balance: r.bankBal,
      }))
    )
    toast.success(`Exported ${rows.length} rows`)
  }

  async function exportPdf() {
    await downloadTablePdf({
      title: 'Money Pool Statement',
      subtitle: `Period: ${periodLabel}${source !== 'all' ? ` · ${source === 'CASH' ? 'Cash' : 'Bank'} only` : ''}`,
      orientation: 'landscape',
      summary: [
        { label: 'Money in', value: money(filteredTotals.in) },
        { label: 'Money out', value: money(filteredTotals.out) },
        { label: 'Net', value: signedMoney(filteredTotals.in - filteredTotals.out) },
        { label: 'Closing balance', value: money(statement.closingCash + statement.closingBank) },
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
      rows: [...rows].reverse().map((r) => [
        dateTime(r.created_at),
        r.source === 'CASH' ? 'Cash' : 'Bank',
        r.from_text ?? '—',
        r.reason ?? '—',
        r.moneyIn ? money(r.moneyIn) : '',
        r.moneyOut ? money(r.moneyOut) : '',
        money(r.cashBal),
        money(r.bankBal),
      ]),
      filename: 'TheXCompany_MoneyPool_Statement',
      note: 'Opening balances reconcile the ledger to the recorded pool balance.',
    })
    toast.success('PDF downloaded')
  }

  const reconciliationGap =
    (query.data?.actual.cash ?? 0) + (query.data?.actual.bank ?? 0) -
    (statement.rows.reduce((s, r) => s + r.moneyIn - r.moneyOut, 0) + statement.openingCash + statement.openingBank)

  return (
    <Page>
      <PageHeader
        title="Statements"
        description="Every movement in and out of the money pool"
        actions={
          <>
            <Button variant="outline" onClick={exportCsv} disabled={rows.length === 0}>
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
          <StatCard label="Money in" value={money(filteredTotals.in)} hint={hasFilters ? 'Filtered' : 'All time'} />
          <StatCard label="Money out" value={money(filteredTotals.out)} hint={hasFilters ? 'Filtered' : 'All time'} />
          <StatCard
            label="Net movement"
            value={signedMoney(filteredTotals.in - filteredTotals.out)}
            tone={filteredTotals.in - filteredTotals.out >= 0 ? 'positive' : 'negative'}
          />
          <StatCard
            label="Closing balance"
            value={money(statement.closingCash + statement.closingBank)}
            hint={`Cash ${money(statement.closingCash)} · Bank ${money(statement.closingBank)}`}
            icon={Receipt}
          />
        </StatGrid>

        {/* Make the reconciliation visible rather than silent. */}
        {(statement.openingCash !== 0 || statement.openingBank !== 0) && (
          <div className="rounded-[--radius] border border-[hsl(var(--info)/0.25)] bg-[hsl(var(--info-soft))] px-4 py-3 text-[13px] text-[hsl(var(--info))]">
            <p className="font-medium">Opening balance applied</p>
            <p className="mt-0.5">
              Cash {money(statement.openingCash)} · Bank {money(statement.openingBank)}. Some balance changes (share
              buybacks, pool draws recorded on daily reports) never wrote a ledger row, so this offset keeps the closing
              balance equal to the actual pool.
            </p>
          </div>
        )}

        <SectionCard flush>
          <div className="space-y-3 px-4 pt-4 sm:px-5">
            <Toolbar className="mb-0">
              <SearchInput value={search} onChange={setSearch} placeholder="Search party or reason…" />
              <FilterSelect label="Account" value={source} onChange={updateSource} options={SOURCE_OPTIONS} />
              <FilterSelect label="Type" value={type} onChange={setType} options={TYPE_OPTIONS} />
              <ToolbarSpacer />
              {hasFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearch('')
                    updateSource('all')
                    setType('all')
                    setFrom('')
                    setTo('')
                  }}
                >
                  Clear filters
                </Button>
              )}
            </Toolbar>
            <div className="flex flex-wrap items-end gap-3 pb-1">
              <Field label="From" htmlFor="st-from" className="w-[160px]">
                <TextInput id="st-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
              </Field>
              <Field label="To" htmlFor="st-to" className="w-[160px]">
                <TextInput id="st-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
              </Field>
              <p className="pb-2 text-[13px] text-muted-foreground">
                {rows.length} {rows.length === 1 ? 'movement' : 'movements'}
              </p>
            </div>
          </div>

          <AsyncView
            query={query}
            skeletonProps={{ columns: 7 }}
            empty={{
              icon: Receipt,
              title: 'No movements recorded',
              description: 'The pool ledger is empty. Record a movement to begin.',
            }}
          >
            {() =>
              rows.length === 0 ? (
                <EmptyState compact icon={Receipt} title="No movements match these filters" />
              ) : (
                <TableWrap>
                  <Table>
                    <THead>
                      <TR>
                        <TH>Date &amp; time</TH>
                        <TH>Account</TH>
                        <TH>Party</TH>
                        <TH>Reason</TH>
                        <TH numeric>In</TH>
                        <TH numeric>Out</TH>
                        <TH numeric>Cash bal</TH>
                        <TH numeric>Bank bal</TH>
                      </TR>
                    </THead>
                    <TBody>
                      {rows.map((r) => (
                        <TR key={r.id}>
                          <TD>
                            <span className="whitespace-nowrap text-[13px]">{dateTime(r.created_at)}</span>
                          </TD>
                          <TD>
                            <Badge size="sm" tone={r.source === 'CASH' ? 'neutral' : 'info'}>
                              {r.source === 'CASH' ? 'Cash' : 'Bank'}
                            </Badge>
                          </TD>
                          <TD>{r.from_text || <span className="text-muted-foreground">—</span>}</TD>
                          <TD className="max-w-[300px]">
                            <span className="text-[13px] text-muted-foreground">{truncate(r.reason, 70) || '—'}</span>
                          </TD>
                          <TD numeric>
                            {r.moneyIn ? (
                              <span className="font-medium text-[hsl(var(--success))]">{money(r.moneyIn)}</span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TD>
                          <TD numeric>
                            {r.moneyOut ? (
                              <span className="font-medium text-[hsl(var(--destructive))]">{money(r.moneyOut)}</span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TD>
                          <TD numeric>{money(r.cashBal)}</TD>
                          <TD numeric>{money(r.bankBal)}</TD>
                        </TR>
                      ))}
                    </TBody>
                    <TFoot>
                      <TR>
                        <TD colSpan={4} className="font-medium">
                          Totals{hasFilters ? ' (filtered)' : ''}
                        </TD>
                        <TD numeric>{money(filteredTotals.in)}</TD>
                        <TD numeric>{money(filteredTotals.out)}</TD>
                        <TD numeric>{money(statement.closingCash)}</TD>
                        <TD numeric>{money(statement.closingBank)}</TD>
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
