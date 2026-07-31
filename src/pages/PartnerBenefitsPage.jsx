import React from 'react'
import { Briefcase, DollarSign, Handshake, Shield, Star, TrendingUp, Users } from 'lucide-react'
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

/* Partner benefits.

   Structurally this page was byte-for-byte the same as Work Benefits — same
   hero, same six-card grid, same CTA band — with different copy. Both now share
   the primitives, so the two pages cannot drift apart again. */

const benefits = [
  {
    icon: TrendingUp,
    title: 'Revenue sharing',
    desc: 'Earn a share of project revenue generated through your referrals and partnerships.',
  },
  {
    icon: Shield,
    title: 'Priority support',
    desc: 'Dedicated account management and priority on project timelines.',
  },
  {
    icon: Users,
    title: 'Network access',
    desc: 'Access our growing network of businesses, startups and industry contacts.',
  },
  {
    icon: Briefcase,
    title: 'Co-branded projects',
    desc: 'Work on co-branded projects and build your portfolio alongside ours.',
  },
  {
    icon: Star,
    title: 'Early access',
    desc: 'First look at new products, features and business opportunities.',
  },
  {
    icon: DollarSign,
    title: 'Investment opportunities',
    desc: 'Participate in investment rounds and share in the company’s growth.',
  },
]

export default function PartnerBenefitsPage() {
  return (
    <>
      <PageHero
        label="Why Partner"
        icon={Handshake}
        title="Partner with"
        highlight="excompany."
        description="Transparent terms, shared success and real growth opportunities — for referral partners, collaborators and investors."
      >
        <PrimaryButton to="/partner">
          Become a partner <ArrowRight className="h-4 w-4" />
        </PrimaryButton>
        <SecondaryButton to="/about">About us</SecondaryButton>
      </PageHero>

      <Section>
        <SectionHeading label="What partners get" title="Six reasons to work with us" />
        <FeatureGrid items={benefits} />
      </Section>

      <CtaBand
        title="Ready to partner?"
        description="Send us your details and we will get back to you with how a partnership could work."
      >
        <PrimaryButton to="/partner">
          <Handshake className="h-4 w-4" /> Submit partnership interest
        </PrimaryButton>
      </CtaBand>
    </>
  )
}
