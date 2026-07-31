import React from 'react'
import { motion } from 'framer-motion'
import { BookOpen, Code2, Globe, Rocket, Sparkles, TrendingUp, Truck, Utensils, Workflow } from 'lucide-react'
import {
  ArrowRight,
  CtaBand,
  PageHero,
  PrimaryButton,
  Section,
  SectionHeading,
} from '../components/site/sections'

/* Blog & insights.

   Nothing is published yet, and this page says so.

   The earlier version implied otherwise: eight cards with `cursor-pointer`, a
   hover lift, invented reading times ("6 min read", "8 min read") and a
   "Coming soon →" that only appeared once you were already hovering. It looked
   like a blog with eight readable articles and gave you nothing on click.

   These are deliberately not FeatureGrid cards — FeatureGrid cards lift and
   highlight on hover, which is the affordance of something interactive. A list
   of unpublished titles should look inert, because it is. */

const openEnquire = () => window.dispatchEvent(new CustomEvent('open-enquire'))

const topics = [
  { icon: Sparkles, title: 'How AI is changing business operations', tag: 'AI & Automation' },
  { icon: Code2, title: 'Why custom software outperforms generic solutions', tag: 'Software' },
  { icon: Workflow, title: 'The future of business automation', tag: 'Automation' },
  { icon: Truck, title: 'How fleet analytics reduce fuel losses', tag: 'Fleet Tech' },
  { icon: Utensils, title: 'Why restaurants need digital ordering systems', tag: 'Restaurant Tech' },
  { icon: Rocket, title: 'Building scalable MVPs for startups', tag: 'Startups' },
  { icon: TrendingUp, title: 'Software trends businesses should watch', tag: 'Trends' },
  { icon: Globe, title: 'Digital transformation for growing companies', tag: 'Strategy' },
]

export default function BlogsPage() {
  return (
    <>
      <PageHero
        label="Blog & Insights"
        icon={BookOpen}
        title="Ideas, trends and"
        highlight="practical insights."
        description="We are writing about software development, AI, automation, fleet technology, restaurant systems and digital transformation."
      />

      <Section>
        <SectionHeading
          label="Not published yet"
          title="Topics we're writing about"
          description="Nothing here is readable yet — these are the pieces in progress. We would rather show you the list than fake a blog."
        />

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {topics.map((t, i) => (
            <motion.article
              key={t.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04 }}
              className="rounded-2xl border border-gray-100 bg-gray-50 p-6"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500">
                  <t.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  {t.tag}
                </span>
              </div>
              <h3 className="mb-3 text-base font-bold leading-snug text-black">{t.title}</h3>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">In progress</p>
            </motion.article>
          ))}
        </div>
      </Section>

      <CtaBand
        title="Want these in your inbox?"
        description="Tell us and we will let you know when the first pieces publish. No spam, just the articles."
      >
        <PrimaryButton onClick={openEnquire}>
          Get in touch <ArrowRight className="h-4 w-4" />
        </PrimaryButton>
      </CtaBand>
    </>
  )
}
