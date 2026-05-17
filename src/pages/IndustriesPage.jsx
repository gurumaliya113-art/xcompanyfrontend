import React from 'react'
import { motion } from 'framer-motion'
import {
  Truck, Utensils, Recycle, ShoppingBag, Rocket, Building2, HeartPulse, Factory,
  ArrowRight, Briefcase,
} from 'lucide-react'
import PublicHeader from '../components/PublicHeader'
import PublicFooter from '../components/PublicFooter'

const openEnquire = () =>
  window.dispatchEvent(new CustomEvent('open-enquire'))

const industries = [
  { icon: Truck, title: 'Logistics & Transportation', desc: 'Fleet monitoring systems, GPS tracking, fuel management, maintenance analytics, and operational dashboards.', color: 'from-blue-500 to-indigo-600' },
  { icon: Utensils, title: 'Restaurants & Food Businesses', desc: 'Ordering systems, kitchen workflows, token management, analytics, remote monitoring, and customer experience optimization.', color: 'from-orange-500 to-red-500' },
  { icon: Recycle, title: 'Scrap & Recycling Industry', desc: 'Digital systems for scrap collection networks, supplier management, aggregation operations, inventory tracking, and marketplace solutions.', color: 'from-green-500 to-emerald-600' },
  { icon: ShoppingBag, title: 'Retail Businesses', desc: 'Billing systems, inventory management, customer analytics, and operational automation.', color: 'from-pink-500 to-rose-600' },
  { icon: Rocket, title: 'Startups', desc: 'Rapid MVP development, scalable web platforms, and technology solutions designed to accelerate growth.', color: 'from-purple-500 to-fuchsia-600' },
  { icon: Building2, title: 'Enterprises', desc: 'Custom internal software, dashboards, workflow automation, and large-scale digital transformation solutions.', color: 'from-slate-600 to-gray-800' },
  { icon: HeartPulse, title: 'Healthcare', desc: 'Operational systems, workflow management, automation tools, and analytics.', color: 'from-red-500 to-pink-600' },
  { icon: Factory, title: 'Manufacturing', desc: 'Production tracking, reporting systems, inventory management, and efficiency monitoring.', color: 'from-amber-500 to-orange-600' },
]

export default function IndustriesPage() {
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
              <Briefcase className="h-3.5 w-3.5" /> Industries We Serve
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-black tracking-tight leading-[1.1] mb-6"
            >
              Industry-Specific Software, <span className="text-orange-500">Not Generic Templates.</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="text-lg md:text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto"
            >
              excompany develops solutions designed around operational realities — not cookie-cutter products. Every system we build understands the specific workflows of your industry.
            </motion.p>
          </div>
        </section>

        {/* Industries Grid */}
        <section className="bg-white py-20 md:py-28">
          <div className="container mx-auto px-4 md:px-6 max-w-7xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {industries.map((ind, i) => {
                const Icon = ind.icon
                return (
                  <motion.div
                    key={ind.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.04, duration: 0.4 }}
                    className="group relative overflow-hidden bg-white border border-gray-100 hover:border-transparent rounded-3xl p-7 transition-all duration-300 hover:shadow-2xl"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${ind.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                    <div className="relative">
                      <div className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${ind.color} text-white mb-5 shadow-lg`}>
                        <Icon className="h-7 w-7" />
                      </div>
                      <h3 className="text-lg font-bold text-black group-hover:text-white mb-3 transition-colors">
                        {ind.title}
                      </h3>
                      <p className="text-sm text-gray-600 group-hover:text-white/90 leading-relaxed transition-colors">
                        {ind.desc}
                      </p>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-gray-50 py-20">
          <div className="container mx-auto px-4 md:px-6 max-w-4xl text-center">
            <h2 className="text-3xl md:text-4xl font-extrabold text-black mb-5">
              Don't see your industry? <span className="text-orange-500">Talk to us anyway.</span>
            </h2>
            <p className="text-gray-600 text-lg mb-8 max-w-2xl mx-auto">
              We've built systems across many sectors. If you have an operational challenge, chances are we can solve it.
            </p>
            <button
              type="button"
              onClick={openEnquire}
              className="inline-flex items-center gap-2 rounded-full bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 text-base font-bold transition-colors shadow-xl shadow-orange-500/30"
            >
              Discuss Your Project <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  )
}
