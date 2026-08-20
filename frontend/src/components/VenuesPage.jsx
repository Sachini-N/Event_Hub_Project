import React, { useState, useEffect } from 'react';

export default function VenuesPage({ showToast }) {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const fetchVenues = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/venues');
      const data = await res.json();
      if (data.success && data.data) {
        setVenues(data.data);
      }
    } catch (err) {
      console.error('Error fetching venues:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVenues();
  }, []);

  const filteredVenues = venues.filter((v) => {
    if (statusFilter !== 'All' && v.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchesName = v.name?.toLowerCase().includes(q);
      const matchesAddr = v.address?.toLowerCase().includes(q);
      const matchesDesc = v.description?.toLowerCase().includes(q);
      return matchesName || matchesAddr || matchesDesc;
    }
    return true;
  });

  return (
    <div className="venues-public-page">
      <div className="section-container">
        {/* Page Header */}
        <div className="my-events-header" style={{ marginBottom: '1.5rem' }}>
          <h1 className="my-events-title">Venues & Event Spaces</h1>
          <p className="my-events-subtitle">
            Explore world-class halls, tech labs, and auditoriums at TRACE Expert City.
          </p>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="manage-events-toolbar" style={{ marginBottom: '2rem' }}>
          <div className="manage-events-filters" style={{ flex: 1 }}>
            <div className="filter-search-input" style={{ width: '100%', maxWidth: '400px' }}>
              <i className="fa-solid fa-magnifying-glass"></i>
              <input
                type="text"
                placeholder="Search venues by name or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <select
              className="filter-select-dropdown"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">Status: All</option>
              <option value="Available">Available</option>
              <option value="Reserved">Reserved</option>
            </select>
          </div>
        </div>

        {/* Loading Spinner */}
        {loading && (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading venues and spaces...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredVenues.length === 0 && (
          <div className="empty-state">
            <i className="fa-solid fa-building"></i>
            <h3>No venues found</h3>
            <p>Try adjusting your search query or filter settings.</p>
          </div>
        )}

        {/* Venues Grid */}
        {!loading && filteredVenues.length > 0 && (
          <div className="venues-grid-2col">
            {filteredVenues.map((v) => (
              <div key={v._id || v.id} className="venue-card">
                <img
                  src={
                    v.coverImage ||
                    'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=800&q=80'
                  }
                  alt={v.name}
                  className="venue-card-banner"
                />
                <div className="venue-card-body">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span
                      className={`venue-tag-badge ${
                        v.status === 'Available' ? 'venue-tag-available' : 'venue-tag-reserved'
                      }`}
                    >
                      ● {v.status || 'Available'}
                    </span>
                    <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#0052cc' }}>
                      <i className="fa-solid fa-users"></i> {v.capacity} Seats
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#0f172a', margin: '0.4rem 0 0.2rem 0' }}>
                    {v.name}
                  </h3>
                  <p style={{ fontSize: '0.88rem', color: '#64748b', marginBottom: '0.75rem' }}>
                    <i className="fa-solid fa-location-dot" style={{ color: '#0052cc' }}></i> {v.address}
                  </p>

                  {v.description && (
                    <p style={{ fontSize: '0.86rem', color: '#475569', lineHeight: 1.5, marginBottom: '1rem' }}>
                      {v.description}
                    </p>
                  )}

                  <div className="venue-amenities-tags">
                    {v.amenities && v.amenities.map((am, i) => (
                      <span key={i} className="amenity-chip">✓ {am}</span>
                    ))}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
                    <button
                      className="btn-my-view-event"
                      onClick={() =>
                        showToast && showToast(`Booking information requested for "${v.name}"`, 'info')
                      }
                    >
                      Inquire Venue
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
