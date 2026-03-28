import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import '../styles/Auth.css'

export default function RegistrationPage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    FullName: '',
    Nickname: '',
    EmailAddress: '',
    ConfirmEmailAddress: '',
    Password: '',
    ConfirmPassword: '',
    DateofBirth: '',
    Gender: '',
    Age: '',
    Religion:'',
    Barangay:'',
    MobilePhone:'',
    'City/Municipality':'',
    HomeAddress:'',
    CivilStatus:'',
    'Post Graduate Degree/course': '',
    PostGraduateYear: '',
    CollegeDegree: '',
    CollegeYear: '',
    HighSchool:'',
    HighSchoolYear: '',
    Elementary:'',
    ElementaryYear: '',
    Others:'',
    OthersYear: '',
    EmergencyContactName: '',
    EmergencyContactRelation: '',
    EmergencyContactPhone: ''
  })
const [error, setError] = useState('')
const [loading, setLoading] = useState(false)
const [photoPreview, setPhotoPreview] = useState(null)
const [photoFile, setPhotoFile] = useState(null)

const handleChange = (e) => {
  const { name, value } = e.target
  setFormData(prev => ({
    ...prev,
    [name]: value
  }))
}

const handlePhotoChange = (e) => {
  const file = e.target.files[0]
  if (file) {
    setPhotoFile(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setPhotoPreview(reader.result)
    }
    reader.readAsDataURL(file)
  }
}

const handleRegister = async (e) => {
  e.preventDefault()
  setError('')
  setLoading(true)

  try {
    if (!formData.FullName || !formData.EmailAddress || !formData.Password) {
      setError('Please fill in Full Name, Email, and Password')
      setLoading(false)
      return
    }

    if (!formData.EmailAddress.includes('@')) {
      setError('Please enter a valid email')
      setLoading(false)
      return
    }

    if (formData.Password !== formData.ConfirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (formData.Password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    if (formData.EmailAddress !== formData.ConfirmEmailAddress) {
      setError('Email addresses do not match')
      setLoading(false)
      return
    }

    const formDataWithPhoto = new FormData()
    
    Object.keys(formData).forEach(key => {
      formDataWithPhoto.append(key, formData[key])
    })
    
    if (photoFile) {
      formDataWithPhoto.append('photo', photoFile)
    }

    console.log("📝 Sending registration request...")
    const response = await fetch('http://127.0.0.1:5000/api/register', {
      method: 'POST',
      body: formDataWithPhoto
    })

    const data = await response.json()
    console.log("Server response:", data)

    if (!response.ok) {
      console.error("❌ Registration failed:", data.message)
      setError(data.message || 'Registration failed')
      setLoading(false)
      return
    }

    console.log("✓ Registration successful!")
    alert('Registration successful! Please login.')
    navigate('/')
  } catch (err) {
    setError('Registration failed. Please check if the server is running.')
  } finally {
    setLoading(false)
  }
}

return (
  <div className="auth-container">
    <div className="auth-card register">
      <div className="auth-logo-container">
        <img src="/logo_brgy.png" alt="Logo" className="auth-logo" />
        <h1 className="auth-title">Create Account</h1>
        <p className="auth-subtitle">Join the Barangay 830 community</p>
      </div>

      {error && <div className="error-message">⚠️ {error}</div>}

      <form onSubmit={handleRegister} className="auth-form">
        <div className="form-section">
          <h3 className="section-title">Personal Information</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Full Name</label>
              <input
                name="FullName"
                placeholder="Juan Dela Cruz"
                value={formData.FullName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Nickname</label>
              <input
                name="Nickname"
                placeholder="Juan"
                value={formData.Nickname}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Email Address</label>
              <input
                name="EmailAddress"
                type="email"
                placeholder="juan@example.com"
                value={formData.EmailAddress}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Confirm Email</label>
              <input
                name="ConfirmEmailAddress"
                type="email"
                placeholder="juan@example.com"
                value={formData.ConfirmEmailAddress}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Password</label>
              <input
                name="Password"
                type="password"
                placeholder="••••••••"
                value={formData.Password}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Confirm Password</label>
              <input
                name="ConfirmPassword"
                type="password"
                placeholder="••••••••"
                value={formData.ConfirmPassword}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Date of Birth</label>
              <input
                name="DateofBirth"
                type="date"
                value={formData.DateofBirth}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Gender</label>
              <select name="Gender" value={formData.Gender} onChange={handleChange} required>
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
        </div>

          <div className="form-group">
            <label>Profile Photo</label>
            <input type="file" accept="image/*" onChange={handlePhotoChange} />
            {photoPreview && (
              <div className="photo-preview-container">
                <img src={photoPreview} alt="Preview" className="photo-preview" />
              </div>
            )}
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Creating Account...' : 'Register Account'}
          </button>
        </form>

        <div className="auth-footer">
          <p>Already have an account? <Link to="/login" className="auth-link">Sign in instead</Link></p>
        </div>
      </div>
    </div>
  )
}
