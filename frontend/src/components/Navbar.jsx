import React from 'react';

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
  return (
    <header className="navbar">
      <div className="nav-container">
        <div className="brand" onClick={scrollToHero} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
          <span className="logo-text">TRACE <span className="logo-tracker-sub">Tracker</span></span>
        </div>

        <nav className="nav-links">
          <button
            className={`nav-link ${activeTab === 'home' ? 'active' : ''}`}
            onClick={scrollToHero}
          >
            Home
          </button>
          <button
            className={`nav-link ${activeTab === 'upcoming' ? 'active' : ''}`}
            onClick={() => scrollToEvents('upcoming')}
          >
            Upcoming Events
          </button>
          <button
            className={`nav-link ${activeTab === 'past' ? 'active' : ''}`}
            onClick={() => scrollToEvents('past')}
          >
            Past Events
          </button>
          <button
            className={`nav-link ${activeTab === 'venues-page' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('venues-page');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            Venues
          </button>
          {currentUser && !(currentUser?.isAdmin || currentUser?.role === 'admin' || currentUser?.email === 'admin@trace.lk') && (
            <>
              <button
                className={`nav-link ${activeTab === 'my-events' ? 'active' : ''}`}
                onClick={openMyRegistrationsModal}
              >
                My Events
              </button>
              <button
                className={`nav-link ${activeTab === 'calendar' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('calendar');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                Calendar
              </button>
            </>
          )}



          {!currentUser ? (
            <div className="nav-auth-group">
              <button className="btn btn-sm btn-outline" onClick={openLoginModal}>Log In</button>
              <button className="btn btn-sm btn-primary" onClick={openSignupModal}>Sign Up</button>
            </div>
          ) : (
            <div className="nav-auth-group">
              <div
                className="user-profile-badge"
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  setActiveTab('profile');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                <img
                  src={
                    (currentUser.avatar && currentUser.avatar.trim() !== '')
                      ? currentUser.avatar
                      : `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name || 'User')}&background=0052cc&color=fff&size=100`
                  }
                  alt={currentUser.name}
                  style={{ width: '26px', height: '26px', borderRadius: '50%', objectFit: 'cover' }}
                />
                <span>{currentUser.name}</span>
              </div>
              <button className="btn btn-sm btn-outline" onClick={logout}>Logout</button>
            </div>
          )}

          {(currentUser?.isAdmin || currentUser?.role === 'admin' || currentUser?.email === 'admin@trace.lk') && (
            <button className="btn btn-sm btn-admin" onClick={openAdminModal} title="Admin Panel">
              <i className="fa-solid fa-sliders"></i> Admin
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
