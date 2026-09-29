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
    throw new Error(data.message || "AI request failed.")
  }

  return data
}

export async function analyzeJobMatch(jobId) {
  const token = await ensureCsrfToken()

  const response = await fetch("/api/ai/job-match.php", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": token,
    },
    body: JSON.stringify({
      job_id: jobId,
    }),
  })

  return parseResponse(response)
}

export async function generateCoverLetter(jobId) {
  const token = await ensureCsrfToken()

  const response = await fetch("/api/ai/cover-letter.php", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": token,
    },
    body: JSON.stringify({
      job_id: jobId,
    }),
  })

  return parseResponse(response)
}