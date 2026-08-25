import React, { useState } from 'react';

export default function Navbar({
  activeTab,
  setActiveTab,
  scrollToHero,
  scrollToEvents,
  focusSearch,
  currentUser,
  logout,
  openLoginModal,
  openSignupModal,
  openAdminModal,
  openMyRegistrationsModal,
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMobile = () => setMobileMenuOpen(false);

  return (
    <header className="navbar">
      <div className="nav-container">
        <div className="brand" onClick={() => { scrollToHero(); closeMobile(); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <span className="logo-text" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <img src="/trace-logo.png" alt="TRACE" className="trace-logo-img" />
            <span className="logo-tracker-sub">Spaces Tracker</span>
          </span>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          type="button"
          className="mobile-hamburger-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle Navigation Menu"
        >
          <i className={`fa-solid ${mobileMenuOpen ? 'fa-xmark' : 'fa-bars'}`}></i>
        </button>

        {/* Desktop Navigation Links */}
        <nav className={`nav-links ${mobileMenuOpen ? 'mobile-open' : ''}`}>
          <button
            className={`nav-link ${activeTab === 'home' ? 'active' : ''}`}
            onClick={() => { scrollToHero(); closeMobile(); }}
          >
            Home
          </button>
          <button
            className={`nav-link ${activeTab === 'upcoming' ? 'active' : ''}`}
            onClick={() => { scrollToEvents('upcoming'); closeMobile(); }}
          >
            Upcoming Events
          </button>
          <button
            className={`nav-link ${activeTab === 'past' ? 'active' : ''}`}
            onClick={() => { scrollToEvents('past'); closeMobile(); }}
          >
            Past Events
          </button>
          <button
            className={`nav-link ${activeTab === 'venues-page' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('venues-page');
              window.scrollTo({ top: 0, behavior: 'smooth' });
              closeMobile();
            }}
          >
            Spaces
          </button>
          {currentUser && !(currentUser?.isAdmin || currentUser?.role === 'admin' || currentUser?.email === 'admin@trace.lk') && (
            <>
              <button
                className={`nav-link ${activeTab === 'my-events' ? 'active' : ''}`}
                onClick={() => { openMyRegistrationsModal(); closeMobile(); }}
              >
                My Events
              </button>
              <button
                className={`nav-link ${activeTab === 'calendar' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('calendar');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  closeMobile();
                }}
              >
                Calendar
              </button>
            </>
          )}

          {!currentUser ? (
            <div className="nav-auth-group">
              <button className="btn btn-sm btn-outline" onClick={() => { openLoginModal(); closeMobile(); }}>Log In</button>
              <button className="btn btn-sm btn-primary" onClick={() => { openSignupModal(); closeMobile(); }}>Sign Up</button>
            </div>
          ) : (
            <div className="nav-auth-group">
              <div
                className="user-profile-badge"
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  setActiveTab('profile');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  closeMobile();
                }}
              >
                <img
                  src={
                    (currentUser.avatar && currentUser.avatar.trim() !== '')
                      ? currentUser.avatar
                      : `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name || 'User')}&background=5d4df6&color=fff&size=100`
                  }
                  alt={currentUser.name}
                  style={{ width: '26px', height: '26px', borderRadius: '50%', objectFit: 'cover' }}
                />
                <span>{currentUser.name}</span>
              </div>
              <button className="btn btn-sm btn-outline" onClick={() => { logout(); closeMobile(); }}>Logout</button>
            </div>
          )}

          {(currentUser?.isAdmin || currentUser?.role === 'admin' || currentUser?.email === 'admin@trace.lk') && (
            <button className="btn btn-sm btn-admin" onClick={() => { openAdminModal(); closeMobile(); }} title="Admin Panel">
              <i className="fa-solid fa-sliders"></i> Admin
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
