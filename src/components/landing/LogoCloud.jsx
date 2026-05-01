import React from 'react'
import { motion } from 'framer-motion'

const logos = [
  'VERTIQ',
  'NEXUS CORP',
  'AEON SYSTEMS',
  'LUMINA GLOBAL',
  'OMNI CAPITAL',
  'STRATOS'
]

export default function LogoCloud() {
  return (
    <section className="py-12 border-y border-border/50 bg-muted/20 overflow-hidden relative">
      {/* Edge gradients */}
      <div className="absolute left-0 top-0 bottom-0 w-1/4 bg-gradient-to-r from-background to-transparent z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-1/4 bg-gradient-to-l from-background to-transparent z-10" />

      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-8">
          <p className="text-sm uppercase tracking-widest text-muted-foreground font-medium">
            Trusted by leaders across 50+ enterprise organizations
          </p>
        </div>

        {/* Marquee */}
        <div className="relative overflow-hidden">
          <motion.div
            className="flex gap-12"
            animate={{ x: ['0%', '-50%'] }}
            transition={{
              repeat: Infinity,
              ease: 'linear',
              duration: 30
            }}
            style={{ width: '200%' }}
          >
            {/* First set */}
            {logos.map((logo, index) => (
              <div
                key={`first-${index}`}
                className="flex-shrink-0 text-xl md:text-2xl font-bold tracking-tighter text-muted-foreground/40"
                style={{ fontFamily: 'var(--app-font-serif)' }}
              >
                {logo}
              </div>
            ))}
            {/* Second set for seamless loop */}
            {logos.map((logo, index) => (
              <div
                key={`second-${index}`}
                className="flex-shrink-0 text-xl md:text-2xl font-bold tracking-tighter text-muted-foreground/40"
                style={{ fontFamily: 'var(--app-font-serif)' }}
              >
                {logo}
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}