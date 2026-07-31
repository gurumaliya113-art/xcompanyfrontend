import React from 'react'
import { Code2, Globe, Sparkles, Truck, Utensils, Workflow } from 'lucide-react'
import {
  ArrowRight,
  CtaBand,
  FeatureGrid,
  PageHero,
  PrimaryButton,
  SecondaryButton,
  Section,
} from '../components/site/sections'

/* What we build.

   Content is unchanged. The hero, the six-card grid and the closing band were
   hand-written here; they are now the shared primitives, which is what removes
   the last of the per-page chrome and lets the `bge-site` theme scope go. */

const openEnquire = () => window.dispatchEvent(new CustomEvent('open-enquire'))

const solutions = [
  {
    icon: Globe,
    title: 'Custom website development',
    desc: 'Business websites, startup landing pages, corporate sites and scalable web platforms — engineered for speed, conversions and search visibility.',
    points: ['SEO-optimised architecture', 'Conversion-focused UX', 'Lightning-fast load times'],
  },
  {
    icon: Code2,
    title: 'Custom software development',
    desc: 'Businesses outgrow spreadsheets fast. We build CRM systems, ERP tools, dashboards and internal management platforms around your actual operations.',
    points: ['CRM & ERP systems', 'Internal dashboards', 'Workflow automation'],
  },
  {
    icon: Sparkles,
    title: 'AI solutions & automation',
    desc: 'OCR systems, AI analytics, automated reporting and intelligent workflows that cut repetitive work and improve decision making.',
    points: ['OCR & document AI', 'Predictive analytics', 'Automated reporting'],
  },
  {
    icon: Truck,
    title: 'Fleet management',
    desc: 'GPS tracking, fuel analytics, driver behaviour monitoring, diagnostics, geofencing and maintenance alerts in one dashboard.',
    points: ['Real-time GPS tracking', 'Fuel & maintenance analytics', 'Driver behaviour reports'],
  },
  {
    icon: Utensils,
    title: 'Restaurant systems',
    desc: 'QR ordering, token systems, kitchen displays, inventory tracking, staff management and multi-outlet monitoring for modern food businesses.',
    points: ['QR & token ordering', 'Kitchen display systems', 'Multi-outlet dashboards'],
  },
  {
    icon: Workflow,
    title: 'Business automation',
    desc: 'Attendance systems, reporting automation, operational tracking and accounting tools that remove manual work.',
    points: ['Attendance & HR systems', 'Accounting tools', 'Operational tracking'],
  },
]

export default function SolutionsPage() {
  return (
    <>
      <PageHero
        label="Our Solutions"
        icon={Sparkles}
        title="Software that solves"
        highlight="real business problems."
        description="We build systems, websites, AI tools and automation designed to fix operational problems and help companies scale — not to look impressive in a demo."
      >
        <PrimaryButton onClick={openEnquire}>
          Talk to our team <ArrowRight className="h-4 w-4" />
        </PrimaryButton>
        <SecondaryButton to="/portfolio">See our work</SecondaryButton>
      </PageHero>

      <Section>
        <FeatureGrid items={solutions} />
      </Section>

      <CtaBand
        tone="dark"
        title="Technology should increase efficiency and create"
        highlight="measurable growth."
        description="Tell us your operational challenge and we will design a system around your business."
      >
        <PrimaryButton onClick={openEnquire}>
          Talk to our team <ArrowRight className="h-4 w-4" />
        </PrimaryButton>
      </CtaBand>
    </>
  )
}
