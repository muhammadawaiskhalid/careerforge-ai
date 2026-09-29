import { useEffect, useState } from "react"
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom"

import AppLayout from "./components/layout/AppLayout"
import Dashboard from "./pages/Dashboard"
import Jobs from "./pages/Jobs"
import Applications from "./pages/Applications"
import Resume from "./pages/Resume"
import Login from "./pages/Login"
import Register from "./pages/Register"
import Interview from "./pages/Interview"
import { getCurrentUser } from "./services/authService"

function App() {
  const [authState, setAuthState] = useState({
    loading: true,
    authenticated: false,
    user: null,
  })

  useEffect(() => {
    async function checkAuthentication() {
      try {
        const data = await getCurrentUser()

        setAuthState({
          loading: false,
          authenticated: data.authenticated,
          user: data.user || null,
        })
      } catch {
        setAuthState({
          loading: false,
          authenticated: false,
          user: null,
        })
      }
    }

    checkAuthentication()
  }, [])

  if (authState.loading) {
    return (
      <div className="auth-loading">
        <span className="auth-loading-mark">CF</span>
        <p>Preparing your workspace...</p>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            authState.authenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Login />
            )
          }
        />

        <Route
          path="/register"
          element={
            authState.authenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Register />
            )
          }
        />

        <Route
          path="/*"
          element={
            authState.authenticated ? (
              <AppLayout user={authState.user}>
                <Routes>
                  <Route
                    path="/"
                    element={<Navigate to="/dashboard" replace />}
                  />

                  <Route
                    path="/dashboard"
                    element={<Dashboard />}
                  />

                  <Route
                    path="/jobs"
                    element={<Jobs user={authState.user} />}
                  />

                  <Route
                    path="/applications"
                    element={<Applications />}
                  />

                  <Route
                    path="/resume"
                    element={<Resume />}
                  />

                  <Route
                    path="/interview"
                    element={<Interview />}
                  />

                  <Route
                    path="*"
                    element={<Navigate to="/dashboard" replace />}
                  />
                </Routes>
              </AppLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App