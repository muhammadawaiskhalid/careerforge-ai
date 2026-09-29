import { useEffect, useState } from "react"
import { motion } from "motion/react"
import {
  Bookmark,
  Building2,
  CalendarDays,
  CircleCheck,
  MapPin,
  MessageSquareText,
  Send,
  XCircle,
} from "lucide-react"

import {
  getApplications,
  updateApplicationStatus,
} from "../../services/applicationService"

import { getCurrentUser } from "../../services/authService"

const stages = [
  { id: "saved", label: "Saved", icon: Bookmark },
  { id: "applied", label: "Applied", icon: Send },
  {
    id: "interview",
    label: "Interview",
    icon: MessageSquareText,
  },
  { id: "offer", label: "Offer", icon: CircleCheck },
]

 const ownerStatusOptions = [
  { value: "applied", label: "Applied" },
  { value: "interview", label: "Interview" },
  { value: "offer", label: "Offer" },
  { value: "rejected", label: "Rejected" },
]

function formatDate(date) {
  if (!date) return "—"

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(new Date(date.replace(" ", "T")))
}

function OpportunityPipeline() {
  const [applications, setApplications] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [isOwner, setIsOwner] = useState(false)
const [updatingId, setUpdatingId] = useState(null)

  useEffect(() => {
  async function loadData() {
    try {
      const [applicationsData, userData] =
        await Promise.all([
          getApplications(),
          getCurrentUser(),
        ])

      setApplications(
        applicationsData.applications || [],
      )

      setIsOwner(
        userData.authenticated &&
          userData.user?.role === "owner",
      )
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  loadData()
}, [])

async function handleStatusChange(
  applicationId,
  status,
) {
  if (!isOwner || updatingId) return

  setError("")
  setUpdatingId(applicationId)

  try {
    await updateApplicationStatus(
      applicationId,
      status,
    )

    setApplications((current) =>
      current.map((application) =>
        application.id === applicationId
          ? {
              ...application,
              status,
            }
          : application,
      ),
    )
  } catch (err) {
    setError(err.message)
  } finally {
    setUpdatingId(null)
  }
}


  if (isLoading) {
    return (
      <div className="pipeline-state">
        Loading your applications...
      </div>
    )
  }

  if (applications.length === 0) {
    return (
      <div className="pipeline-state">
        <strong>No applications yet.</strong>

        <span>
          Browse available jobs and save or apply to start
          building your application pipeline.
        </span>
      </div>
    )
  }

  const closedApplications = applications.filter(
    (application) =>
      application.status === "rejected" ||
      application.status === "withdrawn",
  )

  return (
    <div className="opportunity-workspace">
      {error && (
        <div className="pipeline-state pipeline-error">
          {error}
        </div>
      )}

      <div className="pipeline-path">
        <div className="pipeline-connector" />

        {stages.map((stage, index) => {
          const Icon = stage.icon

          const stageApplications =
            applications.filter(
              (application) =>
                application.status === stage.id,
            )

          return (
            <motion.div
              className="pipeline-stop"
              key={stage.id}
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.12 + index * 0.1,
              }}
            >
              <div className="pipeline-stage">
                <span className="stage-icon">
                  <Icon size={16} />
                </span>

                {stage.label}

                <span className="stage-count">
                  {stageApplications.length}
                </span>
              </div>

              <div className="stage-opportunities">
                {stageApplications.length === 0 ? (
                  <div className="empty-stage">
                    No applications
                  </div>
                ) : (
                  stageApplications.map(
                    (application) => (
                      <article
                        className="opportunity-ticket"
                        key={application.id}
                      >
                        <div className="ticket-top">
                          <span className="company-mark">
                            {application.company_name
                              .charAt(0)
                              .toUpperCase()}
                          </span>
                        </div>

                        <strong>
                          {application.job_title}
                        </strong>

                        <span className="company-name">
                          <Building2 size={13} />
                          {application.company_name}
                        </span>

                        <div className="ticket-meta">
                          <span>
                            <MapPin size={12} />
                            {application.location ||
                              "Not specified"}
                          </span>

                          <span>
                            <CalendarDays size={12} />
                            {formatDate(
                              application.created_at,
                            )}
                          </span>
                        </div>

                        <div className="ticket-status-control">
                            <span className="ticket-status-label">
                              Status
                            </span>

                            {isOwner &&
                            application.status !== "withdrawn" ? (
                              <select
                                value={application.status}
                                disabled={updatingId === application.id}
                                onChange={(event) =>
                                  handleStatusChange(
                                    application.id,
                                    event.target.value,
                                  )
                                }
                              >
                                {ownerStatusOptions.map((option) => (
                                  <option
                                    key={option.value}
                                    value={option.value}
                                  >
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <div className="ticket-status-display">
                                {application.status === "rejected"
                                  ? "Rejected"
                                  : "Withdrawn"}
                              </div>
                            )}
                          </div>

                        <div className="ticket-footer">
                          <span className="tracking-dot" />
                        </div>
                      </article>
                    ),
                  )
                )}
              </div>
            </motion.div>
          )
        })}
      </div>

      {closedApplications.length > 0 && (
        <div className="closed-applications">
          <div className="pipeline-stage">
            <span className="stage-icon">
              <XCircle size={16} />
            </span>

            Closed

            <span className="stage-count">
              {closedApplications.length}
            </span>
          </div>

          <div className="stage-opportunities">
            {closedApplications.map((application) => (
              <article
                className="opportunity-ticket"
                key={application.id}
              >
                <div className="ticket-top">
                  <span className="company-mark">
                    {application.company_name
                      .charAt(0)
                      .toUpperCase()}
                  </span>
                </div>

                <strong>
                  {application.job_title}
                </strong>

                <span className="company-name">
                  <Building2 size={13} />
                  {application.company_name}
                </span>
                      <div className="ticket-status-control">
                        <span className="ticket-status-label">Status</span>

                        <div className="ticket-status-display">
                          {application.status === "rejected"
                            ? "Rejected"
                            : "Withdrawn"}
                        </div>
                      </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default OpportunityPipeline