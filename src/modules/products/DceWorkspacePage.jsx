import * as React from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Bot, CalendarClock, FileText, StickyNote, Wallet } from 'lucide-react'
import { Page, PageHeader, PageBody, SearchInput } from '@/components/patterns/Page'
import { Tabs } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { EmptyState, Spinner } from '@/components/ui/states'
import { SectionCard } from '@/components/patterns/SectionCard'
import { useWorkspace, BusinessPicker } from '@/app/workspace'
import NotesTab from './dce/NotesTab'
import SpendsTab from './dce/SpendsTab'
import FilesTab from './dce/FilesTab'
import MeetingsTab from './dce/MeetingsTab'

/* =====================================================================
   DCE Workspace — one command centre per business.

   This replaces two dashboards that had drifted apart:

     /dce/dashboard        1,078 lines. Mobile-first, cream and black, its own
                           passcode plus WebAuthn gate, 5 tabs.
     /dce/dashboard-full   2,721 lines. Desktop, 10 tabs, different colours,
                           different form field sets for the same tables,
                           different passcode default ('1234' vs '123456').

     Both read and wrote the same dce_* tables, so the same business had two
     inconsistent front ends. A note created on mobile could not be given a
     reminder; a document uploaded on desktop had fields mobile could not show.

   Consolidation:
     Notes · Money · Files · Meetings   stay here — they are per-business, and
                                        you use them together
     Decisions · Voting · Audit Log     moved to Operations, because those are
                                        governance activities, not day-to-day
                                        workspace items
     X-Ai                               promoted to its own top-level page
     Overview                           folded into the console Overview

   The passcode gate is gone: this now lives behind the console's session, so
   there is one way in rather than a client-side string comparison with a
   hardcoded fallback. Search is shared across all four tabs.
   ===================================================================== */

const TABS = [
  { value: 'notes', label: 'Notes', icon: StickyNote },
  { value: 'money', label: 'Money', icon: Wallet },
  { value: 'files', label: 'Files', icon: FileText },
  { value: 'meetings', label: 'Meetings', icon: CalendarClock },
]

const PLACEHOLDER = {
  notes: 'Search notes and checklists…',
  money: 'Search spends…',
  files: 'Search files…',
  meetings: 'Search meetings…',
}

export default function DceWorkspacePage() {
  const { business, loading } = useWorkspace()
  const [params, setParams] = useSearchParams()
  const [search, setSearch] = React.useState('')

  const tab = TABS.some((t) => t.value === params.get('tab')) ? params.get('tab') : 'notes'

  function setTab(next) {
    setSearch('')
    setParams((prev) => {
      const p = new URLSearchParams(prev)
      p.set('tab', next)
      return p
    })
  }

  return (
    <Page>
      <PageHeader
        title="DCE Workspace"
        description={
          business
            ? `Notes, money, files and meetings for ${business.name}`
            : 'Everything that belongs to one business, in one place'
        }
        actions={
          <>
            <Button variant="outline" asChild>
              <Link to="/app/ai">
                <Bot aria-hidden="true" />
                Ask X-Ai
              </Link>
            </Button>
            <BusinessPicker />
          </>
        }
      >
        <div className="flex flex-wrap items-end justify-between gap-3">
          <Tabs value={tab} onChange={setTab} tabs={TABS} className="border-0" />
          <div className="w-full pb-2 sm:w-auto sm:min-w-[240px]">
            <SearchInput value={search} onChange={setSearch} placeholder={PLACEHOLDER[tab]} className="sm:max-w-none" />
          </div>
        </div>
      </PageHeader>

      <PageBody>
        {loading ? (
          <div className="flex items-center gap-2 py-16 text-sm text-muted-foreground">
            <Spinner />
            Loading workspace…
          </div>
        ) : !business ? (
          <SectionCard>
            <EmptyState
              icon={StickyNote}
              title="No business selected"
              description="Create a project first — the DCE workspace is scoped to one business at a time."
              action={
                <Button asChild>
                  <Link to="/app/projects?new=1">Add a project</Link>
                </Button>
              }
            />
          </SectionCard>
        ) : (
          <>
            {tab === 'notes' && <NotesTab business={business} search={search} />}
            {tab === 'money' && <SpendsTab business={business} search={search} />}
            {tab === 'files' && <FilesTab business={business} search={search} />}
            {tab === 'meetings' && <MeetingsTab business={business} search={search} />}
          </>
        )}
      </PageBody>
    </Page>
  )
}
