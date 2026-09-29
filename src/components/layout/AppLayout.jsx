import TopNav from "./TopNav"

function AppLayout({ children }) {
  return (
    <div className="app-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <TopNav />

      <main className="app-content">
        {children}
      </main>
    </div>
  )
}

export default AppLayout