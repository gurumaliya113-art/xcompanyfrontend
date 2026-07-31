import * as React from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { ArrowDownLeft, ArrowUpRight, FileText, Pencil, Plus, Receipt, Trash2, Wallet } from 'lucide-react'
import { Page, PageHeader, PageBody } from '@/components/patterns/Page'
import { StatCard, StatGrid } from '@/components/patterns/StatCard'
import { SectionCard, DetailList, DetailRow, SplitLayout } from '@/components/patterns/SectionCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ActionMenu } from '@/components/ui/menu'
import { Dialog, ConfirmDialog } from '@/components/ui/dialog'
import { Field, FieldGrid, TextInput, Select, Checkbox } from '@/components/ui/field'
import { Tabs } from '@/components/ui/tabs'
import { AsyncView, EmptyState, ErrorState } from '@/components/ui/states'
import { TableWrap, Table, THead, TBody, TFoot, TR, TH, TD } from '@/components/ui/table'
import { useQuery, useMutation } from '@/lib/useQuery'
import { people } from '@/lib/api'
import { salaryProjection, salarySchedule, ledgerTotals, DEFAULT_ANNUAL_RATE } from '@/lib/calc'
import { money, number, date, percent, monthLabel, initials, todayISO } from '@/lib/format'
import { downloadCsv, downloadPayslipPdf } from '@/lib/export'
import { breadcrumbsFor } from '@/app/navigation'
import toast from 'react-hot-toast'

/* =====================================================================
   Person detail — salary, breakdown, ledger and payslip in one place.

   Merges three legacy views: openEmployeeProfile (salary card + monthly
   breakdown), showEmployeeLedger (AR/AP with its own header and its own PDF
   button), and saveEmployeePayslipPDF (fired from a button in the list).

   Two things preserved exactly because they affect money:
   - The AR/AP net position adds the current month's gross to the AP side
     automatically, as the legacy ledger did.
   - Payslip worked days is 26. That is hardcoded in the source data model,
     not something this rebuild can invent — it is surfaced as an editable
     field on the payslip dialog instead of being silently assumed.
   ===================================================================== */

const LEDGER_TYPES = [
  { value: 'AP', label: 'Company owes them (AP)' },
  { value: 'AR', label: 'They owe the company (AR)' },
]

function LedgerEntryDialog({ open, onClose, employeeId, entry, onDone }) {
  const editing = Boolean(entry)
  const [form, setForm] = React.useState({ type: 'AP', description: '', amount: '', date: todayISO() })
  const [errors, setErrors] = React.useState({})

  React.useEffect(() => {
    if (!open) return
    setErrors({})
    setForm(
      entry
        ? { type: entry.type, description: entry.description ?? '', amount: entry.amount ?? '', date: entry.date ?? todayISO() }
        : { type: 'AP', description: '', amount: '', date: todayISO() }
    )
  }, [open, entry])

  const save = useMutation(
    () => {
      const payload = {
        type: form.type,
        description: form.description.trim(),
        amount: Number(form.amount) || 0,
        date: form.date,
      }
      return editing
        ? people.updateLedgerEntry(entry.id, payload)
        : people.addLedgerEntry({ employeeId, ...payload })
    },
    {
      onSuccess: () => {
        toast.success(editing ? 'Entry updated' : 'Entry added')
        onDone?.()
        onClose()
      },
      onError: (e) => toast.error(e.message),
    }
  )

  function submit(e) {
    e.preventDefault()
    const next = {}
    if (!form.description.trim()) next.description = 'Describe what this is for'
    if (!form.amount || !(Number(form.amount) > 0)) next.amount = 'Enter an amount greater than zero'
    if (!form.date) next.date = 'Date is required'
    setErrors(next)
    if (Object.keys(next).length > 0) return
    save.run()
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={editing ? 'Edit ledger entry' : 'Add ledger entry'}
      description="Amounts are always positive; the type decides the direction."
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={save.busy}>
            Cancel
          </Button>
          <Button type="submit" form="ledger-form" disabled={save.busy}>
            {save.busy ? 'Saving…' : editing ? 'Save changes' : 'Add entry'}
          </Button>
        </>
      }
    >
      <form id="ledger-form" onSubmit={submit} className="space-y-5">
        <Field label="Type" required htmlFor="le-type">
          <Select id="le-type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            {LEDGER_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Description" required htmlFor="le-desc" error={errors.description}>
          <TextInput
            id="le-desc"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder={form.type === 'AR' ? 'Cash advance taken' : 'Travel reimbursement'}
            invalid={Boolean(errors.description)}
            autoFocus
          />
        </Field>
        <FieldGrid cols={2}>
          <Field label="Amount" required htmlFor="le-amount" error={errors.amount}>
            <TextInput
              id="le-amount"
              type="number"
              inputMode="decimal"
              min="0"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              placeholder="0"
              invalid={Boolean(errors.amount)}
            />
          </Field>
          <Field label="Date" required htmlFor="le-date" error={errors.date}>
            <TextInput
              id="le-date"
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              invalid={Boolean(errors.date)}
            />
          </Field>
        </FieldGrid>
      </form>
    </Dialog>
  )
}

function SalaryConfigDialog({ open, onClose, employeeId, config, onDone }) {
  const [form, setForm] = React.useState({ salaryFixed: true, basicPay: '', startDate: todayISO(), annualRate: '6' })
  const [errors, setErrors] = React.useState({})

  React.useEffect(() => {
    if (!open) return
    setErrors({})
    setForm({
      salaryFixed: config?.salary_fixed ?? true,
      basicPay: config?.basic_pay ?? '',
      startDate: config?.start_date ?? todayISO(),
      annualRate: String((config?.annual_rate ?? DEFAULT_ANNUAL_RATE) * 100),
    })
  }, [open, config])

  const save = useMutation(
    () =>
      people.saveSalaryConfig({
        employeeId,
        salaryFixed: form.salaryFixed,
        basicPay: Number(form.basicPay) || 0,
        startDate: form.startDate,
        annualRate: (Number(form.annualRate) || 6) / 100,
      }),
    {
      onSuccess: () => {
        toast.success('Salary updated')
        onDone?.()
        onClose()
      },
      onError: (e) => toast.error(e.message),
    }
  )

  function submit(e) {
    e.preventDefault()
    const next = {}
    if (form.salaryFixed && !(Number(form.basicPay) > 0)) next.basicPay = 'Enter the basic pay'
    if (!form.startDate) next.startDate = 'Start date is required'
    setErrors(next)
    if (Object.keys(next).length > 0) return
    save.run()
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Salary configuration"
      description="Saving creates a new configuration; earlier ones are kept as history."
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={save.busy}>
            Cancel
          </Button>
          <Button type="submit" form="salary-form" disabled={save.busy}>
            {save.busy ? 'Saving…' : 'Save'}
          </Button>
        </>
      }
    >
      <form id="salary-form" onSubmit={submit} className="space-y-5">
        <Checkbox
          id="sc-fixed"
          label="Fixed salary"
          checked={form.salaryFixed}
          onChange={(e) => setForm({ ...form, salaryFixed: e.target.checked })}
        />
        <FieldGrid cols={3}>
          <Field label="Basic pay" required htmlFor="sc-basic" error={errors.basicPay}>
            <TextInput
              id="sc-basic"
              type="number"
              inputMode="decimal"
              min="0"
              value={form.basicPay}
              onChange={(e) => setForm({ ...form, basicPay: e.target.value })}
              invalid={Boolean(errors.basicPay)}
            />
          </Field>
          <Field label="Start date" required htmlFor="sc-start" error={errors.startDate}>
            <TextInput
              id="sc-start"
              type="date"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              invalid={Boolean(errors.startDate)}
            />
          </Field>
          <Field label="Annual growth %" htmlFor="sc-rate" hint="Compounded monthly">
            <TextInput
              id="sc-rate"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.1"
              value={form.annualRate}
              onChange={(e) => setForm({ ...form, annualRate: e.target.value })}
            />
          </Field>
        </FieldGrid>
      </form>
    </Dialog>
  )
}

export default function PersonDetailPage() {
  const { id } = useParams()
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') ?? 'salary'
  const [ledgerDialog, setLedgerDialog] = React.useState({ open: false, entry: null })
  const [salaryDialog, setSalaryDialog] = React.useState(false)
  const [payslipDialog, setPayslipDialog] = React.useState(false)
  const [workedDays, setWorkedDays] = React.useState('26')
  const [pendingDelete, setPendingDelete] = React.useState(null)

  function setTab(next) {
    setParams((prev) => {
      const p = new URLSearchParams(prev)
      p.set('tab', next)
      return p
    })
  }

  const query = useQuery(async () => {
    const [person, config, hours] = await Promise.all([
      people.get(id),
      people.salaryConfig(id).catch(() => null),
      people.workHours(id).catch(() => []),
    ])
    if (!person) throw new Error('This person no longer exists.')
    return {
      person,
      config,
      totalHours: hours.reduce((s, h) => s + (Number(h.hours) || 0), 0),
    }
  }, [id])

  const ledgerQuery = useQuery(() => people.ledger(id), [id])

  const person = query.data?.person
  const config = query.data?.config

  const projection = React.useMemo(
    () =>
      config?.salary_fixed
        ? salaryProjection({
            basicPay: config.basic_pay,
            startDate: config.start_date,
            annualRate: config.annual_rate ?? DEFAULT_ANNUAL_RATE,
          })
        : null,
    [config]
  )

  const schedule = React.useMemo(
    () =>
      config?.salary_fixed
        ? salarySchedule({
            basicPay: config.basic_pay,
            startDate: config.start_date,
            annualRate: config.annual_rate ?? DEFAULT_ANNUAL_RATE,
          })
        : [],
    [config]
  )

  const totals = React.useMemo(
    () => ledgerTotals(ledgerQuery.data ?? [], projection?.current.gross ?? 0),
    [ledgerQuery.data, projection]
  )

  const removeEntry = useMutation((entryId) => people.removeLedgerEntry(entryId), {
    onSuccess: () => {
      toast.success('Entry removed')
      setPendingDelete(null)
      ledgerQuery.refetch()
    },
    onError: (e) => toast.error(e.message),
  })

  async function generatePayslip() {
    if (!projection) {
      toast.error('Set a fixed salary first')
      return
    }
    const now = new Date()
    await downloadPayslipPdf({
      employee: { name: person.name, role: person.role },
      period: now.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
      joiningDate: date(config.start_date ?? person.created_at),
      workedDays: Number(workedDays) || 26,
      earnings: [
        { label: 'Basic pay', value: money(projection.current.basicPay) },
        { label: 'Dearness allowance (50%)', value: money(projection.current.da) },
        { label: 'House rent allowance (20%)', value: money(projection.current.hra) },
        { label: 'Medical (10%)', value: money(projection.current.medical) },
        { label: 'WiFi / connectivity (4%)', value: money(projection.current.wifi) },
      ],
      deductions: [],
      netPay: money(projection.current.gross),
    })
    setPayslipDialog(false)
    toast.success('Payslip downloaded')
  }

  if (query.error) {
    return (
      <Page>
        <PageHeader title="Person" breadcrumbs={breadcrumbsFor('/app/team')} />
        <PageBody>
          <ErrorState error={query.error} title="Person not available" onRetry={query.refetch} />
          <div className="mt-4 text-center">
            <Button variant="outline" asChild>
              <Link to="/app/team">Back to people</Link>
            </Button>
          </div>
        </PageBody>
      </Page>
    )
  }

  return (
    <Page>
      <PageHeader
        title={person?.name ?? 'Loading…'}
        description={person?.role || 'Team member'}
        breadcrumbs={breadcrumbsFor('/app/team', [{ label: person?.name ?? '…' }])}
        meta={
          person && (
            <>
              <span className="flex size-6 items-center justify-center rounded-full bg-muted text-[10px] font-semibold">
                {initials(person.name)}
              </span>
              {config?.salary_fixed ? (
                <Badge size="sm" tone="success">
                  Fixed salary
                </Badge>
              ) : (
                <Badge size="sm">No salary set</Badge>
              )}
              {query.data?.totalHours > 0 && <Badge size="sm">{number(query.data.totalHours)} hours logged</Badge>}
            </>
          )
        }
        actions={
          <>
            <Button variant="outline" onClick={() => setSalaryDialog(true)}>
              <Pencil aria-hidden="true" />
              Salary
            </Button>
            <Button onClick={() => setPayslipDialog(true)} disabled={!projection}>
              <FileText aria-hidden="true" />
              Payslip
            </Button>
          </>
        }
      >
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { value: 'salary', label: 'Salary' },
            { value: 'ledger', label: 'Ledger' },
            { value: 'breakdown', label: 'Monthly breakdown', count: schedule.length || undefined },
          ]}
        />
      </PageHeader>

      <PageBody className="space-y-4">
        {tab === 'salary' && (
          <>
            <StatGrid cols={4}>
              <StatCard
                label="Current gross"
                value={projection ? money(projection.current.gross) : '—'}
                hint={projection ? `Basic ${money(projection.current.basicPay)}` : 'No salary configured'}
                icon={Wallet}
              />
              <StatCard
                label="Accrued to date"
                value={projection ? money(projection.accumulated) : '—'}
                hint={projection ? `${number(projection.months)} months` : undefined}
              />
              <StatCard
                label="Net position"
                value={money(Math.abs(totals.net))}
                tone={totals.net >= 0 ? 'negative' : 'positive'}
                hint={totals.net >= 0 ? 'Company owes them' : 'They owe the company'}
              />
              <StatCard
                label="Annual growth"
                value={projection ? percent(projection.annualRate * 100, 0) : '—'}
                hint="Compounded monthly"
              />
            </StatGrid>

            <SplitLayout
              main={
                <SectionCard title="Gross breakdown" description="Current month, derived from basic pay">
                  {projection ? (
                    <DetailList>
                      <DetailRow label="Basic pay">{money(projection.current.basicPay)}</DetailRow>
                      <DetailRow label="Dearness allowance (50%)">{money(projection.current.da)}</DetailRow>
                      <DetailRow label="House rent allowance (20%)">{money(projection.current.hra)}</DetailRow>
                      <DetailRow label="Medical (10%)">{money(projection.current.medical)}</DetailRow>
                      <DetailRow label="WiFi / connectivity (4%)">{money(projection.current.wifi)}</DetailRow>
                      <DetailRow label="Gross" className="font-semibold">
                        {money(projection.current.gross)}
                      </DetailRow>
                    </DetailList>
                  ) : (
                    <EmptyState
                      compact
                      icon={Wallet}
                      title="No salary configured"
                      description="Set a basic pay and start date to calculate gross and accrual."
                      action={
                        <Button size="sm" onClick={() => setSalaryDialog(true)}>
                          Configure salary
                        </Button>
                      }
                    />
                  )}
                </SectionCard>
              }
              aside={
                <SectionCard title="Record">
                  <DetailList>
                    <DetailRow label="Role">{person?.role || '—'}</DetailRow>
                    <DetailRow label="Joined">{date(config?.start_date ?? person?.created_at)}</DetailRow>
                    <DetailRow label="Months served">{projection ? number(projection.months) : '—'}</DetailRow>
                    <DetailRow label="Hours logged">{number(query.data?.totalHours ?? 0)}</DetailRow>
                    <DetailRow label="Starting basic">{config ? money(config.basic_pay) : '—'}</DetailRow>
                  </DetailList>
                </SectionCard>
              }
            />
          </>
        )}

        {tab === 'ledger' && (
          <>
            <StatGrid cols={3}>
              <StatCard
                label="They owe the company"
                value={money(totals.ar)}
                hint="Advances and recoveries"
                icon={ArrowUpRight}
              />
              <StatCard
                label="Company owes them"
                value={money(totals.ap)}
                hint="Includes this month's gross"
                icon={ArrowDownLeft}
              />
              <StatCard
                label="Net"
                value={money(Math.abs(totals.net))}
                tone={totals.net >= 0 ? 'negative' : 'positive'}
                hint={totals.net >= 0 ? 'Payable to them' : 'Recoverable from them'}
                icon={Receipt}
              />
            </StatGrid>

            <SectionCard
              title="Ledger entries"
              description="Newest first"
              actions={
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={(ledgerQuery.data ?? []).length === 0}
                    onClick={() => {
                      downloadCsv(
                        `${person?.name ?? 'person'}_ledger`,
                        (ledgerQuery.data ?? []).map((e) => ({
                          date: e.date,
                          type: e.type,
                          description: e.description,
                          amount: e.amount,
                        }))
                      )
                      toast.success('Exported')
                    }}
                  >
                    Export
                  </Button>
                  <Button size="sm" onClick={() => setLedgerDialog({ open: true, entry: null })}>
                    <Plus aria-hidden="true" />
                    Add entry
                  </Button>
                </>
              }
              flush
            >
              <AsyncView
                query={ledgerQuery}
                skeletonProps={{ columns: 4 }}
                empty={{
                  icon: Receipt,
                  title: 'No ledger entries',
                  description: 'Record advances, reimbursements or unpaid salary here.',
                  action: (
                    <Button onClick={() => setLedgerDialog({ open: true, entry: null })}>Add entry</Button>
                  ),
                }}
              >
                {(entries) => (
                  <TableWrap>
                    <Table>
                      <THead>
                        <TR>
                          <TH>Date</TH>
                          <TH>Type</TH>
                          <TH>Description</TH>
                          <TH numeric>Amount</TH>
                          <TH className="w-10" />
                        </TR>
                      </THead>
                      <TBody>
                        {entries.map((e) => (
                          <TR key={e.id}>
                            <TD>
                              <span className="whitespace-nowrap text-[13px]">{date(e.date)}</span>
                            </TD>
                            <TD>
                              <Badge size="sm" tone={e.type === 'AP' ? 'success' : 'warning'}>
                                {e.type === 'AP' ? 'Company owes' : 'They owe'}
                              </Badge>
                            </TD>
                            <TD>{e.description}</TD>
                            <TD numeric>{money(e.amount)}</TD>
                            <TD>
                              <ActionMenu
                                items={[
                                  {
                                    label: 'Edit entry',
                                    icon: Pencil,
                                    onSelect: () => setLedgerDialog({ open: true, entry: e }),
                                  },
                                  { separator: true },
                                  { label: 'Delete entry', icon: Trash2, destructive: true, onSelect: () => setPendingDelete(e) },
                                ]}
                              />
                            </TD>
                          </TR>
                        ))}
                      </TBody>
                      <TFoot>
                        <TR>
                          <TD colSpan={3} className="font-medium">
                            Net position
                          </TD>
                          <TD numeric>
                            <span
                              className={
                                totals.net >= 0
                                  ? 'font-semibold text-[hsl(var(--success))]'
                                  : 'font-semibold text-[hsl(var(--destructive))]'
                              }
                            >
                              {money(Math.abs(totals.net))}
                            </span>
                          </TD>
                          <TD />
                        </TR>
                      </TFoot>
                    </Table>
                  </TableWrap>
                )}
              </AsyncView>
              <div className="border-t border-border bg-muted/40 px-4 py-2.5 text-[13px] text-muted-foreground sm:px-5">
                This month's gross of {money(projection?.current.gross ?? 0)} is included on the payable side
                automatically.
              </div>
            </SectionCard>
          </>
        )}

        {tab === 'breakdown' && (
          <SectionCard
            title="Monthly breakdown"
            description={
              schedule.length > 0
                ? `${schedule.length} months since joining, with the running total`
                : 'Requires a fixed salary configuration'
            }
            actions={
              schedule.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    downloadCsv(
                      `${person?.name ?? 'person'}_salary_schedule`,
                      schedule.map((r) => ({
                        month_no: r.monthNo,
                        month: r.ym,
                        basic: r.basicPay.toFixed(2),
                        da: r.da.toFixed(2),
                        hra: r.hra.toFixed(2),
                        medical: r.medical.toFixed(2),
                        wifi: r.wifi.toFixed(2),
                        gross: r.gross.toFixed(2),
                        cumulative: r.cumulative.toFixed(2),
                      }))
                    )
                    toast.success('Exported')
                  }}
                >
                  Export
                </Button>
              )
            }
            flush
          >
            {schedule.length === 0 ? (
              <EmptyState
                compact
                icon={Wallet}
                title="Nothing to show yet"
                description="Configure a fixed salary to see the month-by-month schedule."
                action={
                  <Button size="sm" onClick={() => setSalaryDialog(true)}>
                    Configure salary
                  </Button>
                }
              />
            ) : (
              <TableWrap className="max-h-[560px] overflow-y-auto">
                <Table>
                  <THead className="sticky top-0 bg-card">
                    <TR>
                      <TH>#</TH>
                      <TH>Month</TH>
                      <TH numeric>Basic</TH>
                      <TH numeric>DA</TH>
                      <TH numeric>HRA</TH>
                      <TH numeric>Medical</TH>
                      <TH numeric>WiFi</TH>
                      <TH numeric>Gross</TH>
                      <TH numeric>Cumulative</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {schedule.map((r) => (
                      <TR key={r.monthNo}>
                        <TD>
                          <span className="text-[13px] text-muted-foreground tabular">{r.monthNo}</span>
                        </TD>
                        <TD>
                          <span className="whitespace-nowrap text-[13px]">{monthLabel(r.ym)}</span>
                        </TD>
                        <TD numeric>{money(r.basicPay)}</TD>
                        <TD numeric>{money(r.da)}</TD>
                        <TD numeric>{money(r.hra)}</TD>
                        <TD numeric>{money(r.medical)}</TD>
                        <TD numeric>{money(r.wifi)}</TD>
                        <TD numeric>
                          <span className="font-medium">{money(r.gross)}</span>
                        </TD>
                        <TD numeric>{money(r.cumulative)}</TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
              </TableWrap>
            )}
          </SectionCard>
        )}
      </PageBody>

      <LedgerEntryDialog
        open={ledgerDialog.open}
        entry={ledgerDialog.entry}
        employeeId={id}
        onClose={() => setLedgerDialog({ open: false, entry: null })}
        onDone={ledgerQuery.refetch}
      />

      <SalaryConfigDialog
        open={salaryDialog}
        onClose={() => setSalaryDialog(false)}
        employeeId={id}
        config={config}
        onDone={query.refetch}
      />

      <Dialog
        open={payslipDialog}
        onClose={() => setPayslipDialog(false)}
        title="Generate payslip"
        description={`${person?.name ?? ''} · ${new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}`}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setPayslipDialog(false)}>
              Cancel
            </Button>
            <Button onClick={generatePayslip}>
              <FileText aria-hidden="true" />
              Download PDF
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field
            label="Worked days"
            htmlFor="ps-days"
            hint="Attendance is not tracked in the system yet, so this defaults to 26."
          >
            <TextInput
              id="ps-days"
              type="number"
              min="0"
              max="31"
              value={workedDays}
              onChange={(e) => setWorkedDays(e.target.value)}
            />
          </Field>
          {projection && (
            <DetailList>
              <DetailRow label="Gross earnings">{money(projection.current.gross)}</DetailRow>
              <DetailRow label="Deductions">{money(0)}</DetailRow>
              <DetailRow label="Net pay" className="font-semibold">
                {money(projection.current.gross)}
              </DetailRow>
            </DetailList>
          )}
        </div>
      </Dialog>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => removeEntry.run(pendingDelete.id)}
        title="Delete this ledger entry?"
        confirmLabel="Delete"
        destructive
        busy={removeEntry.busy}
      />
    </Page>
  )
}
