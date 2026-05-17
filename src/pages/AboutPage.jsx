import React from 'react'
import { motion } from 'framer-motion'
import {
  Target, Zap, TrendingUp, BarChart3, Rocket, Users, ArrowRight, Sparkles,
} from 'lucide-react'
import PublicHeader from '../components/PublicHeader'
import PublicFooter from '../components/PublicFooter'

const openEnquire = () =>
  window.dispatchEvent(new CustomEvent('open-enquire'))

const beliefs = [
  { icon: Target, title: 'Build For Impact', desc: 'Every system we engineer is built to create measurable outcomes.' },
  { icon: Zap, title: 'Solve Operational Problems', desc: 'We focus on real workflows — not surface-level features.' },
  { icon: TrendingUp, title: 'Create Scalable Systems', desc: 'Software that grows with your business, not against it.' },
  { icon: BarChart3, title: 'Measurable Business Outcomes', desc: 'Data-driven design. Results you can actually track.' },
  { icon: Rocket, title: 'Engineer For Growth', desc: 'Products designed from day one to handle scale.' },
]

const founders = [
  { name: 'Azad Gupta', role: 'Co-Founder' },
  { name: 'Mukul Saini', role: 'Co-Founder' },
  { name: 'Amit', role: 'Co-Founder' },
  { name: 'Anubhav', role: 'Co-Founder' },
]

export default function AboutPage() {
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
              <Sparkles className="h-3.5 w-3.5" /> About excompany
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-black tracking-tight leading-[1.1] mb-6"
            >
              Engineered Digital Solutions for <span className="text-orange-500">Real Businesses.</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="text-lg md:text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto"
            >
              excompany is a software development and digital solutions company focused on building systems that help businesses automate operations, improve efficiency, and scale sustainably.
            </motion.p>
          </div>
        </section>

        {/* Philosophy */}
        <section className="bg-white py-20 md:py-24">
          <div className="container mx-auto px-4 md:px-6 max-w-5xl">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <p className="text-sm font-bold uppercase tracking-widest text-orange-500 mb-3">Our Philosophy</p>
                <h2 className="text-3xl md:text-4xl font-extrabold text-black leading-tight mb-6">
                  Technology should <span className="text-orange-500">simplify</span> business operations, not complicate them.
                </h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  The modern business environment demands speed, automation, and better decision making. Companies relying on outdated workflows often face inefficiencies, operational losses, and limited scalability.
                </p>
                <p className="text-gray-600 leading-relaxed">
                  excompany exists to solve those challenges through engineered digital solutions.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100 rounded-3xl p-8"
              >
                <h3 className="text-xl font-bold text-black mb-5 flex items-center gap-2">
                  <Users className="h-5 w-5 text-orange-500" />
                  Who We Work With
                </h3>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start gap-2"><span className="text-orange-500 font-bold">→</span> Startups looking for speed</li>
                  <li className="flex items-start gap-2"><span className="text-orange-500 font-bold">→</span> Local businesses going digital</li>
                  <li className="flex items-start gap-2"><span className="text-orange-500 font-bold">→</span> Enterprises modernizing operations</li>
                  <li className="flex items-start gap-2"><span className="text-orange-500 font-bold">→</span> Industry operators creating sustainable growth</li>
                </ul>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Beliefs */}
        <section className="bg-gray-50 py-20 md:py-24">
          <div className="container mx-auto px-4 md:px-6 max-w-7xl">
            <div className="text-center mb-14">
              <p className="text-sm font-bold uppercase tracking-widest text-orange-500 mb-3">What We Believe</p>
              <h2 className="text-3xl md:text-4xl font-extrabold text-black">
                Principles That Guide Every System We Build
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
              {beliefs.map((b, i) => {
                const Icon = b.icon
                return (
                  <motion.div
                    key={b.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-lg hover:border-orange-200 transition-all"
                  >
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500 mb-4">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-base font-bold text-black mb-2">{b.title}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">{b.desc}</p>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Founders */}
        <section className="bg-white py-20 md:py-24">
          <div className="container mx-auto px-4 md:px-6 max-w-5xl">
            <div className="text-center mb-12">
              <p className="text-sm font-bold uppercase tracking-widest text-orange-500 mb-3">Co-Founded By</p>
              <h2 className="text-3xl md:text-4xl font-extrabold text-black mb-3">
                Builders Solving Real-World Problems Through Technology
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Founded by engineers who believe great software comes from understanding businesses, not just writing code.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {founders.map((f, i) => (
                <motion.div
                  key={f.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="text-center"
                >
                  <div className="mx-auto mb-4 inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-red-500 text-white text-2xl font-extrabold shadow-lg">
                    {f.name.charAt(0)}
                  </div>
                  <h3 className="text-lg font-bold text-black">{f.name}</h3>
                  <p className="text-sm text-orange-500 font-semibold">{f.role}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-gradient-to-br from-[#1a0a02] via-[#2a1405] to-[#0F0F0F] py-20 relative overflow-hidden">
          <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-orange-500/20 blur-3xl" />
          <div className="container mx-auto px-4 md:px-6 max-w-4xl text-center relative">
            <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-6">
              Ready to build something that <span className="text-orange-400">actually works?</span>
            </h2>
            <button
              type="button"
              onClick={openEnquire}
              className="inline-flex items-center gap-2 rounded-full bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 text-base font-bold transition-colors shadow-xl shadow-orange-500/30"
            >
              Start a Conversation <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  )
}
