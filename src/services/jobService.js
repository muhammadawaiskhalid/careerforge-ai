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

export async function getJobs() {
  const response = await fetch("/api/jobs/list.php", {
    method: "GET",
    credentials: "include",
  })

  return parseResponse(response)
}

export async function createJob({
  jobTitle,
  companyName,
  location,
  workMode,
  employmentType,
  jobUrl,
  jobDescription,
  source,
}) {
  const token = await ensureCsrfToken()

  const response = await fetch("/api/jobs/create.php", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": token,
    },
    body: JSON.stringify({
      job_title: jobTitle,
      company_name: companyName,
      location,
      work_mode: workMode,
      employment_type: employmentType,
      job_url: jobUrl,
      job_description: jobDescription,
      source,
    }),
  })

  return parseResponse(response)
}