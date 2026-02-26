import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/Dashboard.css'
import '../styles/AdminDashboard.css'

export default function AdminDashboardPage() {
  const navigate = useNavigate()
  const [admin, setAdmin] = useState(null)
  const [accounts, setAccounts] = useState([])
  const [certificateRequests, setCertificateRequests] = useState([])
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [requestLoading, setRequestLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('residents')

  const [questions, setQuestions] = useState([])
  const [questionsLoading, setQuestionsLoading] = useState(true)
  const [selectedQuestion, setSelectedQuestion] = useState(null)
  const [answerText, setAnswerText] = useState('')
  const [newQuestionText, setNewQuestionText] = useState('')
  const [newQuestionResidentId, setNewQuestionResidentId] = useState(null)
  const [editorContent, setEditorContent] = useState('')
  const [editorVerification, setEditorVerification] = useState('Not Verified')
  const [editorProcess, setEditorProcess] = useState('In process')
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const adminUser = localStorage.getItem('adminUser')
    if (!adminUser) {
      navigate('/admin-login')
    } else {
      const userData = JSON.parse(adminUser)
      setAdmin(userData)
      fetchAccounts()
      fetchRequests()
      fetchQuestions()
    }
  }, [navigate])

  const fetchAccounts = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/all-accounts')
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
      const token = JSON.parse(localStorage.getItem('adminUser') || 'null')?.token
      const res = await fetch('http://localhost:5000/api/all-requests', { headers: { Authorization: `Bearer ${token}` } })
      if (res.status === 401) { localStorage.removeItem('adminUser'); navigate('/admin-login'); return }
      const data = await res.json()
      setCertificateRequests(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Failed to fetch requests:', err)
    }
    setRequestLoading(false)
  }

  const fetchQuestions = async () => {
    setQuestionsLoading(true)
    try {
      const token = JSON.parse(localStorage.getItem('adminUser') || 'null')?.token
      const res = await fetch('http://localhost:5000/api/questions', { headers: { Authorization: `Bearer ${token}` } })
      if (res.status === 401) { localStorage.removeItem('adminUser'); navigate('/admin-login'); return }
      const data = await res.json()
      setQuestions(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Failed to load questions', err)
    }
    setQuestionsLoading(false)
  }

  useEffect(() => {
    if (activeTab === 'requests') fetchRequests()
    if (activeTab === 'questions') fetchQuestions()
  }, [activeTab])

  const handleLogout = () => {
    localStorage.removeItem('adminUser')
    navigate('/admin-login')
  }

  const filteredAccounts = accounts.filter(account =>
    account.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return <div>Loading...</div>
  }

  if (!admin) {
    return null
  }

  return (
    <div className="admin-container">

      <div className="admin-header">
        <h1>📊 Admin Dashboard</h1>
        <div>
          <span>Welcome, {admin.name}</span>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <button onClick={() => setActiveTab('residents')}>Residents</button>
        <button onClick={() => setActiveTab('requests')}>Certificate Requests</button>
        <button onClick={() => setActiveTab('questions')}>Questions</button>
      </div>

      {activeTab === 'residents' && (
        <div className="card">
          <h2>👥 Registered Residents</h2>

          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: 8, marginBottom: 12 }}
          />

          {filteredAccounts.length === 0 ? (
            <p>No residents found</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Gender</th>
                  <th>Age</th>
                  <th>Registered At</th>
                </tr>
              </thead>
              <tbody>
                {filteredAccounts.map(account => (
                  <tr key={account.id}>
                    <td>{account.id}</td>
                    <td>{account.full_name}</td>
                    <td>{account.email}</td>
                    <td>{account.gender || '-'}</td>
                    <td>{account.age || '-'}</td>
                    <td>{new Date(account.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div style={{ marginTop: 20 }}>
            <strong>Total Registered Residents:</strong> {filteredAccounts.length}
          </div>
        </div>
      )}

      {activeTab === 'requests' && (
        <div className="card">
          <h2>📄 Certificate Requests</h2>

          {requestLoading ? (
            <p>Loading...</p>
          ) : certificateRequests.length === 0 ? (
            <p>No certificate requests</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
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
                    <td>{r.id}</td>
                    <td>{r.full_name}</td>
                    <td>{r.email}</td>
                    <td>{r.certificate_type}</td>
                    <td>{new Date(r.request_date).toLocaleString()}</td>
                    <td>{r.verification_status}</td>
                    <td>{r.process_status}</td>
                    <td><button onClick={() => {
                      setSelectedRequest(r)
                      setEditorContent(r.certificate_content || `Certificate for ${r.full_name}`)
                      setEditorVerification(r.verification_status || 'Not Verified')
                      setEditorProcess(r.process_status || 'In process')
                    }}>Edit</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {selectedRequest && (
            <div className="modal">
              <div className="modal-content">
                <div style={{display:'flex', justifyContent:'space-between'}}>
                  <h3>Edit Request #{selectedRequest.id} — {selectedRequest.full_name}</h3>
                  <button onClick={() => setSelectedRequest(null)}>✕</button>
                </div>
                <div style={{display:'flex', gap:12}}>
                  <div style={{flex:1}}>
                    <label>Certificate Content</label>
                    <textarea rows={8} value={editorContent} onChange={(e) => setEditorContent(e.target.value)} style={{width:'100%'}} />
                  </div>
                  <div style={{width:260}}>
                    <label>Verification Status</label>
                    <select value={editorVerification} onChange={(e)=>setEditorVerification(e.target.value)}>
                      <option>Not Verified</option>
                      <option>Verified</option>
                      <option>Not Valid</option>
                    </select>
                    <label>Process Status</label>
                    <select value={editorProcess} onChange={(e)=>setEditorProcess(e.target.value)}>
                      <option>In process</option>
                      <option>Completed</option>
                      <option>Rejected</option>
                    </select>
                    <div style={{marginTop:12}}>
                      <button onClick={async ()=>{
                        try {
                          const token = JSON.parse(localStorage.getItem('adminUser')||'null')?.token
                          await fetch(`http://localhost:5000/api/request/${selectedRequest.id}`, {method:'PUT', headers:{'Content-Type':'application/json', Authorization:`Bearer ${token}`}, body: JSON.stringify({verification_status:editorVerification, process_status: editorProcess, certificate_content: editorContent})})
                          await fetchRequests()
                          setSelectedRequest(null)
                        } catch(err){console.error(err)}
                      }}>Save</button>
                      <button onClick={() => {
                        const w = window.open('', '_blank')
                        if (!w) return
                        w.document.write(`<pre style="white-space:pre-wrap">${editorContent}</pre>`)
                        w.document.close(); w.focus(); w.print(); w.close()
                      }}>Print</button>
                      <button onClick={() => {
                        const blob = new Blob([`<html><body><pre style="white-space:pre-wrap">${editorContent}</pre></body></html>`], {type:'text/html'})
                        const url = URL.createObjectURL(blob)
                        const a = document.createElement('a'); a.href = url; a.download = `certificate_${selectedRequest.id}.html`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url)
                      }}>Download</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'questions' && (
        <div className="card">
          <h2>❓ Resident Questions</h2>

          <div style={{marginBottom:12}}>
            <label>Create question (assign to resident)</label>
            <div style={{display:'flex', gap:8, marginTop:6}}>
              <select value={newQuestionResidentId || ''} onChange={(e)=>setNewQuestionResidentId(Number(e.target.value))}>
                <option value="">Select resident</option>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.full_name} ({a.email})</option>)}
              </select>
              <input placeholder="Question text" value={newQuestionText} onChange={(e)=>setNewQuestionText(e.target.value)} style={{flex:1}} />
              <button onClick={async ()=>{
                if (!newQuestionText || !newQuestionResidentId) return
                try {
                  await fetch('http://localhost:5000/api/question', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({user_id:newQuestionResidentId, question_text:newQuestionText})})
                  setNewQuestionText('')
                  await fetchQuestions()
                } catch(err){console.error(err)}
              }}>Submit</button>
            </div>
          </div>

          {questionsLoading ? (
            <p>Loading...</p>
          ) : questions.length === 0 ? (
            <p>No questions</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Resident</th>
                  <th>Email</th>
                  <th>Question</th>
                  <th>Answer</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {questions.map(q => (
                  <tr key={q.id}>
                    <td>{q.id}</td>
                    <td>{q.full_name}</td>
                    <td>{q.email}</td>
                    <td>{q.question_text}</td>
                    <td>{q.answer_text || '-'}</td>
                    <td>{q.status}</td>
                    <td><button onClick={()=>{ setSelectedQuestion(q); setAnswerText(q.answer_text || '') }}>Reply</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {selectedQuestion && (
            <div className="modal">
              <div className="modal-content">
                <div style={{display:'flex', justifyContent:'space-between'}}>
                  <h3>Reply to #{selectedQuestion.id} — {selectedQuestion.full_name}</h3>
                  <button onClick={()=>setSelectedQuestion(null)}>✕</button>
                </div>
                <div style={{marginTop:12}}>
                  <div style={{marginBottom:8}}><strong>Question:</strong></div>
                  <div style={{padding:12, background:'#f8f8f8'}}>{selectedQuestion.question_text}</div>
                </div>
                <div style={{marginTop:12}}>
                  <label>Your answer</label>
                  <textarea rows={6} value={answerText} onChange={(e)=>setAnswerText(e.target.value)} style={{width:'100%'}} />
                </div>
                <div style={{marginTop:12}}>
                  <button onClick={async ()=>{
                    try { const token = JSON.parse(localStorage.getItem('adminUser')||'null')?.token; await fetch(`http://localhost:5000/api/question/${selectedQuestion.id}`, {method:'PUT', headers:{'Content-Type':'application/json', Authorization:`Bearer ${token}`}, body: JSON.stringify({answer_text:answerText, status:'Answered'})}); setSelectedQuestion(null); setAnswerText(''); await fetchQuestions(); } catch(err){console.error(err)}
                  }}>Send Answer</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  )
}