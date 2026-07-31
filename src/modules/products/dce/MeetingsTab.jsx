import * as React from 'react'
import { BarChart3, CalendarClock, ExternalLink, Mail, Pencil, Plus, Trash2 } from 'lucide-react'
import { SectionCard } from '@/components/patterns/SectionCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ActionMenu } from '@/components/ui/menu'
import { Dialog, ConfirmDialog } from '@/components/ui/dialog'
import { Field, FieldGrid, TextInput, Select, Textarea } from '@/components/ui/field'
import { AsyncView, EmptyState, Spinner } from '@/components/ui/states'
import { TableWrap, Table, THead, TBody, TR, TH, TD } from '@/components/ui/table'
import { useQuery, useMutation } from '@/lib/useQuery'
import { dce, backend } from '@/lib/api'
import { date, number, percent, todayISO, truncate } from '@/lib/format'
import toast from 'react-hot-toast'

/* =====================================================================
   Meetings — schedule, remind, and collect anonymous feedback.

   Kept from the legacy DCE, including the two backend endpoints:
     POST /send-meeting-email        reminder to a list of addresses
     POST /api/meeting-scores        anonymous rating
     GET  /api/meeting-scores/:id    aggregated counts only

   The feedback design is worth preserving deliberately: scores are stored
   against a random `anon_…` id with no user link, and the read endpoint never
   returns individual responses. That is the only reason honest feedback is
   possible, so the UI states it plainly rather than leaving people to guess.

   Changed: upcoming and past meetings were interleaved in one date-sorted
   list, so the next meeting could be halfway down the page. They are split.
   ===================================================================== */

const PLATFORMS = ['Zoom', 'Google Meet', 'Teams', 'In person', 'Phone call']
const SCORES = [
  { value: 'excellent', label: 'Excellent', tone: 'success' },
  { value: 'good', label: 'Good', tone: 'info' },
  { value: 'bad', label: 'Bad', tone: 'warning' },
  { value: 'poor', label: 'Poor', tone: 'danger' },
]

const EMPTY = {
  title: '',
  meeting_date: todayISO(),
  meeting_time: '',
  platform: 'Google Meet',
  link: '',
  notes: '',
  notify_numbers: '',
}

function MeetingDialog({ open, onClose, meeting, business, onDone }) {
  const editing = Boolean(meeting)
  const [form, setForm] = React.useState(EMPTY)
  const [errors, setErrors] = React.useState({})

  React.useEffect(() => {
    if (!open) return
    setErrors({})
    setForm(
      meeting
        ? {
            title: meeting.title ?? '',
            meeting_date: meeting.meeting_date ?? todayISO(),
            meeting_time: meeting.meeting_time ?? '',
            platform: meeting.platform ?? 'Google Meet',
            link: meeting.link ?? '',
            notes: meeting.notes ?? '',
            notify_numbers: meeting.notify_numbers ?? '',
          }
        : EMPTY
    )
  }, [open, meeting])

  const save = useMutation(
    () => {
      const payload = {
        business_id: business.id,
        business_name: business.name,
        title: form.title.trim(),
        meeting_date: form.meeting_date || null,
        meeting_time: form.meeting_time || null,
        platform: form.platform,
        link: form.link.trim() || null,
        notes: form.notes.trim() || null,
        notify_numbers: form.notify_numbers.trim() || null,
      }
      return editing ? dce.updateMeeting(meeting.id, payload) : dce.createMeeting(payload)
    },
    {
      onSuccess: () => {
        toast.success(editing ? 'Meeting updated' : 'Meeting scheduled')
        dce.logEvent({
          businessId: business.id,
          businessName: business.name,
          event: `${editing ? 'Updated' : 'Scheduled'} meeting "${form.title.trim()}"`,
          category: 'Meetings',
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
    if (!form.title.trim()) next.title = 'Give the meeting a title'
    if (!form.meeting_date) next.meeting_date = 'Date is required'
    setErrors(next)
    if (Object.keys(next).length > 0) return
    save.run()
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={editing ? 'Edit meeting' : 'Schedule meeting'}
      description={business?.name}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={save.busy}>
            Cancel
          </Button>
          <Button type="submit" form="meeting-form" disabled={save.busy}>
            {save.busy ? 'Saving…' : editing ? 'Save changes' : 'Schedule'}
          </Button>
        </>
      }
    >
      <form id="meeting-form" onSubmit={submit} className="space-y-5">
        <Field label="Title" required htmlFor="m-title" error={errors.title}>
          <TextInput
            id="m-title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Monthly review"
            invalid={Boolean(errors.title)}
            autoFocus
          />
        </Field>

        <FieldGrid cols={3}>
          <Field label="Date" required htmlFor="m-date" error={errors.meeting_date}>
            <TextInput
              id="m-date"
              type="date"
              value={form.meeting_date}
              onChange={(e) => setForm({ ...form, meeting_date: e.target.value })}
              invalid={Boolean(errors.meeting_date)}
            />
          </Field>
          <Field label="Time" htmlFor="m-time">
            <TextInput
              id="m-time"
              type="time"
              value={form.meeting_time}
              onChange={(e) => setForm({ ...form, meeting_time: e.target.value })}
            />
          </Field>
          <Field label="Platform" htmlFor="m-platform">
            <Select id="m-platform" value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })}>
              {PLATFORMS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </Select>
          </Field>
        </FieldGrid>

        <Field label="Joining link" htmlFor="m-link">
          <TextInput
            id="m-link"
            type="url"
            value={form.link}
            onChange={(e) => setForm({ ...form, link: e.target.value })}
            placeholder="https://meet.google.com/…"
          />
        </Field>

        <Field label="Agenda / notes" htmlFor="m-notes">
          <Textarea
            id="m-notes"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="What needs deciding in this meeting."
          />
        </Field>
      </form>
    </Dialog>
  )
}

function RemindDialog({ open, onClose, meeting }) {
  const [emails, setEmails] = React.useState('')
  const [error, setError] = React.useState('')

  React.useEffect(() => {
    if (open) {
      setEmails('')
      setError('')
    }
  }, [open])

  const send = useMutation(
    () =>
      backend.sendMeetingEmail({
        emails,
        title: meeting.title,
        meeting_date: meeting.meeting_date,
        meeting_time: meeting.meeting_time,
        platform: meeting.platform,
        link: meeting.link,
        notes: meeting.notes,
      }),
    {
      onSuccess: () => {
        toast.success('Reminder sent')
        onClose()
      },
      onError: (e) => toast.error(e.message),
    }
  )

  function submit(e) {
    e.preventDefault()
    if (!emails.trim()) {
      setError('Enter at least one email address')
      return
    }
    send.run()
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Send reminder"
      description={meeting?.title}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={send.busy}>
            Cancel
          </Button>
          <Button type="submit" form="remind-form" disabled={send.busy}>
            {send.busy ? (
              <>
                <Spinner />
                Sending…
              </>
            ) : (
              <>
                <Mail aria-hidden="true" />
                Send
              </>
            )}
          </Button>
        </>
      }
    >
      <form id="remind-form" onSubmit={submit}>
        <Field
          label="Recipients"
          required
          htmlFor="r-emails"
          error={error}
          hint="Separate multiple addresses with commas"
        >
          <Textarea
            id="r-emails"
            value={emails}
            onChange={(e) => setEmails(e.target.value)}
            placeholder="mukul@example.com, amit@example.com"
            autoFocus
          />
        </Field>
      </form>
    </Dialog>
  )
}

function FeedbackDialog({ open, onClose, meeting }) {
  const [submitted, setSubmitted] = React.useState(false)

  const scoresQuery = useQuery(() => backend.meetingScores(meeting.id), [meeting?.id, submitted], {
    enabled: open && Boolean(meeting?.id),
  })

  React.useEffect(() => {
    if (open) setSubmitted(false)
  }, [open])

  const submit = useMutation((score) => backend.submitMeetingScore({ meeting_id: meeting.id, score }), {
    onSuccess: () => {
      toast.success('Feedback recorded anonymously')
      setSubmitted(true)
    },
    onError: (e) => toast.error(e.message),
  })

  const data = scoresQuery.data

  return (
    <Dialog open={open} onClose={onClose} title="Meeting feedback" description={meeting?.title} size="sm">
      <div className="space-y-5">
        <div className="rounded-[--radius] border border-[hsl(var(--info)/0.25)] bg-[hsl(var(--info-soft))] px-3 py-2.5 text-[13px] text-[hsl(var(--info))]">
          Feedback is fully anonymous. No name, account or device is recorded, and only totals are ever shown — never
          individual answers.
        </div>

        {!submitted && (
          <div>
            <p className="mb-2 text-[13px] font-medium">How was this meeting?</p>
            <div className="grid grid-cols-2 gap-2">
              {SCORES.map((s) => (
                <Button
                  key={s.value}
                  variant="outline"
                  onClick={() => submit.run(s.value)}
                  disabled={submit.busy}
                  className="justify-center"
                >
                  {s.label}
                </Button>
              ))}
            </div>
          </div>
        )}

        <div>
          <p className="mb-2 text-[13px] font-medium">
            Results {data ? `· ${number(data.total_responses)} responses` : ''}
          </p>
          {scoresQuery.loading ? (
            <div className="flex items-center gap-2 py-3 text-sm text-muted-foreground">
              <Spinner />
              Loading…
            </div>
          ) : data && data.total_responses > 0 ? (
            <div className="space-y-2">
              {SCORES.map((s) => {
                const count = data.scores?.[s.value] ?? 0
                const pct = data.percentages?.[s.value] ?? 0
                return (
                  <div key={s.value}>
                    <div className="mb-1 flex items-center justify-between gap-2 text-[13px]">
                      <span>{s.label}</span>
                      <span className="tabular text-muted-foreground">
                        {number(count)} · {percent(pct, 0)}
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.max(pct > 0 ? 2 : 0, pct)}%`,
                          background:
                            s.tone === 'success'
                              ? 'hsl(var(--success))'
                              : s.tone === 'info'
                                ? 'hsl(var(--info))'
                                : s.tone === 'warning'
                                  ? 'hsl(var(--warning))'
                                  : 'hsl(var(--destructive))',
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-[13px] text-muted-foreground">No responses yet.</p>
          )}
        </div>
      </div>
    </Dialog>
  )
}

export default function MeetingsTab({ business, search }) {
  const [dialog, setDialog] = React.useState({ open: false, meeting: null })
  const [remind, setRemind] = React.useState(null)
  const [feedback, setFeedback] = React.useState(null)
  const [pendingDelete, setPendingDelete] = React.useState(null)

  const query = useQuery(() => dce.meetings(business.id), [business.id])

  const remove = useMutation((id) => dce.removeMeeting(id), {
    onSuccess: () => {
      toast.success('Meeting removed')
      setPendingDelete(null)
      query.refetch()
    },
    onError: (e) => toast.error(e.message),
  })

  const { upcoming, past } = React.useMemo(() => {
    const today = todayISO()
    let list = query.data ?? []
    if (search) {
      const q = search.toLowerCase()
      list = list.filter((m) => `${m.title ?? ''} ${m.notes ?? ''}`.toLowerCase().includes(q))
    }
    return {
      upcoming: list
        .filter((m) => (m.meeting_date ?? '') >= today)
        .sort((a, b) => String(a.meeting_date).localeCompare(String(b.meeting_date))),
      past: list
        .filter((m) => (m.meeting_date ?? '') < today)
        .sort((a, b) => String(b.meeting_date).localeCompare(String(a.meeting_date))),
    }
  }, [query.data, search])

  function rowActions(m) {
    return [
      { label: 'Edit meeting', icon: Pencil, onSelect: () => setDialog({ open: true, meeting: m }) },
      { label: 'Send reminder', icon: Mail, onSelect: () => setRemind(m) },
      { label: 'Feedback', icon: BarChart3, onSelect: () => setFeedback(m) },
      m.link && {
        label: 'Open link',
        icon: ExternalLink,
        onSelect: () => window.open(m.link, '_blank', 'noopener'),
      },
      { separator: true },
      { label: 'Remove meeting', icon: Trash2, destructive: true, onSelect: () => setPendingDelete(m) },
    ].filter(Boolean)
  }

  function MeetingTable({ rows }) {
    return (
      <TableWrap>
        <Table>
          <THead>
            <TR>
              <TH>Meeting</TH>
              <TH>When</TH>
              <TH>Platform</TH>
              <TH>Agenda</TH>
              <TH className="w-10" />
            </TR>
          </THead>
          <TBody>
            {rows.map((m) => (
              <TR key={m.id}>
                <TD>
                  <p className="font-medium">{m.title}</p>
                </TD>
                <TD>
                  <p className="whitespace-nowrap text-[13px]">{date(m.meeting_date)}</p>
                  {m.meeting_time && (
                    <p className="whitespace-nowrap text-xs text-muted-foreground">{m.meeting_time}</p>
                  )}
                </TD>
                <TD>
                  <Badge size="sm">{m.platform ?? '—'}</Badge>
                </TD>
                <TD className="max-w-[320px]">
                  <span className="text-[13px] text-muted-foreground">{truncate(m.notes, 70) || '—'}</span>
                </TD>
                <TD>
                  <ActionMenu items={rowActions(m)} />
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </TableWrap>
    )
  }

  return (
    <>
      <SectionCard
        title="Upcoming"
        description={`${upcoming.length} scheduled`}
        actions={
          <Button size="sm" onClick={() => setDialog({ open: true, meeting: null })}>
            <Plus aria-hidden="true" />
            Schedule
          </Button>
        }
        flush
      >
        <AsyncView
          query={query}
          skeletonProps={{ columns: 4 }}
          empty={{
            icon: CalendarClock,
            title: 'No meetings yet',
            description: 'Schedule one and send reminders to whoever needs to be there.',
            action: <Button onClick={() => setDialog({ open: true, meeting: null })}>Schedule meeting</Button>,
          }}
        >
          {() =>
            upcoming.length === 0 ? (
              <EmptyState compact icon={CalendarClock} title="Nothing coming up" />
            ) : (
              <MeetingTable rows={upcoming} />
            )
          }
        </AsyncView>
      </SectionCard>

      {past.length > 0 && (
        <SectionCard title="Past meetings" description={`${past.length} held`} flush className="mt-4">
          <MeetingTable rows={past} />
        </SectionCard>
      )}

      <MeetingDialog
        open={dialog.open}
        meeting={dialog.meeting}
        business={business}
        onClose={() => setDialog({ open: false, meeting: null })}
        onDone={query.refetch}
      />

      {remind && <RemindDialog open onClose={() => setRemind(null)} meeting={remind} />}
      {feedback && <FeedbackDialog open onClose={() => setFeedback(null)} meeting={feedback} />}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => remove.run(pendingDelete.id)}
        title={`Remove "${pendingDelete?.title}"?`}
        description="Feedback collected for this meeting will be removed as well."
        confirmLabel="Remove"
        destructive
        busy={remove.busy}
      />
    </>
  )
}
