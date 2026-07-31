import * as React from 'react'
import { Building2, Coins, Mail, Plus, Save, Trash2, TrendingUp } from 'lucide-react'
import { Page, PageHeader, PageBody } from '@/components/patterns/Page'
import { SectionCard, DetailList, DetailRow, SplitLayout } from '@/components/patterns/SectionCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ActionMenu } from '@/components/ui/menu'
import { ConfirmDialog } from '@/components/ui/dialog'
import { Field, FieldGrid, TextInput } from '@/components/ui/field'
import { RouteTabs } from '@/components/ui/tabs'
import { AsyncView, EmptyState, Spinner } from '@/components/ui/states'
import { TableWrap, Table, THead, TBody, TFoot, TR, TH, TD } from '@/components/ui/table'
import { useQuery, useMutation, useLocalState } from '@/lib/useQuery'
import { equity, layers, businesses } from '@/lib/api'
import { sharePrice } from '@/lib/calc'
import { money, moneyPrecise, number, percent, date } from '@/lib/format'
import { BACKEND_URL } from '@/lib/api'
import toast from 'react-hot-toast'

/* =====================================================================
   Settings — the values everything else is derived from.

   Two of these had no interface at all before. Company valuation and total
   share count drive every share price, every cap-table value and one of the
   Overview cards, and the only way to change them was to open the Supabase
   table editor. Putting them behind a form with a visible consequence
   ("share price becomes X") is the single highest-leverage change on this page.

   Cap-table layers were a separate top-level sidebar item ("Layers") with a
   three-card chooser leading to three near-identical add forms. They are
   configuration, so they live here.

   Notifications replaces the "Pool OTP Config" sidebar entry, which rendered
   static instructional text and touched no data at all.
   ===================================================================== */

export const SETTINGS_TABS = [
  { to: '/app/settings', label: 'Organisation', end: true },
  { to: '/app/settings/layers', label: 'Cap Table Layers' },
  { to: '/app/settings/notifications', label: 'Notifications' },
]

function SettingsShell({ children }) {
  return (
    <Page>
      <PageHeader title="Settings" description="Values and structures the rest of the console derives from">
        <RouteTabs tabs={SETTINGS_TABS} />
      </PageHeader>
      <PageBody>{children}</PageBody>
    </Page>
  )
}

/* ------------------------------------------------------------------ */
/* Organisation                                                       */
/* ------------------------------------------------------------------ */

const CATEGORIES_KEY = 'xco_business_categories_v1'
const DEFAULT_CATEGORIES = ['food', 'software', 'services']

export function OrganisationSettingsPage() {
  const [form, setForm] = React.useState({ companyValue: '', totalShares: '' })
  const [errors, setErrors] = React.useState({})
  const [categories, setCategories] = useLocalState(CATEGORIES_KEY, DEFAULT_CATEGORIES)
  const [newCategory, setNewCategory] = React.useState('')

  const query = useQuery(async () => {
    const [companyValue, totalShares, projects] = await Promise.all([
      equity.companyValue().catch(() => 0),
      equity.totalShares().catch(() => 0),
      businesses.listBasic().catch(() => []),
    ])
    return { companyValue, totalShares, projects }
  }, [])

  React.useEffect(() => {
    if (query.data) {
      setForm({ companyValue: String(query.data.companyValue ?? ''), totalShares: String(query.data.totalShares ?? '') })
    }
  }, [query.data])

  const value = Number(form.companyValue)
  const shares = Number(form.totalShares)
  const nextPrice = sharePrice(value, shares)
  const currentPrice = query.data ? sharePrice(query.data.companyValue, query.data.totalShares) : 0
  const changed =
    query.data && (value !== Number(query.data.companyValue) || shares !== Number(query.data.totalShares))

  const save = useMutation(
    async () => {
      if (value !== Number(query.data.companyValue)) await equity.setCompanyValue(value)
      if (shares !== Number(query.data.totalShares)) await equity.setTotalShares(shares)
      // Record a price point so the Equity trend chart has real history
      // instead of falling back to placeholder values, as the legacy chart did.
      if (Number.isFinite(nextPrice) && nextPrice > 0) await equity.recordPricePoint(nextPrice).catch(() => {})
    },
    {
      onSuccess: () => {
        toast.success('Organisation settings saved')
        query.refetch()
      },
      onError: (e) => toast.error(e.message),
    }
  )

  function submit(e) {
    e.preventDefault()
    const next = {}
    if (!Number.isFinite(value) || value < 0) next.companyValue = 'Enter a valid valuation'
    if (!Number.isFinite(shares) || shares <= 0) next.totalShares = 'Total shares must be greater than zero'
    setErrors(next)
    if (Object.keys(next).length > 0) return
    save.run()
  }

  const usedCategories = React.useMemo(() => {
    const map = new Map()
    for (const p of query.data?.projects ?? []) {
      const key = String(p.type ?? '').toLowerCase() || 'uncategorised'
      map.set(key, (map.get(key) ?? 0) + 1)
    }
    return map
  }, [query.data])

  return (
    <SettingsShell>
      <SplitLayout
        main={
          <>
            <SectionCard
              title="Valuation and shares"
              description="These two numbers set the share price used everywhere"
              actions={
                <Button size="sm" type="submit" form="org-form" disabled={save.busy || !changed}>
                  {save.busy ? (
                    <>
                      <Spinner />
                      Saving…
                    </>
                  ) : (
                    <>
                      <Save aria-hidden="true" />
                      Save
                    </>
                  )}
                </Button>
              }
            >
              {query.loading ? (
                <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
                  <Spinner />
                  Loading…
                </div>
              ) : (
                <form id="org-form" onSubmit={submit} className="space-y-5">
                  <FieldGrid cols={2}>
                    <Field
                      label="Company valuation"
                      required
                      htmlFor="og-value"
                      error={errors.companyValue}
                      hint="Set by the founders, not derived"
                    >
                      <TextInput
                        id="og-value"
                        type="number"
                        inputMode="decimal"
                        min="0"
                        value={form.companyValue}
                        onChange={(e) => setForm({ ...form, companyValue: e.target.value })}
                        invalid={Boolean(errors.companyValue)}
                      />
                    </Field>
                    <Field
                      label="Total shares"
                      required
                      htmlFor="og-shares"
                      error={errors.totalShares}
                      hint="The full issued share count"
                    >
                      <TextInput
                        id="og-shares"
                        type="number"
                        inputMode="numeric"
                        min="1"
                        value={form.totalShares}
                        onChange={(e) => setForm({ ...form, totalShares: e.target.value })}
                        invalid={Boolean(errors.totalShares)}
                      />
                    </Field>
                  </FieldGrid>

                  <div className="rounded-[--radius] border border-border bg-muted/50 p-3">
                    <p className="mb-2 text-[13px] font-medium">Resulting share price</p>
                    <div className="flex flex-wrap items-baseline gap-3">
                      <p className="text-2xl font-semibold tabular">{moneyPrecise(nextPrice)}</p>
                      {changed && currentPrice > 0 && (
                        <Badge size="sm" tone={nextPrice >= currentPrice ? 'success' : 'danger'}>
                          was {moneyPrecise(currentPrice)}
                        </Badge>
                      )}
                    </div>
                    <p className="mt-2 text-[13px] text-muted-foreground">
                      Every holding on the cap table is revalued the moment this changes. Saving also records a price
                      point so the trend chart has real history.
                    </p>
                  </div>
                </form>
              )}
            </SectionCard>

            <SectionCard
              title="Project categories"
              description="Used to group the portfolio"
              actions={
                <Badge size="sm" tone="warning">
                  Stored in this browser
                </Badge>
              }
            >
              <div className="mb-4 flex gap-2">
                <TextInput
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="manufacturing"
                  aria-label="New category"
                />
                <Button
                  variant="outline"
                  onClick={() => {
                    const v = newCategory.trim().toLowerCase()
                    if (!v) return
                    if (categories.includes(v)) {
                      toast.error('That category already exists')
                      return
                    }
                    setCategories([...categories, v])
                    setNewCategory('')
                    toast.success('Category added')
                  }}
                >
                  <Plus aria-hidden="true" />
                  Add
                </Button>
              </div>

              <TableWrap>
                <Table>
                  <THead>
                    <TR>
                      <TH>Category</TH>
                      <TH numeric>Projects</TH>
                      <TH className="w-10" />
                    </TR>
                  </THead>
                  <TBody>
                    {categories.map((c) => (
                      <TR key={c}>
                        <TD>
                          <span className="font-medium capitalize">{c}</span>
                        </TD>
                        <TD numeric>{number(usedCategories.get(c) ?? 0)}</TD>
                        <TD>
                          <ActionMenu
                            items={[
                              {
                                label: 'Remove category',
                                icon: Trash2,
                                destructive: true,
                                disabled: (usedCategories.get(c) ?? 0) > 0,
                                onSelect: () => {
                                  setCategories(categories.filter((x) => x !== c))
                                  toast.success('Category removed')
                                },
                              },
                            ]}
                          />
                        </TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
              </TableWrap>

              <p className="mt-3 text-[13px] text-muted-foreground">
                Categories live in browser storage, so they are per-device and disappear if site data is cleared. Moving
                them to the database is tracked as a known gap.
              </p>
            </SectionCard>
          </>
        }
        aside={
          <>
            <SectionCard title="Current values">
              <DetailList>
                <DetailRow label="Valuation">{query.data ? money(query.data.companyValue) : '—'}</DetailRow>
                <DetailRow label="Total shares">{query.data ? number(query.data.totalShares) : '—'}</DetailRow>
                <DetailRow label="Share price" className="font-semibold">
                  {moneyPrecise(currentPrice)}
                </DetailRow>
                <DetailRow label="Projects">{number((query.data?.projects ?? []).length)}</DetailRow>
              </DetailList>
            </SectionCard>

            <SectionCard title="What these affect" bodyClassName="p-4">
              <ul className="space-y-2.5 text-[13px] text-muted-foreground">
                <li>Share price on the Overview and Equity pages</li>
                <li>The value of every holding on the cap table</li>
                <li>The rate applied to employee share purchases and buybacks</li>
              </ul>
            </SectionCard>
          </>
        }
      />
    </SettingsShell>
  )
}

/* ------------------------------------------------------------------ */
/* Cap table layers                                                   */
/* ------------------------------------------------------------------ */

function LayerTable({ layer, title, description }) {
  const [form, setForm] = React.useState({ name: '', shareValue: '' })
  const [pendingDelete, setPendingDelete] = React.useState(null)

  const query = useQuery(() => layers.list(layer), [layer])

  const add = useMutation(() => layers.addMember(layer, { name: form.name.trim(), shareValue: form.shareValue }), {
    onSuccess: () => {
      toast.success('Added')
      setForm({ name: '', shareValue: '' })
      query.refetch()
    },
    onError: (e) => toast.error(e.message),
  })

  const remove = useMutation((id) => layers.remove(layer, id), {
    onSuccess: () => {
      toast.success('Removed')
      setPendingDelete(null)
      query.refetch()
    },
    onError: (e) => toast.error(e.message),
  })

  const rows = query.data ?? []
  const total = rows.reduce((s, r) => s + (Number(r.share_value) || 0), 0)

  return (
    <>
      <SectionCard title={title} description={description} flush>
        <div className="border-b border-border p-4 sm:p-5">
          <form
            className="flex flex-wrap items-end gap-3"
            onSubmit={(e) => {
              e.preventDefault()
              if (!form.name.trim()) {
                toast.error('Name is required')
                return
              }
              add.run()
            }}
          >
            <Field label="Name" htmlFor={`l${layer}-name`} className="min-w-[200px] flex-1">
              <TextInput
                id={`l${layer}-name`}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Full name"
              />
            </Field>
            <Field label="Holding value" htmlFor={`l${layer}-value`} className="w-[180px]">
              <TextInput
                id={`l${layer}-value`}
                type="number"
                inputMode="decimal"
                min="0"
                value={form.shareValue}
                onChange={(e) => setForm({ ...form, shareValue: e.target.value })}
                placeholder="0"
              />
            </Field>
            <Button type="submit" disabled={add.busy}>
              <Plus aria-hidden="true" />
              Add
            </Button>
          </form>
        </div>

        <AsyncView
          query={query}
          skeletonProps={{ columns: 3 }}
          empty={{ icon: Building2, title: 'Nobody in this layer yet', compact: true }}
        >
          {() =>
            rows.length === 0 ? (
              <EmptyState compact icon={Building2} title="Nobody in this layer yet" />
            ) : (
              <TableWrap>
                <Table>
                  <THead>
                    <TR>
                      <TH>Name</TH>
                      <TH numeric>Holding value</TH>
                      <TH numeric>Share</TH>
                      <TH>Added</TH>
                      <TH className="w-10" />
                    </TR>
                  </THead>
                  <TBody>
                    {rows.map((r) => (
                      <TR key={r.id}>
                        <TD>
                          <span className="font-medium">{r.name}</span>
                        </TD>
                        <TD numeric>{money(r.share_value)}</TD>
                        <TD numeric>
                          {total > 0 ? percent(((Number(r.share_value) || 0) / total) * 100, 1) : '—'}
                        </TD>
                        <TD>
                          <span className="whitespace-nowrap text-[13px] text-muted-foreground">
                            {date(r.created_at)}
                          </span>
                        </TD>
                        <TD>
                          <ActionMenu
                            items={[
                              { label: 'Remove', icon: Trash2, destructive: true, onSelect: () => setPendingDelete(r) },
                            ]}
                          />
                        </TD>
                      </TR>
                    ))}
                  </TBody>
                  <TFoot>
                    <TR>
                      <TD className="font-medium">
                        {rows.length} {rows.length === 1 ? 'person' : 'people'}
                      </TD>
                      <TD numeric>{money(total)}</TD>
                      <TD colSpan={3} />
                    </TR>
                  </TFoot>
                </Table>
              </TableWrap>
            )
          }
        </AsyncView>
      </SectionCard>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => remove.run(pendingDelete.id)}
        title={`Remove ${pendingDelete?.name}?`}
        confirmLabel="Remove"
        destructive
        busy={remove.busy}
      />
    </>
  )
}

export function LayersSettingsPage() {
  return (
    <SettingsShell>
      <div className="space-y-4">
        <div className="rounded-[--radius] border border-border bg-muted/40 px-4 py-3 text-[13px] text-muted-foreground">
          These layers describe how the company is structured. Layer 1 and 2 hold declared values entered by hand — they
          are not linked to the share ledger, so the Equity page and these numbers can disagree. Layer 3 is the project
          list; Layer 4 is investor capital.
        </div>

        <LayerTable
          layer={1}
          title="Layer 1 — Founders"
          description="Full-time founders with declared holdings"
        />
        <LayerTable
          layer={2}
          title="Layer 2 — Members and shareholders"
          description="Employees who hold a stake"
        />

        <SectionCard
          title="Layer 3 — Projects"
          description="Every venture operating under ExCompany"
          actions={
            <Button variant="outline" size="sm" asChild>
              <a href="/app/projects">Manage projects</a>
            </Button>
          }
        >
          <p className="text-[13px] text-muted-foreground">
            Layer 3 is the same data as the Projects module, so it is managed there rather than duplicated here.
          </p>
        </SectionCard>

        <SectionCard
          title="Layer 4 — Investors"
          description="Capital taken in, with accruing interest"
          actions={
            <Button variant="outline" size="sm" asChild>
              <a href="/app/finance/investors">Manage investors</a>
            </Button>
          }
        >
          <p className="text-[13px] text-muted-foreground">
            Investors carry an interest calculation, so they live under Finance with the rest of the money.
          </p>
        </SectionCard>
      </div>
    </SettingsShell>
  )
}

/* ------------------------------------------------------------------ */
/* Notifications                                                      */
/* ------------------------------------------------------------------ */

export function NotificationsSettingsPage() {
  const health = useQuery(async () => {
    const res = await fetch(`${BACKEND_URL}/health`)
    if (!res.ok) throw new Error(`Backend returned ${res.status}`)
    return res.json()
  }, [])

  const rows = [
    {
      name: 'Pool approval code',
      trigger: 'A manager requests or submits money',
      to: "Founder's email address",
      env: 'FOUNDER_EMAIL',
      icon: Coins,
    },
    {
      name: 'Priority note alert',
      trigger: 'A note is flagged as priority',
      to: 'All cofounder addresses',
      env: 'COFOUNDER_EMAILS',
      icon: Mail,
    },
    {
      name: 'Meeting reminder',
      trigger: 'Sent manually from a meeting',
      to: 'Addresses entered at send time',
      env: 'SEND_EMAIL_FROM',
      icon: Mail,
    },
  ]

  return (
    <SettingsShell>
      <SplitLayout
        main={
          <SectionCard title="Email notifications" description="What the system sends, and where it goes" flush>
            <TableWrap>
              <Table>
                <THead>
                  <TR>
                    <TH>Notification</TH>
                    <TH>Sent when</TH>
                    <TH>Recipient</TH>
                    <TH>Configured by</TH>
                  </TR>
                </THead>
                <TBody>
                  {rows.map((r) => (
                    <TR key={r.name}>
                      <TD>
                        <div className="flex items-center gap-2.5">
                          <span className="flex size-7 shrink-0 items-center justify-center rounded-[--radius-sm] border border-border bg-muted text-muted-foreground">
                            <r.icon className="size-3.5" aria-hidden="true" />
                          </span>
                          <span className="font-medium">{r.name}</span>
                        </div>
                      </TD>
                      <TD>
                        <span className="text-[13px] text-muted-foreground">{r.trigger}</span>
                      </TD>
                      <TD>
                        <span className="text-[13px]">{r.to}</span>
                      </TD>
                      <TD>
                        <code className="rounded-[--radius-sm] bg-muted px-1.5 py-0.5 text-xs">{r.env}</code>
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </TableWrap>
            <div className="border-t border-border bg-muted/40 px-4 py-3 text-[13px] text-muted-foreground sm:px-5">
              Recipients are set as environment variables on the backend, not in this interface, so a compromised console
              session cannot redirect approval codes.
            </div>
          </SectionCard>
        }
        aside={
          <>
            <SectionCard title="Backend status">
              <DetailList>
                <DetailRow label="Endpoint">
                  <span className="font-mono text-xs">{BACKEND_URL || 'same origin'}</span>
                </DetailRow>
                <DetailRow label="Reachable">
                  {health.loading ? (
                    <Spinner />
                  ) : health.error ? (
                    <Badge size="sm" tone="danger" dot>
                      Unreachable
                    </Badge>
                  ) : (
                    <Badge size="sm" tone="success" dot>
                      Healthy
                    </Badge>
                  )}
                </DetailRow>
              </DetailList>
              {health.error && (
                <p className="mt-3 text-[13px] text-muted-foreground">
                  Email, approval codes and X-Ai all run through the backend. While it is unreachable those features will
                  fail; everything that reads the database directly keeps working.
                </p>
              )}
              <Button variant="outline" size="sm" className="mt-3 w-full" onClick={health.refetch}>
                Check again
              </Button>
            </SectionCard>

            <SectionCard title="Approval rules" bodyClassName="p-4">
              <DetailList>
                <DetailRow label="Code length">6 digits</DetailRow>
                <DetailRow label="Valid for">2 minutes</DetailRow>
                <DetailRow label="Attempts allowed">3</DetailRow>
                <DetailRow label="Reuse">Not permitted</DetailRow>
                <DetailRow label="Request limit">5 per 10 minutes</DetailRow>
              </DetailList>
            </SectionCard>
          </>
        }
      />
    </SettingsShell>
  )
}

export default OrganisationSettingsPage
