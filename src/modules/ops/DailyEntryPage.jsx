import * as React from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, ClipboardList, Minus, Plus, TrendingDown, TrendingUp } from 'lucide-react'
import { Page, PageHeader, PageBody } from '@/components/patterns/Page'
import { SectionCard, DetailList, DetailRow, SplitLayout } from '@/components/patterns/SectionCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Field, FieldGrid, TextInput } from '@/components/ui/field'
import { EmptyState, Spinner } from '@/components/ui/states'
import { TableWrap, Table, THead, TBody, TR, TH, TD } from '@/components/ui/table'
import { useQuery, useMutation } from '@/lib/useQuery'
import { reports } from '@/lib/api'
import { reportProfit } from '@/lib/calc'
import { money, date, todayISO, relativeTime } from '@/lib/format'
import { useWorkspace, BusinessPicker } from '@/app/workspace'
import toast from 'react-hot-toast'

/* =====================================================================
   Daily Entry — the manager's one job each day.

   Legacy version: a business dropdown, three number inputs, and two disabled
   fields labelled "Profit" and "Loss" that were filled by
   `_recalcProfitLoss()`. Two fields for one number, where "Profit" showed 0
   whenever there was a loss and vice versa — you had to read both to know the
   result. A single signed result is clearer.

   It also had no memory: after saving, nothing confirmed the entry existed or
   showed what had already been logged, so managers routinely double-entered.
   This page now lists recent entries for the selected project and warns when
   an entry for that date already exists (the `reports` table has no unique
   constraint — SRS FR-F7).

   Save keeps the three-tier fallback (RPC → backend → direct insert) because
   the live `reports` schema is unknown.
   ===================================================================== */

export default function DailyEntryPage() {
  const { business, businessId, loading: bizLoading } = useWorkspace()
  const [form, setForm] = React.useState({ date: todayISO(), income: '', expense: '' })
  const [errors, setErrors] = React.useState({})
  const [justSaved, setJustSaved] = React.useState(null)

  const query = useQuery(() => reports.listForBusiness(businessId), [businessId], {
    enabled: Boolean(businessId),
  })

  const income = Number(form.income) || 0
  const expense = Number(form.expense) || 0
  const result = income - expense
  const hasValues = form.income !== '' || form.expense !== ''

  const existing = React.useMemo(
    () =>
      (query.data ?? []).find(
        (r) => String(r.report_date ?? '').slice(0, 10) === form.date
      ) ?? null,
    [query.data, form.date]
  )

  const recent = React.useMemo(() => (query.data ?? []).slice(0, 8), [query.data])

  const monthTotals = React.useMemo(() => {
    const month = form.date.slice(0, 7)
    return (query.data ?? []).reduce(
      (acc, r) => {
        const key = r.month ?? String(r.report_date ?? '').slice(0, 7)
        if (key !== month) return acc
        acc.income += Number(r.income) || 0
        acc.expense += Number(r.expense) || 0
        acc.net += reportProfit(r)
        acc.count += 1
        return acc
      },
      { income: 0, expense: 0, net: 0, count: 0 }
    )
  }, [query.data, form.date])

  const save = useMutation(
    () =>
      reports.save({
        businessId,
        date: form.date,
        income,
        expense,
        poolTaken: 0,
      }),
    {
      onSuccess: () => {
        toast.success('Entry saved')
        setJustSaved({ date: form.date, income, expense, result })
        setForm({ date: todayISO(), income: '', expense: '' })
        query.refetch()
      },
      onError: (e) => toast.error(e.message),
    }
  )

  function submit(e) {
    e.preventDefault()
    const next = {}
    if (!businessId) next.business = 'Select a project first'
    if (!form.date) next.date = 'Date is required'
    if (form.income === '' && form.expense === '') next.income = 'Enter income, expense, or both'
    if (form.income !== '' && !Number.isFinite(Number(form.income))) next.income = 'Enter a valid number'
    if (form.expense !== '' && !Number.isFinite(Number(form.expense))) next.expense = 'Enter a valid number'
    setErrors(next)
    if (Object.keys(next).length > 0) {
      if (next.business) toast.error(next.business)
      return
    }
    save.run()
  }

  return (
    <Page>
      <PageHeader
        title="Daily Entry"
        description="Log today's income and expense for one project"
        actions={<BusinessPicker />}
      />

      <PageBody className="space-y-4">
        <SplitLayout
          main={
            <>
              <SectionCard
                title="New entry"
                description={business ? `Recording against ${business.name}` : 'Select a project to begin'}
              >
                {bizLoading ? (
                  <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
                    <Spinner />
                    Loading projects…
                  </div>
                ) : !businessId ? (
                  <EmptyState
                    compact
                    icon={ClipboardList}
                    title="No project selected"
                    description="Pick a project from the selector above, or create one first."
                    action={
                      <Button size="sm" variant="outline" asChild>
                        <Link to="/app/projects?new=1">Add a project</Link>
                      </Button>
                    }
                  />
                ) : (
                  <form onSubmit={submit} className="space-y-5">
                    <Field label="Date" required htmlFor="de-date" error={errors.date} className="max-w-[200px]">
                      <TextInput
                        id="de-date"
                        type="date"
                        max={todayISO()}
                        value={form.date}
                        onChange={(e) => setForm({ ...form, date: e.target.value })}
                        invalid={Boolean(errors.date)}
                      />
                    </Field>

                    {/* Duplicate warning — the table allows two entries for the
                        same day, which is the most common data-quality problem. */}
                    {existing && (
                      <div className="rounded-[--radius] border border-[hsl(var(--warning)/0.25)] bg-[hsl(var(--warning-soft))] px-3 py-2.5 text-[13px] text-[hsl(var(--warning))]">
                        An entry for {date(form.date)} already exists — income {money(existing.income)}, expense{' '}
                        {money(existing.expense)}. Saving again will add a second entry for the same day.
                      </div>
                    )}

                    <FieldGrid cols={2}>
                      <Field label="Income" htmlFor="de-income" error={errors.income} hint="Money received today">
                        <TextInput
                          id="de-income"
                          type="number"
                          inputMode="decimal"
                          min="0"
                          step="0.01"
                          value={form.income}
                          onChange={(e) => setForm({ ...form, income: e.target.value })}
                          placeholder="0"
                          invalid={Boolean(errors.income)}
                        />
                      </Field>
                      <Field label="Expense" htmlFor="de-expense" error={errors.expense} hint="Money spent today">
                        <TextInput
                          id="de-expense"
                          type="number"
                          inputMode="decimal"
                          min="0"
                          step="0.01"
                          value={form.expense}
                          onChange={(e) => setForm({ ...form, expense: e.target.value })}
                          placeholder="0"
                          invalid={Boolean(errors.expense)}
                        />
                      </Field>
                    </FieldGrid>

                    {/* One signed result instead of separate Profit and Loss fields. */}
                    <div className="rounded-[--radius] border border-border bg-muted/50 px-4 py-3">
                      <p className="text-[13px] text-muted-foreground">Result for the day</p>
                      <p
                        className={
                          !hasValues
                            ? 'mt-0.5 text-2xl font-semibold tabular text-muted-foreground'
                            : result >= 0
                              ? 'mt-0.5 text-2xl font-semibold tabular text-[hsl(var(--success))]'
                              : 'mt-0.5 text-2xl font-semibold tabular text-[hsl(var(--destructive))]'
                        }
                      >
                        {hasValues ? money(result) : '—'}
                      </p>
                      {hasValues && (
                        <p className="mt-1 flex items-center gap-1.5 text-[13px] text-muted-foreground">
                          {result >= 0 ? (
                            <>
                              <TrendingUp className="size-3.5 text-[hsl(var(--success))]" aria-hidden="true" />
                              Profit
                            </>
                          ) : (
                            <>
                              <TrendingDown className="size-3.5 text-[hsl(var(--destructive))]" aria-hidden="true" />
                              Loss
                            </>
                          )}
                        </p>
                      )}
                    </div>

                    <Button type="submit" disabled={save.busy}>
                      {save.busy ? (
                        <>
                          <Spinner />
                          Saving…
                        </>
                      ) : (
                        <>
                          <Plus aria-hidden="true" />
                          Save entry
                        </>
                      )}
                    </Button>
                  </form>
                )}
              </SectionCard>

              {justSaved && (
                <div className="flex items-start gap-3 rounded-[--radius-lg] border border-[hsl(var(--success)/0.25)] bg-[hsl(var(--success-soft))] px-4 py-3">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[hsl(var(--success))]" aria-hidden="true" />
                  <div className="min-w-0 flex-1 text-[13px] text-[hsl(var(--success))]">
                    <p className="font-medium">Saved {date(justSaved.date)}</p>
                    <p className="mt-0.5">
                      Income {money(justSaved.income)} · Expense {money(justSaved.expense)} · Result{' '}
                      {money(justSaved.result)}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" className="shrink-0" onClick={() => setJustSaved(null)}>
                    <Minus aria-hidden="true" />
                    <span className="sr-only">Dismiss</span>
                  </Button>
                </div>
              )}

              <SectionCard title="Recent entries" description={business ? `Last ${recent.length} for ${business.name}` : ''} flush>
                {recent.length === 0 ? (
                  <EmptyState compact icon={ClipboardList} title="No entries yet for this project" />
                ) : (
                  <TableWrap>
                    <Table>
                      <THead>
                        <TR>
                          <TH>Date</TH>
                          <TH numeric>Income</TH>
                          <TH numeric>Expense</TH>
                          <TH numeric>Result</TH>
                          <TH>Logged</TH>
                        </TR>
                      </THead>
                      <TBody>
                        {recent.map((r, i) => {
                          const profit = reportProfit(r)
                          return (
                            <TR key={r.id ?? i}>
                              <TD>
                                <span className="whitespace-nowrap">{date(r.report_date ?? r.created_at)}</span>
                              </TD>
                              <TD numeric>{money(r.income)}</TD>
                              <TD numeric>{money(r.expense)}</TD>
                              <TD numeric>
                                <span
                                  className={
                                    profit >= 0
                                      ? 'font-medium text-[hsl(var(--success))]'
                                      : 'font-medium text-[hsl(var(--destructive))]'
                                  }
                                >
                                  {money(profit)}
                                </span>
                              </TD>
                              <TD>
                                <span className="whitespace-nowrap text-[13px] text-muted-foreground">
                                  {relativeTime(r.created_at)}
                                </span>
                              </TD>
                            </TR>
                          )
                        })}
                      </TBody>
                    </Table>
                  </TableWrap>
                )}
              </SectionCard>
            </>
          }
          aside={
            <>
              <SectionCard title="This month so far" description={business?.name}>
                <DetailList>
                  <DetailRow label="Entries logged">{monthTotals.count}</DetailRow>
                  <DetailRow label="Income">{money(monthTotals.income)}</DetailRow>
                  <DetailRow label="Expense">{money(monthTotals.expense)}</DetailRow>
                  <DetailRow label="Net result" className="font-semibold">
                    <span
                      className={
                        monthTotals.net >= 0 ? 'text-[hsl(var(--success))]' : 'text-[hsl(var(--destructive))]'
                      }
                    >
                      {money(monthTotals.net)}
                    </span>
                  </DetailRow>
                </DetailList>
              </SectionCard>

              <SectionCard title="Need money?" bodyClassName="p-4 space-y-3 text-[13px] text-muted-foreground">
                <p>
                  Daily entries only record what happened. To draw cash from the company pool, raise a request — the
                  founder approves it with a one-time code.
                </p>
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link to="/app/finance/requests">Request from pool</Link>
                </Button>
              </SectionCard>

              {business && (
                <SectionCard title="Project" bodyClassName="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{business.name}</p>
                      {business.type && <p className="truncate text-xs capitalize text-muted-foreground">{business.type}</p>}
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/app/projects/${business.id}`}>Open</Link>
                    </Button>
                  </div>
                </SectionCard>
              )}
            </>
          }
        />
      </PageBody>
    </Page>
  )
}
