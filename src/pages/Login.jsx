import { useState } from "react"
import { Link } from "react-router-dom"
import { ArrowRight, Eye, EyeOff, Sparkles } from "lucide-react"
import { motion } from "motion/react"
import { loginUser } from "../services/authService"
import Logo from "../components/ui/Logo"

function Login() {

  const [form, setForm] = useState({
    email: "",
    password: "",
  })

  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  function handleChange(event) {
    const { name, value } = event.target

    setForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError("")
    setIsSubmitting(true)

    try {
      await loginUser(form)
window.location.href = "/dashboard"
    } catch (err) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-glow auth-glow-one" />
      <div className="auth-glow auth-glow-two" />

      <section className="auth-brand-panel">
        <div className="auth-brand-top">
          <Logo />
        </div>

        <motion.div
          className="auth-brand-content"
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65 }}
        >
          <span className="eyebrow">
            <Sparkles size={15} />
            AI Career Intelligence
          </span>

          <h1>
            Build smarter.
            <br />
            Apply <span>stronger.</span>
          </h1>

          <p>
            Turn your experience, opportunities, and ambitions into a focused
            career strategy powered by intelligent insights.
          </p>

          <div className="auth-feature-row">
            <span>Job Match</span>
            <span>Resume Intelligence</span>
            <span>Interview Coach</span>
          </div>
        </motion.div>

        <p className="auth-brand-footer">
          CareerForge AI · Build Smarter. Apply Stronger. Grow Further.
        </p>
      </section>

      <section className="auth-form-panel">
        <motion.div
          className="auth-form-wrap"
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.55, delay: 0.1 }}
        >
          <div className="auth-heading">
            <span>Welcome back</span>
            <h2>Continue your career journey.</h2>
            <p>Sign in to your CareerForge workspace.</p>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <form className="auth-form" onSubmit={handleSubmit}>
            <label>
              Email address
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </label>

            <label>
              Password
              <div className="password-field">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  maxLength={128}
                  required
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>

            <button
              className="auth-submit"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
              {!isSubmitting && <ArrowRight size={18} />}
            </button>
          </form>

          <p className="auth-switch">
            New to CareerForge?
            <Link to="/register">Create your account</Link>
          </p>
        </motion.div>
      </section>
    </main>
  )
}

export default Login