import React from 'react'
import { motion } from 'framer-motion'

const testimonials = [
  {
    quote: "Before DCE, our partner onboarding took weeks of emailing sensitive PDFs back and forth. Now, we provision a secure portal in 30 seconds. The audit trail alone justifies the investment.",
    author: "Sarah Jenkins",
    role: "Managing Partner, Omni Capital",
    initials: "SJ"
  },
  {
    quote: "We were using five different tools to manage operations, finance, and client meetings. DCE consolidated all of it into a single pane of glass. It's fundamentally changed how our leadership team operates.",
    author: "Marcus Chen",
    role: "Chief Operating Officer, Stratos",
    initials: "MC"
  },
  {
    quote: "The version control and granular RBAC are exceptional. I never worry about an external auditor or junior analyst seeing the wrong financial projection again.",
    author: "Elena Rodriguez",
    role: "CFO, Lumina Global",
    initials: "ER"
  }
]

export default function Testimonials() {
  return (
    <section className="py-24 bg-card border-y border-border/50 relative">
      {/* Background pattern */}
      <div
        className="absolute inset-0 opacity-50"
        style={{
          backgroundImage: `linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)`,
          backgroundSize: '24px 24px'
        }}
      />

      <div className="container mx-auto px-4 md:px-6 relative">
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
              viewport={{ once: true }}
              className="rounded-2xl border border-border/50 p-8 bg-background shadow-lg"
            >
              <div className="text-primary/40 text-4xl mb-4" style={{ fontFamily: 'var(--app-font-serif)' }}>
                "
              </div>
              <p className="text-sm md:text-base mb-6 leading-relaxed">
                {testimonial.quote}
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                  {testimonial.initials}
                </div>
                <div>
                  <div className="font-semibold">{testimonial.author}</div>
                  <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}