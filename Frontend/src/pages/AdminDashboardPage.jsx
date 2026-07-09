import React, { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts'
import QRCode from 'qrcode'
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
  const [sortOrder, setSortOrder] = useState('newest')
  const [requestSearchTerm, setRequestSearchTerm] = useState('')
  const [requestStatusFilter, setRequestStatusFilter] = useState('All')
  const [selectedResident, setSelectedResident] = useState(null)
  const [pendingRegistrations, setPendingRegistrations] = useState([])
  const [pendingUpdates, setPendingUpdates] = useState([])
  const [archivedAccounts, setArchivedAccounts] = useState([])
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const [editorContent, setEditorContent] = useState('')
  const [editorVerification, setEditorVerification] = useState('Not Verified')
  const [editorProcess, setEditorProcess] = useState('In process')
  const [editorPdfFile, setEditorPdfFile] = useState(null)
  const [removePdf, setRemovePdf] = useState(false)
  const [existingPdf, setExistingPdf] = useState(null)
  const [editorMode, setEditorMode] = useState('text')
  const [visibleToResident, setVisibleToResident] = useState('text')
  const [qrDataUrl, setQrDataUrl] = useState(null)
  const [viewMockupRequest, setViewMockupRequest] = useState(null)

  const [messages, setMessages] = useState([])
  const [conversations, setConversations] = useState([])
  const [selectedChatResident, setSelectedChatResident] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [theme, setTheme] = useState('light')

  const [notifications, setNotifications] = useState([])
  const [showNotifications, setShowNotifications] = useState(false)
  const prevCountsRef = React.useRef({ pendingReg: 0, pendingUpd: 0, requests: 0, messages: 0 })

  const [archiveSubTab, setArchiveSubTab] = useState('residents')
  const [archiveFolders, setArchiveFolders] = useState([])
  const [archiveFiles, setArchiveFiles] = useState([])
  const [currentFolder, setCurrentFolder] = useState(null)
  const [newFolderName, setNewFolderName] = useState('')
  const [showCreateFolder, setShowCreateFolder] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)

  const [residentArchiveFolders, setResidentArchiveFolders] = useState([])
  const [currentResidentFolder, setCurrentResidentFolder] = useState(null)
  const [newResidentFolderName, setNewResidentFolderName] = useState('')
  const [showCreateResidentFolder, setShowCreateResidentFolder] = useState(false)
  const [editingFolderId, setEditingFolderId] = useState(null)
  const [editingFolderName, setEditingFolderName] = useState('')
  const messagesEndRef = React.useRef(null)

  const analyticsData = useMemo(() => {
    // 1. Registrations over time
    const registrationsByMonth = (Array.isArray(accounts) ? accounts : []).reduce((acc, account) => {
      const date = new Date(account.created_at);
      if (isNaN(date.getTime())) return acc;
      const monthYear = date.toLocaleString('en-US', { month: 'short', year: 'numeric' });
      acc[monthYear] = (acc[monthYear] || 0) + 1;
      return acc;
    }, {});
    const registrationData = Object.keys(registrationsByMonth).map(key => ({
      name: key,
      Registrations: registrationsByMonth[key]
    })).sort((a, b) => new Date(a.name) - new Date(b.name)).slice(-6); // Last 6 months

    // 2. Certificate Requests Breakdown
    const requestsByType = (Array.isArray(certificateRequests) ? certificateRequests : []).reduce((acc, req) => {
      acc[req.certificate_type] = (acc[req.certificate_type] || 0) + 1;
      return acc;
    }, {});
    const requestTypeData = Object.keys(requestsByType).map(key => ({
      name: key,
      value: requestsByType[key]
    }));

    // 3. Age Demographics
    const ageGroups = { '18-25': 0, '26-35': 0, '36-50': 0, '51-65': 0, '65+': 0, 'Unknown': 0 };
    (Array.isArray(accounts) ? accounts : []).forEach(account => {
      let age = account.age;
      if (!age && account.date_of_birth) {
        age = new Date().getFullYear() - new Date(account.date_of_birth).getFullYear();
      }
      if (age) {
        if (age >= 18 && age <= 25) ageGroups['18-25']++;
        else if (age >= 26 && age <= 35) ageGroups['26-35']++;
        else if (age >= 36 && age <= 50) ageGroups['36-50']++;
        else if (age >= 51 && age <= 65) ageGroups['51-65']++;
        else if (age > 65) ageGroups['65+']++;
        else ageGroups['Unknown']++;
      } else {
        ageGroups['Unknown']++;
      }
    });
    const ageData = Object.keys(ageGroups).map(key => ({
      name: key,
      Count: ageGroups[key]
    })).filter(data => data.Count > 0);

    // 4. Request Status Breakdown
    const statusCounts = (Array.isArray(certificateRequests) ? certificateRequests : []).reduce((acc, req) => {
      acc[req.process_status] = (acc[req.process_status] || 0) + 1;
      return acc;
    }, {});
    const statusData = Object.keys(statusCounts).map(key => ({
      name: key,
      Count: statusCounts[key]
    }));

    return { registrationData, requestTypeData, ageData, statusData };
  }, [accounts, certificateRequests]);
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme') || 'light'
    setTheme(storedTheme)
    document.documentElement.dataset.theme = storedTheme

    const adminUser = localStorage.getItem('adminUser')
    if (!adminUser) {
      navigate('/admin-login')
    } else {
      const userData = JSON.parse(adminUser)
      setAdmin(userData)
      fetchAccounts()
      fetchRequests()
      fetchConversations()
      fetchPendingRegistrations()
      fetchPendingUpdates()
    }
  }, [navigate])

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(nextTheme)
    document.documentElement.dataset.theme = nextTheme
    localStorage.setItem('theme', nextTheme)
  }

  useEffect(() => {
    if (activeTab === 'requests') fetchRequests()
    if (activeTab === 'residents') fetchAccounts()
    if (activeTab === 'chat') fetchConversations()
    if (activeTab === 'pending') fetchPendingRegistrations()
    if (activeTab === 'updates') fetchPendingUpdates()
    if (activeTab === 'archived') {
      fetchArchivedAccounts()
      if (archiveSubTab === 'files') {
        currentFolder ? fetchArchiveFiles(currentFolder.id) : fetchArchiveFolders()
      } else if (archiveSubTab === 'residents') {
        fetchResidentArchiveFolders()
      }
    }
  }, [activeTab, archiveSubTab, currentFolder, currentResidentFolder])

  useEffect(() => {
    const timer = setInterval(() => {
      // Background polling for all pending data to keep badges "live"
      fetchPendingRegistrations();
      fetchPendingUpdates();
      fetchRequests();
      fetchConversations();
      
      // Update specific chat messages if chat tab is open and resident is selected
      if (activeTab === 'chat' && selectedChatResident) {
        fetchMessages(selectedChatResident.id);
        markAsRead(selectedChatResident.id);
      }
    }, 10000); // Check every 10 seconds
    return () => clearInterval(timer);
  }, [activeTab, selectedChatResident])

  const pendingRegCount = pendingRegistrations.length;
  const pendingUpdCount = pendingUpdates.length;
  const activeRequestsCount = Array.isArray(certificateRequests) ? certificateRequests.filter(r => r.process_status === 'In process').length : 0;
  const unreadMessagesCount = Array.isArray(conversations) ? conversations.reduce((sum, conv) => sum + (conv.unread_count || 0), 0) : 0;

  useEffect(() => {
    const prev = prevCountsRef.current;
    const newNotifs = [];

    // Trigger notification if counts increased since last check
    if (pendingRegCount > prev.pendingReg) newNotifs.push(`New pending registration received!`);
    if (pendingUpdCount > prev.pendingUpd) newNotifs.push(`New profile update request!`);
    if (activeRequestsCount > prev.requests) newNotifs.push(`New certificate request!`);
    if (unreadMessagesCount > prev.messages) newNotifs.push(`New unread message!`);

    if (newNotifs.length > 0) {
      setNotifications(prevNotifs => {
        const notifObjects = newNotifs.map(text => ({
          id: Date.now() + Math.random(),
          text,
          time: new Date().toLocaleTimeString(),
          isNew: true
        }));
        return [...notifObjects, ...prevNotifs].slice(0, 50); // Keep last 50 notifications
      });
    }

    prevCountsRef.current = {
      pendingReg: pendingRegCount,
      pendingUpd: pendingUpdCount,
      requests: activeRequestsCount,
      messages: unreadMessagesCount
    };
  }, [pendingRegCount, pendingUpdCount, activeRequestsCount, unreadMessagesCount]);

  const fetchConversations = async () => {
    try {
      const res = await fetch('/api/admin/conversations')
      const data = await res.json()
      setConversations(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Failed to load conversations', err)
    }
  }

  const fetchMessages = async (userId) => {
    try {
      const res = await fetch(`/api/messages/${userId}`)
      const data = await res.json()
      setMessages(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Failed to load messages', err)
    }
  }

  const handleSendMessage = async () => {
    if (!replyText.trim() || !selectedChatResident) return
    try {
      const response = await fetch('/api/messages', {
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
      await fetch(`/api/admin/messages/read/${userId}`, { method: 'PUT' })
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

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch (e) {
      return dateString;
    }
  };

  const fetchArchiveFolders = async () => {
    try {
      const res = await fetch('/api/admin/archive-folders')
      const data = await res.json()
      setArchiveFolders(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Failed to load folders:', err)
    }
  }

  const fetchArchiveFiles = async (folderId) => {
    try {
      const res = await fetch(`/api/admin/archive-files/${folderId}`)
      const data = await res.json()
      setArchiveFiles(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Failed to load files:', err)
    }
  }

  const handleCreateFolder = async (e) => {
    e.preventDefault()
    if (!newFolderName.trim()) return
    try {
      const res = await fetch('/api/admin/archive-folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newFolderName })
      })
      if (res.ok) {
        setNewFolderName('')
        setShowCreateFolder(false)
        fetchArchiveFolders()
      } else {
        alert('Failed to create folder')
      }
    } catch (err) {
      console.error('Error creating folder:', err)
    }
  }

  const handleFileUpload = async (e) => {
    if (!e.target.files || !e.target.files[0] || !currentFolder) return
    const file = e.target.files[0]
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder_id', currentFolder.id)
    formData.append('uploaded_by', admin.name)

    setUploadingFile(true)
    try {
      const res = await fetch('/api/admin/archive-files', {
        method: 'POST',
        body: formData
      })
      if (res.ok) {
        fetchArchiveFiles(currentFolder.id)
      } else {
        alert('Failed to upload file')
      }
    } catch (err) {
      console.error('Error uploading file:', err)
    } finally {
      setUploadingFile(false)
      e.target.value = null
    }
  }

  const fetchAccounts = async () => {
    try {
      const response = await fetch('/api/all-accounts')
      const data = await response.json()
      setAccounts(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Failed to fetch accounts:', err)
    }
    setLoading(false)
  }

  const fetchArchivedAccounts = async () => {
    try {
      const response = await fetch('/api/admin/archived-residents')
      const data = await response.json()
      setArchivedAccounts(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Failed to fetch archived accounts:', err)
    }
  }

  const fetchResidentArchiveFolders = async () => {
    try {
      const res = await fetch('/api/admin/resident-archive-folders')
      const data = await res.json()
      setResidentArchiveFolders(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Failed to load resident folders:', err)
    }
  }

  const fetchRequests = async () => {
    setRequestLoading(true)
    try {
      const res = await fetch('/api/all-requests')
      const data = await res.json()
      setCertificateRequests(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Failed to fetch requests:', err.message)
      setCertificateRequests([])
    }
    setRequestLoading(false)
  }

  const fetchPendingRegistrations = async () => {
    try {
      const response = await fetch('/api/admin/pending-registrations')
      const data = await response.json()
      setPendingRegistrations(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Failed to fetch pending registrations:', err)
    }
  }

  const fetchPendingUpdates = async () => {
    try {
      const response = await fetch('/api/admin/pending-updates')
      const data = await response.json()
      setPendingUpdates(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Failed to fetch pending updates:', err)
    }
  }

  const handleApproveUpdate = async (requestId) => {
    if (!window.confirm('Approve these profile changes?')) return
    try {
      const response = await fetch(`/api/admin/approve-update/${requestId}`, {
        method: 'PUT'
      })
      if (response.ok) {
        alert('Changes approved and applied!')
        fetchPendingUpdates()
        fetchAccounts()
      }
    } catch (err) {
      console.error('Error approving update:', err)
    }
  }

  const handleRejectUpdate = async (requestId) => {
    if (!window.confirm('Reject these profile changes?')) return
    try {
      const response = await fetch(`/api/admin/reject-update/${requestId}`, {
        method: 'PUT'
      })
      if (response.ok) {
        alert('Update request rejected')
        fetchPendingUpdates()
      }
    } catch (err) {
      console.error('Error rejecting update:', err)
    }
  }

  const handleApproveResident = async (userId) => {
    if (!window.confirm('Are you sure you want to approve this registration?')) return
    try {
      const response = await fetch(`/api/admin/verify-resident/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      })
      if (response.ok) {
        alert('Resident approved successfully!')
        fetchPendingRegistrations()
        fetchAccounts()
      } else {
        alert('Failed to approve resident')
      }
    } catch (err) {
      console.error('Error approving resident:', err)
      alert('Error approving resident')
    }
  }

  const handleRejectResident = async (userId) => {
    const reason = window.prompt('Enter reason for rejection (optional):')
    if (reason === null) return
    try {
      const response = await fetch(`/api/admin/reject-resident/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      })
      if (response.ok) {
        alert('Resident rejected')
        fetchPendingRegistrations()
      } else {
        alert('Failed to reject resident')
      }
    } catch (err) {
      console.error('Error rejecting resident:', err)
      alert('Error rejecting resident')
    }
  }

  const handleApproveAllResidents = async () => {
    if (!window.confirm('Are you sure you want to approve ALL pending registrations?')) return
    try {
      const response = await fetch('/api/admin/verify-all-residents', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      })
      if (response.ok) {
        alert('All pending residents approved successfully!')
        fetchPendingRegistrations()
        fetchAccounts()
      } else {
        alert('Failed to approve all residents')
      }
    } catch (err) {
      console.error('Error approving all residents:', err)
      alert('Error approving all residents')
    }
  }

  const refreshAll = () => {
    fetchAccounts();
    fetchRequests();
    fetchConversations();
    if (activeTab === 'archived') {
      fetchArchivedAccounts();
      if (archiveSubTab === 'files') {
        currentFolder ? fetchArchiveFiles(currentFolder.id) : fetchArchiveFolders()
      }
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('adminUser')
    navigate('/admin-login')
  }

  const handleRemovePhoto = async (userId) => {
    if (!window.confirm('Are you sure you want to remove this photo?')) return;
    try {
      const response = await fetch(`/api/admin/remove-photo/${userId}`, {
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
      const response = await fetch(`/api/user/${userId}`, {
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

  const handleArchiveResident = async (userId, name) => {
    if (!window.confirm(`Are you sure you want to archive the account for ${name}? Archived accounts are preserved and can be reviewed later.`)) return;

    try {
      const response = await fetch(`/api/admin/archive-resident/${userId}`, {
        method: 'PUT'
      });
      const data = await response.json();

      if (response.ok) {
        alert('Resident account archived successfully');
        fetchAccounts();
        if (selectedResident && selectedResident.id === userId) {
          closeResidentDetails();
        }
      } else {
        alert(data.message || 'Failed to archive resident');
      }
    } catch (err) {
      console.error('Error archiving resident:', err);
      alert('Error archiving resident: ' + err.message);
    }
  };

  const openResidentDetails = (account) => {
    console.log("🔍 Opening resident details:", account);
    setSelectedResident(account)
    setActiveTab('residentDetail')
  }

  const closeResidentDetails = () => {
    setSelectedResident(null)
    setActiveTab('residents')
  }

  const handleMessageResident = () => {
    if (!selectedResident) return
    setSelectedChatResident(selectedResident)
    setActiveTab('chat')
  }

  const getProcessStatusClass = (status) => {
    switch (status) {
      case 'Claimed': return 'status-verified';
      case 'Void': return 'status-rejected';
      case 'For Pickup': return 'status-pickup';
      default: return 'status-pending';
    }
  };

  const handleCreateResidentFolder = async (e) => {
    e.preventDefault();
    if (!newResidentFolderName.trim()) return;
    try {
      const response = await fetch('/api/admin/resident-archive-folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newResidentFolderName })
      });
      if (response.ok) {
        setNewResidentFolderName('');
        setShowCreateResidentFolder(false);
        fetchResidentArchiveFolders();
      } else {
        alert('Failed to create folder');
      }
    } catch (err) {
      console.error('Error creating folder:', err);
    }
  };

  const handleMoveResidentToFolder = async (residentId, folderId) => {
    try {
      const response = await fetch('/api/admin/resident-archive-folders/move', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ residentId, folderId })
      });
      if (response.ok) {
        fetchArchivedAccounts();
      } else {
        alert('Failed to move resident');
      }
    } catch (err) {
      console.error('Error moving resident:', err);
    }
  };

  const handleRenameFolder = async (e, folderId, isResidentFolder) => {
    e.stopPropagation();
    if (!editingFolderName.trim()) {
      setEditingFolderId(null);
      return;
    }
    try {
      const endpoint = isResidentFolder 
        ? `/api/admin/resident-archive-folders/${folderId}`
        : `/api/admin/archive-folders/${folderId}`;
      
      const res = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editingFolderName })
      });
      if (res.ok) {
        setEditingFolderId(null);
        if (isResidentFolder) {
          fetchResidentArchiveFolders();
        } else {
          fetchArchiveFolders();
        }
      } else {
        alert('Failed to rename folder');
      }
    } catch (err) {
      console.error('Error renaming folder:', err);
    }
  };

  const startEditingFolder = (e, folder) => {
    e.stopPropagation();
    setEditingFolderId(folder.id);
    setEditingFolderName(folder.name);
  };

  if (loading) return (
    <div className="loading-screen" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
      <div className="loading-spinner"></div>
      <div>Loading Flux Dashboard...</div>
      <div style={{ fontSize: '12px', opacity: 0.7 }}>Checking API connectivity...</div>
    </div>
  )
  
  if (!admin) return <div className="loading-screen">Authenticating Admin...</div>

  // Safety check for stats
  const totalResidents = Array.isArray(accounts) ? accounts.length : 0;

  const filteredAccounts = (Array.isArray(accounts) ? accounts : []).filter(account => {
    const searchLower = searchTerm.toLowerCase();
    const nameMatch = account?.full_name?.toLowerCase().includes(searchLower) || false;
    const emailMatch = account?.email?.toLowerCase().includes(searchLower) || false;
    
    // Add year-based search for account creation year
    let yearMatch = false;
    if (account?.created_at) {
      const year = new Date(account.created_at).getFullYear().toString();
      if (year.includes(searchLower)) yearMatch = true;
    }

    return nameMatch || emailMatch || yearMatch;
  }).sort((a, b) => {
    if (sortOrder === 'newest') return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    if (sortOrder === 'oldest') return new Date(a.created_at || 0) - new Date(b.created_at || 0);
    if (sortOrder === 'nameAsc') return (a.full_name || '').localeCompare(b.full_name || '');
    if (sortOrder === 'nameDesc') return (b.full_name || '').localeCompare(a.full_name || '');
    return 0;
  });

  const filteredRequests = (Array.isArray(certificateRequests) ? certificateRequests : []).filter(r => {
    const searchLower = requestSearchTerm.toLowerCase();
    const matchesSearch = (r.full_name || r.resident_name || '').toLowerCase().includes(searchLower) || 
                          (r.certificate_type || '').toLowerCase().includes(searchLower);
    
    if (requestStatusFilter === 'All') return matchesSearch;
    
    const searchStatus = requestStatusFilter.toLowerCase();
    const verifyStatus = (r.verification_status || '').toLowerCase();
    const processStatus = (r.process_status || '').toLowerCase();
    
    // "Void" translates to "Not Valid" in the database/UI options
    const isVoidMatch = searchStatus === 'void' && verifyStatus === 'not valid';
    
    return matchesSearch && (verifyStatus === searchStatus || processStatus === searchStatus || isVoidMatch);
  });

  const filteredArchivedAccounts = (Array.isArray(archivedAccounts) ? archivedAccounts : []).filter(account => {
    const nameMatch = account?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false
    const emailMatch = account?.email?.toLowerCase().includes(searchTerm.toLowerCase()) || false
    return nameMatch || emailMatch
  })

  const archivedAccountsByPeriod = filteredArchivedAccounts.reduce((groups, account) => {
    const timestamp = account.archived_at || account.created_at || ''
    const date = timestamp ? new Date(timestamp) : null
    const monthYear = date && !isNaN(date.getTime())
      ? date.toLocaleString('en-US', { month: 'long', year: 'numeric' })
      : 'Unknown period'

    if (!groups[monthYear]) groups[monthYear] = []
    groups[monthYear].push(account)
    return groups
  }, {})

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
          <button className={`nav-item ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}>
            <span className="nav-icon">📈</span>
            <span className="nav-label" style={{ flex: 1 }}>Analytics</span>
          </button>
          <button className={`nav-item ${activeTab === 'residents' ? 'active' : ''}`} onClick={() => setActiveTab('residents')}>
            <span className="nav-icon">👥</span>
            <span className="nav-label" style={{ flex: 1 }}>Residents</span>
          </button>
          <button className={`nav-item ${activeTab === 'pending' ? 'active' : ''}`} onClick={() => setActiveTab('pending')}>
            <span className="nav-icon">⏳</span>
            <span className="nav-label" style={{ flex: 1 }}>Pending Registrations</span>
            {pendingRegistrations.length > 0 && <span className="unread-badge">{pendingRegistrations.length}</span>}
          </button>
          <button className={`nav-item ${activeTab === 'updates' ? 'active' : ''}`} onClick={() => setActiveTab('updates')}>
            <span className="nav-icon">🔄</span>
            <span className="nav-label" style={{ flex: 1 }}>Profile Updates</span>
            {pendingUpdates.length > 0 && <span className="unread-badge">{pendingUpdates.length}</span>}
          </button>
          <button className={`nav-item ${activeTab === 'requests' ? 'active' : ''}`} onClick={() => setActiveTab('requests')}>
            <span className="nav-icon">📜</span>
            <span className="nav-label" style={{ flex: 1 }}>Requests</span>
            {activeRequestsCount > 0 && <span className="unread-badge">{activeRequestsCount}</span>}
          </button>
          <button className={`nav-item ${activeTab === 'archived' ? 'active' : ''}`} onClick={() => setActiveTab('archived')}>
            <span className="nav-icon">🗄️</span>
            <span className="nav-label" style={{ flex: 1 }}>Archived</span>
          </button>
          <button className={`nav-item ${activeTab === 'chat' ? 'active' : ''}`} onClick={() => setActiveTab('chat')}>
            <span className="nav-icon">💬</span>
            <span className="nav-label" style={{ flex: 1 }}>Support Chat</span>
            {unreadMessagesCount > 0 && <span className="unread-badge">{unreadMessagesCount}</span>}
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
        <header className="flux-header" style={{ justifyContent: 'flex-end', position: 'relative' }}>
          <div className="header-actions">
            <div style={{ position: 'relative' }}>
              <button 
                className="logout-flux-btn" 
                style={{ position: 'relative', padding: '8px 12px', fontSize: '18px' }}
                onClick={() => setShowNotifications(!showNotifications)}
              >
                🔔
                {notifications.filter(n => n.isNew).length > 0 && (
                  <span style={{
                    position: 'absolute', top: '-5px', right: '-5px',
                    backgroundColor: 'red', color: 'white', borderRadius: '50%',
                    padding: '2px 6px', fontSize: '12px', fontWeight: 'bold'
                  }}>
                    {notifications.filter(n => n.isNew).length}
                  </span>
                )}
              </button>
              
              {/* Notification Dropdown */}
              {showNotifications && (
                <div style={{
                  position: 'absolute', top: '100%', right: '0', marginTop: '10px',
                  width: '300px', backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)',
                  borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 1000,
                  maxHeight: '400px', overflowY: 'auto'
                }}>
                  <div style={{ padding: '12px 15px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '16px' }}>Notifications</h3>
                    <button 
                      onClick={() => setNotifications(n => n.map(x => ({...x, isNew: false})))}
                      style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', fontSize: '12px' }}
                    >
                      Mark all read
                    </button>
                  </div>
                  <div style={{ padding: '10px' }}>
                    {notifications.length === 0 ? (
                      <p style={{ textAlign: 'center', color: 'var(--text-secondary)', margin: '20px 0' }}>No notifications yet.</p>
                    ) : (
                      notifications.map(notif => (
                        <div key={notif.id} style={{
                          padding: '10px', borderBottom: '1px solid var(--border-color)',
                          backgroundColor: notif.isNew ? 'rgba(52, 152, 219, 0.1)' : 'transparent',
                          borderRadius: '4px', marginBottom: '4px'
                        }}>
                          <p style={{ margin: '0 0 5px 0', fontSize: '14px', fontWeight: notif.isNew ? 'bold' : 'normal' }}>{notif.text}</p>
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{notif.time}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <button className="logout-flux-btn" onClick={refreshAll}>🔄 Refresh</button>
            <button className="logout-flux-btn" onClick={handleLogout}>Sign Out</button>
          </div>
        </header>

        <div className="settings-bar">
          <div className="settings-bar-item">
            <span>Theme:</span>
            <button className="theme-toggle-btn" onClick={toggleTheme}>
              {theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
            </button>
          </div>
        </div>

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

        <div className={`content-container ${activeTab === 'chat' ? 'chat-active' : ''}`}>
          {activeTab === 'residents' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: 0 }}>👥 Registered Residents</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div className="header-search" style={{ margin: 0 }}>
                    <span className="search-icon">🔍</span>
                    <input 
                      type="text" 
                      className="flux-input"
                      placeholder="Search residents by name, email, or year..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{ paddingLeft: '35px', width: '250px' }}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <label style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Sort By:</label>
                  <select 
                    className="flux-select"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    style={{ width: '160px' }}
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="nameAsc">Name (A-Z)</option>
                    <option value="nameDesc">Name (Z-A)</option>
                  </select>
                </div>
              </div>
            </div>
              <table className="flux-table">
                <thead>
                  <tr>
                    <th>Photo</th>
                    <th>Full Name</th>
                    <th>Email</th>
                    <th>Gender</th>
                    <th>Age</th>
                    <th>Birthday</th>
                    <th>Joined</th>
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
                      <td>
                        <button className="resident-name-button" onClick={() => openResidentDetails(account)}>
                          {account.full_name}
                        </button>
                      </td>
                      <td>{account.email}</td>
                      <td>{account.gender || '-'}</td>
                      <td>{account.age || '-'}</td>
                      <td>{formatDate(account.date_of_birth)}</td>
                      <td>{formatDateTime(account.created_at)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button className="logout-flux-btn" onClick={() => setSelectedChatResident(account) || setActiveTab('chat')}>Message</button>
                          <button 
                            className="logout-flux-btn" 
                            style={{ backgroundColor: '#fef3c7', color: '#b45309', borderColor: '#fcd34d' }}
                            onClick={() => handleArchiveResident(account.id, account.full_name)}
                          >
                            Archive
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {activeTab === 'analytics' && (
            <div className="analytics-dashboard">
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px', color: 'var(--text-primary)' }}>📈 Analytics Overview</h2>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginBottom: '40px' }}>
                
                {/* Registrations Over Time */}
                <div style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '20px', color: 'var(--text-secondary)' }}>Resident Registrations (Last 6 Months)</h3>
                  <div style={{ height: '300px', width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={analyticsData.registrationData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                        <Line type="monotone" dataKey="Registrations" stroke="#3b82f6" strokeWidth={3} dot={{ r: 5 }} />
                        <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <RechartsTooltip />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Request Types Distribution */}
                <div style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '20px', color: 'var(--text-secondary)' }}>Certificate Requests Breakdown</h3>
                  <div style={{ height: '300px', width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analyticsData.requestTypeData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {analyticsData.requestTypeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                        <Legend verticalAlign="bottom" height={36}/>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Age Demographics */}
                <div style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '20px', color: 'var(--text-secondary)' }}>Age Demographics</h3>
                  <div style={{ height: '300px', width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analyticsData.ageData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <RechartsTooltip />
                        <Bar dataKey="Count" fill="#10b981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Status Breakdown */}
                <div style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '20px', color: 'var(--text-secondary)' }}>Requests by Process Status</h3>
                  <div style={{ height: '300px', width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analyticsData.statusData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <RechartsTooltip />
                        <Bar dataKey="Count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              </div>
            </div>
          )}

          {activeTab === 'archived' && (
            <div>
              <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', borderBottom: '2px solid var(--border-color)', paddingBottom: '10px', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '20px' }}>
                  <button 
                    style={{ background: 'none', border: 'none', fontSize: '18px', fontWeight: archiveSubTab === 'residents' ? 'bold' : 'normal', color: archiveSubTab === 'residents' ? 'var(--primary-color)' : 'var(--text-secondary)', cursor: 'pointer' }}
                    onClick={() => setArchiveSubTab('residents')}
                  >
                    🗄️ Archived Residents
                  </button>
                  <button 
                    style={{ background: 'none', border: 'none', fontSize: '18px', fontWeight: archiveSubTab === 'files' ? 'bold' : 'normal', color: archiveSubTab === 'files' ? 'var(--primary-color)' : 'var(--text-secondary)', cursor: 'pointer' }}
                    onClick={() => setArchiveSubTab('files')}
                  >
                    📁 Document Archives
                  </button>
                </div>
                {archiveSubTab === 'residents' && (
                  <div className="header-search" style={{ margin: 0 }}>
                    <span className="search-icon">🔍</span>
                    <input 
                      type="text" 
                      placeholder="Search archived residents..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{ padding: '8px 12px 8px 35px' }}
                    />
                  </div>
                )}
              </div>

              {archiveSubTab === 'residents' && (
                <div className="resident-archives">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                      {currentResidentFolder ? (
                        <>
                          <button className="logout-flux-btn" onClick={() => setCurrentResidentFolder(null)} style={{ marginRight: '10px', padding: '8px 12px' }}>← Back</button>
                          🗂️ {currentResidentFolder.name}
                        </>
                      ) : (
                        "Resident Folders"
                      )}
                    </div>
                    <div>
                      {!currentResidentFolder && (
                        <button className="logout-flux-btn" onClick={() => setShowCreateResidentFolder(true)}>+ Create Folder</button>
                      )}
                    </div>
                  </div>

                  {showCreateResidentFolder && (
                    <div style={{ marginBottom: '20px', padding: '15px', background: 'var(--bg-secondary)', borderRadius: '8px', display: 'flex', gap: '10px' }}>
                      <input 
                        type="text" 
                        placeholder="Folder Name" 
                        value={newResidentFolderName}
                        onChange={(e) => setNewResidentFolderName(e.target.value)}
                        style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', flex: 1 }}
                      />
                      <button className="logout-flux-btn" onClick={handleCreateResidentFolder}>Save</button>
                      <button className="logout-flux-btn" onClick={() => setShowCreateResidentFolder(false)} style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fee2e2' }}>Cancel</button>
                    </div>
                  )}

                  {!currentResidentFolder && (
                    <div className="archive-grid" style={{ marginBottom: '40px' }}>
                      {residentArchiveFolders.length > 0 ? residentArchiveFolders.map(folder => (
                        <div key={folder.id} className="folder-card" onClick={() => setCurrentResidentFolder(folder)}>
                          <div className="folder-icon">🗂️</div>
                          <div className="folder-name" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '8px' }}>
                            {editingFolderId === folder.id ? (
                              <div style={{ display: 'flex', gap: '5px', flex: 1 }} onClick={(e) => e.stopPropagation()}>
                                <input 
                                  type="text" 
                                  value={editingFolderName}
                                  onChange={(e) => setEditingFolderName(e.target.value)}
                                  onKeyPress={(e) => e.key === 'Enter' && handleRenameFolder(e, folder.id, true)}
                                  style={{ padding: '4px', width: '100%', borderRadius: '4px', border: '1px solid var(--border-color)' }}
                                  autoFocus
                                />
                                <button className="logout-flux-btn" style={{ padding: '4px 8px', fontSize: '12px' }} onClick={(e) => handleRenameFolder(e, folder.id, true)}>Save</button>
                                <button className="logout-flux-btn" style={{ padding: '4px 8px', fontSize: '12px', background: '#fef2f2', color: '#991b1b', border: '1px solid #fee2e2' }} onClick={(e) => { e.stopPropagation(); setEditingFolderId(null) }}>✕</button>
                              </div>
                            ) : (
                              <>
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{folder.name}</span>
                                <button 
                                  onClick={(e) => startEditingFolder(e, folder)}
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', padding: '0 5px' }}
                                  title="Rename folder"
                                >
                                  ✎
                                </button>
                              </>
                            )}
                          </div>
                          <div className="folder-meta">{formatDateTime(folder.created_at)}</div>
                        </div>
                      )) : (
                        <p style={{ color: 'var(--text-secondary)' }}>No resident folders created yet.</p>
                      )}
                    </div>
                  )}


                  <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '20px', color: 'var(--text-primary)' }}>
                    {currentResidentFolder ? `Residents in ${currentResidentFolder.name}` : 'Unassigned Residents'}
                  </h3>

                  {(() => {
                    const residentsToDisplay = filteredArchivedAccounts.filter(a => 
                      currentResidentFolder 
                        ? a.archive_folder_id === currentResidentFolder.id 
                        : !a.archive_folder_id
                    );

                    if (residentsToDisplay.length === 0) {
                      return <p style={{ padding: '18px 0', color: 'var(--text-secondary)' }}>No residents found here.</p>;
                    }

                    return (
                      <table className="flux-table">
                        <thead>
                          <tr>
                            <th>Photo</th>
                            <th>Full Name</th>
                            <th>Email</th>
                            <th>Birthday</th>
                            <th>Archived On</th>
                            <th>Move to Folder</th>
                          </tr>
                        </thead>
                        <tbody>
                          {residentsToDisplay.map((account) => (
                            <tr key={account.id}>
                              <td>
                                <div className="admin-photo-cell">
                                  <div 
                                    className="admin-photo-preview clickable"
                                    onClick={() => account.photo && setSelectedPhoto(account.photo)}
                                  >
                                    {account.photo ? <img src={account.photo} alt="" /> : <div className="admin-photo-placeholder">None</div>}
                                  </div>
                                </div>
                              </td>
                              <td>
                                <button className="resident-name-button" onClick={() => openResidentDetails(account)}>
                                  {account.full_name}
                                </button>
                              </td>
                              <td>{account.email}</td>
                              <td>{formatDate(account.date_of_birth)}</td>
                              <td>{formatDateTime(account.archived_at)}</td>
                              <td>
                                <select 
                                  value={account.archive_folder_id || ""}
                                  onChange={(e) => handleMoveResidentToFolder(account.id, e.target.value || null)}
                                  style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                                >
                                  <option style={{ color: '#000', backgroundColor: '#fff' }} value="">Unassigned</option>
                                  {residentArchiveFolders.map(f => (
                                    <option style={{ color: '#000', backgroundColor: '#fff' }} key={f.id} value={f.id}>{f.name}</option>
                                  ))}
                                </select>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    );
                  })()}
                </div>
              )}

              {archiveSubTab === 'files' && (
                <div className="document-archives">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                      {currentFolder ? (
                        <>
                          <button className="logout-flux-btn" onClick={() => setCurrentFolder(null)} style={{ marginRight: '10px', padding: '8px 12px' }}>← Back</button>
                          📁 {currentFolder.name}
                        </>
                      ) : (
                        "Root Folders"
                      )}
                    </div>
                    <div>
                      {!currentFolder ? (
                        <button className="logout-flux-btn" onClick={() => setShowCreateFolder(true)}>+ Create Folder</button>
                      ) : (
                        <label className="logout-flux-btn" style={{ cursor: 'pointer', display: 'inline-block' }}>
                          {uploadingFile ? 'Uploading...' : '↑ Upload File'}
                          <input type="file" style={{ display: 'none' }} onChange={handleFileUpload} disabled={uploadingFile} />
                        </label>
                      )}
                    </div>
                  </div>

                  {showCreateFolder && (
                    <div style={{ marginBottom: '20px', padding: '15px', background: 'var(--bg-secondary)', borderRadius: '8px', display: 'flex', gap: '10px' }}>
                      <input 
                        type="text" 
                        placeholder="Folder Name" 
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', flex: 1 }}
                      />
                      <button className="logout-flux-btn" onClick={handleCreateFolder}>Save</button>
                      <button className="logout-flux-btn" onClick={() => setShowCreateFolder(false)} style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fee2e2' }}>Cancel</button>
                    </div>
                  )}

                  {!currentFolder ? (
                    <div className="archive-grid">
                      {archiveFolders.length > 0 ? archiveFolders.map(folder => (
                        <div key={folder.id} className="folder-card" onClick={() => setCurrentFolder(folder)}>
                          <div className="folder-icon">📁</div>
                          <div className="folder-name" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '8px' }}>
                            {editingFolderId === folder.id ? (
                              <div style={{ display: 'flex', gap: '5px', flex: 1 }} onClick={(e) => e.stopPropagation()}>
                                <input 
                                  type="text" 
                                  value={editingFolderName}
                                  onChange={(e) => setEditingFolderName(e.target.value)}
                                  onKeyPress={(e) => e.key === 'Enter' && handleRenameFolder(e, folder.id, false)}
                                  style={{ padding: '4px', width: '100%', borderRadius: '4px', border: '1px solid var(--border-color)' }}
                                  autoFocus
                                />
                                <button className="logout-flux-btn" style={{ padding: '4px 8px', fontSize: '12px' }} onClick={(e) => handleRenameFolder(e, folder.id, false)}>Save</button>
                                <button className="logout-flux-btn" style={{ padding: '4px 8px', fontSize: '12px', background: '#fef2f2', color: '#991b1b', border: '1px solid #fee2e2' }} onClick={(e) => { e.stopPropagation(); setEditingFolderId(null) }}>✕</button>
                              </div>
                            ) : (
                              <>
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{folder.name}</span>
                                <button 
                                  onClick={(e) => startEditingFolder(e, folder)}
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', padding: '0 5px' }}
                                  title="Rename folder"
                                >
                                  ✎
                                </button>
                              </>
                            )}
                          </div>
                          <div className="folder-meta">{formatDateTime(folder.created_at)}</div>
                        </div>
                      )) : (
                        <p style={{ color: 'var(--text-secondary)' }}>No folders created yet.</p>
                      )}
                    </div>
                  ) : (
                    <div className="archive-grid">
                      {archiveFiles.length > 0 ? archiveFiles.map(file => (
                        <div key={file.id} className="file-card">
                          <div className="file-icon">📄</div>
                          <div className="file-name" title={file.file_name}>{file.file_name}</div>
                          <div className="file-meta">{(file.file_size / 1024).toFixed(1)} KB</div>
                          <a 
                            href={`/api/admin/archive-files/download/${file.id}`} 
                            download={file.file_name}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="download-btn"
                          >
                            Download
                          </a>
                        </div>
                      )) : (
                        <p style={{ color: 'var(--text-secondary)' }}>No files in this folder.</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'residentDetail' && selectedResident && (
            <div className="resident-detail-panel">
              <div className="resident-detail-header">
                <div>
                  <h2>Resident Details</h2>
                  <p>Viewing account information for {selectedResident.full_name}</p>
                </div>
                <div className="resident-detail-actions">
                  <button className="logout-flux-btn" onClick={closeResidentDetails}>← Back to residents</button>
                  <button className="logout-flux-btn" onClick={handleMessageResident}>Message Resident</button>
                  {selectedResident.is_archived !== 'Yes' ? (
                    <button 
                      className="logout-flux-btn" 
                      style={{ backgroundColor: '#f59e0b', color: 'white', borderColor: '#f59e0b' }}
                      onClick={() => handleArchiveResident(selectedResident.id, selectedResident.full_name)}
                    >
                      Archive Account
                    </button>
                  ) : (
                    <span style={{ padding: '10px 16px', borderRadius: '8px', backgroundColor: '#f3f4f6', color: '#374151' }}>Archived</span>
                  )}
                </div>
              </div>

              <div className="resident-detail-card">
                <div className="resident-detail-summary">
                  <div className="resident-detail-image clickable" onClick={() => selectedResident.photo && setSelectedPhoto(selectedResident.photo)}>
                    {selectedResident.photo ? <img src={selectedResident.photo} alt="Resident" /> : <div className="admin-photo-placeholder">No Photo</div>}
                  </div>
                  <div>
                    <h3>{selectedResident.full_name}</h3>
                    <p>{selectedResident.email || '-'}</p>
                    <p className="resident-detail-subtitle">
                      {selectedResident.gender || 'Unknown gender'} • {selectedResident.age || (selectedResident.date_of_birth ? (new Date().getFullYear() - new Date(selectedResident.date_of_birth).getFullYear()) : '-')} years old
                    </p>
                  </div>
                </div>

                {/* Personal Information */}
                <h4 className="detail-section-title">👤 Personal Information</h4>
                <div className="resident-detail-grid">
                  <div className="resident-detail-row">
                    <span>Full Name</span>
                    <strong>{selectedResident.full_name || '-'}</strong>
                  </div>
                  <div className="resident-detail-row">
                    <span>Nickname</span>
                    <strong>{selectedResident.nickname || '-'}</strong>
                  </div>
                  <div className="resident-detail-row">
                    <span>Gender</span>
                    <strong>{selectedResident.gender || '-'}</strong>
                  </div>
                  <div className="resident-detail-row">
                    <span>Age</span>
                    <strong>{selectedResident.age || (selectedResident.date_of_birth ? (new Date().getFullYear() - new Date(selectedResident.date_of_birth).getFullYear()) : '-')}</strong>
                  </div>
                  <div className="resident-detail-row">
                    <span>Birthday</span>
                    <strong>{formatDate(selectedResident.date_of_birth)}</strong>
                  </div>
                  <div className="resident-detail-row">
                    <span>Civil Status</span>
                    <strong>{selectedResident.civil_status || '-'}</strong>
                  </div>
                  <div className="resident-detail-row">
                    <span>Religion</span>
                    <strong>{selectedResident.religion || '-'}</strong>
                  </div>
                </div>

                {/* Address & Area */}
                <h4 className="detail-section-title">📍 Address & Location</h4>
                <div className="resident-detail-grid">
                  <div className="resident-detail-row" style={{ gridColumn: 'span 2' }}>
                    <span>Residential Address</span>
                    <strong>{selectedResident.home_address || selectedResident.address || '-'}</strong>
                  </div>
                  <div className="resident-detail-row">
                    <span>Barangay</span>
                    <strong>{selectedResident.barangay || '-'}</strong>
                  </div>
                  <div className="resident-detail-row">
                    <span>City/Municipality</span>
                    <strong>{selectedResident.city_municipality || '-'}</strong>
                  </div>
                  <div className="resident-detail-row">
                    <span>Area</span>
                    <strong>{selectedResident.area === 'Others' ? selectedResident.other_area : selectedResident.area || '-'}</strong>
                  </div>
                </div>

                {/* Contact Information */}
                <h4 className="detail-section-title">📞 Contact Information</h4>
                <div className="resident-detail-grid">
                  <div className="resident-detail-row">
                    <span>Mobile Phone</span>
                    <strong>{selectedResident.mobile_phone || selectedResident.phone || '-'}</strong>
                  </div>
                  <div className="resident-detail-row">
                    <span>Email Address</span>
                    <strong>{selectedResident.email || '-'}</strong>
                  </div>
                </div>

                {/* Education */}
                <h4 className="detail-section-title">🎓 Educational Background</h4>
                <div className="resident-detail-grid">
                  <div className="resident-detail-row">
                    <span>Post Graduate</span>
                    <strong>{selectedResident.post_grad_course || '-'} {selectedResident.post_grad_year ? `(${selectedResident.post_grad_year})` : ''}</strong>
                  </div>
                  <div className="resident-detail-row">
                    <span>College</span>
                    <strong>{selectedResident.college_course || '-'} {selectedResident.college_year ? `(${selectedResident.college_year})` : ''}</strong>
                  </div>
                  <div className="resident-detail-row">
                    <span>High School</span>
                    <strong>{selectedResident.high_school || '-'} {selectedResident.high_school_year ? `(${selectedResident.high_school_year})` : ''}</strong>
                  </div>
                  <div className="resident-detail-row">
                    <span>Elementary</span>
                    <strong>{selectedResident.elementary || '-'} {selectedResident.elementary_year ? `(${selectedResident.elementary_year})` : ''}</strong>
                  </div>
                  {selectedResident.other_education && (
                    <div className="resident-detail-row" style={{ gridColumn: 'span 2' }}>
                      <span>Other Education</span>
                      <strong>{selectedResident.other_education} {selectedResident.other_year ? `(${selectedResident.other_year})` : ''}</strong>
                    </div>
                  )}
                </div>

                {/* Emergency Contact */}
                <h4 className="detail-section-title">🆘 Emergency Contact</h4>
                <div className="resident-detail-grid">
                  <div className="resident-detail-row">
                    <span>Contact Name</span>
                    <strong>{selectedResident.emergency_name || '-'}</strong>
                  </div>
                  <div className="resident-detail-row">
                    <span>Phone Number</span>
                    <strong>{selectedResident.emergency_phone || '-'}</strong>
                  </div>
                  <div className="resident-detail-row">
                    <span>Relationship</span>
                    <strong>{selectedResident.relationship || '-'}</strong>
                  </div>
                </div>

                {/* Identity Documents */}
                <h4 className="detail-section-title">🆔 Identity Verification</h4>
                <div className="resident-detail-grid">
                  <div className="resident-detail-row">
                    <span>Official ID Photo</span>
                    <div className="id-photo-container">
                      {selectedResident.id_photo ? (
                        <img 
                          src={selectedResident.id_photo} 
                          alt="Official ID" 
                          className="clickable" 
                          onClick={() => setSelectedPhoto(selectedResident.id_photo)}
                          style={{ maxWidth: '100%', borderRadius: '12px', marginTop: '10px', border: '1px solid var(--border-dark)' }}
                        />
                      ) : (
                        <div className="admin-photo-placeholder" style={{ padding: '20px', background: '#f1f5f9', borderRadius: '12px', marginTop: '10px' }}>
                          No ID Photo Uploaded
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="resident-detail-row">
                    <span>Digital Signature</span>
                    <div className="id-photo-container">
                      {selectedResident.signature_file ? (
                        <img 
                          src={selectedResident.signature_file} 
                          alt="Signature" 
                          style={{ maxWidth: '100%', maxHeight: '100px', objectFit: 'contain', marginTop: '10px' }}
                        />
                      ) : (
                        <div className="admin-photo-placeholder" style={{ padding: '20px', background: '#f1f5f9', borderRadius: '12px', marginTop: '10px' }}>
                          No Signature Provided
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'pending' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: 0 }}>⏳ Pending Registrations ({pendingRegistrations.length})</h2>
                {pendingRegistrations.length > 0 && (
                  <button 
                    className="logout-flux-btn" 
                    style={{ backgroundColor: '#10b981', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                    onClick={handleApproveAllResidents}
                  >
                    ✓ Approve All
                  </button>
                )}
              </div>
              {pendingRegistrations.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                  No pending registrations. All applicants have been reviewed.
                </div>
              ) : (
                <table className="flux-table">
                  <thead>
                    <tr>
                      <th>Photo</th>
                      <th>Full Name</th>
                      <th>Email</th>
                      <th>Gender</th>
                      <th>Age</th>
                      <th>Applied On</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingRegistrations.map(resident => (
                      <tr key={resident.id}>
                        <td>
                          <div className="admin-photo-cell">
                            <div 
                              className="admin-photo-preview clickable"
                              onClick={() => resident.photo && setSelectedPhoto(resident.photo)}
                            >
                              {resident.photo ? <img src={resident.photo} alt="" /> : <div className="admin-photo-placeholder">None</div>}
                            </div>
                          </div>
                        </td>
                        <td>
                          <button className="resident-name-button" onClick={() => openResidentDetails(resident)}>
                            {resident.full_name}
                          </button>
                        </td>
                        <td>{resident.email}</td>
                        <td>{resident.gender || '-'}</td>
                        <td>{resident.age || '-'}</td>
                        <td>{formatDateTime(resident.created_at)}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button 
                              className="logout-flux-btn" 
                              style={{ backgroundColor: '#10b981', padding: '8px 12px', fontSize: '12px' }}
                              onClick={() => handleApproveResident(resident.id)}
                            >
                              ✓ Approve
                            </button>
                            <button 
                              className="logout-flux-btn" 
                              style={{ backgroundColor: '#ef4444', padding: '8px 12px', fontSize: '12px' }}
                              onClick={() => handleRejectResident(resident.id)}
                            >
                              ✕ Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}

          {activeTab === 'updates' && (
            <>
              <h2>🔄 Pending Profile Updates ({pendingUpdates.length})</h2>
              {pendingUpdates.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                  No pending profile update requests.
                </div>
              ) : (
                <table className="flux-table">
                  <thead>
                    <tr>
                      <th>Resident</th>
                      <th>Requested Changes</th>
                      <th>Requested On</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingUpdates.map(update => (
                      <tr key={update.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div className="admin-avatar" style={{ width: '32px', height: '32px', fontSize: '12px' }}>
                              {update.photo ? <img src={update.photo} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : update.current_name.charAt(0)}
                            </div>
                            <div>
                              <p style={{ margin: 0, fontWeight: '600' }}>{update.current_name}</p>
                              <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-secondary)' }}>{update.resident_email}</p>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', maxWidth: '300px' }}>
                            {update.full_name !== null && <div>• Name: {update.full_name}</div>}
                            {update.nickname !== null && <div>• Nickname: {update.nickname}</div>}
                            {update.home_address !== null && <div>• Address: {update.home_address}</div>}
                            {update.mobile_phone !== null && <div>• Phone: {update.mobile_phone}</div>}
                            {update.photo !== null && <div>• New Photo uploaded</div>}
                            <button 
                              style={{ background: 'none', border: 'none', color: 'var(--accent-purple)', padding: 0, cursor: 'pointer', fontSize: '11px', marginTop: '5px' }}
                              onClick={() => {
                                alert(`Full details requested:\nName: ${update.full_name}\nAddress: ${update.home_address}\nPhone: ${update.mobile_phone}\nGender: ${update.gender}\nCivil Status: ${update.civil_status}`)
                              }}
                            >
                              View all details
                            </button>
                          </div>
                        </td>
                        <td>{formatDateTime(update.created_at)}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button 
                              className="logout-flux-btn" 
                              style={{ backgroundColor: '#10b981', padding: '8px 12px', fontSize: '12px' }}
                              onClick={() => handleApproveUpdate(update.id)}
                            >
                              ✓ Approve
                            </button>
                            <button 
                              className="logout-flux-btn" 
                              style={{ backgroundColor: '#ef4444', padding: '8px 12px', fontSize: '12px' }}
                              onClick={() => handleRejectUpdate(update.id)}
                            >
                              ✕ Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}

          {activeTab === 'requests' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: 0 }}>📄 Certificate Requests</h2>
                <div style={{ display: 'flex', gap: '15px' }}>
                  <input 
                    type="text" 
                    placeholder="Search name or type..." 
                    className="flux-input"
                    value={requestSearchTerm}
                    onChange={(e) => setRequestSearchTerm(e.target.value)}
                    style={{ width: '250px' }}
                  />
                  <select 
                    className="flux-select"
                    value={requestStatusFilter}
                    onChange={(e) => setRequestStatusFilter(e.target.value)}
                    style={{ width: '180px' }}
                  >
                    <option value="All">All Statuses</option>
                    <option value="Verified">Verified</option>
                    <option value="Not Verified">Not Verified</option>
                    <option value="Void">Void</option>
                    <option value="In process">In process</option>
                    <option value="For Pickup">For Pickup</option>
                    <option value="Claimed">Claimed</option>
                  </select>
                </div>
              </div>
              {requestLoading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--accent-purple)' }}>
                  ⏳ Loading requests from database...
                </div>
              ) : certificateRequests.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                  No certificate requests found in database.
                </div>
              ) : filteredRequests.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                  No requests match your search or filter.
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
                    {filteredRequests.map(r => (
                      <tr key={r.id}>
                        <td>{r.full_name || r.resident_name || 'Resident #' + r.user_id}</td>
                        <td>{r.certificate_type}</td>
                        <td>{formatDateTime(r.request_date)}</td>
                        <td><span className={`status-badge ${r.verification_status === 'Verified' ? 'status-verified' : r.verification_status === 'Not Valid' ? 'status-rejected' : 'status-pending'}`}>{r.verification_status}</span></td>
                        <td><span className={`status-badge ${getProcessStatusClass(r.process_status)}`}>{r.process_status}</span></td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button 
                              className="logout-flux-btn" 
                              style={{ backgroundColor: '#3b82f6', color: 'white', border: 'none', fontWeight: 'bold' }}
                              onClick={() => {
                                setSelectedRequest(r)
                                setEditorContent(r.certificate_content || 'Official content will be generated here upon verification.\n\nThis certifies that the requested information is true and correct.')
                                setEditorVerification(r.verification_status || 'Not Verified')
                                setEditorProcess(r.process_status || 'In process')
                                setEditorPdfFile(null)
                                setRemovePdf(false)
                                setExistingPdf(r.pdf_file || null)
                                setEditorMode(r.pdf_file ? 'pdf' : 'text')
                                setVisibleToResident(r.visible_to_resident || 'text')
                                QRCode.toDataURL(`https://barangay830.local/verify/${r.id}`, { width: 100, margin: 1 })
                                  .then(url => setQrDataUrl(url))
                                  .catch(err => console.error(err))
                              }}>
                              Manage & Edit Document
                            </button>
                          </div>
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

      {/* Unified Manage & Mockup Editor Modal */}
      {selectedRequest && (
        <div className="flux-modal-overlay" style={{ zIndex: 1000 }}>
          <div className="flux-modal" style={{ maxWidth: '850px', width: '95%', maxHeight: '95vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header" style={{ flexShrink: 0 }}>
              <div>
                <h3>Manage Certificate: {selectedRequest.full_name || selectedRequest.resident_name || 'Resident'}</h3>
                <p>Edit the official document and update status</p>
              </div>
              <button className="close-modal-btn" onClick={() => setSelectedRequest(null)}>✕</button>
            </div>
            
            <div className="modal-body" style={{ padding: '20px', backgroundColor: '#f8fafc', color: '#0f172a', overflowY: 'auto' }}>
              
              <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
                <button 
                  onClick={() => { setEditorMode('text'); setRemovePdf(true); }}
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', border: editorMode === 'text' ? '2px solid #3b82f6' : '1px solid #cbd5e1', background: editorMode === 'text' ? '#eff6ff' : '#fff', fontWeight: 'bold', color: editorMode === 'text' ? '#3b82f6' : '#64748b', cursor: 'pointer' }}>
                  Use Built-in Editor
                </button>
                <button 
                  onClick={() => { setEditorMode('pdf'); setRemovePdf(false); }}
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', border: editorMode === 'pdf' ? '2px solid #3b82f6' : '1px solid #cbd5e1', background: editorMode === 'pdf' ? '#eff6ff' : '#fff', fontWeight: 'bold', color: editorMode === 'pdf' ? '#3b82f6' : '#64748b', cursor: 'pointer' }}>
                  Attach PDF File
                </button>
              </div>

              {/* Resident Visibility Setting */}
              <div style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '15px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div>
                  <h4 style={{ margin: '0 0 5px 0', color: '#0f172a' }}>Resident Visibility</h4>
                  <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Choose which file version the resident will see on their dashboard.</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="visibility" 
                      checked={visibleToResident === 'text'} 
                      onChange={() => setVisibleToResident('text')} 
                    />
                    <span style={{ fontWeight: visibleToResident === 'text' ? 'bold' : 'normal', color: visibleToResident === 'text' ? '#0f172a' : '#64748b' }}>Built-in Editor Text</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="visibility" 
                      checked={visibleToResident === 'pdf'} 
                      onChange={() => setVisibleToResident('pdf')} 
                    />
                    <span style={{ fontWeight: visibleToResident === 'pdf' ? 'bold' : 'normal', color: visibleToResident === 'pdf' ? '#0f172a' : '#64748b' }}>Attached PDF</span>
                  </label>
                </div>
              </div>

              {editorMode === 'text' ? (
                <>
                  {/* Formatting Toolbar */}
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', justifyContent: 'center', background: '#fff', padding: '10px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <button type="button" onClick={(e) => { e.preventDefault(); document.execCommand('bold', false, null); }} style={{ padding: '6px 12px', cursor: 'pointer', background: '#334155', color: '#ffffff', border: 'none', borderRadius: '4px', fontWeight: 'bold' }}>B</button>
                    <button type="button" onClick={(e) => { e.preventDefault(); document.execCommand('italic', false, null); }} style={{ padding: '6px 12px', cursor: 'pointer', background: '#334155', color: '#ffffff', border: 'none', borderRadius: '4px', fontStyle: 'italic' }}>I</button>
                    <button type="button" onClick={(e) => { e.preventDefault(); document.execCommand('underline', false, null); }} style={{ padding: '6px 12px', cursor: 'pointer', background: '#334155', color: '#ffffff', border: 'none', borderRadius: '4px', textDecoration: 'underline' }}>U</button>
                    <div style={{ width: '1px', background: '#cbd5e1', margin: '0 5px' }}></div>
                    <button type="button" onClick={(e) => { e.preventDefault(); document.execCommand('insertUnorderedList', false, null); }} style={{ padding: '6px 12px', cursor: 'pointer', background: '#334155', color: '#ffffff', border: 'none', borderRadius: '4px' }}>• List</button>
                    <div style={{ width: '1px', background: '#cbd5e1', margin: '0 5px' }}></div>
                    <button type="button" onClick={(e) => { e.preventDefault(); document.execCommand('justifyLeft', false, null); }} style={{ padding: '6px 12px', cursor: 'pointer', background: '#334155', color: '#ffffff', border: 'none', borderRadius: '4px' }}>Left</button>
                    <button type="button" onClick={(e) => { e.preventDefault(); document.execCommand('justifyCenter', false, null); }} style={{ padding: '6px 12px', cursor: 'pointer', background: '#334155', color: '#ffffff', border: 'none', borderRadius: '4px' }}>Center</button>
                  </div>

                  {/* Certificate Editor Area */}
                  <div style={{ width: '100%', border: '4px double #334155', padding: '50px', textAlign: 'center', position: 'relative', backgroundColor: '#ffffff', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
                    
                    {/* Persistent QR Code in top right */}
                    {qrDataUrl && (
                      <div style={{ position: 'absolute', top: '20px', right: '20px', border: '2px solid #e2e8f0', borderRadius: '4px', padding: '2px', background: '#fff' }}>
                        <img src={qrDataUrl} alt="QR Code" style={{ width: '80px', height: '80px', display: 'block' }} />
                        <div style={{ fontSize: '9px', fontWeight: 'bold', color: '#64748b', marginTop: '2px' }}>VERIFY</div>
                      </div>
                    )}

                    <h1 style={{ fontSize: '28px', marginBottom: '30px', textTransform: 'uppercase', letterSpacing: '4px', borderBottom: '2px solid #334155', display: 'inline-block', paddingBottom: '10px', color: '#0f172a', fontWeight: '900' }}>
                      {selectedRequest.certificate_type || 'Barangay Certificate'}
                    </h1>
                    
                    <div style={{ textAlign: 'left', margin: '0 auto 20px', maxWidth: '85%', padding: '15px', backgroundColor: '#f1f5f9', borderRadius: '8px', borderLeft: '4px solid #3b82f6' }}>
                      <h4 style={{ margin: '0 0 5px 0', color: '#0f172a', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px' }}>To Whom It May Concern:</h4>
                      <p style={{ margin: '0 0 5px 0', fontSize: '15px', color: '#334155' }}>
                        This is to certify that <strong style={{ fontSize: '16px', color: '#0f172a', textDecoration: 'underline' }}>{selectedRequest.full_name || selectedRequest.resident_name || 'Resident Name'}</strong>,
                      </p>
                      <p style={{ margin: '0', fontSize: '15px', color: '#334155' }}>
                        is a bona fide resident of this Barangay.
                      </p>
                    </div>
                    
                    <div 
                      contentEditable
                      onBlur={(e) => setEditorContent(e.currentTarget.innerHTML)}
                      dangerouslySetInnerHTML={{ __html: editorContent }}
                      style={{ 
                        fontSize: '16px', margin: '20px auto', lineHeight: '2', textAlign: 'justify', color: '#334155', 
                        outline: 'none', border: '1px dashed #94a3b8', padding: '20px', minHeight: '150px', 
                        borderRadius: '8px', backgroundColor: '#f8fafc', transition: 'border 0.3s'
                      }}
                      title="Click here to type your official document content"
                    />
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '60px', alignItems: 'flex-end' }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ borderBottom: '2px solid #0f172a', width: '250px', marginBottom: '8px' }}></div>
                        <p style={{ fontSize: '14px', fontWeight: 'bold', margin: 0, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '1px' }}>Barangay Captain</p>
                      </div>
                      <div style={{ textAlign: 'right', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: '#f8fafc' }}>
                        <p style={{ fontSize: '11px', fontWeight: 'bold', margin: '0 0 5px 0', color: '#64748b' }}>VERIFICATION STATUS</p>
                        <p style={{ fontSize: '15px', fontWeight: '900', margin: 0, color: editorVerification === 'Verified' ? '#10b981' : (editorVerification === 'Not Valid' ? '#ef4444' : '#f59e0b') }}>
                          {editorVerification || 'Pending'}
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ padding: '40px', textAlign: 'center', background: '#fff', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                  <h3 style={{ color: '#0f172a', marginBottom: '15px' }}>Attach PDF Document</h3>
                  
                  {(!editorPdfFile && (!existingPdf || removePdf)) && (
                    <input 
                      type="file" 
                      accept="application/pdf"
                      onChange={(e) => {
                        if (e.target.files[0]) {
                          setEditorPdfFile(e.target.files[0]);
                          setRemovePdf(false);
                        }
                      }}
                      style={{ marginBottom: '20px' }}
                    />
                  )}

                  {editorPdfFile ? (
                    <div style={{ marginTop: '20px' }}>
                      <div style={{ color: '#10b981', fontWeight: 'bold', marginBottom: '10px' }}>✅ New File selected: {editorPdfFile.name}</div>
                      <iframe 
                        src={URL.createObjectURL(editorPdfFile)} 
                        style={{ width: '100%', height: '500px', border: '1px solid #cbd5e1', borderRadius: '8px', marginBottom: '15px' }}
                        title="PDF Preview"
                      />
                      <button 
                        onClick={() => setEditorPdfFile(null)}
                        style={{ padding: '8px 16px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        Cancel / Choose Different File
                      </button>
                    </div>
                  ) : existingPdf && !removePdf ? (
                    <div style={{ marginTop: '20px' }}>
                      <div style={{ color: '#3b82f6', fontWeight: 'bold', marginBottom: '10px' }}>✅ Current PDF is attached.</div>
                      <iframe 
                        src={existingPdf} 
                        style={{ width: '100%', height: '500px', border: '1px solid #cbd5e1', borderRadius: '8px', marginBottom: '15px' }}
                        title="PDF Preview"
                      />
                      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                        <a href={existingPdf} download="certificate.pdf" target="_blank" rel="noreferrer" style={{ padding: '8px 16px', background: '#3b82f6', color: '#fff', textDecoration: 'none', borderRadius: '4px' }}>Download PDF</a>
                        <button 
                          onClick={() => setRemovePdf(true)}
                          style={{ padding: '8px 16px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          Replace File
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ color: '#64748b' }}>No file selected. Please choose a PDF file.</div>
                  )}
                </div>
              )}

              {/* Status Controls */}
              <div style={{ display: 'flex', gap: '20px', marginTop: '20px', padding: '24px', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Verification Status</label>
                  <select 
                    value={editorVerification} 
                    onChange={(e) => setEditorVerification(e.target.value)}
                    style={{ 
                      width: '100%', 
                      padding: '12px 16px', 
                      borderRadius: '8px', 
                      border: '1px solid #cbd5e1', 
                      backgroundColor: '#f8fafc', 
                      color: '#0f172a', 
                      fontSize: '15px', 
                      fontWeight: '600', 
                      outline: 'none', 
                      cursor: 'pointer', 
                      appearance: 'none', 
                      backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, 
                      backgroundRepeat: 'no-repeat', 
                      backgroundPosition: 'right 16px center', 
                      backgroundSize: '16px', 
                      boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.05)',
                      transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
                    }}
                    onFocus={(e) => { e.target.style.borderColor = '#3b82f6'; e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'; }}
                    onBlur={(e) => { e.target.style.borderColor = '#cbd5e1'; e.target.style.boxShadow = 'inset 0 1px 2px rgba(0, 0, 0, 0.05)'; }}
                  >
                    <option value="Not Verified">Not Verified</option>
                    <option value="Verified">Verified (Valid)</option>
                    <option value="Not Valid">Not Valid</option>
                  </select>
                </div>
                
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Process Status</label>
                  <select 
                    value={editorProcess} 
                    onChange={(e) => setEditorProcess(e.target.value)}
                    style={{ 
                      width: '100%', 
                      padding: '12px 16px', 
                      borderRadius: '8px', 
                      border: '1px solid #cbd5e1', 
                      backgroundColor: '#f8fafc', 
                      color: '#0f172a', 
                      fontSize: '15px', 
                      fontWeight: '600', 
                      outline: 'none', 
                      cursor: 'pointer', 
                      appearance: 'none', 
                      backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, 
                      backgroundRepeat: 'no-repeat', 
                      backgroundPosition: 'right 16px center', 
                      backgroundSize: '16px', 
                      boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.05)',
                      transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
                    }}
                    onFocus={(e) => { e.target.style.borderColor = '#3b82f6'; e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'; }}
                    onBlur={(e) => { e.target.style.borderColor = '#cbd5e1'; e.target.style.boxShadow = 'inset 0 1px 2px rgba(0, 0, 0, 0.05)'; }}
                  >
                    <option value="In process">In process</option>
                    <option value="For Pickup">For Pickup</option>
                    <option value="Claimed">Claimed</option>
                    <option value="Void">Void</option>
                  </select>
                </div>
              </div>

              <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button 
                  onClick={() => setSelectedRequest(null)}
                  style={{ padding: '12px 24px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', color: '#64748b', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button 
                  onClick={async () => {
                    try {
                      const formData = new FormData();
                      formData.append('verification_status', editorVerification);
                      formData.append('process_status', editorProcess);
                      formData.append('certificate_content', editorContent);
                      formData.append('visible_to_resident', visibleToResident);
                      if (editorPdfFile) {
                        formData.append('pdf_file', editorPdfFile);
                      }
                      if (removePdf) {
                        formData.append('remove_pdf', 'true');
                      }
                      
                      const response = await fetch(`/api/request/${selectedRequest.id}`, {
                        method: 'PUT',
                        body: formData
                      });
                      
                      if (response.ok) {
                        fetchRequests()
                        setSelectedRequest(null)
                      }
                    } catch(err) {
                      console.error('Error saving changes:', err)
                    }
                  }}
                  style={{ padding: '12px 24px', borderRadius: '6px', border: 'none', background: '#3b82f6', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Save Document
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  )
}
