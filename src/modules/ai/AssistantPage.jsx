import * as React from 'react'
import { ArrowUp, Bot, Copy, RotateCcw, Sparkles, User } from 'lucide-react'
import { Page, PageHeader, PageBody } from '@/components/patterns/Page'
import { SectionCard } from '@/components/patterns/SectionCard'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/field'
import { EmptyState, Spinner } from '@/components/ui/states'
import { backend } from '@/lib/api'
import { useWorkspace, BusinessPicker } from '@/app/workspace'
import { relativeTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

/* =====================================================================
   X-Ai — ask questions about one business in plain language.

   This was the fifth tab inside the mobile DCE app, which meant the most
   capable feature in the product was three taps deep and invisible to anyone
   who never opened DCE. It is now a top-level destination.

   The backend contract is unchanged: POST /dce-ask with { business_id,
   business_name, question }. The server assembles that business's notes,
   spends, meetings and documents into context and asks Gemini, instructing it
   to answer in the same language the question was asked in.

   Added on the client, because the endpoint is stateless:
   - A visible transcript, so you can compare two answers side by side.
   - Suggested questions, since a blank prompt box gives no hint that this
     thing knows about your actual spend data.
   - The business name in the header, because an answer means nothing if you
     do not know which venture it is about.
   ===================================================================== */

const SUGGESTIONS = [
  'इस महीने कितना खर्चा हुआ?',
  'What are the biggest spends this month?',
  'Kaunse todos pending hain?',
  'Which meetings are coming up?',
  'Summarise the last three notes',
  'Total spend by category',
]

function Bubble({ turn }) {
  const isUser = turn.role === 'user'
  return (
    <div className={cn('flex gap-3', isUser && 'flex-row-reverse')}>
      <span
        className={cn(
          'flex size-7 shrink-0 items-center justify-center rounded-full border',
          isUser
            ? 'border-border bg-muted text-muted-foreground'
            : 'border-[hsl(var(--primary))] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
        )}
      >
        {isUser ? <User className="size-3.5" aria-hidden="true" /> : <Sparkles className="size-3.5" aria-hidden="true" />}
      </span>

      <div className={cn('min-w-0 max-w-[min(680px,85%)] space-y-1', isUser && 'items-end text-right')}>
        <div
          className={cn(
            'rounded-[--radius-lg] px-3.5 py-2.5 text-sm leading-relaxed',
            isUser
              ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
              : turn.error
                ? 'border border-[hsl(var(--destructive)/0.25)] bg-[hsl(var(--destructive-soft))] text-[hsl(var(--destructive))]'
                : 'border border-border bg-card'
          )}
        >
          {turn.pending ? (
            <span className="flex items-center gap-2 text-muted-foreground">
              <Spinner />
              Reading this business's data…
            </span>
          ) : (
            <p className="whitespace-pre-wrap">{turn.text}</p>
          )}
        </div>

        <div className={cn('flex items-center gap-2 px-1', isUser && 'justify-end')}>
          <span className="text-[11px] text-muted-foreground">{relativeTime(turn.at)}</span>
          {!isUser && !turn.pending && !turn.error && (
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(turn.text)
                toast.success('Copied')
              }}
              className="rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground"
            >
              <Copy className="size-3" aria-hidden="true" />
              <span className="sr-only">Copy answer</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AssistantPage() {
  const { business, businessId } = useWorkspace()
  const [turns, setTurns] = React.useState([])
  const [question, setQuestion] = React.useState('')
  const [busy, setBusy] = React.useState(false)
  const endRef = React.useRef(null)
  const inputRef = React.useRef(null)

  // Switching business invalidates the transcript — answers are scoped to one
  // venture and mixing them would be misleading.
  React.useEffect(() => {
    setTurns([])
  }, [businessId])

  React.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [turns])

  async function ask(text) {
    const q = String(text ?? '').trim()
    if (!q || busy) return
    if (!businessId) {
      toast.error('Select a project first')
      return
    }

    const at = new Date().toISOString()
    const pendingId = `a-${Date.now()}`
    setTurns((prev) => [
      ...prev,
      { id: `q-${Date.now()}`, role: 'user', text: q, at },
      { id: pendingId, role: 'assistant', pending: true, at },
    ])
    setQuestion('')
    setBusy(true)

    try {
      const res = await backend.ask({
        business_id: businessId,
        business_name: business?.name ?? '',
        question: q,
      })
      setTurns((prev) =>
        prev.map((t) =>
          t.id === pendingId ? { ...t, pending: false, text: res.answer ?? 'No answer generated.' } : t
        )
      )
    } catch (e) {
      setTurns((prev) =>
        prev.map((t) => (t.id === pendingId ? { ...t, pending: false, error: true, text: e.message } : t))
      )
    } finally {
      setBusy(false)
      inputRef.current?.focus()
    }
  }

  function onKeyDown(e) {
    // Enter sends, Shift+Enter is a newline — the convention people expect.
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      ask(question)
    }
  }

  return (
    <Page>
      <PageHeader
        title="X-Ai"
        description={
          business
            ? `Answers are based only on ${business.name}'s notes, spends, meetings and files`
            : 'Select a project to ask about it'
        }
        actions={
          <>
            {turns.length > 0 && (
              <Button variant="outline" onClick={() => setTurns([])}>
                <RotateCcw aria-hidden="true" />
                Clear
              </Button>
            )}
            <BusinessPicker />
          </>
        }
      />

      <PageBody className="flex min-h-[calc(100vh-14rem)] flex-col">
        <SectionCard flush className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-[320px] flex-1 overflow-y-auto p-4 sm:p-5">
            {turns.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center">
                <EmptyState
                  icon={Bot}
                  title="Ask about this business"
                  description="Spend totals, pending checklist items, upcoming meetings — in Hindi, Hinglish or English. The answer uses only this project's data."
                />
                <div className="mt-2 flex max-w-2xl flex-wrap justify-center gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => ask(s)}
                      disabled={!businessId}
                      className="rounded-full border border-border bg-card px-3 py-1.5 text-[13px] text-muted-foreground transition-colors hover:border-[hsl(215_16%_82%)] hover:text-foreground disabled:opacity-50"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                {turns.map((turn) => (
                  <Bubble key={turn.id} turn={turn} />
                ))}
                <div ref={endRef} />
              </div>
            )}
          </div>

          <div className="border-t border-border bg-muted/40 p-3 sm:p-4">
            <div className="flex items-end gap-2">
              <Textarea
                ref={inputRef}
                rows={1}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={onKeyDown}
                disabled={!businessId || busy}
                placeholder={businessId ? 'Ask anything about this project…' : 'Select a project first'}
                aria-label="Your question"
                className="max-h-40 min-h-[40px] resize-none bg-card py-2.5"
              />
              <Button
                onClick={() => ask(question)}
                disabled={!question.trim() || busy || !businessId}
                size="icon"
                className="size-10 shrink-0"
              >
                {busy ? <Spinner /> : <ArrowUp aria-hidden="true" />}
                <span className="sr-only">Send question</span>
              </Button>
            </div>
            <p className="mt-2 px-1 text-xs text-muted-foreground">
              Each question is answered independently — there is no memory of earlier turns yet. Press Enter to send,
              Shift+Enter for a new line.
            </p>
          </div>
        </SectionCard>
      </PageBody>
    </Page>
  )
}
