import * as React from 'react'
import { Check, Flag, Pencil, Plus, StickyNote, Trash2, X } from 'lucide-react'
import { SectionCard } from '@/components/patterns/SectionCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ActionMenu } from '@/components/ui/menu'
import { Dialog, ConfirmDialog } from '@/components/ui/dialog'
import { Field, FieldGrid, TextInput, Textarea, Select } from '@/components/ui/field'
import { AsyncView, EmptyState, Spinner } from '@/components/ui/states'
import { useQuery, useMutation } from '@/lib/useQuery'
import { dce, backend } from '@/lib/api'
import { date, relativeTime, todayISO } from '@/lib/format'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

/* =====================================================================
   Notes — the shared task/scratchpad surface for a business.

   Kept from the legacy DCE: embedded checklists stored as JSONB, highlight
   colours, deadlines, and the "On Priority" action that emails all cofounders
   via POST /send-priority-note.

   Changed:
   - The mobile version rendered notes as full-width cards in a single column
     with the editor as a bottom sheet; the desktop version used a different
     card and a different editor. One masonry grid and one dialog now.
   - Checklist progress was invisible until you opened a note. It is now on
     the card, because "3 of 7 done" is the thing you actually scan for.
   - Highlight colours were raw yellow/green/blue fills that fought the rest
     of the UI. They are now a left border accent — same signal, no shouting.
   ===================================================================== */

const HIGHLIGHTS = [
  { value: 'none', label: 'No highlight', bar: 'transparent' },
  { value: 'yellow', label: 'Yellow', bar: 'hsl(var(--warning))' },
  { value: 'green', label: 'Green', bar: 'hsl(var(--success))' },
  { value: 'blue', label: 'Blue', bar: 'hsl(var(--info))' },
]

const EMPTY = { title: '', content: '', todos: [], highlight_color: 'yellow', deadline: '' }

function normalise(row) {
  let todos = []
  try {
    todos = Array.isArray(row.todos) ? row.todos : JSON.parse(row.todos ?? '[]')
  } catch {
    todos = []
  }
  return {
    ...row,
    todos: todos.map((t, i) => ({
      id: t.id ?? `t${i}`,
      text: t.text ?? '',
      done: Boolean(t.done),
    })),
    highlight_color: row.highlight_color ?? 'none',
  }
}

function NoteDialog({ open, onClose, note, business, onDone }) {
  const editing = Boolean(note)
  const [form, setForm] = React.useState(EMPTY)
  const [todoDraft, setTodoDraft] = React.useState('')
  const [errors, setErrors] = React.useState({})

  React.useEffect(() => {
    if (!open) return
    setErrors({})
    setTodoDraft('')
    setForm(
      note
        ? {
            title: note.title ?? '',
            content: note.content ?? '',
            todos: note.todos ?? [],
            highlight_color: note.highlight_color ?? 'none',
            deadline: note.deadline ?? '',
          }
        : EMPTY
    )
  }, [open, note])

  function addTodo() {
    const text = todoDraft.trim()
    if (!text) return
    setForm((f) => ({ ...f, todos: [...f.todos, { id: `t${Date.now()}`, text, done: false }] }))
    setTodoDraft('')
  }

  const save = useMutation(
    () => {
      const payload = {
        business_id: business.id,
        business_name: business.name,
        title: form.title.trim(),
        content: form.content.trim(),
        todos: form.todos,
        highlight_color: form.highlight_color,
        deadline: form.deadline || null,
        updated_at: new Date().toISOString(),
      }
      return editing ? dce.updateNote(note.id, payload) : dce.createNote(payload)
    },
    {
      onSuccess: () => {
        toast.success(editing ? 'Note updated' : 'Note added')
        dce.logEvent({
          businessId: business.id,
          businessName: business.name,
          event: `${editing ? 'Updated' : 'Created'} note "${form.title.trim()}"`,
          category: 'Notes',
        })
        onDone?.()
        onClose()
      },
      onError: (e) => toast.error(e.message),
    }
  )

  function submit(e) {
    e.preventDefault()
    if (!form.title.trim()) {
      setErrors({ title: 'Give the note a title' })
      return
    }
    save.run()
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={editing ? 'Edit note' : 'New note'}
      description={business?.name}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={save.busy}>
            Cancel
          </Button>
          <Button type="submit" form="note-form" disabled={save.busy}>
            {save.busy ? 'Saving…' : editing ? 'Save changes' : 'Add note'}
          </Button>
        </>
      }
    >
      <form id="note-form" onSubmit={submit} className="space-y-5">
        <Field label="Title" required htmlFor="n-title" error={errors.title}>
          <TextInput
            id="n-title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Vendor negotiation follow-up"
            invalid={Boolean(errors.title)}
            autoFocus
          />
        </Field>

        <Field label="Details" htmlFor="n-content">
          <Textarea
            id="n-content"
            rows={4}
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            placeholder="Context, decisions, anything worth remembering."
          />
        </Field>

        <div>
          <p className="mb-2 text-[13px] font-medium">Checklist</p>
          {form.todos.length > 0 && (
            <ul className="mb-2 space-y-1">
              {form.todos.map((t) => (
                <li key={t.id} className="flex items-center gap-2 rounded-[--radius-sm] bg-muted/60 px-2 py-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        todos: f.todos.map((x) => (x.id === t.id ? { ...x, done: !x.done } : x)),
                      }))
                    }
                    className={cn(
                      'flex size-4 shrink-0 items-center justify-center rounded-[3px] border',
                      t.done ? 'border-transparent bg-[hsl(var(--success))] text-white' : 'border-input bg-card'
                    )}
                  >
                    {t.done && <Check className="size-3" aria-hidden="true" />}
                    <span className="sr-only">{t.done ? 'Mark as pending' : 'Mark as done'}</span>
                  </button>
                  <span className={cn('min-w-0 flex-1 text-[13px]', t.done && 'text-muted-foreground line-through')}>
                    {t.text}
                  </span>
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, todos: f.todos.filter((x) => x.id !== t.id) }))}
                    className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-[hsl(var(--destructive))]"
                  >
                    <X className="size-3.5" aria-hidden="true" />
                    <span className="sr-only">Remove item</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="flex gap-2">
            <TextInput
              value={todoDraft}
              onChange={(e) => setTodoDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addTodo()
                }
              }}
              placeholder="Add a checklist item"
              aria-label="New checklist item"
            />
            <Button type="button" variant="outline" onClick={addTodo}>
              Add
            </Button>
          </div>
        </div>

        <FieldGrid cols={2}>
          <Field label="Deadline" htmlFor="n-deadline">
            <TextInput
              id="n-deadline"
              type="date"
              value={form.deadline}
              onChange={(e) => setForm({ ...form, deadline: e.target.value })}
            />
          </Field>
          <Field label="Highlight" htmlFor="n-color">
            <Select
              id="n-color"
              value={form.highlight_color}
              onChange={(e) => setForm({ ...form, highlight_color: e.target.value })}
            >
              {HIGHLIGHTS.map((h) => (
                <option key={h.value} value={h.value}>
                  {h.label}
                </option>
              ))}
            </Select>
          </Field>
        </FieldGrid>
      </form>
    </Dialog>
  )
}

export default function NotesTab({ business, search }) {
  const [dialog, setDialog] = React.useState({ open: false, note: null })
  const [pendingDelete, setPendingDelete] = React.useState(null)
  const [priorityBusy, setPriorityBusy] = React.useState(null)

  const query = useQuery(
    async () => (await dce.notes(business.id)).map(normalise),
    [business.id]
  )

  const remove = useMutation((id) => dce.removeNote(id), {
    onSuccess: () => {
      toast.success('Note deleted')
      setPendingDelete(null)
      query.refetch()
    },
    onError: (e) => toast.error(e.message),
  })

  /** Optimistic checklist toggle — the round trip should not block the tick. */
  async function toggleTodo(note, todoId) {
    const todos = note.todos.map((t) => (t.id === todoId ? { ...t, done: !t.done } : t))
    query.setData((prev) => (prev ?? []).map((n) => (n.id === note.id ? { ...n, todos } : n)))
    try {
      await dce.updateNote(note.id, { todos, updated_at: new Date().toISOString() })
    } catch (e) {
      toast.error(e.message)
      query.refetch()
    }
  }

  async function sendPriority(note) {
    setPriorityBusy(note.id)
    try {
      await backend.sendPriorityNote({
        title: note.title,
        content: note.content,
        todos: note.todos,
        business: business.name,
        deadline: note.deadline ? date(note.deadline) : '',
      })
      toast.success('Cofounders notified')
      dce.logEvent({
        businessId: business.id,
        businessName: business.name,
        event: `Flagged "${note.title}" as priority`,
        category: 'Notes',
      })
    } catch (e) {
      toast.error(e.message)
    } finally {
      setPriorityBusy(null)
    }
  }

  const rows = React.useMemo(() => {
    const list = query.data ?? []
    if (!search) return list
    const q = search.toLowerCase()
    return list.filter((n) =>
      `${n.title ?? ''} ${n.content ?? ''} ${(n.todos ?? []).map((t) => t.text).join(' ')}`
        .toLowerCase()
        .includes(q)
    )
  }, [query.data, search])

  return (
    <>
      <SectionCard
        title="Notes"
        description={`${rows.length} in ${business.name}`}
        actions={
          <Button size="sm" onClick={() => setDialog({ open: true, note: null })}>
            <Plus aria-hidden="true" />
            New note
          </Button>
        }
        flush
      >
        <AsyncView
          query={query}
          skeleton="cards"
          skeletonProps={{ count: 6 }}
          empty={{
            icon: StickyNote,
            title: 'No notes yet',
            description: 'Capture decisions, follow-ups and checklists for this business.',
            action: <Button onClick={() => setDialog({ open: true, note: null })}>New note</Button>,
          }}
        >
          {() =>
            rows.length === 0 ? (
              <EmptyState compact icon={StickyNote} title="No notes match that search" />
            ) : (
              <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3 sm:p-5">
                {rows.map((note) => {
                  const done = note.todos.filter((t) => t.done).length
                  const overdue = note.deadline && note.deadline < todayISO()
                  const bar = HIGHLIGHTS.find((h) => h.value === note.highlight_color)?.bar ?? 'transparent'
                  return (
                    <article
                      key={note.id}
                      className="flex flex-col rounded-[--radius-lg] border border-border bg-card p-3.5 shadow-[--shadow-xs]"
                      style={{ borderLeftWidth: bar === 'transparent' ? undefined : 3, borderLeftColor: bar }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="min-w-0 flex-1 text-sm font-medium">{note.title}</h3>
                        <ActionMenu
                          items={[
                            { label: 'Edit note', icon: Pencil, onSelect: () => setDialog({ open: true, note }) },
                            {
                              label: priorityBusy === note.id ? 'Sending…' : 'Flag as priority',
                              icon: Flag,
                              disabled: priorityBusy === note.id,
                              onSelect: () => sendPriority(note),
                            },
                            { separator: true },
                            { label: 'Delete note', icon: Trash2, destructive: true, onSelect: () => setPendingDelete(note) },
                          ]}
                        />
                      </div>

                      {note.content && (
                        <p className="mt-1.5 line-clamp-3 text-[13px] leading-relaxed text-muted-foreground">
                          {note.content}
                        </p>
                      )}

                      {note.todos.length > 0 && (
                        <ul className="mt-3 space-y-1">
                          {note.todos.slice(0, 4).map((t) => (
                            <li key={t.id} className="flex items-start gap-2">
                              <button
                                type="button"
                                onClick={() => toggleTodo(note, t.id)}
                                className={cn(
                                  'mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-[3px] border transition-colors',
                                  t.done
                                    ? 'border-transparent bg-[hsl(var(--success))] text-white'
                                    : 'border-input bg-card hover:border-[hsl(215_16%_70%)]'
                                )}
                              >
                                {t.done && <Check className="size-3" aria-hidden="true" />}
                                <span className="sr-only">{t.done ? 'Mark pending' : 'Mark done'}</span>
                              </button>
                              <span
                                className={cn(
                                  'min-w-0 flex-1 text-[13px]',
                                  t.done && 'text-muted-foreground line-through'
                                )}
                              >
                                {t.text}
                              </span>
                            </li>
                          ))}
                          {note.todos.length > 4 && (
                            <li className="pl-6 text-xs text-muted-foreground">
                              +{note.todos.length - 4} more
                            </li>
                          )}
                        </ul>
                      )}

                      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-2.5">
                        {note.todos.length > 0 && (
                          <Badge size="sm" tone={done === note.todos.length ? 'success' : 'neutral'}>
                            {done}/{note.todos.length} done
                          </Badge>
                        )}
                        {note.deadline && (
                          <Badge size="sm" tone={overdue ? 'danger' : 'info'}>
                            {overdue ? 'Overdue ' : 'Due '}
                            {date(note.deadline)}
                          </Badge>
                        )}
                        <span className="ml-auto text-xs text-muted-foreground">
                          {relativeTime(note.updated_at ?? note.inserted_at)}
                        </span>
                      </div>
                    </article>
                  )
                })}
              </div>
            )
          }
        </AsyncView>
      </SectionCard>

      <NoteDialog
        open={dialog.open}
        note={dialog.note}
        business={business}
        onClose={() => setDialog({ open: false, note: null })}
        onDone={query.refetch}
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => remove.run(pendingDelete.id)}
        title={`Delete "${pendingDelete?.title}"?`}
        confirmLabel="Delete note"
        destructive
        busy={remove.busy}
      />
    </>
  )
}
