import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { ArrowRight, Sparkles } from "lucide-react"

export default function CTA() {
  const navigate = useNavigate()
  return (
    <section className="py-24 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center max-w-4xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8">
            <Sparkles className="w-4 h-4" />
            Ready to transform your data operations?
          </div>

          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Start Your Data Centre of Excellence Journey Today
          </h2>

          <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
            Join leading organizations that have revolutionized their data management with our comprehensive platform.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={() => navigate('/dce/dashboard')} className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors group">
              Explore Platform
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <button className="inline-flex items-center gap-2 px-8 py-4 border border-border rounded-lg font-semibold hover:bg-muted/50 transition-colors">
              Schedule Demo
            </button>
          </div>

          <p className="text-sm text-muted-foreground mt-8">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </motion.div>
      </div>
    </section>
  )
}