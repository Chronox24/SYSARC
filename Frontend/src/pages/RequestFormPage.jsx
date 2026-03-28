import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import "../styles/RequestForm.css"

export default function RequestFormPage() {
  const navigate = useNavigate()
  const currentUser = localStorage.getItem("currentUser")
  const [certificateType, setCertificateType] = useState("")
  const [purpose, setPurpose] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  if (!currentUser) {
    return (
      <div className="request-page-wrapper">
        <div className="request-card">
          <div className="request-header">
            <h1>📋 Request a Form</h1>
            <p>You must be registered and logged in to request certificates or forms.</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <Link to="/register" className="btn-submit" style={{ textDecoration: 'none', textAlign: 'center' }}>
              Register Now
            </Link>
            <Link to="/login" className="back-link" style={{ textAlign: 'center' }}>
              Already have an account? Log In
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const user = JSON.parse(currentUser)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setLoading(true)

    try {
      if (!certificateType) {
        setError("Please select a certificate type")
        setLoading(false)
        return
      }

      const response = await fetch("http://127.0.0.1:5000/api/request-certificate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          user_id: user.id,
          certificate_type: certificateType,
          purpose: purpose || `Certificate for ${user.full_name}`
        })
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess("Your request has been submitted successfully!")
        setCertificateType("")
        setPurpose("")
        setTimeout(() => {
          navigate("/dashboard")
        }, 2000)
      } else {
        setError(data.message || "Something went wrong")
      }
    } catch (err) {
      setError("Failed to connect to the server. Please check if the backend is running.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="request-page-wrapper">
      <div className="request-card">
        <div className="request-header">
          <h1>📋 Request a Form</h1>
          <p>Fill out the details below to request a barangay certificate.</p>
        </div>

        {error && <div className="error-message">⚠️ {error}</div>}
        {success && <div className="success-message">✅ {success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Certificate Type</label>
            <select 
              className="form-select"
              value={certificateType}
              onChange={(e) => setCertificateType(e.target.value)}
              required
            >
              <option value="">-- Select Certificate --</option>
              <option value="Barangay Clearance">Barangay Clearance</option>
              <option value="Certificate of Residency">Certificate of Residency</option>
              <option value="Certificate of Indigency">Certificate of Indigency</option>
              <option value="Barangay ID">Barangay ID</option>
              <option value="First Time Job Seeker">First Time Job Seeker</option>
            </select>
          </div>

          <div className="form-group">
            <label>Purpose of Request</label>
            <textarea 
              className="form-textarea"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="e.g., Job application, Scholarship, Proof of residence..."
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn-submit"
            disabled={loading}
          >
            {loading ? "Submitting..." : "Submit Request"}
          </button>
        </form>

        <div className="back-to-dashboard">
          <Link to="/dashboard" className="back-link">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
