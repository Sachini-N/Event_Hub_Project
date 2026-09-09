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
  const [venues, setVenues] = useState(() => {
    try {
      const cached = sessionStorage.getItem('eventhub_cached_venues');
      return cached ? JSON.parse(cached) : [];
    } catch (e) {
      return [];
    }
  });
  const [loading, setLoading] = useState(() => {
    try {
      const cached = sessionStorage.getItem('eventhub_cached_venues');
      const parsed = cached ? JSON.parse(cached) : [];
      return !(Array.isArray(parsed) && parsed.length > 0);
    } catch (e) {
      return true;
    }
  });
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
  const [modalActiveTab, setModalActiveTab] = useState('details'); // 'details' | 'booking'
  const [inquiryForm, setInquiryForm] = useState({
    name: '',
    email: '',
    phone: '',
    eventTitle: '',
    eventDate: '',
    durationHours: '4',
    guests: '50',
    notes: '',
  });
  const [isSubmittingInquiry, setIsSubmittingInquiry] = useState(false);

  // Helper to get database uploaded images ONLY for the venue space
  const getModalImages = (venue) => {
    if (!venue) return [];
    
    // 1. Array of images uploaded to database
    if (Array.isArray(venue.images) && venue.images.length > 0) {
      const validDbImages = venue.images.filter(img => typeof img === 'string' && img.trim().length > 0);
      if (validDbImages.length > 0) return validDbImages;
    }

    // 2. Single cover image uploaded to database
    if (venue.coverImage && typeof venue.coverImage === 'string' && venue.coverImage.trim().length > 0) {
      return [venue.coverImage.trim()];
    }

    // 3. Single fallback image if database has no photos uploaded
    return [
      'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1200&q=80',
    ];
  };

  // Automatic photo rotation every 4.5 seconds for spaces modal
  useEffect(() => {
    if (!activeVenueModal) return;
    const imgs = getModalImages(activeVenueModal);
    if (imgs.length <= 1) return;

    const timer = setInterval(() => {
      setModalActivePhotoIndex((prev) => (prev + 1) % imgs.length);
    }, 4500);

    return () => clearInterval(timer);
  }, [activeVenueModal]);

  const fetchVenues = async () => {
    if (venues.length === 0) {
      setLoading(true);
    }
    try {
      const res = await fetch('/api/venues');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setVenues(data.data);
        try {
          sessionStorage.setItem('eventhub_cached_venues', JSON.stringify(data.data));
        } catch (e) {}
      }
    } catch (err) {
      console.error('Error fetching venues:', err);
      if (showToast && venues.length === 0) showToast('Failed to load venue listings', 'error');
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
      const p = getSpaceProvince(v);
      if (p.toLowerCase() !== provinceFilter.toLowerCase()) return false;
    }

    // 1. Branch Filter
    if (selectedBranch !== 'All') {
      const vBranch = (v.branch || '').toLowerCase();
      const target = selectedBranch.toLowerCase();
      if (!vBranch.includes(target) && !target.includes(vBranch)) return false;
    }

    // 2. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const name = (v.name || '').toLowerCase();
      const address = (v.address || '').toLowerCase();
      const desc = (v.description || '').toLowerCase();
      const branch = (v.branch || '').toLowerCase();
      const province = getSpaceProvince(v).toLowerCase();
      if (!name.includes(q) && !address.includes(q) && !desc.includes(q) && !branch.includes(q) && !province.includes(q)) {
        return false;
      }
    }

    // 3. Capacity Filter
    if (capacityFilter !== 'All') {
      const cap = Number(v.capacity) || 0;
      if (capacityFilter === 'small' && cap >= 100) return false;
      if (capacityFilter === 'medium' && (cap < 100 || cap > 200)) return false;
      if (capacityFilter === 'large' && cap <= 200) return false;
    }

    // 4. Status Filter
    if (statusFilter !== 'All') {
      if ((v.status || 'Available').toLowerCase() !== statusFilter.toLowerCase()) return false;
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

  const handleSwitchTab = (tabName) => {
    setModalActiveTab(tabName);
    setTimeout(() => {
      const overlayElem = document.querySelector('.modal-overlay');
      if (overlayElem) overlayElem.scrollTop = 0;
      const cardElem = document.querySelector('.venue-split-modal-card');
      if (cardElem) cardElem.scrollTop = 0;
    }, 10);
  };

  const handleOpenInquiryModal = (venue, initialTab = 'details') => {
    setActiveVenueModal(venue);
    setModalActivePhotoIndex(0);
    handleSwitchTab(initialTab);
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

  const handleClearFilters = () => {
    setProvinceFilter('All');
    setSelectedBranch('All');
    setCapacityFilter('All');
    setStatusFilter('All');
    setSearchQuery('');
  };

  return (
    <div className="upcoming-events-page spaces-page">
      {/* Main Content Area */}
      <div className="section-container">
        {/* Page Title & Subtitle Header */}
        <div className="page-header">
          <h1 className="page-title">Spaces & Facilities</h1>
          <p className="page-subtitle">
            Explore world-class auditoriums, technology labs, and facilities stationed across TRACE branches.
          </p>
        </div>

        {/* Single Horizontal Tab Spaces Filter Bar */}
        <div className="filter-bar-container">
          {/* 1. Search Field */}
          <div className="filter-item">
            <label htmlFor="spaces-filter-search">Search Spaces</label>
            <div className="search-input-wrapper">
              <i className="fa-solid fa-magnifying-glass search-icon"></i>
              <input
                type="text"
                id="spaces-filter-search"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* 2. Province Selector */}
          <div className="filter-item">
            <label htmlFor="spaces-filter-province">Province</label>
            <div className="select-wrapper">
              <select
                id="spaces-filter-province"
                value={provinceFilter}
                onChange={(e) => setProvinceFilter(e.target.value)}
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
              <i className="fa-solid fa-chevron-down select-arrow"></i>
            </div>
          </div>

          {/* 3. Branch Selector */}
          <div className="filter-item">
            <label htmlFor="spaces-filter-branch">TRACE Branch</label>
            <div className="select-wrapper">
              <select
                id="spaces-filter-branch"
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
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
              <i className="fa-solid fa-chevron-down select-arrow"></i>
            </div>
          </div>

          {/* 4. Capacity Selector */}
          <div className="filter-item">
            <label htmlFor="spaces-filter-capacity">Capacity</label>
            <div className="select-wrapper">
              <select
                id="spaces-filter-capacity"
                value={capacityFilter}
                onChange={(e) => setCapacityFilter(e.target.value)}
              >
                <option value="All">Any Size</option>
                <option value="small">Small (&lt; 100 Seats)</option>
                <option value="medium">Medium (100-200)</option>
                <option value="large">Large (&gt; 200 Seats)</option>
              </select>
              <i className="fa-solid fa-chevron-down select-arrow"></i>
            </div>
          </div>

          {/* 5. Filter Button & Clear Button */}
          <div className="filter-actions">
            <button
              type="button"
              className="btn-filter-submit"
              onClick={() => { }}
            >
              Filter
            </button>
            <button
              type="button"
              className="btn-filter-clear"
              onClick={handleClearFilters}
            >
              Clear
            </button>
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
                        className={`venue-status-pill ${v.status === 'Available'
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
                        onClick={() => handleOpenInquiryModal(v, 'details')}
                      >
                        <i className="fa-solid fa-eye"></i> View Space Details & Photos
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 6. Modern Unified Space Showcase & Reservation Modal */}
      {activeVenueModal && (
        <div
          className="modal-overlay"
          onClick={() => setActiveVenueModal(null)}
          style={{ zIndex: 1050 }}
        >
          <div
            className="modal-card venue-split-modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{ position: 'relative', overflow: 'hidden' }}
          >
            {/* Floating Close Button */}
            <button
              className="modal-close"
              onClick={() => setActiveVenueModal(null)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'rgba(241, 245, 249, 0.95)',
                backdropFilter: 'blur(4px)',
                color: '#0f172a',
                border: '1px solid #cbd5e1',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0,
                fontSize: '1.1rem',
                transition: 'all 0.2s ease',
                zIndex: 20,
              }}
              title="Close modal"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>

            {/* SPACE DETAILS & DATABASE PHOTO GALLERY (SIDE-BY-SIDE 2-COLUMN SPLIT) */}
            <div className="venue-split-grid" style={{ gridTemplateColumns: '1fr 1fr', maxHeight: '88vh' }}>
              
              {/* LEFT SIDE: DATABASE UPLOADED PHOTO GALLERY SHOWCASE */}
              <div className="venue-split-left-gallery" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', borderRight: '1px solid #e2e8f0', overflowY: 'auto' }}>
                {(() => {
                  const modalImages = getModalImages(activeVenueModal);
                  const currentImg = modalImages[modalActivePhotoIndex] || modalImages[0];

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                      {/* Main Active Photo View */}
                      <div style={{ position: 'relative', overflow: 'hidden', width: '100%', height: '480px', borderRadius: '16px', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(0,0,0,0.12)' }}>
                        <img
                          key={modalActivePhotoIndex}
                          src={currentImg}
                          alt={`${activeVenueModal.name} view ${modalActivePhotoIndex + 1}`}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            transition: 'opacity 0.3s ease',
                          }}
                        />

                        {/* Navigation Arrows (Only shown if multiple DB images exist) */}
                        {modalImages.length > 1 && (
                          <>
                            {/* Left Arrow */}
                            <button
                              type="button"
                              onClick={() =>
                                setModalActivePhotoIndex((prev) =>
                                  prev === 0 ? modalImages.length - 1 : prev - 1
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
                                border: '1px solid rgba(255, 255, 255, 0.25)',
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

                            {/* Right Arrow */}
                            <button
                              type="button"
                              onClick={() =>
                                setModalActivePhotoIndex((prev) =>
                                  prev === modalImages.length - 1 ? 0 : prev + 1
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
                                border: '1px solid rgba(255, 255, 255, 0.25)',
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

                            {/* Counter Badge */}
                            <div
                              style={{
                                position: 'absolute',
                                top: '12px',
                                right: '12px',
                                background: 'rgba(15, 23, 42, 0.85)',
                                backdropFilter: 'blur(6px)',
                                color: '#ffffff',
                                padding: '4px 12px',
                                borderRadius: '20px',
                                fontSize: '0.75rem',
                                fontWeight: '700',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                zIndex: 5,
                              }}
                            >
                              📷 {modalActivePhotoIndex + 1} / {modalImages.length}
                            </div>
                          </>
                        )}
                      </div>

                      {/* Clickable Photo Thumbnails Row (Only rendered if multiple DB images exist) */}
                      {modalImages.length > 1 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', overflowX: 'auto', paddingBottom: '4px' }}>
                          {modalImages.map((imgUrl, idx) => (
                            <div
                              key={idx}
                              onClick={() => setModalActivePhotoIndex(idx)}
                              style={{
                                width: '74px',
                                height: '52px',
                                borderRadius: '8px',
                                overflow: 'hidden',
                                cursor: 'pointer',
                                border: modalActivePhotoIndex === idx ? '2.5px solid #5d4df6' : '1px solid #cbd5e1',
                                opacity: modalActivePhotoIndex === idx ? 1 : 0.65,
                                transition: 'all 0.2s ease',
                                flexShrink: 0,
                                background: '#0f172a',
                              }}
                            >
                              <img
                                src={imgUrl}
                                alt={`Thumbnail ${idx + 1}`}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* RIGHT SIDE: VENUE NAME, SPECIFICATIONS & DETAILS DISPLAY */}
              <div className="venue-split-right-details" style={{ padding: '1.75rem 2rem 1.75rem 1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', overflowY: 'auto', background: '#ffffff' }}>
                
                {/* 1. SPACE NAME & TOP BADGES */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', paddingRight: '2.5rem' }}>
                  <h2 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a', margin: 0, lineHeight: 1.2, letterSpacing: '-0.02em' }}>
                    {activeVenueModal.name}
                  </h2>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ background: '#eef2ff', color: '#5d4df6', fontWeight: '700', padding: '0.25rem 0.65rem', borderRadius: '20px', fontSize: '0.76rem', border: '1px solid #c7d2fe', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                      <i className="fa-solid fa-building"></i> {activeVenueModal.branch || 'TRACE Expert City'}
                    </span>
                    <span style={{ fontSize: '0.76rem', fontWeight: '700', color: activeVenueModal.status === 'Available' ? '#059669' : '#d97706', background: activeVenueModal.status === 'Available' ? '#dcfce7' : '#fef3c7', padding: '0.25rem 0.65rem', borderRadius: '20px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      ● {activeVenueModal.status || 'Available'}
                    </span>
                    <span style={{ fontSize: '0.82rem', fontWeight: '800', color: '#059669', background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '0.25rem 0.65rem', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                      <i className="fa-solid fa-tag"></i> {activeVenueModal.rentalPrice || (activeVenueModal.pricePerHour ? `Rs. ${activeVenueModal.pricePerHour.toLocaleString()} / hr` : 'Rs. 25,000 / hr')}
                    </span>
                  </div>

                  {/* Province, Capacity & Location Address */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.2rem' }}>
                    <span style={{ fontSize: '0.76rem', fontWeight: '700', color: '#5d4df6', background: '#eff6ff', border: '1px solid #dbeafe', padding: '0.25rem 0.65rem', borderRadius: '20px' }}>
                      📍 {getSpaceProvince(activeVenueModal)}
                    </span>
                    <span style={{ fontSize: '0.76rem', fontWeight: '700', color: '#0052cc', background: '#e0f2fe', border: '1px solid #bae6fd', padding: '0.25rem 0.65rem', borderRadius: '20px' }}>
                      👥 Capacity: {activeVenueModal.capacity} Guests
                    </span>
                    <span style={{ fontSize: '0.82rem', color: '#475569', fontWeight: '600' }}>
                      <i className="fa-solid fa-location-dot" style={{ color: '#64748b', marginRight: '4px' }}></i>
                      {activeVenueModal.address}
                    </span>
                  </div>
                </div>

                {/* 2. SPACE OVERVIEW DESCRIPTION */}
                <div>
                  <h4 style={{ fontSize: '0.82rem', fontWeight: '800', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <i className="fa-solid fa-circle-info" style={{ color: '#0052cc' }}></i> Space Overview
                  </h4>
                  {activeVenueModal.description ? (
                    <div style={{ fontSize: '0.86rem', color: '#475569', lineHeight: 1.55 }}>
                      <FormattedText content={activeVenueModal.description} className="space-modal-description-text" />
                    </div>
                  ) : (
                    <p style={{ fontSize: '0.86rem', color: '#475569', lineHeight: 1.55, margin: 0 }}>
                      Enterprise auditorium & event venue equipped with modern AV, air conditioning, stage lighting, and high-speed fiber internet.
                    </p>
                  )}
                </div>

                {/* 3. INCLUDED FACILITIES & AMENITIES */}
                {activeVenueModal.amenities && activeVenueModal.amenities.length > 0 && (
                  <div>
                    <h4 style={{ fontSize: '0.82rem', fontWeight: '800', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <i className="fa-solid fa-sliders" style={{ color: '#0052cc' }}></i> Included Facilities
                    </h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                      {activeVenueModal.amenities.map((am, i) => (
                        <span key={i} style={{ fontSize: '0.76rem', fontWeight: '700', color: '#334155', background: '#f1f5f9', padding: '4px 9px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                          ✓ {am}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. VENUE COORDINATOR CONTACT */}
                <div style={{ background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid #e2e8f0', marginTop: 'auto' }}>
                  <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Venue Coordinator</span>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.2rem' }}>
                    <strong style={{ fontSize: '0.86rem', color: '#0f172a' }}>Senal (TRACE Facilities)</strong>
                    <a href="tel:+94766433975" style={{ fontSize: '0.82rem', color: '#0052cc', textDecoration: 'none', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <i className="fa-solid fa-phone"></i> +94 76 643 3975
                    </a>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
