import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Sparkles, ArrowRight } from 'lucide-react'

const DELAY_MS = 2000

export default function HeeraModal() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    // Show on every page load / refresh
    const t = setTimeout(() => setOpen(true), DELAY_MS)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  function openEnquire() {
    setOpen(false)
    // small delay so the close animation finishes before enquire opens
    setTimeout(() => window.dispatchEvent(new CustomEvent('open-enquire')), 250)
  }

  const bullets = [
    { text: 'We\u2019ll work', strong: 'FREE for the first month' },
    { text: 'If our work helps your business grow \u2192', strong: 'then pay us' },
    { text: 'No results? No value? \u2192', strong: 'You pay \u20B90', tail: '(Just travel & meeting expenses \u2014 minimal)' },
    { text: 'Limited onboarding slots available for', strong: '\u201CHeera\u201D' },
  ]

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="heera-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto"
          onClick={() => setOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="relative my-8 w-full max-w-3xl overflow-hidden rounded-3xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            style={{
              background:
                'radial-gradient(120% 100% at 0% 0%, #2a1405 0%, #1a0a02 45%, #0F0F0F 100%)',
            }}
          >
            {/* Glow accents */}
            <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-orange-500/30 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -left-16 h-80 w-80 rounded-full bg-orange-500/15 blur-3xl" />

            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="absolute right-4 top-4 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/80 backdrop-blur transition hover:bg-white/20 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="relative px-6 py-10 sm:px-10 sm:py-14 md:px-14 md:py-16 text-white">
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="inline-flex items-center gap-2 rounded-full border border-orange-400/40 bg-orange-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-orange-300"
              >
                <Sparkles className="h-3.5 w-3.5" /> Special Onboarding Offer
              </motion.div>

              {/* Big heading */}
              <motion.h2
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18, duration: 0.45 }}
                className="mt-5 text-3xl font-extrabold leading-[1.05] tracking-tight sm:text-4xl md:text-5xl lg:text-6xl"
              >
                <span className="mr-2">🔥</span>
                WAIT... <span className="text-orange-400">YOUR EX MAY CHEAT YOU</span>,
                <br className="hidden sm:block" />
                <span> BUT </span>
                <span className="bg-gradient-to-r from-orange-400 to-yellow-300 bg-clip-text text-transparent">
                  WE WON&apos;T.
                </span>
              </motion.h2>

              {/* Subheading */}
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.28 }}
                className="mt-6 text-lg sm:text-xl md:text-2xl font-semibold text-white/90"
              >
                Meet <span className="text-yellow-300">Heera</span>{' '}
                <span className="inline-block animate-pulse">💎</span> — Our Hero Product
              </motion.p>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.36 }}
                className="mt-2 text-sm sm:text-base text-white/70"
              >
                We&apos;re so confident in our work that:
              </motion.p>

              {/* Bullets */}
              <ul className="mt-6 space-y-3.5">
                {bullets.map((b, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.42 + i * 0.08 }}
                    className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 backdrop-blur"
                  >
                    <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green-500/20 text-green-400 text-base">
                      ✅
                    </span>
                    <span className="text-sm sm:text-base text-white/90 leading-relaxed">
                      {b.text}{' '}
                      <span className="font-extrabold text-orange-300">{b.strong}</span>
                      {b.tail && (
                        <span className="block text-xs sm:text-sm text-white/60 mt-0.5">
                          {b.tail}
                        </span>
                      )}
                    </span>
                  </motion.li>
                ))}
              </ul>

              {/* CTA */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.85 }}
                className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center"
              >
                <button
                  type="button"
                  onClick={openEnquire}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-orange-500 px-8 py-3.5 text-sm font-extrabold text-white shadow-xl shadow-orange-500/40 transition hover:bg-orange-600 sm:text-base"
                >
                  Claim Your Heera Slot <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="text-sm font-medium text-white/60 transition hover:text-white"
                >
                  Maybe later
                </button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
