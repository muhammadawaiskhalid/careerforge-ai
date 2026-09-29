import { useEffect, useState } from "react"
import { motion } from "motion/react"
import {
  BriefcaseBusiness,
  Building2,
  ExternalLink,
  MapPin,
  Plus,
  Sparkles,
} from "lucide-react"

import AddJobModal from "../components/ui/AddJobModal"
import JobDetailsModal from "../components/ui/JobDetailsModal"
import { getJobs } from "../services/jobService"

function formatLabel(value) {
  if (!value || value === "unspecified") {
    return "Not specified"
  }

  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function Jobs({ user }) {
  const [jobs, setJobs] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedJob, setSelectedJob] = useState(null)

  async function loadJobs() {
    setError("")

    try {
      const data = await getJobs()
      setJobs(data.jobs || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
  let isActive = true

  async function fetchJobs() {
    try {
      const data = await getJobs()

      if (isActive) {
        setJobs(data.jobs || [])
      }
    } catch (err) {
      if (isActive) {
        setError(err.message)
      }
    } finally {
      if (isActive) {
        setIsLoading(false)
      }
    }
  }

  fetchJobs()

  return () => {
    isActive = false
  }
}, [])

  async function handleJobCreated() {
    await loadJobs()
  }

  return (
    <>
      <section className="jobs-page">
        <motion.header
          className="page-intro"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
        >
          <div>
            <span className="eyebrow">
              <Sparkles size={15} />
              Career Opportunities
            </span>

            <h1>Discover Jobs</h1>

            <p>
              Explore opportunities and find roles that align with your
              experience, skills, and career direction.
            </p>
          </div>

          {user?.role === "owner" && (
            <button
              type="button"
              className="primary-action"
              onClick={() => setIsModalOpen(true)}
            >
              <Plus size={18} />
              Add Job
            </button>
          )}
        </motion.header>

        {isLoading && (
          <div className="pipeline-state">
            Loading available jobs...
          </div>
        )}

        {!isLoading && error && (
          <div className="pipeline-state pipeline-error">
            {error}
          </div>
        )}

        {!isLoading && !error && jobs.length === 0 && (
          <div className="pipeline-state">
            <strong>No jobs available right now.</strong>
            <span>
              New opportunities will appear here when published.
            </span>
          </div>
        )}

        {!isLoading && !error && jobs.length > 0 && (
          <div className="jobs-grid">
            {jobs.map((job, index) => (
              <motion.article
                className="job-card"
                key={job.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.45,
                  delay: index * 0.06,
                }}
              >
                <div className="job-card-top">
                  <span className="company-mark">
                    {job.company_name.charAt(0).toUpperCase()}
                  </span>

                  <span className="job-work-mode">
                    {formatLabel(job.work_mode)}
                  </span>
                </div>

                <div className="job-card-heading">
                  <h2>{job.job_title}</h2>

                  <span>
                    <Building2 size={14} />
                    {job.company_name}
                  </span>
                </div>

                <div className="job-card-meta">
                  <span>
                    <MapPin size={14} />
                    {job.location || "Location not specified"}
                  </span>

                  <span>
                    <BriefcaseBusiness size={14} />
                    {formatLabel(job.employment_type)}
                  </span>
                </div>

                {job.job_description && (
                  <p className="job-card-description">
                    {job.job_description}
                  </p>
                )}

                <div className="job-card-actions">
                  <button
                  type="button"
                  className="job-view-action"
                  onClick={() => setSelectedJob(job)}
                >
                  View Job
                </button>

                  {job.job_url && (
                    <a
                      href={job.job_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="job-external-action"
                      aria-label="Open original job listing"
                    >
                      <ExternalLink size={17} />
                    </a>
                  )}
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </section>

      {user?.role === "owner" && (
        <AddJobModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onCreated={handleJobCreated}
        /> 
      )}
      <JobDetailsModal
  job={selectedJob}
  onClose={() => setSelectedJob(null)}
/>
    </>
  )
}

export default Jobs