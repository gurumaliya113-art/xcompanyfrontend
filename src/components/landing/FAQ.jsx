import React from 'react'
import { motion } from 'framer-motion'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion"

const faqs = [
  {
    question: "Where is my data hosted, and who owns it?",
    answer: "Your data is hosted on enterprise-grade AWS infrastructure with geographical redundancy. You retain 100% ownership of your data at all times. DCE acts strictly as a data processor. All data is encrypted at rest using AES-256."
  },
  {
    question: "How does the Partner Access Portal work?",
    answer: "The Partner Portal allows you to create highly restricted environments for external stakeholders. They receive a separate login and can only view or download files, folders, or meeting notes that you explicitly assign to them. They cannot see your internal folder structures or other partners."
  },
  {
    question: "Can we migrate our existing files from Google Drive or SharePoint?",
    answer: "Yes. Our onboarding team provides white-glove migration services to securely transfer your existing folder structures, files, and metadata into DCE while preserving integrity and setting up initial RBAC policies."
  },
  {
    question: "What is the AI roadmap?",
    answer: "We are currently beta-testing an AI-powered semantic search module that allows you to query your entire document base conceptually (e.g., \"What were the key risks identified in the Q2 partner meeting?\"). This will be rolling out to Enterprise customers later this year."
  },
  {
    question: "How long does it take to deploy?",
    answer: "Standard deployment for Starter and Growth tiers takes under 48 hours. Enterprise deployments requiring custom integrations, SSO setup, and large-scale data migrations typically take 2-4 weeks with a dedicated Success Manager."
  }
]

export default function FAQ() {
  return (
    <section className="py-24">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid lg:grid-cols-2 gap-16 max-w-6xl items-start">
          {/* Left column */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <h2
              className="text-4xl md:text-5xl font-bold tracking-tight"
              style={{ fontFamily: 'var(--app-font-serif)' }}
            >
              Questions about{' '}
              <span className="italic text-primary">deployment</span>?
            </h2>
            <p className="text-lg text-muted-foreground">
              We understand that migrating your core operational data is a significant decision. Here are answers to our most common operational and security questions.
            </p>

            {/* Help card */}
            <div className="p-6 rounded-2xl bg-muted/50 border border-border/50">
              <h3 className="font-semibold mb-2">Still need answers?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Our security team is available to complete vendor risk assessments and compliance questionnaires.
              </p>
              <a
                href="#contact"
                className="text-primary hover:underline font-medium"
              >
                Contact our Security Team →
              </a>
            </div>
          </motion.div>

          {/* Right column */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            viewport={{ once: true }}
          >
            <Accordion type="single" collapsible className="bg-card border rounded-2xl p-2 shadow-sm">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="border-b border-border/50 last:border-b-0">
                  <AccordionTrigger className="px-6 py-4 text-left font-semibold hover:text-primary hover:no-underline">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4 text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </div>
    </section>
  )
}