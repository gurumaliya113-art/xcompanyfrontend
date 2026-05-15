import React, { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Handshake, Search, ArrowRight, Shield, LogIn } from 'lucide-react'
import { GiOwl } from 'react-icons/gi'

const navLinks = [
  { to: '/#work', label: 'Our Work' },
  { to: '/partner', label: 'Solutions' },
  { to: '/partner-benefits', label: 'Industries' },
  { to: '/work-benefits', label: 'About' },
  { to: '/enquire', label: 'Blogs' },
  { to: '/enquire', label: 'Contact' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const ref = useRef(null)

  useEffect(() => { setOpen(false) }, [location.pathname])

  useEffect(() => {
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function handleWorkClick(e) {
    if (location.pathname === '/') {
      e.preventDefault()
      document.getElementById('work')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <nav ref={ref} className="sticky top-0 z-50 rounded-b-3xl border-b border-slate-200 bg-white/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2 text-xl font-bold tracking-tight">
          <GiOwl className="h-7 w-7 text-black" />
          <span className="text-orange-500">excompany</span>
        </Link>

        {/* Desktop */}
        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            link.to === '/#work' ? (
              <Link key={link.to} to="/#work" onClick={handleWorkClick} className="rounded-full px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900">
                {link.label}
              </Link>
            ) : (
              <Link key={link.to} to={link.to} className={`rounded-full px-4 py-2 text-sm font-medium transition hover:bg-slate-100 hover:text-slate-900 ${location.pathname === link.to ? 'bg-slate-100 text-slate-900' : 'text-slate-600'}`}>
                {link.label}
              </Link>
            )
          ))}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <button type="button" onClick={() => window.dispatchEvent(new CustomEvent('open-enquire'))} className="inline-flex items-center justify-center rounded-full bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600">
            Request A Quote
          </button>
        </div>

        {/* Mobile toggle */}
        <button type="button" onClick={() => setOpen(!open)} className="inline-flex items-center justify-center rounded-full p-2 text-slate-600 transition hover:bg-slate-100 md:hidden">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}
            className="border-b border-slate-200 bg-white px-4 pb-4 md:hidden">
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                link.to === '/#work' ? (
                  <Link key={link.to} to="/#work" onClick={handleWorkClick} className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900">
                    {link.label}
                  </Link>
                ) : (
                  <Link key={link.to} to={link.to} className={`rounded-xl px-4 py-2.5 text-sm font-medium transition hover:bg-slate-100 hover:text-slate-900 ${location.pathname === link.to ? 'bg-slate-100 text-slate-900' : 'text-slate-600'}`}>
                    {link.label}
                  </Link>
                )
              ))}
              <hr className="my-2 border-slate-200" />
              <button type="button" onClick={() => { setOpen(false); window.dispatchEvent(new CustomEvent('open-enquire')) }} className="inline-flex items-center justify-center rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white">
                Request A Quote
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
