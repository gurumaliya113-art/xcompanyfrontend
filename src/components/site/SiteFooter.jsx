import React from 'react'
import { Link } from 'react-router-dom'
import { Mail, MapPin, Phone } from 'lucide-react'
import { Wordmark } from './OwlLogo'

/* =====================================================================
   SiteFooter — one footer for the entire public site.

   Replaces two footers:

     • ExflowHome's inline `Footer` — dark, good structure, but its Ventures and
       Company columns linked to on-page anchors (#ventures, #model, #why-us)
       that only work on the homepage, and it carried three social icons whose
       href was "#". Three dead links on every page.

     • `PublicFooter` — also dark, with the real contact details, but its entire
       Solutions column pointed to the same /solutions URL five times, and it
       had two more dead "#" links for Privacy Policy and Terms of Service.

   Merged: the real contact information is kept, every link goes somewhere that
   exists, and the dead ones are removed rather than left to rot. Placeholder
   links are worse than no links — they teach visitors that clicking does
   nothing.

   Admin access lives here, not in the primary nav. It is a staff entrance, not
   a marketing destination.
   ===================================================================== */

const COMPANY = [
  { to: '/about', label: 'About Us' },
  { to: '/blogs', label: 'Blogs' },
  { to: '/contact', label: 'Contact' },
  { to: '/partner', label: 'Partner With Us' },
]

const openEnquire = () => window.dispatchEvent(new CustomEvent('open-enquire'))

export default function SiteFooter() {
  return (
    <footer className="bg-[#111111] text-white">
      <div className="mx-auto max-w-7xl px-4 pb-10 pt-16 sm:px-6 md:pt-20">
        <div className="mb-14 grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {/* Brand */}
          <div>
            <Wordmark size={36} dark />
            <p className="mb-6 mt-5 max-w-xs text-sm leading-relaxed text-gray-400">
              We launch, operate and hold stakes in practical businesses — bringing capital, systems and hands-on execution to help them grow.
            </p>
            <button
              type="button"
              onClick={openEnquire}
              className="rounded-full bg-[#F97316] px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-orange-600"
            >
              Start a Conversation
            </button>
          </div>

          {/* Company */}
          <div>
            <h4 className="mb-5 text-base font-bold">Company</h4>
            <ul className="space-y-3 text-sm">
              {COMPANY.map((l) => (
                <li key={l.to + l.label}>
                  <Link to={l.to} className="text-gray-400 transition-colors hover:text-[#F97316]">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="mb-5 text-base font-bold">Reach Us</h4>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start gap-3">
                <Phone className="mt-0.5 size-4 shrink-0 text-[#F97316]" aria-hidden="true" />
                <a href="tel:+918053317489" className="text-gray-400 transition-colors hover:text-[#F97316]">
                  +91 80533 17489
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="mt-0.5 size-4 shrink-0 text-[#F97316]" aria-hidden="true" />
                <a
                  href="mailto:azadgupta1010@gmail.com"
                  className="break-all text-gray-400 transition-colors hover:text-[#F97316]"
                >
                  azadgupta1010@gmail.com
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 size-4 shrink-0 text-[#F97316]" aria-hidden="true" />
                <span className="text-gray-400">Kailash Nagar, Narnaul</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 sm:flex-row">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} excompany. All rights reserved.
          </p>
          <div className="flex items-center gap-5">
            <Link to="/dce" className="text-sm text-gray-500 transition-colors hover:text-gray-300">
              DCE
            </Link>
            <Link to="/admin-login" className="text-sm text-gray-500 transition-colors hover:text-gray-300">
              Staff sign in
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
