import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { GiOwl } from 'react-icons/gi'

const links = [
  { to: '/portfolio', label: 'Our Work' },
  { to: '/solutions', label: 'Solutions' },
  { to: '/industries', label: 'Industries' },
  { to: '/about', label: 'About' },
  { to: '/blogs', label: 'Blogs' },
  { to: '/contact', label: 'Contact' },
  { to: '/admin-login', label: 'Admin' },
]

const openEnquire = () =>
  window.dispatchEvent(new CustomEvent('open-enquire'))

export default function PublicHeader() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => { setOpen(false) }, [location.pathname])

  return (
    <header
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled ? 'bg-white shadow-sm py-3' : 'bg-white py-5 border-b border-gray-100'
      }`}
    >
      <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group" onClick={() => setOpen(false)}>
          <GiOwl className="w-8 h-8 text-black group-hover:text-orange-500 transition-colors" />
          <span className="text-xl font-bold text-orange-500">excompany</span>
        </Link>

        <nav className="hidden md:flex items-center gap-7">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={`text-sm font-medium transition-colors ${
                location.pathname === l.to ? 'text-orange-500' : 'text-gray-700 hover:text-orange-500'
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          onClick={openEnquire}
          className="hidden md:inline-flex bg-orange-500 hover:bg-orange-600 text-white rounded-full px-6 py-2.5 text-sm font-bold transition-colors"
        >
          Request A Quote
        </button>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
          className="md:hidden inline-flex items-center justify-center rounded-full p-2 text-gray-700 hover:bg-gray-100"
        >
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="md:hidden border-t border-gray-100 bg-white px-4 pb-5 pt-2 shadow-lg"
          >
            <nav className="flex flex-col">
              {links.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  onClick={() => setOpen(false)}
                  className={`rounded-xl px-3 py-3 text-base font-medium transition-colors ${
                    location.pathname === l.to
                      ? 'bg-orange-50 text-orange-600'
                      : 'text-gray-800 hover:bg-gray-50 hover:text-orange-500'
                  }`}
                >
                  {l.label}
                </Link>
              ))}
              <button
                type="button"
                onClick={() => { setOpen(false); openEnquire() }}
                className="mt-3 bg-orange-500 hover:bg-orange-600 text-white rounded-full py-3 font-bold text-sm"
              >
                Request A Quote
              </button>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
