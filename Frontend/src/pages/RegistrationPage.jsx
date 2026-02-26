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
    DateofBirth: '00/00/0000',
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
    const response = await fetch('http://localhost:5000/api/register', {
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
    <div className="auth-card">
      <h1>Registration</h1>
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={handleRegister} className="auth-form">
        <div className="form-grid">
          <div className="left-col">
            <h3 className="section-title">PERSONAL INFORMATION</h3>
            <div className="personal-grid">
              <div className="form-group">
                <label htmlFor="fullName">Full Name</label>
                <input
                  id="fullName"
                  type="text"
                  name="FullName"
                  placeholder="Enter your full name"
                  value={formData.FullName}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="nickname">Nickname</label>
                <input
                  id="nickname"
                  type="text"
                  name="Nickname"
                  placeholder="Enter your nickname"
                  value={formData.Nickname}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="emailAddress">Email Address</label>
                <input
                  id="emailAddress"
                  type="email"
                  name="EmailAddress"
                  placeholder="Enter your email address"
                  value={formData.EmailAddress}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmEmailAddress">Confirm Email Address</label>
                <input
                  id="confirmEmailAddress"
                  type="email"
                  name="ConfirmEmailAddress"
                  placeholder="Confirm your email address"
                  value={formData.ConfirmEmailAddress}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="Password">Password</label>
                <input
                  id="Password"
                  type="password"
                  name="Password"
                  placeholder="Enter your password"
                  value={formData.Password}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  id="confirmPassword"
                  type="password"
                  name="ConfirmPassword"
                  placeholder="Confirm your password"
                  value={formData.ConfirmPassword}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="dateOfBirth">Date of Birth</label>
                <input
                  id="dateOfBirth"
                  type="date"
                  name="DateofBirth"
                  value={formData.DateofBirth}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="gender">Gender</label>
                <select
                  id="gender"
                  name="Gender"
                  value={formData.Gender}
                  onChange={handleChange}
                  disabled={loading}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="age">Age</label>
                <input
                  id="age"
                  type="number"
                  name="Age"
                  placeholder="Enter your age"
                  value={formData.Age}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="religion">Religion</label>
                <input
                  id="religion"
                  type="text"
                  name="Religion"
                  placeholder="Enter your religion"
                  value={formData.Religion}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="barangay">Barangay</label>
                <input
                  id="barangay"
                  type="text"
                  name="Barangay"
                  placeholder="Enter your barangay"
                  value={formData.Barangay}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="mobilePhone">Mobile Phone Number</label>
                <input
                  id="mobilePhone"
                  type="text"
                  name="MobilePhone"
                  placeholder="Enter your mobile phone number"
                  value={formData.MobilePhone}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="cityMunicipality">City/Municipality</label>
                <input
                  id="cityMunicipality"
                  type="text"
                  name="City/Municipality"
                  placeholder="Enter your city/municipality"
                  value={formData['City/Municipality']}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="homeAddress">Home Address</label>
                <input
                  id="homeAddress"
                  type="text"
                  name="HomeAddress"
                  placeholder="Enter your home address"
                  value={formData.HomeAddress}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="civilStatus">Civil Status</label>
                <select
                  id="civilStatus"
                  name="CivilStatus"
                  value={formData.CivilStatus}
                  onChange={handleChange}
                  disabled={loading}
                >
                  <option value="">Select Civil Status</option>
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Widowed">Widowed</option>
                  <option value="Separated">Separated</option>
                </select>
              </div>
            </div>
          </div>

          <div className="photo-upload">
            <div className="photo-preview">
              {photoPreview ? (
                <img src={photoPreview} alt="preview" />
              ) : (
                <div className="photo-placeholder">Attach a file</div>
              )}
            </div>
            <input
              id="photo"
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="photo-input"
              disabled={loading}
            />
            <label htmlFor="photo" className="photo-button">Upload</label>
            <div className="photo-caption">2 x 2 Attach a file .jpg .jpeg</div>
          </div>
        </div>
    
        <div className="education-section">
          <h3 className="section-title">EDUCATIONAL ATTAINMENT</h3>
          <div className="education-grid">
            <div className="form-group">
              <label htmlFor="educLevel">Post Graduate Degree/Course</label>
              <input
                id="educLevel"
                name="Post Graduate Degree/course"
                value={formData['Post Graduate Degree/course']}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="YearTaken">Year Taken</label>
              <input
                id="YearTaken"
                type="text"
                name="PostGraduateYear"
                placeholder="e.g., 2018"
                value={formData.PostGraduateYear}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="College Degree">College Degree</label>
              <input
                id="College Degree"
                type="text"y
                name="CollegeDegree"
                value={formData.CollegeDegree}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="YearTaken2">Year Taken</label>
              <input
                id="yearTaken2"
                type="text"
                name="CollegeYear"
                placeholder="e.g., 2018"
                value={formData.CollegeYear}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="highSchool">High School</label>
              <input
                id="highSchool"
                name="HighSchool"
                value={formData.HighSchool}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="YearTaken3">Year Taken</label>
              <input
                id="yearTaken3"
                type="text"
                name="HighSchoolYear"
                placeholder="e.g., 2018"
                value={formData.HighSchoolYear}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="Elementary">Elementary School</label>
              <input
                id="elementary"
                name="Elementary"
                value={formData.Elementary}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="YearTaken4">Year Taken</label>
              <input
                id="yearTaken4"
                type="text"
                name="ElementaryYear"
                placeholder="e.g., 2018"
                value={formData.ElementaryYear}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="Others">Others</label>
              <input
                id="Others"
                name="Others"
                value={formData.Others}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="yearTaken5">Year Taken</label>
              <input
                id="yearTaken5"
                type="text"
                name="OthersYear"
                placeholder="e.g., 2018"
                value={formData.OthersYear}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
          </div>
        </div>
        
        <div className="form-section">
          <h3 className="section-title">IN CASE OF EMERGENCY, PLEASE NOTIFY</h3>
          <div className="form-group">
            <label htmlFor="emergencyName">Contact Name</label>
            <input
              id="emergencyName"
              type="text"
              name="EmergencyContactName"
              placeholder="Full name"
              value={formData.EmergencyContactName}
              onChange={handleChange}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="emergencyRelation">Relation</label>
            <input
              id="emergencyRelation"
              type="text"
              name="EmergencyContactRelation"
              placeholder="e.g., Parent, Spouse"
              value={formData.EmergencyContactRelation}
              onChange={handleChange}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="emergencyPhone">Contact Phone</label>
            <input
              id="emergencyPhone"
              type="text"
              name="EmergencyContactPhone"
              placeholder="Phone number"
              value={formData.EmergencyContactPhone}
              onChange={handleChange}
              disabled={loading}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 18 }}>
          <button
            type="submit"
            className="auth-button"
            disabled={loading}
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </div>
      </form>

      <div className="auth-footer">
        <p>Already have an account? <Link to="/">Login here</Link></p>
      </div>
    </div>
  </div>
)

}
