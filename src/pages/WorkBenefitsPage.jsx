import React from 'react'
import { Award, Briefcase, Clock, DollarSign, Rocket, Shield, Users } from 'lucide-react'
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

/* Why work with us.

   Rewritten on the shared marketing primitives. The previous version carried
   its own hero markup, its own card markup and a `bg-slate-900` CTA — the site
   accent is orange, and it also called the company "The X Company" while every
   other page says "excompany". Same content, one design language, roughly a
   third of the markup. */

const benefits = [
  {
    icon: Clock,
    title: 'On-time delivery',
    desc: 'We commit to clear timelines and deliver on schedule — every single project.',
  },
  {
    icon: DollarSign,
    title: 'Industry cheapest price',
    desc: 'If anyone matches or goes below our price (verified), we do the entire work for free.',
  },
  {
    icon: Shield,
    title: 'No full advance payment',
    desc: 'Work begins without demanding payment upfront. You pay as milestones are completed.',
  },
  {
    icon: Users,
    title: 'Expert workforce',
    desc: 'Experienced people across development, design, marketing and operations.',
  },
  {
    icon: Rocket,
    title: 'Fast turnaround',
    desc: 'We prioritise speed without compromising quality — minimum days, maximum impact.',
  },
  {
    icon: Award,
    title: 'Free consulting',
    desc: 'Industry expertise, planning and guidance included at no extra cost.',
  },
]

export default function WorkBenefitsPage() {
  return (
    <>
      <PageHero
        label="Work Benefits"
        icon={Briefcase}
        title="Why get your work"
        highlight="done with us."
        description="Simple, transparent terms. No hidden charges. Focused on outcomes and on your satisfaction."
      >
        <PrimaryButton to="/enquire">
          Start a project <ArrowRight className="h-4 w-4" />
        </PrimaryButton>
        <SecondaryButton to="/contact">Get in touch</SecondaryButton>
      </PageHero>

      <Section>
        <SectionHeading label="What you get" title="Six commitments we hold ourselves to" />
        <FeatureGrid items={benefits} />
      </Section>

      <CtaBand
        title="Ready to start?"
        description="Tell us about your project and we will come back with a plan, a timeline and transparent pricing."
      >
        <PrimaryButton to="/enquire">
          Enquire now <ArrowRight className="h-4 w-4" />
        </PrimaryButton>
        <SecondaryButton href="tel:+918053317489">Call +91 80533 17489</SecondaryButton>
      </CtaBand>
    </>
  )
}
