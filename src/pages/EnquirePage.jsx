import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Send, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'

export default function EnquirePage() {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '', company: '', phone: '', email: '', project_details: '', budget: '', timeline: ''
  })

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name || !form.phone || !form.project_details) {
      toast.error('Name, phone and project details are required')
      return
    }
    setLoading(true)
    try {
      const { error } = await supabase.from('enquiries').insert([{
        name: form.name,
        company: form.company,
        phone: form.phone,
        email: form.email,
        project_details: form.project_details,
        budget: form.budget,
        timeline: form.timeline,
      }])
      if (error) throw error
      toast.success('Enquiry submitted successfully!')
      setForm({ name: '', company: '', phone: '', email: '', project_details: '', budget: '', timeline: '' })
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
            <Send className="h-4 w-4" /> Enquire For Work
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
            Tell Us About Your Project
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
            Share your requirements and we'll get back to you with a plan, timeline, and transparent pricing.
          </p>
        </motion.div>
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm md:p-12">
        <h2 className="text-xl font-semibold text-slate-900">Project Enquiry Form</h2>
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
            <label className="block text-sm font-medium text-slate-700">Budget Range</label>
            <input name="budget" value={form.budget} onChange={handleChange} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100" placeholder="e.g. ₹50,000 - ₹2,00,000" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Timeline</label>
            <input name="timeline" value={form.timeline} onChange={handleChange} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100" placeholder="e.g. 2 weeks, 1 month" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700">Project Details *</label>
            <textarea name="project_details" value={form.project_details} onChange={handleChange} required rows={5} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100" placeholder="Describe your project, goals, and requirements..." />
          </div>
          <div className="md:col-span-2">
            <button type="submit" disabled={loading} className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-8 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-50">
              {loading ? 'Submitting...' : 'Submit Enquiry'} <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
