let csrfToken = null

async function request(url, options = {}) {
  const response = await fetch(url, {
    credentials: "include",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {}),
      ...options.headers,
    },
  })

  const data = await response.json()

  if (data.csrf_token) {
    csrfToken = data.csrf_token
  }

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong.")
  }

  return data
}

export async function getCurrentUser() {
  return request("/api/auth/me.php", {
    method: "GET",
  })
}

export async function registerUser({ fullName, email, password }) {
  if (!csrfToken) {
    await getCurrentUser()
  }

  return request("/api/auth/register.php", {
    method: "POST",
    body: JSON.stringify({
      full_name: fullName,
      email,
      password,
    }),
  })
}

export async function loginUser({ email, password }) {
  if (!csrfToken) {
    await getCurrentUser()
  }

  return request("/api/auth/login.php", {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
    }),
  })
}

export async function logoutUser() {
  if (!csrfToken) {
    await getCurrentUser()
  }

  const data = await request("/api/auth/logout.php", {
    method: "POST",
    body: JSON.stringify({}),
  })

  csrfToken = null

  return data
}