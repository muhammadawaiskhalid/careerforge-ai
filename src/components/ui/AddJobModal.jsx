import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { BriefcaseBusiness, Sparkles, X } from "lucide-react"

import { createJob } from "../../services/jobService"

const initialForm = {
  jobTitle: "",
  companyName: "",
  location: "",
  workMode: "unspecified",
  employmentType: "unspecified",
  jobUrl: "",
  jobDescription: "",
  source: "",
}

function AddJobModal({ isOpen, onClose, onCreated }) {
  const [form, setForm] = useState(initialForm)
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
  if (!isOpen) return

  document.body.classList.add("job-modal-open")

  return () => {
    document.body.classList.remove("job-modal-open")
  }
}, [isOpen])

  function handleChange(event) {
    const { name, value } = event.target

    setForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  function handleClose() {
    if (isSubmitting) return

    setForm(initialForm)
    setError("")
    onClose()
  }

  async function handleSubmit(event) {
    event.preventDefault()

    setError("")
    setIsSubmitting(true)

    try {
      await createJob(form)

      setForm(initialForm)

      if (onCreated) {
        await onCreated()
      }

      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={handleClose}
        >
          <motion.div
            className="opportunity-modal"
            initial={{ opacity: 0, scale: 0.94, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 20 }}
            transition={{ duration: 0.25 }}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <div className="modal-heading">
                <span className="modal-icon">
                  <BriefcaseBusiness size={20} />
                </span>

                <div>
                  <span>
                    <Sparkles size={12} />
                    Publish Opportunity
                  </span>

                  <h2>Add a new job</h2>
                </div>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={handleClose}
                aria-label="Close modal"
                disabled={isSubmitting}
              >
                <X size={19} />
              </button>
            </div>

            <form
              className="opportunity-form"
              onSubmit={handleSubmit}
            >
              {error && (
                <div className="auth-error">
                  {error}
                </div>
              )}

              <div className="form-grid">
                <label>
                  Job title
                  <input
                    type="text"
                    name="jobTitle"
                    value={form.jobTitle}
                    onChange={handleChange}
                    placeholder="e.g. Frontend Developer"
                    maxLength={180}
                    required
                  />
                </label>

                <label>
                  Company
                  <input
                    type="text"
                    name="companyName"
                    value={form.companyName}
                    onChange={handleChange}
                    placeholder="e.g. NovaStack"
                    maxLength={180}
                    required
                  />
                </label>

                <label>
                  Location
                  <input
                    type="text"
                    name="location"
                    value={form.location}
                    onChange={handleChange}
                    placeholder="e.g. Islamabad, Pakistan"
                    maxLength={180}
                  />
                </label>

                <label>
                  Work mode
                  <select
                    name="workMode"
                    value={form.workMode}
                    onChange={handleChange}
                  >
                    <option value="unspecified">Not specified</option>
                    <option value="remote">Remote</option>
                    <option value="hybrid">Hybrid</option>
                    <option value="onsite">On-site</option>
                  </select>
                </label>

                <label>
                  Employment type
                  <select
                    name="employmentType"
                    value={form.employmentType}
                    onChange={handleChange}
                  >
                    <option value="unspecified">Not specified</option>
                    <option value="full_time">Full-time</option>
                    <option value="part_time">Part-time</option>
                    <option value="contract">Contract</option>
                    <option value="internship">Internship</option>
                  </select>
                </label>

                <label>
                  Source
                  <input
                    type="text"
                    name="source"
                    value={form.source}
                    onChange={handleChange}
                    placeholder="e.g. Company careers"
                    maxLength={100}
                  />
                </label>
              </div>

              <label>
                Job URL
                <input
                  type="url"
                  name="jobUrl"
                  value={form.jobUrl}
                  onChange={handleChange}
                  placeholder="https://example.com/jobs/frontend-developer"
                  maxLength={500}
                />
              </label>

              <label>
                Job description
                <textarea
                  name="jobDescription"
                  value={form.jobDescription}
                  onChange={handleChange}
                  rows="6"
                  placeholder="Enter the role responsibilities, requirements, skills, and other job details."
                />
              </label>

              <div className="modal-ai-note">
                <Sparkles size={16} />

                <span>
                  CareerForge AI can use this job description later for
                  resume matching and skill-gap analysis.
                </span>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-action"
                  onClick={handleClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-action"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Publishing..." : "Publish Job"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default AddJobModal