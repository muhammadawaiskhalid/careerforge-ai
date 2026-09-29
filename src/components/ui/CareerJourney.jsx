import { motion } from "motion/react"
import {
  Bookmark,
  Send,
  MessagesSquare,
  Trophy,
} from "lucide-react"

function CareerJourney({ applications }) {
  const stages = [
    {
      label: "Saved",
      value: applications?.saved ?? 0,
      icon: Bookmark,
    },
    {
      label: "Applied",
      value: applications?.applied ?? 0,
      icon: Send,
    },
    {
      label: "Interview",
      value: applications?.interview ?? 0,
      icon: MessagesSquare,
    },
    {
      label: "Offer",
      value: applications?.offer ?? 0,
      icon: Trophy,
    },
  ]

  return (
    <motion.section
      className="journey-panel"
      initial={{ opacity: 0, y: 35 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.65 }}
    >
      <div className="panel-heading">
        <div>
          <span className="section-kicker">
            Application Journey
          </span>

          <h2>Momentum across your search.</h2>
        </div>

        <span className="period-label">
          Current pipeline
        </span>
      </div>

      <div className="journey-track">
        <div className="journey-line">
          <motion.span
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{
              duration: 1.1,
              delay: 0.35,
            }}
          />
        </div>

        {stages.map((stage, index) => {
          const Icon = stage.icon

          return (
            <motion.div
              className="journey-stage"
              key={stage.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.45,
                delay: 0.2 + index * 0.12,
              }}
            >
              <div className="journey-node">
                <Icon size={18} />
              </div>

              <strong>{stage.value}</strong>
              <span>{stage.label}</span>
            </motion.div>
          )
        })}
      </div>
    </motion.section>
  )
}

export default CareerJourney