import React from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import SiteHeader from './SiteHeader'
import SiteFooter from './SiteFooter'

/* =====================================================================
   SiteLayout — the public site frame.

   Every marketing page previously imported its own header and footer and set
   its own wrapper classes, so scroll behaviour, top padding and the theme
   scope differed page to page (`bge-site` on some, `exflow-site` on the
   homepage, plain `bg-slate-50` on the lead-gen pages).

   One layout means one theme scope, one header offset, and scroll-to-top on
   navigation — which none of the pages did before, so moving from a long
   Portfolio page to Contact left you halfway down the new page.
   ===================================================================== */

export default function SiteLayout() {
  const location = useLocation()
  const isHome = location.pathname === '/'

  React.useEffect(() => {
    // Preserve in-page anchor navigation; only reset on real page changes.
    if (!location.hash) window.scrollTo({ top: 0 })
  }, [location.pathname, location.hash])

  return (
    <div className="exflow-site flex min-h-screen flex-col bg-[#FAF9F6]">
      <SiteHeader />
      {/* The header is fixed, so content needs the offset. The homepage hero
          is designed to sit under a transparent header, so it opts out. */}
      <main className={isHome ? 'flex-1' : 'flex-1 pt-20 sm:pt-24'}>
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  )
}
