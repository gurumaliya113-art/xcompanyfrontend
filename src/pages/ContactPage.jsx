import React, { useState } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  Building2,
  Code2,
  Globe,
  Mail,
  MapPin,
  Phone,
  Send,
  Sparkles,
  Truck,
  Utensils,
  Workflow,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import {
  ArrowRight,
  CtaBand,
  Field,
  FeatureGrid,
  FormCard,
  FormSuccess,
  PageHero,
  PrimaryButton,
  Section,
  SectionHeading,
} from '../components/site/sections'

/* Contact.

   Two problems this page had:

   1. It was called "Contact" and had no form. Its primary action was a button
      labelled "Open Enquiry Form" that popped a modal — an extra step to reach
      the one thing the page exists for, and on mobile the modal covered the
      contact details you might want beside it.

   2. It ended with a third "Request A Quote" button opening the same modal the
      page already offered twice. Three routes to one action is not emphasis,
      it is noise.

   The form is now on the page and built from the shared Field primitives, so it
   validates and looks identical to the enquiry and partner forms. The modal
   still serves CTAs elsewhere on the site; both write to `enquiries`. */

const BUDGETS = ['Under ₹50,000', '₹50,000 – ₹2 lakh', '₹2 – 5 lakh', '₹5 lakh+', 'Not sure yet']
const TIMELINES = ['As soon as possible', 'Within a month', '1–3 months', 'Just exploring']

const services = [
  { icon: Code2, title: 'Custom software', desc: 'CRM, ERP, dashboards and internal tools built around your operations.' },
  { icon: Globe, title: 'Websites & web platforms', desc: 'Fast, search-visible sites engineered for conversions.' },
  { icon: Sparkles, title: 'AI solutions', desc: 'OCR, analytics, automated reporting and intelligent workflows.' },
  { icon: Workflow, title: 'Business automation', desc: 'Attendance, accounting and operational tracking systems.' },
  { icon: Truck, title: 'Fleet management', desc: 'GPS tracking, fuel analytics and maintenance monitoring.' },
  { icon: Utensils, title: 'Restaurant systems', desc: 'QR ordering, kitchen displays and multi-outlet dashboards.' },
  { icon: Building2, title: 'Industry platforms', desc: 'Sector-specific systems built around real workflows.' },
]

const contactPoints = [
  { icon: Mail, label: 'Email', value: 'azadgupta1010@gmail.com', href: 'mailto:azadgupta1010@gmail.com' },
  { icon: Phone, label: 'Phone', value: '+91 80533 17489', href: 'tel:+918053317489' },
  { icon: Globe, label: 'Website', value: 'excompany.in', href: 'https://excompany.in' },
  { icon: MapPin, label: 'Office', value: 'Kailash Nagar, Narnaul' },
]

const EMPTY = { name: '', phone: '', email: '', company: '', budget: '', timeline: '', project_details: '' }

function ContactForm() {
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  function update(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (sending) return

    const next = {}
    if (!form.name.trim()) next.name = 'Please tell us your name'
    if (!form.phone.trim()) next.phone = 'A phone number lets us call you back'
    else if (form.phone.replace(/\D/g, '').length < 10) next.phone = 'Enter a valid phone number'
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = 'Check this email address'
    if (!form.project_details.trim()) next.project_details = 'Tell us briefly what you need'
    setErrors(next)
    if (Object.keys(next).length > 0) return

    setSending(true)
    try {
      if (!supabase) throw new Error('Cannot reach the server right now.')
      const { error } = await supabase.from('enquiries').insert([
        {
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          company: form.company.trim(),
          budget: form.budget,
          timeline: form.timeline,
          project_details: form.project_details.trim(),
        },
      ])
      if (error) throw new Error(error.message)
      setSent(true)
      setForm(EMPTY)
      toast.success('Enquiry sent. We reply within 24 hours.')
    } catch (err) {
      toast.error(err.message || 'Could not send your enquiry.')
    } finally {
      setSending(false)
    }
  }

  if (sent) {
    return (
      <FormSuccess
        title="Enquiry received"
        description="Thanks — we have it. Expect a reply within 24 hours on the number you gave us."
        onReset={() => setSent(false)}
        resetLabel="Send another enquiry"
      />
    )
  }

  return (
    <FormCard
      title="Send an enquiry"
      description="Only name, phone and a short description are required."
      onSubmit={handleSubmit}
      footer={
        <>
          <PrimaryButton type="submit" disabled={sending} className="w-full sm:w-auto">
            {sending ? 'Sending…' : 'Send enquiry'}
            {!sending && <ArrowRight className="h-4 w-4" />}
          </PrimaryButton>
          <p className="mt-3 text-sm text-gray-500">We reply within 24 hours. No spam, ever.</p>
        </>
      }
    >
      <Field
        id="ct-name"
        name="name"
        label="Name"
        required
        value={form.name}
        onChange={update}
        error={errors.name}
        autoComplete="name"
        placeholder="Your full name"
      />
      <Field
        id="ct-phone"
        name="phone"
        label="Phone"
        required
        type="tel"
        value={form.phone}
        onChange={update}
        error={errors.phone}
        autoComplete="tel"
        placeholder="+91 "
      />
      <Field
        id="ct-email"
        name="email"
        label="Email"
        type="email"
        value={form.email}
        onChange={update}
        error={errors.email}
        autoComplete="email"
        placeholder="you@company.com"
      />
      <Field
        id="ct-company"
        name="company"
        label="Company"
        value={form.company}
        onChange={update}
        autoComplete="organization"
        placeholder="Optional"
      />
      <Field
        id="ct-budget"
        name="budget"
        label="Budget"
        as="select"
        options={BUDGETS}
        value={form.budget}
        onChange={update}
        placeholder="Select a range"
      />
      <Field
        id="ct-timeline"
        name="timeline"
        label="Timeline"
        as="select"
        options={TIMELINES}
        value={form.timeline}
        onChange={update}
        placeholder="Select a timeline"
      />
      <Field
        id="ct-details"
        name="project_details"
        label="What do you need built?"
        required
        as="textarea"
        full
        value={form.project_details}
        onChange={update}
        error={errors.project_details}
        placeholder="A short description is enough — we will follow up with questions."
      />
    </FormCard>
  )
}

export default function ContactPage() {
  return (
    <>
      <PageHero
        label="Get In Touch"
        icon={Send}
        title="Let's build something"
        highlight="great together."
        description="Software, AI solutions, websites, automation or a custom platform — tell us what you need."
      />

      <Section>
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Direct contact — bespoke dark card, kept because it reads as the
              "human" route beside the form rather than another form panel. */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1a0a02] via-[#2a1405] to-[#0F0F0F] p-8 text-white md:p-10"
          >
            <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-orange-500/20 blur-3xl" aria-hidden="true" />
            <div className="relative">
              <h2 className="mb-8 text-2xl font-extrabold md:text-3xl">Reach us directly</h2>
              <ul className="space-y-6">
                {contactPoints.map((c) => (
                  <li key={c.label} className="flex items-start gap-4">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-orange-500/20 text-orange-400">
                      <c.icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-400">{c.label}</p>
                      {c.href ? (
                        <a
                          href={c.href}
                          target={c.href.startsWith('http') ? '_blank' : undefined}
                          rel={c.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                          className="break-all text-base font-semibold transition-colors hover:text-orange-400 md:text-lg"
                        >
                          {c.value}
                        </a>
                      ) : (
                        <p className="text-base font-semibold md:text-lg">{c.value}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
              <p className="mt-10 text-sm text-gray-400">
                Prefer to write? Use the form beside this — it reaches the same inbox.
              </p>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
            <ContactForm />
          </motion.div>
        </div>
      </Section>

      <Section tone="muted">
        <SectionHeading label="What we build" title="Services available" />
        <FeatureGrid items={services} />
      </Section>

      <CtaBand
        title="Not sure what you need yet?"
        description="That is fine — most projects start that way. Call us and we will help you scope it."
      >
        <PrimaryButton href="tel:+918053317489">Call +91 80533 17489</PrimaryButton>
      </CtaBand>
    </>
  )
}
