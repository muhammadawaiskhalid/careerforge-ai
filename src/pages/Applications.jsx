import { motion } from "motion/react"
import { Sparkles } from "lucide-react"

import OpportunityPipeline from "../components/ui/OpportunityPipeline"

function Applications() {
  return (
    <section className="applications-page">
      <motion.header
        className="page-intro"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55 }}
      >
        <div>
          <span className="eyebrow">
            <Sparkles size={15} />
            Opportunity Pipeline
          </span>

          <h1>Applications</h1>

          <p>
            Keep every opportunity moving and know exactly where your career
            search stands.
          </p>
        </div>
      </motion.header>

      <OpportunityPipeline />
    </section>
  )
}

export default Applications