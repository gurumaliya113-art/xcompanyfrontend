import * as React from 'react'
import { Coins, Download, Plus, Trash2 } from 'lucide-react'
import { Page, PageHeader, PageBody, Toolbar, SearchInput, ToolbarSpacer } from '@/components/patterns/Page'
import { StatCard, StatGrid } from '@/components/patterns/StatCard'
import { SectionCard } from '@/components/patterns/SectionCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ActionMenu } from '@/components/ui/menu'
import { Dialog, ConfirmDialog } from '@/components/ui/dialog'
import { Field, FieldGrid, TextInput } from '@/components/ui/field'
import { AsyncView, EmptyState } from '@/components/ui/states'
import { TableWrap, Table, THead, TBody, TFoot, TR, TH, TD } from '@/components/ui/table'
import { useQuery, useMutation } from '@/lib/useQuery'
import { layers } from '@/lib/api'
import { investorInterest, investorTotals, DEFAULT_INVESTOR_RATE } from '@/lib/calc'
import { money, percent, number, date, todayISO } from '@/lib/format'
import { downloadCsv } from '@/lib/export'
import toast from 'react-hot-toast'

/* =====================================================================
   Investors (Layer 4) — capital taken in and interest owed on it.

   Legacy behaviour kept exactly: simple interest, day-based, default 12%
   annual. The numbers are identical; what changed is that the screen now
   shows *per investor* how many days have accrued and what is owed, instead
   of only three portfolio totals at the top with a bare name/amount list
   underneath.

   The accrued interest column is the number that matters here — it is a
   liability that grows every day and nothing else in the app surfaces it.
   ===================================================================== */

const EMPTY = { name: '', amount: '', invested_on: todayISO(), annual_rate: String(DEFAULT_INVESTOR_RATE * 100) }

function InvestorDialog({ open, onClose, onDone }) {
  const [form, setForm] = React.useState(EMPTY)
  const [errors, setErrors] = React.useState({})

  React.useEffect(() => {
    if (open) {
      setForm(EMPTY)
      setErrors({})
    }
  }, [open])

  const amount = Number(form.amount)
  const ratePct = Number(form.annual_rate)

  const preview = React.useMemo(
    () =>
      Number.isFinite(amount) && amount > 0
        ? investorInterest({ principal: amount, annualRate: ratePct / 100, investedOn: form.invested_on })
        : null,
    [amount, ratePct, form.invested_on]
  )

  const save = useMutation(
    () =>
      layers.addInvestor({
        name: form.name.trim(),
        amount,
        investedOn: form.invested_on,
        annualRate: Number.isFinite(ratePct) ? ratePct / 100 : DEFAULT_INVESTOR_RATE,
      }),
    {
      onSuccess: () => {
        toast.success('Investor added')
        onDone?.()
        onClose()
      },
      onError: (e) => toast.error(e.message),
    }
  )

  function submit(e) {
    e.preventDefault()
    const next = {}
    if (!form.name.trim()) next.name = 'Investor name is required'
    if (!form.amount || !Number.isFinite(amount) || amount <= 0) next.amount = 'Enter the amount invested'
    if (!form.invested_on) next.invested_on = 'Investment date is required'
    if (!Number.isFinite(ratePct) || ratePct < 0) next.annual_rate = 'Enter a valid rate'
    setErrors(next)
    if (Object.keys(next).length > 0) return
    save.run()
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Add investor"
      description="Layer 4 capital. Interest accrues daily from the investment date."
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={save.busy}>
            Cancel
          </Button>
          <Button type="submit" form="investor-form" disabled={save.busy}>
            {save.busy ? 'Adding…' : 'Add investor'}
          </Button>
        </>
      }
    >
      <form id="investor-form" onSubmit={submit} className="space-y-5">
        <Field label="Investor name" required htmlFor="i-name" error={errors.name}>
          <TextInput
            id="i-name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Full name"
            invalid={Boolean(errors.name)}
            autoFocus
          />
        </Field>

        <FieldGrid cols={3}>
          <Field label="Amount" required htmlFor="i-amount" error={errors.amount}>
            <TextInput
              id="i-amount"
              type="number"
              inputMode="decimal"
              min="0"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              placeholder="0"
              invalid={Boolean(errors.amount)}
            />
          </Field>
          <Field label="Invested on" required htmlFor="i-date" error={errors.invested_on}>
            <TextInput
              id="i-date"
              type="date"
              value={form.invested_on}
              onChange={(e) => setForm({ ...form, invested_on: e.target.value })}
              invalid={Boolean(errors.invested_on)}
            />
          </Field>
          <Field label="Annual rate %" htmlFor="i-rate" error={errors.annual_rate} hint="Default 12">
            <TextInput
              id="i-rate"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.1"
              value={form.annual_rate}
              onChange={(e) => setForm({ ...form, annual_rate: e.target.value })}
              invalid={Boolean(errors.annual_rate)}
            />
          </Field>
        </FieldGrid>

        {preview && (
          <div className="rounded-[--radius] border border-border bg-muted/50 p-3">
            <p className="mb-2 text-[13px] font-medium">Accrued as of today</p>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Days</p>
                <p className="font-medium tabular">{number(preview.days)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Interest</p>
                <p className="font-medium tabular">{money(preview.interest)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Payable</p>
                <p className="font-medium tabular">{money(preview.total)}</p>
              </div>
            </div>
          </div>
        )}
      </form>
    </Dialog>
  )
}

export default function InvestorsPage() {
  const [search, setSearch] = React.useState('')
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [pendingDelete, setPendingDelete] = React.useState(null)

  const query = useQuery(() => layers.list(4), [])

  const remove = useMutation((id) => layers.remove(4, id), {
    onSuccess: () => {
      toast.success('Investor removed')
      setPendingDelete(null)
      query.refetch()
    },
    onError: (e) => toast.error(e.message),
  })

  const rows = React.useMemo(() => {
    const list = query.data ?? []
    const filtered = search
      ? list.filter((i) => String(i.name ?? '').toLowerCase().includes(search.toLowerCase()))
      : list
    return filtered.map((inv) => ({
      ...inv,
      calc: investorInterest({ principal: inv.amount, annualRate: inv.annual_rate, investedOn: inv.invested_on }),
    }))
  }, [query.data, search])

  const totals = React.useMemo(() => investorTotals(rows), [rows])

  return (
    <Page>
      <PageHeader
        title="Investors"
        description="Layer 4 capital and the interest accrued on it"
        actions={
          <>
            <Button
              variant="outline"
              disabled={rows.length === 0}
              onClick={() => {
                downloadCsv(
                  'investors',
                  rows.map((i) => ({
                    name: i.name,
                    amount: i.amount,
                    invested_on: i.invested_on ?? '',
                    annual_rate: i.annual_rate ?? DEFAULT_INVESTOR_RATE,
                    days_accrued: i.calc.days,
                    interest: i.calc.interest.toFixed(2),
                    total_payable: i.calc.total.toFixed(2),
                  }))
                )
                toast.success('Exported')
              }}
            >
              <Download aria-hidden="true" />
              Export
            </Button>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus aria-hidden="true" />
              Add investor
            </Button>
          </>
        }
      />

      <PageBody className="space-y-4">
        <StatGrid cols={4}>
          <StatCard label="Principal raised" value={money(totals.principal)} hint="Capital received" icon={Coins} />
          <StatCard
            label="Interest accrued"
            value={money(totals.interest)}
            tone="negative"
            hint="Grows every day"
          />
          <StatCard
            label="Total payable"
            value={money(totals.total)}
            hint="Principal plus interest"
          />
          <StatCard
            label="Investors"
            value={number(rows.length)}
            hint={totals.principal > 0 ? `Avg ${money(totals.principal / Math.max(1, rows.length))}` : undefined}
          />
        </StatGrid>

        <SectionCard flush>
          <div className="px-4 pt-4 sm:px-5">
            <Toolbar>
              <SearchInput value={search} onChange={setSearch} placeholder="Search investors…" />
              <ToolbarSpacer />
            </Toolbar>
          </div>

          <AsyncView
            query={query}
            skeletonProps={{ columns: 6 }}
            empty={{
              icon: Coins,
              title: 'No investors recorded',
              description: 'Add Layer 4 capital to track principal and accrued interest.',
              action: <Button onClick={() => setDialogOpen(true)}>Add investor</Button>,
            }}
          >
            {() =>
              rows.length === 0 ? (
                <EmptyState compact icon={Coins} title="No investors match that search" />
              ) : (
                <TableWrap>
                  <Table>
                    <THead>
                      <TR>
                        <TH>Investor</TH>
                        <TH>Invested on</TH>
                        <TH numeric>Days</TH>
                        <TH numeric>Rate</TH>
                        <TH numeric>Principal</TH>
                        <TH numeric>Interest</TH>
                        <TH numeric>Payable</TH>
                        <TH className="w-10" />
                      </TR>
                    </THead>
                    <TBody>
                      {rows.map((inv) => (
                        <TR key={inv.id}>
                          <TD>
                            <span className="font-medium">{inv.name}</span>
                            {inv.layer_tag && (
                              <Badge size="sm" className="ml-2">
                                {inv.layer_tag}
                              </Badge>
                            )}
                          </TD>
                          <TD>
                            <span className="whitespace-nowrap text-[13px] text-muted-foreground">
                              {inv.invested_on ? date(inv.invested_on) : '—'}
                            </span>
                          </TD>
                          <TD numeric>{number(inv.calc.days)}</TD>
                          <TD numeric>{percent((inv.annual_rate ?? DEFAULT_INVESTOR_RATE) * 100, 0)}</TD>
                          <TD numeric>{money(inv.amount)}</TD>
                          <TD numeric>
                            <span className="text-[hsl(var(--warning))]">{money(inv.calc.interest)}</span>
                          </TD>
                          <TD numeric>
                            <span className="font-medium">{money(inv.calc.total)}</span>
                          </TD>
                          <TD>
                            <ActionMenu
                              items={[
                                { label: 'Remove investor', icon: Trash2, destructive: true, onSelect: () => setPendingDelete(inv) },
                              ]}
                            />
                          </TD>
                        </TR>
                      ))}
                    </TBody>
                    <TFoot>
                      <TR>
                        <TD colSpan={4} className="font-medium">
                          {rows.length} {rows.length === 1 ? 'investor' : 'investors'}
                        </TD>
                        <TD numeric>{money(totals.principal)}</TD>
                        <TD numeric>{money(totals.interest)}</TD>
                        <TD numeric>{money(totals.total)}</TD>
                        <TD />
                      </TR>
                    </TFoot>
                  </Table>
                </TableWrap>
              )
            }
          </AsyncView>
        </SectionCard>

        <div className="rounded-[--radius] border border-border bg-muted/40 px-4 py-3 text-[13px] text-muted-foreground">
          Interest is simple, not compounded: principal × annual rate × days ÷ 365. Repayments are not tracked yet, so
          these figures show the full amount accrued since the investment date.
        </div>
      </PageBody>

      <InvestorDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onDone={query.refetch} />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => remove.run(pendingDelete.id)}
        title={`Remove ${pendingDelete?.name}?`}
        description="The investment record and its accrued interest will no longer appear."
        confirmLabel="Remove"
        destructive
        busy={remove.busy}
      />
    </Page>
  )
}
