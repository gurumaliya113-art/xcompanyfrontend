import * as React from 'react'
import { useSearchParams } from 'react-router-dom'
import { Download, Handshake, Mail, Phone, Trash2, User } from 'lucide-react'
import { Page, PageHeader, PageBody, Toolbar, SearchInput, FilterSelect, ToolbarSpacer } from '@/components/patterns/Page'
import { StatCard, StatGrid } from '@/components/patterns/StatCard'
import { SectionCard, DetailList, DetailRow } from '@/components/patterns/SectionCard'
import { RouteTabs } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ActionMenu } from '@/components/ui/menu'
import { Dialog, ConfirmDialog } from '@/components/ui/dialog'
import { AsyncView } from '@/components/ui/states'
import { TableWrap, Table, THead, TBody, TR, TH, TD } from '@/components/ui/table'
import { useQuery, useMutation } from '@/lib/useQuery'
import { leads } from '@/lib/api'
import { date, relativeTime, truncate, number } from '@/lib/format'
import { downloadCsv } from '@/lib/export'
import toast from 'react-hot-toast'

/* =====================================================================
   Clients — inbound enquiries and partner interest.

   The gap this closes: the website has been collecting leads into
   `enquiries` and `partners` since launch, but the only place they surfaced
   was a count on /admin ("Enquiries: 47"). Nobody could read a lead without
   opening the Supabase table editor. The data was there; the product was not.

   Design: one list per type as route tabs (linkable), search across every
   field, a detail sheet for the full record, and CSV export so leads can be
   worked outside the app. Delete is confirmed because these are the only
   copy of a customer's request.
   ===================================================================== */

export const CLIENT_TABS = [
  { to: '/app/clients/enquiries', label: 'Enquiries', icon: Mail },
  { to: '/app/clients/partners', label: 'Partners', icon: Handshake },
]

function matches(row, term) {
  if (!term) return true
  const q = term.toLowerCase()
  return Object.values(row).some((v) => v != null && String(v).toLowerCase().includes(q))
}

const RANGES = [
  { value: 'all', label: 'All time' },
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
]

function withinRange(row, days) {
  if (days === 'all') return true
  if (!row.created_at) return false
  return Date.now() - new Date(row.created_at).getTime() <= Number(days) * 86400000
}

/** Shared list shell so both tabs behave identically. */
function LeadList({ kind }) {
  const isEnquiry = kind === 'enquiry'
  const [params, setParams] = useSearchParams()
  const [search, setSearch] = React.useState('')
  const [range, setRange] = React.useState('all')
  const [selected, setSelected] = React.useState(null)
  const [pendingDelete, setPendingDelete] = React.useState(null)

  const query = useQuery(() => (isEnquiry ? leads.enquiries() : leads.partners()), [isEnquiry])

  const remove = useMutation(
    (id) => (isEnquiry ? leads.removeEnquiry(id) : leads.removePartner(id)),
    {
      onSuccess: () => {
        toast.success('Record deleted')
        setPendingDelete(null)
        setSelected(null)
        query.refetch()
      },
      onError: (e) => toast.error(e.message),
    }
  )

  // Deep link support: /app/clients/enquiries?id=… opens that record.
  React.useEffect(() => {
    const id = params.get('id')
    if (!id || !query.data) return
    const found = query.data.find((r) => String(r.id) === id)
    if (found) setSelected(found)
  }, [params, query.data])

  const rows = React.useMemo(
    () => (query.data ?? []).filter((r) => matches(r, search) && withinRange(r, range)),
    [query.data, search, range]
  )

  const thisWeek = React.useMemo(
    () => (query.data ?? []).filter((r) => withinRange(r, '7')).length,
    [query.data]
  )

  function openRecord(row) {
    setSelected(row)
    setParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('id', String(row.id))
      return next
    })
  }

  function closeRecord() {
    setSelected(null)
    setParams((prev) => {
      const next = new URLSearchParams(prev)
      next.delete('id')
      return next
    })
  }

  return (
    <>
      <StatGrid cols={3} className="mb-4">
        <StatCard label="Total" value={number((query.data ?? []).length)} icon={isEnquiry ? Mail : Handshake} />
        <StatCard label="This week" value={number(thisWeek)} hint="Received in the last 7 days" />
        <StatCard
          label="Showing"
          value={number(rows.length)}
          hint={search || range !== 'all' ? 'Filtered' : 'No filters applied'}
        />
      </StatGrid>

      <SectionCard flush>
        <div className="px-4 pt-4 sm:px-5">
          <Toolbar>
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder={isEnquiry ? 'Search enquiries…' : 'Search partners…'}
            />
            <FilterSelect label="Period" value={range} onChange={setRange} options={RANGES} />
            <ToolbarSpacer />
            <Button
              variant="outline"
              size="sm"
              disabled={rows.length === 0}
              onClick={() => {
                downloadCsv(isEnquiry ? 'enquiries' : 'partners', rows)
                toast.success(`Exported ${rows.length} rows`)
              }}
            >
              <Download aria-hidden="true" />
              Export CSV
            </Button>
          </Toolbar>
        </div>

        <AsyncView
          query={query}
          skeletonProps={{ columns: 5 }}
          empty={{
            icon: isEnquiry ? Mail : Handshake,
            title: isEnquiry ? 'No enquiries yet' : 'No partner enquiries yet',
            description: isEnquiry
              ? 'Submissions from the website enquiry form land here.'
              : 'Partner and investor interest from the website lands here.',
          }}
        >
          {() =>
            rows.length === 0 ? (
              <div className="px-4 pb-6 pt-2 text-center text-sm text-muted-foreground sm:px-5">
                Nothing matches the current filters.
              </div>
            ) : (
              <TableWrap>
                <Table>
                  <THead>
                    <TR>
                      <TH>Name</TH>
                      <TH>Contact</TH>
                      <TH>{isEnquiry ? 'Requirement' : 'Message'}</TH>
                      {isEnquiry && <TH>Budget</TH>}
                      <TH>Received</TH>
                      <TH className="w-10" />
                    </TR>
                  </THead>
                  <TBody>
                    {rows.map((row) => (
                      <TR key={row.id} interactive onClick={() => openRecord(row)}>
                        <TD>
                          <p className="font-medium">{row.name || '—'}</p>
                          {row.company && (
                            <p className="text-xs text-muted-foreground">{truncate(row.company, 30)}</p>
                          )}
                        </TD>
                        <TD>
                          <p className="text-[13px]">{row.phone || '—'}</p>
                          {row.email && <p className="text-xs text-muted-foreground">{truncate(row.email, 28)}</p>}
                        </TD>
                        <TD className="max-w-[280px]">
                          <span className="text-[13px] text-muted-foreground">
                            {truncate(isEnquiry ? row.project_details : row.message, 70) || '—'}
                          </span>
                        </TD>
                        {isEnquiry && (
                          <TD>
                            {row.budget ? <Badge size="sm">{truncate(row.budget, 18)}</Badge> : <span className="text-muted-foreground">—</span>}
                          </TD>
                        )}
                        <TD>
                          <span className="whitespace-nowrap text-[13px] text-muted-foreground">
                            {relativeTime(row.created_at)}
                          </span>
                        </TD>
                        <TD onClick={(e) => e.stopPropagation()}>
                          <ActionMenu
                            items={[
                              { label: 'View details', icon: User, onSelect: () => openRecord(row) },
                              row.phone && {
                                label: 'Call',
                                icon: Phone,
                                onSelect: () => window.open(`tel:${row.phone}`, '_self'),
                              },
                              row.email && {
                                label: 'Email',
                                icon: Mail,
                                onSelect: () => window.open(`mailto:${row.email}`, '_self'),
                              },
                              { separator: true },
                              {
                                label: 'Delete',
                                icon: Trash2,
                                destructive: true,
                                onSelect: () => setPendingDelete(row),
                              },
                            ]}
                          />
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

      {/* Detail sheet — the full record without leaving the list */}
      <Dialog
        open={Boolean(selected)}
        onClose={closeRecord}
        variant="sheet"
        title={selected?.name || 'Record'}
        description={selected?.company || (isEnquiry ? 'Website enquiry' : 'Partner enquiry')}
        footer={
          <>
            {selected?.phone && (
              <Button variant="outline" asChild>
                <a href={`tel:${selected.phone}`}>
                  <Phone aria-hidden="true" />
                  Call
                </a>
              </Button>
            )}
            {selected?.email && (
              <Button asChild>
                <a href={`mailto:${selected.email}`}>
                  <Mail aria-hidden="true" />
                  Reply
                </a>
              </Button>
            )}
          </>
        }
      >
        {selected && (
          <div className="space-y-5">
            <DetailList>
              <DetailRow label="Name">{selected.name || '—'}</DetailRow>
              <DetailRow label="Company">{selected.company || '—'}</DetailRow>
              <DetailRow label="Phone">{selected.phone || '—'}</DetailRow>
              <DetailRow label="Email">{selected.email || '—'}</DetailRow>
              {isEnquiry ? (
                <>
                  <DetailRow label="Budget">{selected.budget || '—'}</DetailRow>
                  <DetailRow label="Timeline">{selected.timeline || '—'}</DetailRow>
                </>
              ) : (
                <>
                  <DetailRow label="City">{selected.city || '—'}</DetailRow>
                  <DetailRow label="Work type">{selected.work_type || selected.investment_interest || '—'}</DetailRow>
                </>
              )}
              <DetailRow label="Received">{date(selected.created_at)}</DetailRow>
            </DetailList>

            <div>
              <p className="mb-1.5 text-[13px] font-medium">{isEnquiry ? 'Requirement' : 'Message'}</p>
              <p className="whitespace-pre-wrap rounded-[--radius] border border-border bg-muted/50 p-3 text-sm leading-relaxed">
                {(isEnquiry ? selected.project_details : selected.message) || 'No details provided.'}
              </p>
            </div>

            <Button
              variant="outline"
              className="w-full text-[hsl(var(--destructive))]"
              onClick={() => setPendingDelete(selected)}
            >
              <Trash2 aria-hidden="true" />
              Delete record
            </Button>
          </div>
        )}
      </Dialog>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => remove.run(pendingDelete.id)}
        title={`Delete ${pendingDelete?.name || 'this record'}?`}
        description="This is the only copy of the enquiry. It cannot be recovered."
        confirmLabel="Delete"
        destructive
        busy={remove.busy}
      />
    </>
  )
}

function ClientsShell({ title, description, children }) {
  return (
    <Page>
      <PageHeader title={title} description={description}>
        <RouteTabs tabs={CLIENT_TABS} />
      </PageHeader>
      <PageBody>{children}</PageBody>
    </Page>
  )
}

export function EnquiriesPage() {
  return (
    <ClientsShell title="Clients" description="Everyone who has asked to work with ExFlow">
      <LeadList kind="enquiry" />
    </ClientsShell>
  )
}

export function PartnersPage() {
  return (
    <ClientsShell title="Clients" description="Everyone who has asked to work with ExFlow">
      <LeadList kind="partner" />
    </ClientsShell>
  )
}
