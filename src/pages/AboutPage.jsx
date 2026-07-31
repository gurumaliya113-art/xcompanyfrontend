import React from 'react'
import { motion } from 'framer-motion'
import { BarChart3, Rocket, Sparkles, Target, TrendingUp, Users, Zap } from 'lucide-react'
import {
  ArrowRight,
  CtaBand,
  FeatureGrid,
  PageHero,
  PrimaryButton,
  SecondaryButton,
  Section,
  SectionHeading,
} from '../components/site/sections'

/* About excompany.

   Hero, belief grid and closing band moved onto the shared primitives. The
   Philosophy and Founders blocks stay bespoke — they are genuinely different
   layouts (two-column narrative, avatar row), not another instance of a pattern,
   so forcing them into a primitive would make both harder to read. */

const openEnquire = () => window.dispatchEvent(new CustomEvent('open-enquire'))

const beliefs = [
  { icon: Target, title: 'Build for impact', desc: 'Every system we engineer is built to create measurable outcomes.' },
  { icon: Zap, title: 'Solve operational problems', desc: 'We focus on real workflows, not surface-level features.' },
  { icon: TrendingUp, title: 'Create scalable systems', desc: 'Software that grows with your business, not against it.' },
  { icon: BarChart3, title: 'Measurable outcomes', desc: 'Data-driven design and results you can actually track.' },
  { icon: Rocket, title: 'Engineer for growth', desc: 'Products designed from day one to handle scale.' },
]

const founders = [
  { name: 'Azad Gupta', role: 'Co-Founder' },
  { name: 'Mukul Saini', role: 'Co-Founder' },
  { name: 'Amit', role: 'Co-Founder' },
  { name: 'Anubhav', role: 'Co-Founder' },
]

const clients = [
  'Startups looking for speed',
  'Local businesses going digital',
  'Enterprises modernising operations',
  'Industry operators building sustainable growth',
]

export default function AboutPage() {
  return (
    <>
      <PageHero
        label="About excompany"
        icon={Sparkles}
        title="Engineered digital solutions for"
        highlight="real businesses."
        description="We build systems that help businesses automate operations, improve efficiency and scale sustainably."
      >
        <PrimaryButton to="/">Explore our ventures</PrimaryButton>
        <SecondaryButton to="/contact">Get in touch</SecondaryButton>
      </PageHero>

      {/* Philosophy — bespoke two-column narrative */}
      <Section>
        <div className="grid items-center gap-12 md:grid-cols-2">
          <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <p className="mb-3 text-sm font-bold uppercase tracking-widest text-orange-500">Our philosophy</p>
            <h2 className="mb-6 text-2xl font-extrabold leading-tight text-black md:text-3xl">
              Technology should <span className="text-orange-500">simplify</span> business operations, not complicate
              them.
            </h2>
            <p className="mb-4 leading-relaxed text-gray-600">
              Modern business demands speed, automation and better decisions. Companies running on outdated workflows end
              up with inefficiency, operational losses and a ceiling on how far they can grow.
            </p>
            <p className="leading-relaxed text-gray-600">
              excompany exists to remove that ceiling through engineered digital solutions.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="rounded-3xl border border-orange-100 bg-gradient-to-br from-orange-50 to-amber-50 p-8"
          >
            <h3 className="mb-5 flex items-center gap-2 text-lg font-bold text-black">
              <Users className="h-5 w-5 text-orange-500" aria-hidden="true" />
              Who we work with
            </h3>
            <ul className="space-y-3 text-gray-700">
              {clients.map((c) => (
                <li key={c} className="flex items-start gap-2.5">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500" aria-hidden="true" />
                  {c}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </Section>

      {/* Beliefs */}
      <Section tone="muted">
        <SectionHeading label="What we believe" title="Principles behind every system we build" />
        <FeatureGrid items={beliefs} />
      </Section>

      {/* Founders — bespoke avatar row */}
      <Section>
        <SectionHeading
          label="Co-founded by"
          title="Builders solving real problems with technology"
          description="Founded by engineers who believe good software comes from understanding a business, not just writing code."
        />
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {founders.map((f, i) => (
            <motion.div
              key={f.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="text-center"
            >
              <div className="mx-auto mb-4 inline-flex h-20 w-20 items-center justify-center rounded-full bg-orange-500 text-2xl font-extrabold text-white shadow-lg shadow-orange-500/25">
                {f.name.charAt(0)}
              </div>
              <h3 className="text-lg font-bold text-black">{f.name}</h3>
              <p className="text-sm font-semibold text-orange-500">{f.role}</p>
            </motion.div>
          ))}
        </div>
      </Section>

      <CtaBand
        tone="dark"
        title="Ready to build something that"
        highlight="actually works?"
      >
        <PrimaryButton onClick={openEnquire}>
          Start a conversation <ArrowRight className="h-4 w-4" />
        </PrimaryButton>
      </CtaBand>
    </>
  )
}
