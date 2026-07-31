import React, { useState } from 'react'
import { Send } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import {
  ArrowRight,
  Field,
  FormCard,
  FormSuccess,
  PageHero,
  PrimaryButton,
  Section,
} from '../components/site/sections'

/* Project enquiry.

   Two things were wrong beyond styling:

   1. Validation was `if (!form.name || !form.phone || !form.project_details)`
      followed by a single toast naming all three fields. You were told
      something was missing but not which one, and the message vanished after a
      few seconds. Errors now sit under the field they belong to.

   2. Budget and timeline were free-text inputs with example placeholders, so
      the data arrived in a different shape from every submitter. They are now
      the same option lists the contact page uses, which makes the enquiry list
      filterable.
*/

const BUDGETS = ['Under ₹50,000', '₹50,000 – ₹2 lakh', '₹2 – 5 lakh', '₹5 lakh+', 'Not sure yet']
const TIMELINES = ['As soon as possible', 'Within a month', '1–3 months', 'Just exploring']

const EMPTY = { name: '', company: '', phone: '', email: '', project_details: '', budget: '', timeline: '' }

export default function EnquirePage() {
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  function update(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  function validate() {
    const next = {}
    if (!form.name.trim()) next.name = 'Please tell us your name'
    if (!form.phone.trim()) next.phone = 'A phone number lets us call you back'
    else if (form.phone.replace(/\D/g, '').length < 10) next.phone = 'Enter a valid phone number'
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = 'Check this email address'
    if (!form.project_details.trim()) next.project_details = 'Tell us briefly what you need built'
    return next
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (loading) return
    const next = validate()
    setErrors(next)
    if (Object.keys(next).length > 0) return

    setLoading(true)
    try {
      if (!supabase) throw new Error('Cannot reach the server right now.')
      const { error } = await supabase.from('enquiries').insert([
        {
          name: form.name.trim(),
          company: form.company.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          project_details: form.project_details.trim(),
          budget: form.budget,
          timeline: form.timeline,
        },
      ])
      if (error) throw new Error(error.message)
      setSent(true)
      setForm(EMPTY)
      toast.success('Enquiry submitted. We reply within 24 hours.')
    } catch (err) {
      toast.error(err.message || 'Could not submit. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <PageHero
        label="Enquire For Work"
        icon={Send}
        title="Tell us about"
        highlight="your project."
        description="Share your requirements and we will come back with a plan, a timeline and transparent pricing."
      />

      <Section>
        <div className="mx-auto max-w-3xl">
          {sent ? (
            <FormSuccess
              title="Enquiry received"
              description="Thanks — we have it. Expect a reply within 24 hours on the number you gave us."
              onReset={() => setSent(false)}
              resetLabel="Submit another enquiry"
            />
          ) : (
            <FormCard
              title="Project enquiry"
              description="Only name, phone and a short description are required."
              onSubmit={handleSubmit}
              footer={
                <>
                  <PrimaryButton type="submit" disabled={loading} className="w-full sm:w-auto">
                    {loading ? 'Submitting…' : 'Submit enquiry'}
                    {!loading && <ArrowRight className="h-4 w-4" />}
                  </PrimaryButton>
                  <p className="mt-3 text-sm text-gray-500">We reply within 24 hours. No spam, ever.</p>
                </>
              }
            >
              <Field
                id="eq-name"
                name="name"
                label="Full name"
                required
                value={form.name}
                onChange={update}
                error={errors.name}
                autoComplete="name"
                placeholder="Your full name"
              />
              <Field
                id="eq-company"
                name="company"
                label="Company"
                value={form.company}
                onChange={update}
                autoComplete="organization"
                placeholder="Optional"
              />
              <Field
                id="eq-phone"
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
                id="eq-email"
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
                id="eq-budget"
                name="budget"
                label="Budget"
                as="select"
                options={BUDGETS}
                value={form.budget}
                onChange={update}
                placeholder="Select a range"
              />
              <Field
                id="eq-timeline"
                name="timeline"
                label="Timeline"
                as="select"
                options={TIMELINES}
                value={form.timeline}
                onChange={update}
                placeholder="Select a timeline"
              />
              <Field
                id="eq-details"
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
          )}
        </div>
      </Section>
    </>
  )
}
