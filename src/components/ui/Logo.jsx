import { Sparkles } from "lucide-react"

function Logo() {
  return (
    <div className="brand">
      <span className="brand-mark">
        <Sparkles size={19} />
      </span>

      <span className="brand-name">
        CareerForge <strong>AI</strong>
      </span>
    </div>
  )
}

export default Logo