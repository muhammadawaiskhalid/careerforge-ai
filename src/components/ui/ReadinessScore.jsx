import { motion } from "motion/react"
import { ArrowUpRight, Sparkles } from "lucide-react"

function ReadinessScore({ score = 0 }) {
  const safeScore = Math.max(
    0,
    Math.min(100, Number(score) || 0),
  )

  const radius = 76
  const circumference = 2 * Math.PI * radius
  const offset =
    circumference -
    (safeScore / 100) * circumference

  function getStatus() {
    if (safeScore >= 80) return "Strong alignment"
    if (safeScore >= 60) return "Good alignment"
    if (safeScore >= 40) return "Developing alignment"
    if (safeScore > 0) return "Needs improvement"

    return "Not analyzed yet"
  }

  return (
    <motion.article
      className="readiness-panel intelligence-panel"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.6 }}
    >
      <div className="intelligence-label">
        <Sparkles size={15} />
        AI Job Alignment
      </div>

      <div className="score-content">
        <div className="score-ring">
          <svg viewBox="0 0 180 180">
            <circle
              className="score-track"
              cx="90"
              cy="90"
              r={radius}
            />

            <motion.circle
              className="score-progress"
              cx="90"
              cy="90"
              r={radius}
              initial={{
                strokeDashoffset: circumference,
              }}
              whileInView={{
                strokeDashoffset: offset,
              }}
              viewport={{ once: true }}
              transition={{
                duration: 1.4,
                delay: 0.25,
                ease: "easeOut",
              }}
              style={{
                strokeDasharray: circumference,
              }}
            />
          </svg>

          <div className="score-number">
            <motion.strong
              initial={{
                opacity: 0,
                scale: 0.8,
              }}
              whileInView={{
                opacity: 1,
                scale: 1,
              }}
              viewport={{ once: true }}
              transition={{ delay: 0.7 }}
            >
              {safeScore}
            </motion.strong>

            <span>/100</span>
          </div>
        </div>

        <div className="score-copy">
          <span className="score-status">
            {getStatus()}
          </span>

          <h3>
            Your average AI job-match score.
          </h3>

          <p>
            This score is calculated from your AI job
            analyses and reflects how your resume aligns
            with the roles you have analyzed.
          </p>

          <button className="text-action" type="button">
            View skill analysis
            <ArrowUpRight size={16} />
          </button>
        </div>
      </div>
    </motion.article>
  )
}

export default ReadinessScore