import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Phone, Mail, MapPin, Send, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import { emailLeadToOwner } from '../lib/notify'
import OwlLogo from './site/OwlLogo'

const EMPTY = {
  name: '', company: '', phone: '', email: '',
  project_details: '', budget: '', timeline: '',
}

export default function EnquireModal() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState(EMPTY)

  useEffect(() => {
    function onOpen() { setOpen(true) }
    function onKey(e) { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('open-enquire', onOpen)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('open-enquire', onOpen)
      window.removeEventListener('keydown', onKey)
    }
  }, [])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

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
      const row = {
        name: form.name,
        company: form.company,
        phone: form.phone,
        email: form.email,
        project_details: form.project_details,
        budget: form.budget,
        timeline: form.timeline,
      }
      const { error } = await supabase.from('enquiries').insert([row])
      if (error) throw error
      await emailLeadToOwner('New ExCompany enquiry', row)
      toast.success('Enquiry submitted! We will get back to you soon.')
      setForm(EMPTY)
      setOpen(false)
    } catch (err) {
      console.error(err)
      toast.error('Failed to submit. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="enquire-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto"
          onClick={() => setOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ duration: 0.25 }}
            className="relative my-8 w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="absolute right-4 top-4 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-600 shadow-md transition hover:bg-slate-100 hover:text-slate-900"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2">
              {/* LEFT — contact details */}
              <div className="relative overflow-hidden bg-gradient-to-br from-[#1a0a02] via-[#2a1405] to-[#0F0F0F] p-8 text-white md:p-12">
                <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-orange-500/20 blur-3xl" />
                <div className="absolute -bottom-20 -left-10 h-72 w-72 rounded-full bg-orange-500/10 blur-3xl" />

                <div className="relative">
                  <div className="flex items-center gap-2.5 mb-8">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#F97316]">
                      <OwlLogo size={26} />
                    </span>
                    <span className="text-2xl font-bold text-orange-500">excompany</span>
                  </div>

                  <h2 className="text-3xl md:text-4xl font-extrabold leading-tight mb-4">
                    Let's build something great together.
                  </h2>
                  <p className="text-gray-300 leading-relaxed mb-10">
                    Drop us your details and we'll get back within 24 hours with a plan, timeline, and transparent pricing.
                  </p>

                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-orange-500/20 text-orange-400">
                        <Phone className="h-5 w-5" />
                      </span>
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wider text-gray-400">Call Us</div>
                        <a href="tel:+918053317489" className="block text-lg font-semibold text-white hover:text-orange-400 transition-colors">
                          +91 80533 17489
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-orange-500/20 text-orange-400">
                        <Mail className="h-5 w-5" />
                      </span>
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wider text-gray-400">Email</div>
                        <a href="mailto:azadgupta1010@gmail.com" className="block text-lg font-semibold text-white hover:text-orange-400 transition-colors break-all">
                          azadgupta1010@gmail.com
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-orange-500/20 text-orange-400">
                        <MapPin className="h-5 w-5" />
                      </span>
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wider text-gray-400">Office</div>
                        <p className="text-lg font-semibold text-white">Kailash Nagar, Narnaul</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT — enquire form */}
              <div className="bg-white p-8 md:p-10 max-h-[85vh] overflow-y-auto">
                <div className="mb-6">
                  <p className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-700">
                    <Send className="h-3.5 w-3.5" /> Enquire For Work
                  </p>
                  <h3 className="mt-3 text-2xl font-extrabold text-slate-900">Request A Quote</h3>
                  <p className="mt-1 text-sm text-slate-500">Tell us about your project.</p>
                </div>

                <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Full Name *</label>
                    <input
                      name="name" value={form.name} onChange={handleChange} required
                      placeholder="Your full name"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-orange-300 focus:bg-white focus:ring-2 focus:ring-orange-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Phone *</label>
                    <input
                      name="phone" value={form.phone} onChange={handleChange} required
                      placeholder="Phone number"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-orange-300 focus:bg-white focus:ring-2 focus:ring-orange-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email</label>
                    <input
                      name="email" type="email" value={form.email} onChange={handleChange}
                      placeholder="you@example.com"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-orange-300 focus:bg-white focus:ring-2 focus:ring-orange-100"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Company</label>
                    <input
                      name="company" value={form.company} onChange={handleChange}
                      placeholder="Company name"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-orange-300 focus:bg-white focus:ring-2 focus:ring-orange-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Budget</label>
                    <input
                      name="budget" value={form.budget} onChange={handleChange}
                      placeholder="e.g. ₹50k - ₹2L"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-orange-300 focus:bg-white focus:ring-2 focus:ring-orange-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Timeline</label>
                    <input
                      name="timeline" value={form.timeline} onChange={handleChange}
                      placeholder="e.g. 2 weeks"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-orange-300 focus:bg-white focus:ring-2 focus:ring-orange-100"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Project Details *</label>
                    <textarea
                      name="project_details" value={form.project_details} onChange={handleChange}
                      required rows={4}
                      placeholder="Briefly describe what you need..."
                      className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-orange-300 focus:bg-white focus:ring-2 focus:ring-orange-100"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <button
                      type="submit" disabled={loading}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-500/30 transition hover:bg-orange-600 disabled:opacity-60"
                    >
                      {loading ? 'Submitting...' : 'Submit Enquiry'}
                      {!loading && <ArrowRight className="h-4 w-4" />}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function openEnquire() {
  window.dispatchEvent(new CustomEvent('open-enquire'))
}
