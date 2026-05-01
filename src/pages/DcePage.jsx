import React from 'react'
import Navigation from '../components/landing/Navigation'
import Hero from '../components/landing/Hero'
import DashboardMockup from '../components/landing/DashboardMockup'
import LogoCloud from '../components/landing/LogoCloud'
import Workflow from '../components/landing/Workflow'
import Features from '../components/landing/Features'
import Security from '../components/landing/Security'
import Roles from '../components/landing/Roles'
import Metrics from '../components/landing/Metrics'
import Testimonials from '../components/landing/Testimonials'
import Pricing from '../components/landing/Pricing'
import FAQ from '../components/landing/FAQ'
import CTA from '../components/landing/CTA'
import Footer from '../components/landing/Footer'

export default function DcePage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <Hero />
      <DashboardMockup />
      <LogoCloud />
      <Workflow />
      <Features />
      <Security />
      <Roles />
      <Metrics />
      <Testimonials />
      <Pricing />
      <FAQ />
      <CTA />
      <Footer />
    </div>
  )
}