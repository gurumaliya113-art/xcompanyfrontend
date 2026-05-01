import React from 'react'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'

const plans = [
  {
    name: 'Starter',
    tagline: 'For small teams establishing operational baseline.',
    price: '$499',
    period: 'month',
    features: [
      'Up to 10 internal users',
      'Document Management System',
      'Basic Financial Dashboard',
      'Standard RBAC',
      '1TB Secure Storage'
    ],
    featured: false
  },
  {
    name: 'Growth',
    tagline: 'For scaling organizations with complex partner ecosystems.',
    price: '$1,299',
    period: 'month',
    features: [
      'Up to 50 internal users',
      'Unlimited Partner Portal access',
      'Advanced Analytics & KPIs',
      'Meeting Management',
      'Full Audit Logs',
      '5TB Secure Storage'
    ],
    featured: true
  },
  {
    name: 'Enterprise',
    tagline: '',
    price: 'Custom',
    period: '',
    features: [
      'Unlimited users',
      'Custom deployment & SLA',
      'Dedicated Success Manager',
      'Advanced AI Search (Beta)',
      'API Access',
      'Unlimited Storage'
    ],
    featured: false
  }
]

export default function Pricing() {
  return (
    <section id="pricing" className="py-24">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h2
            className="text-4xl md:text-5xl font-bold tracking-tight mb-6"
            style={{ fontFamily: 'var(--app-font-serif)' }}
          >
            Transparent{' '}
            <span className="italic text-primary">investment</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Enterprise software shouldn't require a crystal ball to price. Choose the tier that matches your operational maturity.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
              viewport={{ once: true }}
              className={`rounded-3xl border p-8 flex flex-col ${
                plan.featured
                  ? 'border-primary bg-primary/5 shadow-2xl shadow-primary/10'
                  : 'border-border/50'
              }`}
            >
              {plan.featured && (
                <div className="text-center mb-6">
                  <span className="inline-block px-3 py-1 bg-primary text-primary-foreground text-sm font-medium rounded-full">
                    Recommended
                  </span>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                {plan.tagline && (
                  <p className="text-muted-foreground mb-6 h-10 flex items-center justify-center">
                    {plan.tagline}
                  </p>
                )}
                <div className="mb-6">
                  <span className="text-4xl font-bold tracking-tight">{plan.price}</span>
                  {plan.period && <span className="text-muted-foreground">/{plan.period}</span>}
                </div>
              </div>

              <div className="space-y-4 flex-1 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <div key={featureIndex} className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              <button
                className={`w-full h-12 rounded-full font-semibold transition-all duration-200 ${
                  plan.featured
                    ? 'bg-primary text-primary-foreground shadow-lg hover:bg-primary/90'
                    : 'border border-border bg-background hover:bg-muted/50'
                }`}
              >
                Contact Sales
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}