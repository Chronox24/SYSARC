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

  const styles = {
    container: {
      minHeight: "calc(100vh - 80px)",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      padding: "20px"
    },
    card: {
      background: "white",
      borderRadius: "12px",
      boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
      padding: "40px",
      maxWidth: "500px",
      width: "100%"
    },
    header: {
      marginBottom: "30px"
    },
    title: {
      fontSize: "28px",
      fontWeight: "700",
      color: "#333",
      margin: "0 0 10px 0",
      display: "flex",
      alignItems: "center",
      gap: "10px"
    },
    subtitle: {
      color: "#666",
      fontSize: "14px",
      margin: "0"
    },
    form: {
      display: "flex",
      flexDirection: "column",
      gap: "20px"
    },
    formGroup: {
      display: "flex",
      flexDirection: "column",
      gap: "8px"
    },
    label: {
      fontSize: "14px",
      fontWeight: "600",
      color: "#333",
      textTransform: "uppercase",
      letterSpacing: "0.5px"
    },
    select: {
      padding: "12px 14px",
      border: "2px solid #e0e0e0",
      borderRadius: "8px",
      fontSize: "14px",
      fontFamily: "inherit",
      transition: "border-color 0.3s ease",
      cursor: "pointer"
    },
    textarea: {
      padding: "12px 14px",
      border: "2px solid #e0e0e0",
      borderRadius: "8px",
      fontSize: "14px",
      fontFamily: "inherit",
      resize: "vertical",
      minHeight: "100px",
      transition: "border-color 0.3s ease"
    },
    button: {
      padding: "12px 24px",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      color: "white",
      border: "none",
      borderRadius: "8px",
      fontSize: "15px",
      fontWeight: "600",
      cursor: "pointer",
      transition: "transform 0.2s ease, box-shadow 0.2s ease",
      marginTop: "10px",
      boxShadow: "0 4px 12px rgba(102, 126, 234, 0.3)"
    },
    backLink: {
      textAlign: "center",
      marginTop: "20px",
      paddingTop: "20px",
      borderTop: "1px solid #e0e0e0"
    },
    link: {
      color: "#667eea",
      textDecoration: "none",
      fontSize: "14px",
      fontWeight: "500",
      transition: "color 0.2s ease"
    },
    loginContainer: {
      textAlign: "center"
    },
    loginText: {
      color: "#666",
      marginBottom: "30px",
      fontSize: "15px"
    },
    actions: {
      display: "flex",
      gap: "12px",
      flexDirection: "column"
    },
    button2: {
      padding: "12px 24px",
      border: "none",
      borderRadius: "8px",
      fontSize: "15px",
      fontWeight: "600",
      cursor: "pointer",
      transition: "all 0.2s ease",
      textDecoration: "none",
      textAlign: "center"
    }
  }

  if (!currentUser) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.header}>
            <h1 style={styles.title}>📋 Request a Form</h1>
          </div>
          <div style={styles.loginContainer}>
            <p style={styles.loginText}>You must be registered and logged in to request certificates or forms.</p>
            <div style={styles.actions}>
              <Link 
                to="/register" 
                style={{
                  ...styles.button2,
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "white"
                }}
              >
                Register Now
              </Link>
              <Link 
                to="/" 
                style={{
                  ...styles.button2,
                  background: "#f5f5f5",
                  color: "#333",
                  border: "2px solid #e0e0e0"
                }}
              >
                Log In Now
              </Link>
            </div>
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

      const response = await fetch("http://localhost:5000/api/request-certificate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          user_id: user.id,
          certificate_type: certificateType
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.message || "Failed to submit request")
        setLoading(false)
        return
      }

      setSuccess("Request submitted successfully!")
      setCertificateType("")
      setPurpose("")
      
      setTimeout(() => {
        navigate("/dashboard")
      }, 1500)
    } catch (err) {
      setError("Failed to submit request. Please check if the server is running.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.title}>📋 Request a Form</h1>
          <p style={styles.subtitle}>Available for {user.full_name}</p>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <form style={styles.form} onSubmit={handleSubmit}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Certificate Type</label>
            <select
              style={styles.select}
              value={certificateType}
              onChange={(e) => setCertificateType(e.target.value)}
              onFocus={(e) => e.target.style.borderColor = "#667eea"}
              onBlur={(e) => e.target.style.borderColor = "#e0e0e0"}
              disabled={loading}
              required
            >
              <option value="">Select a certificate type</option>
              <option value="Barangay Clearance">🆔 Barangay Clearance</option>
              <option value="Certificate of Residency">🏠 Certificate of Residency</option>
              <option value="Indigency Certificate">📄 Indigency Certificate</option>
            </select>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Purpose (Optional)</label>
            <textarea
              style={styles.textarea}
              placeholder="Enter the purpose for your request..."
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              onFocus={(e) => e.target.style.borderColor = "#667eea"}
              onBlur={(e) => e.target.style.borderColor = "#e0e0e0"}
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            style={styles.button}
            disabled={loading}
            onMouseEnter={(e) => {
              e.target.style.transform = "translateY(-2px)"
              e.target.style.boxShadow = "0 6px 16px rgba(102, 126, 234, 0.4)"
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "translateY(0)"
              e.target.style.boxShadow = "0 4px 12px rgba(102, 126, 234, 0.3)"
            }}
          >
            {loading ? "Submitting..." : "Submit Request"}
          </button>
        </form>

        <div style={styles.backLink}>
          <Link to="/dashboard" style={styles.link}>← Back to Dashboard</Link>
        </div>
      </div>
    </div>
  )
}
