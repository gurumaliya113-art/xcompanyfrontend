import React from 'react'
import { motion } from 'framer-motion'

const metrics = [
  { value: '78%', label: 'Reduction in time spent searching for files & documents' },
  { value: '40hrs', label: 'Saved per month per operations manager' },
  { value: '100%', label: 'Audit compliance and traceability for sensitive data' },
  { value: '<2s', label: 'Average time to retrieve any historical company record' }
]

export default function Metrics() {
  return (
    <section className="py-20 border-y border-border/50 bg-card">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid lg:grid-cols-4 gap-8 md:gap-12">
          {metrics.map((metric, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
              viewport={{ once: true }}
              className={`text-center ${index > 0 ? 'md:pl-12 md:border-l md:border-border/50' : ''}`}
            >
              <div
                className="text-5xl md:text-6xl font-bold tracking-tighter mb-3"
                style={{ fontFamily: 'var(--app-font-serif)' }}
              >
                {metric.value}
              </div>
              <div className="text-sm text-muted-foreground max-w-xs mx-auto">
                {metric.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}