import * as React from 'react'
import { Activity, Check, Gavel, Minus, Plus, ThumbsDown, ThumbsUp, Trash2 } from 'lucide-react'
import { Page, PageHeader, PageBody } from '@/components/patterns/Page'
import { StatCard, StatGrid } from '@/components/patterns/StatCard'
import { SectionCard, SplitLayout } from '@/components/patterns/SectionCard'
import { Badge, StatusBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ActionMenu } from '@/components/ui/menu'
import { Dialog, ConfirmDialog } from '@/components/ui/dialog'
import { Field, FieldGrid, TextInput, Select } from '@/components/ui/field'
import { Tabs } from '@/components/ui/tabs'
import { AsyncView, EmptyState } from '@/components/ui/states'
import { useQuery, useMutation } from '@/lib/useQuery'
import { dce } from '@/lib/api'
import { money, date, number, relativeTime, todayISO } from '@/lib/format'
import { useWorkspace, BusinessPicker } from '@/app/workspace'
import { useSession } from '@/app/session'
import toast from 'react-hot-toast'

/* =====================================================================
   Decisions — money proposals, the vote on them, and the audit trail.

   In the legacy DCE these were three separate tabs (Decisions, Voting, Audit
   Log) that could not see each other. To find out whether a proposal had
   passed you opened Decisions to read the amount, then Voting to count the
   votes, then Audit Log to see when it was approved. Three tabs to answer one
   question.

   Merged: each proposal card carries its own vote tally and its own voting
   controls. The audit trail sits alongside as context rather than as a
   destination of its own.

   Voting caveat kept visible rather than hidden: the legacy code recorded
   every vote with `voter: 'Portal user'`, so one person could vote repeatedly
   and nobody could tell who voted. Votes are now stamped with the signed-in
   user's name, and the UI blocks a second vote from the same name — but the
   database has no unique constraint, so this is guidance, not enforcement
   (SRS FR-L20).
   ===================================================================== */

const STAGES = ['Proposed', 'Under review', 'Board Approved']
const RISKS = ['Low', 'Medium', 'High']
const VOTE_OPTIONS = [
  { value: 'For', icon: ThumbsUp, tone: 'success' },
  { value: 'Against', icon: ThumbsDown, tone: 'danger' },
  { value: 'Abstain', icon: Minus, tone: 'neutral' },
]

const EMPTY = { title: '', amount: '', proposer: '', due_date: '', risk: 'Medium', stage: 'Proposed' }

function DecisionDialog({ open, onClose, business, onDone, defaultProposer }) {
  const [form, setForm] = React.useState(EMPTY)
  const [errors, setErrors] = React.useState({})

  React.useEffect(() => {
    if (open) {
      setForm({ ...EMPTY, proposer: defaultProposer ?? '' })
      setErrors({})
    }
  }, [open, defaultProposer])

  const save = useMutation(
    () =>
      dce.createDecision({
        business_id: business.id,
        business_name: business.name,
        title: form.title.trim(),
        amount: Number(form.amount) || 0,
        proposer: form.proposer.trim() || null,
        due_date: form.due_date || null,
        risk: form.risk,
        stage: form.stage,
      }),
    {
      onSuccess: () => {
        toast.success('Proposal created')
        dce.logEvent({
          businessId: business.id,
          businessName: business.name,
          event: `Proposed "${form.title.trim()}" for ${money(Number(form.amount) || 0)}`,
          category: 'Governance',
          actor: form.proposer.trim() || 'Console',
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
    if (!form.title.trim()) next.title = 'Describe what is being decided'
    if (form.amount !== '' && !Number.isFinite(Number(form.amount))) next.amount = 'Enter a valid number'
    setErrors(next)
    if (Object.keys(next).length > 0) return
    save.run()
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="New proposal"
      description={business?.name}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={save.busy}>
            Cancel
          </Button>
          <Button type="submit" form="decision-form" disabled={save.busy}>
            {save.busy ? 'Creating…' : 'Create proposal'}
          </Button>
        </>
      }
    >
      <form id="decision-form" onSubmit={submit} className="space-y-5">
        <Field label="What is being decided?" required htmlFor="d-title" error={errors.title}>
          <TextInput
            id="d-title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Buy a second delivery vehicle"
            invalid={Boolean(errors.title)}
            autoFocus
          />
        </Field>

        <FieldGrid cols={2}>
          <Field label="Amount involved" htmlFor="d-amount" error={errors.amount}>
            <TextInput
              id="d-amount"
              type="number"
              inputMode="decimal"
              min="0"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              placeholder="0"
              invalid={Boolean(errors.amount)}
            />
          </Field>
          <Field label="Proposed by" htmlFor="d-proposer">
            <TextInput
              id="d-proposer"
              value={form.proposer}
              onChange={(e) => setForm({ ...form, proposer: e.target.value })}
              placeholder="Name"
            />
          </Field>
        </FieldGrid>

        <FieldGrid cols={3}>
          <Field label="Decide by" htmlFor="d-due">
            <TextInput
              id="d-due"
              type="date"
              min={todayISO()}
              value={form.due_date}
              onChange={(e) => setForm({ ...form, due_date: e.target.value })}
            />
          </Field>
          <Field label="Risk" htmlFor="d-risk">
            <Select id="d-risk" value={form.risk} onChange={(e) => setForm({ ...form, risk: e.target.value })}>
              {RISKS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Stage" htmlFor="d-stage">
            <Select id="d-stage" value={form.stage} onChange={(e) => setForm({ ...form, stage: e.target.value })}>
              {STAGES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </Field>
        </FieldGrid>
      </form>
    </Dialog>
  )
}

export default function DecisionsPage() {
  const { business } = useWorkspace()
  const { user } = useSession()
  const voterName = user?.name ?? 'Console user'

  const [tab, setTab] = React.useState('open')
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [pendingDelete, setPendingDelete] = React.useState(null)

  const query = useQuery(
    async () => {
      const decisions = await dce.decisions(business.id)
      const votes = await dce.votes(decisions.map((d) => d.id)).catch(() => [])
      const byDecision = new Map()
      for (const v of votes) {
        const arr = byDecision.get(String(v.decision_id)) ?? []
        arr.push(v)
        byDecision.set(String(v.decision_id), arr)
      }
      return decisions.map((d) => {
        const list = byDecision.get(String(d.id)) ?? []
        return {
          ...d,
          votes: list,
          tally: {
            For: list.filter((v) => v.vote_option === 'For').length,
            Against: list.filter((v) => v.vote_option === 'Against').length,
            Abstain: list.filter((v) => v.vote_option === 'Abstain').length,
          },
          myVote: list.find((v) => v.voter === voterName)?.vote_option ?? null,
        }
      })
    },
    [business?.id, voterName],
    { enabled: Boolean(business?.id) }
  )

  const auditQuery = useQuery(
    () => dce.auditLogs({ businessId: business.id, limit: 20 }),
    [business?.id],
    { enabled: Boolean(business?.id) }
  )

  const vote = useMutation(
    ({ decisionId, option }) => dce.castVote({ decisionId, voter: voterName, option }),
    {
      onSuccess: () => {
        toast.success('Vote recorded')
        query.refetch()
        auditQuery.refetch()
      },
      onError: (e) => toast.error(e.message),
    }
  )

  const setStage = useMutation(
    async ({ decision, stage }) => {
      await dce.updateDecision(decision.id, { stage })
      await dce.logEvent({
        businessId: business.id,
        businessName: business.name,
        event: `"${decision.title}" moved to ${stage}`,
        category: 'Governance',
        actor: voterName,
      })
    },
    {
      onSuccess: () => {
        toast.success('Stage updated')
        query.refetch()
        auditQuery.refetch()
      },
      onError: (e) => toast.error(e.message),
    }
  )

  const remove = useMutation((id) => dce.removeDecision(id), {
    onSuccess: () => {
      toast.success('Proposal removed')
      setPendingDelete(null)
      query.refetch()
    },
    onError: (e) => toast.error(e.message),
  })

  const all = query.data ?? []
  const counts = {
    open: all.filter((d) => d.stage !== 'Board Approved').length,
    approved: all.filter((d) => d.stage === 'Board Approved').length,
  }
  const rows = tab === 'open' ? all.filter((d) => d.stage !== 'Board Approved') : all.filter((d) => d.stage === 'Board Approved')
  const openValue = all
    .filter((d) => d.stage !== 'Board Approved')
    .reduce((s, d) => s + (Number(d.amount) || 0), 0)

  if (!business) {
    return (
      <Page>
        <PageHeader title="Decisions" description="Proposals and voting" actions={<BusinessPicker />} />
        <PageBody>
          <SectionCard>
            <EmptyState icon={Gavel} title="No business selected" description="Decisions are recorded per business." />
          </SectionCard>
        </PageBody>
      </Page>
    )
  }

  return (
    <Page>
      <PageHeader
        title="Decisions"
        description={`Proposals, votes and the audit trail for ${business.name}`}
        actions={
          <>
            <BusinessPicker />
            <Button onClick={() => setDialogOpen(true)}>
              <Plus aria-hidden="true" />
              New proposal
            </Button>
          </>
        }
      >
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { value: 'open', label: 'Open', count: counts.open },
            { value: 'approved', label: 'Approved', count: counts.approved },
          ]}
        />
      </PageHeader>

      <PageBody className="space-y-4">
        <StatGrid cols={3}>
          <StatCard label="Open proposals" value={number(counts.open)} icon={Gavel} />
          <StatCard label="Value under decision" value={money(openValue)} hint="Sum of open proposals" />
          <StatCard label="Approved" value={number(counts.approved)} icon={Check} />
        </StatGrid>

        <SplitLayout
          main={
            <AsyncView
              query={query}
              skeleton="cards"
              skeletonProps={{ count: 3 }}
              empty={{
                icon: Gavel,
                title: 'No proposals yet',
                description: 'Raise a proposal when money or direction needs a decision.',
                action: <Button onClick={() => setDialogOpen(true)}>New proposal</Button>,
              }}
            >
              {() =>
                rows.length === 0 ? (
                  <SectionCard>
                    <EmptyState
                      compact
                      icon={tab === 'approved' ? Check : Gavel}
                      title={tab === 'open' ? 'Nothing open' : 'Nothing approved yet'}
                    />
                  </SectionCard>
                ) : (
                  <div className="space-y-4">
                    {rows.map((d) => {
                      const total = d.tally.For + d.tally.Against + d.tally.Abstain
                      const overdue = d.due_date && d.due_date < todayISO() && d.stage !== 'Board Approved'
                      return (
                        <SectionCard key={d.id}>
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h3 className="text-sm font-semibold">{d.title}</h3>
                              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                                <StatusBadge status={d.stage} />
                                {d.risk && (
                                  <Badge
                                    size="sm"
                                    tone={d.risk === 'High' ? 'danger' : d.risk === 'Low' ? 'success' : 'warning'}
                                  >
                                    {d.risk} risk
                                  </Badge>
                                )}
                                {Number(d.amount) > 0 && <Badge size="sm">{money(d.amount)}</Badge>}
                                {d.due_date && (
                                  <Badge size="sm" tone={overdue ? 'danger' : 'neutral'}>
                                    {overdue ? 'Overdue ' : 'Decide by '}
                                    {date(d.due_date)}
                                  </Badge>
                                )}
                              </div>
                              {d.proposer && (
                                <p className="mt-1.5 text-[13px] text-muted-foreground">
                                  Proposed by {d.proposer} · {relativeTime(d.inserted_at)}
                                </p>
                              )}
                            </div>
                            <ActionMenu
                              items={[
                                ...STAGES.filter((s) => s !== d.stage).map((s) => ({
                                  label: `Move to ${s}`,
                                  icon: Check,
                                  onSelect: () => setStage.run({ decision: d, stage: s }),
                                })),
                                { separator: true },
                                {
                                  label: 'Remove proposal',
                                  icon: Trash2,
                                  destructive: true,
                                  onSelect: () => setPendingDelete(d),
                                },
                              ]}
                            />
                          </div>

                          {/* Tally and voting together — the whole point of the merge. */}
                          <div className="mt-4 border-t border-border pt-3.5">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div className="flex items-center gap-4 text-[13px]">
                                {VOTE_OPTIONS.map((o) => (
                                  <span key={o.value} className="flex items-center gap-1.5">
                                    <o.icon
                                      className={
                                        o.tone === 'success'
                                          ? 'size-3.5 text-[hsl(var(--success))]'
                                          : o.tone === 'danger'
                                            ? 'size-3.5 text-[hsl(var(--destructive))]'
                                            : 'size-3.5 text-muted-foreground'
                                      }
                                      aria-hidden="true"
                                    />
                                    <span className="tabular">{d.tally[o.value]}</span>
                                    <span className="text-muted-foreground">{o.value}</span>
                                  </span>
                                ))}
                                <span className="text-muted-foreground">
                                  {total} {total === 1 ? 'vote' : 'votes'}
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5">
                                {d.myVote ? (
                                  <Badge size="sm" tone="info">
                                    You voted {d.myVote}
                                  </Badge>
                                ) : (
                                  VOTE_OPTIONS.map((o) => (
                                    <Button
                                      key={o.value}
                                      size="sm"
                                      variant="outline"
                                      disabled={vote.busy}
                                      onClick={() => vote.run({ decisionId: d.id, option: o.value })}
                                    >
                                      <o.icon aria-hidden="true" />
                                      {o.value}
                                    </Button>
                                  ))
                                )}
                              </div>
                            </div>

                            {total > 0 && (
                              <div className="mt-3 flex h-1.5 overflow-hidden rounded-full bg-muted">
                                {d.tally.For > 0 && (
                                  <div
                                    className="h-full bg-[hsl(var(--success))]"
                                    style={{ width: `${(d.tally.For / total) * 100}%` }}
                                  />
                                )}
                                {d.tally.Against > 0 && (
                                  <div
                                    className="h-full bg-[hsl(var(--destructive))]"
                                    style={{ width: `${(d.tally.Against / total) * 100}%` }}
                                  />
                                )}
                                {d.tally.Abstain > 0 && (
                                  <div
                                    className="h-full bg-[hsl(215_14%_70%)]"
                                    style={{ width: `${(d.tally.Abstain / total) * 100}%` }}
                                  />
                                )}
                              </div>
                            )}
                          </div>
                        </SectionCard>
                      )
                    })}
                  </div>
                )
              }
            </AsyncView>
          }
          aside={
            <>
              <SectionCard title="Audit trail" description="Recent events for this business" flush>
                {(auditQuery.data ?? []).length === 0 ? (
                  <EmptyState compact icon={Activity} title="No events recorded yet" />
                ) : (
                  <ul className="divide-y divide-border">
                    {(auditQuery.data ?? []).map((log) => (
                      <li key={log.id} className="px-4 py-2.5">
                        <p className="text-[13px]">{log.event_text}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {log.actor ? `${log.actor} · ` : ''}
                          {relativeTime(log.inserted_at)}
                          {log.category ? ` · ${log.category}` : ''}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </SectionCard>

              <SectionCard title="How voting works" bodyClassName="p-4">
                <ul className="space-y-2.5 text-[13px] text-muted-foreground">
                  <li>Votes are stamped with your name, so the tally is attributable.</li>
                  <li>One vote per person per proposal is enforced in the interface.</li>
                  <li>Moving a proposal to a new stage is written to the audit trail.</li>
                  <li>Approval does not move money — that still needs a pool request.</li>
                </ul>
              </SectionCard>
            </>
          }
        />
      </PageBody>

      <DecisionDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        business={business}
        defaultProposer={voterName}
        onDone={() => {
          query.refetch()
          auditQuery.refetch()
        }}
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => remove.run(pendingDelete.id)}
        title={`Remove "${pendingDelete?.title}"?`}
        description="Votes cast on this proposal will no longer be shown."
        confirmLabel="Remove"
        destructive
        busy={remove.busy}
      />
    </Page>
  )
}
