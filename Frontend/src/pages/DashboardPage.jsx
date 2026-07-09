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
  const [viewMockupRequest, setViewMockupRequest] = useState(null)
  
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
      const response = await fetch(`/api/user/${userId}`)
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
      const response = await fetch(`/api/dashboard/${userId}`)
      const data = await response.json()
      setRequests(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Failed to fetch requests:', err)
    }
  }

  const fetchMessages = async (userId) => {
    try {
      const response = await fetch(`/api/messages/${userId}`)
      const data = await response.json()
      setMessages(Array.isArray(data) ? data : [])
      setLoading(false)
    } catch (err) {
      console.error('Failed to fetch messages:', err)
      setLoading(false)
    }
  }

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A'
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return dateString
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    } catch (err) {
      return dateString
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    setIsSending(true)
    try {
      const response = await fetch('/api/messages', {
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
      <div style={{ padding: '100px', textAlign: 'center', background: 'var(--surface)', minHeight: '100vh' }}>
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
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-muted)', color: 'var(--text-secondary)', fontSize: '3rem' }}>👤</div>
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
                <strong>Account Created</strong>
                <span>{formatDateTime(user.created_at)}</span>
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
                    <th>Requested On</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Verification</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map(req => (
                    <tr key={req.id}>
                      <td>{req.request_date ? new Date(req.request_date).toLocaleString() : req.created_at ? new Date(req.created_at).toLocaleString() : '-'}</td>
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
                      <td>
                        {(req.verification_status === 'Verified' && (req.process_status === 'For Pickup' || req.process_status === 'Claimed')) ? (
                          <button className="btn-request" style={{ padding: '8px 12px', fontSize: '12px', margin: 0 }} onClick={() => setViewMockupRequest(req)}>View Document</button>
                        ) : (
                          <span style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic' }}>Not yet ready</span>
                        )}
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

      {/* View Mockup Modal */}
      {viewMockupRequest && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', maxWidth: '800px', width: '90%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '24px 32px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#0f172a' }}>Certificate Mockup</h3>
                <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#64748b' }}>Preview of your requested document</p>
              </div>
              <button 
                onClick={() => setViewMockupRequest(null)}
                style={{ width: '40px', height: '40px', borderRadius: '50%', border: 'none', backgroundColor: '#e2e8f0', color: '#475569', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >✕</button>
            </div>
            
            <div style={{ padding: '40px', backgroundColor: '#f8fafc', overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ width: '100%', border: '4px double #334155', padding: '60px', textAlign: 'center', position: 'relative', backgroundColor: '#ffffff', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
                <h1 style={{ fontSize: '32px', marginBottom: '40px', textTransform: 'uppercase', letterSpacing: '4px', borderBottom: '2px solid #334155', display: 'inline-block', paddingBottom: '10px', color: '#0f172a', fontWeight: '900' }}>
                  {viewMockupRequest.certificate_type || 'Barangay Certificate'}
                </h1>
                
                <div style={{ textAlign: 'left', margin: '0 auto 30px', maxWidth: '80%', padding: '20px', backgroundColor: '#f1f5f9', borderRadius: '8px', borderLeft: '4px solid #3b82f6' }}>
                  <h4 style={{ margin: '0 0 10px 0', color: '#0f172a', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>To Whom It May Concern:</h4>
                  <p style={{ margin: '0 0 5px 0', fontSize: '16px', color: '#334155' }}>
                    This is to certify that <strong style={{ fontSize: '18px', color: '#0f172a', textDecoration: 'underline' }}>{user?.full_name || 'Resident Name'}</strong>,
                  </p>
                  <p style={{ margin: '0', fontSize: '16px', color: '#334155' }}>
                    is a bona fide resident of <strong style={{ color: '#0f172a' }}>{user?.home_address || user?.address || 'Barangay 830'}</strong>.
                  </p>
                </div>
                
                {viewMockupRequest.visible_to_resident === 'pdf' ? (
                  viewMockupRequest.pdf_file ? (
                    <div style={{ margin: '40px 0', width: '100%', height: '600px', border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden' }}>
                      <iframe 
                        src={viewMockupRequest.pdf_file} 
                        style={{ width: '100%', height: '100%', border: 'none' }}
                        title="Certificate PDF"
                      />
                    </div>
                  ) : (
                    <p style={{ fontSize: '18px', margin: '40px 0', color: '#ef4444' }}>
                      Admin has set the visibility to PDF, but no PDF is attached.
                    </p>
                  )
                ) : (
                  viewMockupRequest.certificate_content ? (
                    <div 
                      style={{ fontSize: '18px', margin: '40px 0', lineHeight: '2', textAlign: 'justify', color: '#334155' }}
                      dangerouslySetInnerHTML={{ __html: viewMockupRequest.certificate_content }}
                    />
                  ) : (
                    <p style={{ fontSize: '18px', margin: '40px 0', whiteSpace: 'pre-wrap', lineHeight: '2', textAlign: 'justify', color: '#334155' }}>
                      Official content will be generated here upon verification by the Barangay.
                      
                      This certifies that the requested information is being processed.
                    </p>
                  )
                )}
                
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '80px', alignItems: 'flex-end' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ borderBottom: '2px solid #0f172a', width: '250px', marginBottom: '8px' }}></div>
                    <p style={{ fontSize: '14px', fontWeight: 'bold', margin: 0, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '1px' }}>Barangay Captain</p>
                  </div>
                  
                  <div style={{ textAlign: 'right', padding: '15px', border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: '#f8fafc' }}>
                    <p style={{ fontSize: '12px', fontWeight: 'bold', margin: '0 0 5px 0', color: '#64748b' }}>VERIFICATION STATUS</p>
                    <p style={{ fontSize: '16px', fontWeight: '900', margin: 0, color: viewMockupRequest.verification_status === 'Verified' ? '#10b981' : (viewMockupRequest.verification_status === 'Not Valid' ? '#ef4444' : '#f59e0b') }}>
                      {viewMockupRequest.verification_status || 'Pending'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}