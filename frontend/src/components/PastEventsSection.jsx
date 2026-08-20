import React, { useState, useMemo } from 'react';

export default function PastEventsSection({
  events = [],
  setActiveTab,
  onSelectPastEvent,
  isFullView = false,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');

  // Filter real past events from database (events with status === 'past' or dates < now)
  const dbPastEvents = useMemo(() => {
    return events.filter(
      (e) => e.status === 'past' || (e.date && new Date(e.date) < new Date() && e.status !== 'draft')
    );
  }, [events]);

  // Only use published DB past events (no hardcoded samples)
  const allPastEvents = dbPastEvents;

  // Filter list based on search and category when in full view
  const filteredPastEvents = useMemo(() => {
    return allPastEvents.filter((item) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title?.toLowerCase().includes(q);
        const matchesDesc = item.description?.toLowerCase().includes(q);
        const matchesCat = item.category?.toLowerCase().includes(q);
        const matchesLoc = item.location?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesCat && !matchesLoc) {
          return false;
        }
      }

      if (
        selectedCategory !== 'All Categories' &&
        item.category?.toLowerCase() !== selectedCategory.toLowerCase()
      ) {
        return false;
      }

      return true;
    });
  }, [allPastEvents, searchQuery, selectedCategory]);

  const categories = useMemo(() => {
    const cats = new Set(['All Categories']);
    allPastEvents.forEach((e) => {
      if (e.category) cats.add(e.category);
    });
    return Array.from(cats);
  }, [allPastEvents]);

  const handleCardClick = (evt) => {
    if (onSelectPastEvent) {
      onSelectPastEvent(evt);
    } else if (setActiveTab) {
      setActiveTab('past');
    }
  };

  const formatPastDate = (dateVal) => {
    if (!dateVal) return 'Completed';
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return 'Completed';
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch (e) {
      return 'Completed';
    }
  };

  // ----------------------------------------------------
  // FULL PAGE VIEW (When activeTab === 'past' or isFullView === true)
  // ----------------------------------------------------
  if (isFullView) {
    return (
      <div className="past-events-page" style={{ padding: '2rem 0 4rem 0' }}>
        <div className="section-container">
          <div className="page-header">
            <h1 className="page-title">
              <i className="fa-solid fa-clock-rotate-left" style={{ color: '#0052cc', marginRight: '10px' }}></i>
              Past Events & Community Archive
            </h1>
            <p className="page-subtitle">
              Browse completed workshops, hackathons, and user-uploaded events. Access recordings, summaries, and photo galleries.
            </p>
          </div>

          {/* Search & Filter Bar */}
          <div className="filter-bar-container" style={{ marginBottom: '2rem' }}>
            <div className="filter-item" style={{ flex: 2 }}>
              <label htmlFor="past-filter-search">Search Past Archive</label>
              <div className="search-input-wrapper">
                <i className="fa-solid fa-magnifying-glass search-icon"></i>
                <input
                  type="text"
                  id="past-filter-search"
                  placeholder="Search by title, location, description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="filter-item" style={{ flex: 1 }}>
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

            <div className="filter-actions">
              <button
                className="btn-filter-clear"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All Categories');
                }}
              >
                Clear Filters
              </button>
            </div>
          </div>

          {/* Count bar */}
          <div style={{ marginBottom: '1.5rem', fontSize: '0.9rem', color: '#64748b', fontWeight: '500' }}>
            Showing <strong>{filteredPastEvents.length}</strong> past event{filteredPastEvents.length !== 1 ? 's' : ''}
          </div>

          {/* Empty state */}
          {filteredPastEvents.length === 0 && (
            <div className="empty-state">
              <i className="fa-solid fa-folder-open"></i>
              <h3>No past events match your filters</h3>
              <p>Try clearing your search query or selecting a different category.</p>
            </div>
          )}

          {/* Full Grid of Past Events */}
          {filteredPastEvents.length > 0 && (
            <div className="events-grid-3col">
              {filteredPastEvents.map((item) => {
                const isUserUploaded = Boolean(item.createdBy || (item._id && !item._id.startsWith('past-evt-')));
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
                        <span><i className="fa-regular fa-calendar" style={{ marginRight: '5px' }}></i> {formatPastDate(item.date)}</span>
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
                          <i className="fa-solid fa-eye" style={{ marginRight: '6px' }}></i> View Showcase & Gallery
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

        <div className="past-grid-layout">
          {/* Large Past Event Card */}
          {card1 && (
            <div
              className="past-card past-card-large"
              style={{
                backgroundImage: `url('${card1.coverImage || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80'}')`,
                cursor: 'pointer',
              }}
              onClick={() => handleCardClick(card1)}
            >
              <div className="past-card-overlay"></div>
              <div className="past-card-content">
                <span className="past-badge">
                  {card1.category || 'Past Event'}
                </span>
                <h3 className="past-card-title">{card1.title}</h3>
                <p className="past-card-text">{card1.description || card1.shortDescription}</p>
                <button
                  className="btn btn-outline-light"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCardClick(card1);
                  }}
                >
                  View Event Details
                </button>
              </div>
            </div>
          )}

          {/* Medium Past Event Card 1 */}
          {card2 && (
            <div
              className="past-card past-card-medium"
              style={{
                backgroundImage: `url('${card2.coverImage || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80'}')`,
                cursor: 'pointer',
              }}
              onClick={() => handleCardClick(card2)}
            >
              <div className="past-card-overlay"></div>
              <div className="past-card-content">
                <span className="past-badge">
                  {card2.category || 'Past Event'}
                </span>
                <h3 className="past-card-title">{card2.title}</h3>
                <button
                  className="btn btn-solid-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCardClick(card2);
                  }}
                >
                  View Details
                </button>
              </div>
            </div>
          )}

          {/* Medium Past Event Card 2 */}
          {card3 && (
            <div
              className="past-card past-card-medium"
              style={{
                backgroundImage: `url('${card3.coverImage || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80'}')`,
                cursor: 'pointer',
              }}
              onClick={() => handleCardClick(card3)}
            >
              <div className="past-card-overlay"></div>
              <div className="past-card-content">
                <span className="past-badge">
                  {card3.category || 'Archive'}
                </span>
                <h3 className="past-card-title">{card3.title}</h3>
                <button
                  className="btn btn-solid-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCardClick(card3);
                  }}
                >
                  Read Summary
                </button>
              </div>
            </div>
          )}

          {/* Full Archive Banner Card */}
          <div
            className="past-card archive-banner-card"
            style={{ cursor: 'pointer' }}
            onClick={() => setActiveTab && setActiveTab('past')}
          >
            <div className="archive-watermark">ARCHIVE</div>
            <div className="past-card-content">
              <h3 className="archive-title">Access the Full Archive</h3>
              <p className="archive-desc">
                Browse through years of workshops, summits, and meetups. Filter by topic to find the resources most relevant to your career.
              </p>
              <button
                className="btn btn-white-pill"
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
      </div>
    </section>
  );
}
