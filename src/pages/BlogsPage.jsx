import React from 'react'
import { motion } from 'framer-motion'
import {
  BookOpen, Sparkles, Code2, Workflow, Truck, Utensils, Rocket, TrendingUp, Globe, ArrowRight,
} from 'lucide-react'
import PublicHeader from '../components/PublicHeader'
import PublicFooter from '../components/PublicFooter'

const openEnquire = () =>
  window.dispatchEvent(new CustomEvent('open-enquire'))

const topics = [
  { icon: Sparkles, title: 'How AI is Changing Business Operations', tag: 'AI & Automation', read: '6 min read' },
  { icon: Code2, title: 'Why Custom Software Outperforms Generic Solutions', tag: 'Software', read: '5 min read' },
  { icon: Workflow, title: 'The Future of Business Automation', tag: 'Automation', read: '7 min read' },
  { icon: Truck, title: 'How Fleet Analytics Reduce Fuel Losses', tag: 'Fleet Tech', read: '5 min read' },
  { icon: Utensils, title: 'Why Restaurants Need Digital Ordering Systems', tag: 'Restaurant Tech', read: '4 min read' },
  { icon: Rocket, title: 'Building Scalable MVPs for Startups', tag: 'Startups', read: '6 min read' },
  { icon: TrendingUp, title: 'Software Trends Businesses Should Watch', tag: 'Trends', read: '5 min read' },
  { icon: Globe, title: 'Digital Transformation Strategies for Growing Companies', tag: 'Strategy', read: '8 min read' },
]

export default function BlogsPage() {
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
              <BookOpen className="h-3.5 w-3.5" /> Blog & Insights
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-black tracking-tight leading-[1.1] mb-6"
            >
              Ideas, Trends & <span className="text-orange-500">Practical Insights.</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="text-lg md:text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto"
            >
              Our blog covers software development, AI, automation, business growth, fleet technology, restaurant systems, and digital transformation.
            </motion.p>
          </div>
        </section>

        {/* Topics grid */}
        <section className="bg-white py-20 md:py-24">
          <div className="container mx-auto px-4 md:px-6 max-w-7xl">
            <div className="flex items-end justify-between mb-12 flex-wrap gap-4">
              <div>
                <p className="text-sm font-bold uppercase tracking-widest text-orange-500 mb-2">Coming Soon</p>
                <h2 className="text-2xl md:text-3xl font-extrabold text-black">
                  Topics We're Writing About
                </h2>
              </div>
              <p className="text-sm text-gray-500 italic">Articles publishing soon. Stay tuned.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {topics.map((t, i) => {
                const Icon = t.icon
                return (
                  <motion.article
                    key={t.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.04 }}
                    className="group cursor-pointer bg-gray-50 hover:bg-white border border-gray-100 hover:border-orange-200 hover:shadow-xl rounded-2xl p-6 transition-all duration-300"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-white border border-gray-200 rounded-full px-2.5 py-1">
                        {t.tag}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-black leading-snug mb-3 group-hover:text-orange-600 transition-colors">
                      {t.title}
                    </h3>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{t.read}</span>
                      <span className="font-semibold text-orange-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        Coming soon →
                      </span>
                    </div>
                  </motion.article>
                )
              })}
            </div>
          </div>
        </section>

        {/* Newsletter CTA */}
        <section className="bg-gray-50 py-20">
          <div className="container mx-auto px-4 md:px-6 max-w-3xl text-center">
            <h2 className="text-3xl md:text-4xl font-extrabold text-black mb-4">
              Want these in your inbox?
            </h2>
            <p className="text-gray-600 text-lg mb-7">
              We'll let you know when we publish. No spam. Just useful insights.
            </p>
            <button
              type="button"
              onClick={openEnquire}
              className="inline-flex items-center gap-2 rounded-full bg-orange-500 hover:bg-orange-600 text-white px-8 py-3.5 text-base font-bold transition-colors shadow-lg shadow-orange-500/30"
            >
              Get In Touch <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  )
}
