import * as React from 'react'
import { Activity, Download } from 'lucide-react'
import { Page, PageHeader, PageBody, Toolbar, SearchInput, FilterSelect, ToolbarSpacer } from '@/components/patterns/Page'
import { SectionCard } from '@/components/patterns/SectionCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AsyncView, EmptyState } from '@/components/ui/states'
import { useQuery } from '@/lib/useQuery'
import { dce } from '@/lib/api'
import { dateTime, relativeTime, date } from '@/lib/format'
import { downloadCsv } from '@/lib/export'
import toast from 'react-hot-toast'

/* =====================================================================
   Activity — one audit trail across every business.

   The legacy Audit Log was a tab inside a single business's DCE dashboard, so
   there was no way to see what happened across the company. This page reads
   the same `dce_audit_logs` table without a business filter and groups by day,
   which is how people actually recall events ("what changed on Tuesday?").

   Note the trail is only as good as what writes to it. In the legacy code
   entries were created manually from a form; the console now writes events
   automatically when notes, spends, documents, meetings and decisions change
   (see dce.logEvent). Older gaps in the history are expected.
   ===================================================================== */

function groupByDay(rows) {
  const map = new Map()
  for (const row of rows) {
    const key = String(row.inserted_at ?? '').slice(0, 10) || 'unknown'
    const arr = map.get(key) ?? []
    arr.push(row)
    map.set(key, arr)
  }
  return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]))
}

export default function ActivityPage() {
  const [search, setSearch] = React.useState('')
  const [business, setBusiness] = React.useState('all')
  const [category, setCategory] = React.useState('all')

  const query = useQuery(() => dce.auditLogs({ limit: 400 }), [])

  const businesses = React.useMemo(() => {
    const set = new Set((query.data ?? []).map((r) => r.business_name).filter(Boolean))
    return [...set].sort()
  }, [query.data])

  const categories = React.useMemo(() => {
    const set = new Set((query.data ?? []).map((r) => r.category).filter(Boolean))
    return [...set].sort()
  }, [query.data])

  const rows = React.useMemo(() => {
    let list = query.data ?? []
    if (business !== 'all') list = list.filter((r) => r.business_name === business)
    if (category !== 'all') list = list.filter((r) => r.category === category)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter((r) => `${r.event_text ?? ''} ${r.actor ?? ''}`.toLowerCase().includes(q))
    }
    return list
  }, [query.data, business, category, search])

  const days = React.useMemo(() => groupByDay(rows), [rows])

  return (
    <Page>
      <PageHeader
        title="Activity"
        description="What changed, where, and who did it"
        actions={
          <Button
            variant="outline"
            disabled={rows.length === 0}
            onClick={() => {
              downloadCsv(
                'activity',
                rows.map((r) => ({
                  at: r.inserted_at,
                  business: r.business_name ?? '',
                  category: r.category ?? '',
                  actor: r.actor ?? '',
                  event: r.event_text,
                }))
              )
              toast.success('Exported')
            }}
          >
            <Download aria-hidden="true" />
            Export
          </Button>
        }
      />

      <PageBody className="space-y-4">
        <SectionCard flush>
          <div className="px-4 pt-4 sm:px-5">
            <Toolbar>
              <SearchInput value={search} onChange={setSearch} placeholder="Search events…" />
              <FilterSelect
                label="Business"
                value={business}
                onChange={setBusiness}
                options={[
                  { value: 'all', label: 'All businesses' },
                  ...businesses.map((b) => ({ value: b, label: b })),
                ]}
              />
              <FilterSelect
                label="Category"
                value={category}
                onChange={setCategory}
                options={[
                  { value: 'all', label: 'All categories' },
                  ...categories.map((c) => ({ value: c, label: c })),
                ]}
              />
              <ToolbarSpacer />
              <p className="text-[13px] text-muted-foreground">
                {rows.length} {rows.length === 1 ? 'event' : 'events'}
              </p>
            </Toolbar>
          </div>

          <AsyncView
            query={query}
            skeletonProps={{ columns: 4 }}
            empty={{
              icon: Activity,
              title: 'No activity recorded',
              description:
                'Events appear here as notes, spends, files, meetings and decisions change across the workspace.',
            }}
          >
            {() =>
              rows.length === 0 ? (
                <EmptyState compact icon={Activity} title="No events match these filters" />
              ) : (
                <div className="divide-y divide-border">
                  {days.map(([day, events]) => (
                    <section key={day}>
                      <header className="sticky top-14 z-10 flex items-center justify-between gap-2 border-b border-border bg-muted/70 px-4 py-1.5 backdrop-blur sm:px-5">
                        <h2 className="text-[13px] font-medium">{day === 'unknown' ? 'Undated' : date(day)}</h2>
                        <span className="text-xs text-muted-foreground">
                          {events.length} {events.length === 1 ? 'event' : 'events'}
                        </span>
                      </header>
                      <ul>
                        {events.map((e) => (
                          <li
                            key={e.id}
                            className="flex items-start gap-3 border-b border-border px-4 py-2.5 last:border-0 sm:px-5"
                          >
                            <span
                              className="mt-1.5 size-1.5 shrink-0 rounded-full bg-border"
                              aria-hidden="true"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-[13px]">{e.event_text}</p>
                              <p className="mt-0.5 text-xs text-muted-foreground">
                                {e.business_name && <span>{e.business_name} · </span>}
                                {e.actor && <span>{e.actor} · </span>}
                                <span title={dateTime(e.inserted_at)}>{relativeTime(e.inserted_at)}</span>
                              </p>
                            </div>
                            {e.category && (
                              <Badge size="sm" className="shrink-0">
                                {e.category}
                              </Badge>
                            )}
                          </li>
                        ))}
                      </ul>
                    </section>
                  ))}
                </div>
              )
            }
          </AsyncView>
        </SectionCard>
      </PageBody>
    </Page>
  )
}
