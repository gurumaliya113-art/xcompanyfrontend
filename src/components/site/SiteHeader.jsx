import React, { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { Wordmark } from './OwlLogo'

/* =====================================================================
   SiteHeader — one header for the entire public site.

   Before this, the marketing site had THREE headers:

     1. ExflowHome's inline `Header`  — cream/orange, Nunito wordmark, and a nav
        made only of on-page anchors (#ventures, #model, #why-us, #connect)
        plus Admin and DCE. It did not link to /portfolio, /solutions,
        /industries, /about, /blogs or /contact at all — so the homepage was an
        island and six pages were unreachable from the front door.

     2. `PublicHeader` — white/orange, GiOwl from react-icons (a different owl),
        used by Solutions, Industries, About, Blogs, Contact.

     3. `Navbar` — slate, rounded-b-3xl, used by Partner, Enquire, Work Benefits
        and Admin Login. Its labels pointed at the wrong routes: "Solutions"
        went to /partner, "Industries" to /partner-benefits, "About" to
        /work-benefits, and both "Blogs" and "Contact" went to /enquire.

   So depending on the page you were on, the logo changed, the nav changed, and
   half the links lied about where they went.

   This is now the single header. It keeps ExflowHome's visual language (the
   newest and the one the homepage uses) and adds the real page navigation.
   ===================================================================== */

/* ExCompany is a holding company — the public site shows the businesses it
   builds and owns, not individual tech services. Software work (Solutions,
   Industries, project portfolio) belongs to ExFlow, which is one of those
   businesses and will have its own site. */
const NAV = [
  { to: '/about', label: 'About' },
  { to: '/blogs', label: 'Blogs' },
  { to: '/contact', label: 'Contact' },
]

/* Homepage section anchors. Shown only on `/`, where they actually resolve —
   the old header rendered them on every page, so on /about a click on
   "Ventures" did nothing. */
const HOME_SECTIONS = [
  { href: '#ventures', label: 'Ventures' },
  { href: '#model', label: 'Our Model' },
  { href: '#why-us', label: 'Why Us' },
]

const openEnquire = () => window.dispatchEvent(new CustomEvent('open-enquire'))

export default function SiteHeader() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const isHome = location.pathname === '/'

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  // Lock body scroll while the mobile sheet is open.
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  const linkBase =
    'text-sm font-bold uppercase tracking-wider transition-colors'

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled || !isHome
          ? 'border-b border-black/[0.07] bg-white/95 py-3 shadow-sm backdrop-blur-md'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" aria-label="excompany home" className="shrink-0">
          <Wordmark size={scrolled || !isHome ? 36 : 42} />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 lg:flex" aria-label="Main">
          {isHome &&
            HOME_SECTIONS.map((s) => (
              <a key={s.href} href={s.href} className={`${linkBase} text-gray-500 hover:text-black`}>
                {s.label}
              </a>
            ))}
          {isHome && <span className="h-4 w-px bg-black/10" aria-hidden="true" />}
          {/* On inner pages there are no section anchors, so a plain Home link
              is the clear way back — the logo alone was not obvious enough. */}
          {!isHome && (
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `${linkBase} ${isActive ? 'text-[#F97316]' : 'text-gray-600 hover:text-black'}`
              }
            >
              Home
            </NavLink>
          )}
          {NAV.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `${linkBase} ${isActive ? 'text-[#F97316]' : 'text-gray-600 hover:text-black'}`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openEnquire}
            className="hidden rounded-full bg-[#F97316] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-orange-600 sm:inline-flex"
          >
            Start a Conversation
          </button>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? 'Close menu' : 'Open menu'}
            className="inline-flex items-center justify-center rounded-full p-2 text-black transition-colors hover:bg-black/5 lg:hidden"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile sheet */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.16 }}
            className="absolute inset-x-0 top-full max-h-[calc(100vh-4rem)] overflow-y-auto border-b border-black/[0.07] bg-white px-4 pb-6 pt-2 shadow-xl lg:hidden"
          >
            <nav className="flex flex-col" aria-label="Main">
              {isHome && (
                <>
                  {HOME_SECTIONS.map((s) => (
                    <a
                      key={s.href}
                      href={s.href}
                      onClick={() => setOpen(false)}
                      className="rounded-xl px-3 py-3 text-base font-bold uppercase tracking-wide text-gray-500"
                    >
                      {s.label}
                    </a>
                  ))}
                  <hr className="my-2 border-black/10" />
                </>
              )}
              {!isHome && (
                <NavLink
                  to="/"
                  end
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `rounded-xl px-3 py-3 text-base font-bold uppercase tracking-wide transition-colors ${
                      isActive ? 'bg-orange-50 text-[#F97316]' : 'text-gray-800 hover:bg-gray-50'
                    }`
                  }
                >
                  Home
                </NavLink>
              )}
              {NAV.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `rounded-xl px-3 py-3 text-base font-bold uppercase tracking-wide transition-colors ${
                      isActive ? 'bg-orange-50 text-[#F97316]' : 'text-gray-800 hover:bg-gray-50'
                    }`
                  }
                >
                  {l.label}
                </NavLink>
              ))}
              <button
                type="button"
                onClick={() => {
                  setOpen(false)
                  openEnquire()
                }}
                className="mt-4 rounded-full bg-[#F97316] py-3.5 text-sm font-bold text-white transition-colors hover:bg-orange-600"
              >
                Start a Conversation
              </button>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
