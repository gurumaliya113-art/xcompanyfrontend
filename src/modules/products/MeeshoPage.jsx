import * as React from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Download,
  FileText,
  Image as ImageIcon,
  Pencil,
  Plus,
  ShoppingBag,
  Trash2,
  TrendingUp,
  Truck,
} from 'lucide-react'
import { Page, PageHeader, PageBody, Toolbar, SearchInput, FilterSelect, ToolbarSpacer } from '@/components/patterns/Page'
import { StatCard, StatGrid } from '@/components/patterns/StatCard'
import { SectionCard } from '@/components/patterns/SectionCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ActionMenu } from '@/components/ui/menu'
import { Dialog, ConfirmDialog } from '@/components/ui/dialog'
import { Field, FieldGrid, TextInput, Select } from '@/components/ui/field'
import { AsyncView, EmptyState, Spinner } from '@/components/ui/states'
import { TableWrap, Table, THead, TBody, TFoot, TR, TH, TD } from '@/components/ui/table'
import { useQuery, useMutation } from '@/lib/useQuery'
import { meesho } from '@/lib/api'
import { meeshoOrderResult, meeshoTotals } from '@/lib/calc'
import { money, number, percent, dateTime, monthLabel } from '@/lib/format'
import { downloadCsv } from '@/lib/export'
import toast from 'react-hot-toast'

/* =====================================================================
   Meesho Orders.

   The legacy tracker stored cost_price and selling_price on every order and
   never did anything with them: no margin, no totals, no answer to "are we
   making money?". Eleven columns of raw fields with three coloured buttons per
   row, and a hand-rolled inline edit mode that replaced the row's cells with
   ten inputs.

   What is new here is the economics, and it is computed in the client from
   data that already exists — no schema change, nothing rewritten server-side:

     cancelled  → no revenue, no cost      (never shipped)
     returned   → cost absorbed, no revenue (loss)
     delivered  → revenue and cost booked  (real profit)
     in transit → nothing booked yet, shown as expected profit

   That distinction matters: counting an in-transit order as profit is how a
   Meesho seller convinces themselves a losing month was fine.

   Editing moved to a dialog. The row now shows the order, its state and its
   margin.
   ===================================================================== */

const RETURN_OPTIONS = ['NONE', 'RTO', 'RETURN', 'REPLACE']
const CANCEL_OPTIONS = [
  { value: 'NONE', label: 'Not cancelled' },
  { value: 'US', label: 'Cancelled by us' },
  { value: 'USER', label: 'Cancelled by customer' },
]

const STATE_LABEL = {
  delivered: 'Delivered',
  in_transit: 'In transit',
  returned: 'Returned',
  cancelled: 'Cancelled',
}

const STATE_TONE = {
  delivered: 'success',
  in_transit: 'info',
  returned: 'warning',
  cancelled: 'danger',
}

function nowLocalISO() {
  const d = new Date()
  const off = d.getTimezoneOffset() * 60000
  return new Date(d.getTime() - off).toISOString().slice(0, 16)
}

const EMPTY = {
  entry_datetime: nowLocalISO(),
  sub_order_id: '',
  cost_price: '',
  selling_price: '',
  dispatched: false,
  delivered: false,
  return_status: 'NONE',
  cancelled_by: 'NONE',
}

function OrderDialog({ open, onClose, order, onDone }) {
  const editing = Boolean(order)
  const [form, setForm] = React.useState(EMPTY)
  const [errors, setErrors] = React.useState({})
  const [image, setImage] = React.useState(null)
  const [bill, setBill] = React.useState(null)
  const [uploading, setUploading] = React.useState(false)

  React.useEffect(() => {
    if (!open) return
    setErrors({})
    setImage(null)
    setBill(null)
    setForm(
      order
        ? {
            entry_datetime: String(order.entry_datetime ?? '').slice(0, 16) || nowLocalISO(),
            sub_order_id: order.sub_order_id ?? '',
            cost_price: order.cost_price ?? '',
            selling_price: order.selling_price ?? '',
            dispatched: Boolean(order.dispatched),
            delivered: Boolean(order.delivered),
            return_status: order.return_status ?? 'NONE',
            cancelled_by: order.cancelled_by ?? 'NONE',
          }
        : EMPTY
    )
  }, [open, order])

  const cost = Number(form.cost_price) || 0
  const selling = Number(form.selling_price) || 0
  const preview = React.useMemo(
    () =>
      meeshoOrderResult({
        cost_price: cost,
        selling_price: selling,
        delivered: form.delivered,
        return_status: form.return_status,
        cancelled_by: form.cancelled_by,
      }),
    [cost, selling, form.delivered, form.return_status, form.cancelled_by]
  )

  const save = useMutation(
    async () => {
      setUploading(Boolean(image || bill))
      let image_url = order?.image_url ?? null
      let bill_pdf_url = order?.bill_pdf_url ?? null
      if (image) image_url = await meesho.upload(image, 'meesho-entry-images', form.sub_order_id)
      if (bill) bill_pdf_url = await meesho.upload(bill, 'meesho-entry-bills', form.sub_order_id)
      setUploading(false)

      const payload = {
        entry_datetime: new Date(form.entry_datetime).toISOString(),
        sub_order_id: form.sub_order_id.trim(),
        cost_price: cost,
        selling_price: selling,
        dispatched: form.dispatched,
        delivered: form.delivered,
        return_status: form.return_status,
        cancelled_by: form.cancelled_by,
        image_url,
        bill_pdf_url,
      }
      return editing ? meesho.update(order.id, payload) : meesho.create(payload)
    },
    {
      onSuccess: () => {
        toast.success(editing ? 'Order updated' : 'Order added')
        onDone?.()
        onClose()
      },
      onError: (e) => {
        setUploading(false)
        toast.error(e.message)
      },
    }
  )

  function submit(e) {
    e.preventDefault()
    const next = {}
    if (!form.sub_order_id.trim()) next.sub_order_id = 'Sub order ID is required'
    if (!(cost > 0)) next.cost_price = 'Cost price must be more than zero'
    if (!(selling > 0)) next.selling_price = 'Selling price must be more than zero'
    setErrors(next)
    if (Object.keys(next).length > 0) return
    save.run()
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={editing ? 'Edit order' : 'Add order'}
      description="Margin is derived from cost, selling price and the order's outcome."
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={save.busy}>
            Cancel
          </Button>
          <Button type="submit" form="meesho-form" disabled={save.busy}>
            {save.busy ? (
              <>
                <Spinner />
                {uploading ? 'Uploading…' : 'Saving…'}
              </>
            ) : editing ? (
              'Save changes'
            ) : (
              'Add order'
            )}
          </Button>
        </>
      }
    >
      <form id="meesho-form" onSubmit={submit} className="space-y-5">
        <FieldGrid cols={2}>
          <Field label="Sub order ID" required htmlFor="me-sub" error={errors.sub_order_id}>
            <TextInput
              id="me-sub"
              value={form.sub_order_id}
              onChange={(e) => setForm({ ...form, sub_order_id: e.target.value })}
              placeholder="123456789_1"
              invalid={Boolean(errors.sub_order_id)}
              autoFocus
            />
          </Field>
          <Field label="Order date & time" htmlFor="me-dt">
            <TextInput
              id="me-dt"
              type="datetime-local"
              value={form.entry_datetime}
              onChange={(e) => setForm({ ...form, entry_datetime: e.target.value })}
            />
          </Field>
        </FieldGrid>

        <FieldGrid cols={2}>
          <Field label="Cost price" required htmlFor="me-cost" error={errors.cost_price}>
            <TextInput
              id="me-cost"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={form.cost_price}
              onChange={(e) => setForm({ ...form, cost_price: e.target.value })}
              placeholder="0"
              invalid={Boolean(errors.cost_price)}
            />
          </Field>
          <Field label="Meesho selling price" required htmlFor="me-sell" error={errors.selling_price}>
            <TextInput
              id="me-sell"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={form.selling_price}
              onChange={(e) => setForm({ ...form, selling_price: e.target.value })}
              placeholder="0"
              invalid={Boolean(errors.selling_price)}
            />
          </Field>
        </FieldGrid>

        <FieldGrid cols={2}>
          <Field label="Dispatched" htmlFor="me-disp">
            <Select
              id="me-disp"
              value={form.dispatched ? 'yes' : 'no'}
              onChange={(e) => setForm({ ...form, dispatched: e.target.value === 'yes' })}
            >
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </Select>
          </Field>
          <Field label="Delivered" htmlFor="me-del" hint="Revenue is only booked once delivered">
            <Select
              id="me-del"
              value={form.delivered ? 'yes' : 'no'}
              onChange={(e) => setForm({ ...form, delivered: e.target.value === 'yes' })}
            >
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </Select>
          </Field>
        </FieldGrid>

        <FieldGrid cols={2}>
          <Field label="Return status" htmlFor="me-ret">
            <Select
              id="me-ret"
              value={form.return_status}
              onChange={(e) => setForm({ ...form, return_status: e.target.value })}
            >
              {RETURN_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {r === 'NONE' ? 'No return' : r}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Cancellation" htmlFor="me-can">
            <Select
              id="me-can"
              value={form.cancelled_by}
              onChange={(e) => setForm({ ...form, cancelled_by: e.target.value })}
            >
              {CANCEL_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </Select>
          </Field>
        </FieldGrid>

        <FieldGrid cols={2}>
          <Field label="Product image" htmlFor="me-img" hint={order?.image_url ? 'Replaces the existing image' : 'Optional'}>
            <TextInput
              id="me-img"
              type="file"
              accept="image/*"
              onChange={(e) => setImage(e.target.files?.[0] ?? null)}
              className="cursor-pointer py-1.5 file:mr-3 file:rounded-[--radius-sm] file:border-0 file:bg-muted file:px-2 file:py-1 file:text-[13px]"
            />
          </Field>
          <Field label="Bill (PDF)" htmlFor="me-bill" hint={order?.bill_pdf_url ? 'Replaces the existing bill' : 'Optional'}>
            <TextInput
              id="me-bill"
              type="file"
              accept="application/pdf"
              onChange={(e) => setBill(e.target.files?.[0] ?? null)}
              className="cursor-pointer py-1.5 file:mr-3 file:rounded-[--radius-sm] file:border-0 file:bg-muted file:px-2 file:py-1 file:text-[13px]"
            />
          </Field>
        </FieldGrid>

        {(cost > 0 || selling > 0) && (
          <div className="rounded-[--radius] border border-border bg-muted/50 p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-[13px] font-medium">Order economics</p>
              <Badge size="sm" tone={STATE_TONE[preview.state]}>
                {STATE_LABEL[preview.state]}
              </Badge>
            </div>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Revenue booked</p>
                <p className="font-medium tabular">{money(preview.revenue)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Cost booked</p>
                <p className="font-medium tabular">{money(preview.cost)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  {preview.state === 'in_transit' ? 'Expected profit' : 'Profit'}
                </p>
                <p
                  className={
                    (preview.state === 'in_transit' ? preview.expectedProfit : preview.profit) >= 0
                      ? 'font-medium tabular text-[hsl(var(--success))]'
                      : 'font-medium tabular text-[hsl(var(--destructive))]'
                  }
                >
                  {money(preview.state === 'in_transit' ? preview.expectedProfit : preview.profit)}
                </p>
              </div>
            </div>
          </div>
        )}
      </form>
    </Dialog>
  )
}

export default function MeeshoPage() {
  const [params, setParams] = useSearchParams()
  const [search, setSearch] = React.useState('')
  const [state, setState] = React.useState('all')
  const [month, setMonth] = React.useState('all')
  const [dialog, setDialog] = React.useState({ open: false, order: null })
  const [pendingDelete, setPendingDelete] = React.useState(null)

  React.useEffect(() => {
    if (params.get('new') === '1') setDialog({ open: true, order: null })
  }, [params])

  function closeDialog() {
    setDialog({ open: false, order: null })
    setParams((prev) => {
      const p = new URLSearchParams(prev)
      p.delete('new')
      return p
    })
  }

  const query = useQuery(async () => {
    const rows = await meesho.list()
    return rows.map((r) => ({
      ...r,
      result: meeshoOrderResult(r),
      monthKey: String(r.entry_datetime ?? '').slice(0, 7),
    }))
  }, [])

  const remove = useMutation((id) => meesho.remove(id), {
    onSuccess: () => {
      toast.success('Order deleted')
      setPendingDelete(null)
      query.refetch()
    },
    onError: (e) => toast.error(e.message),
  })

  const months = React.useMemo(() => {
    const set = new Set((query.data ?? []).map((r) => r.monthKey).filter(Boolean))
    return [...set].sort((a, b) => b.localeCompare(a))
  }, [query.data])

  const rows = React.useMemo(() => {
    let list = query.data ?? []
    if (search) {
      const q = search.toLowerCase()
      list = list.filter((r) => String(r.sub_order_id ?? '').toLowerCase().includes(q))
    }
    if (state !== 'all') list = list.filter((r) => r.result.state === state)
    if (month !== 'all') list = list.filter((r) => r.monthKey === month)
    return list
  }, [query.data, search, state, month])

  const totals = React.useMemo(() => meeshoTotals(rows), [rows])

  return (
    <Page>
      <PageHeader
        title="Meesho Orders"
        description="Order tracker with real margin, not just prices"
        actions={
          <>
            <Button
              variant="outline"
              disabled={rows.length === 0}
              onClick={() => {
                downloadCsv(
                  'meesho_orders',
                  rows.map((r) => ({
                    order_datetime: r.entry_datetime,
                    sub_order_id: r.sub_order_id,
                    cost_price: r.cost_price,
                    selling_price: r.selling_price,
                    dispatched: r.dispatched ? 'yes' : 'no',
                    delivered: r.delivered ? 'yes' : 'no',
                    return_status: r.return_status,
                    cancelled_by: r.cancelled_by,
                    state: r.result.state,
                    revenue_booked: r.result.revenue,
                    cost_booked: r.result.cost,
                    profit: r.result.profit,
                  }))
                )
                toast.success('Exported')
              }}
            >
              <Download aria-hidden="true" />
              Export
            </Button>
            <Button onClick={() => setDialog({ open: true, order: null })}>
              <Plus aria-hidden="true" />
              Add order
            </Button>
          </>
        }
      />

      <PageBody className="space-y-4">
        <StatGrid cols={5}>
          <StatCard label="Orders" value={number(totals.orders)} hint={`${number(totals.delivered)} delivered`} icon={ShoppingBag} />
          <StatCard label="Revenue booked" value={money(totals.revenue)} hint="Delivered orders only" />
          <StatCard label="Cost booked" value={money(totals.cost)} hint="Includes returned stock" />
          <StatCard
            label="Profit"
            value={money(totals.profit)}
            tone={totals.profit >= 0 ? 'positive' : 'negative'}
            hint={totals.revenue > 0 ? `${percent(totals.margin)} margin` : 'No delivered revenue yet'}
            icon={TrendingUp}
          />
          <StatCard
            label="In transit"
            value={number(totals.inTransit)}
            hint={`${money(totals.expectedProfit)} expected`}
            icon={Truck}
          />
        </StatGrid>

        {(totals.returned > 0 || totals.cancelled > 0) && (
          <div className="rounded-[--radius] border border-[hsl(var(--warning)/0.25)] bg-[hsl(var(--warning-soft))] px-4 py-3 text-[13px] text-[hsl(var(--warning))]">
            {number(totals.returned)} returned and {number(totals.cancelled)} cancelled in this view. Returned orders
            count their cost as a loss because the stock came back; cancelled orders book nothing.
          </div>
        )}

        <SectionCard flush>
          <div className="px-4 pt-4 sm:px-5">
            <Toolbar>
              <SearchInput value={search} onChange={setSearch} placeholder="Search sub order ID…" />
              <FilterSelect
                label="State"
                value={state}
                onChange={setState}
                options={[
                  { value: 'all', label: 'All states' },
                  { value: 'delivered', label: 'Delivered' },
                  { value: 'in_transit', label: 'In transit' },
                  { value: 'returned', label: 'Returned' },
                  { value: 'cancelled', label: 'Cancelled' },
                ]}
              />
              <FilterSelect
                label="Month"
                value={month}
                onChange={setMonth}
                options={[
                  { value: 'all', label: 'All months' },
                  ...months.map((m) => ({ value: m, label: monthLabel(m) })),
                ]}
              />
              <ToolbarSpacer />
              <p className="text-[13px] text-muted-foreground">
                {number(rows.length)} {rows.length === 1 ? 'order' : 'orders'}
              </p>
            </Toolbar>
          </div>

          <AsyncView
            query={query}
            skeletonProps={{ columns: 8 }}
            empty={{
              icon: ShoppingBag,
              title: 'No orders recorded',
              description: 'Add the first order to start tracking cost, price and margin.',
              action: <Button onClick={() => setDialog({ open: true, order: null })}>Add order</Button>,
            }}
          >
            {() =>
              rows.length === 0 ? (
                <EmptyState compact icon={ShoppingBag} title="No orders match these filters" />
              ) : (
                <TableWrap>
                  <Table>
                    <THead>
                      <TR>
                        <TH>Order</TH>
                        <TH>State</TH>
                        <TH numeric>Cost</TH>
                        <TH numeric>Selling</TH>
                        <TH numeric>Profit</TH>
                        <TH>Files</TH>
                        <TH className="w-10" />
                      </TR>
                    </THead>
                    <TBody>
                      {rows.map((r) => {
                        const shown = r.result.state === 'in_transit' ? r.result.expectedProfit : r.result.profit
                        return (
                          <TR key={r.id}>
                            <TD>
                              <p className="font-medium">{r.sub_order_id}</p>
                              <p className="whitespace-nowrap text-xs text-muted-foreground">
                                {dateTime(r.entry_datetime)}
                              </p>
                            </TD>
                            <TD>
                              <Badge size="sm" tone={STATE_TONE[r.result.state]} dot>
                                {STATE_LABEL[r.result.state]}
                              </Badge>
                              {r.return_status && r.return_status !== 'NONE' && (
                                <span className="ml-1.5 text-xs text-muted-foreground">{r.return_status}</span>
                              )}
                            </TD>
                            <TD numeric>{money(r.cost_price)}</TD>
                            <TD numeric>{money(r.selling_price)}</TD>
                            <TD numeric>
                              <span
                                className={
                                  shown >= 0
                                    ? 'font-medium text-[hsl(var(--success))]'
                                    : 'font-medium text-[hsl(var(--destructive))]'
                                }
                              >
                                {money(shown)}
                              </span>
                              {r.result.state === 'in_transit' && (
                                <span className="ml-1 text-xs text-muted-foreground">exp.</span>
                              )}
                            </TD>
                            <TD>
                              <div className="flex items-center gap-1">
                                {r.image_url ? (
                                  <a
                                    href={r.image_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                    title="View image"
                                  >
                                    <ImageIcon className="size-4" aria-hidden="true" />
                                    <span className="sr-only">View image</span>
                                  </a>
                                ) : null}
                                {r.bill_pdf_url ? (
                                  <a
                                    href={r.bill_pdf_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                    title="View bill"
                                  >
                                    <FileText className="size-4" aria-hidden="true" />
                                    <span className="sr-only">View bill</span>
                                  </a>
                                ) : null}
                                {!r.image_url && !r.bill_pdf_url && (
                                  <span className="text-[13px] text-muted-foreground">—</span>
                                )}
                              </div>
                            </TD>
                            <TD>
                              <ActionMenu
                                items={[
                                  {
                                    label: 'Edit order',
                                    icon: Pencil,
                                    onSelect: () => setDialog({ open: true, order: r }),
                                  },
                                  { separator: true },
                                  {
                                    label: 'Delete order',
                                    icon: Trash2,
                                    destructive: true,
                                    onSelect: () => setPendingDelete(r),
                                  },
                                ]}
                              />
                            </TD>
                          </TR>
                        )
                      })}
                    </TBody>
                    <TFoot>
                      <TR>
                        <TD colSpan={2} className="font-medium">
                          {number(rows.length)} {rows.length === 1 ? 'order' : 'orders'}
                        </TD>
                        <TD numeric>{money(totals.cost)}</TD>
                        <TD numeric>{money(totals.revenue)}</TD>
                        <TD numeric>{money(totals.profit)}</TD>
                        <TD colSpan={2} />
                      </TR>
                    </TFoot>
                  </Table>
                </TableWrap>
              )
            }
          </AsyncView>
        </SectionCard>
      </PageBody>

      <OrderDialog open={dialog.open} order={dialog.order} onClose={closeDialog} onDone={query.refetch} />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => remove.run(pendingDelete.id)}
        title={`Delete order ${pendingDelete?.sub_order_id}?`}
        confirmLabel="Delete order"
        destructive
        busy={remove.busy}
      />
    </Page>
  )
}
