import * as React from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Download, FileText, Plus, Trash2, User, Users, Wallet } from 'lucide-react'
import { Page, PageHeader, PageBody, Toolbar, SearchInput, FilterSelect, ToolbarSpacer } from '@/components/patterns/Page'
import { StatCard, StatGrid } from '@/components/patterns/StatCard'
import { SectionCard } from '@/components/patterns/SectionCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ActionMenu } from '@/components/ui/menu'
import { Dialog, ConfirmDialog } from '@/components/ui/dialog'
import { Field, FieldGrid, TextInput, Checkbox } from '@/components/ui/field'
import { AsyncView, EmptyState } from '@/components/ui/states'
import { TableWrap, Table, THead, TBody, TFoot, TR, TH, TD } from '@/components/ui/table'
import { useQuery, useMutation } from '@/lib/useQuery'
import { people } from '@/lib/api'
import { salaryProjection, DEFAULT_ANNUAL_RATE } from '@/lib/calc'
import { money, number, date, initials, todayISO } from '@/lib/format'
import { downloadCsv } from '@/lib/export'
import toast from 'react-hot-toast'

/* =====================================================================
   People — the team, their pay and what is owed either way.

   Legacy problems fixed:

   1. "Employees of The X Company" and "Add Employee" were two sidebar items.
      The label was so long it wrapped. Now one page called People, with a
      button.

   2. Each employee row carried four buttons (View Profile / Delete / Payslip
      PDF / Ledger) plus an inline expandable "▶ View Breakdowns" table of up
      to 240 monthly rows rendered directly in the list. A team of ten made
      the page thousands of rows long. Breakdowns moved to the person's own
      page; the row now shows the numbers that matter and one menu.

   3. Delete sat immediately next to View Profile. It is now behind the menu,
      confirmed, and states what else gets removed.

   Salary maths is untouched — same 1.84 gross multiple, same monthly
   compounding of the annual rate.
   ===================================================================== */

const EMPTY = {
  name: '',
  role: '',
  salaryFixed: false,
  basicPay: '',
  startDate: todayISO(),
}

function AddPersonDialog({ open, onClose, onDone }) {
  const [form, setForm] = React.useState(EMPTY)
  const [errors, setErrors] = React.useState({})

  React.useEffect(() => {
    if (open) {
      setForm(EMPTY)
      setErrors({})
    }
  }, [open])

  const basic = Number(form.basicPay) || 0
  const preview = React.useMemo(
    () =>
      form.salaryFixed && basic > 0
        ? salaryProjection({ basicPay: basic, startDate: form.startDate, annualRate: DEFAULT_ANNUAL_RATE })
        : null,
    [form.salaryFixed, basic, form.startDate]
  )

  const save = useMutation(
    async () => {
      const created = await people.create({ name: form.name.trim(), role: form.role.trim() || 'EMPLOYEE' })
      if (form.salaryFixed && created?.id) {
        await people.saveSalaryConfig({
          employeeId: created.id,
          salaryFixed: true,
          basicPay: basic,
          startDate: form.startDate,
          annualRate: DEFAULT_ANNUAL_RATE,
        })
      }
      return created
    },
    {
      onSuccess: () => {
        toast.success(`${form.name.trim()} added`)
        onDone?.()
        onClose()
      },
      onError: (e) => toast.error(e.message),
    }
  )

  function submit(e) {
    e.preventDefault()
    const next = {}
    if (!form.name.trim()) next.name = 'Name is required'
    if (form.salaryFixed && (!form.basicPay || basic <= 0)) next.basicPay = 'Enter the basic pay'
    if (form.salaryFixed && !form.startDate) next.startDate = 'Start date is required'
    setErrors(next)
    if (Object.keys(next).length > 0) return
    save.run()
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Add person"
      description="Create the record now; salary can be configured later."
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={save.busy}>
            Cancel
          </Button>
          <Button type="submit" form="person-form" disabled={save.busy}>
            {save.busy ? 'Adding…' : 'Add person'}
          </Button>
        </>
      }
    >
      <form id="person-form" onSubmit={submit} className="space-y-5">
        <FieldGrid cols={2}>
          <Field label="Full name" required htmlFor="pp-name" error={errors.name}>
            <TextInput
              id="pp-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Mukul Saini"
              invalid={Boolean(errors.name)}
              autoFocus
            />
          </Field>
          <Field label="Role" htmlFor="pp-role" hint="Defaults to EMPLOYEE">
            <TextInput
              id="pp-role"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              placeholder="PRIMARY_MANAGER"
            />
          </Field>
        </FieldGrid>

        <div className="rounded-[--radius] border border-border bg-muted/40 p-3">
          <Checkbox
            id="pp-fixed"
            label="This person is on a fixed salary"
            checked={form.salaryFixed}
            onChange={(e) => setForm({ ...form, salaryFixed: e.target.checked })}
          />

          {form.salaryFixed && (
            <div className="mt-4 space-y-4">
              <FieldGrid cols={2}>
                <Field label="Basic pay (monthly)" required htmlFor="pp-basic" error={errors.basicPay}>
                  <TextInput
                    id="pp-basic"
                    type="number"
                    inputMode="decimal"
                    min="0"
                    value={form.basicPay}
                    onChange={(e) => setForm({ ...form, basicPay: e.target.value })}
                    placeholder="0"
                    invalid={Boolean(errors.basicPay)}
                  />
                </Field>
                <Field label="Start date" required htmlFor="pp-start" error={errors.startDate}>
                  <TextInput
                    id="pp-start"
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    invalid={Boolean(errors.startDate)}
                  />
                </Field>
              </FieldGrid>

              {preview && (
                <div className="rounded-[--radius] border border-border bg-card p-3">
                  <p className="mb-2 text-[13px] font-medium">Gross breakdown</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[13px] sm:grid-cols-3">
                    <p className="flex justify-between gap-2">
                      <span className="text-muted-foreground">Basic</span>
                      <span className="tabular">{money(preview.current.basicPay)}</span>
                    </p>
                    <p className="flex justify-between gap-2">
                      <span className="text-muted-foreground">DA 50%</span>
                      <span className="tabular">{money(preview.current.da)}</span>
                    </p>
                    <p className="flex justify-between gap-2">
                      <span className="text-muted-foreground">HRA 20%</span>
                      <span className="tabular">{money(preview.current.hra)}</span>
                    </p>
                    <p className="flex justify-between gap-2">
                      <span className="text-muted-foreground">Medical 10%</span>
                      <span className="tabular">{money(preview.current.medical)}</span>
                    </p>
                    <p className="flex justify-between gap-2">
                      <span className="text-muted-foreground">WiFi 4%</span>
                      <span className="tabular">{money(preview.current.wifi)}</span>
                    </p>
                    <p className="flex justify-between gap-2 font-medium">
                      <span>Gross</span>
                      <span className="tabular">{money(preview.current.gross)}</span>
                    </p>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Basic grows {Math.round(DEFAULT_ANNUAL_RATE * 100)}% a year, compounded monthly.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </form>
    </Dialog>
  )
}

export default function PeoplePage() {
  const [params, setParams] = useSearchParams()
  const [search, setSearch] = React.useState('')
  const [payType, setPayType] = React.useState('all')
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [pendingDelete, setPendingDelete] = React.useState(null)

  React.useEffect(() => {
    if (params.get('new') === '1') setDialogOpen(true)
  }, [params])

  function closeDialog() {
    setDialogOpen(false)
    setParams((prev) => {
      const p = new URLSearchParams(prev)
      p.delete('new')
      return p
    })
  }

  const query = useQuery(async () => {
    const [list, configs] = await Promise.all([people.list(), people.salaryConfigs().catch(() => [])])
    // Newest config per employee wins — the table has no unique constraint.
    const byEmployee = new Map()
    for (const c of configs) {
      const existing = byEmployee.get(String(c.employee_id))
      if (!existing || String(c.created_at ?? '') > String(existing.created_at ?? '')) {
        byEmployee.set(String(c.employee_id), c)
      }
    }
    return list.map((p) => {
      const config = byEmployee.get(String(p.id)) ?? null
      const projection = config?.salary_fixed
        ? salaryProjection({
            basicPay: config.basic_pay,
            startDate: config.start_date,
            annualRate: config.annual_rate ?? DEFAULT_ANNUAL_RATE,
          })
        : null
      return { ...p, config, projection }
    })
  }, [])

  const remove = useMutation((id) => people.remove(id), {
    onSuccess: () => {
      toast.success('Person removed')
      setPendingDelete(null)
      query.refetch()
    },
    onError: (e) => toast.error(e.message),
  })

  const rows = React.useMemo(() => {
    let list = query.data ?? []
    if (search) {
      const q = search.toLowerCase()
      list = list.filter((p) => `${p.name ?? ''} ${p.role ?? ''}`.toLowerCase().includes(q))
    }
    if (payType === 'fixed') list = list.filter((p) => p.config?.salary_fixed)
    if (payType === 'unset') list = list.filter((p) => !p.config?.salary_fixed)
    return list
  }, [query.data, search, payType])

  const totals = React.useMemo(
    () =>
      rows.reduce(
        (acc, p) => {
          if (p.projection) {
            acc.monthly += p.projection.current.gross
            acc.accrued += p.projection.accumulated
            acc.onPayroll += 1
          }
          return acc
        },
        { monthly: 0, accrued: 0, onPayroll: 0 }
      ),
    [rows]
  )

  return (
    <Page>
      <PageHeader
        title="People"
        description="The team, their pay and what the company owes them"
        actions={
          <>
            <Button
              variant="outline"
              disabled={rows.length === 0}
              onClick={() => {
                downloadCsv(
                  'people',
                  rows.map((p) => ({
                    name: p.name,
                    role: p.role ?? '',
                    salary_fixed: p.config?.salary_fixed ? 'yes' : 'no',
                    basic_pay: p.config?.basic_pay ?? '',
                    start_date: p.config?.start_date ?? '',
                    months: p.projection?.months ?? '',
                    current_gross: p.projection ? p.projection.current.gross.toFixed(2) : '',
                    accrued_gross: p.projection ? p.projection.accumulated.toFixed(2) : '',
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
              Add person
            </Button>
          </>
        }
      />

      <PageBody className="space-y-4">
        <StatGrid cols={4}>
          <StatCard label="Team size" value={number((query.data ?? []).length)} icon={Users} />
          <StatCard label="On fixed salary" value={number(totals.onPayroll)} hint="With a pay configuration" />
          <StatCard label="Monthly payroll" value={money(totals.monthly)} hint="Current gross, all fixed salaries" icon={Wallet} />
          <StatCard
            label="Accrued to date"
            value={money(totals.accrued)}
            hint="Total gross earned since joining"
          />
        </StatGrid>

        <SectionCard flush>
          <div className="px-4 pt-4 sm:px-5">
            <Toolbar>
              <SearchInput value={search} onChange={setSearch} placeholder="Search people…" />
              <FilterSelect
                label="Pay"
                value={payType}
                onChange={setPayType}
                options={[
                  { value: 'all', label: 'Everyone' },
                  { value: 'fixed', label: 'Fixed salary' },
                  { value: 'unset', label: 'No salary set' },
                ]}
              />
              <ToolbarSpacer />
            </Toolbar>
          </div>

          <AsyncView
            query={query}
            skeletonProps={{ columns: 6 }}
            empty={{
              icon: Users,
              title: 'No people yet',
              description: 'Add your first team member to track salary and ledgers.',
              action: <Button onClick={() => setDialogOpen(true)}>Add person</Button>,
            }}
          >
            {() =>
              rows.length === 0 ? (
                <EmptyState compact icon={Users} title="No people match these filters" />
              ) : (
                <TableWrap>
                  <Table>
                    <THead>
                      <TR>
                        <TH>Person</TH>
                        <TH>Role</TH>
                        <TH>Joined</TH>
                        <TH numeric>Months</TH>
                        <TH numeric>Current gross</TH>
                        <TH numeric>Accrued</TH>
                        <TH className="w-10" />
                      </TR>
                    </THead>
                    <TBody>
                      {rows.map((p) => (
                        <TR key={p.id}>
                          <TD>
                            <div className="flex items-center gap-2.5">
                              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold">
                                {initials(p.name)}
                              </span>
                              <Link to={`/app/team/${p.id}`} className="font-medium hover:underline">
                                {p.name}
                              </Link>
                            </div>
                          </TD>
                          <TD>
                            <span className="text-[13px] text-muted-foreground">{p.role || '—'}</span>
                          </TD>
                          <TD>
                            <span className="whitespace-nowrap text-[13px] text-muted-foreground">
                              {p.config?.start_date ? date(p.config.start_date) : date(p.created_at)}
                            </span>
                          </TD>
                          <TD numeric>
                            {p.projection ? number(p.projection.months) : <span className="text-muted-foreground">—</span>}
                          </TD>
                          <TD numeric>
                            {p.projection ? (
                              money(p.projection.current.gross)
                            ) : (
                              <Badge size="sm">Not set</Badge>
                            )}
                          </TD>
                          <TD numeric>
                            {p.projection ? (
                              <span className="font-medium">{money(p.projection.accumulated)}</span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TD>
                          <TD>
                            <ActionMenu
                              items={[
                                {
                                  label: 'Open profile',
                                  icon: User,
                                  onSelect: () => window.location.assign(`/app/team/${p.id}`),
                                },
                                {
                                  label: 'Ledger',
                                  icon: FileText,
                                  onSelect: () => window.location.assign(`/app/team/${p.id}?tab=ledger`),
                                },
                                { separator: true },
                                { label: 'Remove person', icon: Trash2, destructive: true, onSelect: () => setPendingDelete(p) },
                              ]}
                            />
                          </TD>
                        </TR>
                      ))}
                    </TBody>
                    <TFoot>
                      <TR>
                        <TD colSpan={4} className="font-medium">
                          {rows.length} {rows.length === 1 ? 'person' : 'people'}
                        </TD>
                        <TD numeric>{money(totals.monthly)}</TD>
                        <TD numeric>{money(totals.accrued)}</TD>
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

      <AddPersonDialog open={dialogOpen} onClose={closeDialog} onDone={query.refetch} />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => remove.run(pendingDelete.id)}
        title={`Remove ${pendingDelete?.name}?`}
        description="Their shares, work logs, payout details, salary config and ledger entries will be removed too."
        confirmLabel="Remove person"
        destructive
        busy={remove.busy}
      />
    </Page>
  )
}
