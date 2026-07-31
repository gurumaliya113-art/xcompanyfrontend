import React, { useState } from 'react'
import { Handshake } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import {
  ArrowRight,
  Field,
  FormCard,
  FormSuccess,
  PageHero,
  PrimaryButton,
  SecondaryButton,
  Section,
} from '../components/site/sections'

/* Partnership interest.

   Same rewrite as the enquiry page: shared primitives, per-field errors instead
   of one disappearing toast, and an option list for investment interest so the
   submissions are comparable rather than seven variations of "50k-1lakh".
*/

const INTEREST = [
  'Referral partner (no investment)',
  'Under ₹1 lakh',
  '₹1 – 5 lakh',
  '₹5 – 25 lakh',
  '₹25 lakh+',
  'Want to discuss first',
]

const EMPTY = { name: '', company: '', phone: '', email: '', investment_interest: '', message: '' }

export default function PartnerPage() {
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  function update(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (loading) return

    const next = {}
    if (!form.name.trim()) next.name = 'Please tell us your name'
    if (!form.phone.trim()) next.phone = 'A phone number lets us call you back'
    else if (form.phone.replace(/\D/g, '').length < 10) next.phone = 'Enter a valid phone number'
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = 'Check this email address'
    setErrors(next)
    if (Object.keys(next).length > 0) return

    setLoading(true)
    try {
      if (!supabase) throw new Error('Cannot reach the server right now.')
      const { error } = await supabase.from('partners').insert([
        {
          name: form.name.trim(),
          company: form.company.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          investment_interest: form.investment_interest,
          message: form.message.trim(),
        },
      ])
      if (error) throw new Error(error.message)
      setSent(true)
      setForm(EMPTY)
      toast.success('Partnership request submitted.')
    } catch (err) {
      toast.error(err.message || 'Could not submit. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <PageHero
        label="Partnership Programme"
        icon={Handshake}
        title="Partner with"
        highlight="excompany."
        description="Join our network of referral partners, collaborators and investors. Transparent terms, outcome-driven, shared growth."
      >
        <SecondaryButton to="/partner-benefits">See partner benefits</SecondaryButton>
      </PageHero>

      <Section>
        <div className="mx-auto max-w-3xl">
          {sent ? (
            <FormSuccess
              title="Request received"
              description="Thanks — we have your details. We will reach out to discuss how a partnership could work."
              onReset={() => setSent(false)}
              resetLabel="Submit another request"
            />
          ) : (
            <FormCard
              title="Submit partnership interest"
              description="Only name and phone are required. Everything else helps us prepare."
              onSubmit={handleSubmit}
              footer={
                <PrimaryButton type="submit" disabled={loading} className="w-full sm:w-auto">
                  {loading ? 'Submitting…' : 'Submit request'}
                  {!loading && <ArrowRight className="h-4 w-4" />}
                </PrimaryButton>
              }
            >
              <Field
                id="pt-name"
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
                id="pt-company"
                name="company"
                label="Company"
                value={form.company}
                onChange={update}
                autoComplete="organization"
                placeholder="Optional"
              />
              <Field
                id="pt-phone"
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
                id="pt-email"
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
                id="pt-interest"
                name="investment_interest"
                label="Investment interest"
                as="select"
                options={INTEREST}
                value={form.investment_interest}
                onChange={update}
                placeholder="Select what fits"
                full
              />
              <Field
                id="pt-message"
                name="message"
                label="Message"
                as="textarea"
                rows={4}
                full
                value={form.message}
                onChange={update}
                placeholder="Tell us what kind of partnership you have in mind."
              />
            </FormCard>
          )}
        </div>
      </Section>
    </>
  )
}
