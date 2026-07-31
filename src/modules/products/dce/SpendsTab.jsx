import * as React from 'react'
import { Download, Pencil, Plus, Trash2, Wallet } from 'lucide-react'
import { StatCard, StatGrid } from '@/components/patterns/StatCard'
import { SectionCard } from '@/components/patterns/SectionCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ActionMenu } from '@/components/ui/menu'
import { Dialog, ConfirmDialog } from '@/components/ui/dialog'
import { Field, FieldGrid, TextInput, Select, Textarea } from '@/components/ui/field'
import { AsyncView, EmptyState } from '@/components/ui/states'
import { TableWrap, Table, THead, TBody, TFoot, TR, TH, TD } from '@/components/ui/table'
import { FilterSelect, Toolbar, ToolbarSpacer } from '@/components/patterns/Page'
import { useQuery, useMutation } from '@/lib/useQuery'
import { dce } from '@/lib/api'
import { money, date, number, percent, monthLabel, todayISO, truncate } from '@/lib/format'
import { downloadCsv } from '@/lib/export'
import toast from 'react-hot-toast'

/* =====================================================================
   Spends — what a business paid out.

   The mobile DCE showed these as a flat chronological list of cards with the
   amount on the right and no totals anywhere, so the question this data exists
   to answer ("where is the money going?") required scrolling and mental
   arithmetic. The desktop version had a table but different category options.

   One category list now (the eight from the mobile app), a month filter, a
   per-category breakdown, and totals. Same table, same columns.
   ===================================================================== */

const CATEGORIES = ['Operating', 'Material', 'Salary', 'Marketing', 'Rent', 'Legal', 'Tech', 'Other']
const STATUSES = ['Paid', 'Pending']

const EMPTY = { vendor: '', amount: '', category: 'Operating', spend_date: todayISO(), status: 'Paid', note: '' }

function SpendDialog({ open, onClose, spend, business, onDone }) {
  const editing = Boolean(spend)
  const [form, setForm] = React.useState(EMPTY)
  const [errors, setErrors] = React.useState({})

  React.useEffect(() => {
    if (!open) return
    setErrors({})
    setForm(
      spend
        ? {
            vendor: spend.vendor ?? '',
            amount: spend.amount ?? '',
            category: spend.category ?? 'Operating',
            spend_date: spend.spend_date ?? todayISO(),
            status: spend.status ?? 'Paid',
            note: spend.note ?? '',
          }
        : EMPTY
    )
  }, [open, spend])

  const save = useMutation(
    () => {
      const payload = {
        business_id: business.id,
        business_name: business.name,
        vendor: form.vendor.trim(),
        amount: Number(form.amount) || 0,
        category: form.category,
        spend_date: form.spend_date || null,
        status: form.status,
        note: form.note.trim() || null,
      }
      return editing ? dce.updateSpend(spend.id, payload) : dce.createSpend(payload)
    },
    {
      onSuccess: () => {
        toast.success(editing ? 'Spend updated' : 'Spend recorded')
        dce.logEvent({
          businessId: business.id,
          businessName: business.name,
          event: `${editing ? 'Updated' : 'Recorded'} spend of ${money(Number(form.amount) || 0)} — ${form.vendor.trim()}`,
          category: 'Finance',
        })
        onDone?.()
        onClose()
      },
      onError: (e) => toast.error(e.message),
    }
  )

  function submit(e) {
    e.preventDefault()
    const next = {}
    if (!form.vendor.trim()) next.vendor = 'What or who was this paid for?'
    if (!(Number(form.amount) > 0)) next.amount = 'Enter an amount greater than zero'
    if (!form.spend_date) next.spend_date = 'Date is required'
    setErrors(next)
    if (Object.keys(next).length > 0) return
    save.run()
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={editing ? 'Edit spend' : 'Record spend'}
      description={business?.name}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={save.busy}>
            Cancel
          </Button>
          <Button type="submit" form="spend-form" disabled={save.busy}>
            {save.busy ? 'Saving…' : editing ? 'Save changes' : 'Record spend'}
          </Button>
        </>
      }
    >
      <form id="spend-form" onSubmit={submit} className="space-y-5">
        <FieldGrid cols={2}>
          <Field label="Paid to / for" required htmlFor="s-vendor" error={errors.vendor}>
            <TextInput
              id="s-vendor"
              value={form.vendor}
              onChange={(e) => setForm({ ...form, vendor: e.target.value })}
              placeholder="Diesel, driver advance, printer"
              invalid={Boolean(errors.vendor)}
              autoFocus
            />
          </Field>
          <Field label="Amount" required htmlFor="s-amount" error={errors.amount}>
            <TextInput
              id="s-amount"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              placeholder="0"
              invalid={Boolean(errors.amount)}
            />
          </Field>
        </FieldGrid>

        <FieldGrid cols={3}>
          <Field label="Category" htmlFor="s-cat">
            <Select id="s-cat" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Date" required htmlFor="s-date" error={errors.spend_date}>
            <TextInput
              id="s-date"
              type="date"
              value={form.spend_date}
              onChange={(e) => setForm({ ...form, spend_date: e.target.value })}
              invalid={Boolean(errors.spend_date)}
            />
          </Field>
          <Field label="Status" htmlFor="s-status">
            <Select id="s-status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </Field>
        </FieldGrid>

        <Field label="Note" htmlFor="s-note" hint="Optional detail — X-Ai reads this when answering questions">
          <Textarea
            id="s-note"
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
            placeholder="Full tank before the Jaipur trip"
          />
        </Field>
      </form>
    </Dialog>
  )
}

export default function SpendsTab({ business, search }) {
  const [dialog, setDialog] = React.useState({ open: false, spend: null })
  const [pendingDelete, setPendingDelete] = React.useState(null)
  const [month, setMonth] = React.useState('all')
  const [category, setCategory] = React.useState('all')

  const query = useQuery(() => dce.spends(business.id), [business.id])

  const remove = useMutation((id) => dce.removeSpend(id), {
    onSuccess: () => {
      toast.success('Spend deleted')
      setPendingDelete(null)
      query.refetch()
    },
    onError: (e) => toast.error(e.message),
  })

  const months = React.useMemo(() => {
    const set = new Set((query.data ?? []).map((s) => String(s.spend_date ?? '').slice(0, 7)).filter(Boolean))
    return [...set].sort((a, b) => b.localeCompare(a))
  }, [query.data])

  const rows = React.useMemo(() => {
    let list = query.data ?? []
    if (month !== 'all') list = list.filter((s) => String(s.spend_date ?? '').slice(0, 7) === month)
    if (category !== 'all') list = list.filter((s) => (s.category ?? 'Other') === category)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter((s) => `${s.vendor ?? ''} ${s.note ?? ''}`.toLowerCase().includes(q))
    }
    return list
  }, [query.data, month, category, search])

  const total = React.useMemo(() => rows.reduce((s, r) => s + (Number(r.amount) || 0), 0), [rows])
  const pending = React.useMemo(
    () => rows.filter((r) => r.status === 'Pending').reduce((s, r) => s + (Number(r.amount) || 0), 0),
    [rows]
  )
  const thisMonth = React.useMemo(() => {
    const key = todayISO().slice(0, 7)
    return (query.data ?? [])
      .filter((s) => String(s.spend_date ?? '').slice(0, 7) === key)
      .reduce((s, r) => s + (Number(r.amount) || 0), 0)
  }, [query.data])

  const byCategory = React.useMemo(() => {
    const map = new Map()
    for (const r of rows) {
      const key = r.category ?? 'Other'
      map.set(key, (map.get(key) ?? 0) + (Number(r.amount) || 0))
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1])
  }, [rows])

  return (
    <>
      <StatGrid cols={4} className="mb-4">
        <StatCard label="Total shown" value={money(total)} hint={`${number(rows.length)} entries`} icon={Wallet} />
        <StatCard label="This month" value={money(thisMonth)} hint="Across all categories" />
        <StatCard
          label="Pending payment"
          value={money(pending)}
          tone={pending > 0 ? 'negative' : 'default'}
          hint={pending > 0 ? 'Marked as Pending' : 'Everything settled'}
        />
        <StatCard
          label="Largest category"
          value={byCategory[0] ? byCategory[0][0] : '—'}
          hint={byCategory[0] ? `${money(byCategory[0][1])} · ${percent((byCategory[0][1] / (total || 1)) * 100, 0)}` : undefined}
        />
      </StatGrid>

      <SectionCard
        title="Money spent"
        description={business.name}
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              disabled={rows.length === 0}
              onClick={() => {
                downloadCsv(
                  `${business.name}_spends`,
                  rows.map((r) => ({
                    date: r.spend_date ?? '',
                    paid_for: r.vendor,
                    category: r.category ?? '',
                    amount: r.amount,
                    status: r.status ?? '',
                    note: r.note ?? '',
                  }))
                )
                toast.success('Exported')
              }}
            >
              <Download aria-hidden="true" />
              Export
            </Button>
            <Button size="sm" onClick={() => setDialog({ open: true, spend: null })}>
              <Plus aria-hidden="true" />
              Record spend
            </Button>
          </>
        }
        flush
      >
        <div className="px-4 pt-4 sm:px-5">
          <Toolbar>
            <FilterSelect
              label="Month"
              value={month}
              onChange={setMonth}
              options={[{ value: 'all', label: 'All months' }, ...months.map((m) => ({ value: m, label: monthLabel(m) }))]}
            />
            <FilterSelect
              label="Category"
              value={category}
              onChange={setCategory}
              options={[{ value: 'all', label: 'All categories' }, ...CATEGORIES.map((c) => ({ value: c, label: c }))]}
            />
            <ToolbarSpacer />
          </Toolbar>
        </div>

        <AsyncView
          query={query}
          skeletonProps={{ columns: 5 }}
          empty={{
            icon: Wallet,
            title: 'No spends recorded',
            description: 'Log what this business pays out to see where the money goes.',
            action: <Button onClick={() => setDialog({ open: true, spend: null })}>Record spend</Button>,
          }}
        >
          {() =>
            rows.length === 0 ? (
              <EmptyState compact icon={Wallet} title="No spends match these filters" />
            ) : (
              <TableWrap>
                <Table>
                  <THead>
                    <TR>
                      <TH>Date</TH>
                      <TH>Paid to / for</TH>
                      <TH>Category</TH>
                      <TH>Status</TH>
                      <TH numeric>Amount</TH>
                      <TH className="w-10" />
                    </TR>
                  </THead>
                  <TBody>
                    {rows.map((r) => (
                      <TR key={r.id}>
                        <TD>
                          <span className="whitespace-nowrap text-[13px]">{date(r.spend_date)}</span>
                        </TD>
                        <TD>
                          <p className="font-medium">{r.vendor}</p>
                          {r.note && <p className="text-[13px] text-muted-foreground">{truncate(r.note, 60)}</p>}
                        </TD>
                        <TD>
                          <Badge size="sm">{r.category ?? 'Other'}</Badge>
                        </TD>
                        <TD>
                          <Badge size="sm" tone={r.status === 'Pending' ? 'warning' : 'success'} dot>
                            {r.status ?? 'Paid'}
                          </Badge>
                        </TD>
                        <TD numeric>
                          <span className="font-medium">{money(r.amount)}</span>
                        </TD>
                        <TD>
                          <ActionMenu
                            items={[
                              { label: 'Edit spend', icon: Pencil, onSelect: () => setDialog({ open: true, spend: r }) },
                              { separator: true },
                              { label: 'Delete spend', icon: Trash2, destructive: true, onSelect: () => setPendingDelete(r) },
                            ]}
                          />
                        </TD>
                      </TR>
                    ))}
                  </TBody>
                  <TFoot>
                    <TR>
                      <TD colSpan={4} className="font-medium">
                        {number(rows.length)} {rows.length === 1 ? 'entry' : 'entries'}
                      </TD>
                      <TD numeric>{money(total)}</TD>
                      <TD />
                    </TR>
                  </TFoot>
                </Table>
              </TableWrap>
            )
          }
        </AsyncView>
      </SectionCard>

      {byCategory.length > 1 && (
        <SectionCard title="By category" description="Share of the total shown" className="mt-4">
          <div className="space-y-2.5">
            {byCategory.map(([name, amount]) => {
              const share = total > 0 ? (amount / total) * 100 : 0
              return (
                <div key={name}>
                  <div className="mb-1 flex items-center justify-between gap-2 text-[13px]">
                    <span className="font-medium">{name}</span>
                    <span className="tabular text-muted-foreground">
                      {money(amount)} · {percent(share, 0)}
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-[hsl(var(--chart-1))]"
                      style={{ width: `${Math.max(2, share)}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </SectionCard>
      )}

      <SpendDialog
        open={dialog.open}
        spend={dialog.spend}
        business={business}
        onClose={() => setDialog({ open: false, spend: null })}
        onDone={query.refetch}
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => remove.run(pendingDelete.id)}
        title={`Delete spend of ${money(pendingDelete?.amount)}?`}
        confirmLabel="Delete"
        destructive
        busy={remove.busy}
      />
    </>
  )
}
