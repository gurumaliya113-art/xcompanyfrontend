import * as React from 'react'
import { useSearchParams } from 'react-router-dom'
import { Download, Landmark, Pencil, Plus, Trash2, TrendingDown } from 'lucide-react'
import { Page, PageHeader, PageBody, Toolbar, SearchInput, FilterSelect, ToolbarSpacer } from '@/components/patterns/Page'
import { StatCard, StatGrid } from '@/components/patterns/StatCard'
import { SectionCard } from '@/components/patterns/SectionCard'
import { Badge, StatusBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ActionMenu } from '@/components/ui/menu'
import { Dialog, ConfirmDialog } from '@/components/ui/dialog'
import { Field, FieldGrid, TextInput, Select } from '@/components/ui/field'
import { AsyncView, EmptyState } from '@/components/ui/states'
import { TableWrap, Table, THead, TBody, TFoot, TR, TH, TD } from '@/components/ui/table'
import { useQuery, useMutation } from '@/lib/useQuery'
import { assets as assetsApi } from '@/lib/api'
import { assetDepreciation, assetTotals } from '@/lib/calc'
import { money, percent, number, date, todayISO } from '@/lib/format'
import { downloadCsv } from '@/lib/export'
import toast from 'react-hot-toast'

/* =====================================================================
   Assets — register and depreciation.

   The legacy screen injected its own <style> block at runtime (`#ap-styles`),
   giving assets a visual language nobody else in the app used: gradient
   condition badges, a bespoke card grid, and its own button colours. It also
   put Add / Edit / Delete as three coloured buttons inside each card.

   Rebuilt on the shared design system. Depreciation still comes from the
   database's generated columns; the create form previews the same numbers so
   what you see before saving is what gets stored.
   ===================================================================== */

const CONDITIONS = ['Excellent', 'Good', 'Fair']

const EMPTY = {
  name: '',
  category: '',
  condition: 'Good',
  purchase_date: todayISO(),
  purchase_value: '',
  current_value: '',
}

function AssetDialog({ open, onClose, asset, onDone }) {
  const editing = Boolean(asset)
  const [form, setForm] = React.useState(EMPTY)
  const [errors, setErrors] = React.useState({})

  React.useEffect(() => {
    if (!open) return
    setErrors({})
    setForm(
      asset
        ? {
            name: asset.name ?? '',
            category: asset.category ?? '',
            condition: asset.condition ?? 'Good',
            purchase_date: asset.purchase_date ?? todayISO(),
            purchase_value: asset.purchase_value ?? '',
            current_value: asset.current_value ?? '',
          }
        : EMPTY
    )
  }, [open, asset])

  const purchase = Number(form.purchase_value) || 0
  const current = Number(form.current_value) || 0
  const depAmount = purchase - current
  const depPct = purchase > 0 ? (depAmount / purchase) * 100 : 0

  const save = useMutation(
    () => {
      const payload = {
        name: form.name.trim(),
        category: form.category.trim() || 'General',
        condition: form.condition,
        purchase_date: form.purchase_date || null,
        purchase_value: purchase,
        current_value: current,
        status: 'ACTIVE',
      }
      return editing ? assetsApi.update(asset.id, payload) : assetsApi.create(payload)
    },
    {
      onSuccess: () => {
        toast.success(editing ? 'Asset updated' : 'Asset added')
        onDone?.()
        onClose()
      },
      onError: (e) => toast.error(e.message),
    }
  )

  function submit(e) {
    e.preventDefault()
    const next = {}
    if (!form.name.trim()) next.name = 'Asset name is required'
    if (!form.current_value || !Number.isFinite(current)) next.current_value = "Enter today's value"
    if (form.purchase_value !== '' && !Number.isFinite(purchase)) next.purchase_value = 'Enter a valid number'
    if (purchase > 0 && current > purchase) next.current_value = 'Current value cannot exceed purchase value'
    setErrors(next)
    if (Object.keys(next).length > 0) return
    save.run()
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={editing ? 'Edit asset' : 'Add asset'}
      description="Depreciation is calculated from purchase and current value."
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={save.busy}>
            Cancel
          </Button>
          <Button type="submit" form="asset-form" disabled={save.busy}>
            {save.busy ? 'Saving…' : editing ? 'Save changes' : 'Add asset'}
          </Button>
        </>
      }
    >
      <form id="asset-form" onSubmit={submit} className="space-y-5">
        <FieldGrid cols={2}>
          <Field label="Asset name" required htmlFor="a-name" error={errors.name}>
            <TextInput
              id="a-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Tata Ace truck"
              invalid={Boolean(errors.name)}
              autoFocus
            />
          </Field>
          <Field label="Category" htmlFor="a-category" hint="Defaults to General">
            <TextInput
              id="a-category"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              placeholder="Vehicle"
            />
          </Field>
        </FieldGrid>

        <FieldGrid cols={2}>
          <Field label="Condition" htmlFor="a-condition">
            <Select id="a-condition" value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })}>
              {CONDITIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Purchase date" htmlFor="a-date">
            <TextInput
              id="a-date"
              type="date"
              value={form.purchase_date}
              onChange={(e) => setForm({ ...form, purchase_date: e.target.value })}
            />
          </Field>
        </FieldGrid>

        <FieldGrid cols={2}>
          <Field label="Purchase value" htmlFor="a-purchase" error={errors.purchase_value}>
            <TextInput
              id="a-purchase"
              type="number"
              inputMode="decimal"
              min="0"
              value={form.purchase_value}
              onChange={(e) => setForm({ ...form, purchase_value: e.target.value })}
              placeholder="0"
              invalid={Boolean(errors.purchase_value)}
            />
          </Field>
          <Field label="Value today" required htmlFor="a-current" error={errors.current_value}>
            <TextInput
              id="a-current"
              type="number"
              inputMode="decimal"
              min="0"
              value={form.current_value}
              onChange={(e) => setForm({ ...form, current_value: e.target.value })}
              placeholder="0"
              invalid={Boolean(errors.current_value)}
            />
          </Field>
        </FieldGrid>

        {purchase > 0 && (
          <div className="rounded-[--radius] border border-border bg-muted/50 p-3">
            <p className="mb-2 text-[13px] font-medium">Depreciation</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Value lost</p>
                <p className="font-medium tabular">{money(depAmount)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Percentage</p>
                <p className="font-medium tabular">{percent(depPct)}</p>
              </div>
            </div>
          </div>
        )}
      </form>
    </Dialog>
  )
}

export default function AssetsPage() {
  const [params, setParams] = useSearchParams()
  const [search, setSearch] = React.useState('')
  const [condition, setCondition] = React.useState('all')
  const [editing, setEditing] = React.useState(null)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [pendingDelete, setPendingDelete] = React.useState(null)

  const query = useQuery(() => assetsApi.list(), [])

  React.useEffect(() => {
    if (params.get('new') === '1') {
      setEditing(null)
      setDialogOpen(true)
    }
  }, [params])

  function closeDialog() {
    setDialogOpen(false)
    setEditing(null)
    setParams((prev) => {
      const p = new URLSearchParams(prev)
      p.delete('new')
      return p
    })
  }

  const remove = useMutation((id) => assetsApi.remove(id), {
    onSuccess: () => {
      toast.success('Asset removed')
      setPendingDelete(null)
      query.refetch()
    },
    onError: (e) => toast.error(e.message),
  })

  const rows = React.useMemo(() => {
    let list = query.data ?? []
    if (search) {
      const q = search.toLowerCase()
      list = list.filter((a) => `${a.name} ${a.category ?? ''}`.toLowerCase().includes(q))
    }
    if (condition !== 'all') list = list.filter((a) => a.condition === condition)
    return list
  }, [query.data, search, condition])

  const totals = React.useMemo(() => assetTotals(rows), [rows])

  return (
    <Page>
      <PageHeader
        title="Assets"
        description="What the company owns and what it is worth today"
        actions={
          <>
            <Button
              variant="outline"
              disabled={rows.length === 0}
              onClick={() => {
                downloadCsv(
                  'assets',
                  rows.map((a) => {
                    const d = assetDepreciation(a)
                    return {
                      name: a.name,
                      category: a.category ?? '',
                      condition: a.condition ?? '',
                      purchase_date: a.purchase_date ?? '',
                      purchase_value: d.purchase,
                      current_value: d.current,
                      depreciation: d.amount,
                      depreciation_percent: d.pct.toFixed(2),
                    }
                  })
                )
                toast.success('Exported')
              }}
            >
              <Download aria-hidden="true" />
              Export
            </Button>
            <Button
              onClick={() => {
                setEditing(null)
                setDialogOpen(true)
              }}
            >
              <Plus aria-hidden="true" />
              Add asset
            </Button>
          </>
        }
      />

      <PageBody className="space-y-4">
        <StatGrid cols={4}>
          <StatCard label="Value today" value={money(totals.current)} hint="Sum of current values" icon={Landmark} />
          <StatCard label="Purchase value" value={money(totals.purchase)} hint="What it cost originally" />
          <StatCard
            label="Depreciation"
            value={money(totals.depreciation)}
            tone="negative"
            hint={totals.purchase > 0 ? `${percent(totals.depreciationPct)} of purchase value` : undefined}
            icon={TrendingDown}
          />
          <StatCard
            label="Assets"
            value={number(totals.count)}
            hint={`${number(totals.categoryCount)} ${totals.categoryCount === 1 ? 'category' : 'categories'}`}
          />
        </StatGrid>

        <SectionCard flush>
          <div className="px-4 pt-4 sm:px-5">
            <Toolbar>
              <SearchInput value={search} onChange={setSearch} placeholder="Search assets…" />
              <FilterSelect
                label="Condition"
                value={condition}
                onChange={setCondition}
                options={[{ value: 'all', label: 'Any condition' }, ...CONDITIONS.map((c) => ({ value: c, label: c }))]}
              />
              <ToolbarSpacer />
            </Toolbar>
          </div>

          <AsyncView
            query={query}
            skeletonProps={{ columns: 7 }}
            empty={{
              icon: Landmark,
              title: 'No assets recorded',
              description: 'Add vehicles, equipment or stock to track what the company owns.',
              action: (
                <Button
                  onClick={() => {
                    setEditing(null)
                    setDialogOpen(true)
                  }}
                >
                  Add asset
                </Button>
              ),
            }}
          >
            {() =>
              rows.length === 0 ? (
                <EmptyState compact icon={Landmark} title="No assets match these filters" />
              ) : (
                <TableWrap>
                  <Table>
                    <THead>
                      <TR>
                        <TH>Asset</TH>
                        <TH>Category</TH>
                        <TH>Condition</TH>
                        <TH>Purchased</TH>
                        <TH numeric>Purchase value</TH>
                        <TH numeric>Value today</TH>
                        <TH numeric>Depreciation</TH>
                        <TH className="w-10" />
                      </TR>
                    </THead>
                    <TBody>
                      {rows.map((a) => {
                        const d = assetDepreciation(a)
                        return (
                          <TR key={a.id}>
                            <TD>
                              <span className="font-medium">{a.name}</span>
                            </TD>
                            <TD>
                              <Badge size="sm">{a.category || 'General'}</Badge>
                            </TD>
                            <TD>
                              <StatusBadge status={a.condition} />
                            </TD>
                            <TD>
                              <span className="whitespace-nowrap text-[13px] text-muted-foreground">
                                {a.purchase_date ? date(a.purchase_date) : '—'}
                              </span>
                            </TD>
                            <TD numeric>{money(d.purchase)}</TD>
                            <TD numeric>{money(d.current)}</TD>
                            <TD numeric>
                              <span className="text-[hsl(var(--destructive))]">{money(d.amount)}</span>
                              <span className="ml-1.5 text-xs text-muted-foreground">{percent(d.pct, 0)}</span>
                            </TD>
                            <TD>
                              <ActionMenu
                                items={[
                                  {
                                    label: 'Edit asset',
                                    icon: Pencil,
                                    onSelect: () => {
                                      setEditing(a)
                                      setDialogOpen(true)
                                    },
                                  },
                                  { separator: true },
                                  { label: 'Delete asset', icon: Trash2, destructive: true, onSelect: () => setPendingDelete(a) },
                                ]}
                              />
                            </TD>
                          </TR>
                        )
                      })}
                    </TBody>
                    <TFoot>
                      <TR>
                        <TD colSpan={4} className="font-medium">
                          {rows.length} {rows.length === 1 ? 'asset' : 'assets'}
                        </TD>
                        <TD numeric>{money(totals.purchase)}</TD>
                        <TD numeric>{money(totals.current)}</TD>
                        <TD numeric>{money(totals.depreciation)}</TD>
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

      <AssetDialog open={dialogOpen} onClose={closeDialog} asset={editing} onDone={query.refetch} />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => remove.run(pendingDelete.id)}
        title={`Remove ${pendingDelete?.name}?`}
        confirmLabel="Remove asset"
        destructive
        busy={remove.busy}
      />
    </Page>
  )
}
