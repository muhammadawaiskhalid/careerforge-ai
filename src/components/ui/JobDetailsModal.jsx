import { useNavigate } from "react-router-dom"
import { useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import {
  Bookmark,
  BriefcaseBusiness,
  Building2,
  Check,
  Copy,
  ExternalLink,
  FileText,
  MapPin,
  Send,
  Sparkles,
  X,
} from "lucide-react"

import { createApplication } from "../../services/applicationService"
import {
  analyzeJobMatch,
  generateCoverLetter,
} from "../../services/aiService"

function formatLabel(value) {
  if (!value || value === "unspecified") {
    return "Not specified"
  }

  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function JobDetailsModal({ job, onClose }) {
  const navigate = useNavigate()

  const [isSaving, setIsSaving] = useState(false)
  const [isApplying, setIsApplying] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState(null)

  const [isGeneratingLetter, setIsGeneratingLetter] =
    useState(false)
  const [coverLetter, setCoverLetter] = useState(null)
  const [isCopied, setIsCopied] = useState(false)

  if (!job) {
    return null
  }

  async function handleApplication(status) {
    if (isSaving || isApplying) return

    setError("")
    setMessage("")

    if (status === "saved") {
      setIsSaving(true)
    } else {
      setIsApplying(true)
    }

    try {
      const data = await createApplication({
        jobId: job.id,
        status,
      })

      setMessage(data.message)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsSaving(false)
      setIsApplying(false)
    }
  }

  async function handleAnalyzeMatch() {
    if (isAnalyzing) return

    setError("")
    setMessage("")
    setIsAnalyzing(true)

    try {
      const data = await analyzeJobMatch(job.id)
      setAnalysis(data.analysis)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsAnalyzing(false)
    }
  }

  async function handleGenerateCoverLetter() {
    if (isGeneratingLetter) return

    setError("")
    setMessage("")
    setIsCopied(false)
    setIsGeneratingLetter(true)

    try {
      const data = await generateCoverLetter(job.id)
      setCoverLetter(data.cover_letter)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsGeneratingLetter(false)
    }
  }

  async function handleCopyCoverLetter() {
    if (!coverLetter?.content) return

    try {
      await navigator.clipboard.writeText(
        coverLetter.content,
      )

      setIsCopied(true)

      window.setTimeout(() => {
        setIsCopied(false)
      }, 2000)
    } catch {
      setError("Unable to copy the cover letter.")
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        className="modal-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onMouseDown={onClose}
      >
        <motion.article
          className="job-details-modal"
          initial={{
            opacity: 0,
            scale: 0.95,
            y: 30,
          }}
          animate={{
            opacity: 1,
            scale: 1,
            y: 0,
          }}
          exit={{
            opacity: 0,
            scale: 0.96,
            y: 20,
          }}
          transition={{ duration: 0.25 }}
          onMouseDown={(event) =>
            event.stopPropagation()
          }
        >
          <header className="job-details-header">
            <div className="job-details-company">
              <span className="company-mark">
                {job.company_name
                  .charAt(0)
                  .toUpperCase()}
              </span>

              <div>
                <span>{job.company_name}</span>
                <h2>{job.job_title}</h2>
              </div>
            </div>

            <button
              type="button"
              className="modal-close"
              onClick={onClose}
              aria-label="Close job details"
            >
              <X size={19} />
            </button>
          </header>

          <div className="job-details-meta">
            <span>
              <Building2 size={15} />
              {job.company_name}
            </span>

            <span>
              <MapPin size={15} />
              {job.location ||
                "Location not specified"}
            </span>

            <span>
              <BriefcaseBusiness size={15} />
              {formatLabel(
                job.employment_type,
              )}
            </span>

            <span>
              <Sparkles size={15} />
              {formatLabel(job.work_mode)}
            </span>
          </div>

          <div className="job-details-description">
            <span>Job Description</span>

            <p>
              {job.job_description ||
                "No detailed job description has been provided."}
            </p>
          </div>

          <div className="job-ai-match">
            <div>
              <span className="job-ai-match-label">
                <Sparkles size={15} />
                AI Job Match
              </span>

              <p>
                Compare this opportunity with your
                primary resume using AI.
              </p>
            </div>

            <button
              type="button"
              className="secondary-action"
              disabled={isAnalyzing}
              onClick={handleAnalyzeMatch}
            >
              <Sparkles size={17} />

              {isAnalyzing
                ? "Analyzing..."
                : "Analyze Match"}
            </button>
          </div>

          {analysis && (
            <div className="job-ai-result">
              <div className="job-ai-score">
                <strong>
                  {analysis.match_score}%
                </strong>
                <span>Resume Match</span>
              </div>

              <div className="job-ai-section">
                <h3>Experience Alignment</h3>
                <p>
                  {analysis.experience_alignment}
                </p>
              </div>

              <div className="job-ai-section">
                <h3>Matched Skills</h3>

                <div className="job-ai-tags">
                  {analysis.matched_skills.map(
                    (skill) => (
                      <span key={skill}>
                        {skill}
                      </span>
                    ),
                  )}
                </div>
              </div>

              <div className="job-ai-section">
                <h3>Missing Skills</h3>

                <div className="job-ai-tags">
                  {analysis.missing_skills.map(
                    (skill) => (
                      <span key={skill}>
                        {skill}
                      </span>
                    ),
                  )}
                </div>
              </div>

              <div className="job-ai-section">
                <h3>Strengths</h3>

                <ul>
                  {analysis.strengths.map(
                    (strength) => (
                      <li key={strength}>
                        {strength}
                      </li>
                    ),
                  )}
                </ul>
              </div>

              <div className="job-ai-section">
                <h3>Recommendations</h3>

                <ul>
                  {analysis.recommendations.map(
                    (recommendation) => (
                      <li key={recommendation}>
                        {recommendation}
                      </li>
                    ),
                  )}
                </ul>
              </div>
            </div>
          )}

          <div className="job-ai-match">
            <div>
              <span className="job-ai-match-label">
                <FileText size={15} />
                AI Cover Letter
              </span>

              <p>
                Generate a tailored cover letter from
                your resume and this job&apos;s
                requirements.
              </p>
            </div>

            <button
              type="button"
              className="secondary-action"
              disabled={isGeneratingLetter}
              onClick={handleGenerateCoverLetter}
            >
              <Sparkles size={17} />

              {isGeneratingLetter
                ? "Generating..."
                : coverLetter
                  ? "Regenerate Letter"
                  : "Generate Cover Letter"}
            </button>
          </div>

          {coverLetter && (
            <div className="cover-letter-result">
              <div className="cover-letter-header">
                <div>
                  <span>Generated Cover Letter</span>
                  <h3>{coverLetter.title}</h3>
                </div>

                <button
                  type="button"
                  className="secondary-action"
                  onClick={handleCopyCoverLetter}
                >
                  {isCopied ? (
                    <Check size={16} />
                  ) : (
                    <Copy size={16} />
                  )}

                  {isCopied ? "Copied" : "Copy"}
                </button>
              </div>

              <div className="cover-letter-content">
                {coverLetter.content
                  .split(/\n+/)
                  .filter(Boolean)
                  .map((paragraph, index) => (
                    <p key={index}>
                      {paragraph}
                    </p>
                  ))}
              </div>
            </div>
          )}

          {error && (
            <div className="auth-error">
              {error}
            </div>
          )}

          {message && (
            <div className="job-action-success">
              {message}
            </div>
          )}

          <footer className="job-details-actions">
            <button
              type="button"
              className="secondary-action"
              disabled={
                isSaving || isApplying
              }
              onClick={() =>
                handleApplication("saved")
              }
            >
              <Bookmark size={17} />

              {isSaving
                ? "Saving..."
                : "Save Job"}
            </button>

            <button
              type="button"
              className="primary-action"
              disabled={
                isSaving || isApplying
              }
              onClick={() =>
                handleApplication("applied")
              }
            >
              <Send size={17} />

              {isApplying
                ? "Applying..."
                : "Mark as Applied"}
            </button>

            <button
              type="button"
              className="secondary-action"
              onClick={() =>
                navigate(
                  `/interview?job=${job.id}`,
                )
              }
            >
              <Sparkles size={17} />
              Practice Interview
            </button>

            {job.job_url && (
              <a
                href={job.job_url}
                target="_blank"
                rel="noopener noreferrer"
                className="job-original-link"
              >
                <ExternalLink size={16} />
                Original Listing
              </a>
            )}
          </footer>
        </motion.article>
      </motion.div>
    </AnimatePresence>
  )
}

export default JobDetailsModal