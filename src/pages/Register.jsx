import { useState } from "react"
import { Link } from "react-router-dom"
import { ArrowRight, Eye, EyeOff, Sparkles } from "lucide-react"
import { motion } from "motion/react"
import { registerUser } from "../services/authService"
import Logo from "../components/ui/Logo"

function Register() {

  const [form, setForm] = useState({
    fullName: "",
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
      await registerUser(form)
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
            Your Career Operating System
          </span>

          <h1>
            Forge your next
            <br />
            <span>opportunity.</span>
          </h1>

          <p>
            Build a career profile that gets smarter with every opportunity,
            application, and interview.
          </p>

          <div className="auth-feature-row">
            <span>Analyze</span>
            <span>Improve</span>
            <span>Prepare</span>
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
            <span>Start building</span>
            <h2>Create your CareerForge account.</h2>
            <p>Your intelligent career workspace starts here.</p>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <form className="auth-form" onSubmit={handleSubmit}>
            <label>
              Full name
              <input
                type="text"
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                placeholder="Your full name"
                autoComplete="name"
                maxLength={100}
                required
              />
            </label>

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
                  placeholder="Minimum 8 characters"
                  autoComplete="new-password"
                  minLength={8}
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
              {isSubmitting ? "Creating account..." : "Create account"}
              {!isSubmitting && <ArrowRight size={18} />}
            </button>
          </form>

          <p className="auth-switch">
            Already have an account?
            <Link to="/login">Sign in</Link>
          </p>
        </motion.div>
      </section>
    </main>
  )
}

export default Register