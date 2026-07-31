import React from 'react'
import { GiOwl } from 'react-icons/gi'

/* The excompany owl.

   Uses the Game Icons owl (`GiOwl`) — the mark the owner picked — rendered in
   brand orange. It fills with `currentColor`, so header, footer and the enquiry
   panel all show the exact same owl; each caller just sets the text colour.

   One definition. Previously the site shipped two different owls (a filled
   geometric SVG and this one), so the brand mark changed depending on the page. */
export default function OwlLogo({ size = 40, className }) {
  return (
    <GiOwl
      size={size}
      className={className}
      role="img"
      aria-label="excompany"
    />
  )
}

/** Logo + wordmark, used in the header and footer. */
export function Wordmark({ size = 40, dark = false, className }) {
  return (
    <span className={`flex items-center gap-2.5 ${className ?? ''}`}>
      <OwlLogo size={size} className="text-[#F97316]" />
      <span
        style={{ fontFamily: "'Nunito', sans-serif" }}
        className="text-xl font-extrabold lowercase tracking-tight text-[#F97316] sm:text-2xl"
      >
        excompany
      </span>
    </span>
  )
}
