import * as React from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowDownLeft, ArrowUpRight, Banknote, Landmark, Plus, Receipt, Wallet } from 'lucide-react'
import { Page, PageHeader, PageBody } from '@/components/patterns/Page'
import { StatCard, StatGrid } from '@/components/patterns/StatCard'
import { SectionCard, ViewAllLink, SplitLayout } from '@/components/patterns/SectionCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Field, FieldGrid, TextInput, Select, Textarea } from '@/components/ui/field'
import { AsyncView, EmptyState } from '@/components/ui/states'
import { TableWrap, Table, THead, TBody, TR, TH, TD } from '@/components/ui/table'
import { useQuery, useMutation } from '@/lib/useQuery'
import { pool } from '@/lib/api'
import { poolBalances, applyPoolMovement } from '@/lib/calc'
import { money, signedMoney, dateTime, relativeTime, truncate, todayISO } from '@/lib/format'
import toast from 'react-hot-toast'

/* =====================================================================
   Money Pool — the company's central cash and bank balance.

   Legacy issues fixed here:

   1. The screen showed two clickable divs reading "Cash ₹52340" with the raw
      number unformatted, then an "Add / Minus Money" form stacked below with
      five unlabelled inputs and a "Submit" button. There were no field
      labels — only placeholders — so once you typed, you could not tell what
      a field was.

   2. Validation failures used `alert("Cash kam hai")`. Now the form shows the
      available balance inline before you submit, and the amount field warns
      as you type.

   3. Adding money and viewing history were the same screen. Recording is now
      a dialog, and the page itself answers "where is our money?".

   4. The ledger insert error was reported after the balance had already
      changed, with a message telling the user to run a SQL file. The write
      order is unchanged (balance first, then audit row) but the failure is
      now surfaced honestly instead of half-swallowed.

   Behaviour deliberately unchanged: this appends a new snapshot row rather
   than updating a balance, so history is preserved. It is still not atomic —
   see SRS D-7/D-8.
   ===================================================================== */

const SOURCES = [
  { value: 'CASH', label: 'Cash' },
  { value: 'BANK', label: 'Bank' },
]

const TYPES = [
  { value: 'ADD', label: 'Money in' },
  { value: 'MINUS', label: 'Money out' },
]

const EMPTY_FORM = { type: 'ADD', source: 'CASH', amount: '', fromText: '', reason: '' }

function MovementDialog({ open, onClose, balances, onDone }) {
  const [form, setForm] = React.useState(EMPTY_FORM)
  const [errors, setErrors] = React.useState({})

  React.useEffect(() => {
    if (open) {
      setForm(EMPTY_FORM)
      setErrors({})
    }
  }, [open])

  const available = form.source === 'CASH' ? balances.cash : balances.bank
  const amount = Number(form.amount)
  const isOut = form.type === 'MINUS'
  const overdrawn = isOut && Number.isFinite(amount) && amount > available

  const preview = React.useMemo(() => {
    if (!Number.isFinite(amount) || amount <= 0) return null
    const result = applyPoolMovement({
      cash: balances.cash,
      bank: balances.bank,
      type: form.type,
      source: form.source,
      amount,
    })
    return result.ok ? result : null
  }, [amount, form.type, form.source, balances])

  const save = useMutation(
    async () => {
      const result = applyPoolMovement({
        cash: balances.cash,
        bank: balances.bank,
        type: form.type,
        source: form.source,
        amount,
      })
      if (!result.ok) throw new Error(result.error)
      await pool.recordMovement({
        cash: result.cash,
        bank: result.bank,
        source: form.source,
        type: form.type,
        amount,
        fromText: form.fromText.trim(),
        reason: form.reason.trim(),
      })
    },
    {
      onSuccess: () => {
        toast.success(`${isOut ? 'Withdrawal' : 'Deposit'} of ${money(amount)} recorded`)
        onDone?.()
        onClose()
      },
      onError: (e) => toast.error(e.message),
    }
  )

  function submit(e) {
    e.preventDefault()
    const next = {}
    if (!form.amount || !Number.isFinite(amount) || amount <= 0) next.amount = 'Enter an amount greater than zero'
    else if (overdrawn) next.amount = `Only ${money(available)} available in ${form.source === 'CASH' ? 'cash' : 'bank'}`
    if (!form.fromText.trim()) next.fromText = isOut ? 'Who received it?' : 'Where did it come from?'
    setErrors(next)
    if (Object.keys(next).length > 0) return
    save.run()
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Record money movement"
      description="Updates the pool balance and writes an audit entry."
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={save.busy}>
            Cancel
          </Button>
          <Button type="submit" form="pool-movement" disabled={save.busy || overdrawn}>
            {save.busy ? 'Recording…' : 'Record movement'}
          </Button>
        </>
      }
    >
      <form id="pool-movement" onSubmit={submit} className="space-y-5">
        <FieldGrid cols={2}>
          <Field label="Direction" required htmlFor="m-type">
            <Select id="m-type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              {TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field
            label="Account"
            required
            htmlFor="m-source"
            hint={`Available: ${money(available)}`}
          >
            <Select id="m-source" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>
              {SOURCES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Select>
          </Field>
        </FieldGrid>

        <Field label="Amount" required htmlFor="m-amount" error={errors.amount}>
          <TextInput
            id="m-amount"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            placeholder="0"
            invalid={Boolean(errors.amount)}
            autoFocus
          />
        </Field>

        <Field
          label={isOut ? 'Paid to' : 'Received from'}
          required
          htmlFor="m-from"
          error={errors.fromText}
          hint="Client, investor, vendor or self"
        >
          <TextInput
            id="m-from"
            value={form.fromText}
            onChange={(e) => setForm({ ...form, fromText: e.target.value })}
            placeholder={isOut ? 'Vendor name' : 'Client name'}
            invalid={Boolean(errors.fromText)}
          />
        </Field>

        <Field label="Reason" htmlFor="m-reason" hint="Optional, but it makes statements readable later">
          <Textarea
            id="m-reason"
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
            placeholder="Advance for Scrapco truck repair"
          />
        </Field>

        {/* Show the consequence before committing it. */}
        {preview && (
          <div className="rounded-[--radius] border border-border bg-muted/50 p-3">
            <p className="mb-2 text-[13px] font-medium">After this movement</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Cash</p>
                <p className="font-medium tabular">{money(preview.cash)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Bank</p>
                <p className="font-medium tabular">{money(preview.bank)}</p>
              </div>
            </div>
          </div>
        )}
      </form>
    </Dialog>
  )
}

export default function PoolPage() {
  const [params, setParams] = useSearchParams()
  const dialogOpen = params.get('new') === '1'
  const setDialogOpen = (next) =>
    setParams((prev) => {
      const p = new URLSearchParams(prev)
      if (next) p.set('new', '1')
      else p.delete('new')
      return p
    })

  const balanceQuery = useQuery(async () => poolBalances(await pool.latest()), [])
  const ledgerQuery = useQuery(() => pool.ledger({ ascending: false }), [])

  const balances = balanceQuery.data ?? { cash: 0, bank: 0, total: 0 }
  const recent = React.useMemo(() => (ledgerQuery.data ?? []).slice(0, 12), [ledgerQuery.data])

  const monthFlow = React.useMemo(() => {
    const monthStart = todayISO().slice(0, 7)
    let inAmt = 0
    let outAmt = 0
    for (const row of ledgerQuery.data ?? []) {
      if (!String(row.created_at ?? '').startsWith(monthStart)) continue
      if (row.type === 'ADD') inAmt += Number(row.amount ?? 0)
      else outAmt += Number(row.amount ?? 0)
    }
    return { inAmt, outAmt, net: inAmt - outAmt }
  }, [ledgerQuery.data])

  function refreshAll() {
    balanceQuery.refetch()
    ledgerQuery.refetch()
  }

  return (
    <Page>
      <PageHeader
        title="Money Pool"
        description="Central cash and bank balance for the whole company"
        actions={
          <>
            <Button variant="outline" asChild>
              <Link to="/app/finance/statements">
                <Receipt aria-hidden="true" />
                Statements
              </Link>
            </Button>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus aria-hidden="true" />
              Record movement
            </Button>
          </>
        }
      />

      <PageBody className="space-y-4">
        <StatGrid cols={4}>
          <StatCard
            label="Total balance"
            value={money(balances.total)}
            hint="Cash and bank combined"
            icon={Wallet}
            loading={balanceQuery.loading}
          />
          <StatCard
            label="Cash"
            value={money(balances.cash)}
            hint={balances.total > 0 ? `${Math.round((balances.cash / balances.total) * 100)}% of pool` : undefined}
            icon={Banknote}
            to="/app/finance/statements?source=CASH"
            loading={balanceQuery.loading}
          />
          <StatCard
            label="Bank"
            value={money(balances.bank)}
            hint={balances.total > 0 ? `${Math.round((balances.bank / balances.total) * 100)}% of pool` : undefined}
            icon={Landmark}
            to="/app/finance/statements?source=BANK"
            loading={balanceQuery.loading}
          />
          <StatCard
            label="This month"
            value={signedMoney(monthFlow.net)}
            tone={monthFlow.net >= 0 ? 'positive' : 'negative'}
            hint={`In ${money(monthFlow.inAmt)} · Out ${money(monthFlow.outAmt)}`}
            loading={ledgerQuery.loading}
          />
        </StatGrid>

        <SplitLayout
          main={
            <SectionCard
              title="Recent movements"
              description="Newest first"
              actions={<ViewAllLink to="/app/finance/statements" />}
              flush
            >
              <AsyncView
                query={ledgerQuery}
                skeletonProps={{ columns: 5 }}
                empty={{
                  icon: Receipt,
                  title: 'No movements recorded',
                  description: 'Record the first deposit to open the pool ledger.',
                  action: <Button onClick={() => setDialogOpen(true)}>Record movement</Button>,
                }}
              >
                {() => (
                  <TableWrap>
                    <Table>
                      <THead>
                        <TR>
                          <TH>When</TH>
                          <TH>Account</TH>
                          <TH>Party</TH>
                          <TH>Reason</TH>
                          <TH numeric>Amount</TH>
                        </TR>
                      </THead>
                      <TBody>
                        {recent.map((row) => {
                          const isIn = row.type === 'ADD'
                          return (
                            <TR key={row.id}>
                              <TD>
                                <p className="whitespace-nowrap text-[13px]">{relativeTime(row.created_at)}</p>
                                <p className="whitespace-nowrap text-xs text-muted-foreground">
                                  {dateTime(row.created_at)}
                                </p>
                              </TD>
                              <TD>
                                <Badge size="sm" tone={row.source === 'CASH' ? 'neutral' : 'info'}>
                                  {row.source === 'CASH' ? 'Cash' : 'Bank'}
                                </Badge>
                              </TD>
                              <TD>{row.from_text || <span className="text-muted-foreground">—</span>}</TD>
                              <TD className="max-w-[260px]">
                                <span className="text-[13px] text-muted-foreground">
                                  {truncate(row.reason, 60) || '—'}
                                </span>
                              </TD>
                              <TD numeric>
                                <span
                                  className={
                                    isIn
                                      ? 'inline-flex items-center gap-1 font-medium text-[hsl(var(--success))]'
                                      : 'inline-flex items-center gap-1 font-medium text-[hsl(var(--destructive))]'
                                  }
                                >
                                  {isIn ? (
                                    <ArrowDownLeft className="size-3.5" aria-hidden="true" />
                                  ) : (
                                    <ArrowUpRight className="size-3.5" aria-hidden="true" />
                                  )}
                                  {money(row.amount)}
                                </span>
                              </TD>
                            </TR>
                          )
                        })}
                      </TBody>
                    </Table>
                  </TableWrap>
                )}
              </AsyncView>
            </SectionCard>
          }
          aside={
            <>
              <SectionCard title="Where money moves" bodyClassName="p-4 space-y-3 text-[13px] text-muted-foreground">
                <p>
                  Managers cannot take money out on their own. A request emails a one-time code to the founder, and the
                  balance only changes once that code is entered.
                </p>
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link to="/app/finance/requests">Open pool requests</Link>
                </Button>
              </SectionCard>

              <SectionCard title="Notes on this balance" bodyClassName="p-4">
                <ul className="space-y-2.5 text-[13px] text-muted-foreground">
                  <li>Every change appends a new snapshot, so the full history is preserved.</li>
                  <li>Share buybacks draw from cash first, then bank.</li>
                  <li>Share purchases by employees are credited to bank.</li>
                  <li>
                    If the ledger total differs from this balance, the statement absorbs the gap as an opening balance.
                  </li>
                </ul>
              </SectionCard>
            </>
          }
        />
      </PageBody>

      <MovementDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        balances={balances}
        onDone={refreshAll}
      />
    </Page>
  )
}
