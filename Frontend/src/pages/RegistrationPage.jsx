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
    EmergencyContactPhone: '',
    Area: '',
    OtherArea: ''
  })
const [error, setError] = useState('')
const [success, setSuccess] = useState('')
const [loading, setLoading] = useState(false)
const [photoPreview, setPhotoPreview] = useState(null)
const [photoFile, setPhotoFile] = useState(null)
const [idPhotoPreview, setIdPhotoPreview] = useState(null)
const [idPhotoFile, setIdPhotoFile] = useState(null)

const handleChange = (e) => {
  const { name, value } = e.target
  setFormData(prev => {
    const newData = { ...prev, [name]: value };
    
    // Auto-calculate age if birthday changes
    if (name === 'DateofBirth' && value) {
      const birthDate = new Date(value);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      newData.Age = age.toString();
    }
    
    return newData;
  })
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

const handleIdPhotoChange = (e) => {
  const file = e.target.files[0]
  if (file) {
    setIdPhotoFile(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setIdPhotoPreview(reader.result)
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

    if (idPhotoFile) {
      formDataWithPhoto.append('idPhoto', idPhotoFile)
    }

    console.log("📝 Sending registration request...")
    const response = await fetch('/api/register', {
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
    setSuccess(data.message || "Registration submitted! Your account is pending admin verification. You'll receive an email once approved.")
    setFormData({
      FullName: '', Nickname: '', EmailAddress: '', ConfirmEmailAddress: '', Password: '', ConfirmPassword: '',
      DateofBirth: '', Gender: '', Age: '', Religion: '', Barangay: '', MobilePhone: '', 'City/Municipality': '',
      HomeAddress: '', CivilStatus: '', 'Post Graduate Degree/course': '', PostGraduateYear: '', CollegeDegree: '',
      CollegeYear: '', HighSchool: '', HighSchoolYear: '', Elementary: '', ElementaryYear: '', Others: '', OthersYear: '',
      EmergencyContactName: '', EmergencyContactRelation: '', EmergencyContactPhone: ''
    })
    setPhotoPreview(null)
    setPhotoFile(null)
    setIdPhotoPreview(null)
    setIdPhotoFile(null)
    setTimeout(() => navigate('/'), 3000)
  } catch (err) {
    console.error('Registration error:', err)
    setError(err?.message || 'Registration failed. Please check if the server is running.')
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
      {success && (
        <div className="success-message" style={{ backgroundColor: '#10b981', color: 'white', padding: '16px', borderRadius: '12px', textAlign: 'center', marginBottom: '16px', animation: 'fadeIn 0.3s' }}>
          <div style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>✅ Registration Successful!</div>
          <div style={{ fontSize: '14px' }}>{success}</div>
          <div style={{ fontSize: '12px', marginTop: '8px', opacity: 0.9 }}>Redirecting to login in 3 seconds...</div>
        </div>
      )}

      <form onSubmit={handleRegister} className="auth-form">
        <div className="form-section">
          <h3 className="section-title">Personal Information</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Full Name</label>
              <input
                name="FullName"
                placeholder="Alex Cruz"
                value={formData.FullName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Nickname</label>
              <input
                name="Nickname"
                placeholder="Alex"
                value={formData.Nickname}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Email Address</label>
              <input
                name="EmailAddress"
                type="email"
                placeholder="example.user@example.com"
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
                placeholder="example.user@example.com"
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
              <label>Age</label>
              <input
                name="Age"
                type="number"
                placeholder="20"
                value={formData.Age}
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

          <div className="form-row">
            <div className="form-group">
              <label>Religion</label>
              <input
                name="Religion"
                placeholder="Catholic"
                value={formData.Religion}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Civil Status</label>
              <select name="CivilStatus" value={formData.CivilStatus} onChange={handleChange} required>
                <option value="">Select Status</option>
                <option value="Single">Single</option>
                <option value="Married">Married</option>
                <option value="Widowed">Widowed</option>
                <option value="Separated">Separated</option>
              </select>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3 className="section-title">Residential Area</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Select Area</label>
              <select name="Area" value={formData.Area} onChange={handleChange} required>
                <option value="">-- Select Area --</option>
                <option value="South nagtahan">South nagtahan</option>
                <option value="Residences de manila">Residences de manila</option>
                <option value="PSC">PSC</option>
                <option value="Malacañang Park">Malacañang Park</option>
                <option value="Others">Others...</option>
              </select>
            </div>
            {formData.Area === 'Others' && (
              <div className="form-group">
                <label>Specify Area</label>
                <input
                  name="OtherArea"
                  placeholder="Enter your area"
                  value={formData.OtherArea}
                  onChange={handleChange}
                  required
                />
              </div>
            )}
          </div>
        </div>

        <div className="form-section">
          <h3 className="section-title">Address Information</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Barangay</label>
              <input
                name="Barangay"
                placeholder="Barangay 830"
                value={formData.Barangay}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>City / Municipality</label>
              <input
                name="City/Municipality"
                placeholder="Metro Manila"
                value={formData['City/Municipality']}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Home Address</label>
              <input
                name="HomeAddress"
                placeholder="123 Sampaguita St."
                value={formData.HomeAddress}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Mobile Phone</label>
              <input
                name="MobilePhone"
                placeholder="0912xxxxxxx"
                value={formData.MobilePhone}
                onChange={handleChange}
                required
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3 className="section-title">Education</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Elementary School</label>
              <input
                name="Elementary"
                placeholder="Example Elementary School"
                value={formData.Elementary}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Elementary Year</label>
              <input
                name="ElementaryYear"
                placeholder="2010"
                value={formData.ElementaryYear}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>High School</label>
              <input
                name="HighSchool"
                placeholder="Example High School"
                value={formData.HighSchool}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>High School Year</label>
              <input
                name="HighSchoolYear"
                placeholder="2016"
                value={formData.HighSchoolYear}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>College Course</label>
              <input
                name="CollegeDegree"
                placeholder="Bachelor of Science in Information Technology"
                value={formData.CollegeDegree}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>College Year</label>
              <input
                name="CollegeYear"
                placeholder="2023"
                value={formData.CollegeYear}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Postgraduate Course</label>
              <input
                name="Post Graduate Degree/course"
                placeholder="N/A"
                value={formData['Post Graduate Degree/course']}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Postgraduate Year</label>
              <input
                name="PostGraduateYear"
                placeholder="N/A"
                value={formData.PostGraduateYear}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Other Course</label>
              <input
                name="Others"
                placeholder="N/A"
                value={formData.Others}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Other Year</label>
              <input
                name="OthersYear"
                placeholder="N/A"
                value={formData.OthersYear}
                onChange={handleChange}
                required
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3 className="section-title">Emergency Contact</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Contact Name</label>
              <input
                name="EmergencyContactName"
                placeholder="Maria Santos"
                value={formData.EmergencyContactName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Relationship</label>
              <input
                name="EmergencyContactRelation"
                placeholder="Mother"
                value={formData.EmergencyContactRelation}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Phone Number</label>
              <input
                name="EmergencyContactPhone"
                placeholder="0917xxxxxxx"
                value={formData.EmergencyContactPhone}
                onChange={handleChange}
                required
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3 className="section-title">Upload Pictures</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Profile Photo</label>
              <input type="file" accept="image/*" onChange={handlePhotoChange} required />
              {photoPreview && (
                <div className="photo-preview-container">
                  <img src={photoPreview} alt="Profile preview" className="photo-preview" />
                </div>
              )}
            </div>
            <div className="form-group">
              <label>ID Picture</label>
              <input type="file" accept="image/*" onChange={handleIdPhotoChange} required />
              {idPhotoPreview && (
                <div className="photo-preview-container">
                  <img src={idPhotoPreview} alt="ID preview" className="photo-preview" />
                </div>
              )}
            </div>
          </div>
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
