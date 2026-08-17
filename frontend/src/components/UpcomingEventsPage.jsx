import React, { useState, useMemo } from 'react';

export default function UpcomingEventsPage({
  events,
  loading,
  openRegistrationModal,
  currentUser,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('Any Location');

  // Registered events tracking (mocked or from registered state)
  const registeredEventIds = useMemo(() => {
    // For visual match with screenshot, "TRACE Community Meetup" is marked registered
    return ['TRACE Community Meetup'];
  }, []);

  const categories = useMemo(() => {
    const cats = new Set(['All Categories']);
    events.forEach((e) => {
      if (e.category) cats.add(e.category);
    });
    return Array.from(cats);
  }, [events]);

  const locations = useMemo(() => {
    const locs = new Set(['Any Location']);
    events.forEach((e) => {
      if (e.location) {
        const mainLoc = e.location.split(',')[0].trim();
        locs.add(mainLoc);
      }
    });
    return Array.from(locs);
  }, [events]);

  const filteredUpcomingEvents = useMemo(() => {
    return events.filter((event) => {
      if (event.status !== 'upcoming') return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = event.title?.toLowerCase().includes(q);
        const matchesDesc = event.description?.toLowerCase().includes(q);
        const matchesCat = event.category?.toLowerCase().includes(q);
        const matchesLoc = event.location?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesCat && !matchesLoc) {
          return false;
        }
      }

      // Category filter
      if (
        selectedCategory !== 'All Categories' &&
        event.category?.toLowerCase() !== selectedCategory.toLowerCase()
      ) {
        return false;
      }

      // Location filter
      if (selectedLocation !== 'Any Location') {
        if (!event.location?.toLowerCase().includes(selectedLocation.toLowerCase())) {
          return false;
        }
      }

      // Date filter
      if (selectedDate) {
        const eventDateStr = new Date(event.date).toISOString().split('T')[0];
        if (eventDateStr !== selectedDate) {
          return false;
        }
      }

      return true;
    });
  }, [events, searchQuery, selectedCategory, selectedLocation, selectedDate]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All Categories');
    setSelectedDate('');
    setSelectedLocation('Any Location');
  };

  const getCategoryClass = (category) => {
    const lower = (category || '').toLowerCase();
    if (lower === 'talk') return 'cat-badge-talk';
    if (lower === 'meetup') return 'cat-badge-meetup';
    if (lower === 'workshop') return 'cat-badge-workshop';
    return 'cat-badge-default';
  };

  const formatEventDate = (dateStr, timeStr) => {
    if (!dateStr) return timeStr || '';
    const d = new Date(dateStr);
    const month = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
    const day = String(d.getDate()).padStart(2, '0');
    const year = d.getFullYear();
    return `${month} ${day}, ${year} • ${timeStr || ''}`;
  };

  return (
    <div className="upcoming-events-page">
      <div className="section-container">
        {/* Page Title & Subtitle Header */}
        <div className="page-header">
          <h1 className="page-title">Upcoming Events</h1>
          <p className="page-subtitle">
            Discover upcoming talks, meetups, workshops and community events at TRACE.
          </p>
        </div>

        {/* Filters Bar matching reference screenshot */}
        <div className="filter-bar-container">
          <div className="filter-item">
            <label htmlFor="filter-search">Search Events</label>
            <div className="search-input-wrapper">
              <i className="fa-solid fa-magnifying-glass search-icon"></i>
              <input
                type="text"
                id="filter-search"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="filter-item">
            <label htmlFor="filter-category">Category</label>
            <div className="select-wrapper">
              <select
                id="filter-category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="All Categories">All Categories</option>
                <option value="Talk">Talk</option>
                <option value="Meetup">Meetup</option>
                <option value="Workshop">Workshop</option>
                <option value="Sprint">Sprint</option>
              </select>
              <i className="fa-solid fa-chevron-down select-arrow"></i>
            </div>
          </div>

          <div className="filter-item">
            <label htmlFor="filter-date">Date</label>
            <div className="date-input-wrapper">
              <input
                type="date"
                id="filter-date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
          </div>

          <div className="filter-item">
            <label htmlFor="filter-location">Location</label>
            <div className="select-wrapper">
              <select
                id="filter-location"
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
              >
                <option value="Any Location">Any Location</option>
                <option value="TRACE Expert City">TRACE Expert City</option>
                <option value="TRACE Hub">TRACE Hub</option>
                <option value="Innovation Center">Innovation Center</option>
                <option value="Main Hall">Main Hall</option>
              </select>
              <i className="fa-solid fa-chevron-down select-arrow"></i>
            </div>
          </div>

          <div className="filter-actions">
            <button className="btn-filter-submit">Filter</button>
            <button className="btn-filter-clear" onClick={handleClearFilters}>
              Clear
            </button>
          </div>
        </div>

        {/* Loading Spinner */}
        {loading && (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading upcoming events...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredUpcomingEvents.length === 0 && (
          <div className="empty-state">
            <i className="fa-solid fa-calendar-xmark"></i>
            <h3>No upcoming events found</h3>
            <p>Try resetting or adjusting your search criteria and filters.</p>
          </div>
        )}

        {/* Events Grid matching reference layout */}
        {!loading && filteredUpcomingEvents.length > 0 && (
          <div className="events-grid-3col">
            {filteredUpcomingEvents.map((event) => {
              const catClass = getCategoryClass(event.category);
              const formattedDate = formatEventDate(event.date, event.time);
              const isRegistered = registeredEventIds.includes(event.title);

              return (
                <div className="event-card-modern" key={event._id || event.title}>
                  <div className="card-media">
                    <img
                      src={
                        event.coverImage ||
                        'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80'
                      }
                      alt={event.title}
                    />
                    <span className={`cat-pill ${catClass}`}>
                      {(event.category || 'EVENT').toUpperCase()}
                    </span>

                    {isRegistered && (
                      <div className="registered-badge-overlay">
                        <i className="fa-solid fa-circle-check"></i>
                        <span>Registered</span>
                      </div>
                    )}
                  </div>

                  <div className="card-content">
                    <div className="event-date-heading">{formattedDate}</div>
                    <h3 className="event-card-title">{event.title}</h3>
                    <p className="event-card-description">{event.description}</p>

                    <div className="event-location-row">
                      <i className="fa-solid fa-location-dot location-icon"></i>
                      <span>{event.location}</span>
                    </div>

                    <div className="card-button-group">
                      <button
                        className="btn-details-outline"
                        onClick={() => openRegistrationModal(event)}
                      >
                        View Details
                      </button>

                      {isRegistered ? (
                        <button className="btn-registered-disabled" disabled>
                          <i className="fa-solid fa-check"></i> Joined
                        </button>
                      ) : (
                        <button
                          className="btn-register-solid"
                          onClick={() => openRegistrationModal(event)}
                        >
                          Register
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
