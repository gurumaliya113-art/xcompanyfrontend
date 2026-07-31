import React, { Suspense, lazy } from 'react'
import { Navigate, Route } from 'react-router-dom'
import AppShell from './AppShell'
import { RequireSession } from './session'
import { WorkspaceProvider } from './workspace'
import { Spinner } from '@/components/ui/states'

/* =====================================================================
   Console routes.

   Every console screen is lazy-loaded, so the marketing site's bundle does
   not carry the ERP and vice versa. The previous setup shipped one bundle
   containing both DCE dashboards (3,800 lines of TSX) to every visitor
   landing on the homepage.

   Every sidebar destination now resolves to a real React screen. Legacy paths
   that were merged elsewhere (ops/meetings, ops/documents) redirect rather
   than 404, so old links and bookmarks still work.
   ===================================================================== */

const OverviewPage = lazy(() => import('@/modules/overview/OverviewPage'))
const ProjectsPage = lazy(() => import('@/modules/projects/ProjectsPage'))
const ProjectDetailPage = lazy(() => import('@/modules/projects/ProjectDetailPage'))
const PoolPage = lazy(() => import('@/modules/finance/PoolPage'))
const StatementsPage = lazy(() => import('@/modules/finance/StatementsPage'))
const PoolRequestsPage = lazy(() => import('@/modules/finance/PoolRequestsPage'))
const AssetsPage = lazy(() => import('@/modules/finance/AssetsPage'))
const InvestorsPage = lazy(() => import('@/modules/finance/InvestorsPage'))
const PeoplePage = lazy(() => import('@/modules/team/PeoplePage'))
const PersonDetailPage = lazy(() => import('@/modules/team/PersonDetailPage'))
const DailyEntryPage = lazy(() => import('@/modules/ops/DailyEntryPage'))
const OpsReportsPage = lazy(() => import('@/modules/ops/ReportsPage'))
const TasksPage = lazy(() => import('@/modules/ops/TasksPage'))
const AssistantPage = lazy(() => import('@/modules/ai/AssistantPage'))
const DceWorkspacePage = lazy(() => import('@/modules/products/DceWorkspacePage'))
const MeeshoPage = lazy(() => import('@/modules/products/MeeshoPage'))
const DecisionsPage = lazy(() => import('@/modules/ops/DecisionsPage'))
const EquityPage = lazy(() => import('@/modules/finance/EquityPage'))
const ActivityPage = lazy(() => import('@/modules/workspace/ActivityPage'))
const AccessPage = lazy(() => import('@/modules/team/AccessPage'))
const ReportCentrePage = lazy(() => import('@/modules/reports/ReportCentrePage'))
const OrganisationSettingsPage = lazy(() => import('@/modules/settings/SettingsPage'))
const LayersSettingsPage = lazy(() =>
  import('@/modules/settings/SettingsPage').then((m) => ({ default: m.LayersSettingsPage }))
)
const NotificationsSettingsPage = lazy(() =>
  import('@/modules/settings/SettingsPage').then((m) => ({ default: m.NotificationsSettingsPage }))
)

const EnquiriesPage = lazy(() =>
  import('@/modules/clients/ClientsPage').then((m) => ({ default: m.EnquiriesPage }))
)
const PartnersPage = lazy(() =>
  import('@/modules/clients/ClientsPage').then((m) => ({ default: m.PartnersPage }))
)

function PageFallback() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center gap-2 text-sm text-muted-foreground">
      <Spinner />
      Loading…
    </div>
  )
}

function Screen({ children }) {
  return <Suspense fallback={<PageFallback />}>{children}</Suspense>
}

/* Role gating lives in navigation.js and is applied by the sidebar and command
   palette. Routes stay open so a deep link never dead-ends for someone whose
   role was resolved slightly differently — the data layer, not the router, is
   where access has to be enforced. */

/** All console routes, mounted under /app. */
export function consoleRoutes() {
  return (
    <Route
      path="/app"
      element={
        <RequireSession>
          <WorkspaceProvider>
            <AppShell />
          </WorkspaceProvider>
        </RequireSession>
      }
    >
      <Route index element={<Navigate to="/app/overview" replace />} />

      {/* Workspace */}
      <Route path="overview" element={<Screen><OverviewPage /></Screen>} />
      <Route path="activity" element={<Screen><ActivityPage /></Screen>} />

      {/* Clients */}
      <Route path="clients" element={<Navigate to="/app/clients/enquiries" replace />} />
      <Route path="clients/enquiries" element={<Screen><EnquiriesPage /></Screen>} />
      <Route path="clients/partners" element={<Screen><PartnersPage /></Screen>} />

      {/* Projects */}
      <Route path="projects" element={<Screen><ProjectsPage /></Screen>} />
      <Route path="projects/:id" element={<Screen><ProjectDetailPage /></Screen>} />

      {/* Products */}
      <Route path="products" element={<Navigate to="/app/products/dce" replace />} />
      <Route path="products/dce" element={<Screen><DceWorkspacePage /></Screen>} />
      <Route path="products/meesho" element={<Screen><MeeshoPage /></Screen>} />

      {/* Operations */}
      <Route path="ops" element={<Navigate to="/app/ops/daily-entry" replace />} />
      <Route path="ops/daily-entry" element={<Screen><DailyEntryPage /></Screen>} />
      <Route path="ops/reports" element={<Screen><OpsReportsPage /></Screen>} />
      <Route path="ops/tasks" element={<Screen><TasksPage /></Screen>} />
      <Route path="ops/decisions" element={<Screen><DecisionsPage /></Screen>} />
      {/* Meetings and documents are per-business tabs in the DCE workspace.
          These paths are kept so older links and bookmarks still resolve. */}
      <Route path="ops/meetings" element={<Navigate to="/app/products/dce?tab=meetings" replace />} />
      <Route path="ops/documents" element={<Navigate to="/app/products/dce?tab=files" replace />} />

      {/* Finance */}
      <Route path="finance" element={<Navigate to="/app/finance/pool" replace />} />
      <Route path="finance/pool" element={<Screen><PoolPage /></Screen>} />
      <Route path="finance/statements" element={<Screen><StatementsPage /></Screen>} />
      <Route path="finance/requests" element={<Screen><PoolRequestsPage /></Screen>} />
      <Route path="finance/assets" element={<Screen><AssetsPage /></Screen>} />
      <Route path="finance/equity" element={<Screen><EquityPage /></Screen>} />
      <Route path="finance/investors" element={<Screen><InvestorsPage /></Screen>} />

      {/* Team — `access` is declared before `:id` so it is not swallowed by it. */}
      <Route path="team" element={<Screen><PeoplePage /></Screen>} />
      <Route path="team/access" element={<Screen><AccessPage /></Screen>} />
      <Route path="team/:id" element={<Screen><PersonDetailPage /></Screen>} />

      {/* AI */}
      <Route path="ai" element={<Screen><AssistantPage /></Screen>} />

      {/* Reports */}
      <Route path="reports" element={<Screen><ReportCentrePage /></Screen>} />

      {/* Settings */}
      <Route path="settings" element={<Screen><OrganisationSettingsPage /></Screen>} />
      <Route path="settings/layers" element={<Screen><LayersSettingsPage /></Screen>} />
      <Route path="settings/notifications" element={<Screen><NotificationsSettingsPage /></Screen>} />

      {/* Unknown console path — stay in the console, don't bounce to marketing. */}
      <Route path="*" element={<Navigate to="/app/overview" replace />} />
    </Route>
  )
}
