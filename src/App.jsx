import React from 'react'
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Navbar from './components/Navbar'
import EnquireModal from './components/EnquireModal'
import HomePage from './pages/HomePage'
import NewHomePage from './pages/NewHomePage'
import ExflowHome from './pages/ExflowHome'
import PortfolioPage from './pages/PortfolioPage'
import SolutionsPage from './pages/SolutionsPage'
import IndustriesPage from './pages/IndustriesPage'
import AboutPage from './pages/AboutPage'
import BlogsPage from './pages/BlogsPage'
import ContactPage from './pages/ContactPage'
import PartnerPage from './pages/PartnerPage'
import PartnerBenefitsPage from './pages/PartnerBenefitsPage'
import EnquirePage from './pages/EnquirePage'
import WorkBenefitsPage from './pages/WorkBenefitsPage'
import AdminLoginPage from './pages/AdminLoginPage'
import AdminPage from './pages/AdminPage'
import DcePage from './pages/DcePage'
import DceDashboard from './pages/DceDashboard'
import DceSimple from './pages/DceSimple'

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
      <Routes>
        {/* New public site (own navbar/footer, no Layout wrapper) */}
        <Route path="/" element={<ExflowHome />} />
        <Route path="/home-new" element={<NewHomePage />} />
        <Route path="/portfolio" element={<PortfolioPage />} />
        <Route path="/solutions" element={<SolutionsPage />} />
        <Route path="/industries" element={<IndustriesPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/blogs" element={<BlogsPage />} />
        <Route path="/contact" element={<ContactPage />} />

        {/* DCE (own chrome) */}
        <Route path="/dce" element={<DcePage />} />
        {/* Simple, mobile-first WhatsApp-style app is now the default dashboard */}
        <Route path="/dce/dashboard" element={<DceSimple />} />
        {/* Full feature-rich dashboard kept available here */}
        <Route path="/dce/dashboard-full" element={<DceDashboard />} />

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
