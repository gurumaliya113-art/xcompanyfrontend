import * as React from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Briefcase,
  Download,
  LayoutGrid,
  List,
  Plus,
  Trash2,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import { Page, PageHeader, PageBody, Toolbar, SearchInput, FilterSelect, ToolbarSpacer } from '@/components/patterns/Page'
import { StatCard, StatGrid } from '@/components/patterns/StatCard'
import { SectionCard } from '@/components/patterns/SectionCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ActionMenu } from '@/components/ui/menu'
import { Dialog, ConfirmDialog } from '@/components/ui/dialog'
import { Field, FieldGrid, TextInput, Select } from '@/components/ui/field'
import { AsyncView, EmptyState } from '@/components/ui/states'
import { TableWrap, Table, THead, TBody, TFoot, TR, TH, TD } from '@/components/ui/table'
import { useQuery, useMutation, useLocalState } from '@/lib/useQuery'
import { businesses, reports } from '@/lib/api'
import { businessPerformance, businessValuation, monthlySeries } from '@/lib/calc'
import { money, moneyCompact, number, percent, relativeTime } from '@/lib/format'
import { downloadCsv } from '@/lib/export'
import toast from 'react-hot-toast'

/* =====================================================================
   Projects — the venture portfolio.

   What changed and why:

   1. "Add Business" was its own sidebar item. A create action is not a
      destination; it is now a button on this page and a dialog. That removed
      one sidebar entry and one full page.

   2. Categories were stored in localStorage under
      `xco_business_categories_v1` and defaulted to ['food','software',
      'services']. Kept working exactly as before so nothing is lost, but the
      "Add Category" panel is folded into the create dialog instead of
      occupying half the page. (Moving these to the database is SRS FR-E10.)

   3. The legacy grid grouped cards by category with a coloured header per
      group, which meant a founder with 8 ventures scrolled through 4 headers
      to compare two numbers. Table view is now the default because the
      primary job here is comparison; card view stays available for scanning.

   4. Every card had "Open" and "Delete" buttons side by side. Delete now
      lives behind the row menu, so the destructive action is not adjacent to
      the one people click constantly.
   ===================================================================== */

const CATEGORIES_KEY = 'xco_business_categories_v1'
const DEFAULT_CATEGORIES = ['food', 'software', 'services']

const SORTS = [
  { value: 'net_desc', label: 'Net result (high → low)' },
  { value: 'net_asc', label: 'Net result (low → high)' },
  { value: 'revenue_desc', label: 'Revenue (high → low)' },
  { value: 'valuation_desc', label: 'Valuation (high → low)' },
  { value: 'name_asc', label: 'Name (A → Z)' },
]

function useCategories() {
  const [categories, setCategories] = useLocalState(CATEGORIES_KEY, DEFAULT_CATEGORIES)
  const add = React.useCallback(
    (raw) => {
      const value = String(raw ?? '').trim().toLowerCase()
      if (!value) return false
      if (categories.includes(value)) return false
      setCategories([...categories, value])
      return true
    },
    [categories, setCategories]
  )
  return { categories, add }
}

/* Tiny inline sparkline — no chart library, no layout shift. */
function Sparkline({ values, className }) {
  const points = React.useMemo(() => {
    if (!values || values.length < 2) return null
    const min = Math.min(...values)
    const max = Math.max(...values)
    const span = max - min || 1
    const w = 72
    const h = 22
    return values
      .map((v, i) => {
        const x = (i / (values.length - 1)) * w
        const y = h - ((v - min) / span) * h
        return `${x.toFixed(1)},${y.toFixed(1)}`
      })
      .join(' ')
  }, [values])

  if (!points) return <span className="text-xs text-muted-foreground">—</span>
  const last = values[values.length - 1]
  const first = values[0]
  const up = last >= first
  return (
    <svg viewBox="0 0 72 22" className={className} width="72" height="22" aria-hidden="true">
      <polyline
        points={points}
        fill="none"
        stroke={up ? 'hsl(var(--success))' : 'hsl(var(--destructive))'}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function CreateProjectDialog({ open, onClose, onCreated }) {
  const { categories, add: addCategory } = useCategories()
  const [form, setForm] = React.useState({ name: '', type: '', value: '' })
  const [newCategory, setNewCategory] = React.useState('')
  const [errors, setErrors] = React.useState({})

  React.useEffect(() => {
    if (open) {
      setForm({ name: '', type: '', value: '' })
      setNewCategory('')
      setErrors({})
    }
  }, [open])

  const create = useMutation(
    () => businesses.create({ name: form.name.trim(), type: form.type, value: form.value === '' ? undefined : Number(form.value) }),
    {
      onSuccess: () => {
        toast.success(`${form.name.trim()} added`)
        onCreated?.()
        onClose()
      },
      onError: (e) => toast.error(e.message),
    }
  )

  function submit(e) {
    e.preventDefault()
    const next = {}
    if (!form.name.trim()) next.name = 'Project name is required'
    if (form.value !== '' && !Number.isFinite(Number(form.value))) next.value = 'Enter a valid number'
    setErrors(next)
    if (Object.keys(next).length > 0) return
    create.run()
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Add project"
      description="A project is a venture operating under ExCompany."
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={create.busy}>
            Cancel
          </Button>
          <Button type="submit" form="create-project" disabled={create.busy}>
            {create.busy ? 'Adding…' : 'Add project'}
          </Button>
        </>
      }
    >
      <form id="create-project" onSubmit={submit} className="space-y-5">
        <FieldGrid cols={2}>
          <Field label="Project name" required htmlFor="p-name" error={errors.name}>
            <TextInput
              id="p-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Scrapco"
              invalid={Boolean(errors.name)}
              autoFocus
            />
          </Field>
          <Field label="Category" htmlFor="p-type" hint="Used to group the portfolio">
            <Select
              id="p-type"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              placeholder="Select category"
            >
              {categories.map((c) => (
                <option key={c} value={c} className="capitalize">
                  {c}
                </option>
              ))}
            </Select>
          </Field>
        </FieldGrid>

        <Field
          label="Valuation"
          htmlFor="p-value"
          hint="Optional. Used to calculate variance against money invested."
          error={errors.value}
        >
          <TextInput
            id="p-value"
            type="number"
            inputMode="decimal"
            min="0"
            value={form.value}
            onChange={(e) => setForm({ ...form, value: e.target.value })}
            placeholder="0"
            invalid={Boolean(errors.value)}
          />
        </Field>

        <div className="rounded-[--radius] border border-border bg-muted/40 p-3">
          <p className="mb-2 text-[13px] font-medium">Need a new category?</p>
          <div className="flex gap-2">
            <TextInput
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="manufacturing"
              aria-label="New category name"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (addCategory(newCategory)) {
                  setForm({ ...form, type: newCategory.trim().toLowerCase() })
                  setNewCategory('')
                  toast.success('Category added')
                } else {
                  toast.error('Enter a new, unique category')
                }
              }}
            >
              Add
            </Button>
          </div>
        </div>
      </form>
    </Dialog>
  )
}

export default function ProjectsPage() {
  const [params, setParams] = useSearchParams()
  const { categories } = useCategories()
  const [search, setSearch] = React.useState('')
  const [category, setCategory] = React.useState('all')
  const [sort, setSort] = React.useState('net_desc')
  const [view, setView] = useLocalState('exflow.projects.view', 'table')
  const [pendingDelete, setPendingDelete] = React.useState(null)

  const createOpen = params.get('new') === '1'
  const setCreateOpen = (next) =>
    setParams((prev) => {
      const p = new URLSearchParams(prev)
      if (next) p.set('new', '1')
      else p.delete('new')
      return p
    })

  const query = useQuery(async () => {
    const [list, reportRows] = await Promise.all([businesses.list(), reports.list().catch(() => [])])
    const grouped = new Map()
    for (const r of reportRows) {
      const key = String(r.business_id)
      const arr = grouped.get(key) ?? []
      arr.push(r)
      grouped.set(key, arr)
    }
    return list.map((b) => {
      const rows = grouped.get(String(b.id)) ?? []
      const series = monthlySeries(rows)
      return {
        ...b,
        perf: businessPerformance(rows, businessValuation(b)),
        trend: series.slice(-7).map((m) => m.profit),
        lastReport: rows.sort((a, z) => String(z.created_at).localeCompare(String(a.created_at)))[0] ?? null,
      }
    })
  }, [])

  const remove = useMutation((id) => businesses.remove(id), {
    onSuccess: () => {
      toast.success('Project deleted')
      setPendingDelete(null)
      query.refetch()
    },
    onError: (e) => toast.error(e.message),
  })

  const rows = React.useMemo(() => {
    let list = query.data ?? []
    if (search) {
      const q = search.toLowerCase()
      list = list.filter((b) => `${b.name} ${b.type ?? ''}`.toLowerCase().includes(q))
    }
    if (category !== 'all') {
      list = list.filter((b) =>
        category === 'other'
          ? !categories.includes(String(b.type ?? '').toLowerCase())
          : String(b.type ?? '').toLowerCase() === category
      )
    }
    const sorted = [...list]
    if (sort === 'net_desc') sorted.sort((a, b) => b.perf.net - a.perf.net)
    if (sort === 'net_asc') sorted.sort((a, b) => a.perf.net - b.perf.net)
    if (sort === 'revenue_desc') sorted.sort((a, b) => b.perf.revenue - a.perf.revenue)
    if (sort === 'valuation_desc') sorted.sort((a, b) => b.perf.valuation - a.perf.valuation)
    if (sort === 'name_asc') sorted.sort((a, b) => String(a.name).localeCompare(String(b.name)))
    return sorted
  }, [query.data, search, category, sort, categories])

  const totals = React.useMemo(
    () =>
      rows.reduce(
        (acc, b) => {
          acc.revenue += b.perf.revenue
          acc.invested += b.perf.invested
          acc.net += b.perf.net
          acc.valuation += b.perf.valuation
          return acc
        },
        { revenue: 0, invested: 0, net: 0, valuation: 0 }
      ),
    [rows]
  )

  const categoryOptions = React.useMemo(
    () => [
      { value: 'all', label: 'All categories' },
      ...categories.map((c) => ({ value: c, label: c.charAt(0).toUpperCase() + c.slice(1) })),
      { value: 'other', label: 'Other' },
    ],
    [categories]
  )

  return (
    <Page>
      <PageHeader
        title="Projects"
        description="Every venture operating under ExCompany"
        actions={
          <>
            <Button
              variant="outline"
              disabled={rows.length === 0}
              onClick={() => {
                downloadCsv(
                  'projects',
                  rows.map((b) => ({
                    name: b.name,
                    category: b.type ?? '',
                    valuation: b.perf.valuation,
                    revenue: b.perf.revenue,
                    invested: b.perf.invested,
                    net_result: b.perf.net,
                    variance: b.perf.variance,
                    reports: b.perf.reportCount,
                  }))
                )
                toast.success('Exported')
              }}
            >
              <Download aria-hidden="true" />
              Export
            </Button>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus aria-hidden="true" />
              Add project
            </Button>
          </>
        }
      />

      <PageBody className="space-y-4">
        <StatGrid cols={4}>
          <StatCard label="Portfolio value" value={money(totals.valuation)} hint="Sum of project valuations" icon={Briefcase} />
          <StatCard label="Total invested" value={money(totals.invested)} hint="All recorded expense" />
          <StatCard label="Revenue" value={money(totals.revenue)} hint="All recorded income" />
          <StatCard
            label="Net result"
            value={money(totals.net)}
            tone={totals.net >= 0 ? 'positive' : 'negative'}
            hint={totals.invested > 0 ? `${percent((totals.net / totals.invested) * 100)} on invested` : undefined}
            icon={totals.net >= 0 ? TrendingUp : TrendingDown}
          />
        </StatGrid>

        <SectionCard flush>
          <div className="px-4 pt-4 sm:px-5">
            <Toolbar>
              <SearchInput value={search} onChange={setSearch} placeholder="Search projects…" />
              <FilterSelect label="Category" value={category} onChange={setCategory} options={categoryOptions} />
              <FilterSelect label="Sort" value={sort} onChange={setSort} options={SORTS} />
              <ToolbarSpacer />
              <div className="flex items-center rounded-[--radius] border border-border p-0.5">
                <Button
                  variant={view === 'table' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-7 px-2"
                  onClick={() => setView('table')}
                  aria-pressed={view === 'table'}
                >
                  <List aria-hidden="true" />
                  <span className="sr-only">Table view</span>
                </Button>
                <Button
                  variant={view === 'cards' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-7 px-2"
                  onClick={() => setView('cards')}
                  aria-pressed={view === 'cards'}
                >
                  <LayoutGrid aria-hidden="true" />
                  <span className="sr-only">Card view</span>
                </Button>
              </div>
            </Toolbar>
          </div>

          <AsyncView
            query={query}
            skeleton={view === 'cards' ? 'cards' : 'table'}
            skeletonProps={view === 'cards' ? { count: 6 } : { columns: 7 }}
            empty={{
              icon: Briefcase,
              title: 'No projects yet',
              description: 'Add your first venture to start tracking revenue, spend and valuation.',
              action: <Button onClick={() => setCreateOpen(true)}>Add project</Button>,
            }}
          >
            {() =>
              rows.length === 0 ? (
                <EmptyState
                  compact
                  icon={Briefcase}
                  title="No matches"
                  description="Try a different search term or category."
                />
              ) : view === 'table' ? (
                <TableWrap>
                  <Table>
                    <THead>
                      <TR>
                        <TH>Project</TH>
                        <TH>Category</TH>
                        <TH numeric>Valuation</TH>
                        <TH numeric>Revenue</TH>
                        <TH numeric>Invested</TH>
                        <TH numeric>Net result</TH>
                        <TH>Trend</TH>
                        <TH>Last report</TH>
                        <TH className="w-10" />
                      </TR>
                    </THead>
                    <TBody>
                      {rows.map((b) => (
                        <TR key={b.id}>
                          <TD>
                            <Link to={`/app/projects/${b.id}`} className="font-medium hover:underline">
                              {b.name}
                            </Link>
                          </TD>
                          <TD>
                            {b.type ? (
                              <Badge size="sm" className="capitalize">
                                {b.type}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TD>
                          <TD numeric>{money(b.perf.valuation)}</TD>
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
                            <Sparkline values={b.trend} />
                          </TD>
                          <TD>
                            <span className="whitespace-nowrap text-[13px] text-muted-foreground">
                              {b.lastReport?.created_at ? relativeTime(b.lastReport.created_at) : 'Never'}
                            </span>
                          </TD>
                          <TD>
                            <ActionMenu
                              items={[
                                { label: 'Open project', icon: Briefcase, onSelect: () => window.location.assign(`/app/projects/${b.id}`) },
                                { separator: true },
                                { label: 'Delete project', icon: Trash2, destructive: true, onSelect: () => setPendingDelete(b) },
                              ]}
                            />
                          </TD>
                        </TR>
                      ))}
                    </TBody>
                    <TFoot>
                      <TR>
                        <TD colSpan={2} className="font-medium">
                          {rows.length} {rows.length === 1 ? 'project' : 'projects'}
                        </TD>
                        <TD numeric>{money(totals.valuation)}</TD>
                        <TD numeric>{money(totals.revenue)}</TD>
                        <TD numeric>{money(totals.invested)}</TD>
                        <TD numeric>{money(totals.net)}</TD>
                        <TD colSpan={3} />
                      </TR>
                    </TFoot>
                  </Table>
                </TableWrap>
              ) : (
                <div className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3 sm:p-5">
                  {rows.map((b) => (
                    <Link
                      key={b.id}
                      to={`/app/projects/${b.id}`}
                      className="group rounded-[--radius-lg] border border-border bg-card p-4 transition-colors hover:border-[hsl(215_16%_82%)] hover:shadow-[--shadow-sm]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-medium">{b.name}</p>
                          {b.type && <p className="truncate text-xs capitalize text-muted-foreground">{b.type}</p>}
                        </div>
                        <Sparkline values={b.trend} className="shrink-0" />
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground">Revenue</p>
                          <p className="font-medium tabular">{moneyCompact(b.perf.revenue)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Invested</p>
                          <p className="font-medium tabular">{moneyCompact(b.perf.invested)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Net result</p>
                          <p
                            className={
                              b.perf.net >= 0
                                ? 'font-medium tabular text-[hsl(var(--success))]'
                                : 'font-medium tabular text-[hsl(var(--destructive))]'
                            }
                          >
                            {moneyCompact(b.perf.net)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Reports</p>
                          <p className="font-medium tabular">{number(b.perf.reportCount)}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )
            }
          </AsyncView>
        </SectionCard>
      </PageBody>

      <CreateProjectDialog open={createOpen} onClose={() => setCreateOpen(false)} onCreated={query.refetch} />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => remove.run(pendingDelete.id)}
        title={`Delete ${pendingDelete?.name}?`}
        description="All daily reports, work logs and tasks for this project will be removed too."
        confirmLabel="Delete project"
        destructive
        busy={remove.busy}
      />
    </Page>
  )
}
