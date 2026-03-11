import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Handshake, ArrowRight, Shield, Star, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'

export default function PartnerPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '', company: '', phone: '', email: '', investment_interest: '', message: ''
  })

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name || !form.phone) {
      toast.error('Name and phone are required')
      return
    }
    setLoading(true)
    try {
      const { error } = await supabase.from('partners').insert([{
        name: form.name,
        company: form.company,
        phone: form.phone,
        email: form.email,
        investment_interest: form.investment_interest,
        message: form.message,
      }])
      if (error) throw error
      toast.success('Partnership request submitted!')
      setForm({ name: '', company: '', phone: '', email: '', investment_interest: '', message: '' })
    } catch (err) {
      toast.error('Failed to submit. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-12">
      <section className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm md:p-12">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <p className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-700">
            <Handshake className="h-4 w-4" /> Partnership Program
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
            Partner With The X Company
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
            Join our network of strategic partners. We offer transparent, outcome-driven partnerships with shared growth.
          </p>
          <Link to="/partner-benefits" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-sky-600 hover:text-sky-700">
            View Partner Benefits <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm md:p-12">
        <h2 className="text-xl font-semibold text-slate-900">Submit Partnership Interest</h2>
        <form onSubmit={handleSubmit} className="mt-6 grid gap-5 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700">Full Name *</label>
            <input name="name" value={form.name} onChange={handleChange} required className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100" placeholder="Your full name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Company</label>
            <input name="company" value={form.company} onChange={handleChange} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100" placeholder="Company name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Phone *</label>
            <input name="phone" value={form.phone} onChange={handleChange} required className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100" placeholder="Phone number" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Email</label>
            <input name="email" type="email" value={form.email} onChange={handleChange} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100" placeholder="Email address" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Investment Interest</label>
            <input name="investment_interest" value={form.investment_interest} onChange={handleChange} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100" placeholder="e.g. ₹50,000 - ₹1,00,000" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700">Message</label>
            <textarea name="message" value={form.message} onChange={handleChange} rows={4} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100" placeholder="Tell us about your interest..." />
          </div>
          <div className="md:col-span-2">
            <button type="submit" disabled={loading} className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-8 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-50">
              {loading ? 'Submitting...' : 'Submit Partnership Request'} <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
