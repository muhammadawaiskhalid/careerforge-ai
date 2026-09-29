import { getCurrentUser } from "./authService"

let csrfToken = null

async function ensureCsrfToken() {
  if (csrfToken) {
    return csrfToken
  }

  const auth = await getCurrentUser()
  csrfToken = auth.csrf_token

  return csrfToken
}

async function parseResponse(response) {
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong.")
  }

  return data
}

export async function getApplications() {
  const response = await fetch("/api/applications/list.php", {
    method: "GET",
    credentials: "include",
  })

  return parseResponse(response)
}

export async function createApplication({
  jobId,
  status = "saved",
}) {
  const token = await ensureCsrfToken()

  const response = await fetch("/api/applications/create.php", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": token,
    },
    body: JSON.stringify({
      job_id: jobId,
      status,
    }),
  })

  return parseResponse(response)
}

export async function updateApplicationStatus(
  applicationId,
  status,
) {
  const token = await ensureCsrfToken()

  const response = await fetch(
    "/api/applications/update-status.php",
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": token,
      },
      body: JSON.stringify({
        application_id: applicationId,
        status,
      }),
    },
  )

  return parseResponse(response)
}