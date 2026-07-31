import * as React from 'react'
import { ArrowDownToLine, ArrowUpFromLine, CheckCircle2, KeyRound, Mail, ShieldCheck } from 'lucide-react'
import { Page, PageHeader, PageBody } from '@/components/patterns/Page'
import { SectionCard, DetailList, DetailRow, SplitLayout } from '@/components/patterns/SectionCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Field, FieldGrid, TextInput, Select, Textarea } from '@/components/ui/field'
import { Tabs } from '@/components/ui/tabs'
import { Spinner } from '@/components/ui/states'
import { useQuery, useMutation } from '@/lib/useQuery'
import { pool, backend } from '@/lib/api'
import { poolBalances } from '@/lib/calc'
import { money } from '@/lib/format'
import { useWorkspace, BusinessPicker } from '@/app/workspace'
import { useSession } from '@/app/session'
import toast from 'react-hot-toast'

/* =====================================================================
   Pool Requests — move money in or out of the pool with founder approval.

   The legacy PM panel had this as two nearly identical stacked blocks
   ("Money Request from Pool" and "Submit Money to Pool"), each with its own
   copy of the amount/source/reason fields, its own OTP box, its own countdown
   and its own status line — around 120 lines of duplicated markup and ids
   distinguished only by a `pool_req_` / `pool_sub_` prefix.

   Merged into one form with a direction toggle. Same two endpoints, same
   payload, same rules.

   The flow was also opaque: after pressing "Generate OTP" the user saw an
   order id and a raw seconds counter with no explanation of what to do next.
   It is now a visible two-step process with the founder's role stated
   explicitly, because the code arrives in someone else's inbox — that is the
   single most confusing thing about this feature.
   ===================================================================== */

const OTP_LENGTH = 6

const SOURCES = [
  { value: 'CASH', label: 'Cash' },
  { value: 'BANK', label: 'Bank' },
]

function Countdown({ seconds }) {
  const mm = Math.floor(seconds / 60)
  const ss = String(seconds % 60).padStart(2, '0')
  const low = seconds <= 30
  return (
    <span
      className={
        low
          ? 'font-medium tabular text-[hsl(var(--destructive))]'
          : 'font-medium tabular text-muted-foreground'
      }
    >
      {seconds > 0 ? `${mm}:${ss}` : 'Expired'}
    </span>
  )
}

/** Six separate boxes: harder to mistype, and it reads as a code not a number. */
function OtpInput({ value, onChange, disabled }) {
  const refs = React.useRef([])

  function setDigit(index, digit) {
    const chars = value.padEnd(OTP_LENGTH, ' ').split('')
    chars[index] = digit
    onChange(chars.join('').replace(/\s/g, ''))
    if (digit && index < OTP_LENGTH - 1) refs.current[index + 1]?.focus()
  }

  function onKeyDown(e, index) {
    if (e.key === 'Backspace' && !value[index] && index > 0) refs.current[index - 1]?.focus()
    if (e.key === 'ArrowLeft' && index > 0) refs.current[index - 1]?.focus()
    if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) refs.current[index + 1]?.focus()
  }

  function onPaste(e) {
    const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH)
    if (!digits) return
    e.preventDefault()
    onChange(digits)
    refs.current[Math.min(digits.length, OTP_LENGTH - 1)]?.focus()
  }

  return (
    <div className="flex gap-2" onPaste={onPaste} role="group" aria-label="One-time code">
      {Array.from({ length: OTP_LENGTH }).map((_, i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          value={value[i] ?? ''}
          onChange={(e) => setDigit(i, e.target.value.replace(/\D/g, '').slice(-1))}
          onKeyDown={(e) => onKeyDown(e, i)}
          disabled={disabled}
          inputMode="numeric"
          maxLength={1}
          aria-label={`Digit ${i + 1}`}
          className="h-11 w-10 rounded-[--radius] border border-input bg-card text-center text-lg font-semibold tabular shadow-[--shadow-xs] focus:border-[hsl(var(--ring))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring)/0.12)] disabled:bg-muted"
        />
      ))}
    </div>
  )
}

export default function PoolRequestsPage() {
  const { business, businessId } = useWorkspace()
  const { user } = useSession()

  const [direction, setDirection] = React.useState('request')
  const [form, setForm] = React.useState({ source: 'CASH', amount: '', reason: '' })
  const [errors, setErrors] = React.useState({})
  const [order, setOrder] = React.useState(null) // { id, amount, source, direction }
  const [otp, setOtp] = React.useState('')
  const [remaining, setRemaining] = React.useState(0)

  const balanceQuery = useQuery(async () => poolBalances(await pool.latest()), [])
  const balances = balanceQuery.data ?? { cash: 0, bank: 0, total: 0 }
  const isRequest = direction === 'request'
  const available = form.source === 'CASH' ? balances.cash : balances.bank
  const amount = Number(form.amount)

  // Countdown ticks down; expiry is enforced by the backend regardless.
  React.useEffect(() => {
    if (!order || remaining <= 0) return
    const t = setInterval(() => setRemaining((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(t)
  }, [order, remaining])

  const generate = useMutation(
    () =>
      backend.generateOtp({
        amount,
        type: isRequest ? 'request' : 'submit',
        source: form.source,
        reason: form.reason.trim(),
        business_id: businessId ?? null,
        pm_employee_id: user?.id ?? null,
      }),
    {
      onSuccess: (res) => {
        setOrder({ id: res.order_id, amount, source: form.source, direction })
        setRemaining(res.expires_in ?? 120)
        setOtp('')
        toast.success('Code sent to the founder')
      },
      onError: (e) => toast.error(e.message),
    }
  )

  const verify = useMutation(() => backend.verifyOtp({ order_id: order.id, code: otp }), {
    onSuccess: (res) => {
      toast.success(res.message ?? 'Movement completed')
      setOrder(null)
      setOtp('')
      setRemaining(0)
      setForm({ source: 'CASH', amount: '', reason: '' })
      balanceQuery.refetch()
    },
    onError: (e) => toast.error(e.message),
  })

  function submitRequest(e) {
    e.preventDefault()
    const next = {}
    if (!form.amount || !Number.isFinite(amount) || amount <= 0) next.amount = 'Enter an amount greater than zero'
    else if (isRequest && amount > available) next.amount = `Only ${money(available)} available in ${form.source === 'CASH' ? 'cash' : 'bank'}`
    if (!form.reason.trim()) next.reason = 'Say what this is for — the founder sees this in the email'
    setErrors(next)
    if (Object.keys(next).length > 0) return
    generate.run()
  }

  function cancelOrder() {
    setOrder(null)
    setOtp('')
    setRemaining(0)
  }

  return (
    <Page>
      <PageHeader
        title="Pool Requests"
        description="Take money out of the pool, or put money back in"
        actions={<BusinessPicker />}
        meta={
          <>
            <Badge size="sm">Cash {money(balances.cash)}</Badge>
            <Badge size="sm" tone="info">
              Bank {money(balances.bank)}
            </Badge>
          </>
        }
      />

      <PageBody width="narrow" className="space-y-4">
        <SplitLayout
          className="xl:grid-cols-1"
          main={
            <SectionCard flush>
              <div className="border-b border-border px-4 pt-3 sm:px-5">
                <Tabs
                  value={direction}
                  onChange={(v) => {
                    setDirection(v)
                    setErrors({})
                    cancelOrder()
                  }}
                  className="border-0"
                  tabs={[
                    { value: 'request', label: 'Take money out', icon: ArrowUpFromLine },
                    { value: 'submit', label: 'Put money in', icon: ArrowDownToLine },
                  ]}
                />
              </div>

              <div className="p-4 sm:p-5">
                {/* Step 1 */}
                <div className={order ? 'pointer-events-none opacity-50' : ''}>
                  <div className="mb-4 flex items-center gap-2">
                    <span className="flex size-6 items-center justify-center rounded-full bg-[hsl(var(--primary))] text-[11px] font-semibold text-[hsl(var(--primary-foreground))]">
                      1
                    </span>
                    <p className="text-sm font-medium">Describe the movement</p>
                  </div>

                  <form id="pool-request" onSubmit={submitRequest} className="space-y-5">
                    <FieldGrid cols={2}>
                      <Field
                        label="Account"
                        required
                        htmlFor="pr-source"
                        hint={isRequest ? `Available: ${money(available)}` : 'Where the money will land'}
                      >
                        <Select
                          id="pr-source"
                          value={form.source}
                          onChange={(e) => setForm({ ...form, source: e.target.value })}
                        >
                          {SOURCES.map((s) => (
                            <option key={s.value} value={s.value}>
                              {s.label}
                            </option>
                          ))}
                        </Select>
                      </Field>
                      <Field label="Amount" required htmlFor="pr-amount" error={errors.amount}>
                        <TextInput
                          id="pr-amount"
                          type="number"
                          inputMode="decimal"
                          min="0"
                          step="0.01"
                          value={form.amount}
                          onChange={(e) => setForm({ ...form, amount: e.target.value })}
                          placeholder="0"
                          invalid={Boolean(errors.amount)}
                        />
                      </Field>
                    </FieldGrid>

                    <Field
                      label="Reason"
                      required
                      htmlFor="pr-reason"
                      error={errors.reason}
                      hint="This appears in the approval email and in the pool statement"
                    >
                      <Textarea
                        id="pr-reason"
                        value={form.reason}
                        onChange={(e) => setForm({ ...form, reason: e.target.value })}
                        placeholder={isRequest ? 'Diesel and driver advance for tomorrow' : 'Cash collected from customers today'}
                        invalid={Boolean(errors.reason)}
                      />
                    </Field>

                    {business && (
                      <p className="text-[13px] text-muted-foreground">
                        Recorded against <span className="font-medium text-foreground">{business.name}</span>.
                      </p>
                    )}

                    <Button type="submit" disabled={generate.busy || Boolean(order)}>
                      {generate.busy ? (
                        <>
                          <Spinner />
                          Sending code…
                        </>
                      ) : (
                        <>
                          <Mail aria-hidden="true" />
                          Send code to founder
                        </>
                      )}
                    </Button>
                  </form>
                </div>

                {/* Step 2 */}
                <div className="mt-6 border-t border-border pt-5">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={
                          order
                            ? 'flex size-6 items-center justify-center rounded-full bg-[hsl(var(--primary))] text-[11px] font-semibold text-[hsl(var(--primary-foreground))]'
                            : 'flex size-6 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-muted-foreground'
                        }
                      >
                        2
                      </span>
                      <p className={order ? 'text-sm font-medium' : 'text-sm font-medium text-muted-foreground'}>
                        Enter the code the founder received
                      </p>
                    </div>
                    {order && <Countdown seconds={remaining} />}
                  </div>

                  {!order ? (
                    <p className="text-[13px] text-muted-foreground">
                      A six-digit code is emailed to the founder, not to you. Ask them to read it out, then enter it here
                      within two minutes.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      <div className="rounded-[--radius] border border-border bg-muted/50 p-3">
                        <DetailList>
                          <DetailRow label="Order">
                            <span className="font-mono text-xs">{order.id}</span>
                          </DetailRow>
                          <DetailRow label="Direction">
                            {order.direction === 'request' ? 'Money out of pool' : 'Money into pool'}
                          </DetailRow>
                          <DetailRow label="Account">{order.source === 'CASH' ? 'Cash' : 'Bank'}</DetailRow>
                          <DetailRow label="Amount">{money(order.amount)}</DetailRow>
                        </DetailList>
                      </div>

                      <OtpInput value={otp} onChange={setOtp} disabled={verify.busy || remaining <= 0} />

                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          onClick={() => verify.run()}
                          disabled={otp.length !== OTP_LENGTH || verify.busy || remaining <= 0}
                        >
                          {verify.busy ? (
                            <>
                              <Spinner />
                              Verifying…
                            </>
                          ) : (
                            <>
                              <ShieldCheck aria-hidden="true" />
                              Confirm movement
                            </>
                          )}
                        </Button>
                        {remaining <= 0 ? (
                          <Button variant="outline" onClick={() => generate.run()} disabled={generate.busy}>
                            Send a new code
                          </Button>
                        ) : (
                          <Button variant="ghost" onClick={cancelOrder}>
                            Cancel
                          </Button>
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground">
                        Three wrong attempts invalidate the code. Nothing changes in the pool until the correct code is
                        entered.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </SectionCard>
          }
          aside={
            <SectionCard title="How approval works" bodyClassName="p-4">
              <ol className="space-y-3 text-[13px] text-muted-foreground">
                {[
                  'You describe the amount, account and reason.',
                  'A one-time code is emailed to the founder.',
                  'The founder reads the code to you.',
                  'You enter it here and the pool balance changes.',
                ].map((step, i) => (
                  <li key={step} className="flex gap-2.5">
                    <span className="mt-px flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-foreground">
                      {i + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
              <div className="mt-4 flex items-start gap-2 rounded-[--radius] border border-border bg-muted/40 p-3 text-[13px] text-muted-foreground">
                <KeyRound className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <span>Codes expire after two minutes and can only be used once.</span>
              </div>
            </SectionCard>
          }
        />
      </PageBody>
    </Page>
  )
}
