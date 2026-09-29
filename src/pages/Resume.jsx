import { useEffect, useState } from "react"
import { motion } from "motion/react"
import { FileText, Save, Sparkles } from "lucide-react"

import {
  getResumes,
  saveResume,
} from "../services/resumeService"

function Resume() {
  const [resumeId, setResumeId] = useState(0)
  const [title, setTitle] = useState("")
  const [professionalSummary, setProfessionalSummary] = useState("")
  const [resumeText, setResumeText] = useState("")
  const [isPrimary, setIsPrimary] = useState(true)

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  useEffect(() => {
    let isActive = true

    async function loadResume() {
      try {
        const data = await getResumes()

        if (!isActive) return

        const resume =
          data.resumes?.find((item) => item.is_primary) ||
          data.resumes?.[0]

        if (resume) {
          setResumeId(resume.id)
          setTitle(resume.title || "")
          setProfessionalSummary(
            resume.professional_summary || "",
          )
          setResumeText(resume.extracted_text || "")
          setIsPrimary(Boolean(resume.is_primary))
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

    loadResume()

    return () => {
      isActive = false
    }
  }, [])

  async function handleSubmit(event) {
    event.preventDefault()

    if (isSaving) return

    setError("")
    setMessage("")
    setIsSaving(true)

    try {
      const data = await saveResume({
        resumeId,
        title,
        professionalSummary,
        extractedText: resumeText,
        isPrimary,
      })

      setResumeId(data.resume_id)
      setMessage(data.message)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="resume-page">
      <motion.header
        className="page-intro"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55 }}
      >
        <div>
          <span className="eyebrow">
            <Sparkles size={15} />
            Career Profile
          </span>

          <h1>Resume Workspace</h1>

          <p>
            Maintain the resume CareerForge AI will use for job
            matching and career intelligence.
          </p>
        </div>
      </motion.header>

      {isLoading ? (
        <div className="pipeline-state">
          Loading your resume...
        </div>
      ) : (
        <motion.form
          className="resume-workspace"
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <div className="resume-workspace-heading">
            <span className="resume-workspace-icon">
              <FileText size={21} />
            </span>

            <div>
              <h2>Primary Resume</h2>
              <p>
                Keep this information accurate so AI analysis uses
                your real experience.
              </p>
            </div>
          </div>

          <label className="auth-field">
            <span>Resume Title</span>

            <input
              type="text"
              value={title}
              maxLength={150}
              required
              placeholder="e.g. Software Engineer Resume"
              onChange={(event) => setTitle(event.target.value)}
            />
          </label>

          <label className="auth-field">
            <span>Professional Summary</span>

            <textarea
              value={professionalSummary}
              placeholder="Briefly describe your professional profile..."
              rows={4}
              onChange={(event) =>
                setProfessionalSummary(event.target.value)
              }
            />
          </label>

          <label className="auth-field">
            <span>Resume Content</span>

            <textarea
              value={resumeText}
              required
              rows={16}
              placeholder="Paste your resume text here..."
              onChange={(event) =>
                setResumeText(event.target.value)
              }
            />
          </label>

          <label className="resume-primary-option">
            <input
              type="checkbox"
              checked={isPrimary}
              onChange={(event) =>
                setIsPrimary(event.target.checked)
              }
            />

            <span>Use as my primary resume</span>
          </label>

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

          <div className="resume-workspace-actions">
            <button
              type="submit"
              className="primary-action"
              disabled={isSaving}
            >
              <Save size={17} />
              {isSaving ? "Saving..." : "Save Resume"}
            </button>
          </div>
        </motion.form>
      )}
    </section>
  )
}

export default Resume