import React from 'react'
import { motion } from 'framer-motion'
import { Check, X } from 'lucide-react'

export default function Roles() {
  return (
    <section id="roles" className="py-24 md:py-32">
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
            Purpose-built{' '}
            <span className="italic text-primary">access control</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Collaborate externally without compromising security. Granular roles ensure every stakeholder sees exactly what they need to, and absolutely nothing they shouldn't.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* External Partners */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            viewport={{ once: true }}
            className="rounded-3xl border border-border/50 p-8 flex flex-col"
          >
            <div className="mb-6">
              <span className="inline-block px-3 py-1 rounded-full bg-muted text-sm font-medium mb-4">External Partners</span>
              <h3 className="text-2xl font-bold mb-2">Partner Portal</h3>
              <p className="text-muted-foreground">A dedicated, restricted-view environment for clients, auditors, or external agencies.</p>
            </div>

            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-3">
                <Check className="w-4 h-4 text-emerald-500" />
                <span className="text-sm">View explicitly shared files</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="w-4 h-4 text-emerald-500" />
                <span className="text-sm">Download permitted docs</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="w-4 h-4 text-emerald-500" />
                <span className="text-sm">Access assigned meetings</span>
              </div>
              <div className="flex items-center gap-3">
                <X className="w-4 h-4 text-muted-foreground/50" />
                <span className="text-sm text-muted-foreground">Edit documents</span>
              </div>
              <div className="flex items-center gap-3">
                <X className="w-4 h-4 text-muted-foreground/50" />
                <span className="text-sm text-muted-foreground">View financials & KPIs</span>
              </div>
            </div>
          </motion.div>

          {/* Internal Team - Featured */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            viewport={{ once: true }}
            className="rounded-3xl border border-primary bg-primary/5 shadow-2xl shadow-primary/5 p-8 flex flex-col relative"
          >
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-primary-foreground text-sm font-medium rounded-full">
              Most Common
            </div>

            <div className="mb-6">
              <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">Internal Team</span>
              <h3 className="text-2xl font-bold mb-2">Manager View</h3>
              <p className="text-muted-foreground">Operational access to keep the business moving, with guardrails around sensitive data.</p>
            </div>

            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-3">
                <Check className="w-4 h-4 text-emerald-500" />
                <span className="text-sm">Full read/write on assigned folders</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="w-4 h-4 text-emerald-500" />
                <span className="text-sm">Manage meeting notes</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="w-4 h-4 text-emerald-500" />
                <span className="text-sm">View department dashboards</span>
              </div>
              <div className="flex items-center gap-3">
                <X className="w-4 h-4 text-muted-foreground/50" />
                <span className="text-sm text-muted-foreground">Change system settings</span>
              </div>
              <div className="flex items-center gap-3">
                <X className="w-4 h-4 text-muted-foreground/50" />
                <span className="text-sm text-muted-foreground">Modify global RBAC policies</span>
              </div>
            </div>
          </motion.div>

          {/* Leadership & Operations */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            viewport={{ once: true }}
            className="rounded-3xl border border-border/50 p-8 flex flex-col"
          >
            <div className="mb-6">
              <span className="inline-block px-3 py-1 rounded-full bg-muted text-sm font-medium mb-4">Leadership & Operations</span>
              <h3 className="text-2xl font-bold mb-2">Admin Command</h3>
              <p className="text-muted-foreground">Total visibility and control over the entire organization's digital infrastructure.</p>
            </div>

            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-3">
                <Check className="w-4 h-4 text-emerald-500" />
                <span className="text-sm">Unrestricted file access</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="w-4 h-4 text-emerald-500" />
                <span className="text-sm">Global financial dashboards</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="w-4 h-4 text-emerald-500" />
                <span className="text-sm">Manage users and roles</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="w-4 h-4 text-emerald-500" />
                <span className="text-sm">Access full audit logs</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="w-4 h-4 text-emerald-500" />
                <span className="text-sm">System configuration</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}