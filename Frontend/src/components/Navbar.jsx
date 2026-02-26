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
      <div className="navbar-left">
        <span>Barangay 830</span>
      </div>

      <nav className="navbar-center">
        <Link className="nav-box" to="/about">About Us</Link>
        <Link className="nav-box" to="/mission">Mission / Vision</Link>
        <Link className="nav-box" to="/request">Request a Form</Link>
      </nav>

      <div className="navbar-right">
        {!user ? (
          <>
            <Link className="btn signin" to="/">Sign in</Link>
            <Link className="btn signup" to="/register">Sign up</Link>
          </>
        ) : (
          <>
            <Link to="/profile" className="account-label">Account</Link>
            <button className="btn signup" onClick={handleLogout}>
              Sign Out
            </button>
          </>
        )}
      </div>
    </header>
  )
}
