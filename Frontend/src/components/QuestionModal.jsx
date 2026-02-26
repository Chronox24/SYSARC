import { useState } from 'react'
import '../styles/QuestionModal.css'

export default function QuestionModal({ open, onClose }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)

  if (!open) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!question.trim()) return alert('Please enter a question')
    if (!name || !name.trim()) return alert('Please enter your name')
    if (!email || !email.trim()) return alert('Please enter your email')
    // basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) return alert('Please enter a valid email address')
    setLoading(true)
    try {
      // include user id if logged in
      const stored = localStorage.getItem('currentUser')
      const user = stored ? JSON.parse(stored) : null

      const payload = {
        user_id: user ? user.id : null,
        name: name.trim(),
        email: email.trim(),
        question_text: question
      }

      const res = await fetch('http://localhost:5000/api/question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error('Failed to submit')
      alert('Question submitted — the admin will review it.')
      setQuestion('')
      setName('')
      setEmail('')
      onClose()
    } catch (err) {
      console.error(err)
      alert('Failed to submit question')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="qm-overlay">
      <div className="qm-modal">
        <h3>Ask a question</h3>
        <form onSubmit={handleSubmit} className="qm-form">
          <label>
            Your name
            <input value={name} onChange={e => setName(e.target.value)} required aria-required="true" />
          </label>
          <label>
            Email
            <input value={email} onChange={e => setEmail(e.target.value)} required aria-required="true" />
          </label>
          <label>
            Question
            <textarea value={question} onChange={e => setQuestion(e.target.value)} rows={5} />
          </label>

          <div className="qm-actions">
            <button type="button" className="qm-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="qm-submit" disabled={loading}>{loading ? 'Sending...' : 'Send'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
