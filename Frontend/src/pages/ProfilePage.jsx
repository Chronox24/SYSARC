import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/Profile.css'

export default function ProfilePage() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState(null)
  const [saving, setSaving] = useState(false)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [photoFile, setPhotoFile] = useState(null)
  const [idPhotoPreview, setIdPhotoPreview] = useState(null)
  const [idPhotoFile, setIdPhotoFile] = useState(null)
  const [originalPhotoPreview, setOriginalPhotoPreview] = useState(null)
  const [originalIdPhotoPreview, setOriginalIdPhotoPreview] = useState(null)

  useEffect(() => {
    const currentUser = localStorage.getItem('currentUser')
    if (!currentUser) {
      navigate('/login')
    } else {
      const userData = JSON.parse(currentUser)
      setUser(userData)
      fetchUserDetails(userData.id)
    }
  }, [navigate])

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

  const formatDate = (dateString) => {
    if (!dateString || dateString === 'N/A') return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString || dateString === 'N/A') return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch (e) {
      return dateString;
    }
  };

  const fetchUserDetails = async (userId) => {
    try {
      const response = await fetch(`/api/user/${userId}`)
      const data = await response.json()
      if (response.ok) {
        setUser(prev => ({ ...prev, ...data }))
        setEditData(data)
        if (data.photo) {
          setPhotoPreview(data.photo)
        }
        if (data.id_photo || data.idPhoto) {
          setIdPhotoPreview(data.id_photo || data.idPhoto)
        }
      }
      
      const requestsResponse = await fetch(`/api/dashboard/${userId}`)
      const requestsData = await requestsResponse.json()
      setRequests(Array.isArray(requestsData) ? requestsData : [])
      setLoading(false)
    } catch (err) {
      console.error('Failed to fetch user details:', err)
      setLoading(false)
    }
  }

  const handleEditChange = (field, value) => {
    setEditData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleStartEditing = () => {
    setOriginalPhotoPreview(photoPreview)
    setOriginalIdPhotoPreview(idPhotoPreview)
    setPhotoFile(null)
    setIdPhotoFile(null)
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setEditData(user)
    setIsEditing(false)
    setPhotoFile(null)
    setIdPhotoFile(null)
    setPhotoPreview(originalPhotoPreview || user?.photo || null)
    setIdPhotoPreview(originalIdPhotoPreview || user?.id_photo || user?.idPhoto || null)
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      const formData = new FormData()
      
      // List of fields the backend expects
      const expectedFields = [
        'full_name', 'nickname', 'gender', 'age', 'date_of_birth',
        'religion', 'civil_status', 'barangay', 'city_municipality',
        'home_address', 'mobile_phone', 'post_grad_course', 'post_grad_year',
        'college_course', 'college_year', 'high_school', 'high_school_year',
        'elementary', 'elementary_year', 'other_education', 'other_year',
        'emergency_name', 'emergency_phone', 'relationship', 'area', 'other_area'
      ];
      
      expectedFields.forEach(field => {
        const value = editData[field];
        if (value !== undefined && value !== null) {
          formData.append(field, value);
        }
      });
      
      if (photoFile) {
        formData.append('photo', photoFile)
      }

      if (idPhotoFile) {
        formData.append('id_photo', idPhotoFile)
      }

      const response = await fetch(`/api/user/${user.id}`, {
        method: 'PUT',
        body: formData
      })

      if (response.ok) {
        // Fetch updated data after saving (this will still show old data until approved)
        await fetchUserDetails(user.id)
        setIsEditing(false)
        setPhotoFile(null)
        alert('Your profile update request has been submitted for admin approval!')
      } else {
        const errorData = await response.json()
        alert(`Failed to update profile: ${errorData.message || 'Unknown error'}`)
      }
    } catch (err) {
      console.error('Failed to update profile:', err)
      alert('Error updating profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  if (!user) {
    return <div>No user data</div>
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-header-left">
          <h1>My Profile</h1>
        </div>
        <div className="profile-header-right btn-group">
          {!isEditing ? (
            <button onClick={handleStartEditing} className="btn-edit">Edit Profile</button>
          ) : (
            <>
              <button onClick={handleSaveProfile} className="btn-save" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button onClick={handleCancelEdit} className="btn-cancel">Cancel</button>
            </>
          )}
          <button onClick={() => navigate('/dashboard')} className="back-btn">Back to Dashboard</button>
        </div>
      </div>

      <div className="profile-content">
        <div className="profile-card photo-card">
          <div className="profile-photo-container">
            <div className="profile-photo-preview">
              {photoPreview ? (
                <img src={photoPreview} alt="Profile" />
              ) : (
                <div className="photo-placeholder">No Photo</div>
              )}
              <div className="info-item">
              <label>Area</label>
              {isEditing ? (
                <select
                  value={editData?.area || ''}
                  onChange={(e) => handleEditChange('area', e.target.value)}
                >
                  <option value="">-- Select Area --</option>
                  <option value="South nagtahan">South nagtahan</option>
                  <option value="Residences de manila">Residences de manila</option>
                  <option value="PSC">PSC</option>
                  <option value="Malacañang Park">Malacañang Park</option>
                  <option value="Others">Others...</option>
                </select>
              ) : (
                <p>{user?.area === 'Others' ? user?.other_area : user?.area || 'N/A'}</p>
              )}
            </div>
            {editData?.area === 'Others' && isEditing && (
              <div className="info-item">
                <label>Specify Other Area</label>
                <input
                  type="text"
                  value={editData?.other_area || ''}
                  onChange={(e) => handleEditChange('other_area', e.target.value)}
                />
              </div>
            )}
          </div>
            {isEditing && (
              <div className="photo-upload-controls">
                <input
                  type="file"
                  id="photo-input"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  style={{ display: 'none' }}
                />
                <label htmlFor="photo-input" className="photo-upload-btn">
                  {photoFile ? 'Change Profile Photo' : 'Upload Profile Photo'}
                </label>
                {photoFile && <p className="file-name">{photoFile.name}</p>}
              </div>
            )}
          </div>
          <div className="profile-basic-info">
            <h2>{user?.full_name}</h2>
            <p className="profile-email">{user?.email}</p>
            <p className="account-created">Joined on {formatDateTime(user?.created_at)}</p>
            {user?.is_verified === 'Approved' ? (
              <span className="profile-verified-badge">✅ Verified</span>
            ) : (
              <span className="profile-pending-badge">⏳ Pending Verification</span>
            )}
          </div>
        </div>

        <div className="profile-card id-photo-card">
          <h2>ID Picture</h2>
          <div className="id-photo-preview">
            {idPhotoPreview ? (
              <img src={idPhotoPreview} alt="ID" />
            ) : (
              <div className="photo-placeholder">No ID Photo</div>
            )}
          </div>
          {isEditing && (
            <div className="photo-upload-controls">
              <input
                type="file"
                id="id-photo-input"
                accept="image/*"
                onChange={handleIdPhotoChange}
                style={{ display: 'none' }}
              />
              <label htmlFor="id-photo-input" className="photo-upload-btn">
                {idPhotoFile ? 'Change ID Photo' : (idPhotoPreview ? 'Update ID Photo' : 'Upload ID Photo')}
              </label>
              {idPhotoPreview && !idPhotoFile && <p className="file-name">ID photo on file</p>}
              {idPhotoFile && <p className="file-name">{idPhotoFile.name}</p>}
            </div>
          )}
        </div>

        <div className="profile-card">
          <h2>Personal Information</h2>
          <div className="info-grid">
            <div className="info-item">
              <label>Full Name</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editData?.full_name || ''}
                  onChange={(e) => handleEditChange('full_name', e.target.value)}
                />
              ) : (
                <p>{user?.full_name || 'N/A'}</p>
              )}
            </div>
            <div className="info-item">
              <label>Nickname</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editData?.nickname || ''}
                  onChange={(e) => handleEditChange('nickname', e.target.value)}
                />
              ) : (
                <p>{user?.nickname || 'N/A'}</p>
              )}
            </div>
            <div className="info-item">
              <label>Email</label>
              {isEditing ? (
                <input
                  type="email"
                  value={editData?.email || ''}
                  onChange={(e) => handleEditChange('email', e.target.value)}
                  disabled
                />
              ) : (
                <p>{user?.email || 'N/A'}</p>
              )}
            </div>
            <div className="info-item">
              <label>Gender</label>
              {isEditing ? (
                <select
                  value={editData?.gender || ''}
                  onChange={(e) => handleEditChange('gender', e.target.value)}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              ) : (
                <p>{user?.gender || 'N/A'}</p>
              )}
            </div>
            <div className="info-item">
              <label>Age</label>
              {isEditing ? (
                <input
                  type="number"
                  value={editData?.age || ''}
                  onChange={(e) => handleEditChange('age', e.target.value)}
                />
              ) : (
                <p>{user?.age || 'N/A'}</p>
              )}
            </div>
            <div className="info-item">
              <label>Date of Birth</label>
              {isEditing ? (
                <input
                  type="date"
                  value={editData?.date_of_birth ? new Date(editData.date_of_birth).toISOString().split('T')[0] : ''}
                  onChange={(e) => handleEditChange('date_of_birth', e.target.value)}
                />
              ) : (
                <p>{formatDate(user?.date_of_birth)}</p>
              )}
            </div>
            <div className="info-item">
              <label>Religion</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editData?.religion || ''}
                  onChange={(e) => handleEditChange('religion', e.target.value)}
                />
              ) : (
                <p>{user?.religion || 'N/A'}</p>
              )}
            </div>
            <div className="info-item">
              <label>Civil Status</label>
              {isEditing ? (
                <select
                  value={editData?.civil_status || ''}
                  onChange={(e) => handleEditChange('civil_status', e.target.value)}
                >
                  <option value="">Select Status</option>
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Widowed">Widowed</option>
                  <option value="Separated">Separated</option>
                </select>
              ) : (
                <p>{user?.civil_status || 'N/A'}</p>
              )}
            </div>
          </div>
        </div>

        <div className="profile-card">
          <h2>Address Information</h2>
          <div className="info-grid">
            <div className="info-item">
              <label>Barangay</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editData?.barangay || ''}
                  onChange={(e) => handleEditChange('barangay', e.target.value)}
                />
              ) : (
                <p>{user?.barangay || 'N/A'}</p>
              )}
            </div>
            <div className="info-item">
              <label>City/Municipality</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editData?.city_municipality || ''}
                  onChange={(e) => handleEditChange('city_municipality', e.target.value)}
                />
              ) : (
                <p>{user?.city_municipality || 'N/A'}</p>
              )}
            </div>
            <div className="info-item full-width">
              <label>Home Address</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editData?.home_address || ''}
                  onChange={(e) => handleEditChange('home_address', e.target.value)}
                />
              ) : (
                <p>{user?.home_address || 'N/A'}</p>
              )}
            </div>
            <div className="info-item">
              <label>Mobile Phone</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editData?.mobile_phone || ''}
                  onChange={(e) => handleEditChange('mobile_phone', e.target.value)}
                />
              ) : (
                <p>{user?.mobile_phone || 'N/A'}</p>
              )}
            </div>
            <div className="info-item">
              <label>Area</label>
              {isEditing ? (
                <select
                  value={editData?.area || ''}
                  onChange={(e) => handleEditChange('area', e.target.value)}
                >
                  <option value="">-- Select Area --</option>
                  <option value="South nagtahan">South nagtahan</option>
                  <option value="Residences de manila">Residences de manila</option>
                  <option value="PSC">PSC</option>
                  <option value="Malacañang Park">Malacañang Park</option>
                  <option value="Others">Others...</option>
                </select>
              ) : (
                <p>{user?.area === 'Others' ? user?.other_area : user?.area || 'N/A'}</p>
              )}
            </div>
            {editData?.area === 'Others' && isEditing && (
              <div className="info-item">
                <label>Specify Other Area</label>
                <input
                  type="text"
                  value={editData?.other_area || ''}
                  onChange={(e) => handleEditChange('other_area', e.target.value)}
                />
              </div>
            )}
          </div>
        </div>

        <div className="profile-card">
          <h2>Education</h2>
          <div className="info-grid">
            <div className="info-item">
              <label>Elementary School</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editData?.elementary || ''}
                  onChange={(e) => handleEditChange('elementary', e.target.value)}
                />
              ) : (
                <p>{user?.elementary || 'N/A'}</p>
              )}
            </div>
            <div className="info-item">
              <label>Elementary Year</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editData?.elementary_year || ''}
                  onChange={(e) => handleEditChange('elementary_year', e.target.value)}
                />
              ) : (
                <p>{user?.elementary_year || 'N/A'}</p>
              )}
            </div>
            <div className="info-item">
              <label>High School</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editData?.high_school || ''}
                  onChange={(e) => handleEditChange('high_school', e.target.value)}
                />
              ) : (
                <p>{user?.high_school || 'N/A'}</p>
              )}
            </div>
            <div className="info-item">
              <label>High School Year</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editData?.high_school_year || ''}
                  onChange={(e) => handleEditChange('high_school_year', e.target.value)}
                />
              ) : (
                <p>{user?.high_school_year || 'N/A'}</p>
              )}
            </div>
            <div className="info-item">
              <label>College Course</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editData?.college_course || ''}
                  onChange={(e) => handleEditChange('college_course', e.target.value)}
                />
              ) : (
                <p>{user?.college_course || 'N/A'}</p>
              )}
            </div>
            <div className="info-item">
              <label>College Year</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editData?.college_year || ''}
                  onChange={(e) => handleEditChange('college_year', e.target.value)}
                />
              ) : (
                <p>{user?.college_year || 'N/A'}</p>
              )}
            </div>
            <div className="info-item">
              <label>Post Graduate Course</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editData?.post_grad_course || ''}
                  onChange={(e) => handleEditChange('post_grad_course', e.target.value)}
                />
              ) : (
                <p>{user?.post_grad_course || 'N/A'}</p>
              )}
            </div>
            <div className="info-item">
              <label>Post Grad Year</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editData?.post_grad_year || ''}
                  onChange={(e) => handleEditChange('post_grad_year', e.target.value)}
                />
              ) : (
                <p>{user?.post_grad_year || 'N/A'}</p>
              )}
            </div>
          </div>
        </div>

        <div className="profile-card">
          <h2>Emergency Contact</h2>
          <div className="info-grid">
            <div className="info-item">
              <label>Contact Name</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editData?.emergency_name || ''}
                  onChange={(e) => handleEditChange('emergency_name', e.target.value)}
                />
              ) : (
                <p>{user?.emergency_name || 'N/A'}</p>
              )}
            </div>
            <div className="info-item">
              <label>Relationship</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editData?.relationship || ''}
                  onChange={(e) => handleEditChange('relationship', e.target.value)}
                />
              ) : (
                <p>{user?.relationship || 'N/A'}</p>
              )}
            </div>
            <div className="info-item">
              <label>Phone Number</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editData?.emergency_phone || ''}
                  onChange={(e) => handleEditChange('emergency_phone', e.target.value)}
                />
              ) : (
                <p>{user?.emergency_phone || 'N/A'}</p>
              )}
            </div>
          </div>
        </div>

        <div className="profile-card">
          <h2>My Requests</h2>
          {requests.length === 0 ? (
            <p>No certificate requests yet.</p>
          ) : (
            <table className="requests-table">
              <thead>
                <tr>
                  <th>Requested On</th>
                  <th>Certificate Type</th>
                  <th>Status</th>
                  <th>Verification</th>
                </tr>
              </thead>
              <tbody>
                {requests.map(req => (
                  <tr key={req.id}>
                    <td>{req.request_date ? new Date(req.request_date).toLocaleString() : req.created_at ? new Date(req.created_at).toLocaleString() : '-'}</td>
                    <td>{req.certificate_type}</td>
                    <td>{req.process_status}</td>
                    <td>{req.verification_status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
