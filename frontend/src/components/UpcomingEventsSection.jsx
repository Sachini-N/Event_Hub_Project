import React from 'react';

export default function UpcomingEventsSection({
  events,
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  loading,
  openRegistrationModal,
  openGalleryLightbox,
}) {
  const upcomingCount = events.filter((e) => e.status === 'upcoming').length;
  const pastCount = events.filter((e) => e.status === 'past').length;

  const currentTab = activeTab === 'past' ? 'past' : 'upcoming';

  const filteredEvents = events.filter((event) => {
    const matchesTab = event.status === currentTab;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      event.title.toLowerCase().includes(q) ||
      event.description.toLowerCase().includes(q) ||
      event.category.toLowerCase().includes(q) ||
      (event.speaker && event.speaker.name.toLowerCase().includes(q));

    return matchesTab && matchesSearch;
  });

  // Limit to 3 items on the home page preview
  const displayEvents = activeTab === 'home' ? filteredEvents.slice(0, 3) : filteredEvents;

  const getCategoryClass = (category) => {
    const lower = (category || '').toLowerCase();
    if (lower.includes('workshop')) return 'cat-workshop';
    if (lower.includes('meetup')) return 'cat-meetup';
    if (lower.includes('sprint')) return 'cat-sprint';
    return 'cat-default';
  };

  const formatEventDate = (dateStr, timeStr) => {
    const d = new Date(dateStr);
    const month = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
    const day = String(d.getDate()).padStart(2, '0');
    const year = d.getFullYear();
    return `${month} ${day}, ${year} • ${timeStr}`;
  };

  return (
    <section className="events-main-section" id="events-section">
      <div className="section-container">
        
        <div className="section-header-row">
          <h2 className="section-title">
            {currentTab === 'upcoming' ? 'Upcoming Events' : 'Past Events & Showcase'}
          </h2>
          <div className="header-right-controls">
            <div className="search-box-inline">
              <i className="fa-solid fa-magnifying-glass search-icon"></i>
              <input
                type="text"
                id="search-input"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button
              className="view-all-link"
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              onClick={() => {
                setActiveTab('upcoming');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              View all <i className="fa-solid fa-arrow-right-long"></i>
            </button>
          </div>
        </div>

        {/* Tab Switchers */}
        <div className="tab-filter-bar">
          <button
            className={`tab-pill ${activeTab === 'upcoming' ? 'active' : ''}`}
            onClick={() => setActiveTab('upcoming')}
          >
            Upcoming Events <span className="badge">{upcomingCount}</span>
          </button>
          <button
            className={`tab-pill ${activeTab === 'past' ? 'active' : ''}`}
            onClick={() => setActiveTab('past')}
          >
            Past Events & Showcase <span className="badge">{pastCount}</span>
          </button>
        </div>

        {/* Loading Spinner */}
        {loading && (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading events...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && displayEvents.length === 0 && (
          <div className="empty-state">
            <i className="fa-solid fa-calendar-xmark"></i>
            <h3>No events found</h3>
            <p>Try adjusting your search criteria or switch between upcoming and past tabs.</p>
          </div>
        )}

        {/* Events Grid */}
        {!loading && displayEvents.length > 0 && (
          <div className="events-grid">
            {displayEvents.map((event) => {
              const isUpcoming = event.status === 'upcoming';
              const catClass = getCategoryClass(event.category);
              const formattedDate = formatEventDate(event.date, event.time);

              return (
                <div className="event-card" key={event._id}>
                  <div className="card-banner">
                    <img
                      src={
                        event.coverImage ||
                        'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80'
                      }
                      alt={event.title}
                    />
                    <span className={`category-tag-pill ${catClass}`}>{event.category}</span>
                  </div>

                  <div className="card-body">
                    <div className="event-datetime">{formattedDate}</div>
                    <h3 className="card-title">{event.title}</h3>

                    <div className="card-location">
                      <i className="fa-solid fa-location-dot" style={{ color: 'var(--teal-accent)' }}></i>
                      <span>{event.location}</span>
                    </div>

                    <p className="card-desc">{event.description}</p>

                    {/* Gallery Highlights if Past Event */}
                    {!isUpcoming && event.gallery && event.gallery.length > 0 && (
                      <div className="gallery-section" style={{ marginTop: '0.75rem' }}>
                        <div
                          className="gallery-title"
                          style={{
                            fontSize: '0.8rem',
                            fontWeight: '700',
                            color: 'var(--text-muted)',
                            marginBottom: '0.5rem',
                          }}
                        >
                          <i className="fa-solid fa-camera"></i> Photo Highlights ({event.gallery.length})
                        </div>
                        <div
                          className="gallery-grid"
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(4,1fr)',
                            gap: '0.4rem',
                          }}
                        >
                          {event.gallery.slice(0, 4).map((img, idx) => (
                            <div
                              key={idx}
                              className="gallery-thumb"
                              onClick={() => openGalleryLightbox(event, idx)}
                              style={{
                                height: '50px',
                                borderRadius: '6px',
                                overflow: 'hidden',
                                cursor: 'pointer',
                              }}
                            >
                              <img
                                src={img.url}
                                alt="Gallery photo"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {isUpcoming ? (
                      <button
                        className="btn-card-action"
                        onClick={() => openRegistrationModal(event)}
                      >
                        View Details / Register
                      </button>
                    ) : (
                      <button
                        className="btn-card-secondary"
                        onClick={() => openGalleryLightbox(event, 0)}
                      >
                        <i className="fa-solid fa-images"></i> View Event Showcase
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </section>
  );
}
