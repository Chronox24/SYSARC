import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/AdminFlux.css'

export default function AdminDashboardPage() {
  const navigate = useNavigate()
  const [admin, setAdmin] = useState(null)
  const [accounts, setAccounts] = useState([])
  const [certificateRequests, setCertificateRequests] = useState([])
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [requestLoading, setRequestLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('residents')
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const [editorContent, setEditorContent] = useState('')
  const [editorVerification, setEditorVerification] = useState('Not Verified')
  const [editorProcess, setEditorProcess] = useState('In process')

  const [messages, setMessages] = useState([])
  const [conversations, setConversations] = useState([])
  const [selectedChatResident, setSelectedChatResident] = useState(null)
  const [replyText, setReplyText] = useState('')

  const messagesEndRef = React.useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    const adminUser = localStorage.getItem('adminUser')
    if (!adminUser) {
      navigate('/admin-login')
    } else {
      const userData = JSON.parse(adminUser)
      setAdmin(userData)
      fetchAccounts()
      fetchRequests()
      fetchConversations()
    }
  }, [navigate])

  useEffect(() => {
    if (activeTab === 'requests') fetchRequests()
    if (activeTab === 'residents') fetchAccounts()
    if (activeTab === 'chat') fetchConversations()
  }, [activeTab])

  useEffect(() => {
    const timer = setInterval(() => {
      if (activeTab === 'requests') fetchRequests()
      if (activeTab === 'chat') {
        fetchConversations()
        if (selectedChatResident) {
          fetchMessages(selectedChatResident.id)
          markAsRead(selectedChatResident.id)
        }
      }
    }, 5000);
    return () => clearInterval(timer);
  }, [activeTab, selectedChatResident])

  const fetchConversations = async () => {
    try {
      const res = await fetch('http://127.0.0.1:5000/api/admin/conversations')
      const data = await res.json()
      setConversations(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Failed to load conversations', err)
    }
  }

  const fetchMessages = async (userId) => {
    try {
      const res = await fetch(`http://127.0.0.1:5000/api/messages/${userId}`)
      const data = await res.json()
      setMessages(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Failed to load messages', err)
    }
  }

  const handleSendMessage = async () => {
    if (!replyText.trim() || !selectedChatResident) return
    try {
      const response = await fetch('http://127.0.0.1:5000/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: selectedChatResident.id,
          sender: 'admin',
          message_text: replyText
        })
      })
      if (response.ok) {
        setReplyText('')
        fetchMessages(selectedChatResident.id)
        fetchConversations()
      }
    } catch (err) {
      console.error('Error sending message:', err)
    }
  }

  const markAsRead = async (userId) => {
    try {
      await fetch(`http://127.0.0.1:5000/api/admin/messages/read/${userId}`, { method: 'PUT' })
      fetchConversations()
    } catch (err) {
      console.error('Error marking as read:', err)
    }
  }

  useEffect(() => {
    if (selectedChatResident) {
      fetchMessages(selectedChatResident.id)
      markAsRead(selectedChatResident.id)
    }
  }, [selectedChatResident])

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  const fetchAccounts = async () => {
    try {
      const response = await fetch('http://127.0.0.1:5000/api/all-accounts')
      const data = await response.json()
      setAccounts(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Failed to fetch accounts:', err)
    }
    setLoading(false)
  }

  const fetchRequests = async () => {
    setRequestLoading(true)
    try {
      const res = await fetch('http://127.0.0.1:5000/api/all-requests')
      const data = await res.json()
      setCertificateRequests(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Failed to fetch requests:', err.message)
      setCertificateRequests([])
    }
    setRequestLoading(false)
  }

  const refreshAll = () => {
    fetchAccounts();
    fetchRequests();
    fetchConversations();
  }

  const handleLogout = () => {
    localStorage.removeItem('adminUser')
    navigate('/admin-login')
  }

  const handleRemovePhoto = async (userId) => {
    if (!window.confirm('Are you sure you want to remove this photo?')) return;
    try {
      const response = await fetch(`http://127.0.0.1:5000/api/admin/remove-photo/${userId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        alert('Photo removed successfully');
        fetchAccounts();
      } else {
        alert('Failed to remove photo');
      }
    } catch (err) {
      console.error('Error removing photo:', err);
    }
  };

  const handleUpdatePhoto = async (userId, file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append('photo', file);

    try {
      const response = await fetch(`http://127.0.0.1:5000/api/user/${userId}`, {
        method: 'PUT',
        body: formData
      });
      if (response.ok) {
        alert('Photo updated successfully');
        fetchAccounts();
      } else {
        alert('Failed to update photo');
      }
    } catch (err) {
      console.error('Error updating photo:', err);
    }
  };

  const getProcessStatusClass = (status) => {
    switch (status) {
      case 'Claimed': return 'status-verified';
      case 'Void': return 'status-rejected';
      case 'For Pickup': return 'status-pickup';
      default: return 'status-pending';
    }
  };

  if (loading) return (
    <div className="loading-screen" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
      <div className="loading-spinner"></div>
      <div>Loading Flux Dashboard...</div>
      <div style={{ fontSize: '12px', opacity: 0.7 }}>Verifying connections to 127.0.0.1:5000</div>
    </div>
  )
  
  if (!admin) return <div className="loading-screen">Authenticating Admin...</div>

  // Safety check for stats
  const totalResidents = Array.isArray(accounts) ? accounts.length : 0;
  const activeRequestsCount = Array.isArray(certificateRequests) ? certificateRequests.filter(r => r.process_status === 'In process').length : 0;
  const unreadMessagesCount = Array.isArray(conversations) ? conversations.reduce((sum, conv) => sum + (conv.unread_count || 0), 0) : 0;

  const filteredAccounts = (Array.isArray(accounts) ? accounts : []).filter(account => {
    const nameMatch = account?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false
    const emailMatch = account?.email?.toLowerCase().includes(searchTerm.toLowerCase()) || false
    return nameMatch || emailMatch
  })

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="flux-sidebar">
        <div className="sidebar-logo">
          <img src="/logo_brgy.png" alt="Logo" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
          <span className="logo-text">Brgy.830</span>
        </div>
        
        <nav className="sidebar-nav">
          <p className="nav-section-title">Overview</p>
          <button className={`nav-item ${activeTab === 'residents' ? 'active' : ''}`} onClick={() => setActiveTab('residents')}>
            <span className="nav-icon">👥</span>
            <span className="nav-label">Residents</span>
          </button>
          <button className={`nav-item ${activeTab === 'requests' ? 'active' : ''}`} onClick={() => setActiveTab('requests')}>
            <span className="nav-icon">📜</span>
            <span className="nav-label">Requests</span>
          </button>
          <button className={`nav-item ${activeTab === 'chat' ? 'active' : ''}`} onClick={() => setActiveTab('chat')}>
            <span className="nav-icon">💬</span>
            <span className="nav-label">Support Chat</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="admin-avatar">{admin.name?.charAt(0)}</div>
          <div className="admin-info-text">
            <p className="admin-name">{admin.name}</p>
            <p className="admin-role">Administrator</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flux-main">
        <header className="flux-header">
          <div className="header-search">
            <span className="search-icon">🔍</span>
            <input 
              type="text" 
              placeholder="Search residents, requests..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="header-actions">
            <button className="logout-flux-btn" onClick={refreshAll}>🔄 Refresh</button>
            <button className="logout-flux-btn" onClick={handleLogout}>Sign Out</button>
          </div>
        </header>

        {/* Welcome Banner */}
        <section className="welcome-banner">
          <div className="banner-content">
            <h1>Good morning, {admin.name} 👋</h1>
            <p>Here's what's happening with Barangay 830 today.</p>
          </div>
          
          <div className="stats-grid">
            <div className="stat-card residents">
              <div className="stat-icon">👥</div>
              <div>
                <span className="stat-label">Total Residents</span>
                <span className="stat-value">{totalResidents}</span>
              </div>
              <div className="stat-trend trend-up">
                <span>↑ 12%</span>
                <span style={{ fontWeight: 400, color: 'var(--text-secondary)' }}>from last month</span>
              </div>
            </div>
            <div className="stat-card requests">
              <div className="stat-icon">📜</div>
              <div>
                <span className="stat-label">Active Requests</span>
                <span className="stat-value">{activeRequestsCount}</span>
              </div>
              <div className="stat-trend trend-down">
                <span>↓ 5%</span>
                <span style={{ fontWeight: 400, color: 'var(--text-secondary)' }}>from yesterday</span>
              </div>
            </div>
            <div className="stat-card messages">
              <div className="stat-icon">💬</div>
              <div>
                <span className="stat-label">Unread Messages</span>
                <span className="stat-value">{unreadMessagesCount}</span>
              </div>
              <div className="stat-trend trend-up">
                <span>↑ 8 new</span>
                <span style={{ fontWeight: 400, color: 'var(--text-secondary)' }}>awaiting reply</span>
              </div>
            </div>
            <div className="stat-card verified">
              <div className="stat-icon">✅</div>
              <div>
                <span className="stat-label">Verified Users</span>
                <span className="stat-value">{totalResidents}</span>
              </div>
              <div className="stat-trend trend-up">
                <span>100%</span>
                <span style={{ fontWeight: 400, color: 'var(--text-secondary)' }}>compliance</span>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', color: 'var(--text-primary)' }}>⚡ Quick Actions</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
            <button className="logout-flux-btn" style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center', padding: '16px' }} onClick={() => setActiveTab('requests')}>
              <span>➕</span> New Certificate
            </button>
            <button className="logout-flux-btn" style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center', padding: '16px' }} onClick={() => setActiveTab('chat')}>
              <span>📢</span> Broadcast News
            </button>
            <button className="logout-flux-btn" style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center', padding: '16px' }} onClick={refreshAll}>
              <span>📊</span> Generate Report
            </button>
          </div>
        </div>

        {selectedPhoto && (
          <div className="photo-modal" onClick={() => setSelectedPhoto(null)}>
            <div className="photo-modal-content">
              <img src={selectedPhoto} alt="Full size" />
              <button className="close-photo" onClick={() => setSelectedPhoto(null)}>✕</button>
            </div>
          </div>
        )}

        <div className="content-container">
          {activeTab === 'residents' && (
            <>
              <h2>👥 Registered Residents</h2>
              <table className="flux-table">
                <thead>
                  <tr>
                    <th>Photo</th>
                    <th>Full Name</th>
                    <th>Email</th>
                    <th>Gender</th>
                    <th>Age</th>
                    <th>Birthday</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAccounts.map(account => (
                    <tr key={account.id}>
                      <td>
                        <div className="admin-photo-cell">
                          <div 
                            className="admin-photo-preview clickable"
                            onClick={() => account.photo && setSelectedPhoto(account.photo)}
                          >
                            {account.photo ? <img src={account.photo} alt="" /> : <div className="admin-photo-placeholder">None</div>}
                          </div>
                          <div className="admin-photo-actions">
                            <label className="admin-photo-btn update-btn">
                              <input type="file" accept="image/*" onChange={(e) => handleUpdatePhoto(account.id, e.target.files[0])} style={{ display: 'none' }} />
                              ✎
                            </label>
                            {account.photo && <button className="admin-photo-btn remove-btn" onClick={() => handleRemovePhoto(account.id)}>✕</button>}
                          </div>
                        </div>
                      </td>
                      <td>{account.full_name}</td>
                      <td>{account.email}</td>
                      <td>{account.gender || '-'}</td>
                      <td>{account.age || '-'}</td>
                      <td>{formatDate(account.date_of_birth)}</td>
                      <td>
                        <button className="logout-flux-btn" onClick={() => setActiveTab('chat')}>Message</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {activeTab === 'requests' && (
            <>
              <h2>📄 Certificate Requests</h2>
              {requestLoading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--accent-purple)' }}>
                  ⏳ Loading requests from database...
                </div>
              ) : certificateRequests.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                  No certificate requests found in database.
                </div>
              ) : (
                <table className="flux-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Type</th>
                      <th>Date</th>
                      <th>Verification</th>
                      <th>Process</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {certificateRequests.map(r => (
                      <tr key={r.id}>
                        <td>{r.full_name || r.resident_name || 'Resident #' + r.user_id}</td>
                        <td>{r.certificate_type}</td>
                        <td>{new Date(r.request_date).toLocaleDateString()}</td>
                        <td><span className={`status-badge ${r.verification_status === 'Verified' ? 'status-verified' : r.verification_status === 'Not Valid' ? 'status-rejected' : 'status-pending'}`}>{r.verification_status}</span></td>
                        <td><span className={`status-badge ${getProcessStatusClass(r.process_status)}`}>{r.process_status}</span></td>
                        <td>
                          <button className="logout-flux-btn" onClick={() => {
                            setSelectedRequest(r)
                            setEditorContent(r.certificate_content || `Certificate for User #${r.user_id}`)
                            setEditorVerification(r.verification_status || 'Not Verified')
                            setEditorProcess(r.process_status || 'In process')
                          }}>Manage</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}

          {activeTab === 'chat' && (
            <div className="admin-chat-layout">
              {/* Chat Sidebar: Conversation List */}
              <div className="chat-sidebar">
                <div className="chat-sidebar-header">
                  <h3>Conversations</h3>
                </div>
                <div className="resident-list">
                  {conversations.length === 0 ? (
                    <div className="no-conversations">No active chats</div>
                  ) : (
                    conversations.map(resident => (
                      <div 
                        key={resident.id} 
                        className={`resident-chat-item ${selectedChatResident?.id === resident.id ? 'active' : ''}`}
                        onClick={() => setSelectedChatResident(resident)}
                      >
                        <div className="admin-avatar" style={{ width: '40px', height: '40px', fontSize: '14px' }}>
                          {resident.photo ? <img src={resident.photo} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : resident.full_name.charAt(0)}
                        </div>
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <p style={{ margin: 0, fontWeight: '600', fontSize: '14px' }}>{resident.full_name}</p>
                            {resident.unread_count > 0 && <div className="unread-badge">{resident.unread_count}</div>}
                          </div>
                          <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {resident.last_message}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Chat Window */}
              <div className="chat-window">
                {selectedChatResident ? (
                  <>
                    <div className="chat-window-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div className="admin-avatar" style={{ width: '40px', height: '40px' }}>
                          {selectedChatResident.photo ? <img src={selectedChatResident.photo} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : selectedChatResident.full_name.charAt(0)}
                        </div>
                        <div>
                          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>{selectedChatResident.full_name}</h3>
                          <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>Resident Support</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="chat-window-messages">
                      {messages.map(msg => (
                        <div key={msg.id} className={`message-bubble-wrapper ${msg.sender === 'admin' ? 'admin' : 'resident'}`}>
                          <div className="chat-bubble">
                            {msg.message_text}
                            <span className="bubble-time">
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>

                    <div className="chat-window-input">
                      <input 
                        type="text" 
                        placeholder="Type your reply..." 
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      />
                      <button 
                        className="chat-send-btn"
                        onClick={handleSendMessage}
                        disabled={!replyText.trim()}
                      >
                        ➤
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="no-chat-selected">
                    <div className="empty-state-icon">💬</div>
                    <h3>Your Chat Center</h3>
                    <p>Select a resident from the list to start messaging</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Manage Request Modal */}
      {selectedRequest && (
        <div className="flux-modal-overlay">
          <div className="flux-modal">
            <div className="modal-header">
              <div>
                <h3>Manage Request #{selectedRequest.id}</h3>
                <p>Update verification and processing status</p>
              </div>
              <button className="close-modal-btn" onClick={() => setSelectedRequest(null)}>✕</button>
            </div>
            
            <div className="modal-body">
              <div className="modal-section">
                <label className="modal-label">Certificate Content</label>
                <textarea 
                  className="modal-textarea"
                  rows={6} 
                  value={editorContent} 
                  onChange={(e) => setEditorContent(e.target.value)}
                  placeholder="Enter the official content for this certificate..."
                />
              </div>

              <div className="modal-row">
                <div className="modal-section">
                  <label className="modal-label">Verification Status</label>
                  <select 
                    className="modal-select"
                    value={editorVerification} 
                    onChange={(e) => setEditorVerification(e.target.value)}
                  >
                    <option value="Not Verified">Not Verified</option>
                    <option value="Verified">Verified (Valid)</option>
                    <option value="Not Valid">Not Valid</option>
                  </select>
                </div>
                
                <div className="modal-section">
                  <label className="modal-label">Process Status</label>
                  <select 
                    className="modal-select"
                    value={editorProcess} 
                    onChange={(e) => setEditorProcess(e.target.value)}
                  >
                    <option value="In process">In process</option>
                    <option value="For Pickup">For Pickup</option>
                    <option value="Claimed">Claimed</option>
                    <option value="Void">Void</option>
                  </select>
                </div>
              </div>

              <button 
                className="modal-save-btn"
                onClick={async () => {
                  try {
                    const response = await fetch(`http://127.0.0.1:5000/api/request/${selectedRequest.id}`, {
                      method: 'PUT', 
                      headers: { 'Content-Type': 'application/json' }, 
                      body: JSON.stringify({
                        verification_status: editorVerification, 
                        process_status: editorProcess, 
                        certificate_content: editorContent
                      })
                    })
                    if (response.ok) {
                      fetchRequests()
                      setSelectedRequest(null)
                    }
                  } catch(err) {
                    console.error('Error saving changes:', err)
                  }
                }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
