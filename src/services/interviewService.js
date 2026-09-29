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
    throw new Error(data.message || "Interview request failed.")
  }

  return data
}

export async function startInterview(jobId) {
  const token = await ensureCsrfToken()

  const response = await fetch("/api/interviews/start.php", {
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

export async function getInterviewSession(sessionId) {
  const response = await fetch(
    `/api/interviews/session.php?id=${encodeURIComponent(sessionId)}`,
    {
      method: "GET",
      credentials: "include",
    },
  )

  return parseResponse(response)
}

export async function submitInterviewAnswer(
  questionId,
  answer,
) {
  const token = await ensureCsrfToken()

  const response = await fetch("/api/interviews/answer.php", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": token,
    },
    body: JSON.stringify({
      question_id: questionId,
      answer,
    }),
  })

  return parseResponse(response)
}

export async function completeInterview(sessionId) {
  const token = await ensureCsrfToken()

  const response = await fetch("/api/interviews/complete.php", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": token,
    },
    body: JSON.stringify({
      session_id: sessionId,
    }),
  })

  return parseResponse(response)
}