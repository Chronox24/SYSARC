import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/Dashboard.css'

export default function DashboardPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const currentUser = localStorage.getItem('currentUser')
    if (!currentUser) {
      navigate('/login')
    } else {
      const userData = JSON.parse(currentUser)
      setUser(userData)
      fetchRequests(userData.id)
    }
  }, [navigate])

  const fetchRequests = async (userId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/dashboard/${userId}`)
      const data = await response.json()
      setRequests(Array.isArray(data) ? data : [])
      setLoading(false)
    } catch (err) {
      console.error('Failed to fetch requests:', err)
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('currentUser')
    navigate('/')
  }

  if (!user) {
    return <div>Loading...</div>
  }

  return (
    <div className="dashboard-container">
      <nav className="navbar">
        <div className="navbar-content">
          <h2 className="navbar-title">Welcome to Brgy.830</h2>
          <button onClick={handleLogout} className="logout-button">
            Logout
          </button>
        </div>
      </nav>

      <div className="dashboard-content">
        <div className="welcome-card">
          <h1>Hello, {user.full_name || user.email}! </h1>
          <p>You're successfully logged in to SysArc</p>
          
          <div className="user-info clickable" onClick={() => navigate('/profile')} style={{ cursor: 'pointer' }}>
            <h3>Your Account <span className="view-link">→ View Full Profile</span></h3>
            <ul>
              {user.full_name && <li><strong>Name:</strong> {user.full_name}</li>}
              {user.nickname && <li><strong>Nickname:</strong> {user.nickname}</li>}
              <li><strong>Email:</strong> {user.email}</li>
              {user.gender && <li><strong>Gender:</strong> {user.gender}</li>}
              {user.age && <li><strong>Age:</strong> {user.age}</li>}
              <li><strong>Login Time:</strong> {new Date(user.loginTime).toLocaleString()}</li>
            </ul>
          </div>
        </div>

        <div className="requests-section">
          <h2>Your Certificate Requests</h2>
          {loading ? (
            <p>Loading requests...</p>
          ) : requests.length === 0 ? (
            <p>No requests yet. <a href="/request">Submit a request</a></p>
          ) : (
            <table className="requests-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Certificate Type</th>
                  <th>Status</th>
                  <th>Verification</th>
                </tr>
              </thead>
              <tbody>
                {requests.map(req => (
                  <tr key={req.id}>
                    <td>{new Date(req.request_date).toLocaleDateString()}</td>
                    <td>{req.certificate_type}</td>
                    <td>{req.process_status}</td>
                    <td>{req.verification_status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
