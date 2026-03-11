import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Briefcase, ArrowRight, Clock, DollarSign, Users, Rocket, Award, Shield } from 'lucide-react'

const benefits = [
  { icon: Clock, title: 'On-Time Delivery', desc: 'We commit to clear timelines and deliver on schedule — every single project.' },
  { icon: DollarSign, title: 'Industry Cheapest Price', desc: 'If anyone matches or goes below our price (verified), we do the entire work for free.' },
  { icon: Shield, title: 'No Full Advance Payment', desc: 'Work begins without demanding full payment upfront. Pay as milestones are completed.' },
  { icon: Users, title: 'Expert Workforce', desc: 'Experienced professionals across development, design, marketing, and operations.' },
  { icon: Rocket, title: 'Fast Turnaround', desc: 'We prioritize speed without compromising quality — minimum days, maximum impact.' },
  { icon: Award, title: 'Free Consulting', desc: 'Industry expertise, planning, and guidance included at no extra cost.' },
]

export default function WorkBenefitsPage() {
  return (
    <div className="space-y-12">
      <section className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm md:p-12">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <p className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-700">
            <Briefcase className="h-4 w-4" /> Work Benefits
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
            Why Get Your Work Done With Us
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
            Simple, transparent terms. No hidden charges. Focused on outcomes and your satisfaction.
          </p>
        </motion.div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {benefits.map((b, i) => (
          <motion.div key={b.title} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.08 }}
            className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900">
              <b.icon className="h-5 w-5 text-white" />
            </span>
            <h3 className="mt-4 text-base font-semibold text-slate-900">{b.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{b.desc}</p>
          </motion.div>
        ))}
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-sm md:p-12">
        <h2 className="text-xl font-semibold text-slate-900">Ready to Start?</h2>
        <p className="mx-auto mt-2 max-w-lg text-sm text-slate-600">Tell us about your project and we'll take it from there.</p>
        <Link to="/enquire" className="mt-6 inline-flex items-center gap-2 rounded-full bg-slate-900 px-8 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800">
          Enquire Now <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </div>
  )
}
