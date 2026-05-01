import React from 'react'
import { motion } from 'framer-motion'
import { FolderTree, FileText, Search, Lock, Users, History, Link, CheckCircle } from 'lucide-react'

export default function Features() {
  return (
    <section id="features" className="py-24 md:py-32">
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
            Everything required to run a{' '}
            <span className="italic text-primary">complex organization</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Stop stitching together generic tools. DCE provides purpose-built modules that integrate seamlessly, creating a unified operating environment for your entire team.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24">
          {/* DMS Feature */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <div className="space-y-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <FolderTree className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-4">Enterprise Document Management</h3>
                <p className="text-muted-foreground mb-6">
                  A structured, highly organized vault for all accounting files, contracts, and PDFs. Maintain absolute version control, powerful search, and granular access rights.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <History className="w-4 h-4 text-primary" />
                    <span className="text-sm">Infinite version history (old vs new)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Search className="w-4 h-4 text-primary" />
                    <span className="text-sm">Full-text search & metadata filtering</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Lock className="w-4 h-4 text-primary" />
                    <span className="text-sm">Sensitive-file protection</span>
                  </div>
                </div>
              </div>
              <button className="flex items-center gap-2 px-6 py-3 rounded-full border border-border bg-background hover:bg-muted/50 transition-colors">
                Explore DMS →
              </button>
            </div>

            {/* DMS Mockup */}
            <div className="relative">
              <div className="absolute inset-0 bg-primary/5 rounded-3xl blur-2xl -z-10" />
              <div className="rounded-2xl border border-border/50 bg-card p-6 shadow-xl">
                <div className="flex items-center gap-3 mb-4">
                  <FolderTree className="w-5 h-5 text-primary" />
                  <span className="font-semibold">Legal & Compliance / 2024 / Q1</span>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-2xl border border-primary/20 bg-primary/5">
                    <div>
                      <div className="font-semibold text-sm">Master_Service_Agreement_v3.pdf</div>
                      <div className="text-xs text-muted-foreground">2.4 MB • Today, 09:41</div>
                    </div>
                    <span className="px-2 py-1 bg-primary text-primary-foreground text-xs rounded-full font-medium">Current</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-2xl border border-border/50 bg-muted/30">
                    <div>
                      <div className="font-semibold text-sm text-muted-foreground">Master_Service_Agreement_v2.pdf</div>
                      <div className="text-xs text-muted-foreground">2.4 MB • Yesterday</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-2xl border border-border/50 bg-muted/30">
                    <div>
                      <div className="font-semibold text-sm text-muted-foreground">Master_Service_Agreement_v1.pdf</div>
                      <div className="text-xs text-muted-foreground">2.1 MB • Jan 12, 2024</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-2xl border border-border/50 bg-muted/30">
                    <div>
                      <div className="font-semibold text-sm text-muted-foreground">Compliance_Checklist_Q1.xlsx</div>
                      <div className="text-xs text-muted-foreground">845 KB • Jan 10, 2024</div>
                    </div>
                    <span className="px-2 py-1 bg-primary text-primary-foreground text-xs rounded-full font-medium">Current</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Meetings Feature */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            viewport={{ once: true }}
            className="space-y-8 lg:order-first"
          >
            <div className="space-y-6">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-4">Meeting Management</h3>
                <p className="text-muted-foreground mb-6">
                  Transform meetings from forgotten conversations into structured historical data. Centralize links, collaborative notes, and accountable action items.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-blue-500" />
                    <span className="text-sm">Collaborative meeting notes</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Users className="w-4 h-4 text-blue-500" />
                    <span className="text-sm">Trackable action items & assignees</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <History className="w-4 h-4 text-blue-500" />
                    <span className="text-sm">Full searchable meeting history</span>
                  </div>
                </div>
              </div>
              <button className="flex items-center gap-2 px-6 py-3 rounded-full border border-border bg-background hover:bg-muted/50 transition-colors">
                Explore Meetings →
              </button>
            </div>

            {/* Meetings Mockup */}
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500/5 rounded-3xl blur-2xl -z-10" />
              <div className="rounded-2xl border border-border/50 bg-card p-6 shadow-xl">
                <div className="flex items-center gap-3 mb-4">
                  <Users className="w-5 h-5 text-primary" />
                  <span className="font-semibold">Q3 Strategy Alignment</span>
                  <span className="ml-auto px-3 py-1 bg-emerald-500/10 text-emerald-500 text-sm rounded-full font-medium">Completed</span>
                </div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold">U1</div>
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-xs font-bold">U2</div>
                  <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-xs font-bold">U3</div>
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-xs font-bold">U4</div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5" />
                    <span className="text-sm line-through text-muted-foreground">Finalize budget allocations for engineering team</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-4 h-4 rounded border-2 border-primary mt-0.5" />
                    <span className="text-sm">Review Q2 partner feedback</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}