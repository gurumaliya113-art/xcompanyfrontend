import React from 'react'
import { motion } from 'framer-motion'
import {
  Phone, Mail, MapPin, ArrowRight, Send, Code2, Globe, Sparkles, Workflow, Truck, Utensils, Building2,
} from 'lucide-react'
import PublicHeader from '../components/PublicHeader'
import PublicFooter from '../components/PublicFooter'

const openEnquire = () =>
  window.dispatchEvent(new CustomEvent('open-enquire'))

const services = [
  { icon: Code2, label: 'Custom Software Development' },
  { icon: Globe, label: 'Website Development' },
  { icon: Sparkles, label: 'AI Solutions' },
  { icon: Workflow, label: 'Business Automation' },
  { icon: Truck, label: 'Fleet Management Systems' },
  { icon: Utensils, label: 'Restaurant Management Systems' },
  { icon: Building2, label: 'Industry-Specific Platforms' },
]

export default function ContactPage() {
  return (
    <div className="bge-site flex flex-col min-h-screen bg-white">
      <PublicHeader />

      <main className="flex-grow pt-24">
        {/* Hero */}
        <section className="bg-warm-cream bg-grid-pattern py-20 md:py-28 relative overflow-hidden">
          <div className="container mx-auto px-4 md:px-6 relative z-10 text-center max-w-4xl">
            <motion.p
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-orange-600 mb-6"
            >
              <Send className="h-3.5 w-3.5" /> Get In Touch
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-black tracking-tight leading-[1.1] mb-6"
            >
              Let's Build Something <span className="text-orange-500">Great Together.</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="text-lg md:text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto"
            >
              Need software, AI solutions, websites, automation systems, or custom digital products? Contact excompany.
            </motion.p>
          </div>
        </section>

        {/* Contact details + form CTA */}
        <section className="bg-white py-20 md:py-24">
          <div className="container mx-auto px-4 md:px-6 max-w-6xl">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Contact info card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="relative overflow-hidden bg-gradient-to-br from-[#1a0a02] via-[#2a1405] to-[#0F0F0F] text-white rounded-3xl p-8 md:p-10"
              >
                <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-orange-500/20 blur-3xl" />
                <div className="relative">
                  <h2 className="text-2xl md:text-3xl font-extrabold mb-8">Reach Us Directly</h2>

                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-orange-500/20 text-orange-400">
                        <Mail className="h-5 w-5" />
                      </span>
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Email</div>
                        <a href="mailto:business.gurutron@gmail.com" className="text-base md:text-lg font-semibold hover:text-orange-400 transition-colors break-all">
                          business.gurutron@gmail.com
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-orange-500/20 text-orange-400">
                        <Phone className="h-5 w-5" />
                      </span>
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Phone</div>
                        <a href="tel:+918053317489" className="text-base md:text-lg font-semibold hover:text-orange-400 transition-colors">
                          +91 80533 17489
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-orange-500/20 text-orange-400">
                        <Globe className="h-5 w-5" />
                      </span>
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Website</div>
                        <a href="https://excompany.in" target="_blank" rel="noopener noreferrer" className="text-base md:text-lg font-semibold hover:text-orange-400 transition-colors">
                          excompany.in
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-orange-500/20 text-orange-400">
                        <MapPin className="h-5 w-5" />
                      </span>
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Office</div>
                        <p className="text-base md:text-lg font-semibold">Kailash Nagar, Narnaul</p>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={openEnquire}
                    className="mt-10 inline-flex w-full items-center justify-center gap-2 rounded-full bg-orange-500 hover:bg-orange-600 text-white px-8 py-3.5 text-base font-bold transition-colors shadow-xl shadow-orange-500/30"
                  >
                    Open Enquiry Form <ArrowRight className="h-5 w-5" />
                  </button>
                </div>
              </motion.div>

              {/* Services */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="bg-gray-50 border border-gray-100 rounded-3xl p-8 md:p-10"
              >
                <p className="text-sm font-bold uppercase tracking-widest text-orange-500 mb-2">What We Build</p>
                <h2 className="text-2xl md:text-3xl font-extrabold text-black mb-8">Services Available</h2>

                <ul className="space-y-3">
                  {services.map((s, i) => {
                    const Icon = s.icon
                    return (
                      <motion.li
                        key={s.label}
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.15 + i * 0.04 }}
                        className="flex items-center gap-4 bg-white border border-gray-100 rounded-xl px-4 py-3.5 hover:border-orange-200 hover:shadow-sm transition-all"
                      >
                        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-500/10 text-orange-500">
                          <Icon className="h-5 w-5" />
                        </span>
                        <span className="text-sm md:text-base font-semibold text-gray-800">{s.label}</span>
                      </motion.li>
                    )
                  })}
                </ul>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="bg-gradient-to-br from-orange-50 to-amber-50 py-20 border-t border-orange-100">
          <div className="container mx-auto px-4 md:px-6 max-w-3xl text-center">
            <h2 className="text-3xl md:text-4xl font-extrabold text-black mb-4">
              Partner with <span className="text-orange-500">excompany</span> to build technology designed for growth.
            </h2>
            <p className="text-gray-600 text-lg mb-8">
              Tell us about your project. We respond within 24 hours.
            </p>
            <button
              type="button"
              onClick={openEnquire}
              className="inline-flex items-center gap-2 rounded-full bg-orange-500 hover:bg-orange-600 text-white px-10 py-4 text-base font-bold transition-colors shadow-xl shadow-orange-500/30"
            >
              Request A Quote <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  )
}
