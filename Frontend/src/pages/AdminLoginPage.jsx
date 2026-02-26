import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import '../styles/Auth.css'

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (!email || !password) {
        setError('Please fill in all fields')
        setLoading(false)
        return
      }

      if (!email.includes('@')) {
        setError('Please enter a valid email')
        setLoading(false)
        return
      }

      const response = await fetch('http://localhost:5000/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          password
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.message || 'Login failed')
        setLoading(false)
        return
      }

      localStorage.setItem('adminUser', JSON.stringify({
        id: data.admin.id,
        email: data.admin.email,
        name: data.admin.name,
        role: data.admin.role,
        token: data.token,
        loginTime: new Date().toISOString()
      }))
      
      window.dispatchEvent(new Event('adminLoggedIn'))
      
      navigate('/admin-dashboard')
    } catch (err) {
      setError('Login failed. Please check if the server is running.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">Admin Login</h1>
        
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleLogin} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          <button 
            type="submit" 
            className="auth-button"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="auth-footer">
          <p><Link to="/">Back to User Login</Link></p>
        </div>
      </div>
    </div>
  )
}
