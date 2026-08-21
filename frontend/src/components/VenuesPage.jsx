import React, { useState, useEffect } from 'react';

// TRACE Branch metadata definition for rich display & badges
const TRACE_BRANCHES_META = [
  {
    id: 'TRACE Expert City (Colombo)',
    name: 'TRACE Expert City',
    location: 'Colombo 10, Western Province',
    shortName: 'Colombo Hub',
    icon: 'fa-building-user',
    color: '#0052cc',
    badgeBg: '#e60023',
    bannerGradient: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #1e1b4b 100%)',
    description: 'Our flagship 14-acre technology hub in Maradana, featuring enterprise auditoriums, tech labs, and collaborative ecosystem spaces.',
  },
  {
    id: 'TRACE Innovation Hub (Kandy)',
    name: 'TRACE Innovation Hub',
    location: 'Peradeniya Rd, Kandy',
    shortName: 'Kandy Hub',
    icon: 'fa-mountain-city',
    color: '#059669',
    bannerGradient: 'linear-gradient(135deg, #064e3b 0%, #047857 50%, #0f172a 100%)',
    description: 'Central Province technology campus surrounded by lush hills, designed for regional developer summits and AI maker labs.',
  },
  {
    id: 'TRACE Tech Park (Jaffna)',
    name: 'TRACE Tech Park',
    location: 'Palaly Innovation Rd, Jaffna',
    shortName: 'Jaffna Tech Park',
    icon: 'fa-cubes-stacked',
    color: '#d97706',
    bannerGradient: 'linear-gradient(135deg, #78350f 0%, #b45309 50%, #1e293b 100%)',
    description: 'Northern Sri Lanka tech initiative fostering regional software engineering, startup innovation decks, and coding bootcamps.',
  },
  {
    id: 'TRACE Hub (Galle)',
    name: 'TRACE Hub Galle',
    location: 'Fort Marine Drive, Galle',
    shortName: 'Galle Coastal Hub',
    icon: 'fa-water',
    color: '#0284c7',
    bannerGradient: 'linear-gradient(135deg, #0c4a6e 0%, #0369a1 50%, #0f172a 100%)',
    description: 'Coastal event venue overlooking the historic Indian Ocean fort, tailored for corporate retreats and technical symposiums.',
  },
  {
    id: 'TRACE Tech Bay (Kurunegala)',
    name: 'TRACE Tech Bay',
    location: 'Lake Round Rd, Kurunegala',
    shortName: 'Wayamba Incubator',
    icon: 'fa-warehouse',
    color: '#7c3aed',
    bannerGradient: 'linear-gradient(135deg, #4c1d95 0%, #6d28d9 50%, #0f172a 100%)',
    description: 'Wayamba province incubator hall and startup launchpad empowering regional tech entrepreneurs and digital creators.',
  },
];

export default function VenuesPage({ showToast }) {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [capacityFilter, setCapacityFilter] = useState('All');

  // Modal State for Venue Details & Booking Inquiry
  const [activeVenueModal, setActiveVenueModal] = useState(null);
  const [inquiryForm, setInquiryForm] = useState({
    name: '',
    email: '',
    phone: '',
    eventTitle: '',
    eventDate: '',
    guests: '50',
    notes: '',
  });
  const [isSubmittingInquiry, setIsSubmittingInquiry] = useState(false);

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
      if (showToast) showToast('Failed to load venue listings', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVenues();
  }, []);

  // Filter logic
  const filteredVenues = venues.filter((v) => {
    // 1. Branch Filter
    if (selectedBranch !== 'All') {
      const vBranch = v.branch || 'TRACE Expert City (Colombo)';
      if (vBranch.toLowerCase() !== selectedBranch.toLowerCase()) return false;
    }

    // 2. Status Filter
    if (statusFilter !== 'All' && v.status !== statusFilter) {
      return false;
    }

    // 3. Capacity Filter
    if (capacityFilter === 'small' && v.capacity >= 100) return false;
    if (capacityFilter === 'medium' && (v.capacity < 100 || v.capacity > 200)) return false;
    if (capacityFilter === 'large' && v.capacity <= 200) return false;

    // 4. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchesName = v.name?.toLowerCase().includes(q);
      const matchesBranch = v.branch?.toLowerCase().includes(q);
      const matchesAddr = v.address?.toLowerCase().includes(q);
      const matchesCity = v.city?.toLowerCase().includes(q);
      const matchesDesc = v.description?.toLowerCase().includes(q);
      const matchesAmenities = v.amenities?.some((a) => a.toLowerCase().includes(q));

      return (
        matchesName ||
        matchesBranch ||
        matchesAddr ||
        matchesCity ||
        matchesDesc ||
        matchesAmenities
      );
    }

    return true;
  });

  // Calculate statistics across all venues
  const totalVenuesCount = venues.length;
  const availableVenuesCount = venues.filter((v) => v.status === 'Available').length;
  const totalCapacitySum = venues.reduce((acc, v) => acc + (v.capacity || 0), 0);

  // Group venues count by branch
  const getBranchVenueCount = (branchId) => {
    return venues.filter((v) => {
      const b = v.branch || 'TRACE Expert City (Colombo)';
      return b.toLowerCase() === branchId.toLowerCase();
    }).length;
  };

  // Currently active branch metadata
  const activeBranchMeta = TRACE_BRANCHES_META.find(
    (b) => b.id.toLowerCase() === selectedBranch.toLowerCase()
  );

  const [bookingConfirmation, setBookingConfirmation] = useState(null);

  const handleOpenInquiryModal = (venue) => {
    setActiveVenueModal(venue);
    setInquiryForm({
      name: '',
      email: '',
      phone: '',
      eventTitle: '',
      eventDate: '',
      durationHours: '4',
      guests: String(venue.capacity ? Math.min(venue.capacity, 50) : 50),
      notes: '',
    });
  };

  const handleInquirySubmit = async (e) => {
    e.preventDefault();
    setIsSubmittingInquiry(true);

    try {
      const response = await fetch('/api/venue-bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          venueId: activeVenueModal?._id || activeVenueModal?.id,
          venueName: activeVenueModal?.name,
          branch: activeVenueModal?.branch || 'TRACE Expert City (Colombo)',
          name: inquiryForm.name,
          email: inquiryForm.email,
          phone: inquiryForm.phone,
          eventTitle: inquiryForm.eventTitle,
          eventDate: inquiryForm.eventDate,
          durationHours: Number(inquiryForm.durationHours) || 4,
          guests: Number(inquiryForm.guests) || 50,
          notes: inquiryForm.notes,
          price: activeVenueModal?.rentalPrice || (activeVenueModal?.pricePerHour ? `Rs. ${activeVenueModal.pricePerHour.toLocaleString()} / hr` : 'Rs. 25,000 / hr'),
        }),
      });

      const result = await response.json();

      if (result.success && result.data) {
        setBookingConfirmation(result.data);
        setActiveVenueModal(null);
        if (showToast) showToast(`Booking inquiry submitted! Ref: ${result.data.bookingRef}`, 'success');
      } else {
        if (showToast) showToast(result.message || 'Failed to submit booking inquiry', 'error');
      }
    } catch (err) {
      console.error('Error submitting booking inquiry:', err);
      if (showToast) showToast('Network error while submitting booking inquiry', 'error');
    } finally {
      setIsSubmittingInquiry(false);
    }
  };

  return (
    <div className="venues-redesign-page">
      {/* Main Content Area */}
      <div className="section-container" style={{ paddingTop: '2.5rem', paddingBottom: '4rem' }}>
        {/* Page Title & Subtitle Header */}
        <div className="page-header" style={{ marginBottom: '2rem' }}>
          <h1 className="page-title">Spaces & Facilities</h1>
          <p className="page-subtitle">
            Explore world-class auditoriums, technology labs, and facilities stationed across TRACE branches.
          </p>
        </div>

        {/* 2. TRACE Branches Filter Tabs */}
        <div className="branch-filter-section">
          <div className="branch-filter-header">
            <div>
              <h2 className="branch-filter-title">
                <i className="fa-solid fa-code-branch" style={{ color: '#0052cc', marginRight: '8px' }}></i>
                Select TRACE Branch
              </h2>
              <p className="branch-filter-subtitle">
                Switch between TRACE branches to view available spaces in each location
              </p>
            </div>
            {selectedBranch !== 'All' && (
              <button
                className="btn-reset-branch"
                onClick={() => setSelectedBranch('All')}
              >
                <i className="fa-solid fa-rotate-left"></i> View All Branches
              </button>
            )}
          </div>

          <div className="branch-tabs-scroll-container">
            {/* "All Branches" Tab */}
            <button
              className={`branch-tab-pill ${selectedBranch === 'All' ? 'active' : ''}`}
              onClick={() => setSelectedBranch('All')}
            >
              <i className="fa-solid fa-globe"></i>
              <span>All TRACE Branches</span>
              <span className="branch-count-badge">{totalVenuesCount}</span>
            </button>

            {/* Individual Branch Tabs */}
            {TRACE_BRANCHES_META.map((b) => {
              const count = getBranchVenueCount(b.id);
              const isActive = selectedBranch.toLowerCase() === b.id.toLowerCase();
              return (
                <button
                  key={b.id}
                  className={`branch-tab-pill ${isActive ? 'active' : ''}`}
                  onClick={() => setSelectedBranch(b.id)}
                >
                  <i className={`fa-solid ${b.icon}`}></i>
                  <span>{b.shortName}</span>
                  <span className="branch-count-badge">{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Selected Branch Highlight Header Banner (If specific branch selected) */}
        {activeBranchMeta && (
          <div
            className="selected-branch-banner"
            style={{ background: activeBranchMeta.bannerGradient }}
          >
            <div className="branch-banner-content">
              <div className="branch-badge-tag">
                <i className={`fa-solid ${activeBranchMeta.icon}`}></i> {activeBranchMeta.location}
              </div>
              <h3>{activeBranchMeta.name}</h3>
              <p>{activeBranchMeta.description}</p>
            </div>
            <div className="branch-banner-meta">
              <div className="meta-pill">
                <i className="fa-solid fa-building-circle-check"></i>{' '}
                <strong>{getBranchVenueCount(activeBranchMeta.id)}</strong> Places in this Branch
              </div>
              <div className="meta-pill">
                <i className="fa-solid fa-map-pin"></i> {activeBranchMeta.location}
              </div>
            </div>
          </div>
        )}

        {/* 4. Secondary Filter Toolbar */}
        <div className="venues-filter-toolbar">
          <div className="toolbar-left">
            {/* Search Field */}
            <div className="filter-input-box">
              <i className="fa-solid fa-magnifying-glass"></i>
              <input
                type="text"
                placeholder="Filter by space name or feature..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Status Dropdown Filter */}
            <select
              className="toolbar-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">Status: All</option>
              <option value="Available">Available</option>
              <option value="Reserved">Reserved</option>
              <option value="Under Maintenance">Under Maintenance</option>
            </select>

            {/* Seating Capacity Filter */}
            <select
              className="toolbar-select"
              value={capacityFilter}
              onChange={(e) => setCapacityFilter(e.target.value)}
            >
              <option value="All">Capacity: All Sizes</option>
              <option value="small">Small (&lt; 100 Seats)</option>
              <option value="medium">Medium (100 - 200 Seats)</option>
              <option value="large">Large (&gt; 200 Seats)</option>
            </select>
          </div>

          <div className="toolbar-right">
            <span className="results-count-text">
              Showing <strong>{filteredVenues.length}</strong> {filteredVenues.length === 1 ? 'place' : 'places'}
            </span>
          </div>
        </div>

        {/* Loading Spinner */}
        {loading && (
          <div className="venues-loading-state">
            <div className="spinner"></div>
            <p>Loading TRACE branch venue spaces...</p>
          </div>
        )}

        {/* Empty Filter State */}
        {!loading && filteredVenues.length === 0 && (
          <div className="venues-empty-card">
            <div className="empty-icon-circle">
              <i className="fa-solid fa-building-circle-xmark"></i>
            </div>
            <h3>No venue places match your criteria</h3>
            <p>Try clearing your search query, switching branches, or resetting your filter choices.</p>
            <button
              className="btn btn-outline"
              style={{ marginTop: '1rem' }}
              onClick={() => {
                setSelectedBranch('All');
                setSearchQuery('');
                setStatusFilter('All');
                setCapacityFilter('All');
              }}
            >
              <i className="fa-solid fa-filter-circle-xmark"></i> Reset All Filters
            </button>
          </div>
        )}

        {/* 5. Venues / Places Grid */}
        {!loading && filteredVenues.length > 0 && (
          <div className="venues-modern-grid">
            {filteredVenues.map((v) => {
              const venueBranchName = v.branch || 'TRACE Expert City (Colombo)';
              const branchMeta = TRACE_BRANCHES_META.find(
                (b) => b.id.toLowerCase() === venueBranchName.toLowerCase()
              );

              return (
                <div key={v._id || v.id} className="venue-card-redesign">
                  {/* Card Banner Image */}
                  <div className="venue-banner-wrapper">
                    <img
                      src={
                        v.coverImage ||
                        'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=800&q=80'
                      }
                      alt={v.name}
                      className="venue-card-image"
                    />
                    <div className="venue-card-overlay-badges">
                      {/* Availability Tag */}
                      <span
                        className={`venue-status-pill ${
                          v.status === 'Available'
                            ? 'status-available'
                            : v.status === 'Reserved'
                            ? 'status-reserved'
                            : 'status-maintenance'
                        }`}
                      >
                        <i className="fa-solid fa-circle" style={{ fontSize: '0.55rem' }}></i>{' '}
                        {v.status || 'Available'}
                      </span>

                      {/* Capacity Pill */}
                      <span className="venue-capacity-pill">
                        <i className="fa-solid fa-users"></i> {v.capacity} Seats
                      </span>
                    </div>
                  </div>

                  {/* Card Body Content */}
                  <div className="venue-card-content">
                    {/* Branch Label & Rental Price Row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem', flexWrap: 'wrap', gap: '0.4rem' }}>
                      <div className="venue-branch-tag" style={{ margin: 0 }}>
                        <i className={`fa-solid ${branchMeta?.icon || 'fa-building'}`}></i>
                        <span>{branchMeta?.shortName || venueBranchName}</span>
                      </div>
                      <span className="venue-card-price-tag">
                        <i className="fa-solid fa-tag"></i> {v.rentalPrice || (v.pricePerHour ? `Rs. ${v.pricePerHour.toLocaleString()} / hr` : 'Rs. 25,000 / hr')}
                      </span>
                    </div>

                    <h3 className="venue-card-title">{v.name}</h3>

                    <p className="venue-card-address">
                      <i className="fa-solid fa-location-dot"></i> {v.address}
                    </p>

                    {v.description && (
                      <p className="venue-card-description">{v.description}</p>
                    )}

                    {/* Amenities Chips */}
                    {v.amenities && v.amenities.length > 0 && (
                      <div className="venue-amenities-row">
                        {v.amenities.slice(0, 4).map((am, i) => (
                          <span key={i} className="amenity-chip-tag">
                            ✓ {am}
                          </span>
                        ))}
                        {v.amenities.length > 4 && (
                          <span className="amenity-chip-more">
                            +{v.amenities.length - 4} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* Card Footer Actions */}
                    <div className="venue-card-actions">
                      <button
                        className="btn-venue-inquire"
                        onClick={() => handleOpenInquiryModal(v)}
                      >
                        <i className="fa-regular fa-paper-plane"></i> Inquire / Book Space
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 6. Venue Detail & Inquiry Modal */}
      {activeVenueModal && (
        <div className="modal-overlay" onClick={() => setActiveVenueModal(null)}>
          <div
            className="modal-card venue-inquiry-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close"
              onClick={() => setActiveVenueModal(null)}
            >
              <i className="fa-solid fa-xmark"></i>
            </button>

            <div className="venue-modal-banner">
              <img
                src={
                  activeVenueModal.coverImage ||
                  'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=800&q=80'
                }
                alt={activeVenueModal.name}
              />
              <div className="venue-modal-banner-overlay">
                <span className="modal-branch-pill">
                  <i className="fa-solid fa-building"></i>{' '}
                  {activeVenueModal.branch || 'TRACE Expert City (Colombo)'}
                </span>
                <h2>{activeVenueModal.name}</h2>
              </div>
            </div>

            <div className="venue-modal-body">
              {/* Venue Quick Specs */}
              <div className="venue-specs-grid">
                <div className="spec-box">
                  <i className="fa-solid fa-users spec-icon"></i>
                  <div>
                    <span className="spec-label">Capacity</span>
                    <strong className="spec-val">{activeVenueModal.capacity} Guests</strong>
                  </div>
                </div>

                <div className="spec-box">
                  <i className="fa-solid fa-circle-check spec-icon" style={{ color: '#16a34a' }}></i>
                  <div>
                    <span className="spec-label">Status</span>
                    <strong className="spec-val">{activeVenueModal.status || 'Available'}</strong>
                  </div>
                </div>

                <div className="spec-box">
                  <i className="fa-solid fa-location-dot spec-icon" style={{ color: '#e11d48' }}></i>
                  <div>
                    <span className="spec-label">City</span>
                    <strong className="spec-val">{activeVenueModal.city || 'Colombo, Sri Lanka'}</strong>
                  </div>
                </div>

                <div className="spec-box">
                  <i className="fa-solid fa-tag spec-icon" style={{ color: '#059669' }}></i>
                  <div>
                    <span className="spec-label">Rental Price</span>
                    <strong className="spec-val" style={{ color: '#059669' }}>
                      {activeVenueModal.rentalPrice || (activeVenueModal.pricePerHour ? `Rs. ${activeVenueModal.pricePerHour.toLocaleString()} / hr` : 'Rs. 25,000 / hr')}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Full Address & Description */}
              <div className="venue-details-section">
                <h4><i className="fa-solid fa-circle-info"></i> Space Overview</h4>
                <p className="venue-address-full">
                  <strong>Location:</strong> {activeVenueModal.address}
                </p>
                {activeVenueModal.description && (
                  <p className="venue-desc-full">{activeVenueModal.description}</p>
                )}
              </div>

              {/* Amenities */}
              {activeVenueModal.amenities && activeVenueModal.amenities.length > 0 && (
                <div className="venue-details-section">
                  <h4><i className="fa-solid fa-sliders"></i> Included Facilities & Amenities</h4>
                  <div className="modal-amenities-tags">
                    {activeVenueModal.amenities.map((am, i) => (
                      <span key={i} className="modal-amenity-pill">
                        <i className="fa-solid fa-check"></i> {am}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <hr className="modal-divider" />

              {/* Space Booking Inquiry Form */}
              <div className="venue-inquiry-form-section">
                <h3>
                  <i className="fa-solid fa-calendar-check" style={{ color: '#0052cc' }}></i>{' '}
                  Request Space Booking / Inquiry
                </h3>
                <p className="form-sub-text">
                  Fill in your details below to check availability or request a reservation quote for this venue space.
                </p>

                <form onSubmit={handleInquirySubmit}>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="inquiry-name">Your Full Name *</label>
                      <input
                        type="text"
                        id="inquiry-name"
                        required
                        placeholder="e.g. Kasun Perera"
                        value={inquiryForm.name}
                        onChange={(e) =>
                          setInquiryForm({ ...inquiryForm, name: e.target.value })
                        }
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="inquiry-email">Email Address *</label>
                      <input
                        type="email"
                        id="inquiry-email"
                        required
                        placeholder="kasun@techstartup.lk"
                        value={inquiryForm.email}
                        onChange={(e) =>
                          setInquiryForm({ ...inquiryForm, email: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="inquiry-phone">Phone Number *</label>
                      <input
                        type="tel"
                        id="inquiry-phone"
                        required
                        placeholder="+94 77 123 4567"
                        value={inquiryForm.phone}
                        onChange={(e) =>
                          setInquiryForm({ ...inquiryForm, phone: e.target.value })
                        }
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="inquiry-date">Target Event Date *</label>
                      <input
                        type="date"
                        id="inquiry-date"
                        required
                        value={inquiryForm.eventDate}
                        onChange={(e) =>
                          setInquiryForm({ ...inquiryForm, eventDate: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="inquiry-title">Event Title / Purpose *</label>
                    <input
                      type="text"
                      id="inquiry-title"
                      required
                      placeholder="e.g. Annual Developer Summit 2026"
                      value={inquiryForm.eventTitle}
                      onChange={(e) =>
                        setInquiryForm({ ...inquiryForm, eventTitle: e.target.value })
                      }
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="inquiry-hours">Estimated Duration (Hours) *</label>
                      <input
                        type="number"
                        id="inquiry-hours"
                        required
                        min="1"
                        max="24"
                        placeholder="4"
                        value={inquiryForm.durationHours}
                        onChange={(e) =>
                          setInquiryForm({ ...inquiryForm, durationHours: e.target.value })
                        }
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="inquiry-guests">Expected Attendees</label>
                      <input
                        type="number"
                        id="inquiry-guests"
                        placeholder="50"
                        value={inquiryForm.guests}
                        onChange={(e) =>
                          setInquiryForm({ ...inquiryForm, guests: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  {/* Estimated Cost Preview Box */}
                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '0.85rem 1rem', borderRadius: '10px', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.86rem', color: '#166534', fontWeight: '600' }}>
                      <i className="fa-solid fa-calculator" style={{ marginRight: '6px' }}></i> Estimated Rental Cost:
                    </span>
                    <strong style={{ fontSize: '0.98rem', color: '#15803d' }}>
                      Rs. {((activeVenueModal?.pricePerHour || 25000) * (Number(inquiryForm.durationHours) || 4)).toLocaleString()} ({inquiryForm.durationHours || 4} hrs @ Rs. {(activeVenueModal?.pricePerHour || 25000).toLocaleString()}/hr)
                    </strong>
                  </div>

                  <div className="form-group">
                    <label htmlFor="inquiry-notes">Special Requirements / Notes (Optional)</label>
                    <textarea
                      id="inquiry-notes"
                      rows="3"
                      placeholder="e.g. Need live streaming setup, stage lighting, and tech support..."
                      value={inquiryForm.notes}
                      onChange={(e) =>
                        setInquiryForm({ ...inquiryForm, notes: e.target.value })
                      }
                    ></textarea>
                  </div>

                  <div className="form-actions" style={{ marginTop: '1.25rem' }}>
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => setActiveVenueModal(null)}
                    >
                      Close
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={isSubmittingInquiry}
                    >
                      {isSubmittingInquiry ? (
                        <>
                          <i className="fa-solid fa-spinner fa-spin"></i> Submitting...
                        </>
                      ) : (
                        <>
                          <i className="fa-solid fa-paper-plane"></i> Send Booking Inquiry
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Booking Confirmation Receipt Modal */}
      {bookingConfirmation && (
        <div className="modal-overlay" onClick={() => setBookingConfirmation(null)}>
          <div className="modal-card" style={{ maxWidth: '580px', borderRadius: '20px', padding: '2rem' }} onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setBookingConfirmation(null)}>
              <i className="fa-solid fa-xmark"></i>
            </button>

            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ width: '64px', height: '64px', background: '#dcfce7', color: '#16a34a', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', margin: '0 auto 1rem' }}>
                <i className="fa-solid fa-circle-check"></i>
              </div>
              <h2 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#0f172a', margin: '0 0 0.3rem 0' }}>
                Space Inquiry Submitted!
              </h2>
              <p style={{ fontSize: '0.9rem', color: '#64748b', margin: 0 }}>
                Your venue booking request has been received by TRACE venue management.
              </p>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.85rem', borderBottom: '1px dashed #cbd5e1', marginBottom: '0.85rem' }}>
                <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: '700' }}>BOOKING REFERENCE</span>
                <span style={{ fontSize: '1rem', fontWeight: '800', color: '#0052cc', background: '#eff6ff', padding: '0.2rem 0.6rem', borderRadius: '6px' }}>
                  {bookingConfirmation.bookingRef}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', fontSize: '0.88rem' }}>
                <div>
                  <span style={{ color: '#64748b', fontSize: '0.78rem', display: 'block', fontWeight: '600' }}>VENUE NAME</span>
                  <strong style={{ color: '#0f172a' }}>{bookingConfirmation.venueName}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontSize: '0.78rem', display: 'block', fontWeight: '600' }}>BRANCH</span>
                  <strong style={{ color: '#0f172a' }}>{bookingConfirmation.branch}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontSize: '0.78rem', display: 'block', fontWeight: '600' }}>EVENT TITLE</span>
                  <strong style={{ color: '#0f172a' }}>{bookingConfirmation.eventTitle}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontSize: '0.78rem', display: 'block', fontWeight: '600' }}>TARGET DATE & DURATION</span>
                  <strong style={{ color: '#0f172a' }}>{bookingConfirmation.eventDate} ({bookingConfirmation.durationHours || 4} Hours)</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontSize: '0.78rem', display: 'block', fontWeight: '600' }}>APPLICANT</span>
                  <strong style={{ color: '#0f172a' }}>{bookingConfirmation.name}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontSize: '0.78rem', display: 'block', fontWeight: '600' }}>STATUS</span>
                  <span style={{ color: '#d97706', fontWeight: '700', background: '#fef3c7', padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.78rem', display: 'inline-block' }}>
                    ● {bookingConfirmation.status || 'Pending Review'}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <button
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.8rem' }}
                onClick={() => setBookingConfirmation(null)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
