import React, { useState, useEffect } from 'react';
import EditEventModal from './modals/EditEventModal';
import AddVenueModal from './modals/AddVenueModal';
import CreateEventPage from './CreateEventPage';

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

  // Speakers State
  const [speakers, setSpeakers] = useState([
    {
      id: 1,
      name: 'Dr. Aris Thorne',
      role: 'Chief AI Architect',
      organization: 'TRACE AI Research',
      email: 'aris.thorne@trace.lk',
      eventsCount: 4,
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
      bio: 'Leading researcher in AI systems, multi-agent frameworks, and scalable machine learning infrastructure.',
    },
    {
      id: 2,
      name: 'Elena Rostova',
      role: 'Cloud & DevOps Lead',
      organization: 'CloudScale Asia',
      email: 'elena.r@cloudscale.io',
      eventsCount: 3,
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=300&q=80',
      bio: 'Specialist in cloud-native microservices, Kubernetes orchestration, and high-availability enterprise clusters.',
    },
    {
      id: 3,
      name: 'Kavinda Perera',
      role: 'Ecosystem Partner',
      organization: 'TRACE Sri Lanka',
      email: 'kavinda.p@trace.lk',
      eventsCount: 6,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
      bio: 'Fostering tech ecosystem growth, venture incubation, and industry-university collaborative innovation.',
    },
    {
      id: 4,
      name: 'Amaya Silva',
      role: 'Lead Tech Strategist',
      organization: 'Innovation Hub',
      email: 'amaya.s@innovate.lk',
      eventsCount: 2,
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80',
      bio: 'Guiding digital transformation strategies for tech startups and enterprise innovation leaders in Sri Lanka.',
    },
  ]);

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
  const totalRegsCount = registrations.length || 1284;
  const confirmedRegsCount = registrations.filter((r) => r.status === 'Confirmed').length || 1150;

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

  const isEventsView = activeMenu === 'events' || activeMenu === 'upcoming' || activeMenu === 'past';

  return (
    <div className="admin-dashboard-layout">
      {/* Left Sidebar */}
      <aside className="admin-sidebar">
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
            <i className="fa-solid fa-users-gear"></i> Registrations
          </button>
          <button
            className={`admin-nav-item ${activeMenu === 'speakers' ? 'active' : ''}`}
            onClick={() => setActiveMenu('speakers')}
          >
            <i className="fa-solid fa-user-tie"></i> Speakers
          </button>
          <button
            className={`admin-nav-item ${activeMenu === 'venues' ? 'active' : ''}`}
            onClick={() => setActiveMenu('venues')}
          >
            <i className="fa-solid fa-location-dot"></i> Venues
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0052cc' }}>TRACE Event Hub</span>
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

          <div className="admin-top-actions">
            <div className="admin-profile-badge">
              <img
                src={
                  (currentUser?.avatar && currentUser.avatar.trim() !== '')
                    ? currentUser.avatar
                    : `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.name || 'Admin')}&background=0052cc&color=fff&size=100`
                }
                alt={currentUser?.name}
              />
            </div>
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
                              className={`reg-row-clickable ${
                                selectedReg?._id === reg._id ? 'selected-row' : ''
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
          ) : activeMenu === 'speakers' ? (
            /* VIEW: SPEAKERS DIRECTORY VIEW */
            <div className="manage-speakers-container">
              <div className="admin-dashboard-title-row">
                <div>
                  <h1 className="admin-page-title">Speakers Directory</h1>
                  <p style={{ fontSize: '0.95rem', color: '#64748b', marginTop: '0.2rem' }}>
                    Manage event speakers, keynote presenters, and bio profiles.
                  </p>
                </div>
                <button
                  className="btn-create-event-blue"
                  onClick={() => {
                    const name = prompt('Enter Speaker Name:');
                    if (name) {
                      const newSpk = {
                        id: Date.now(),
                        name,
                        role: 'Keynote Speaker',
                        organization: 'TRACE Tech Network',
                        email: `${name.toLowerCase().replace(/\s+/g, '.')}@trace.lk`,
                        eventsCount: 1,
                        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0052cc&color=fff&size=100`,
                        bio: 'Featured speaker on technology innovation and enterprise software development.',
                      };
                      setSpeakers([newSpk, ...speakers]);
                      if (showToast) showToast(`Added speaker "${name}" successfully!`, 'success');
                    }
                  }}
                >
                  <i className="fa-solid fa-plus"></i> Add New Speaker
                </button>
              </div>

              {/* Speakers Cards Grid */}
              <div className="speakers-grid-3col">
                {speakers.map((spk) => (
                  <div key={spk.id} className="speaker-card">
                    <div>
                      <div className="speaker-card-header">
                        <img src={spk.avatar} alt={spk.name} className="speaker-avatar-img" />
                        <div>
                          <h3 className="speaker-info-title">{spk.name}</h3>
                          <div className="speaker-info-role">{spk.role}</div>
                          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{spk.organization}</div>
                        </div>
                      </div>
                      <p className="speaker-bio-text">{spk.bio}</p>
                    </div>

                    <div className="speaker-card-footer">
                      <span><i className="fa-regular fa-calendar-check"></i> {spk.eventsCount} Events</span>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          className="icon-btn-action"
                          title="Email Speaker"
                          onClick={() => copyToClipboard(spk.email)}
                        >
                          <i className="fa-regular fa-envelope"></i>
                        </button>
                        <button
                          className="icon-btn-action danger"
                          title="Remove Speaker"
                          onClick={() => {
                            if (window.confirm(`Remove ${spk.name} from directory?`)) {
                              setSpeakers(speakers.filter((s) => s.id !== spk.id));
                              if (showToast) showToast(`Removed ${spk.name}`, 'info');
                            }
                          }}
                        >
                          <i className="fa-regular fa-trash-can"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : activeMenu === 'venues' ? (
            /* VIEW: VENUES MANAGEMENT VIEW */
            <div className="manage-venues-container">
              <div className="admin-dashboard-title-row">
                <div>
                  <h1 className="admin-page-title">Venues & Facilities</h1>
                  <p style={{ fontSize: '0.95rem', color: '#64748b', marginTop: '0.2rem' }}>
                    Manage event spaces, seating capacity, and hall reservations.
                  </p>
                </div>
                <button
                  className="btn-create-event-blue"
                  onClick={() => setShowAddVenueModal(true)}
                >
                  <i className="fa-solid fa-plus"></i> Add New Venue
                </button>
              </div>

              {/* Venues Grid */}
              <div className="venues-grid-2col">
                {venues.map((v) => (
                  <div key={v.id} className="venue-card">
                    <img src={v.coverImage} alt={v.name} className="venue-card-banner" />
                    <div className="venue-card-body">
                      <span className={`venue-tag-badge ${v.status === 'Available' ? 'venue-tag-available' : 'venue-tag-reserved'}`}>
                        ● {v.status}
                      </span>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#0f172a', marginBottom: '0.2rem' }}>
                        {v.name}
                      </h3>
                      <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.75rem' }}>
                        <i className="fa-solid fa-location-dot" style={{ color: '#0052cc' }}></i> {v.address}
                      </p>

                      <div style={{ fontSize: '0.88rem', fontWeight: '600', color: '#334155', marginBottom: '0.5rem' }}>
                        <i className="fa-solid fa-users"></i> Seating Capacity: <strong>{v.capacity} Seats</strong>
                      </div>

                      <div className="venue-amenities-tags">
                        {v.amenities.map((am, i) => (
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
                          className="icon-btn-action danger"
                          onClick={() => {
                            if (window.confirm(`Delete venue "${v.name}"?`)) {
                              setVenues(venues.filter((item) => item.id !== v.id));
                              if (showToast) showToast(`Deleted venue "${v.name}"`, 'info');
                            }
                          }}
                        >
                          <i className="fa-regular fa-trash-can"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
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
                      style={{ width: '18px', height: '18px', accentColor: '#0052cc' }}
                    />
                    Send automatic email confirmation with QR pass upon user registration.
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', fontSize: '0.92rem', color: '#334155' }}>
                    <input
                      type="checkbox"
                      checked={settingsForm.smsReminders}
                      onChange={(e) => setSettingsForm({ ...settingsForm, smsReminders: e.target.checked })}
                      style={{ width: '18px', height: '18px', accentColor: '#0052cc' }}
                    />
                    Send automated event reminder 24 hours prior to event start.
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', fontSize: '0.92rem', color: '#334155' }}>
                    <input
                      type="checkbox"
                      checked={settingsForm.adminDigest}
                      onChange={(e) => setSettingsForm({ ...settingsForm, adminDigest: e.target.checked })}
                      style={{ width: '18px', height: '18px', accentColor: '#0052cc' }}
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
                    style={{ width: '18px', height: '18px', accentColor: '#0052cc' }}
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
                                    className={`progress-fill ${
                                      evt.status === 'upcoming' ? 'fill-blue' : 'fill-slate'
                                    }`}
                                    style={{
                                      width: `${Math.min(
                                        100,
                                        ((evt.registeredCount || 0) / (evt.capacity || 100)) * 100
                                      )}%`,
                                    }}
                                  ></div>
                                </div>
                                <span className="cell-reg-ratio" style={{ fontSize: '0.82rem' }}>
                                  {evt.registeredCount || 0} / {evt.capacity || 100}
                                </span>
                              </div>
                            </td>
                            <td>
                              <span
                                className={`status-pill ${
                                  evt.status === 'upcoming' ? 'active' : 'draft'
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
                                {evt.registeredCount || 0} / {evt.capacity || 100}
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
                      className={`status-indicator-dot ${
                        editingRegStatus === 'Confirmed'
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

      {/* Add Venue Modal */}
      <AddVenueModal
        isOpen={showAddVenueModal}
        onClose={() => setShowAddVenueModal(false)}
        onVenueCreated={(newVenue) => {
          setVenues([newVenue, ...venues]);
          fetchDashboardData();
        }}
        showToast={showToast}
      />
    </div>
  );
}
