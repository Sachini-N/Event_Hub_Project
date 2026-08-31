import React, { useState, useEffect } from 'react';
import FormattedText from './FormattedText';
import ImageCarouselSlider from './ImageCarouselSlider';

// TRACE Branch metadata definition for rich display & badges
const TRACE_BRANCHES_META = [
  {
    id: 'TRACE Expert City (Colombo)',
    name: 'TRACE Expert City',
    location: 'Colombo 10, Western Province',
    shortName: 'Colombo Hub',
    icon: 'fa-building-user',
    color: '#5d4df6',
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
  const [provinceFilter, setProvinceFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [capacityFilter, setCapacityFilter] = useState('All');

  // Helper function to derive province for any space
  const getSpaceProvince = (v) => {
    if (v.province) return v.province;
    const str = `${v.branch || ''} ${v.city || ''} ${v.address || ''} ${v.name || ''}`.toLowerCase();

    if (str.includes('colombo') || str.includes('maradana') || str.includes('western') || str.includes('expert city')) {
      return 'Western Province';
    }
    if (str.includes('kandy') || str.includes('peradeniya') || str.includes('central')) {
      return 'Central Province';
    }
    if (str.includes('jaffna') || str.includes('palaly') || str.includes('northern')) {
      return 'Northern Province';
    }
    if (str.includes('galle') || str.includes('fort') || str.includes('southern')) {
      return 'Southern Province';
    }
    if (str.includes('kurunegala') || str.includes('wayamba') || str.includes('north western')) {
      return 'North Western Province';
    }
    return 'Western Province';
  };

  // Modal State for Venue Details & Booking Inquiry
  const [activeVenueModal, setActiveVenueModal] = useState(null);
  const [modalActivePhotoIndex, setModalActivePhotoIndex] = useState(0);
  const [showInquiryFormModal, setShowInquiryFormModal] = useState(false);
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
    // 0. Province Filter
    if (provinceFilter !== 'All') {
      const vProvince = getSpaceProvince(v);
      if (vProvince.toLowerCase() !== provinceFilter.toLowerCase()) return false;
    }

    // 1. Branch Filter
    if (selectedBranch !== 'All') {
      const vBranch = v.branch || 'TRACE Expert City (Colombo)';
      if (!vBranch.toLowerCase().includes(selectedBranch.toLowerCase())) return false;
    }

    // 2. Capacity Filter
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
    setModalActivePhotoIndex(0);
    setShowInquiryFormModal(false);
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

        {/* Single Horizontal Tab Spaces Filter Bar */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '1.25rem 1.5rem',
            marginBottom: '2rem',
            boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: '1rem',
              flexWrap: 'wrap',
            }}
          >
            {/* 1. Search Field */}
            <div style={{ flex: '1 1 200px', minWidth: '180px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: '700',
                  color: '#334155',
                  marginBottom: '0.4rem',
                }}
              >
                Search Spaces
              </label>
              <div style={{ position: 'relative', width: '100%' }}>
                <i
                  className="fa-solid fa-magnifying-glass"
                  style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#94a3b8',
                    fontSize: '0.88rem',
                  }}
                ></i>
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem 0.65rem 2.4rem',
                    fontSize: '0.86rem',
                    borderRadius: '20px',
                    border: '1px solid #cbd5e1',
                    outline: 'none',
                    background: '#ffffff',
                    color: '#0f172a',
                    fontWeight: '500',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            {/* 2. Province Selector */}
            <div style={{ flex: '1 1 180px', minWidth: '160px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: '700',
                  color: '#334155',
                  marginBottom: '0.4rem',
                }}
              >
                Province
              </label>
              <select
                value={provinceFilter}
                onChange={(e) => setProvinceFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  fontSize: '0.86rem',
                  fontWeight: '600',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#0f172a',
                  cursor: 'pointer',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              >
                <option value="All">All Sri Lanka</option>
                <option value="Western Province">Western Province (Colombo)</option>
                <option value="Central Province">Central Province (Kandy)</option>
                <option value="Northern Province">Northern Province (Jaffna)</option>
                <option value="Southern Province">Southern Province (Galle)</option>
                <option value="North Western Province">North Western Province (Kurunegala)</option>
                <option value="Eastern Province">Eastern Province</option>
                <option value="North Central Province">North Central Province</option>
                <option value="Uva Province">Uva Province</option>
                <option value="Sabaragamuwa Province">Sabaragamuwa Province</option>
              </select>
            </div>

            {/* 3. Branch Selector */}
            <div style={{ flex: '1 1 180px', minWidth: '160px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: '700',
                  color: '#334155',
                  marginBottom: '0.4rem',
                }}
              >
                TRACE Branch
              </label>
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  fontSize: '0.86rem',
                  fontWeight: '600',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#0f172a',
                  cursor: 'pointer',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              >
                <option value="All">All TRACE Hubs</option>
                <option value="TRACE Expert City">TRACE Expert City (Colombo)</option>
                <option value="CodeGen">CodeGen Hub (Bay 1-5)</option>
                <option value="LSEG">LSEG Branch (Bay 11-12)</option>
                <option value="Kandy">TRACE Innovation Hub (Kandy)</option>
                <option value="Galle">TRACE Coastal Hub (Galle)</option>
                <option value="Jaffna">TRACE Tech Park (Jaffna)</option>
                <option value="Wayamba">TRACE Wayamba Incubator</option>
              </select>
            </div>

            {/* 4. Capacity Selector */}
            <div style={{ flex: '1 1 150px', minWidth: '140px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: '700',
                  color: '#334155',
                  marginBottom: '0.4rem',
                }}
              >
                Capacity
              </label>
              <select
                value={capacityFilter}
                onChange={(e) => setCapacityFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  fontSize: '0.86rem',
                  fontWeight: '600',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#0f172a',
                  cursor: 'pointer',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              >
                <option value="All">Any Size</option>
                <option value="small">Small (&lt; 100 Seats)</option>
                <option value="medium">Medium (100-200)</option>
                <option value="large">Large (&gt; 200 Seats)</option>
              </select>
            </div>

            {/* 5. Filter Button & Clear Button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', paddingBottom: '2px' }}>
              <button
                type="button"
                className="btn btn-primary"
                style={{
                  backgroundColor: '#5d4df6',
                  color: '#ffffff',
                  borderRadius: '10px',
                  padding: '0.65rem 1.35rem',
                  fontSize: '0.88rem',
                  fontWeight: '700',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(93, 77, 246, 0.3)',
                }}
              >
                Filter
              </button>

              <button
                type="button"
                onClick={() => {
                  setProvinceFilter('All');
                  setSelectedBranch('All');
                  setCapacityFilter('All');
                  setSearchQuery('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  fontSize: '0.86rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  padding: '0.65rem 0.4rem',
                }}
              >
                Clear
              </button>
            </div>
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
                setProvinceFilter('All');
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                        <div className="venue-branch-tag" style={{ margin: 0 }}>
                          <i className={`fa-solid ${branchMeta?.icon || 'fa-building'}`}></i>
                          <span>{branchMeta?.shortName || venueBranchName}</span>
                        </div>
                        <span style={{ fontSize: '0.74rem', fontWeight: '700', color: '#5d4df6', background: '#eff6ff', border: '1px solid #dbeafe', padding: '2px 7px', borderRadius: '6px' }}>
                          📍 {getSpaceProvince(v)}
                        </span>
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
                      <FormattedText content={v.description} className="venue-card-description" />
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

      {/* 6. Venue Detail & Side-by-Side Showcase Modal */}
      {activeVenueModal && (
        <div className="modal-overlay" onClick={() => { setActiveVenueModal(null); setShowInquiryFormModal(false); }}>
          <div
            className="modal-card venue-split-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close"
              onClick={() => { setActiveVenueModal(null); setShowInquiryFormModal(false); }}
              style={{ zIndex: 10, background: '#ffffff', color: '#0f172a', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', top: '16px', right: '16px' }}
            >
              <i className="fa-solid fa-xmark"></i>
            </button>

            {/* Side-by-Side Split Container */}
            <div className="venue-split-grid">
              
              {/* LEFT SIDE: Space Details & Book Inquiry Trigger */}
              <div className="venue-split-left-details">
                <div>
                  {/* Header Badges */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                    <span style={{ background: '#eef2ff', color: '#5d4df6', fontWeight: '700', padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.78rem', border: '1px solid #c7d2fe', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                      <i className="fa-solid fa-building"></i> {activeVenueModal.branch || 'TRACE Expert City (Colombo)'}
                    </span>
                    <span style={{ fontSize: '0.76rem', fontWeight: '700', color: activeVenueModal.status === 'Available' ? '#059669' : '#d97706', background: activeVenueModal.status === 'Available' ? '#dcfce7' : '#fef3c7', padding: '0.3rem 0.8rem', borderRadius: '20px' }}>
                      ● {activeVenueModal.status || 'Available'}
                    </span>
                    <span style={{ fontSize: '0.76rem', fontWeight: '700', color: '#5d4df6', background: '#eff6ff', border: '1px solid #dbeafe', padding: '0.3rem 0.75rem', borderRadius: '20px' }}>
                      📍 {getSpaceProvince(activeVenueModal)}
                    </span>
                  </div>

                  {/* Space Title & Rental Price Tag */}
                  <h2 style={{ fontSize: 'clamp(1.3rem, 4vw, 1.65rem)', fontWeight: '800', color: '#0f172a', marginBottom: '0.4rem', lineHeight: 1.2 }}>
                    {activeVenueModal.name}
                  </h2>

                  <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#5d4df6', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <i className="fa-solid fa-tag"></i> {activeVenueModal.rentalPrice || (activeVenueModal.pricePerHour ? `Rs. ${activeVenueModal.pricePerHour.toLocaleString()} / hr` : 'Rs. 25,000 / hr')}
                  </div>

                  {/* Specs Chips Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem', background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <i className="fa-solid fa-users" style={{ color: '#5d4df6', fontSize: '1rem' }}></i>
                      <div>
                        <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block', fontWeight: '700', textTransform: 'uppercase' }}>Capacity</span>
                        <strong style={{ fontSize: '0.85rem', color: '#0f172a' }}>{activeVenueModal.capacity} Guests</strong>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <i className="fa-solid fa-location-dot" style={{ color: '#5d4df6', fontSize: '1rem' }}></i>
                      <div>
                        <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block', fontWeight: '700', textTransform: 'uppercase' }}>Location</span>
                        <strong style={{ fontSize: '0.85rem', color: '#0f172a' }}>{activeVenueModal.city || 'Colombo'}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Formatted Description (Renders clean text/formatting without showing raw HTML tags) */}
                  <div style={{ marginBottom: '1.1rem' }}>
                    <h4 style={{ fontSize: '0.8rem', fontWeight: '800', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <i className="fa-solid fa-circle-info" style={{ color: '#5d4df6' }}></i> Space Overview
                    </h4>
                    {activeVenueModal.description ? (
                      <div style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.55 }}>
                        <FormattedText content={activeVenueModal.description} className="space-modal-description-text" />
                      </div>
                    ) : (
                      <p style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.55 }}>
                        Enterprise auditorium & event venue equipped with modern AV, air conditioning, stage lighting, and high-speed fiber internet.
                      </p>
                    )}
                  </div>

                  {/* Amenities */}
                  {activeVenueModal.amenities && activeVenueModal.amenities.length > 0 && (
                    <div style={{ marginBottom: '0.85rem' }}>
                      <h4 style={{ fontSize: '0.8rem', fontWeight: '800', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <i className="fa-solid fa-sliders" style={{ color: '#5d4df6' }}></i> Included Facilities
                      </h4>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                        {activeVenueModal.amenities.map((am, i) => (
                          <span key={i} style={{ fontSize: '0.74rem', fontWeight: '700', color: '#334155', background: '#f1f5f9', padding: '3px 8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                            ✓ {am}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Book Space Inquiry Action Button */}
                <div style={{ marginTop: '1.25rem', paddingTop: '0.85rem', borderTop: '1px solid #eaecf0' }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => setShowInquiryFormModal(true)}
                    style={{
                      width: '100%',
                      padding: '0.85rem 1.25rem',
                      fontSize: '0.98rem',
                      fontWeight: '800',
                      borderRadius: '12px',
                      backgroundColor: '#5d4df6',
                      color: '#ffffff',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.6rem',
                      boxShadow: '0 4px 14px rgba(93, 77, 246, 0.35)',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <i className="fa-regular fa-paper-plane"></i> Book Space Inquiry Now
                  </button>
                </div>
              </div>

              {/* RIGHT SIDE: Interactive Multi-Photo Gallery Showcase (Displays ALL Uploaded Photos) */}
              <div className="venue-split-right-gallery">
                {/* Main Active Photo View */}
                <div style={{ flex: 1, position: 'relative', overflow: 'hidden', width: '100%', background: '#000000' }}>
                  <img
                    src={
                      (activeVenueModal.images && activeVenueModal.images[modalActivePhotoIndex]) ||
                      activeVenueModal.coverImage ||
                      'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=800&q=80'
                    }
                    alt={activeVenueModal.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transition: 'all 0.3s ease',
                    }}
                  />

                  {/* Left & Right Navigation Arrows if > 1 Photo */}
                  {activeVenueModal.images && activeVenueModal.images.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          setModalActivePhotoIndex((prev) =>
                            prev === 0 ? activeVenueModal.images.length - 1 : prev - 1
                          )
                        }
                        style={{
                          position: 'absolute',
                          left: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'rgba(15, 23, 42, 0.75)',
                          backdropFilter: 'blur(4px)',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '50%',
                          width: '36px',
                          height: '36px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.9rem',
                          zIndex: 5,
                        }}
                        title="Previous Photo"
                      >
                        <i className="fa-solid fa-chevron-left"></i>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setModalActivePhotoIndex((prev) =>
                            prev === activeVenueModal.images.length - 1 ? 0 : prev + 1
                          )
                        }
                        style={{
                          position: 'absolute',
                          right: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'rgba(15, 23, 42, 0.75)',
                          backdropFilter: 'blur(4px)',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '50%',
                          width: '36px',
                          height: '36px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.9rem',
                          zIndex: 5,
                        }}
                        title="Next Photo"
                      >
                        <i className="fa-solid fa-chevron-right"></i>
                      </button>

                      {/* Photo Counter Badge */}
                      <div
                        style={{
                          position: 'absolute',
                          top: '14px',
                          right: '14px',
                          background: 'rgba(15, 23, 42, 0.85)',
                          backdropFilter: 'blur(4px)',
                          color: '#ffffff',
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontSize: '0.76rem',
                          fontWeight: '700',
                          zIndex: 5,
                        }}
                      >
                        📸 {modalActivePhotoIndex + 1} / {activeVenueModal.images.length} Photos
                      </div>
                    </>
                  )}
                </div>

                {/* Bottom Interactive Thumbnail Bar if > 1 Photo */}
                {activeVenueModal.images && activeVenueModal.images.length > 1 && (
                  <div
                    style={{
                      background: 'rgba(15, 23, 42, 0.95)',
                      padding: '0.65rem 1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.6rem',
                      overflowX: 'auto',
                      borderTop: '1px solid #1e293b',
                    }}
                  >
                    {activeVenueModal.images.map((imgUrl, idx) => (
                      <img
                        key={idx}
                        src={imgUrl}
                        alt={`Thumbnail ${idx + 1}`}
                        onClick={() => setModalActivePhotoIndex(idx)}
                        style={{
                          width: '68px',
                          height: '48px',
                          objectFit: 'cover',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          border: modalActivePhotoIndex === idx ? '2px solid #5d4df6' : '2px solid transparent',
                          opacity: modalActivePhotoIndex === idx ? 1 : 0.55,
                          transition: 'all 0.2s ease',
                          flexShrink: 0,
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* 7. Short Booking Inquiry Popup Modal */}
      {showInquiryFormModal && activeVenueModal && (
        <div className="modal-overlay" onClick={() => setShowInquiryFormModal(false)} style={{ zIndex: 1100 }}>
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '580px', padding: '2rem', borderRadius: '16px' }}
          >
            <button
              className="modal-close"
              onClick={() => setShowInquiryFormModal(false)}
            >
              <i className="fa-solid fa-xmark"></i>
            </button>

            <div className="modal-header" style={{ marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fa-solid fa-calendar-check" style={{ color: '#5d4df6' }}></i>
                Quick Space Reservation Inquiry
              </h2>
              <p className="modal-sub">
                Submit inquiry for <strong style={{ color: '#5d4df6' }}>{activeVenueModal.name}</strong> ({activeVenueModal.branch || 'TRACE Expert City'})
              </p>
            </div>

            <form onSubmit={handleInquirySubmit}>
              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '0.85rem' }}>
                <div className="form-group">
                  <label htmlFor="inquiry-name" style={{ fontSize: '0.82rem', fontWeight: '700', marginBottom: '0.3rem', display: 'block' }}>Your Full Name *</label>
                  <input
                    type="text"
                    id="inquiry-name"
                    required
                    placeholder="e.g. Kasun Perera"
                    value={inquiryForm.name}
                    onChange={(e) => setInquiryForm({ ...inquiryForm, name: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="inquiry-email" style={{ fontSize: '0.82rem', fontWeight: '700', marginBottom: '0.3rem', display: 'block' }}>Email Address *</label>
                  <input
                    type="email"
                    id="inquiry-email"
                    required
                    placeholder="kasun@techstartup.lk"
                    value={inquiryForm.email}
                    onChange={(e) => setInquiryForm({ ...inquiryForm, email: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '0.85rem' }}>
                <div className="form-group">
                  <label htmlFor="inquiry-phone" style={{ fontSize: '0.82rem', fontWeight: '700', marginBottom: '0.3rem', display: 'block' }}>Phone Number *</label>
                  <input
                    type="tel"
                    id="inquiry-phone"
                    required
                    placeholder="+94 77 123 4567"
                    value={inquiryForm.phone}
                    onChange={(e) => setInquiryForm({ ...inquiryForm, phone: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="inquiry-date" style={{ fontSize: '0.82rem', fontWeight: '700', marginBottom: '0.3rem', display: 'block' }}>Target Event Date *</label>
                  <input
                    type="date"
                    id="inquiry-date"
                    required
                    value={inquiryForm.eventDate}
                    onChange={(e) => setInquiryForm({ ...inquiryForm, eventDate: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '0.85rem' }}>
                <label htmlFor="inquiry-title" style={{ fontSize: '0.82rem', fontWeight: '700', marginBottom: '0.3rem', display: 'block' }}>Event Title / Purpose *</label>
                <input
                  type="text"
                  id="inquiry-title"
                  required
                  placeholder="e.g. Annual Developer Summit 2026"
                  value={inquiryForm.eventTitle}
                  onChange={(e) => setInquiryForm({ ...inquiryForm, eventTitle: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '0.85rem' }}>
                <div className="form-group">
                  <label htmlFor="inquiry-hours" style={{ fontSize: '0.82rem', fontWeight: '700', marginBottom: '0.3rem', display: 'block' }}>Duration (Hours) *</label>
                  <input
                    type="number"
                    id="inquiry-hours"
                    required
                    min="1"
                    max="24"
                    placeholder="4"
                    value={inquiryForm.durationHours}
                    onChange={(e) => setInquiryForm({ ...inquiryForm, durationHours: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="inquiry-guests" style={{ fontSize: '0.82rem', fontWeight: '700', marginBottom: '0.3rem', display: 'block' }}>Expected Attendees</label>
                  <input
                    type="number"
                    id="inquiry-guests"
                    placeholder="50"
                    value={inquiryForm.guests}
                    onChange={(e) => setInquiryForm({ ...inquiryForm, guests: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              {/* Estimated Cost Preview */}
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '0.75rem 1rem', borderRadius: '10px', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.4rem' }}>
                <span style={{ fontSize: '0.82rem', color: '#166534', fontWeight: '600' }}>
                  <i className="fa-solid fa-calculator" style={{ marginRight: '6px' }}></i> Estimated Rental Cost:
                </span>
                <strong style={{ fontSize: '0.92rem', color: '#15803d' }}>
                  Rs. {((activeVenueModal?.pricePerHour || 25000) * (Number(inquiryForm.durationHours) || 4)).toLocaleString()} ({inquiryForm.durationHours || 4} hrs @ Rs. {(activeVenueModal?.pricePerHour || 25000).toLocaleString()}/hr)
                </strong>
              </div>

              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label htmlFor="inquiry-notes" style={{ fontSize: '0.82rem', fontWeight: '700', marginBottom: '0.3rem', display: 'block' }}>Special Notes (Optional)</label>
                <textarea
                  id="inquiry-notes"
                  rows="2"
                  placeholder="e.g. Need live streaming setup, stage lighting..."
                  value={inquiryForm.notes}
                  onChange={(e) => setInquiryForm({ ...inquiryForm, notes: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                ></textarea>
              </div>

              <div className="form-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowInquiryFormModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ backgroundColor: '#5d4df6' }}
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
                <span style={{ fontSize: '1rem', fontWeight: '800', color: '#5d4df6', background: '#eff6ff', padding: '0.2rem 0.6rem', borderRadius: '6px' }}>
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
