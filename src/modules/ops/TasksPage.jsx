import * as React from 'react'
import { useSearchParams } from 'react-router-dom'
import { AlertTriangle, Check, CheckCircle2, ListChecks, Plus, Trash2, Undo2, UserPlus } from 'lucide-react'
import { Page, PageHeader, PageBody, Toolbar, SearchInput, FilterSelect, ToolbarSpacer } from '@/components/patterns/Page'
import { StatCard, StatGrid } from '@/components/patterns/StatCard'
import { SectionCard } from '@/components/patterns/SectionCard'
import { Badge, StatusBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ActionMenu } from '@/components/ui/menu'
import { Dialog, ConfirmDialog } from '@/components/ui/dialog'
import { Field, FieldGrid, TextInput, Textarea } from '@/components/ui/field'
import { Tabs } from '@/components/ui/tabs'
import { AsyncView, EmptyState } from '@/components/ui/states'
import { TableWrap, Table, THead, TBody, TR, TH, TD } from '@/components/ui/table'
import { useQuery, useMutation } from '@/lib/useQuery'
import { tasks as tasksApi, people } from '@/lib/api'
import { date, number, relativeTime, truncate, todayISO, initials } from '@/lib/format'
import { useSession } from '@/app/session'
import { ROLES } from '@/app/navigation'
import { downloadCsv } from '@/lib/export'
import toast from 'react-hot-toast'

/* =====================================================================
   Tasks — one board for assigning work and picking it up.

   This merges two separate pages that shared a table but not a design:
     • hr.html         create a task, list all tasks. No auth guard at all,
                       and a leftover `alert("BUTTON CLICKED")` on the button.
     • employee.html   pick a task, release it, or "hide" it locally.

   Because both operated on the same `tasks` rows, keeping them apart meant HR
   could not see what an employee had hidden and an employee could not see the
   deadline HR had set. One board, filtered by tab, fixes that.

   Preserved exactly: the claim uses `.is('accepted_by', null)` as optimistic
   locking, so two people cannot take the same task. The failure is now a
   clear message instead of a silent no-op.

   Dropped: the localStorage "hide" list. It hid tasks only on one device and
   made HR's view disagree with the employee's. Filtering by status does the
   same job honestly.
   ===================================================================== */

const EMPTY = { title: '', description: '', points: '', deadline: '' }

function CreateTaskDialog({ open, onClose, onDone }) {
  const [form, setForm] = React.useState(EMPTY)
  const [errors, setErrors] = React.useState({})

  React.useEffect(() => {
    if (open) {
      setForm(EMPTY)
      setErrors({})
    }
  }, [open])

  const save = useMutation(
    () =>
      tasksApi.create({
        title: form.title.trim(),
        description: form.description.trim(),
        points: Number(form.points) || 0,
        deadline: form.deadline || null,
      }),
    {
      onSuccess: () => {
        toast.success('Task created')
        onDone?.()
        onClose()
      },
      onError: (e) => toast.error(e.message),
    }
  )

  function submit(e) {
    e.preventDefault()
    const next = {}
    if (!form.title.trim()) next.title = 'Give the task a title'
    if (form.points !== '' && !Number.isFinite(Number(form.points))) next.points = 'Enter a valid number'
    if (form.deadline && form.deadline < todayISO()) next.deadline = 'Deadline is in the past'
    setErrors(next)
    if (Object.keys(next).length > 0) return
    save.run()
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Create task"
      description="Anyone on the team can pick this up once it is open."
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={save.busy}>
            Cancel
          </Button>
          <Button type="submit" form="task-form" disabled={save.busy}>
            {save.busy ? 'Creating…' : 'Create task'}
          </Button>
        </>
      }
    >
      <form id="task-form" onSubmit={submit} className="space-y-5">
        <Field label="Title" required htmlFor="t-title" error={errors.title}>
          <TextInput
            id="t-title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Collect pending payment from GTC"
            invalid={Boolean(errors.title)}
            autoFocus
          />
        </Field>

        <Field label="Description" htmlFor="t-desc" hint="What does 'done' look like?">
          <Textarea
            id="t-desc"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Call the accounts team, confirm the invoice number and get a payment date."
          />
        </Field>

        <FieldGrid cols={2}>
          <Field label="Points" htmlFor="t-points" error={errors.points} hint="Effort or reward weight">
            <TextInput
              id="t-points"
              type="number"
              inputMode="numeric"
              min="0"
              value={form.points}
              onChange={(e) => setForm({ ...form, points: e.target.value })}
              placeholder="0"
              invalid={Boolean(errors.points)}
            />
          </Field>
          <Field label="Deadline" htmlFor="t-deadline" error={errors.deadline}>
            <TextInput
              id="t-deadline"
              type="date"
              min={todayISO()}
              value={form.deadline}
              onChange={(e) => setForm({ ...form, deadline: e.target.value })}
              invalid={Boolean(errors.deadline)}
            />
          </Field>
        </FieldGrid>
      </form>
    </Dialog>
  )
}

export default function TasksPage() {
  const { user, role } = useSession()
  const [params, setParams] = useSearchParams()
  const [tab, setTab] = React.useState('open')
  const [search, setSearch] = React.useState('')
  const [sort, setSort] = React.useState('newest')
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [pendingDelete, setPendingDelete] = React.useState(null)

  const canCreate = [ROLES.FOUNDER, ROLES.ADMIN, ROLES.HR].includes(role)
  const myId = user?.id ?? null

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
    const [list, team] = await Promise.all([tasksApi.list(), people.listBasic().catch(() => [])])
    const nameById = new Map(team.map((p) => [String(p.id), p.name]))
    return list.map((t) => ({
      ...t,
      assigneeName: t.accepted_by ? (nameById.get(String(t.accepted_by)) ?? 'Someone') : null,
      isMine: Boolean(myId && String(t.accepted_by) === String(myId)),
      overdue: Boolean(t.deadline && t.deadline < todayISO() && t.status !== 'COMPLETED'),
    }))
  }, [myId])

  const accept = useMutation((id) => tasksApi.accept(id, myId), {
    onSuccess: () => {
      toast.success('Task is yours')
      query.refetch()
    },
    onError: (e) => {
      toast.error(e.message)
      query.refetch()
    },
  })

  const release = useMutation((id) => tasksApi.release(id), {
    onSuccess: () => {
      toast.success('Task released back to the board')
      query.refetch()
    },
    onError: (e) => toast.error(e.message),
  })

  const complete = useMutation((id) => tasksApi.complete(id), {
    onSuccess: () => {
      toast.success('Task marked complete')
      query.refetch()
    },
    onError: (e) => toast.error(e.message),
  })

  const remove = useMutation((id) => tasksApi.remove(id), {
    onSuccess: () => {
      toast.success('Task deleted')
      setPendingDelete(null)
      query.refetch()
    },
    onError: (e) => toast.error(e.message),
  })

  const all = query.data ?? []

  const counts = React.useMemo(
    () => ({
      open: all.filter((t) => !t.accepted_by && t.status !== 'COMPLETED').length,
      mine: all.filter((t) => t.isMine && t.status !== 'COMPLETED').length,
      active: all.filter((t) => t.accepted_by && t.status !== 'COMPLETED').length,
      done: all.filter((t) => t.status === 'COMPLETED').length,
      overdue: all.filter((t) => t.overdue).length,
    }),
    [all]
  )

  const rows = React.useMemo(() => {
    let list = all
    if (tab === 'open') list = list.filter((t) => !t.accepted_by && t.status !== 'COMPLETED')
    if (tab === 'mine') list = list.filter((t) => t.isMine && t.status !== 'COMPLETED')
    if (tab === 'active') list = list.filter((t) => t.accepted_by && t.status !== 'COMPLETED')
    if (tab === 'done') list = list.filter((t) => t.status === 'COMPLETED')

    if (search) {
      const q = search.toLowerCase()
      list = list.filter((t) => `${t.title ?? ''} ${t.description ?? ''}`.toLowerCase().includes(q))
    }

    const sorted = [...list]
    if (sort === 'newest') sorted.sort((a, b) => String(b.created_at ?? '').localeCompare(String(a.created_at ?? '')))
    if (sort === 'deadline')
      sorted.sort((a, b) => String(a.deadline ?? '9999').localeCompare(String(b.deadline ?? '9999')))
    if (sort === 'points') sorted.sort((a, b) => (Number(b.points) || 0) - (Number(a.points) || 0))
    return sorted
  }, [all, tab, search, sort])

  return (
    <Page>
      <PageHeader
        title="Tasks"
        description="Work waiting to be picked up, and who is on what"
        actions={
          <>
            <Button
              variant="outline"
              disabled={rows.length === 0}
              onClick={() => {
                downloadCsv(
                  'tasks',
                  rows.map((t) => ({
                    title: t.title,
                    description: t.description ?? '',
                    points: t.points ?? 0,
                    status: t.status ?? '',
                    assignee: t.assigneeName ?? '',
                    deadline: t.deadline ?? '',
                    created_at: t.created_at ?? '',
                  }))
                )
                toast.success('Exported')
              }}
            >
              Export
            </Button>
            {canCreate && (
              <Button onClick={() => setDialogOpen(true)}>
                <Plus aria-hidden="true" />
                Create task
              </Button>
            )}
          </>
        }
      >
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { value: 'open', label: 'Open', count: counts.open },
            { value: 'mine', label: 'Mine', count: counts.mine },
            { value: 'active', label: 'In progress', count: counts.active },
            { value: 'done', label: 'Completed', count: counts.done },
          ]}
        />
      </PageHeader>

      <PageBody className="space-y-4">
        <StatGrid cols={4}>
          <StatCard label="Unclaimed" value={number(counts.open)} hint="Nobody has picked these up" icon={ListChecks} />
          <StatCard label="In progress" value={number(counts.active)} hint="Assigned and not finished" />
          <StatCard
            label="Past deadline"
            value={number(counts.overdue)}
            tone={counts.overdue > 0 ? 'negative' : 'default'}
            hint={counts.overdue > 0 ? 'Needs attention' : 'Nothing overdue'}
            icon={AlertTriangle}
          />
          <StatCard label="Completed" value={number(counts.done)} icon={CheckCircle2} />
        </StatGrid>

        <SectionCard flush>
          <div className="px-4 pt-4 sm:px-5">
            <Toolbar>
              <SearchInput value={search} onChange={setSearch} placeholder="Search tasks…" />
              <FilterSelect
                label="Sort"
                value={sort}
                onChange={setSort}
                options={[
                  { value: 'newest', label: 'Newest first' },
                  { value: 'deadline', label: 'Deadline soonest' },
                  { value: 'points', label: 'Highest points' },
                ]}
              />
              <ToolbarSpacer />
            </Toolbar>
          </div>

          <AsyncView
            query={query}
            skeletonProps={{ columns: 5 }}
            empty={{
              icon: ListChecks,
              title: 'No tasks yet',
              description: canCreate
                ? 'Create the first task and it will appear on the board for anyone to pick up.'
                : 'Nothing has been assigned yet.',
              action: canCreate ? <Button onClick={() => setDialogOpen(true)}>Create task</Button> : undefined,
            }}
          >
            {() =>
              rows.length === 0 ? (
                <EmptyState
                  compact
                  icon={tab === 'done' ? CheckCircle2 : ListChecks}
                  title={
                    tab === 'open'
                      ? 'Nothing unclaimed'
                      : tab === 'mine'
                        ? 'You have no open tasks'
                        : tab === 'active'
                          ? 'Nothing in progress'
                          : 'Nothing completed yet'
                  }
                  description={tab === 'open' ? 'Every task has been picked up.' : undefined}
                />
              ) : (
                <TableWrap>
                  <Table>
                    <THead>
                      <TR>
                        <TH>Task</TH>
                        <TH>Status</TH>
                        <TH>Assignee</TH>
                        <TH numeric>Points</TH>
                        <TH>Deadline</TH>
                        <TH className="w-[180px]" />
                      </TR>
                    </THead>
                    <TBody>
                      {rows.map((t) => (
                        <TR key={t.id}>
                          <TD className="max-w-[380px]">
                            <p className="font-medium">{t.title}</p>
                            {t.description && (
                              <p className="mt-0.5 text-[13px] text-muted-foreground">{truncate(t.description, 90)}</p>
                            )}
                            <p className="mt-0.5 text-xs text-muted-foreground">Created {relativeTime(t.created_at)}</p>
                          </TD>
                          <TD>
                            <StatusBadge status={t.status ?? (t.accepted_by ? 'ACCEPTED' : 'OPEN')} />
                          </TD>
                          <TD>
                            {t.accepted_by ? (
                              <span className="flex items-center gap-2">
                                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-semibold">
                                  {initials(t.assigneeName)}
                                </span>
                                <span className="text-[13px]">
                                  {t.isMine ? 'You' : t.assigneeName}
                                </span>
                              </span>
                            ) : (
                              <span className="text-[13px] text-muted-foreground">Unclaimed</span>
                            )}
                          </TD>
                          <TD numeric>
                            {t.points ? number(t.points) : <span className="text-muted-foreground">—</span>}
                          </TD>
                          <TD>
                            {t.deadline ? (
                              <span
                                className={
                                  t.overdue
                                    ? 'whitespace-nowrap text-[13px] font-medium text-[hsl(var(--destructive))]'
                                    : 'whitespace-nowrap text-[13px] text-muted-foreground'
                                }
                              >
                                {date(t.deadline)}
                                {t.overdue && <span className="ml-1">overdue</span>}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TD>
                          <TD>
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Primary action inline, everything else in the menu. */}
                              {!t.accepted_by && t.status !== 'COMPLETED' && myId && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => accept.run(t.id)}
                                  disabled={accept.busy}
                                >
                                  <UserPlus aria-hidden="true" />
                                  Pick up
                                </Button>
                              )}
                              {t.isMine && t.status !== 'COMPLETED' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => complete.run(t.id)}
                                  disabled={complete.busy}
                                >
                                  <Check aria-hidden="true" />
                                  Done
                                </Button>
                              )}
                              <ActionMenu
                                items={[
                                  t.isMine &&
                                    t.status !== 'COMPLETED' && {
                                      label: 'Release task',
                                      icon: Undo2,
                                      onSelect: () => release.run(t.id),
                                    },
                                  canCreate &&
                                    t.accepted_by && {
                                      label: 'Force release',
                                      icon: Undo2,
                                      onSelect: () => release.run(t.id),
                                    },
                                  canCreate &&
                                    t.status !== 'COMPLETED' && {
                                      label: 'Mark complete',
                                      icon: CheckCircle2,
                                      onSelect: () => complete.run(t.id),
                                    },
                                  canCreate && { separator: true },
                                  canCreate && {
                                    label: 'Delete task',
                                    icon: Trash2,
                                    destructive: true,
                                    onSelect: () => setPendingDelete(t),
                                  },
                                ].filter(Boolean)}
                              />
                            </div>
                          </TD>
                        </TR>
                      ))}
                    </TBody>
                  </Table>
                </TableWrap>
              )
            }
          </AsyncView>
        </SectionCard>

        {!myId && (
          <div className="rounded-[--radius] border border-border bg-muted/40 px-4 py-3 text-[13px] text-muted-foreground">
            You are signed in without a linked employee record, so you can view the board but not pick up tasks.
          </div>
        )}
      </PageBody>

      <CreateTaskDialog open={dialogOpen} onClose={closeDialog} onDone={query.refetch} />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => remove.run(pendingDelete.id)}
        title={`Delete "${truncate(pendingDelete?.title, 40)}"?`}
        confirmLabel="Delete task"
        destructive
        busy={remove.busy}
      />
    </Page>
  )
}
