import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Shield, Menu, X, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
    setIsMobileMenuOpen(false)
  }

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 h-20 transition-all duration-300 ${
        isScrolled ? 'bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-sm' : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto px-4 md:px-6 h-full flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="text-lg font-bold tracking-tight">DCE</div>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-6">
          <button
            onClick={() => scrollToSection('features')}
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Platform
          </button>
          <button
            onClick={() => scrollToSection('security')}
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Security
          </button>
          <button
            onClick={() => scrollToSection('roles')}
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Roles
          </button>
          <button
            onClick={() => scrollToSection('pricing')}
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Pricing
          </button>
        </nav>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-4">
          <button
            onClick={() => scrollToSection('contact')}
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Sign In
          </button>
          <button
            onClick={() => scrollToSection('contact')}
            className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg hover:bg-primary/90 transition-all duration-200 group"
          >
            Request Demo
            <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden p-2 text-muted-foreground hover:text-foreground"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="md:hidden bg-background/95 backdrop-blur-xl border-b border-border/50"
        >
          <div className="container mx-auto px-4 py-6 space-y-4">
            <button
              onClick={() => scrollToSection('features')}
              className="block w-full text-left text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2"
            >
              Platform
            </button>
            <button
              onClick={() => scrollToSection('security')}
              className="block w-full text-left text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2"
            >
              Security
            </button>
            <button
              onClick={() => scrollToSection('roles')}
              className="block w-full text-left text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2"
            >
              Roles
            </button>
            <button
              onClick={() => scrollToSection('pricing')}
              className="block w-full text-left text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2"
            >
              Pricing
            </button>
            <div className="pt-4 border-t border-border/50">
              <button
                onClick={() => scrollToSection('contact')}
                className="block w-full text-left text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2"
              >
                Sign In
              </button>
              <button
                onClick={() => scrollToSection('contact')}
                className="w-full flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg hover:bg-primary/90 transition-all duration-200 group mt-4"
              >
                Request Demo
                <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </motion.header>
  )
}