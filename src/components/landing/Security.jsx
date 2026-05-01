import React from 'react'
import { motion } from 'framer-motion'
import { Shield, CheckCircle2, Search, UploadCloud, ShieldCheck } from 'lucide-react'

export default function Security() {
  return (
    <section id="security" className="py-24 bg-card border-y border-border/50 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none -z-10" />

      <div className="container mx-auto px-4 md:px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left column */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-primary" />
              <span className="text-sm font-medium text-primary">Security & Compliance</span>
            </div>
            <h2
              className="text-4xl md:text-5xl font-bold tracking-tight"
              style={{ fontFamily: 'var(--app-font-serif)' }}
            >
              Engineered for absolute{' '}
              <span className="italic text-primary">data sovereignty</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              When your data is your most valuable asset, "good enough" security isn't enough. DCE is built from the ground up to exceed the compliance requirements of highly regulated industries.
            </p>

            {/* Credentials grid */}
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Bank-Grade Encryption</h4>
                  <p className="text-sm text-muted-foreground">AES-256 at rest and TLS 1.3 in transit</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Audit-Ready Logs</h4>
                  <p className="text-sm text-muted-foreground">Immutable records of who accessed what and when</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Search className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Granular RBAC</h4>
                  <p className="text-sm text-muted-foreground">Precise permissions down to the individual file level</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <UploadCloud className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Auto Cloud Backup</h4>
                  <p className="text-sm text-muted-foreground">Continuous geographic redundancy and failsafes</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right column - Audit Log Terminal */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="rounded-2xl border border-border/50 bg-background/80 backdrop-blur p-8 shadow-2xl font-mono text-xs md:text-sm text-muted-foreground">
              {/* Terminal header */}
              <div className="flex items-center gap-2 mb-6">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="ml-4 font-sans">system_audit.log</span>
              </div>

              {/* Log entries */}
              <div className="space-y-2">
                <div className="flex gap-4">
                  <span className="text-emerald-500">14:02:11</span>
                  <span className="text-blue-400">[AUTH]</span>
                  <span>Validated MFA token for user_id: 8992</span>
                </div>
                <div className="flex gap-4">
                  <span className="text-emerald-500">14:02:15</span>
                  <span className="text-purple-400">[RBAC]</span>
                  <span>Session established. Role: MANAGER</span>
                </div>
                <div className="flex gap-4">
                  <span className="text-emerald-500">14:03:42</span>
                  <span className="text-orange-400">[FILE]</span>
                  <span>READ access granted: Q3_Financials.pdf</span>
                </div>
                <div className="flex gap-4">
                  <span className="text-emerald-500">14:04:10</span>
                  <span className="text-red-400">[FILE]</span>
                  <span>WRITE blocked: Strategic_Plan.docx (Insufficient privileges)</span>
                </div>
                <div className="flex gap-4">
                  <span className="text-emerald-500">14:05:00</span>
                  <span className="text-cyan-400">[SYNC]</span>
                  <span>Encrypted payload dispatched to backup node us-east-1</span>
                </div>
                <div className="flex gap-4">
                  <span className="text-emerald-500">14:05:01</span>
                  <span className="text-cyan-400">[SYNC]</span>
                  <span>Verification hash matched: SHA256</span>
                </div>
              </div>

              {/* Pulsing prompt */}
              <div className="mt-6 flex items-center gap-1">
                <span className="text-primary">_</span>
                <span className="animate-pulse">Awaiting incoming events....</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}