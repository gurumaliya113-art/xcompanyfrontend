import React from 'react'
import { motion } from 'framer-motion'
import {
  Globe, Code2, Sparkles, Truck, Utensils, Workflow, ArrowRight, CheckCircle2,
} from 'lucide-react'
import PublicHeader from '../components/PublicHeader'
import PublicFooter from '../components/PublicFooter'

const openEnquire = () =>
  window.dispatchEvent(new CustomEvent('open-enquire'))

const solutions = [
  {
    icon: Globe,
    title: 'Custom Website Development',
    desc: 'Business websites, startup landing pages, corporate sites, and scalable web platforms — optimized for user acquisition, performance, and search visibility. Every site is engineered for speed, conversions, and growth.',
    points: ['SEO-optimized architecture', 'Conversion-focused UX', 'Lightning-fast load times'],
  },
  {
    icon: Code2,
    title: 'Custom Software Development',
    desc: 'Businesses outgrow spreadsheets fast. We develop CRM systems, ERP tools, dashboards, internal management systems, and workflow automation platforms tailored to your exact operational requirements.',
    points: ['CRM & ERP systems', 'Internal dashboards', 'Workflow automation'],
  },
  {
    icon: Sparkles,
    title: 'AI Solutions & Automation',
    desc: 'We integrate artificial intelligence into business processes through OCR systems, AI analytics, automated reporting, chat systems, and intelligent workflows that reduce repetitive work and improve decision making.',
    points: ['OCR & document AI', 'Predictive analytics', 'Automated reporting'],
  },
  {
    icon: Truck,
    title: 'Fleet Management Solutions',
    desc: 'GPS tracking, fuel analytics, driver behavior monitoring, vehicle diagnostics, geofencing, maintenance alerts, and centralized dashboards to improve operational efficiency and reduce losses.',
    points: ['Real-time GPS tracking', 'Fuel & maintenance analytics', 'Driver behavior reports'],
  },
  {
    icon: Utensils,
    title: 'Restaurant Management Systems',
    desc: 'QR ordering, token systems, kitchen display systems, analytics dashboards, inventory tracking, staff management, and multi-outlet operational monitoring built for modern food businesses.',
    points: ['QR & token ordering', 'Kitchen display systems', 'Multi-outlet dashboards'],
  },
  {
    icon: Workflow,
    title: 'Business Automation',
    desc: 'Attendance systems, reporting automation, operational tracking, accounting tools, and analytics dashboards — we help businesses digitize processes and eliminate manual inefficiencies.',
    points: ['Attendance & HR systems', 'Accounting tools', 'Operational tracking'],
  },
]

export default function SolutionsPage() {
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
              <Sparkles className="h-3.5 w-3.5" /> Our Solutions
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-black tracking-tight leading-[1.1] mb-6"
            >
              Software That Solves <span className="text-orange-500">Real Business</span> Problems.
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="text-lg md:text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto"
            >
              At excompany, we build software systems, websites, AI-powered tools, and business automation solutions designed to solve operational challenges and help companies scale faster.
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
              className="text-base text-gray-500 mt-4 italic"
            >
              Technology should increase efficiency, reduce manual work, and create measurable business growth.
            </motion.p>
          </div>
        </section>

        {/* Solutions grid */}
        <section className="bg-white py-20 md:py-28">
          <div className="container mx-auto px-4 md:px-6 max-w-7xl">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {solutions.map((s, i) => {
                const Icon = s.icon
                return (
                  <motion.div
                    key={s.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05, duration: 0.4 }}
                    className="group relative bg-gray-50 hover:bg-white border border-gray-100 hover:border-orange-200 hover:shadow-xl rounded-3xl p-8 transition-all duration-300"
                  >
                    <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-500 mb-6 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                      <Icon className="h-7 w-7" />
                    </div>
                    <h3 className="text-xl font-bold text-black mb-3">{s.title}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed mb-5">{s.desc}</p>
                    <ul className="space-y-2">
                      {s.points.map((p) => (
                        <li key={p} className="flex items-start gap-2 text-sm text-gray-700">
                          <CheckCircle2 className="h-4 w-4 text-orange-500 mt-0.5 shrink-0" />
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-gradient-to-br from-[#1a0a02] via-[#2a1405] to-[#0F0F0F] py-20 relative overflow-hidden">
          <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-orange-500/20 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-80 w-80 rounded-full bg-orange-500/10 blur-3xl" />
          <div className="container mx-auto px-4 md:px-6 max-w-4xl text-center relative">
            <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-6">
              Build technology that solves <span className="text-orange-400">real business problems</span> and creates long-term growth.
            </h2>
            <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
              Let's discuss your operational challenges and design a system around your business.
            </p>
            <button
              type="button"
              onClick={openEnquire}
              className="inline-flex items-center gap-2 rounded-full bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 text-base font-bold transition-colors shadow-xl shadow-orange-500/30"
            >
              Talk to Our Team <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  )
}
