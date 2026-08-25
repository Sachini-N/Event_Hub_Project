import React, { useState, useEffect } from 'react';
import EditEventModal from './modals/EditEventModal';
import AddVenueModal from './modals/AddVenueModal';
import CreateEventPage from './CreateEventPage';
import CloudinaryUploader from './CloudinaryUploader';

export default function AdminDashboardPage({
  currentUser,
  setCurrentUser,
  token,
  setToken,
  logout,
  openCreateEventModal,
  showToast,
}) {
  // Admin Login Form State
  const [adminEmail, setAdminEmail] = useState('admin@trace.lk');
  const [adminPassword, setAdminPassword] = useState('admin123');
  const [loggingIn, setLoggingIn] = useState(false);

  // Dashboard Data & Navigation State
  const [events, setEvents] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [eventTab, setEventTab] = useState('all'); // 'all', 'upcoming', 'past'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'upcoming', 'past'

  // Registrations View State
  const [regEventFilter, setRegEventFilter] = useState('all');
  const [regStatusFilter, setRegStatusFilter] = useState('all');
  const [selectedReg, setSelectedReg] = useState(null);
  const [editingRegStatus, setEditingRegStatus] = useState('Confirmed');
  const [editingRegNotes, setEditingRegNotes] = useState('');
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [savingReg, setSavingReg] = useState(false);

  // Event Edit Modal State
  const [editingEvent, setEditingEvent] = useState(null);
  const [editingVenue, setEditingVenue] = useState(null);

  // Registered Users & Branch Admins State
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [userRoleFilter, setUserRoleFilter] = useState('all'); // 'all', 'admins', 'users'
  const [showAddBranchAdminModal, setShowAddBranchAdminModal] = useState(false);
  const [editingAdminUser, setEditingAdminUser] = useState(null);
  const [editingAdminForm, setEditingAdminForm] = useState({
    name: '',
    branch: 'TRACE Expert City (Colombo)',
    permissions: ['manage_events', 'manage_registrations'],
    avatar: '',
  });
  const [savingAdminEdit, setSavingAdminEdit] = useState(false);

  const [branchAdminForm, setBranchAdminForm] = useState({
    name: '',
    email: '',
    password: '',
    branch: 'TRACE Expert City (Colombo)',
    permissions: ['manage_events', 'manage_registrations'],
  });
  const [emailNotificationModalData, setEmailNotificationModalData] = useState(null);
  const [submittingBranchAdmin, setSubmittingBranchAdmin] = useState(false);

  const handleSaveAdminEdit = async (e) => {
    e.preventDefault();
    if (!editingAdminUser) return;
    setSavingAdminEdit(true);
    try {
      const res = await fetch(`/api/auth/users/${editingAdminUser._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingAdminForm),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setRegisteredUsers((prev) =>
          prev.map((u) => (u._id === editingAdminUser._id ? { ...u, ...data.data } : u))
        );
        setEditingAdminUser(null);
        if (showToast) showToast(`Admin details for "${editingAdminForm.name}" updated successfully!`, 'success');
      } else {
        if (showToast) showToast(data.message || 'Failed to update admin details', 'error');
      }
    } catch (err) {
      if (showToast) showToast('Failed to connect to server', 'error');
    } finally {
      setSavingAdminEdit(false);
    }
  };

  const handleCreateBranchAdmin = async (e) => {
    e.preventDefault();
    if (!branchAdminForm.name || !branchAdminForm.email || !branchAdminForm.password) {
      if (showToast) showToast('Please enter Name, Email, and Password.', 'error');
      return;
    }

    setSubmittingBranchAdmin(true);
    try {
      const res = await fetch('/api/auth/create-branch-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(branchAdminForm),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setShowAddBranchAdminModal(false);
        if (showToast) showToast(data.message, 'success');
        
        // Show Email Dispatch Notification Modal to Admin
        setEmailNotificationModalData(data.emailNotification);

        // Refresh registered users list
        fetchDashboardData();
        
        // Reset form
        setBranchAdminForm({
          name: '',
          email: '',
          password: '',
          branch: 'TRACE Expert City (Colombo)',
          permissions: ['manage_events', 'manage_registrations'],
        });
      } else {
        if (showToast) showToast(data.message || 'Failed to assign branch admin', 'error');
      }
    } catch (err) {
      console.error('Error creating branch admin:', err);
      if (showToast) showToast('Network error creating branch admin', 'error');
    } finally {
      setSubmittingBranchAdmin(false);
    }
  };

  const handleSendEmailCredentials = async (user) => {
    if (showToast) showToast(`Dispatching credentials email to ${user.email}...`, 'info');
    try {
      const res = await fetch('/api/auth/send-credentials-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user._id, email: user.email }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (showToast) showToast(`Credentials email dispatched to ${user.email}!`, 'success');
        setEmailNotificationModalData(data.emailNotification);
      } else {
        if (showToast) showToast(data.message || 'Failed to send credentials email', 'error');
      }
    } catch (err) {
      console.error('Error sending credentials email:', err);
      if (showToast) showToast('Network error sending email', 'error');
    }
  };

  // Venues State
  const [venues, setVenues] = useState([
    {
      id: 1,
      name: 'TRACE Main Auditorium',
      city: 'Colombo 10, Sri Lanka',
      address: 'Bay 5, TRACE Expert City, Maradana Rd',
      capacity: 250,
      status: 'Available',
      coverImage: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=800&q=80',
      amenities: ['4K Projectors', 'High-Speed WiFi', 'Live Streaming AV', 'Air Conditioned', 'Stage Lighting'],
    },
    {
      id: 2,
      name: 'Innovation Center Tech Lab',
      city: 'Colombo 10, Sri Lanka',
      address: 'Building B, TRACE Expert City',
      capacity: 120,
      status: 'Available',
      coverImage: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
      amenities: ['Interactive Whiteboards', 'Power Outlets at Desk', 'Dual Monitors', 'Catering Station'],
    },
    {
      id: 3,
      name: 'TRACE Hub Meeting Hall 4',
      city: 'Colombo 10, Sri Lanka',
      address: 'Bay 2, TRACE Expert City',
      capacity: 60,
      status: 'Reserved',
      coverImage: 'https://images.unsplash.com/photo-1431540015161-0bf868a2d407?auto=format&fit=crop&w=800&q=80',
      amenities: ['Conference Cam', 'Surround Audio', 'Whiteboard Wall'],
    },
  ]);

  // Settings State
  const [settingsForm, setSettingsForm] = useState({
    orgName: 'TRACE Sri Lanka',
    contactEmail: 'support@trace.lk',
    contactPhone: '+94 11 234 5678',
    timezone: 'Asia/Colombo (GMT+5:30)',
    currency: 'LKR (Rs.)',
    emailConfirmations: true,
    smsReminders: true,
    adminDigest: true,
    requireDeleteConfirm: true,
  });

  const [showAddVenueModal, setShowAddVenueModal] = useState(false);
  const [venueBookings, setVenueBookings] = useState([]);
  const [inquirySearchQuery, setInquirySearchQuery] = useState('');
  const [inquiryBranchFilter, setInquiryBranchFilter] = useState('all');
  const [inquiryStatusFilter, setInquiryStatusFilter] = useState('all');
  const [sidebarHidden, setSidebarHidden] = useState(false);

  const isAdmin = currentUser && currentUser.role === 'admin';

  // Fetch Dashboard Data from Backend APIs
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Events
      const eventsRes = await fetch('/api/events');
      const eventsData = await eventsRes.json();
      if (eventsData.success) {
        setEvents(eventsData.data || []);
      }

      // 2. Fetch Registrations
      const regsRes = await fetch('/api/registrations');
      const regsData = await regsRes.json();
      if (regsData.success) {
        setRegistrations(regsData.data || []);
      }

      // 3. Fetch Venues
      const venuesRes = await fetch('/api/venues');
      const venuesData = await venuesRes.json();
      if (venuesData.success && venuesData.data && venuesData.data.length > 0) {
        setVenues(venuesData.data);
      }

      // 4. Fetch Venue Booking Inquiries
      const bookingsRes = await fetch('/api/venue-bookings');
      const bookingsData = await bookingsRes.json();
      if (bookingsData.success) {
        setVenueBookings(bookingsData.data || []);
      }

      // 5. Fetch Registered Users
      const usersRes = await fetch('/api/auth/users');
      const usersData = await usersRes.json();
      if (usersData.success) {
        setRegisteredUsers(usersData.data || []);
      }
    } catch (err) {
      console.error('Error loading admin dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchDashboardData();
    }
  }, [isAdmin]);

  // Sync state when a registration is selected for the slide-over drawer
  useEffect(() => {
    if (selectedReg) {
      setEditingRegStatus(selectedReg.status || 'Confirmed');
      setEditingRegNotes(selectedReg.notes || 'Requested vegetarian meal option for the networking dinner.');
      setIsChangingStatus(false);
      setIsEditingNotes(false);
    }
  }, [selectedReg]);

  // Handle Admin Security Login Submission
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoggingIn(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: adminEmail, password: adminPassword }),
      });

      const result = await response.json();

      if (result.success) {
        const user = result.data.user;
        const authToken = result.data.token;

        if (user.role !== 'admin') {
          if (showToast) {
            showToast('Access denied. Account does not have admin privileges.', 'error');
          }
          setLoggingIn(false);
          return;
        }

        // Store Admin Auth State
        localStorage.setItem('eventhub_token', authToken);
        if (setToken) setToken(authToken);
        if (setCurrentUser) setCurrentUser(user);

        if (showToast) {
          showToast(`Welcome back to Admin Portal, ${user.name}!`, 'success');
        }
      } else {
        if (showToast) {
          showToast(result.message || 'Invalid admin credentials.', 'error');
        }
      }
    } catch (err) {
      console.error('Admin login error:', err);
      if (showToast) showToast('Network error during admin login.', 'error');
    } finally {
      setLoggingIn(false);
    }
  };

  // Delete Event Handler
  const handleDeleteEvent = async (eventId, eventTitle) => {
    if (!window.confirm(`Are you sure you want to delete "${eventTitle}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE',
      });
      const result = await response.json();

      if (result.success) {
        if (showToast) showToast(`"${eventTitle}" deleted from MongoDB`, 'success');
        fetchDashboardData();
      } else {
        if (showToast) showToast(result.message || 'Failed to delete event', 'error');
      }
    } catch (err) {
      console.error('Error deleting event:', err);
      if (showToast) showToast('Network error deleting event', 'error');
    }
  };

  // Duplicate Event Handler
  const handleDuplicateEvent = async (evt) => {
    try {
      const cloned = {
        ...evt,
        _id: undefined,
        title: `${evt.title} (Copy)`,
        registeredCount: 0,
        createdAt: undefined,
      };

      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cloned),
      });

      const result = await response.json();
      if (result.success) {
        if (showToast) showToast(`Duplicated "${evt.title}" successfully!`, 'success');
        fetchDashboardData();
      }
    } catch (err) {
      console.error('Error duplicating event:', err);
    }
  };

  // Save Registration Changes Handler (Update Status & Notes in MongoDB)
  const handleSaveRegistrationChanges = async () => {
    if (!selectedReg) return;
    setSavingReg(true);

    try {
      const response = await fetch(`/api/registrations/${selectedReg._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: editingRegStatus,
          notes: editingRegNotes,
        }),
      });

      const result = await response.json();

      if (result.success) {
        if (showToast) showToast('Registration status updated successfully!', 'success');
        const updatedReg = result.data || {
          ...selectedReg,
          status: editingRegStatus,
          notes: editingRegNotes,
        };

        setSelectedReg(updatedReg);
        setIsChangingStatus(false);
        setIsEditingNotes(false);

        // Update local registrations list state immediately
        setRegistrations((prevRegs) =>
          prevRegs.map((r) => (r._id === updatedReg._id ? { ...r, ...updatedReg } : r))
        );

        fetchDashboardData();
      } else {
        if (showToast) showToast(result.message || 'Failed to update registration', 'error');
      }
    } catch (error) {
      console.error('Error updating registration:', error);
      if (showToast) showToast('Network error updating registration', 'error');
    } finally {
      setSavingReg(false);
    }
  };

  // Direct Inline Status Change Handler for Registration Tables
  const handleDirectStatusChange = async (regId, newStatus) => {
    try {
      const response = await fetch(`/api/registrations/${regId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const result = await response.json();

      if (result.success) {
        if (showToast) showToast(`Registration status updated to "${newStatus}"!`, 'success');

        setRegistrations((prevRegs) =>
          prevRegs.map((r) => (r._id === regId ? { ...r, status: newStatus } : r))
        );

        if (selectedReg && selectedReg._id === regId) {
          setSelectedReg((prev) => ({ ...prev, status: newStatus }));
          setEditingRegStatus(newStatus);
        }
      } else {
        if (showToast) showToast(result.message || 'Failed to update status', 'error');
      }
    } catch (err) {
      console.error('Error changing registration status:', err);
      if (showToast) showToast('Network error updating registration status', 'error');
    }
  };

  // Copy to Clipboard helper
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    if (showToast) showToast(`Copied ${text} to clipboard!`, 'info');
  };

  // Get Initials for Avatar Circle
  const getInitials = (nameStr) => {
    if (!nameStr) return 'SJ';
    const parts = nameStr.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return nameStr.substring(0, 2).toUpperCase();
  };

  // If not logged in as Admin, show Security Login Screen
  if (!isAdmin) {
    return (
      <div className="admin-login-wrapper">
        <div className="admin-login-card">
          <div className="admin-login-badge">
            <i className="fa-solid fa-user-shield"></i>
          </div>
          <h2>TRACE Admin Portal</h2>
          <p className="admin-login-sub">
            Please log in with administrator credentials to access the Event Management Dashboard.
          </p>

          <form onSubmit={handleAdminLogin}>
            <div className="profile-form-group" style={{ marginBottom: '1.25rem' }}>
              <label htmlFor="admin-email-input">Admin Email Address</label>
              <input
                type="email"
                id="admin-email-input"
                required
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="admin@trace.lk"
              />
            </div>

            <div className="profile-form-group" style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="admin-password-input">Admin Password</label>
              <input
                type="password"
                id="admin-password-input"
                required
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <div className="admin-hint-box" style={{ marginBottom: '1.5rem' }}>
              <i className="fa-solid fa-circle-info"></i> Demo Admin Email: <strong>admin@trace.lk</strong> | Pass: <strong>admin123</strong>
            </div>

            <button
              type="submit"
              className="btn-save-changes-blue"
              style={{ width: '100%' }}
              disabled={loggingIn}
            >
              {loggingIn ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin"></i> Authenticating...
                </>
              ) : (
                'Log In as Admin'
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Statistics Calculations
  const totalEventsCount = events.length;
  const upcomingEvents = events.filter((e) => e.status === 'upcoming');
  const upcomingCount = upcomingEvents.length;
  const pastEvents = events.filter((e) => e.status === 'past');
  const pastCount = pastEvents.length;
  const totalRegsCount = registrations.length;
  const confirmedRegsCount = registrations.filter((r) => (r.status || 'Confirmed') === 'Confirmed').length;

  // Filter Events logic for Manage Events Page
  const displayedEvents = events.filter((evt) => {
    if (eventTab === 'upcoming' && evt.status !== 'upcoming') return false;
    if (eventTab === 'past' && evt.status !== 'past') return false;
    if (statusFilter !== 'all' && evt.status !== statusFilter) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        evt.title.toLowerCase().includes(q) ||
        evt.location.toLowerCase().includes(q) ||
        (evt.category && evt.category.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Filter Registrations logic for Registrations Page
  const displayedRegistrations = registrations.filter((reg) => {
    if (regEventFilter !== 'all' && reg.eventTitle !== regEventFilter) return false;
    if (regStatusFilter !== 'all' && (reg.status || 'Confirmed') !== regStatusFilter) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        reg.name.toLowerCase().includes(q) ||
        reg.email.toLowerCase().includes(q) ||
        (reg.contactNumber && reg.contactNumber.toLowerCase().includes(q)) ||
        (reg.eventTitle && reg.eventTitle.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Filter Venue Inquiries logic for Manage Venue Inquiries Page
  const displayedVenueBookings = venueBookings.filter((bk) => {
    if (inquiryStatusFilter !== 'all' && (bk.status || 'Pending') !== inquiryStatusFilter) return false;
    if (inquiryBranchFilter !== 'all') {
      if (!bk.branch) return false;
      const targetBranch = inquiryBranchFilter.toLowerCase();
      const currentBranch = bk.branch.toLowerCase();
      if (!currentBranch.includes(targetBranch) && !targetBranch.includes(currentBranch)) {
        return false;
      }
    }

    if (inquirySearchQuery) {
      const q = inquirySearchQuery.toLowerCase();
      return (
        (bk.bookingRef && bk.bookingRef.toLowerCase().includes(q)) ||
        (bk.name && bk.name.toLowerCase().includes(q)) ||
        (bk.email && bk.email.toLowerCase().includes(q)) ||
        (bk.phone && bk.phone.toLowerCase().includes(q)) ||
        (bk.venueName && bk.venueName.toLowerCase().includes(q)) ||
        (bk.eventTitle && bk.eventTitle.toLowerCase().includes(q)) ||
        (bk.branch && bk.branch.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const pendingInquiriesCount = venueBookings.filter((b) => (b.status || 'Pending') === 'Pending').length;
  const contactedInquiriesCount = venueBookings.filter((b) => b.status === 'Contacted').length;
  const confirmedInquiriesCount = venueBookings.filter((b) => b.status === 'Confirmed').length;
  const cancelledInquiriesCount = venueBookings.filter((b) => b.status === 'Cancelled').length;
  const isEventsView = activeMenu === 'events' || activeMenu === 'upcoming' || activeMenu === 'past';

  // Get live registration count for an event dynamically
  const getEventRegCount = (evt) => {
    if (!evt) return 0;
    const matchedRegs = registrations.filter(
      (r) =>
        (r.eventId && (r.eventId._id === evt._id || r.eventId === evt._id)) ||
        (r.eventTitle && r.eventTitle === evt.title)
    );
    return Math.max(evt.registeredCount || 0, matchedRegs.length);
  };

  return (
    <div className={`admin-dashboard-layout ${sidebarHidden ? 'sidebar-hidden' : ''}`}>
      {/* Left Sidebar */}
      <aside className={`admin-sidebar ${sidebarHidden ? 'hidden' : ''}`}>
        <div className="admin-brand">
          <span className="brand-title">EventPro Admin</span>
          <span className="brand-subtitle">Enterprise Suite</span>
        </div>

        <button
          className="btn-sidebar-create"
          onClick={() => setActiveMenu('create-event')}
        >
          <i className="fa-solid fa-plus"></i> Create New Event
        </button>

        <nav className="admin-nav-menu" style={{ marginTop: '1.25rem' }}>
          <button
            className={`admin-nav-item ${activeMenu === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveMenu('dashboard')}
          >
            <i className="fa-solid fa-table-columns"></i> Dashboard
          </button>
          <button
            className={`admin-nav-item ${isEventsView ? 'active' : ''}`}
            onClick={() => {
              setActiveMenu('events');
              setEventTab('all');
            }}
          >
            <i className="fa-regular fa-calendar-days"></i> Events
          </button>
          <button
            className={`admin-nav-item ${activeMenu === 'registrations' ? 'active' : ''}`}
            onClick={() => setActiveMenu('registrations')}
          >
            <i className="fa-solid fa-users-gear"></i> Event Registrations
          </button>
          <button
            className={`admin-nav-item ${activeMenu === 'users' ? 'active' : ''}`}
            onClick={() => setActiveMenu('users')}
          >
            <i className="fa-solid fa-users"></i> Registered Members
          </button>
          <button
            className={`admin-nav-item ${activeMenu === 'venues' ? 'active' : ''}`}
            onClick={() => setActiveMenu('venues')}
          >
            <i className="fa-solid fa-building"></i> Spaces & Facilities
          </button>
          <button
            className={`admin-nav-item ${activeMenu === 'venue-inquiries' ? 'active' : ''}`}
            onClick={() => {
              setInquirySearchQuery('');
              setInquiryBranchFilter('all');
              setInquiryStatusFilter('all');
              setActiveMenu('venue-inquiries');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <i className="fa-solid fa-list-check"></i> Space Inquiries
            {pendingInquiriesCount > 0 && (
              <span style={{ marginLeft: 'auto', background: '#d97706', color: '#fff', fontSize: '0.72rem', padding: '2px 8px', borderRadius: '10px', fontWeight: '700' }}>
                {pendingInquiriesCount}
              </span>
            )}
          </button>
          <button
            className={`admin-nav-item ${activeMenu === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveMenu('settings')}
          >
            <i className="fa-solid fa-gear"></i> Settings
          </button>
        </nav>

        <div className="admin-sidebar-bottom">
          <button className="admin-logout-btn" onClick={logout}>
            <i className="fa-solid fa-arrow-right-from-bracket"></i> Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="admin-main-container">
        {/* Top Header Bar */}
        <header className="admin-top-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              className="btn-hamburger-toggle"
              onClick={() => setSidebarHidden(!sidebarHidden)}
              title={sidebarHidden ? "Open Sidebar Menu" : "Close Sidebar Menu"}
              style={{
                width: '38px',
                height: '38px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#1e293b',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
              }}
            >
              <i className="fa-solid fa-bars" style={{ fontSize: '1.15rem' }}></i>
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <img src="/trace-logo.png" alt="TRACE" className="trace-logo-img" />
              <span className="logo-tracker-sub">Spaces Tracker</span>
            </div>
          </div>

          <div className="admin-search-box">
            <i className="fa-solid fa-magnifying-glass search-icon"></i>
            <input
              type="text"
              placeholder="Search registrations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>


        </header>

        {/* Body Content */}
        <main className="admin-body-content">
          {/* VIEW 1: CREATE NEW EVENT VIEW */}
          {activeMenu === 'create-event' ? (
            <CreateEventPage
              onCancel={() => setActiveMenu('events')}
              onEventCreated={() => {
                fetchDashboardData();
                setActiveMenu('events');
              }}
              showToast={showToast}
              currentUser={currentUser}
            />
          ) : activeMenu === 'registrations' ? (
            /* VIEW 2: EVENT REGISTRATIONS VIEW (Matching exact reference screenshot) */
            <div className="manage-registrations-container">
              <div className="admin-dashboard-title-row">
                <div>
                  <h1 className="admin-page-title">Event Registrations</h1>
                  <p style={{ fontSize: '0.95rem', color: '#64748b', marginTop: '0.2rem' }}>
                    Manage attendees, view details, and export registration data.
                  </p>
                </div>
              </div>

              {/* Filter Toolbar Box */}
              <div className="reg-toolbar-panel">
                <div className="reg-filter-group">
                  <label>SELECT EVENT</label>
                  <select
                    className="reg-filter-select"
                    value={regEventFilter}
                    onChange={(e) => setRegEventFilter(e.target.value)}
                  >
                    <option value="all">All Events</option>
                    {events.map((evt) => (
                      <option key={evt._id} value={evt.title}>
                        {evt.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="reg-filter-group">
                  <label>STATUS FILTER</label>
                  <select
                    className="reg-filter-select"
                    value={regStatusFilter}
                    onChange={(e) => setRegStatusFilter(e.target.value)}
                  >
                    <option value="all">All Statuses</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Pending">Pending</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* 2 Stat Cards Row */}
              <div className="reg-stats-grid" style={{ marginBottom: '1.5rem' }}>
                {/* Stat 1 */}
                <div className="stat-card">
                  <div className="stat-info">
                    <span className="stat-label">TOTAL REGISTERED</span>
                    <div className="stat-value">{totalRegsCount.toLocaleString()}</div>
                    <div className="stat-trend positive">
                      <i className="fa-solid fa-arrow-trend-up"></i> +12% this week
                    </div>
                  </div>
                  <div className="stat-icon-wrapper">
                    <i className="fa-solid fa-user-group"></i>
                  </div>
                </div>

                {/* Stat 2 */}
                <div className="stat-card">
                  <div className="stat-info">
                    <span className="stat-label">CONFIRMED</span>
                    <div className="stat-value">{confirmedRegsCount.toLocaleString()}</div>
                    <div className="stat-trend positive-pill">89% completion</div>
                  </div>
                  <div className="stat-icon-wrapper">
                    <i className="fa-regular fa-circle-check"></i>
                  </div>
                </div>
              </div>

              {/* Registrations Data Table Card */}
              <div className="admin-card-panel" style={{ padding: 0, overflow: 'hidden' }}>
                <div className="table-responsive-wrapper">
                  <table className="admin-data-table reg-table-interactive">
                    <thead>
                      <tr>
                        <th>FULL NAME</th>
                        <th>EMAIL</th>
                        <th>CONTACT NUMBER</th>
                        <th>EVENT</th>
                        <th>STATUS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayedRegistrations.length === 0 ? (
                        <tr>
                          <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                            No registration records found.
                          </td>
                        </tr>
                      ) : (
                        displayedRegistrations.map((reg) => {
                          const currentStatus = reg.status || 'Confirmed';
                          const statusClass =
                            currentStatus === 'Confirmed'
                              ? 'confirmed'
                              : currentStatus === 'Pending'
                                ? 'pending'
                                : 'cancelled';

                          return (
                            <tr
                              key={reg._id}
                              className={`reg-row-clickable ${selectedReg?._id === reg._id ? 'selected-row' : ''
                                }`}
                              onClick={() => setSelectedReg(reg)}
                            >
                              <td>
                                <strong className="registrant-name">{reg.name}</strong>
                              </td>
                              <td>
                                <span className="registrant-email">{reg.email}</span>
                              </td>
                              <td>
                                <span className="cell-contact-text">{reg.contactNumber || '+94 77 123 4567'}</span>
                              </td>
                              <td>
                                <span className="cell-event-title">{reg.eventTitle || 'Tech Summit 2024'}</span>
                              </td>
                              <td onClick={(e) => e.stopPropagation()}>
                                <select
                                  className={`status-pill-select ${statusClass}`}
                                  value={currentStatus}
                                  onChange={(e) => handleDirectStatusChange(reg._id, e.target.value)}
                                  style={{
                                    padding: '4px 12px',
                                    borderRadius: '9999px',
                                    fontSize: '0.82rem',
                                    fontWeight: '700',
                                    border: '1px solid transparent',
                                    cursor: 'pointer',
                                    outline: 'none',
                                    backgroundColor: currentStatus === 'Confirmed' ? '#dcfce7' : currentStatus === 'Pending' ? '#fef3c7' : '#fee2e2',
                                    color: currentStatus === 'Confirmed' ? '#15803d' : currentStatus === 'Pending' ? '#b45309' : '#b91c1c'
                                  }}
                                >
                                  <option value="Confirmed" style={{ background: '#fff', color: '#0f172a' }}>Confirmed</option>
                                  <option value="Pending" style={{ background: '#fff', color: '#0f172a' }}>Pending</option>
                                  <option value="Cancelled" style={{ background: '#fff', color: '#0f172a' }}>Cancelled</option>
                                </select>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Table Pagination Bar */}
                <div className="table-pagination-bar">
                  <span className="pagination-info">
                    Showing 1 to {displayedRegistrations.length} of {registrations.length} entries
                  </span>
                  <div className="pagination-controls">
                    <button className="page-nav-btn disabled">Previous</button>
                    <button className="page-num-btn active">1</button>
                    <button className="page-num-btn">2</button>
                    <button className="page-num-btn">3</button>
                    <button className="page-nav-btn">Next</button>
                  </div>
                </div>
              </div>
            </div>
          ) : activeMenu === 'users' ? (
            /* VIEW: REGISTERED APP USERS & BRANCH ADMINS DIRECTORY VIEW */
            <div className="manage-registrations-container">
              <div className="admin-dashboard-title-row">
                <div>
                  <h1 className="admin-page-title">Registered Members & Branch Access Control</h1>
                  <p style={{ fontSize: '0.95rem', color: '#64748b', marginTop: '0.2rem' }}>
                    View registered platform users, assign branch admins for individual hubs, set permissions, and send credential emails.
                  </p>
                </div>
                <button
                  className="btn-create-event-blue"
                  onClick={() => setShowAddBranchAdminModal(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <i className="fa-solid fa-user-shield"></i> Assign New Branch Admin
                </button>
              </div>

              {/* Stats Row */}
              <div className="reg-stats-grid" style={{ marginBottom: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                <div className="stat-card">
                  <div className="stat-info">
                    <span className="stat-label">TOTAL REGISTERED MEMBERS</span>
                    <div className="stat-value">{registeredUsers.length}</div>
                    <div className="stat-trend positive">
                      <i className="fa-solid fa-users"></i> Platform Accounts
                    </div>
                  </div>
                  <div className="stat-icon-wrapper">
                    <i className="fa-solid fa-user-check"></i>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-info">
                    <span className="stat-label">BRANCH ADMINS</span>
                    <div className="stat-value" style={{ color: '#5d4df6' }}>
                      {registeredUsers.filter((u) => u.role === 'branch_admin' || u.role === 'admin').length}
                    </div>
                    <div className="stat-trend positive-pill">Hub Administrators</div>
                  </div>
                  <div className="stat-icon-wrapper" style={{ background: '#eff6ff', color: '#5d4df6' }}>
                    <i className="fa-solid fa-user-shield"></i>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-info">
                    <span className="stat-label">ACTIVE TRACE BRANCHES</span>
                    <div className="stat-value" style={{ color: '#059669' }}>6</div>
                    <div className="stat-trend positive">Colombo, Kandy, Galle, Jaffna</div>
                  </div>
                  <div className="stat-icon-wrapper" style={{ background: '#dcfce7', color: '#059669' }}>
                    <i className="fa-solid fa-building"></i>
                  </div>
                </div>
              </div>

              {/* Users & Branch Admins Data Table */}
              <div className="admin-card-panel" style={{ padding: 0, overflow: 'hidden' }}>
                {/* Role Filter Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1.25rem', borderBottom: '1px solid #eaecf0', background: '#f8fafc', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#e2e8f0', padding: '3px', borderRadius: '10px' }}>
                    <button
                      type="button"
                      onClick={() => setUserRoleFilter('all')}
                      style={{
                        padding: '0.45rem 0.95rem',
                        borderRadius: '8px',
                        fontSize: '0.82rem',
                        fontWeight: '700',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        backgroundColor: userRoleFilter === 'all' ? '#ffffff' : 'transparent',
                        color: userRoleFilter === 'all' ? '#5d4df6' : '#64748b',
                        boxShadow: userRoleFilter === 'all' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <i className="fa-solid fa-users"></i> All Members
                      <span style={{ fontSize: '0.72rem', padding: '2px 7px', borderRadius: '12px', background: userRoleFilter === 'all' ? '#eef2ff' : '#cbd5e1', color: userRoleFilter === 'all' ? '#5d4df6' : '#475569' }}>
                        {registeredUsers.length}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setUserRoleFilter('admins')}
                      style={{
                        padding: '0.45rem 0.95rem',
                        borderRadius: '8px',
                        fontSize: '0.82rem',
                        fontWeight: '700',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        backgroundColor: userRoleFilter === 'admins' ? '#ffffff' : 'transparent',
                        color: userRoleFilter === 'admins' ? '#5d4df6' : '#64748b',
                        boxShadow: userRoleFilter === 'admins' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <i className="fa-solid fa-user-shield"></i> Admins Only
                      <span style={{ fontSize: '0.72rem', padding: '2px 7px', borderRadius: '12px', background: userRoleFilter === 'admins' ? '#eef2ff' : '#cbd5e1', color: userRoleFilter === 'admins' ? '#5d4df6' : '#475569' }}>
                        {registeredUsers.filter((u) => u.role === 'admin' || u.role === 'super_admin' || u.role === 'branch_admin').length}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setUserRoleFilter('users')}
                      style={{
                        padding: '0.45rem 0.95rem',
                        borderRadius: '8px',
                        fontSize: '0.82rem',
                        fontWeight: '700',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        backgroundColor: userRoleFilter === 'users' ? '#ffffff' : 'transparent',
                        color: userRoleFilter === 'users' ? '#5d4df6' : '#64748b',
                        boxShadow: userRoleFilter === 'users' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <i className="fa-solid fa-user"></i> Regular Users
                      <span style={{ fontSize: '0.72rem', padding: '2px 7px', borderRadius: '12px', background: userRoleFilter === 'users' ? '#eef2ff' : '#cbd5e1', color: userRoleFilter === 'users' ? '#5d4df6' : '#475569' }}>
                        {registeredUsers.filter((u) => u.role !== 'admin' && u.role !== 'super_admin' && u.role !== 'branch_admin').length}
                      </span>
                    </button>
                  </div>
                </div>

                <div className="table-responsive-wrapper">
                  <table className="admin-data-table reg-table-interactive">
                    <thead>
                      <tr>
                        <th>USER / ADMIN</th>
                        <th>EMAIL ADDRESS</th>
                        <th>ASSIGNED BRANCH</th>
                        <th>ROLE & PERMISSIONS</th>
                        <th>REGISTERED DATE</th>
                        <th style={{ textAlign: 'center' }}>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {registeredUsers.length === 0 ? (
                        <tr>
                          <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                            No registered user accounts found.
                          </td>
                        </tr>
                      ) : (
                        registeredUsers
                          .filter((u) => {
                            const isAdmin = u.role === 'admin' || u.role === 'super_admin' || u.role === 'branch_admin';
                            if (userRoleFilter === 'admins' && !isAdmin) return false;
                            if (userRoleFilter === 'users' && isAdmin) return false;

                            if (!searchQuery) return true;
                            const q = searchQuery.toLowerCase();
                            return (
                              u.name.toLowerCase().includes(q) ||
                              u.email.toLowerCase().includes(q) ||
                              (u.branch && u.branch.toLowerCase().includes(q)) ||
                              (u.contactNumber && u.contactNumber.includes(q))
                            );
                          })
                          .map((u) => (
                            <tr key={u._id || u.id}>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                  <img
                                    src={
                                      u.avatar ||
                                      `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=5d4df6&color=fff&size=80`
                                    }
                                    alt={u.name}
                                    style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
                                  />
                                  <strong style={{ color: '#0f172a' }}>{u.name}</strong>
                                </div>
                              </td>
                              <td>
                                <span style={{ color: '#5d4df6', fontWeight: '500' }}>{u.email}</span>
                              </td>
                              <td>
                                <span style={{ fontSize: '0.82rem', fontWeight: '600', color: '#0f172a' }}>
                                  {u.branch || 'TRACE Main (Colombo)'}
                                </span>
                              </td>
                              <td>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                  <span
                                    style={{
                                      padding: '3px 10px',
                                      borderRadius: '9999px',
                                      fontSize: '0.76rem',
                                      fontWeight: '700',
                                      display: 'inline-block',
                                      width: 'fit-content',
                                      backgroundColor: u.role === 'admin' || u.role === 'super_admin' ? '#eff6ff' : u.role === 'branch_admin' ? '#f0fdf4' : '#f1f5f9',
                                      color: u.role === 'admin' || u.role === 'super_admin' ? '#5d4df6' : u.role === 'branch_admin' ? '#16a34a' : '#475569',
                                      border: u.role === 'admin' || u.role === 'super_admin' ? '1px solid #bfdbfe' : u.role === 'branch_admin' ? '1px solid #bbf7d0' : '1px solid #cbd5e1',
                                    }}
                                  >
                                    {u.role === 'admin' ? '● Super Admin' : u.role === 'branch_admin' ? '● Branch Admin' : 'User Member'}
                                  </span>
                                  {u.permissions && u.permissions.length > 0 && (
                                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                                      {u.permissions.map((p) => p.replace('manage_', '')).join(', ')}
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td>
                                <span style={{ color: '#64748b', fontSize: '0.85rem' }}>
                                  {u.createdAt
                                    ? new Date(u.createdAt).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                      })
                                    : 'N/A'}
                                </span>
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                                  {(u.role === 'branch_admin' || u.role === 'admin' || u.role === 'super_admin') && (
                                    <>
                                      <button
                                        className="icon-btn-action"
                                        title="Edit Admin Details & Avatar Upload"
                                        onClick={() => {
                                          setEditingAdminUser(u);
                                          setEditingAdminForm({
                                            name: u.name || '',
                                            branch: u.branch || 'TRACE Expert City (Colombo)',
                                            permissions: u.permissions || ['manage_events', 'manage_registrations'],
                                            avatar: u.avatar || '',
                                          });
                                        }}
                                        style={{ color: '#5d4df6', background: '#eef2ff', border: '1px solid #bfdbfe' }}
                                      >
                                        <i className="fa-solid fa-user-pen"></i>
                                      </button>

                                      <button
                                        className="icon-btn-action"
                                        title="Resend Credentials Email to Branch Admin"
                                        onClick={() => handleSendEmailCredentials(u)}
                                        style={{ color: '#5d4df6', background: '#eff6ff', border: '1px solid #bfdbfe' }}
                                      >
                                        <i className="fa-solid fa-paper-plane"></i>
                                      </button>
                                    </>
                                  )}
                                  <button
                                    className="icon-btn-action danger"
                                    title="Delete User"
                                    onClick={async () => {
                                      if (
                                        window.confirm(
                                          `Are you sure you want to delete user account "${u.name}" (${u.email})?`
                                        )
                                      ) {
                                        try {
                                          const res = await fetch(`/api/auth/users/${u._id}`, { method: 'DELETE' });
                                          const data = await res.json();
                                          if (data.success) {
                                            setRegisteredUsers((prev) => prev.filter((item) => item._id !== u._id));
                                            if (showToast) showToast(`Deleted user account ${u.email}`, 'success');
                                          } else {
                                            if (showToast) showToast(data.message || 'Failed to delete user', 'error');
                                          }
                                        } catch (err) {
                                          console.error('Error deleting user:', err);
                                          if (showToast) showToast('Network error deleting user', 'error');
                                        }
                                      }
                                    }}
                                  >
                                    <i className="fa-regular fa-trash-can"></i>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : activeMenu === 'venues' ? (
            /* VIEW: VENUES MANAGEMENT VIEW */
            <div className="manage-venues-container">
              <div className="admin-dashboard-title-row">
                <div>
                  <h1 className="admin-page-title">Spaces & Facilities</h1>
                  <p style={{ fontSize: '0.95rem', color: '#64748b', marginTop: '0.2rem' }}>
                    Manage event spaces, seating capacity, and hall reservations.
                  </p>
                </div>
                <button
                  className="btn-create-event-blue"
                  onClick={() => setShowAddVenueModal(true)}
                >
                  <i className="fa-solid fa-plus"></i> Add New Space
                </button>
              </div>

              {/* Venues Grid */}
              <div className="venues-grid-2col">
                {venues.map((v) => {
                  const venueId = v._id || v.id;
                  return (
                    <div key={venueId || Math.random()} className="venue-card">
                      <img src={v.coverImage} alt={v.name} className="venue-card-banner" />
                      <div className="venue-card-body">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                          <span className={`venue-tag-badge ${v.status === 'Available' ? 'venue-tag-available' : 'venue-tag-reserved'}`}>
                            ● {v.status || 'Available'}
                          </span>
                          {v.branch && (
                            <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#5d4df6', background: '#eff6ff', padding: '2px 8px', borderRadius: '4px' }}>
                              {v.branch}
                            </span>
                          )}
                        </div>
                        <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#0f172a', marginBottom: '0.2rem' }}>
                          {v.name}
                        </h3>
                        <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.75rem' }}>
                          <i className="fa-solid fa-location-dot" style={{ color: '#5d4df6' }}></i> {v.address}
                        </p>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.88rem', fontWeight: '600', color: '#334155', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <span><i className="fa-solid fa-users" style={{ color: '#5d4df6' }}></i> Seating Capacity: <strong>{v.capacity} Seats</strong></span>
                          <span style={{ color: '#059669', fontWeight: '700' }}><i className="fa-solid fa-tag"></i> {v.rentalPrice || (v.pricePerHour ? `Rs. ${v.pricePerHour.toLocaleString()} / hr` : 'Rs. 25,000 / hr')}</span>
                        </div>

                        <div className="venue-amenities-tags">
                          {v.amenities && v.amenities.map((am, i) => (
                            <span key={i} className="amenity-chip">✓ {am}</span>
                          ))}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                          <button
                            className="btn-my-view-event"
                            style={{ fontSize: '0.8rem', padding: '6px 14px' }}
                            onClick={() => showToast && showToast(`Booking schedule checked for "${v.name}"`, 'info')}
                          >
                            Check Schedule
                          </button>
                          <button
                            className="btn-my-view-event"
                            style={{ fontSize: '0.8rem', padding: '6px 14px', background: '#eff6ff', color: '#5d4df6', border: '1px solid #bfdbfe' }}
                            onClick={() => setEditingVenue(v)}
                            title="Edit Venue Facility"
                          >
                            <i className="fa-regular fa-pen-to-square" style={{ marginRight: '4px' }}></i> Edit Facility
                          </button>
                          <button
                            className="icon-btn-action danger"
                            onClick={async () => {
                              if (!venueId) return;
                              if (window.confirm(`Are you sure you want to delete venue "${v.name}"?`)) {
                                try {
                                  const res = await fetch(`/api/venues/${venueId}`, { method: 'DELETE' });
                                  const data = await res.json();
                                  if (data.success) {
                                    setVenues((prev) => prev.filter((item) => (item._id || item.id) !== venueId));
                                    if (showToast) showToast(`Deleted venue "${v.name}" successfully!`, 'success');
                                  } else {
                                    setVenues((prev) => prev.filter((item) => (item._id || item.id) !== venueId));
                                    if (showToast) showToast(data.message || `Deleted venue "${v.name}"`, 'info');
                                  }
                                } catch (err) {
                                  console.error('Error deleting venue:', err);
                                  setVenues((prev) => prev.filter((item) => (item._id || item.id) !== venueId));
                                  if (showToast) showToast(`Deleted venue "${v.name}"`, 'info');
                                }
                              }
                            }}
                          >
                            <i className="fa-regular fa-trash-can"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Received Venue Space Inquiries Section */}
              <div className="admin-card-panel" style={{ marginTop: '2.5rem', padding: '1.5rem 1.75rem', borderRadius: '16px', border: '1px solid #e2e8f0', background: '#ffffff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
                  <div>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <i className="fa-solid fa-calendar-check" style={{ color: '#5d4df6' }}></i>
                      Received Space Booking Inquiries
                    </h2>
                    <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.2rem 0 0' }}>
                      Review and manage incoming space reservation inquiries from users across TRACE branches.
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ background: '#eff6ff', color: '#5d4df6', border: '1px solid #dbeafe', fontWeight: '700', fontSize: '0.8rem', padding: '0.35rem 0.85rem', borderRadius: '20px' }}>
                      {venueBookings.length} Requests
                    </span>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline"
                      style={{ fontSize: '0.82rem', fontWeight: '700', padding: '0.45rem 0.95rem', borderRadius: '8px', color: '#5d4df6', borderColor: '#bfdbfe', background: '#eff6ff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                      onClick={() => {
                        setInquirySearchQuery('');
                        setInquiryBranchFilter('all');
                        setInquiryStatusFilter('all');
                        setActiveMenu('venue-inquiries');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                    >
                      <i className="fa-solid fa-list-check"></i>
                      See All Inquiries ({venueBookings.length}) <i className="fa-solid fa-arrow-right" style={{ fontSize: '0.75rem' }}></i>
                    </button>
                  </div>
                </div>

                {venueBookings.length === 0 ? (
                  <div className="empty-state" style={{ padding: '2.5rem', background: '#f8fafc', borderRadius: '12px', textAlign: 'center' }}>
                    <i className="fa-solid fa-inbox" style={{ fontSize: '2rem', color: '#94a3b8', marginBottom: '0.5rem' }}></i>
                    <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#334155' }}>No Venue Booking Inquiries Yet</h3>
                    <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0 }}>Submitted user space reservation inquiries will appear here.</p>
                  </div>
                ) : (
                  <div className="table-responsive-wrapper" style={{ overflowX: 'auto' }}>
                    <table className="admin-data-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                          <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '0.72rem', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>REF</th>
                          <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '0.72rem', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>APPLICANT</th>
                          <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '0.72rem', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>VENUE & BRANCH</th>
                          <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '0.72rem', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>EVENT PURPOSE</th>
                          <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '0.72rem', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>DURATION</th>
                          <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '0.72rem', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>DATE & GUESTS</th>
                          <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '0.72rem', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>STATUS</th>
                          <th style={{ padding: '10px 14px', textAlign: 'center', fontSize: '0.72rem', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {venueBookings.map((bk) => (
                          <tr key={bk._id || bk.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '12px 14px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                              <span style={{ color: '#5d4df6', background: '#eff6ff', padding: '3px 8px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '700', fontFamily: 'monospace' }}>
                                {bk.bookingRef}
                              </span>
                            </td>
                            <td style={{ padding: '12px 14px', verticalAlign: 'middle' }}>
                              <div style={{ fontWeight: '600', color: '#0f172a', fontSize: '0.86rem' }}>{bk.name}</div>
                              <div style={{ fontSize: '0.76rem', color: '#64748b', lineHeight: 1.35 }}>{bk.email}</div>
                              <div style={{ fontSize: '0.76rem', color: '#64748b', lineHeight: 1.35 }}>{bk.phone}</div>
                            </td>
                            <td style={{ padding: '12px 14px', verticalAlign: 'middle' }}>
                              <div style={{ fontWeight: '600', color: '#0f172a', fontSize: '0.86rem' }}>{bk.venueName}</div>
                              <span style={{ fontSize: '0.72rem', fontWeight: '600', color: '#0284c7', background: '#f0f9ff', border: '1px solid #bae6fd', padding: '2px 7px', borderRadius: '4px', display: 'inline-block', marginTop: '3px' }}>
                                {bk.branch}
                              </span>
                            </td>
                            <td style={{ padding: '12px 14px', verticalAlign: 'middle', maxWidth: '220px' }}>
                              <div style={{ fontWeight: '600', color: '#334155', fontSize: '0.86rem' }}>{bk.eventTitle}</div>
                              {bk.notes && (
                                <div style={{ fontSize: '0.76rem', color: '#64748b', fontStyle: 'italic', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={bk.notes}>
                                  "{bk.notes}"
                                </div>
                              )}
                            </td>
                            <td style={{ padding: '12px 14px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                              <span style={{ fontWeight: '700', color: '#5d4df6', background: '#eff6ff', border: '1px solid #dbeafe', padding: '3px 8px', borderRadius: '6px', fontSize: '0.8rem' }}>
                                <i className="fa-regular fa-clock" style={{ marginRight: '4px' }}></i>
                                {bk.durationHours || 4} Hours
                              </span>
                            </td>
                            <td style={{ padding: '12px 14px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                              <div style={{ fontWeight: '600', color: '#0f172a', fontSize: '0.85rem' }}>{bk.eventDate}</div>
                              <div style={{ fontSize: '0.76rem', color: '#64748b' }}>
                                {bk.guests} Guests • <span style={{ color: '#059669', fontWeight: '600' }}>{bk.price || 'Rs. 25,000 / hr'}</span>
                              </div>
                            </td>
                            <td style={{ padding: '12px 14px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                              <select
                                className="status-dropdown-select"
                                value={bk.status || 'Pending'}
                                onChange={async (e) => {
                                  const newStatus = e.target.value;
                                  try {
                                    const res = await fetch(`/api/venue-bookings/${bk._id}`, {
                                      method: 'PUT',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ status: newStatus }),
                                    });
                                    const data = await res.json();
                                    if (data.success) {
                                      setVenueBookings((prev) =>
                                        prev.map((b) => (b._id === bk._id ? { ...b, status: newStatus } : b))
                                      );
                                      if (showToast) showToast(`Booking ${bk.bookingRef} status updated to ${newStatus}`, 'success');
                                    }
                                  } catch (err) {
                                    console.error('Error updating booking status:', err);
                                  }
                                }}
                                style={{
                                  padding: '5px 12px 5px 8px',
                                  borderRadius: '8px',
                                  fontSize: '0.78rem',
                                  fontWeight: '700',
                                  minWidth: '120px',
                                  border: '1px solid #cbd5e1',
                                  cursor: 'pointer',
                                  outline: 'none',
                                  backgroundColor: bk.status === 'Confirmed' ? '#dcfce7' : bk.status === 'Cancelled' ? '#fee2e2' : bk.status === 'Contacted' ? '#e0f2fe' : '#fef3c7',
                                  color: bk.status === 'Confirmed' ? '#15803d' : bk.status === 'Cancelled' ? '#b91c1c' : bk.status === 'Contacted' ? '#0369a1' : '#b45309',
                                }}
                              >
                                <option value="Pending">Pending</option>
                                <option value="Contacted">Contacted</option>
                                <option value="Confirmed">Confirmed</option>
                                <option value="Cancelled">Cancelled</option>
                              </select>
                            </td>
                            <td style={{ padding: '12px 14px', verticalAlign: 'middle', textAlign: 'center', whiteSpace: 'nowrap' }}>
                              <button
                                className="icon-btn-action danger"
                                title="Delete Booking Inquiry"
                                onClick={async () => {
                                  if (window.confirm(`Delete booking request ${bk.bookingRef}?`)) {
                                    try {
                                      const res = await fetch(`/api/venue-bookings/${bk._id}`, { method: 'DELETE' });
                                      const data = await res.json();
                                      if (data.success) {
                                        setVenueBookings((prev) => prev.filter((b) => b._id !== bk._id));
                                        if (showToast) showToast(`Deleted inquiry ${bk.bookingRef}`, 'info');
                                      }
                                    } catch (err) {
                                      console.error('Error deleting venue booking:', err);
                                    }
                                  }
                                }}
                              >
                                <i className="fa-regular fa-trash-can"></i>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : activeMenu === 'venue-inquiries' ? (
            /* VIEW: DEDICATED VENUE INQUIRIES MANAGEMENT VIEW */
            <div className="manage-venues-container">
              <div className="admin-dashboard-title-row" style={{ marginBottom: '1.5rem' }}>
                <div>
                  <h1 className="admin-page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <i className="fa-solid fa-clipboard-list" style={{ color: '#5d4df6' }}></i>
                    Venue Space Inquiries & Reservations
                  </h1>
                  <p style={{ fontSize: '0.95rem', color: '#64748b', marginTop: '0.2rem' }}>
                    Inspect, search, and filter all incoming space booking inquiries across TRACE Sri Lanka branches.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.6rem' }}>
                  <button
                    type="button"
                    className="btn btn-outline"
                    style={{ fontSize: '0.85rem', fontWeight: '700' }}
                    onClick={() => setActiveMenu('venues')}
                  >
                    <i className="fa-solid fa-arrow-left"></i> Back to Venues
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline"
                    style={{ fontSize: '0.85rem', fontWeight: '700' }}
                    onClick={() => fetchDashboardData()}
                  >
                    <i className="fa-solid fa-rotate-right"></i> Refresh List
                  </button>
                </div>
              </div>

              {/* Metric Summary Cards */}
              <div className="admin-stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="stat-card" style={{ padding: '1rem 1.25rem' }}>
                  <div className="stat-info">
                    <span className="stat-label">TOTAL INQUIRIES</span>
                    <div className="stat-value">{venueBookings.length}</div>
                  </div>
                  <div className="stat-icon-wrapper" style={{ background: '#eff6ff', color: '#5d4df6' }}>
                    <i className="fa-solid fa-inbox"></i>
                  </div>
                </div>

                <div className="stat-card" style={{ padding: '1rem 1.25rem' }}>
                  <div className="stat-info">
                    <span className="stat-label">PENDING REVIEW</span>
                    <div className="stat-value" style={{ color: '#d97706' }}>{pendingInquiriesCount}</div>
                  </div>
                  <div className="stat-icon-wrapper" style={{ background: '#fef3c7', color: '#d97706' }}>
                    <i className="fa-regular fa-clock"></i>
                  </div>
                </div>

                <div className="stat-card" style={{ padding: '1rem 1.25rem' }}>
                  <div className="stat-info">
                    <span className="stat-label">CONTACTED</span>
                    <div className="stat-value" style={{ color: '#0284c7' }}>{contactedInquiriesCount}</div>
                  </div>
                  <div className="stat-icon-wrapper" style={{ background: '#e0f2fe', color: '#0284c7' }}>
                    <i className="fa-solid fa-comments"></i>
                  </div>
                </div>

                <div className="stat-card" style={{ padding: '1rem 1.25rem' }}>
                  <div className="stat-info">
                    <span className="stat-label">CONFIRMED</span>
                    <div className="stat-value" style={{ color: '#16a34a' }}>{confirmedInquiriesCount}</div>
                  </div>
                  <div className="stat-icon-wrapper" style={{ background: '#dcfce7', color: '#16a34a' }}>
                    <i className="fa-regular fa-circle-check"></i>
                  </div>
                </div>
              </div>

              {/* Filter Toolbar Card */}
              <div className="admin-card-panel" style={{ padding: '1.25rem 1.5rem', borderRadius: '16px', marginBottom: '1.5rem', background: '#ffffff', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '1rem', alignItems: 'center' }}>
                  {/* Search Input */}
                  <div style={{ position: 'relative' }}>
                    <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '0.9rem' }}></i>
                    <input
                      type="text"
                      placeholder="Search by name, email, ref, title, venue..."
                      value={inquirySearchQuery}
                      onChange={(e) => setInquirySearchQuery(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.65rem 1rem 0.65rem 2.4rem',
                        fontSize: '0.88rem',
                        borderRadius: '10px',
                        border: '1px solid #cbd5e1',
                        outline: 'none',
                      }}
                    />
                    {inquirySearchQuery && (
                      <button
                        onClick={() => setInquirySearchQuery('')}
                        style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', color: '#94a3b8', cursor: 'pointer' }}
                      >
                        <i className="fa-solid fa-xmark"></i>
                      </button>
                    )}
                  </div>

                  {/* Branch Selector */}
                  <div>
                    <select
                      value={inquiryBranchFilter}
                      onChange={(e) => setInquiryBranchFilter(e.target.value)}
                      style={{
                        padding: '0.65rem 1rem',
                        fontSize: '0.86rem',
                        fontWeight: '600',
                        borderRadius: '10px',
                        border: '1px solid #cbd5e1',
                        backgroundColor: '#ffffff',
                        color: '#0f172a',
                        cursor: 'pointer',
                        outline: 'none',
                      }}
                    >
                      <option value="all">🏢 All TRACE Branches</option>
                      <option value="TRACE Expert City (Colombo)">Colombo Hub</option>
                      <option value="TRACE Innovation Hub (Kandy)">Kandy Hub</option>
                      <option value="TRACE Tech Park (Jaffna)">Jaffna Tech Park</option>
                      <option value="TRACE Coastal Hub (Galle)">Galle Coastal Hub</option>
                      <option value="TRACE Wayamba Incubator (Kurunegala)">Wayamba Incubator</option>
                    </select>
                  </div>

                  {/* Status Pills */}
                  <div style={{ display: 'flex', gap: '0.4rem', background: '#f1f5f9', padding: '4px', borderRadius: '10px' }}>
                    {[
                      { id: 'all', label: `All (${venueBookings.length})` },
                      { id: 'Pending', label: `Pending (${pendingInquiriesCount})` },
                      { id: 'Contacted', label: `Contacted (${contactedInquiriesCount})` },
                      { id: 'Confirmed', label: `Confirmed (${confirmedInquiriesCount})` },
                      { id: 'Cancelled', label: `Cancelled (${cancelledInquiriesCount})` },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setInquiryStatusFilter(tab.id)}
                        style={{
                          padding: '0.4rem 0.75rem',
                          fontSize: '0.78rem',
                          fontWeight: '700',
                          borderRadius: '8px',
                          border: 'none',
                          cursor: 'pointer',
                          backgroundColor: inquiryStatusFilter === tab.id ? '#ffffff' : 'transparent',
                          color: inquiryStatusFilter === tab.id ? '#5d4df6' : '#64748b',
                          boxShadow: inquiryStatusFilter === tab.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Data Table */}
              <div className="admin-card-panel" style={{ padding: '0', borderRadius: '16px', border: '1px solid #e2e8f0', background: '#ffffff', overflow: 'hidden' }}>
                {displayedVenueBookings.length === 0 ? (
                  <div className="empty-state" style={{ padding: '3.5rem', textAlign: 'center' }}>
                    <i className="fa-solid fa-filter-circle-xmark" style={{ fontSize: '2.5rem', color: '#cbd5e1', marginBottom: '0.75rem' }}></i>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#334155' }}>No Matching Space Inquiries Found</h3>
                    <p style={{ color: '#64748b', fontSize: '0.88rem', margin: '0.25rem 0 1rem' }}>
                      Try adjusting your search query, branch filter, or status filter.
                    </p>
                    <button
                      className="btn btn-sm btn-outline"
                      onClick={() => {
                        setInquirySearchQuery('');
                        setInquiryBranchFilter('all');
                        setInquiryStatusFilter('all');
                      }}
                    >
                      Reset All Filters
                    </button>
                  </div>
                ) : (
                  <div className="table-responsive-wrapper" style={{ overflowX: 'auto' }}>
                    <table className="admin-data-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                          <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: '0.72rem', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>REF</th>
                          <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: '0.72rem', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>APPLICANT</th>
                          <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: '0.72rem', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>VENUE & BRANCH</th>
                          <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: '0.72rem', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>EVENT PURPOSE & NOTES</th>
                          <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: '0.72rem', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>DURATION</th>
                          <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: '0.72rem', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>DATE & GUESTS</th>
                          <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: '0.72rem', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>STATUS</th>
                          <th style={{ padding: '12px 14px', textAlign: 'center', fontSize: '0.72rem', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayedVenueBookings.map((bk) => (
                          <tr key={bk._id || bk.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '14px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                              <span style={{ color: '#5d4df6', background: '#eff6ff', border: '1px solid #dbeafe', padding: '4px 10px', borderRadius: '6px', fontSize: '0.82rem', fontWeight: '700', fontFamily: 'monospace' }}>
                                {bk.bookingRef}
                              </span>
                            </td>
                            <td style={{ padding: '14px', verticalAlign: 'middle' }}>
                              <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '0.88rem' }}>{bk.name}</div>
                              <div style={{ fontSize: '0.78rem', color: '#64748b', lineHeight: 1.35 }}>
                                <i className="fa-regular fa-envelope" style={{ marginRight: '4px' }}></i>{bk.email}
                              </div>
                              <div style={{ fontSize: '0.78rem', color: '#64748b', lineHeight: 1.35 }}>
                                <i className="fa-solid fa-phone" style={{ marginRight: '4px' }}></i>{bk.phone}
                              </div>
                            </td>
                            <td style={{ padding: '14px', verticalAlign: 'middle' }}>
                              <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '0.88rem' }}>{bk.venueName}</div>
                              <span style={{ fontSize: '0.74rem', fontWeight: '600', color: '#0284c7', background: '#f0f9ff', border: '1px solid #bae6fd', padding: '2px 8px', borderRadius: '4px', display: 'inline-block', marginTop: '3px' }}>
                                {bk.branch}
                              </span>
                            </td>
                            <td style={{ padding: '14px', verticalAlign: 'middle', maxWidth: '240px' }}>
                              <div style={{ fontWeight: '600', color: '#334155', fontSize: '0.88rem' }}>{bk.eventTitle}</div>
                              {bk.notes && (
                                <div style={{ fontSize: '0.78rem', color: '#64748b', fontStyle: 'italic', marginTop: '3px', background: '#f8fafc', padding: '4px 8px', borderRadius: '6px', borderLeft: '3px solid #cbd5e1' }} title={bk.notes}>
                                  "{bk.notes}"
                                </div>
                              )}
                            </td>
                            <td style={{ padding: '14px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                              <span style={{ fontWeight: '700', color: '#5d4df6', background: '#eff6ff', border: '1px solid #dbeafe', padding: '4px 10px', borderRadius: '6px', fontSize: '0.82rem' }}>
                                <i className="fa-regular fa-clock" style={{ marginRight: '4px' }}></i>
                                {bk.durationHours || 4} Hours
                              </span>
                            </td>
                            <td style={{ padding: '14px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                              <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '0.86rem' }}>{bk.eventDate}</div>
                              <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                                {bk.guests} Guests • <span style={{ color: '#059669', fontWeight: '700' }}>{bk.price || 'Rs. 25,000 / hr'}</span>
                              </div>
                            </td>
                            <td style={{ padding: '14px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                              <select
                                className="status-dropdown-select"
                                value={bk.status || 'Pending'}
                                onChange={async (e) => {
                                  const newStatus = e.target.value;
                                  try {
                                    const res = await fetch(`/api/venue-bookings/${bk._id}`, {
                                      method: 'PUT',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ status: newStatus }),
                                    });
                                    const data = await res.json();
                                    if (data.success) {
                                      setVenueBookings((prev) =>
                                        prev.map((b) => (b._id === bk._id ? { ...b, status: newStatus } : b))
                                      );
                                      if (showToast) showToast(`Booking ${bk.bookingRef} status updated to ${newStatus}`, 'success');
                                    }
                                  } catch (err) {
                                    console.error('Error updating booking status:', err);
                                  }
                                }}
                                style={{
                                  padding: '6px 12px',
                                  borderRadius: '8px',
                                  fontSize: '0.8rem',
                                  fontWeight: '700',
                                  minWidth: '125px',
                                  border: '1px solid #cbd5e1',
                                  cursor: 'pointer',
                                  outline: 'none',
                                  backgroundColor: bk.status === 'Confirmed' ? '#dcfce7' : bk.status === 'Cancelled' ? '#fee2e2' : bk.status === 'Contacted' ? '#e0f2fe' : '#fef3c7',
                                  color: bk.status === 'Confirmed' ? '#15803d' : bk.status === 'Cancelled' ? '#b91c1c' : bk.status === 'Contacted' ? '#0369a1' : '#b45309',
                                }}
                              >
                                <option value="Pending">Pending</option>
                                <option value="Contacted">Contacted</option>
                                <option value="Confirmed">Confirmed</option>
                                <option value="Cancelled">Cancelled</option>
                              </select>
                            </td>
                            <td style={{ padding: '14px', verticalAlign: 'middle', textAlign: 'center', whiteSpace: 'nowrap' }}>
                              <button
                                className="icon-btn-action danger"
                                title="Delete Booking Inquiry"
                                onClick={async () => {
                                  if (window.confirm(`Delete booking request ${bk.bookingRef}?`)) {
                                    try {
                                      const res = await fetch(`/api/venue-bookings/${bk._id}`, { method: 'DELETE' });
                                      const data = await res.json();
                                      if (data.success) {
                                        setVenueBookings((prev) => prev.filter((b) => b._id !== bk._id));
                                        if (showToast) showToast(`Deleted inquiry ${bk.bookingRef}`, 'info');
                                      }
                                    } catch (err) {
                                      console.error('Error deleting venue booking:', err);
                                    }
                                  }
                                }}
                              >
                                <i className="fa-regular fa-trash-can"></i>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : activeMenu === 'settings' ? (
            /* VIEW: SETTINGS VIEW */
            <div className="manage-settings-container">
              <div className="admin-dashboard-title-row">
                <div>
                  <h1 className="admin-page-title">Platform Settings</h1>
                  <p style={{ fontSize: '0.95rem', color: '#64748b', marginTop: '0.2rem' }}>
                    Configure enterprise platform details, notifications, and security preferences.
                  </p>
                </div>
                <button
                  className="btn-create-event-blue"
                  onClick={() => {
                    if (showToast) showToast('Platform settings saved successfully!', 'success');
                  }}
                >
                  <i className="fa-regular fa-floppy-disk"></i> Save Settings
                </button>
              </div>

              <div className="settings-container-box">
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1.25rem', color: '#0f172a' }}>
                  Organization Profile
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
                  <div className="form-group">
                    <label>Organization Name</label>
                    <input
                      type="text"
                      value={settingsForm.orgName}
                      onChange={(e) => setSettingsForm({ ...settingsForm, orgName: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Support Contact Email</label>
                    <input
                      type="email"
                      value={settingsForm.contactEmail}
                      onChange={(e) => setSettingsForm({ ...settingsForm, contactEmail: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Support Contact Phone</label>
                    <input
                      type="tel"
                      value={settingsForm.contactPhone}
                      onChange={(e) => setSettingsForm({ ...settingsForm, contactPhone: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Default Timezone</label>
                    <input
                      type="text"
                      value={settingsForm.timezone}
                      onChange={(e) => setSettingsForm({ ...settingsForm, timezone: e.target.value })}
                    />
                  </div>
                </div>

                <hr style={{ borderColor: 'var(--border-light)', margin: '1.5rem 0' }} />

                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1rem', color: '#0f172a' }}>
                  Notifications & Automated Emails
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', fontSize: '0.92rem', color: '#334155' }}>
                    <input
                      type="checkbox"
                      checked={settingsForm.emailConfirmations}
                      onChange={(e) => setSettingsForm({ ...settingsForm, emailConfirmations: e.target.checked })}
                      style={{ width: '18px', height: '18px', accentColor: '#5d4df6' }}
                    />
                    Send automatic email confirmation with QR pass upon user registration.
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', fontSize: '0.92rem', color: '#334155' }}>
                    <input
                      type="checkbox"
                      checked={settingsForm.smsReminders}
                      onChange={(e) => setSettingsForm({ ...settingsForm, smsReminders: e.target.checked })}
                      style={{ width: '18px', height: '18px', accentColor: '#5d4df6' }}
                    />
                    Send automated event reminder 24 hours prior to event start.
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', fontSize: '0.92rem', color: '#334155' }}>
                    <input
                      type="checkbox"
                      checked={settingsForm.adminDigest}
                      onChange={(e) => setSettingsForm({ ...settingsForm, adminDigest: e.target.checked })}
                      style={{ width: '18px', height: '18px', accentColor: '#5d4df6' }}
                    />
                    Daily registration digest summary sent to administrator inbox.
                  </label>
                </div>

                <hr style={{ borderColor: 'var(--border-light)', margin: '1.5rem 0' }} />

                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1rem', color: '#0f172a' }}>
                  Security & Access Control
                </h3>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', fontSize: '0.92rem', color: '#334155', marginBottom: '1.5rem' }}>
                  <input
                    type="checkbox"
                    checked={settingsForm.requireDeleteConfirm}
                    onChange={(e) => setSettingsForm({ ...settingsForm, requireDeleteConfirm: e.target.checked })}
                    style={{ width: '18px', height: '18px', accentColor: '#5d4df6' }}
                  />
                  Require explicit admin confirmation dialog for deleting events or user registrations.
                </label>

                <button
                  className="btn-save-changes-blue"
                  onClick={() => {
                    if (showToast) showToast('Platform settings saved successfully!', 'success');
                  }}
                >
                  Save Platform Configuration
                </button>
              </div>
            </div>
          ) : isEventsView ? (
            /* VIEW 3: MANAGE EVENTS VIEW */
            <div className="manage-events-container">
              <div className="admin-dashboard-title-row">
                <div>
                  <h1 className="admin-page-title">Manage Events</h1>
                  <p style={{ fontSize: '0.95rem', color: '#64748b', marginTop: '0.2rem' }}>
                    Overview and administration of all organizational events.
                  </p>
                </div>
                <button
                  className="btn-create-event-blue"
                  onClick={() => setActiveMenu('create-event')}
                >
                  <i className="fa-solid fa-plus"></i> Create New Event
                </button>
              </div>

              {/* Subtabs & Filter Toolbar */}
              <div className="manage-events-toolbar">
                <div className="manage-events-tabs">
                  <button
                    className={`tab-btn ${eventTab === 'all' ? 'active' : ''}`}
                    onClick={() => setEventTab('all')}
                  >
                    All Events
                  </button>
                  <button
                    className={`tab-btn ${eventTab === 'upcoming' ? 'active' : ''}`}
                    onClick={() => setEventTab('upcoming')}
                  >
                    Upcoming
                  </button>
                  <button
                    className={`tab-btn ${eventTab === 'past' ? 'active' : ''}`}
                    onClick={() => setEventTab('past')}
                  >
                    Past
                  </button>
                </div>

                <div className="manage-events-filters">
                  <div className="filter-search-input">
                    <i className="fa-solid fa-magnifying-glass"></i>
                    <input
                      type="text"
                      placeholder="Search Events"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  <select
                    className="filter-select-dropdown"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">Status: All</option>
                    <option value="upcoming">Upcoming</option>
                    <option value="past">Past</option>
                  </select>

                  <button className="filter-btn-outline">
                    <i className="fa-regular fa-calendar"></i> Any Date
                  </button>
                </div>
              </div>

              {/* Events Data Table Card */}
              <div className="admin-card-panel" style={{ padding: 0, overflow: 'hidden' }}>
                <div className="table-responsive-wrapper">
                  <table className="admin-data-table">
                    <thead>
                      <tr>
                        <th>EVENT</th>
                        <th>DATE & TIME</th>
                        <th>LOCATION</th>
                        <th>REGISTRATIONS</th>
                        <th>STATUS</th>
                        <th>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayedEvents.length === 0 ? (
                        <tr>
                          <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                            No events found matching criteria.
                          </td>
                        </tr>
                      ) : (
                        displayedEvents.map((evt) => (
                          <tr key={evt._id}>
                            <td>
                              <div className="event-table-cell">
                                <img
                                  src={
                                    evt.coverImage ||
                                    'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=300&q=80'
                                  }
                                  alt={evt.title}
                                  className="event-thumb"
                                />
                                <div>
                                  <div className="event-cell-title">{evt.title}</div>
                                  <span className="event-cell-id">ID: EVT-{(evt._id || '9824').toString().slice(-4).toUpperCase()}</span>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div className="cell-date-time">
                                <div>
                                  {new Date(evt.date).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                  })}
                                </div>
                                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                                  {evt.time || '09:00 AM - 05:00 PM'}
                                </span>
                              </div>
                            </td>
                            <td>
                              <div className="cell-location">
                                <div style={{ fontWeight: '600', color: '#334155' }}>{evt.location}</div>
                                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Colombo, LK</span>
                              </div>
                            </td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div className="progress-bar-track" style={{ width: '80px', height: '6px' }}>
                                  <div
                                    className={`progress-fill ${evt.status === 'upcoming' ? 'fill-blue' : 'fill-slate'
                                      }`}
                                    style={{
                                      width: `${Math.min(
                                        100,
                                        (getEventRegCount(evt) / (evt.capacity || 100)) * 100
                                      )}%`,
                                    }}
                                  ></div>
                                </div>
                                <span className="cell-reg-ratio" style={{ fontSize: '0.82rem' }}>
                                  {getEventRegCount(evt)} / {evt.capacity || 100}
                                </span>
                              </div>
                            </td>
                            <td>
                              <span
                                className={`status-pill ${evt.status === 'upcoming' ? 'active' : 'draft'
                                  }`}
                              >
                                {evt.status === 'upcoming' ? 'Upcoming' : 'Past'}
                              </span>
                            </td>
                            <td>
                              <div className="action-buttons-group">
                                <button
                                  className="icon-btn-action"
                                  title="View Details"
                                  onClick={() =>
                                    showToast && showToast(`Viewing "${evt.title}"`, 'info')
                                  }
                                >
                                  <i className="fa-regular fa-eye"></i>
                                </button>
                                <button
                                  className="icon-btn-action"
                                  title="Edit Event & Upload Photos"
                                  onClick={() => setEditingEvent(evt)}
                                >
                                  <i className="fa-regular fa-pen-to-square"></i>
                                </button>
                                <button
                                  className="icon-btn-action"
                                  title="Duplicate Event"
                                  onClick={() => handleDuplicateEvent(evt)}
                                >
                                  <i className="fa-regular fa-copy"></i>
                                </button>
                                <button
                                  className="icon-btn-action danger"
                                  title="Delete Event"
                                  onClick={() => handleDeleteEvent(evt._id, evt.title)}
                                >
                                  <i className="fa-regular fa-trash-can"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Table Pagination Bar */}
                <div className="table-pagination-bar">
                  <span className="pagination-info">
                    Showing 1 to {displayedEvents.length} of {events.length} results
                  </span>
                  <div className="pagination-controls">
                    <button className="page-nav-btn disabled">Previous</button>
                    <button className="page-num-btn active">1</button>
                    <button className="page-num-btn">2</button>
                    <button className="page-num-btn">3</button>
                    <button className="page-nav-btn">Next</button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* VIEW 4: MAIN DASHBOARD VIEW */
            <div>
              <div className="admin-dashboard-title-row">
                <div>
                  <h1 className="admin-page-title">Event Management Dashboard</h1>
                </div>
                <div className="last-updated-text">
                  Last updated: Today, {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

              {/* 4 Stat Cards Row */}
              <div className="admin-stats-grid">
                <div className="stat-card">
                  <div className="stat-info">
                    <span className="stat-label">Total Events</span>
                    <div className="stat-value">{totalEventsCount}</div>
                    <div className="stat-trend positive">
                      <i className="fa-solid fa-arrow-trend-up"></i> +5% this month
                    </div>
                  </div>
                  <div className="stat-icon-wrapper">
                    <i className="fa-regular fa-calendar"></i>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-info">
                    <span className="stat-label">Upcoming Events</span>
                    <div className="stat-value">{upcomingCount}</div>
                    <div className="stat-trend neutral">Next event in 3 days</div>
                  </div>
                  <div className="stat-icon-wrapper">
                    <i className="fa-regular fa-calendar-check"></i>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-info">
                    <span className="stat-label">Past Events</span>
                    <div className="stat-value">{pastCount}</div>
                    <div className="stat-trend neutral">All completed successfully</div>
                  </div>
                  <div className="stat-icon-wrapper">
                    <i className="fa-solid fa-clock-rotate-left"></i>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-info">
                    <span className="stat-label">Total Registrations</span>
                    <div className="stat-value">{totalRegsCount.toLocaleString()}</div>
                    <div className="stat-trend positive">
                      <i className="fa-solid fa-arrow-trend-up"></i> +12% this month
                    </div>
                  </div>
                  <div className="stat-icon-wrapper">
                    <i className="fa-solid fa-user-group"></i>
                  </div>
                </div>
              </div>

              {/* Middle Row (2 Columns) */}
              <div className="admin-middle-grid">
                {/* Left Box: Upcoming Events Table */}
                <div className="admin-card-panel">
                  <div className="panel-header-row">
                    <h3>Upcoming Events</h3>
                    <button
                      className="btn-link-view-all"
                      onClick={() => {
                        setActiveMenu('events');
                        setEventTab('upcoming');
                      }}
                    >
                      View All <i className="fa-solid fa-arrow-right"></i>
                    </button>
                  </div>

                  <div className="table-responsive-wrapper">
                    <table className="admin-data-table">
                      <thead>
                        <tr>
                          <th>EVENT</th>
                          <th>DATE</th>
                          <th>LOCATION</th>
                          <th>REGISTRATIONS</th>
                          <th>STATUS</th>
                          <th>ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {upcomingEvents.slice(0, 4).map((evt, idx) => (
                          <tr key={evt._id || idx}>
                            <td>
                              <div className="event-table-cell">
                                <img
                                  src={
                                    evt.coverImage ||
                                    'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=300&q=80'
                                  }
                                  alt={evt.title}
                                  className="event-thumb"
                                />
                                <div>
                                  <div className="event-cell-title">{evt.title}</div>
                                  <span className="event-cell-id">ID: EVT-{(evt._id || '9824').toString().slice(-4).toUpperCase()}</span>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className="cell-date-text">
                                {new Date(evt.date).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </span>
                            </td>
                            <td>
                              <span className="cell-location-text">{evt.location}</span>
                            </td>
                            <td>
                              <span className="cell-reg-ratio">
                                {getEventRegCount(evt)} / {evt.capacity || 100}
                              </span>
                            </td>
                            <td>
                              <span className="status-pill active">Active</span>
                            </td>
                            <td>
                              <div className="action-buttons-group">
                                <button
                                  className="icon-btn-action"
                                  title="Edit Event"
                                  onClick={() => setEditingEvent(evt)}
                                >
                                  <i className="fa-regular fa-pen-to-square"></i>
                                </button>
                                <button
                                  className="icon-btn-action danger"
                                  title="Delete Event"
                                  onClick={() => handleDeleteEvent(evt._id, evt.title)}
                                >
                                  <i className="fa-regular fa-trash-can"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Right Box: Registrations Overview */}
                <div className="admin-card-panel">
                  <div className="panel-header-row">
                    <div>
                      <h3>Registrations Overview</h3>
                      <span className="panel-subtext">Top Events by Registration</span>
                    </div>
                  </div>

                  <div className="overview-progress-list">
                    <div className="progress-item-box">
                      <div className="progress-label-row">
                        <span>Tech Symposium 2024</span>
                        <strong>345</strong>
                      </div>
                      <div className="progress-bar-track">
                        <div className="progress-fill fill-blue" style={{ width: '70%' }}></div>
                      </div>
                    </div>

                    <div className="progress-item-box">
                      <div className="progress-label-row">
                        <span>Design Patterns Meetup</span>
                        <strong>120</strong>
                      </div>
                      <div className="progress-bar-track">
                        <div className="progress-fill fill-teal" style={{ width: '40%' }}></div>
                      </div>
                    </div>

                    <div className="progress-item-box">
                      <div className="progress-label-row">
                        <span>Leadership Workshop</span>
                        <strong>45</strong>
                      </div>
                      <div className="progress-bar-track">
                        <div className="progress-fill fill-slate" style={{ width: '22%' }}></div>
                      </div>
                    </div>

                    <div className="progress-item-box">
                      <div className="progress-label-row">
                        <span>Marketing Summit</span>
                        <strong>28</strong>
                      </div>
                      <div className="progress-bar-track">
                        <div className="progress-fill fill-slate" style={{ width: '15%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Row: Recent Registrations Table */}
              <div className="admin-card-panel" style={{ marginTop: '1.75rem' }}>
                <div className="panel-header-row">
                  <h3>Recent Registrations</h3>
                  <button
                    className="btn-link-view-all"
                    onClick={() => setActiveMenu('registrations')}
                  >
                    View All <i className="fa-solid fa-arrow-right"></i>
                  </button>
                </div>

                <div className="table-responsive-wrapper">
                  <table className="admin-data-table">
                    <thead>
                      <tr>
                        <th>NAME</th>
                        <th>EMAIL</th>
                        <th>EVENT</th>
                        <th>REGISTRATION DATE</th>
                        <th>STATUS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayedRegistrations.slice(0, 6).map((reg, idx) => (
                        <tr key={reg._id || idx} style={{ cursor: 'pointer' }} onClick={() => { setActiveMenu('registrations'); setSelectedReg(reg); }}>
                          <td>
                            <strong className="registrant-name">{reg.name}</strong>
                          </td>
                          <td>
                            <span className="registrant-email">{reg.email}</span>
                          </td>
                          <td>
                            <span className="cell-event-title">{reg.eventTitle || 'Tech Summit 2024'}</span>
                          </td>
                          <td>
                            <span className="cell-date-text">
                              {reg.createdAt
                                ? new Date(reg.createdAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                                : 'Today, 08:30 AM'}
                            </span>
                          </td>
                          <td onClick={(e) => e.stopPropagation()}>
                            <select
                              className="status-pill-select"
                              value={reg.status || 'Confirmed'}
                              onChange={(e) => handleDirectStatusChange(reg._id, e.target.value)}
                              style={{
                                padding: '4px 12px',
                                borderRadius: '9999px',
                                fontSize: '0.82rem',
                                fontWeight: '700',
                                border: '1px solid transparent',
                                cursor: 'pointer',
                                outline: 'none',
                                backgroundColor: (reg.status || 'Confirmed') === 'Confirmed' ? '#dcfce7' : (reg.status || 'Confirmed') === 'Pending' ? '#fef3c7' : '#fee2e2',
                                color: (reg.status || 'Confirmed') === 'Confirmed' ? '#15803d' : (reg.status || 'Confirmed') === 'Pending' ? '#b45309' : '#b91c1c'
                              }}
                            >
                              <option value="Confirmed" style={{ background: '#fff', color: '#0f172a' }}>Confirmed</option>
                              <option value="Pending" style={{ background: '#fff', color: '#0f172a' }}>Pending</option>
                              <option value="Cancelled" style={{ background: '#fff', color: '#0f172a' }}>Cancelled</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* REGISTRATION DETAILS SLIDE-OVER DRAWER (Matching exact reference screenshot) */}
      {selectedReg && (
        <div className="drawer-backdrop" onClick={() => setSelectedReg(null)}>
          <aside className="registration-details-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <h2>Registration Details</h2>
              <button className="btn-close-drawer" onClick={() => setSelectedReg(null)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="drawer-body-content">
              {/* User Avatar & Name Section */}
              <div className="drawer-user-section">
                <div className="drawer-avatar-circle">
                  {getInitials(selectedReg.name)}
                </div>
                <div>
                  <h3 className="drawer-user-name">{selectedReg.name}</h3>
                  <p className="drawer-user-role">Senior Developer at Corp Inc.</p>
                </div>
              </div>

              {/* CURRENT STATUS Box */}
              <div className="drawer-status-card">
                <div className="drawer-status-header">
                  <span className="drawer-section-label">CURRENT STATUS</span>
                  <button
                    type="button"
                    className="btn-change-status-link"
                    onClick={() => setIsChangingStatus(!isChangingStatus)}
                  >
                    Change
                  </button>
                </div>

                {isChangingStatus ? (
                  <select
                    className="drawer-status-select"
                    value={editingRegStatus}
                    onChange={(e) => setEditingRegStatus(e.target.value)}
                  >
                    <option value="Confirmed">Confirmed</option>
                    <option value="Pending">Pending</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                ) : (
                  <div className="current-status-value">
                    <span
                      className={`status-indicator-dot ${editingRegStatus === 'Confirmed'
                          ? 'dot-confirmed'
                          : editingRegStatus === 'Pending'
                            ? 'dot-pending'
                            : 'dot-cancelled'
                        }`}
                    ></span>
                    <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>{editingRegStatus}</strong>
                  </div>
                )}
              </div>

              {/* EVENT INFORMATION */}
              <div className="drawer-section-group">
                <span className="drawer-section-label">EVENT INFORMATION</span>

                <div className="drawer-info-row">
                  <span className="info-key">Event Name</span>
                  <div className="info-val-strong">{selectedReg.eventTitle || 'Tech Summit 2024'}</div>
                </div>

                <div className="drawer-info-row">
                  <span className="info-key">Registration Date</span>
                  <div className="info-val-muted">
                    {selectedReg.createdAt
                      ? new Date(selectedReg.createdAt).toLocaleString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                      : 'October 24, 2023 at 10:45 AM'}
                  </div>
                </div>
              </div>

              {/* CONTACT DETAILS */}
              <div className="drawer-section-group">
                <span className="drawer-section-label">CONTACT DETAILS</span>

                <div className="drawer-info-row">
                  <span className="info-key">Email Address</span>
                  <div className="info-val-copy">
                    <span>{selectedReg.email}</span>
                    <button
                      type="button"
                      className="btn-copy-icon"
                      onClick={() => copyToClipboard(selectedReg.email)}
                      title="Copy Email"
                    >
                      <i className="fa-regular fa-copy"></i>
                    </button>
                  </div>
                </div>

                <div className="drawer-info-row">
                  <span className="info-key">Phone Number</span>
                  <div className="info-val-muted">{selectedReg.contactNumber || '+94 77 123 4567'}</div>
                </div>
              </div>

              {/* ADMIN NOTES */}
              <div className="drawer-section-group">
                <div className="drawer-notes-header">
                  <span className="drawer-section-label">ADMIN NOTES</span>
                  <button
                    type="button"
                    className="btn-edit-note-link"
                    onClick={() => setIsEditingNotes(!isEditingNotes)}
                  >
                    <i className="fa-regular fa-pen-to-square"></i> Edit Note
                  </button>
                </div>

                {isEditingNotes ? (
                  <textarea
                    rows="3"
                    className="drawer-notes-textarea"
                    value={editingRegNotes}
                    onChange={(e) => setEditingRegNotes(e.target.value)}
                  ></textarea>
                ) : (
                  <div className="drawer-notes-box">
                    <p>"{editingRegNotes}"</p>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Footer Actions */}
            <div className="drawer-footer-actions">
              <button
                type="button"
                className="btn-drawer-resend"
                onClick={() =>
                  showToast &&
                  showToast(`Resent ticket confirmation to ${selectedReg.email}`, 'success')
                }
              >
                Resend Ticket
              </button>

              <button
                type="button"
                className="btn-drawer-save"
                onClick={handleSaveRegistrationChanges}
                disabled={savingReg}
              >
                {savingReg ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin"></i> Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Edit Event Modal */}
      <EditEventModal
        isOpen={Boolean(editingEvent)}
        onClose={() => setEditingEvent(null)}
        event={editingEvent}
        onEventUpdated={fetchDashboardData}
        showToast={showToast}
      />

      {/* Add / Edit Venue Modal */}
      <AddVenueModal
        isOpen={showAddVenueModal || Boolean(editingVenue)}
        onClose={() => {
          setShowAddVenueModal(false);
          setEditingVenue(null);
        }}
        editingVenue={editingVenue}
        onVenueCreated={(newVenue) => {
          setVenues((prev) => [newVenue, ...prev]);
          fetchDashboardData();
        }}
        onVenueUpdated={(updatedVenue) => {
          setVenues((prev) =>
            prev.map((v) =>
              (v._id || v.id) === (updatedVenue._id || updatedVenue.id) ? updatedVenue : v
            )
          );
          fetchDashboardData();
        }}
        showToast={showToast}
      />
      {/* Assign Branch Admin Modal */}
      {showAddBranchAdminModal && (
        <div className="modal-overlay" onClick={() => setShowAddBranchAdminModal(false)}>
          <div
            className="modal-card admin-card"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '640px', padding: '2rem' }}
          >
            <button className="modal-close" onClick={() => setShowAddBranchAdminModal(false)}>
              <i className="fa-solid fa-xmark"></i>
            </button>

            <div className="modal-header" style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fa-solid fa-user-shield" style={{ color: '#5d4df6' }}></i>
                Assign Branch Admin & Grant Access
              </h2>
              <p className="modal-sub">
                Assign an admin for a specific TRACE branch. Credentials and assigned permissions will be dispatched to their email inbox automatically.
              </p>
            </div>

            <form onSubmit={handleCreateBranchAdmin}>
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label>Branch Admin Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kasun Perera"
                  value={branchAdminForm.name}
                  onChange={(e) => setBranchAdminForm({ ...branchAdminForm, name: e.target.value })}
                />
              </div>

              <div className="form-row" style={{ marginBottom: '1.25rem' }}>
                <div className="form-group">
                  <label>Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="kasun@trace.lk"
                    value={branchAdminForm.email}
                    onChange={(e) => setBranchAdminForm({ ...branchAdminForm, email: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Assign Temporary Password *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BranchAdmin@2026"
                    value={branchAdminForm.password}
                    onChange={(e) => setBranchAdminForm({ ...branchAdminForm, password: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label>Assigned TRACE Branch / Hub *</label>
                <select
                  value={branchAdminForm.branch}
                  onChange={(e) => setBranchAdminForm({ ...branchAdminForm, branch: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: '600' }}
                >
                  <option value="TRACE Expert City (Colombo)">🏢 TRACE Expert City (Colombo Hub)</option>
                  <option value="CodeGen Branch (Bay 01-04)">💻 CodeGen Branch (Bay 01-04)</option>
                  <option value="LSEG Sri Lanka Branch (Bay 11-12)">📈 LSEG Branch (Bay 11-12)</option>
                  <option value="TRACE Innovation Hub (Kandy)">🏔️ TRACE Innovation Hub (Kandy)</option>
                  <option value="TRACE Coastal Hub (Galle)">🏖️ TRACE Coastal Hub (Galle)</option>
                  <option value="TRACE Tech Park (Jaffna)">🌴 TRACE Tech Park (Jaffna)</option>
                  <option value="TRACE Wayamba Incubator (Kurunegala)">🌾 TRACE Wayamba Incubator</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label style={{ marginBottom: '0.5rem', display: 'block' }}>Granted Permissions & Control Scope</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', background: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  {[
                    { id: 'manage_events', label: '📅 Create & Edit Branch Events' },
                    { id: 'manage_registrations', label: '👥 Manage Participant Registrations' },
                    { id: 'manage_spaces', label: '🏢 Manage Branch Spaces & Inquiries' },
                    { id: 'view_analytics', label: '📊 View Analytics & Reports' },
                  ].map((perm) => (
                    <label key={perm.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: '600', color: '#334155', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={branchAdminForm.permissions.includes(perm.id)}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setBranchAdminForm((prev) => ({
                            ...prev,
                            permissions: checked
                              ? [...prev.permissions, perm.id]
                              : prev.permissions.filter((p) => p !== perm.id),
                          }));
                        }}
                        style={{ accentColor: '#5d4df6', width: '16px', height: '16px' }}
                      />
                      {perm.label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowAddBranchAdminModal(false)}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ backgroundColor: '#5d4df6', display: 'flex', alignItems: 'center', gap: '6px' }}
                  disabled={submittingBranchAdmin}
                >
                  {submittingBranchAdmin ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin"></i> Assigning & Sending Mail...
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-paper-plane"></i> Assign & Dispatch Credentials Email
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Administrator Account Details Modal (Admins Only) */}
      {editingAdminUser && (
        <div className="modal-overlay" onClick={() => setEditingAdminUser(null)}>
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '620px', padding: '2rem', borderRadius: '16px' }}
          >
            <button className="modal-close" onClick={() => setEditingAdminUser(null)}>
              <i className="fa-solid fa-xmark"></i>
            </button>

            <div className="modal-header" style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fa-solid fa-user-pen" style={{ color: '#5d4df6' }}></i>
                Edit Administrator Details & Avatar
              </h2>
              <p className="modal-sub">
                Update account name, assigned TRACE branch, Granted Permissions, and profile avatar photo for <strong style={{ color: '#5d4df6' }}>{editingAdminUser.email}</strong>.
              </p>
            </div>

            <form onSubmit={handleSaveAdminEdit}>
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label style={{ marginBottom: '0.35rem', display: 'block', fontWeight: '700', fontSize: '0.85rem' }}>
                  Administrator Email (Account Identifier)
                </label>
                <input
                  type="email"
                  value={editingAdminUser.email}
                  disabled
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f1f5f9', color: '#64748b', fontWeight: '600' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label style={{ marginBottom: '0.35rem', display: 'block', fontWeight: '700', fontSize: '0.85rem' }}>
                  Administrator Full Name
                </label>
                <input
                  type="text"
                  required
                  value={editingAdminForm.name}
                  onChange={(e) => setEditingAdminForm({ ...editingAdminForm, name: e.target.value })}
                  placeholder="e.g. Kasun Kalhara"
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label style={{ marginBottom: '0.35rem', display: 'block', fontWeight: '700', fontSize: '0.85rem' }}>
                  Assigned TRACE Branch Location
                </label>
                <select
                  value={editingAdminForm.branch}
                  onChange={(e) => setEditingAdminForm({ ...editingAdminForm, branch: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff' }}
                >
                  <option value="TRACE Expert City (Colombo)">🏢 TRACE Expert City (Colombo)</option>
                  <option value="TRACE Main Branch (Colombo)">🏛️ TRACE Main Branch (Colombo)</option>
                  <option value="CodeGen Hub (Bay 1-5)">⚡ CodeGen Hub (Bay 1-5)</option>
                  <option value="LSEG Sri Lanka Branch (Bay 11-12)">📈 LSEG Branch (Bay 11-12)</option>
                  <option value="TRACE Innovation Hub (Kandy)">🏔️ TRACE Innovation Hub (Kandy)</option>
                  <option value="TRACE Coastal Hub (Galle)">🏖️ TRACE Coastal Hub (Galle)</option>
                  <option value="TRACE Tech Park (Jaffna)">🌴 TRACE Tech Park (Jaffna)</option>
                  <option value="TRACE Wayamba Incubator (Kurunegala)">🌾 TRACE Wayamba Incubator</option>
                </select>
              </div>

              {/* Avatar Photo Upload & URL */}
              <div className="form-group" style={{ marginBottom: '1.25rem', background: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <label style={{ marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700', fontSize: '0.85rem', color: '#0f172a' }}>
                  <i className="fa-solid fa-camera" style={{ color: '#5d4df6' }}></i>
                  Admin Avatar Photo (Upload or Image URL)
                </label>

                {editingAdminForm.avatar && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                    <img
                      src={editingAdminForm.avatar}
                      alt="Admin Avatar Preview"
                      style={{ width: '54px', height: '54px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #5d4df6' }}
                    />
                    <div>
                      <span style={{ fontSize: '0.78rem', color: '#059669', fontWeight: '700', display: 'block' }}>✓ Current Avatar Loaded</span>
                      <button
                        type="button"
                        onClick={() => setEditingAdminForm({ ...editingAdminForm, avatar: '' })}
                        style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.78rem', cursor: 'pointer', padding: 0 }}
                      >
                        Remove Photo
                      </button>
                    </div>
                  </div>
                )}

                <CloudinaryUploader
                  accept="image/*"
                  label="Upload New Admin Photo to Cloudinary"
                  onUploadSuccess={(url) => setEditingAdminForm({ ...editingAdminForm, avatar: url })}
                />

                <div style={{ marginTop: '0.5rem' }}>
                  <label style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '0.25rem', display: 'block' }}>Or Paste Image URL directly:</label>
                  <input
                    type="text"
                    value={editingAdminForm.avatar}
                    onChange={(e) => setEditingAdminForm({ ...editingAdminForm, avatar: e.target.value })}
                    placeholder="https://images.unsplash.com/... or Cloudinary URL"
                    style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                  />
                </div>
              </div>

              {/* Granted Permissions */}
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label style={{ marginBottom: '0.5rem', display: 'block', fontWeight: '700', fontSize: '0.85rem' }}>Granted Permissions & Scope</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', background: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  {[
                    { id: 'manage_events', label: '📅 Create & Edit Branch Events' },
                    { id: 'manage_registrations', label: '👥 Manage Participant Registrations' },
                    { id: 'manage_spaces', label: '🏢 Manage Branch Spaces & Inquiries' },
                    { id: 'view_analytics', label: '📊 View Analytics & Reports' },
                  ].map((perm) => (
                    <label key={perm.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: '600', color: '#334155', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={editingAdminForm.permissions.includes(perm.id)}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setEditingAdminForm((prev) => ({
                            ...prev,
                            permissions: checked
                              ? [...prev.permissions, perm.id]
                              : prev.permissions.filter((p) => p !== perm.id),
                          }));
                        }}
                        style={{ accentColor: '#5d4df6', width: '16px', height: '16px' }}
                      />
                      {perm.label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setEditingAdminUser(null)}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ backgroundColor: '#5d4df6', display: 'flex', alignItems: 'center', gap: '6px' }}
                  disabled={savingAdminEdit}
                >
                  {savingAdminEdit ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin"></i> Saving Changes...
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-floppy-disk"></i> Save Admin Details & Photo
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Email Credentials Dispatch Notification Preview Modal */}
      {emailNotificationModalData && (
        <div className="modal-overlay" onClick={() => setEmailNotificationModalData(null)}>
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '580px', padding: '2rem', borderRadius: '16px' }}
          >
            <button className="modal-close" onClick={() => setEmailNotificationModalData(null)}>
              <i className="fa-solid fa-xmark"></i>
            </button>

            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#dcfce7', color: '#16a34a', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', marginBottom: '0.75rem' }}>
                <i className="fa-solid fa-envelope-circle-check"></i>
              </div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                Email Notification Dispatched Successfully!
              </h2>
              <p style={{ fontSize: '0.86rem', color: '#64748b', marginTop: '0.25rem' }}>
                A confirmation email with login credentials and permissions has been sent to the branch admin's inbox.
              </p>
            </div>

            {/* Email Card Graphic */}
            <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 14px rgba(0,0,0,0.06)', marginBottom: '1.5rem' }}>
              <div style={{ background: '#0f172a', color: '#ffffff', padding: '0.85rem 1.25rem', fontSize: '0.88rem', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span><i className="fa-solid fa-envelope" style={{ marginRight: '6px', color: '#38bdf8' }}></i> {emailNotificationModalData.subject}</span>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Sent Just Now</span>
              </div>

              <div style={{ padding: '1.25rem', fontSize: '0.88rem', color: '#334155', lineHeight: 1.6 }}>
                <div style={{ marginBottom: '0.75rem' }}>
                  Hello <strong>{emailNotificationModalData.adminName}</strong>,
                </div>
                <p style={{ margin: '0 0 1rem 0' }}>
                  You have been granted <strong>Branch Admin Access</strong> for <strong>{emailNotificationModalData.branchName}</strong> on the TRACE Event Hub platform.
                </p>

                <div style={{ background: '#f8fafc', border: '1px border-dashed #cbd5e1', borderRadius: '8px', padding: '0.85rem 1rem', marginBottom: '1rem' }}>
                  <div style={{ marginBottom: '0.35rem' }}>📧 <strong>Login Email:</strong> <span style={{ color: '#5d4df6', fontWeight: '600' }}>{emailNotificationModalData.email}</span></div>
                  <div style={{ marginBottom: '0.35rem' }}>🔑 <strong>Temporary Password:</strong> <code style={{ background: '#e2e8f0', padding: '2px 6px', borderRadius: '4px', color: '#0f172a' }}>{emailNotificationModalData.temporaryPassword}</code></div>
                  <div>🏢 <strong>Assigned Branch:</strong> {emailNotificationModalData.branchName}</div>
                </div>

                <div style={{ marginBottom: '0.75rem' }}>
                  <strong>Granted Permissions:</strong>
                  <ul style={{ margin: '0.35rem 0 0 1.2rem', padding: 0, fontSize: '0.84rem' }}>
                    {emailNotificationModalData.grantedPermissions.map((p, idx) => (
                      <li key={idx} style={{ color: '#059669', fontWeight: '600' }}>✓ {p.replace('_', ' ').toUpperCase()}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-primary"
              style={{ width: '100%', backgroundColor: '#5d4df6', fontWeight: '700' }}
              onClick={() => setEmailNotificationModalData(null)}
            >
              Done & Close Preview
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
