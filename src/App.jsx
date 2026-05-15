import React from 'react'
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Navbar from './components/Navbar'
import EnquireModal from './components/EnquireModal'
import HeeraModal from './components/HeeraModal'
import HomePage from './pages/HomePage'
import NewHomePage from './pages/NewHomePage'
import PortfolioPage from './pages/PortfolioPage'
import PartnerPage from './pages/PartnerPage'
import PartnerBenefitsPage from './pages/PartnerBenefitsPage'
import EnquirePage from './pages/EnquirePage'
import WorkBenefitsPage from './pages/WorkBenefitsPage'
import AdminLoginPage from './pages/AdminLoginPage'
import AdminPage from './pages/AdminPage'
import DcePage from './pages/DcePage'
import DceDashboard from './pages/DceDashboard'

function Layout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>
      <footer className="border-t border-slate-200 bg-white py-8 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} The X Company. All rights reserved.
      </footer>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{ style: { borderRadius: '1rem', fontSize: '14px' } }} />
      <EnquireModal />
      <HeeraModal />
      <Routes>
        {/* New public site (own navbar/footer, no Layout wrapper) */}
        <Route path="/" element={<NewHomePage />} />
        <Route path="/portfolio" element={<PortfolioPage />} />

        {/* DCE (own chrome) */}
        <Route path="/dce" element={<DcePage />} />
        <Route path="/dce/dashboard" element={<DceDashboard />} />

        {/* Legacy pages under shared Layout — admin login keeps everything after it working as-is */}
        <Route element={<Layout />}>
          <Route path="/home-old" element={<HomePage />} />
          <Route path="/our-work" element={<Navigate to="/portfolio" replace />} />
          <Route path="/partner" element={<PartnerPage />} />
          <Route path="/partner-benefits" element={<PartnerBenefitsPage />} />
          <Route path="/enquire" element={<EnquirePage />} />
          <Route path="/work-benefits" element={<WorkBenefitsPage />} />
          <Route path="/admin-login" element={<AdminLoginPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
