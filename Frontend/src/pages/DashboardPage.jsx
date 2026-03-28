import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/Dashboard.css'

export default function DashboardPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [requests, setRequests] = useState([])
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    if (isChatOpen) {
      scrollToBottom()
    }
  }, [messages, isChatOpen])

  useEffect(() => {
    try {
      const currentUser = localStorage.getItem('currentUser')
      if (!currentUser) {
        navigate('/login')
      } else {
        const userData = JSON.parse(currentUser)
        setUser(userData)
        fetchUserData(userData.id)
        fetchRequests(userData.id)
        fetchMessages(userData.id)
        
        const interval = setInterval(() => {
          fetchMessages(userData.id)
        }, 3000)
        return () => clearInterval(interval)
      }
    } catch (err) {
      console.error('Error parsing user data:', err)
      localStorage.removeItem('currentUser')
      navigate('/login')
    }
  }, [navigate])

  const fetchUserData = async (userId) => {
    try {
      const response = await fetch(`http://127.0.0.1:5000/api/user/${userId}`)
      const data = await response.json()
      if (response.ok) {
        setUser(prev => ({ ...prev, ...data }))
      }
    } catch (err) {
      console.error('Failed to fetch user data:', err)
    }
  }

  const fetchRequests = async (userId) => {
    try {
      const response = await fetch(`http://127.0.0.1:5000/api/dashboard/${userId}`)
      const data = await response.json()
      setRequests(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Failed to fetch requests:', err)
    }
  }

  const fetchMessages = async (userId) => {
    try {
      const response = await fetch(`http://127.0.0.1:5000/api/messages/${userId}`)
      const data = await response.json()
      setMessages(Array.isArray(data) ? data : [])
      setLoading(false)
    } catch (err) {
      console.error('Failed to fetch messages:', err)
      setLoading(false)
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    setIsSending(true)
    try {
      const response = await fetch('http://127.0.0.1:5000/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          sender: 'resident',
          message_text: newMessage
        })
      })

      if (response.ok) {
        setNewMessage('')
        fetchMessages(user.id)
      }
    } catch (err) {
      console.error('Failed to send message:', err)
    } finally {
      setIsSending(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('currentUser')
    navigate('/')
  }

  if (!user) {
    return (
      <div style={{ padding: '100px', textAlign: 'center', background: 'white', minHeight: '100vh' }}>
        <h2>Loading your dashboard data...</h2>
        <p>If this takes too long, please try logging in again.</p>
        <button onClick={() => navigate('/login')} style={{ marginTop: '20px', padding: '10px 20px' }}>Go to Login</button>
      </div>
    )
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        <div className="welcome-card">
          <div className="welcome-header">
            <div className="profile-main-container">
              {user.photo ? (
                <img src={user.photo} alt="Profile" className="profile-main-img" />
              ) : (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', color: '#94a3b8', fontSize: '3rem' }}>👤</div>
              )}
            </div>
            
            <div className="welcome-text">
              <h1 className="welcome-title">Hello, {user.full_name || user.email}!</h1>
              <p className="welcome-subtitle">Welcome back to Barangay 830 Management System</p>
            </div>
          </div>
          
          <div className="user-info clickable" onClick={() => navigate('/profile')}>
            <h3>Your Account Details <span>View Full Profile →</span></h3>
            <ul>
              <li>
                <strong>Full Name</strong>
                <span>{user.full_name || 'N/A'}</span>
              </li>
              <li>
                <strong>Email Address</strong>
                <span>{user.email}</span>
              </li>
              <li>
                <strong>Last Login</strong>
                <span>{user.loginTime ? new Date(user.loginTime).toLocaleString() : 'Just now'}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="requests-section">
          <h2>Your Certificate Requests</h2>
          {loading ? (
            <p>Checking database for requests...</p>
          ) : Array.isArray(requests) && requests.length === 0 ? (
            <div className="empty-requests">
              <p>You haven't submitted any requests yet.</p>
              <button onClick={() => navigate('/request')} className="btn-request">Request a Form Now</button>
            </div>
          ) : Array.isArray(requests) ? (
            <div className="table-responsive">
              <table className="requests-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Verification</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map(req => (
                    <tr key={req.id}>
                      <td>{req.request_date ? new Date(req.request_date).toLocaleDateString() : '-'}</td>
                      <td className="certificate-type">{req.certificate_type}</td>
                      <td>
                        <span className={`status-badge ${req.process_status === 'Claimed' ? 'status-verified' : 'status-pending'}`}>
                          {req.process_status}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge ${req.verification_status === 'Verified' ? 'status-verified' : 'status-pending'}`}>
                          {req.verification_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      </div>

      {/* Support Chat Overlay */}
      <div className={`support-chat-widget ${isChatOpen ? 'open' : ''}`}>
        <button className="chat-toggle" onClick={() => setIsChatOpen(!isChatOpen)}>
          {isChatOpen ? '✕' : '💬 Support Chat'}
        </button>
        
        {isChatOpen && (
          <div className="chat-window">
            <div className="chat-header">
              <h3>Support Chat</h3>
              <p>Ask us anything about your requests</p>
            </div>
            
            <div className="chat-messages">
              {messages.length === 0 ? (
                <div className="no-messages">No messages yet. Start a conversation!</div>
              ) : (
                messages.map((msg, index) => (
                  <div key={index} className={`message-bubble ${msg.sender === 'resident' ? 'sent' : 'received'}`}>
                    <div className="message-content">{msg.message_text}</div>
                    <div className="message-time">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
            
            <form className="chat-input-area" onSubmit={handleSendMessage}>
              <input 
                type="text" 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                disabled={isSending}
              />
              <button type="submit" disabled={isSending || !newMessage.trim()}>
                {isSending ? '...' : 'Send'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
