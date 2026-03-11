import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Navbar from './components/Navbar'
import HomePage from './pages/HomePage'
import PartnerPage from './pages/PartnerPage'
import PartnerBenefitsPage from './pages/PartnerBenefitsPage'
import EnquirePage from './pages/EnquirePage'
import WorkBenefitsPage from './pages/WorkBenefitsPage'
import AdminLoginPage from './pages/AdminLoginPage'
import AdminPage from './pages/AdminPage'

function Layout({ children }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
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
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/our-work" element={<Navigate to="/#work" replace />} />
          <Route path="/partner" element={<PartnerPage />} />
          <Route path="/partner-benefits" element={<PartnerBenefitsPage />} />
          <Route path="/enquire" element={<EnquirePage />} />
          <Route path="/work-benefits" element={<WorkBenefitsPage />} />
          <Route path="/admin-login" element={<AdminLoginPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}
