import React from 'react'
import {
  Briefcase,
  Building2,
  Factory,
  HeartPulse,
  Recycle,
  Rocket,
  ShoppingBag,
  Truck,
  Utensils,
} from 'lucide-react'
import {
  ArrowRight,
  CtaBand,
  FeatureGrid,
  PageHero,
  PrimaryButton,
  SecondaryButton,
  Section,
} from '../components/site/sections'

/* Industries we serve.

   One substantive design change beyond the shared primitives: each card used to
   carry its own gradient — blue, orange, green, pink, purple, slate, red, amber —
   and filled the whole card with it on hover. Eight accent colours on a site with
   one, and the gradient made the card's text switch to white mid-interaction.

   The colour was decorative: it carried no information, because nothing about
   "Healthcare" is red or "Startups" purple. Removed in favour of the same card
   treatment every other grid on the site uses, so the eye reads the content
   instead of the palette.
*/

const openEnquire = () => window.dispatchEvent(new CustomEvent('open-enquire'))

const industries = [
  {
    icon: Truck,
    title: 'Logistics & transportation',
    desc: 'Fleet monitoring, GPS tracking, fuel management, maintenance analytics and operational dashboards.',
  },
  {
    icon: Utensils,
    title: 'Restaurants & food',
    desc: 'Ordering systems, kitchen workflows, token management, analytics and remote monitoring.',
  },
  {
    icon: Recycle,
    title: 'Scrap & recycling',
    desc: 'Collection networks, supplier management, aggregation operations, inventory tracking and marketplaces.',
  },
  {
    icon: ShoppingBag,
    title: 'Retail',
    desc: 'Billing systems, inventory management, customer analytics and operational automation.',
  },
  {
    icon: Rocket,
    title: 'Startups',
    desc: 'Rapid MVP development, scalable web platforms and technology built to accelerate growth.',
  },
  {
    icon: Building2,
    title: 'Enterprises',
    desc: 'Internal software, dashboards, workflow automation and large-scale digital transformation.',
  },
  {
    icon: HeartPulse,
    title: 'Healthcare',
    desc: 'Operational systems, workflow management, automation tools and analytics.',
  },
  {
    icon: Factory,
    title: 'Manufacturing',
    desc: 'Production tracking, reporting systems, inventory management and efficiency monitoring.',
  },
]

export default function IndustriesPage() {
  return (
    <>
      <PageHero
        label="Industries We Serve"
        icon={Briefcase}
        title="Industry-specific software,"
        highlight="not generic templates."
        description="We build around operational realities. Every system understands the specific workflows of the industry it runs in."
      >
        <PrimaryButton onClick={openEnquire}>
          Discuss your project <ArrowRight className="h-4 w-4" />
        </PrimaryButton>
        <SecondaryButton to="/solutions">What we build</SecondaryButton>
      </PageHero>

      <Section>
        <FeatureGrid items={industries} />
      </Section>

      <CtaBand
        title="Don't see your industry?"
        highlight="Talk to us anyway."
        description="We have built systems across many sectors. If you have an operational problem, there is a good chance we can solve it."
      >
        <PrimaryButton onClick={openEnquire}>
          Discuss your project <ArrowRight className="h-4 w-4" />
        </PrimaryButton>
      </CtaBand>
    </>
  )
}
