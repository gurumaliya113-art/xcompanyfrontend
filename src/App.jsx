import React, { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import EnquireModal from './components/EnquireModal'
import { SessionProvider } from './app/session'
import { consoleRoutes } from './app/routes'
import SiteLayout from './components/site/SiteLayout'

/* Marketing pages stay eagerly loaded — they are the landing experience and
   must paint fast. Everything heavy (DCE, admin) is lazy. */
import ExflowHome from './pages/ExflowHome'
import AboutPage from './pages/AboutPage'
import BlogsPage from './pages/BlogsPage'
import ContactPage from './pages/ContactPage'

const PartnerPage = lazy(() => import('./pages/PartnerPage'))
const PartnerBenefitsPage = lazy(() => import('./pages/PartnerBenefitsPage'))
const EnquirePage = lazy(() => import('./pages/EnquirePage'))
const WorkBenefitsPage = lazy(() => import('./pages/WorkBenefitsPage'))
const AdminLoginPage = lazy(() => import('./pages/AdminLoginPage'))
const AdminPage = lazy(() => import('./pages/AdminPage'))
const DcePage = lazy(() => import('./pages/DcePage'))
const DceDashboard = lazy(() => import('./pages/DceDashboard'))
const DceSimple = lazy(() => import('./pages/DceSimple'))

function RouteFallback() {
  return <div className="min-h-screen bg-[#FAF9F6]" aria-busy="true" />
}

export default function App() {
  return (
    <BrowserRouter>
      {/* One toast configuration for the whole app. Console styling is
          intentionally quieter than the previous 1rem-radius pill. */}
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 3500,
          style: {
            borderRadius: '8px',
            fontSize: '13px',
            padding: '10px 14px',
            background: 'hsl(222 47% 14%)',
            color: '#fff',
            boxShadow: '0 12px 20px -4px rgb(16 24 40 / 0.14)',
          },
        }}
      />
      <EnquireModal />

      <SessionProvider>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            {/* ---------- Public marketing site ----------
                One layout, one header, one footer. Previously three different
                headers and two footers depending on which page you landed on. */}
            <Route element={<SiteLayout />}>
              <Route path="/" element={<ExflowHome />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/blogs" element={<BlogsPage />} />
              <Route path="/contact" element={<ContactPage />} />

              {/* Lead-gen pages — rebuilt on the shared marketing primitives,
                  so they now own their own full-width sections like every
                  other page rather than depending on a wrapper for width. */}
              <Route path="/partner" element={<PartnerPage />} />
              <Route path="/partner-benefits" element={<PartnerBenefitsPage />} />
              <Route path="/enquire" element={<EnquirePage />} />
              <Route path="/work-benefits" element={<WorkBenefitsPage />} />

              {/* Retired duplicates. Three homepages were publicly reachable
                  (`/`, `/home-new`, `/home-old`), which meant three different
                  first impressions and three sets of copy to keep in sync. */}
              <Route path="/home-new" element={<Navigate to="/" replace />} />
              <Route path="/home-old" element={<Navigate to="/" replace />} />

              {/* Software services live with ExFlow (its own site, WIP), not on
                  the ExCompany holding site. Old paths redirect home so any
                  existing links or bookmarks still resolve. */}
              <Route path="/our-work" element={<Navigate to="/" replace />} />
              <Route path="/portfolio" element={<Navigate to="/" replace />} />
              <Route path="/solutions" element={<Navigate to="/" replace />} />
              <Route path="/industries" element={<Navigate to="/" replace />} />
            </Route>

            {/* ---------- ExFlow console ---------- */}
            {consoleRoutes()}

            {/* DCE product landing has its own chrome; the dashboards keep
                their passcode gate until they retire in favour of /app. */}
            <Route path="/dce" element={<DcePage />} />
            <Route path="/dce/dashboard" element={<DceSimple />} />
            <Route path="/dce/dashboard-full" element={<DceDashboard />} />

            {/* ---------- Staff entry ---------- */}
            <Route path="/admin-login" element={<AdminLoginPage />} />
            <Route path="/admin" element={<Navigate to="/app/overview" replace />} />
            <Route path="/admin/legacy" element={<AdminPage />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </SessionProvider>
    </BrowserRouter>
  )
}
