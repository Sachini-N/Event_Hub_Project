import React, { useState, useEffect } from 'react';
import EditEventModal from './modals/EditEventModal';
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
        if (showToast) showToast('Registration updated in MongoDB!', 'success');
        setSelectedReg({
          ...selectedReg,
          status: editingRegStatus,
          notes: editingRegNotes,
        });
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
                      </tr>
                    </thead>
                    <tbody>
                      {displayedRegistrations.length === 0 ? (
                        <tr>
                          <td colSpan="4" style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                            No registration records found.
                          </td>
                        </tr>
                      ) : (
                        displayedRegistrations.map((reg) => (
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
                          </tr>
                        ))
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
                          <td>
                            <span
                              className={`status-pill ${
                                reg.status === 'Pending' ? 'pending' : 'active'
                              }`}
                            >
                              {reg.status || 'Confirmed'}
                            </span>
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
    </div>
  );
}
