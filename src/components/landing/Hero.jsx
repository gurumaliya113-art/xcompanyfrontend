import React from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, ChevronRight, ShieldCheck, Lock, Zap } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import DashboardMockup from './DashboardMockup'

export default function Hero() {
  const navigate = useNavigate()

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
      {/* Background glows */}
      <div className="absolute inset-0 pointer-events-none -z-10">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute top-1/4 -right-1/4 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[100px]" />
      </div>

      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-4xl mx-auto text-center mb-16"
        >
          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted border border-border/50 text-sm font-medium mb-8"
          >
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            DCE Platform 2.0 is now available
          </motion.div>

          {/* H1 */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="text-5xl md:text-7xl font-bold tracking-tight mb-6"
            style={{ fontFamily: 'var(--app-font-serif)' }}
          >
            The digital nervous system for{' '}
            <span className="italic text-primary">serious organizations</span>
          </motion.h1>

          {/* Subhead */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8"
          >
            A single source of truth that securely manages all critical business data, documents, financials, and operational insights. Eliminate scattered spreadsheets and partner-access chaos.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
          >
            <button
              onClick={() => scrollToSection('contact')}
              className="flex items-center justify-center gap-2 h-14 px-8 rounded-full bg-primary text-primary-foreground font-semibold shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all duration-200 group"
            >
              Request a Demo
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </button>
            <button
              onClick={() => navigate('/dce/dashboard')}
              className="flex items-center justify-center gap-2 h-14 px-8 rounded-full bg-background/50 backdrop-blur-sm border border-border text-foreground font-semibold hover:bg-background/80 transition-all duration-200 group"
            >
              Explore the Platform
              <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </button>
          </motion.div>

          {/* Trust strip */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center justify-center gap-6 text-sm text-muted-foreground"
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" />
              Bank-grade encryption
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-primary" />
              Role-based access
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              Real-time sync
            </div>
          </motion.div>
        </motion.div>

        {/* Dashboard Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto max-w-6xl z-10"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background rounded-3xl blur-2xl -z-10" />
          <DashboardMockup />
        </motion.div>
      </div>
    </section>
  )
}