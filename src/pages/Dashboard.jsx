import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "motion/react"
import {
  ArrowRight,
  ArrowUpRight,
  BriefcaseBusiness,
  Sparkles,
  TrendingUp,
} from "lucide-react"

import CareerJourney from "../components/ui/CareerJourney"
import ReadinessScore from "../components/ui/ReadinessScore"
import { getDashboardSummary } from "../services/dashboardService"

function Dashboard() {
  const navigate = useNavigate()

  const [summary, setSummary] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    async function loadDashboard() {
      try {
        const data = await getDashboardSummary()
        setSummary(data.summary)
      } catch (err) {
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }

    loadDashboard()
  }, [])

  if (isLoading) {
    return (
      <section className="dashboard">
        <div className="pipeline-state">
          Loading your career dashboard...
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="dashboard">
        <div className="pipeline-state pipeline-error">
          {error}
        </div>
      </section>
    )
  }

  const applications = summary?.applications ?? {}

  const averageMatch =
    summary?.ai_analyses?.average_match ?? 0

  const completedInterviews =
    summary?.interviews?.total ?? 0

  const averageInterviewScore =
    summary?.interviews?.average_score ?? 0

  const strongestMatch = summary?.strongest_match

  const activityBars = [
    applications.saved ?? 0,
    applications.applied ?? 0,
    applications.interview ?? 0,
    applications.offer ?? 0,
    summary?.ai_analyses?.total ?? 0,
    completedInterviews,
    summary?.cover_letters ?? 0,
  ]

  const maxActivity = Math.max(
    ...activityBars,
    1,
  )

  return (
    <section className="dashboard">
      <motion.div
        className="welcome-block"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65 }}
      >
        <div>
          <span className="eyebrow">
            <Sparkles size={15} />
            Career Command Center
          </span>

          <h1>
            Your next opportunity
            <span> starts here.</span>
          </h1>

          <p>
            Track your applications, understand your
            strengths, and use AI insights to make every
            application stronger.
          </p>
        </div>

        <button
          type="button"
          className="primary-action"
          onClick={() => navigate("/jobs")}
        >
          Analyze a Job
          <ArrowUpRight size={18} />
        </button>
      </motion.div>

      <CareerJourney applications={applications} />

      <div className="intelligence-grid">
        <ReadinessScore score={averageMatch} />

        <motion.article
          className="pulse-panel intelligence-panel"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{
            once: true,
            amount: 0.25,
          }}
          transition={{
            duration: 0.6,
            delay: 0.1,
          }}
        >
          <div className="panel-heading compact-heading">
            <div>
              <span className="section-kicker">
                Career Activity
              </span>

              <h2>
                Your progress at a glance.
              </h2>
            </div>

            <TrendingUp size={21} />
          </div>

          <div className="pulse-metric">
            <strong>
              {applications.total ?? 0}
            </strong>

            <span>tracked applications</span>
          </div>

          <div
            className="pulse-bars"
            aria-label="Career activity"
          >
            {activityBars.map((value, index) => {
              const height =
                value === 0
                  ? 8
                  : Math.max(
                      18,
                      (value / maxActivity) * 100,
                    )

              return (
                <motion.span
                  key={index}
                  initial={{ height: 0 }}
                  whileInView={{
                    height: `${height}%`,
                  }}
                  viewport={{ once: true }}
                  transition={{
                    duration: 0.55,
                    delay:
                      0.2 + index * 0.045,
                  }}
                />
              )
            })}
          </div>

          <div className="pulse-footer">
            <span>
              {completedInterviews} completed{" "}
              {completedInterviews === 1
                ? "interview"
                : "interviews"}
            </span>

            <strong>
              {completedInterviews > 0
                ? `${averageInterviewScore}/100 avg. interview`
                : "No interview score yet"}
            </strong>
          </div>
        </motion.article>
      </div>

      <motion.section
        className="next-move"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{
          once: true,
          amount: 0.3,
        }}
        transition={{ duration: 0.65 }}
      >
        <div className="next-move-icon">
          <BriefcaseBusiness size={22} />
        </div>

        <div className="next-move-copy">
          <span>AI Recommended Next Move</span>

          {strongestMatch ? (
            <>
              <h2>
                Build on your strongest job match.
              </h2>

              <p>
                Your strongest analyzed opportunity is{" "}
                {strongestMatch.job_title} at{" "}
                {strongestMatch.company_name}, with a{" "}
                {strongestMatch.match_score}% resume match.
              </p>
            </>
          ) : (
            <>
              <h2>
                Analyze your first job opportunity.
              </h2>

              <p>
                Compare a job with your resume to discover
                matched skills, missing requirements, and
                targeted recommendations.
              </p>
            </>
          )}
        </div>

        <button
          type="button"
          className="next-move-action"
          aria-label="Open jobs"
          onClick={() => navigate("/jobs")}
        >
          <ArrowRight size={21} />
        </button>
      </motion.section>
    </section>
  )
}

export default Dashboard