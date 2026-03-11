import React, { useState, useEffect, useRef, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowRight, Handshake, Search, Shield,
  Briefcase, Truck, Factory, Recycle, ShoppingCart, Sparkles, Wrench,
  Star, FileText, Send
} from 'lucide-react'

function Badge({ children }) {
  return (
    <span className="inline-flex items-center rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs font-semibold text-slate-700">
      {children}
    </span>
  )
}

function FeatureList({ items, dark = false }) {
  return (
    <ul className={`space-y-3 text-sm ${dark ? 'text-white/80' : 'text-slate-700'}`}>
      {items.map((item) => (
        <li key={item} className="flex gap-3">
          <span className={`mt-1.5 h-2 w-2 rounded-full ${dark ? 'bg-sky-300' : 'bg-sky-500'}`} />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

function CardSection({ children }) {
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm md:p-12">
      <div className="relative">{children}</div>
    </section>
  )
}

const projects = [
  {
    id: 'fog-safety-ai',
    badge: 'Featured Project',
    title: 'FOGG SAFETY AI SYSTEM',
    subtitle: 'Intelligent Driver Assistance & Fog Detection Technology',
    overview: 'We developed an advanced AI-powered Fog Safety & Driver Monitoring System designed to prevent highway accidents caused by low visibility and driver fatigue.',
    features: ['Real-time Fog Detection', 'Vehicle & Truck Recognition in Low Visibility', 'AI Vision-Based Object Detection', 'Driver Eye-Closure Detection', 'Instant Audio Alert System', 'Fatigue Monitoring', 'Smart Risk Prediction Engine'],
    problem: ['Highway accidents due to dense fog', 'Driver micro-sleep accidents', 'Poor visibility collision risk', 'Lack of intelligent alert system'],
    impact: ['Reduced accident risk in low-visibility conditions', 'Enhanced driver awareness', 'Smart AI integration for real-world safety'],
    recognition: 'Currently in strategic discussion with major mapping & geospatial technology companies including Mappls and Maps India regarding potential collaboration and acquisition opportunities.',
  },
  {
    id: 'rk-travels-fleet',
    badge: 'Enterprise System',
    title: 'Enterprise Fleet Management System',
    subtitle: 'Developed for RK Travels',
    overview: 'Complete Fleet Management + Analytics + Automation System for large-scale labor transport operations.',
    features: ['Real-time fleet tracking', 'Labor pickup-drop route optimization', 'Vehicle health monitoring', 'Driver performance tracking', 'Fuel monitoring system', 'Data analytics dashboard', 'Reporting automation'],
    problem: ['Manual fleet management inefficiency', 'No real-time tracking', 'Fuel wastage and route issues', 'Lack of performance data'],
    impact: ['6-figure project revenue', 'Operational efficiency improvement', 'Cost optimization & performance tracking'],
  },
  {
    id: 'mills-dashboard',
    badge: 'SaaS Product',
    title: 'Mills Business Dashboard',
    subtitle: 'Accounting + End-to-End Management SaaS',
    overview: 'Cloud-based business dashboard & accounting platform to replace offline manual processes that caused time waste, accounting confusion, and poor data management.',
    features: ['Complete accounting system', 'Inventory management', 'Sales & purchase tracking', 'Owner analytics dashboard', 'Membership-based SaaS model'],
    problem: ['Manual accounting errors', 'Time-consuming processes', 'Poor data management', 'No business analytics'],
    impact: ['Reduced manual workload', 'Increased operational efficiency', 'Enabled owners to focus on business growth'],
  },
  {
    id: 'scrap-app',
    badge: 'Startup Venture',
    title: 'SCRAP APP',
    subtitle: 'End-to-End Scrap Supply Chain Platform',
    overview: "Digitizing India's scrap & waste ecosystem with an end-to-end platform across collection, aggregation, logistics, and buyer-seller matchmaking.",
    features: ['Collection', 'Aggregation', 'Logistics', 'Buyer-Seller matchmaking', 'Digital records'],
    problem: ['Unorganized supply chain', 'No digital records', 'Inefficient logistics', 'Lack of buyer-seller matching'],
    impact: ['Seed stage, scalable model', 'Recognized by government departments including waste management authorities'],
  },
  {
    id: 'ecommerce-ops',
    badge: 'Operations & Growth',
    title: 'E-commerce Operations',
    subtitle: 'Meesho | Amazon | Flipkart',
    overview: 'Built and scaled fashion-category operations across major marketplaces with structured GST & Non-GST workflows.',
    features: ['Supply chain + catalog optimization', 'Marketplace algorithm understanding', 'Branding & product positioning', 'Performance marketing insights'],
    problem: ['No structured operations', 'Poor catalog management', 'Marketplace compliance gaps'],
    impact: ['5-figure revenue within initial launch days'],
  },
  {
    id: 'zubilo',
    badge: 'Global Brand',
    title: 'ZUBILO — USA Brand Launch',
    subtitle: 'Luxury-ready D2C launch (India → Worldwide)',
    overview: 'Global-ready fashion brand built for USA & international markets: website, mobile app, identity, and logistics planning — manufactured in India and exported worldwide.',
    features: ['Full website', 'Mobile app', 'Brand identity', 'International logistics'],
    problem: ['No global brand presence', 'No D2C infrastructure', 'Complex international logistics'],
    impact: ['Global-ready brand', 'Full D2C ecosystem built'],
  },
  {
    id: 'transformations',
    badge: 'Business Transformation',
    title: 'Business Transformation Projects',
    subtitle: 'Offline → Structured Digital Growth',
    overview: 'We helped offline businesses go digital with accounting dashboards, online presence, analytics, and operations consulting — focusing on measurable structure and growth.',
    features: ['Business digitization', 'Accounting dashboards', 'Online presence creation', 'Performance analytics', 'Branding & operations consulting'],
    problem: ['Zero digital presence', 'Manual operations', 'No performance tracking'],
    impact: ['Nursery Business: Zero → Hero', 'Hookah Show: Hero → Restructured Digital Model', 'RK Garments: Offline Struggling → Profitable Structured Retail'],
  },
]

export default function HomePage() {
  const [selected, setSelected] = useState(null)
  const [pulse, setPulse] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => {
    if (window.location.hash === '#work') {
      setTimeout(() => document.getElementById('work')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0)
    }
  }, [])

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  const services = [
    'Coding', 'Editing', 'Social media manager', 'Brand building',
    'Content creation', 'Advertisements', 'Software and tech', 'Financing',
    'Auditing', 'Interactive dashboard and analytics', 'Startup building',
    'Ecommerce', 'Dropshipping',
  ]

  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm md:p-12">
        <div className="relative grid gap-10 md:grid-cols-2 md:items-center">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <p className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-700">
              Premium Business Showcase
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-900 md:text-5xl">
              Building modern, reliable solutions for growing businesses
            </h1>
            <p className="mt-4 text-base leading-7 text-slate-600">
              Explore our work, partner with us, or send your project requirements. We focus on clarity, quality, and on-time delivery.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link to="/partner" className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800">
                <Handshake className="h-4 w-4" /> Partner With Us <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/enquire" className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-50">
                <Search className="h-4 w-4 text-slate-700" /> Enquire For Work
              </Link>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }} className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900">Showreel</h2>
            <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
              <video className="h-64 w-full object-cover" autoPlay loop muted playsInline preload="metadata">
                <source src="/media/videox.webm" type="video/webm" />
                <source src="/media/videox.mp4" type="video/mp4" />
              </video>
            </div>
            <h2 className="text-base font-semibold text-slate-900">What you can expect</h2>
            <FeatureList items={['Clear scope and transparent timelines', 'Responsive communication and updates', 'Clean delivery with modern best practices']} />
          </motion.div>
        </div>
      </section>

      {/* Services */}
      <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm md:p-12">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Any Work or Workforce Are you looking To get Your Work Done?</h2>
        <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-600">We Help You Get it Done in Minimum days With Experienced Workforce of us.</p>
        <p className="mt-5 text-sm font-semibold text-slate-900">What kind of service you are looking for?</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {services.map((s) => (
            <button key={s} type="button" onClick={() => { setSelected(s); setPulse(true); timerRef.current && clearTimeout(timerRef.current); timerRef.current = setTimeout(() => setPulse(false), 1400) }}
              className={selected === s ? 'inline-flex items-center rounded-full border border-slate-300 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-900' : 'inline-flex items-center rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs font-semibold text-slate-700'}>
              {s}
            </button>
          ))}
        </div>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link to="/enquire" className={pulse ? 'inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-sm ring-2 ring-slate-900 ring-offset-2 ring-offset-white transition' : 'inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800'}>
            Enquire Now <ArrowRight className="h-4 w-4" />
          </Link>
          {selected && <div className="text-sm text-slate-600">Selected: <span className="font-semibold text-slate-900">{selected}</span></div>}
        </div>
      </section>

      {/* Why Us */}
      <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm md:p-12">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Why Us</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Simple, transparent terms — focused on outcomes.</p>
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {[
            { title: 'On-time delivery', desc: 'Committed timelines and clear milestones.' },
            { title: 'No full advanced payment', desc: 'Work starts without demanding full payment upfront.' },
            { title: 'Industry expertise free of cost', desc: 'Consulting, planning, and guidance included.' },
            { title: 'Industry cheapest price', desc: 'If anyone matches or goes below it (verified), we will do the entire work for free.', danger: true },
          ].map((item) => (
            <div key={item.title} className="flex gap-3 rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
              <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-slate-900">
                <Shield className="h-5 w-5 text-white" />
              </span>
              <div>
                <div className="text-sm font-semibold text-slate-900">{item.title}</div>
                {item.danger ? (
                  <div className="mt-2 text-sm leading-6 text-slate-700"><span className="rounded-md bg-red-100 px-2 py-1 font-semibold text-red-700">{item.desc}</span></div>
                ) : (
                  <div className="mt-1 text-sm leading-6 text-slate-600">{item.desc}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Work */}
      <section id="work" className="space-y-10">
        <header className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Our Work</h2>
          <p className="max-w-3xl text-sm leading-6 text-slate-600">Scroll through premium case studies — enterprise systems, SaaS products, startup ventures, global brands, and transformation stories.</p>
        </header>

        {projects.map((project, idx) => {
          const swap = idx % 2 === 1
          return (
            <CardSection key={project.id}>
              <div className="grid gap-8 md:grid-cols-2 md:items-start">
                <div className={`space-y-5 ${swap ? 'md:order-2' : 'md:order-1'}`}>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>{project.badge}</Badge>
                    <Badge>THE X COMPANY</Badge>
                  </div>
                  <div>
                    <h3 className="text-2xl font-semibold tracking-tight text-slate-900">{project.title}</h3>
                    <p className="mt-1 text-sm text-slate-600">{project.subtitle}</p>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Link to="/enquire" className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800">
                      <Search className="h-4 w-4" /> Enquire For Work <ArrowRight className="h-4 w-4" />
                    </Link>
                    <Link to="/partner" className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-50">
                      <FileText className="h-4 w-4 text-slate-700" /> Partner With Us
                    </Link>
                  </div>
                </div>
                <div className={`space-y-4 ${swap ? 'md:order-1' : 'md:order-2'}`}>
                  <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
                    <h4 className="text-base font-semibold text-slate-900">What are the problems?</h4>
                    <div className="mt-4">
                      {project.problem?.length ? <FeatureList items={project.problem} /> : <p className="text-sm leading-7 text-slate-600">{project.overview}</p>}
                    </div>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
                    <h4 className="text-base font-semibold text-slate-900">What solution we built</h4>
                    <div className="mt-4"><FeatureList items={project.features} /></div>
                    {project.impact?.length && (
                      <div className="mt-6">
                        <h5 className="text-sm font-semibold text-slate-900">Impact</h5>
                        <div className="mt-3"><FeatureList items={project.impact} /></div>
                      </div>
                    )}
                    {project.recognition && (
                      <div className="mt-6">
                        <h5 className="text-sm font-semibold text-slate-900">Industry Recognition</h5>
                        <p className="mt-2 text-sm leading-7 text-slate-600">{project.recognition}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardSection>
          )
        })}
      </section>
    </div>
  )
}
