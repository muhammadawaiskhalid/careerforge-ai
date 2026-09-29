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

export async function getResumes() {
  const response = await fetch("/api/resumes/list.php", {
    method: "GET",
    credentials: "include",
  })

  return parseResponse(response)
}

export async function saveResume({
  resumeId = 0,
  title,
  professionalSummary,
  extractedText,
  isPrimary,
}) {
  const token = await ensureCsrfToken()

  const response = await fetch("/api/resumes/save.php", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": token,
    },
    body: JSON.stringify({
      resume_id: resumeId,
      title,
      professional_summary: professionalSummary,
      extracted_text: extractedText,
      is_primary: isPrimary,
    }),
  })

  return parseResponse(response)
}