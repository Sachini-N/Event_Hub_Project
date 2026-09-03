import React, { useState, useMemo } from 'react';
import { isEventPast } from '../utils/eventUtils';

export default function PastEventsSection({
  events = [],
  loading = false,
  setActiveTab,
  onSelectPastEvent,
  isFullView = false,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('Any Location');

  // Filter real past events from database (events where date and set time have finished)
  const dbPastEvents = useMemo(() => {
    return events.filter((e) => isEventPast(e));
  }, [events]);

  // Only use published DB past events (no hardcoded samples)
  const allPastEvents = dbPastEvents;

  const categories = useMemo(() => {
    const cats = new Set(['All Categories', 'Talk', 'Meetup', 'Workshop', 'Sprint']);
    allPastEvents.forEach((e) => {
      if (e.category && e.category.trim()) cats.add(e.category.trim());
    });
    return Array.from(cats);
  }, [allPastEvents]);

  const locations = useMemo(() => {
    const locs = new Set([
      'Any Location',
      'TRACE Expert City',
      'TRACE Hub',
      'Innovation Center',
      'Main Hall',
    ]);
    allPastEvents.forEach((e) => {
      if (e.location && e.location.trim()) {
        const mainLoc = e.location.split(',')[0].trim();
        locs.add(mainLoc);
      }
    });
    return Array.from(locs);
  }, [allPastEvents]);

  // Filter list based on search, category, location, and date
  const filteredPastEvents = useMemo(() => {
    return allPastEvents.filter((item) => {
      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title?.toLowerCase().includes(q);
        const matchesDesc = (item.description || item.shortDescription)?.toLowerCase().includes(q);
        const matchesCat = item.category?.toLowerCase().includes(q);
        const matchesLoc = item.location?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesCat && !matchesLoc) {
          return false;
        }
      }

      // Category filter
      if (
        selectedCategory !== 'All Categories' &&
        item.category?.toLowerCase() !== selectedCategory.toLowerCase()
      ) {
        return false;
      }

      // Location filter
      if (selectedLocation !== 'Any Location') {
        if (!item.location?.toLowerCase().includes(selectedLocation.toLowerCase())) {
          return false;
        }
      }

      // Date filter
      if (selectedDate) {
        if (!item.date) return false;
        let matched = false;
        if (typeof item.date === 'string' && item.date.split('T')[0] === selectedDate) {
          matched = true;
        }
        try {
          const d = new Date(item.date);
          const localStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          const isoStr = d.toISOString().split('T')[0];
          if (localStr === selectedDate || isoStr === selectedDate) {
            matched = true;
          }
        } catch (e) {
          // ignore
        }
        if (!matched) return false;
      }

      return true;
    });
  }, [allPastEvents, searchQuery, selectedCategory, selectedLocation, selectedDate]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All Categories');
    setSelectedDate('');
    setSelectedLocation('Any Location');
  };

  const handleFilterClick = (e) => {
    e?.preventDefault();
  };

  const handleCardClick = (evt) => {
    if (onSelectPastEvent) {
      onSelectPastEvent(evt);
    } else if (setActiveTab) {
      setActiveTab('past');
    }
  };

  const formatPastDate = (dateVal, timeStr) => {
    if (!dateVal) return timeStr || 'Completed';
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return timeStr || 'Completed';
      const month = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
      const day = String(d.getDate()).padStart(2, '0');
      const year = d.getFullYear();
      return `${month} ${day}, ${year}${timeStr ? ` • ${timeStr}` : ''}`;
    } catch (e) {
      return timeStr || 'Completed';
    }
  };

  // ----------------------------------------------------
  // FULL PAGE VIEW (When activeTab === 'past' or isFullView === true)
  // ----------------------------------------------------
  if (isFullView) {
    return (
      <div className="past-events-page">
        <div className="section-container">
          {/* Page Title & Subtitle Header matching Upcoming Events */}
          <div className="page-header">
            <h1 className="page-title">Past Events</h1>
            <p className="page-subtitle">
              Discover past talks, meetups, workshops and community events at TRACE.
            </p>
          </div>

          {/* Filters Bar matching reference screenshot */}
          <div className="filter-bar-container">
            <div className="filter-item">
              <label htmlFor="past-filter-search">Search Events</label>
              <div className="search-input-wrapper">
                <i className="fa-solid fa-magnifying-glass search-icon"></i>
                <input
                  type="text"
                  id="past-filter-search"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="filter-item">
              <label htmlFor="past-filter-category">Category</label>
              <div className="select-wrapper">
                <select
                  id="past-filter-category"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <i className="fa-solid fa-chevron-down select-arrow"></i>
              </div>
            </div>

            <div className="filter-item">
              <label htmlFor="past-filter-date">Date</label>
              <div className="date-input-wrapper">
                <input
                  type="date"
                  id="past-filter-date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>
            </div>

            <div className="filter-item">
              <label htmlFor="past-filter-location">Location</label>
              <div className="select-wrapper">
                <select
                  id="past-filter-location"
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                >
                  {locations.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
                <i className="fa-solid fa-chevron-down select-arrow"></i>
              </div>
            </div>

            <div className="filter-actions">
              <button className="btn-filter-submit" type="button" onClick={handleFilterClick}>
                Filter
              </button>
              <button className="btn-filter-clear" type="button" onClick={handleClearFilters}>
                Clear
              </button>
            </div>
          </div>

          {/* Loading Spinner */}
          {loading && (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading past events...</p>
            </div>
          )}

          {/* Empty State matching Upcoming Events */}
          {!loading && filteredPastEvents.length === 0 && (
            <div className="empty-state">
              <i className="fa-solid fa-calendar-xmark"></i>
              <h3>No past events found</h3>
              <p>Try resetting or adjusting your search criteria and filters.</p>
            </div>
          )}

          {/* Full Grid of Past Events */}
          {!loading && filteredPastEvents.length > 0 && (
            <div className="events-grid-3col">
              {filteredPastEvents.map((item) => {
                const isUserUploaded = Boolean(item.createdBy || (item._id && !item._id.startsWith('past-evt-')));
                const formattedDate = formatPastDate(item.date, item.time);
                return (
                  <div
                    className="event-card-modern past-archive-card"
                    key={item._id || item.title}
                    onClick={() => handleCardClick(item)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="card-media">
                      <img
                        src={
                          item.coverImage ||
                          'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80'
                        }
                        alt={item.title}
                      />
                      <span className="cat-pill cat-default" style={{ background: 'rgba(15, 23, 42, 0.85)', color: '#fff' }}>
                        {(item.category || 'PAST EVENT').toUpperCase()}
                      </span>

                      <span className="completed-badge-overlay">
                        <i className="fa-solid fa-circle-check"></i> Completed
                      </span>
                    </div>

                    <div className="card-content">
                      <div className="event-date-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span><i className="fa-regular fa-calendar" style={{ marginRight: '5px' }}></i> {formattedDate}</span>
                        {isUserUploaded && (
                          <span
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: '700',
                              background: '#e0e7ff',
                              color: '#3730a3',
                              padding: '2px 8px',
                              borderRadius: '12px',
                            }}
                          >
                            <i className="fa-solid fa-cloud-arrow-up" style={{ marginRight: '3px' }}></i> Uploaded
                          </span>
                        )}
                      </div>

                      <h3 className="event-card-title" style={{ marginTop: '0.5rem' }}>{item.title}</h3>
                      <p className="event-card-description">{item.description || item.shortDescription}</p>

                      <div className="event-location-row" style={{ marginTop: '0.75rem' }}>
                        <i className="fa-solid fa-location-dot location-icon"></i>
                        <span>{item.location || 'TRACE Expert City, Colombo'}</span>
                      </div>

                      <div className="card-button-group" style={{ marginTop: '1.25rem' }}>
                        <button
                          className="btn-details-outline"
                          style={{ width: '100%', textTransform: 'none', fontWeight: '600' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCardClick(item);
                          }}
                        >
                          <i className="fa-solid fa-eye" style={{ marginRight: '6px' }}></i> View Details & Recap
                        </button>
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

  // ----------------------------------------------------
  // HOME PAGE FEATURED SHOWCASE SECTION VIEW
  // ----------------------------------------------------
  if (dbPastEvents.length === 0) {
    return (
      <section className="past-events-section" id="past-showcase">
        <div className="section-container">
          <div className="past-section-header">
            <h2>Explore Past Events</h2>
            <p>Catch up on what you missed and get a feel for the TRACE experience.</p>
          </div>
          <div
            className="empty-state"
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '3rem 1.5rem',
              boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
              textAlign: 'center',
            }}
          >
            <i className="fa-solid fa-clock-rotate-left" style={{ fontSize: '2.5rem', color: '#94a3b8', marginBottom: '1rem' }}></i>
            <h3>No Past Events Published Yet</h3>
            <p style={{ color: '#64748b', maxWidth: '520px', margin: '0.5rem auto 0 auto' }}>
              When completed events are published, their recaps, photo galleries, and summaries will appear here.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const card1 = dbPastEvents[0];
  const card2 = dbPastEvents[1];
  const card3 = dbPastEvents[2];

  return (
    <section className="past-events-section" id="past-showcase">
      <div className="section-container">
        <div className="past-section-header">
          <h2>Explore Past Events</h2>
          <p>Catch up on what you missed and get a feel for the TRACE experience.</p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '1.5rem',
            alignItems: 'stretch',
          }}
        >
          {/* Past Event Card 1 */}
          {card1 && (
            <div
              className="past-event-home-card"
              style={{
                background: '#ffffff',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 16px rgba(15, 23, 42, 0.05)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onClick={() => handleCardClick(card1)}
            >
              {/* Image Container */}
              <div style={{ position: 'relative', height: '210px', width: '100%', background: '#0f172a', overflow: 'hidden' }}>
                <img
                  src={card1.coverImage || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80'}
                  alt={card1.title}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: 'center',
                  }}
                />
                <span
                  style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    background: 'rgba(15, 23, 42, 0.85)',
                    backdropFilter: 'blur(4px)',
                    color: '#ffffff',
                    padding: '3px 10px',
                    borderRadius: '20px',
                    fontSize: '0.72rem',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  {card1.category || 'PAST EVENT'}
                </span>
                <span
                  style={{
                    position: 'absolute',
                    bottom: '12px',
                    right: '12px',
                    background: '#10b981',
                    color: '#ffffff',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '0.72rem',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <i className="fa-solid fa-circle-check"></i> Completed
                </span>
              </div>

              {/* Card Body */}
              <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <i className="fa-regular fa-calendar" style={{ color: '#5d4df6' }}></i>
                    {formatPastDate(card1.date)}
                    {card1.location && (
                      <>
                        <span style={{ margin: '0 4px', color: '#cbd5e1' }}>•</span>
                        <i className="fa-solid fa-location-dot" style={{ color: '#5d4df6' }}></i>
                        {card1.location.split(',')[0]}
                      </>
                    )}
                  </div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0f172a', marginBottom: '0.5rem', lineHeight: 1.35 }}>
                    {card1.title}
                  </h3>
                  <p
                    style={{
                      fontSize: '0.86rem',
                      color: '#64748b',
                      lineHeight: 1.45,
                      margin: 0,
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {card1.description || card1.shortDescription || 'Completed TRACE community event and workshop session.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Past Event Card 2 */}
          {card2 && (
            <div
              className="past-event-home-card"
              style={{
                background: '#ffffff',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 16px rgba(15, 23, 42, 0.05)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onClick={() => handleCardClick(card2)}
            >
              {/* Image Container */}
              <div style={{ position: 'relative', height: '210px', width: '100%', background: '#0f172a', overflow: 'hidden' }}>
                <img
                  src={card2.coverImage || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80'}
                  alt={card2.title}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: 'center',
                  }}
                />
                <span
                  style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    background: 'rgba(15, 23, 42, 0.85)',
                    backdropFilter: 'blur(4px)',
                    color: '#ffffff',
                    padding: '3px 10px',
                    borderRadius: '20px',
                    fontSize: '0.72rem',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  {card2.category || 'PAST EVENT'}
                </span>
                <span
                  style={{
                    position: 'absolute',
                    bottom: '12px',
                    right: '12px',
                    background: '#10b981',
                    color: '#ffffff',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '0.72rem',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <i className="fa-solid fa-circle-check"></i> Completed
                </span>
              </div>

              {/* Card Body */}
              <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <i className="fa-regular fa-calendar" style={{ color: '#5d4df6' }}></i>
                    {formatPastDate(card2.date)}
                    {card2.location && (
                      <>
                        <span style={{ margin: '0 4px', color: '#cbd5e1' }}>•</span>
                        <i className="fa-solid fa-location-dot" style={{ color: '#5d4df6' }}></i>
                        {card2.location.split(',')[0]}
                      </>
                    )}
                  </div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0f172a', marginBottom: '0.5rem', lineHeight: 1.35 }}>
                    {card2.title}
                  </h3>
                  <p
                    style={{
                      fontSize: '0.86rem',
                      color: '#64748b',
                      lineHeight: 1.45,
                      margin: 0,
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {card2.description || card2.shortDescription || 'Completed TRACE community event and workshop session.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Full Archive Callout Card */}
          <div
            style={{
              background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
              borderRadius: '16px',
              padding: '1.75rem 1.5rem',
              color: '#ffffff',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 4px 16px rgba(30, 27, 75, 0.25)',
              position: 'relative',
              overflow: 'hidden',
              cursor: 'pointer',
            }}
            onClick={() => setActiveTab && setActiveTab('past')}
          >
            <div
              style={{
                position: 'absolute',
                right: '-20px',
                bottom: '-20px',
                fontSize: '6.5rem',
                fontWeight: '900',
                color: 'rgba(255, 255, 255, 0.05)',
                userSelect: 'none',
                lineHeight: 1,
              }}
            >
              ARCHIVE
            </div>

            <div>
              <span
                style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  color: '#ffffff',
                  fontSize: '0.72rem',
                  fontWeight: '800',
                  padding: '3px 10px',
                  borderRadius: '20px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  marginBottom: '1rem',
                }}
              >
                <i className="fa-solid fa-clock-rotate-left"></i> TRACE ARCHIVE
              </span>

              <h3 style={{ fontSize: '1.35rem', fontWeight: '800', marginBottom: '0.75rem', lineHeight: 1.3 }}>
                Access the Full Past Archive
              </h3>
              <p style={{ fontSize: '0.88rem', color: '#cbd5e1', lineHeight: 1.5, marginBottom: '1.5rem' }}>
                Browse through years of TRACE workshops, technology summits, and meetups across all Sri Lanka hubs. Filter by category or search resources.
              </p>
            </div>

            <button
              type="button"
              className="btn"
              style={{
                background: '#ffffff',
                color: '#1e1b4b',
                borderRadius: '10px',
                padding: '0.7rem 1.25rem',
                fontSize: '0.88rem',
                fontWeight: '800',
                border: 'none',
                cursor: 'pointer',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(255, 255, 255, 0.2)',
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (setActiveTab) setActiveTab('past');
              }}
            >
              Browse All Past Events ({dbPastEvents.length}) <i className="fa-solid fa-arrow-right-long"></i>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
