async function parseResponse(response) {
  const data = await response.json()

  if (!response.ok || data.success === false) {
    throw new Error(
      data.message || "Unable to load dashboard data.",
    )
  }

  return data
}

export async function getDashboardSummary() {
  const response = await fetch(
    "/api/dashboard/summary.php",
    {
      method: "GET",
      credentials: "include",
    },
  )

  return parseResponse(response)
}