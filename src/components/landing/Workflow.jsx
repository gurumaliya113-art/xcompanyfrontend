import React from 'react'
import { motion } from 'framer-motion'
import { Database, LayoutGrid, Zap } from 'lucide-react'

export default function Workflow() {
  return (
    <section className="py-24 bg-card border-y border-border/50 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px]" />
      </div>

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
            From chaos to{' '}
            <span className="italic text-primary">command center</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            The transformation is profound but the path is simple. We engineered DCE to replace operational friction with absolute clarity.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 lg:gap-12 relative">
          {/* Connector line */}
          <div className="absolute top-12 left-1/6 right-1/6 h-0.5 bg-border/50 hidden md:block -z-10" />

          {/* Step 1 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            viewport={{ once: true }}
            className="text-center"
          >
            <div className="relative mb-6">
              <div className="w-24 h-24 rounded-full bg-background border shadow-xl flex items-center justify-center mx-auto hover-elevate">
                <Database className="w-8 h-8 text-primary" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                1
              </div>
              <div className="absolute inset-0 w-24 h-24 rounded-full bg-primary/5 blur-2xl -z-10" />
            </div>
            <h3 className="text-xl font-bold mb-3">Consolidate</h3>
            <p className="text-muted-foreground max-w-xs mx-auto">
              Connect your scattered systems, file drives, and ad-hoc spreadsheets into a single, unified data lake.
            </p>
          </motion.div>

          {/* Step 2 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            viewport={{ once: true }}
            className="text-center"
          >
            <div className="relative mb-6">
              <div className="w-24 h-24 rounded-full bg-background border shadow-xl flex items-center justify-center mx-auto hover-elevate">
                <LayoutGrid className="w-8 h-8 text-primary" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                2
              </div>
              <div className="absolute inset-0 w-24 h-24 rounded-full bg-primary/5 blur-2xl -z-10" />
            </div>
            <h3 className="text-xl font-bold mb-3">Structure</h3>
            <p className="text-muted-foreground max-w-xs mx-auto">
              Apply intelligent taxonomies, granular RBAC policies, and folder hierarchies that match your operational reality.
            </p>
          </motion.div>

          {/* Step 3 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            viewport={{ once: true }}
            className="text-center"
          >
            <div className="relative mb-6">
              <div className="w-24 h-24 rounded-full bg-background border shadow-xl flex items-center justify-center mx-auto hover-elevate">
                <Zap className="w-8 h-8 text-primary" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                3
              </div>
              <div className="absolute inset-0 w-24 h-24 rounded-full bg-primary/5 blur-2xl -z-10" />
            </div>
            <h3 className="text-xl font-bold mb-3">Operate</h3>
            <p className="text-muted-foreground max-w-xs mx-auto">
              Drive decisions from a single source of truth. Real-time financials, secure partner access, and unshakeable audit trails.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  )
}