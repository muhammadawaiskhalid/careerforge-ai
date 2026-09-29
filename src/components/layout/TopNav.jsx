import { useEffect, useState } from "react"
import {
  ArrowRight,
  BriefcaseBusiness,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Sparkles,
  UserRound,
  X,
} from "lucide-react"
import { NavLink, useNavigate } from "react-router-dom"

import Logo from "../ui/Logo"
import {
  getCurrentUser,
  logoutUser,
} from "../../services/authService"

const navigation = [
  {
    to: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    to: "/jobs",
    label: "Jobs",
    icon: BriefcaseBusiness,
  },
  {
    to: "/applications",
    label: "Applications",
    icon: FileText,
  },
  {
    to: "/resume",
    label: "Resume",
    icon: UserRound,
  },
]

function getInitials(name) {
  if (!name) return "CF"

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("")
}

function formatRole(role) {
  if (role === "owner") {
    return "Platform Owner"
  }

  return "CareerForge Member"
}

function TopNav() {
  const navigate = useNavigate()

  const [user, setUser] = useState(null)
  const [isAccountOpen, setIsAccountOpen] =
    useState(false)
  const [isMobileOpen, setIsMobileOpen] =
    useState(false)
  const [isLoggingOut, setIsLoggingOut] =
    useState(false)

  const navClass = ({ isActive }) =>
    `nav-link${isActive ? " active" : ""}`

  useEffect(() => {
    let active = true

    async function loadUser() {
      try {
        const data = await getCurrentUser()

        if (active && data.authenticated) {
          setUser(data.user)
        }
      } catch {
        if (active) {
          setUser(null)
        }
      }
    }

    loadUser()

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!isAccountOpen && !isMobileOpen) {
      return undefined
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setIsAccountOpen(false)
        setIsMobileOpen(false)
      }
    }

    document.addEventListener("keydown", handleEscape)
    document.body.style.overflow = "hidden"

    return () => {
      document.removeEventListener(
        "keydown",
        handleEscape,
      )
      document.body.style.overflow = ""
    }
  }, [isAccountOpen, isMobileOpen])

  function closePanels() {
    setIsAccountOpen(false)
    setIsMobileOpen(false)
  }

  async function handleLogout() {
    if (isLoggingOut) return

    setIsLoggingOut(true)

    try {
      await logoutUser()
      window.location.href = "/login"
    } catch {
      setIsLoggingOut(false)
    }
  }

  const initials = getInitials(user?.full_name)

  return (
    <>
      <header className="top-nav">
        <div className="nav-inner">
          <Logo />

          <nav
            className="desktop-nav"
            aria-label="Main navigation"
          >
            <NavLink
              to="/dashboard"
              className={navClass}
            >
              Dashboard
            </NavLink>

            <NavLink
              to="/jobs"
              className={navClass}
            >
              Jobs
            </NavLink>

            <NavLink
              to="/applications"
              className={navClass}
            >
              Applications
            </NavLink>

            <NavLink
              to="/resume"
              className={navClass}
            >
              Resume
            </NavLink>

            <NavLink
              to="/interview"
              className={({ isActive }) =>
                `nav-link ai-nav-link${
                  isActive ? " active" : ""
                }`
              }
            >
              <Sparkles size={15} />
              AI Tools
            </NavLink>
          </nav>

          <div className="nav-actions">

            <button
              type="button"
              className="account-trigger"
              aria-label="Open account panel"
              aria-expanded={isAccountOpen}
              onClick={() => {
                setIsMobileOpen(false)
                setIsAccountOpen(true)
              }}
            >
              <span className="avatar">
                {initials}
              </span>

              <span className="profile-copy">
                <strong>
                  {user?.full_name || "CareerForge User"}
                </strong>

                <small>
                  {formatRole(user?.role)}
                </small>
              </span>
            </button>

            <button
              type="button"
              className="mobile-menu"
              aria-label="Open navigation"
              aria-expanded={isMobileOpen}
              onClick={() => {
                setIsAccountOpen(false)
                setIsMobileOpen(true)
              }}
            >
              <Menu size={22} />
            </button>
          </div>
        </div>
      </header>

      {(isAccountOpen || isMobileOpen) && (
        <button
          type="button"
          className="nav-drawer-backdrop"
          aria-label="Close navigation panel"
          onClick={closePanels}
        />
      )}

      <aside
        className={`account-drawer${
          isAccountOpen ? " open" : ""
        }`}
        aria-hidden={!isAccountOpen}
      >
        <div className="drawer-header">
          <span className="drawer-kicker">
            Career Identity
          </span>

          <button
            type="button"
            className="drawer-close"
            aria-label="Close account panel"
            onClick={() => setIsAccountOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <div className="drawer-profile">
          <span className="drawer-avatar">
            {initials}
          </span>

          <div>
            <strong>
              {user?.full_name || "CareerForge User"}
            </strong>

            <span>
              {user?.email || ""}
            </span>
          </div>
        </div>

        <div className="drawer-role">
          <Sparkles size={16} />

          <div>
            <span>Account Access</span>
            <strong>
              {formatRole(user?.role)}
            </strong>
          </div>
        </div>

        <div className="drawer-actions">
          <button
            type="button"
            onClick={() => {
              closePanels()
              navigate("/resume")
            }}
          >
            <UserRound size={18} />

            <span>
              <strong>Career Profile</strong>
              <small>
                Resume and professional identity
              </small>
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              closePanels()
              navigate("/applications")
            }}
          >
            <BriefcaseBusiness size={18} />

            <span>
              <strong>Application Activity</strong>
              <small>
                Review your career pipeline
              </small>
            </span>
          </button>
        </div>

        <div className="drawer-footer">
          <button
            type="button"
            className="drawer-signout"
            disabled={isLoggingOut}
            onClick={handleLogout}
          >
            <LogOut size={18} />

            {isLoggingOut
              ? "Signing out..."
              : "End CareerForge Session"}
          </button>
        </div>
      </aside>

      <aside
        className={`mobile-nav-drawer${
          isMobileOpen ? " open" : ""
        }`}
        aria-hidden={!isMobileOpen}
      >
        <div className="drawer-header">
          <span className="drawer-kicker">
            Navigate
          </span>

          <button
            type="button"
            className="drawer-close"
            aria-label="Close navigation"
            onClick={() => setIsMobileOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <nav
          className="mobile-drawer-links"
          aria-label="Mobile navigation"
        >
          {navigation.map((item) => {
            const Icon = item.icon

            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={closePanels}
              >
                <Icon size={19} />
                <span>{item.label}</span>
              </NavLink>
            )
          })}

          <NavLink
            to="/interview"
            onClick={closePanels}
          >
            <Sparkles size={19} />
            <span>AI Tools</span>
          </NavLink>
        </nav>

        <button
        type="button"
        className="mobile-account-link"
        onClick={() => {
          setIsMobileOpen(false)
          setIsAccountOpen(true)
        }}
      >
        <UserRound size={18} />

        <span>
          <strong>Career Profile</strong>
          <small>{user?.full_name || "CareerForge User"}</small>
        </span>

        <ArrowRight size={17} className="mobile-account-arrow" />
      </button>
      </aside>
    </>
  )
}

export default TopNav

