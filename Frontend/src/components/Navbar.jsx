import { Link, useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"
import "../styles/Navbar.css"

export default function Navbar() {
  const [user, setUser] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const checkUser = () => {
      const storedUser = localStorage.getItem("currentUser")
      if (storedUser) {
        setUser(JSON.parse(storedUser))
      } else {
        setUser(null)
      }
    }

    checkUser()

    window.addEventListener("storage", checkUser)
    
    window.addEventListener("userLoggedIn", checkUser)
    window.addEventListener("userLoggedOut", () => setUser(null))
    
    return () => {
      window.removeEventListener("storage", checkUser)
      window.removeEventListener("userLoggedIn", checkUser)
      window.removeEventListener("userLoggedOut", () => setUser(null))
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("currentUser")
    setUser(null)
    window.dispatchEvent(new Event('userLoggedOut'))
    navigate("/")
  }

  return (
    <header className="navbar">
      <div className="navbar-left" onClick={() => navigate("/")}>
        <div className="navbar-logo-container">
          <img src="/logo_brgy.png" alt="Logo" className="navbar-logo" />
        </div>
        <span className="navbar-brand">Barangay 830</span>
      </div>

      <nav className="navbar-center">
      </nav>

      <div className="navbar-right">
        {!user ? (
          <>
            <Link className="nav-btn-outline" to="/login">Sign in</Link>
            <Link className="nav-btn-primary" to="/register">Sign up</Link>
          </>
        ) : (
          <>
            <Link className="nav-link-item" to="/request">Request a Form</Link>
            <Link className="nav-link-item" to="/profile">My Account</Link>
            <button className="nav-btn-logout" onClick={handleLogout}>
              Sign Out
            </button>
          </>
        )}
      </div>
    </header>
  )
}
