import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Handshake, ArrowRight, Shield, TrendingUp, Users, Briefcase, Star, DollarSign } from 'lucide-react'

const benefits = [
  { icon: TrendingUp, title: 'Revenue Sharing', desc: 'Earn a share of project revenues generated through your referrals and partnerships.' },
  { icon: Shield, title: 'Priority Support', desc: 'Get dedicated account management and priority on project timelines.' },
  { icon: Users, title: 'Network Access', desc: 'Access our growing network of businesses, startups, and industry contacts.' },
  { icon: Briefcase, title: 'Co-Branded Projects', desc: 'Work on co-branded projects and build your portfolio alongside ours.' },
  { icon: Star, title: 'Early Access', desc: 'Get early access to new products, features, and business opportunities.' },
  { icon: DollarSign, title: 'Investment Opportunities', desc: 'Participate in investment rounds and share in company growth.' },
]

export default function PartnerBenefitsPage() {
  return (
    <div className="space-y-12">
      <section className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm md:p-12">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <p className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-700">
            <Handshake className="h-4 w-4" /> Why Partner
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
            Partner Benefits
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
            Discover what you get when you partner with The X Company — transparent terms, shared success, and real growth opportunities.
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
        <h2 className="text-xl font-semibold text-slate-900">Ready to Partner?</h2>
        <p className="mx-auto mt-2 max-w-lg text-sm text-slate-600">Join our partner program and start growing together.</p>
        <Link to="/partner" className="mt-6 inline-flex items-center gap-2 rounded-full bg-slate-900 px-8 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800">
          <Handshake className="h-4 w-4" /> Become a Partner <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </div>
  )
}
