import React, { useState, useEffect, useRef } from 'react';

// Interactive Location Picker Map Component (OpenStreetMap + Leaflet + Nominatim Reverse Geocoding)
function InteractiveLocationPicker({ onSelectAddress, onSelectVenue }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  const [loadingGeo, setLoadingGeo] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadAndInitMap = async () => {
      // Inject Leaflet CSS
      if (!document.getElementById('leaflet-css-cdn')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css-cdn';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      // Inject Leaflet JS if not ready
      if (!window.L) {
        await new Promise((resolve) => {
          const script = document.createElement('script');
          script.id = 'leaflet-js-cdn';
          script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
          script.onload = () => resolve();
          document.body.appendChild(script);
        });
      }

      if (isMounted && window.L && mapContainerRef.current && !mapInstanceRef.current) {
        const L = window.L;
        const defaultLat = 6.9344;
        const defaultLng = 79.8553;

        const map = L.map(mapContainerRef.current).setView([defaultLat, defaultLng], 14);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap contributors',
        }).addTo(map);

        const customPinHtml = `<div style="background:#0052cc;width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#ffffff;box-shadow:0 4px 14px rgba(0,82,204,0.5);border:2px solid #ffffff;"><i class="fa-solid fa-location-dot" style="font-size:17px;"></i></div>`;

        const pinIcon = L.divIcon({
          className: 'custom-map-pin',
          html: customPinHtml,
          iconSize: [34, 34],
          iconAnchor: [17, 34],
        });

        const marker = L.marker([defaultLat, defaultLng], { icon: pinIcon, draggable: true }).addTo(map);
        markerRef.current = marker;
        mapInstanceRef.current = map;

        const handleCoordsChange = async (lat, lng) => {
          setLoadingGeo(true);
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`);
            const data = await res.json();
            if (data && data.display_name) {
              const fullAddr = data.display_name;
              if (onSelectAddress) onSelectAddress(fullAddr);
              if (onSelectVenue && data.address) {
                const venueNameStr = data.address.amenity || data.address.building || data.address.suburb || data.address.road || '';
                if (venueNameStr) onSelectVenue(venueNameStr);
              }
            }
          } catch (err) {
            console.error('Reverse geocoding error:', err);
          } finally {
            setLoadingGeo(false);
          }
        };

        map.on('click', (e) => {
          const { lat, lng } = e.latlng;
          marker.setLatLng([lat, lng]);
          handleCoordsChange(lat, lng);
        });

        marker.on('dragend', () => {
          const pos = marker.getLatLng();
          handleCoordsChange(pos.lat, pos.lng);
        });
      }
    };

    loadAndInitMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const handlePresetLocation = (lat, lng, venueNameStr, addressStr) => {
    if (mapInstanceRef.current && markerRef.current && window.L) {
      mapInstanceRef.current.setView([lat, lng], 15);
      markerRef.current.setLatLng([lat, lng]);
      if (onSelectAddress) onSelectAddress(addressStr);
      if (onSelectVenue && venueNameStr) onSelectVenue(venueNameStr);
    }
  };

  return (
    <div className="interactive-map-picker-wrapper" style={{ marginTop: '0.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <i className="fa-solid fa-map-location-dot" style={{ color: '#0052cc' }}></i>
          Click Map or Drag Pin to Auto-Fill Address
        </label>
        {loadingGeo && (
          <span style={{ fontSize: '0.78rem', color: '#0052cc', fontWeight: '700' }}>
            <i className="fa-solid fa-spinner fa-spin"></i> Auto-filling address...
          </span>
        )}
      </div>

      <div
        ref={mapContainerRef}
        style={{
          width: '100%',
          height: '240px',
          borderRadius: '12px',
          overflow: 'hidden',
          border: '1px solid #cbd5e1',
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
        }}
      ></div>

      {/* TRACE Expert City Companies & Bays Quick Selector */}
      <div style={{ marginTop: '0.85rem', padding: '0.75rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
        <label style={{ fontSize: '0.78rem', fontWeight: '800', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.4rem' }}>
          <i className="fa-solid fa-building" style={{ color: '#0052cc' }}></i>
          TRACE Expert City Company / Bay Location
        </label>
        <select
          style={{
            width: '100%',
            padding: '0.45rem 0.75rem',
            fontSize: '0.85rem',
            borderRadius: '6px',
            border: '1px solid #cbd5e1',
            background: '#ffffff',
            color: '#1e293b',
            fontWeight: '600',
            cursor: 'pointer',
          }}
          defaultValue=""
          onChange={(e) => {
            if (!e.target.value) return;
            const item = JSON.parse(e.target.value);
            handlePresetLocation(item.lat, item.lng, item.venue, item.address);
          }}
        >
          <option value="" disabled>-- Select a TRACE Expert City Company / Bay --</option>
          <option value={JSON.stringify({ lat: 6.9344, lng: 79.8553, venue: 'Bay 07 - TRACE Main Auditorium', address: 'Bay 07, TRACE Expert City, Maradana Road, Colombo 01000, Sri Lanka' })}>
            📍 Bay 07 - TRACE Main Auditorium & Event Center
          </option>
          <option value={JSON.stringify({ lat: 6.9346, lng: 79.8555, venue: 'CodeGen International (Bay 01-04)', address: 'CodeGen International, Bay 01-04, TRACE Expert City, Colombo 01000, Sri Lanka' })}>
            💻 CodeGen International (Bay 01-04)
          </option>
          <option value={JSON.stringify({ lat: 6.9342, lng: 79.8551, venue: 'LSEG Sri Lanka (Bay 11-12)', address: 'London Stock Exchange Group (LSEG), Bay 11-12, TRACE Expert City, Colombo 01000' })}>
            📈 LSEG Sri Lanka (London Stock Exchange Group)
          </option>
          <option value={JSON.stringify({ lat: 6.9345, lng: 79.8554, venue: 'Sysco LABS (Bay 05)', address: 'Sysco LABS Sri Lanka, Bay 05, TRACE Expert City, Colombo 01000, Sri Lanka' })}>
            🍔 Sysco LABS Sri Lanka (Bay 05)
          </option>
          <option value={JSON.stringify({ lat: 6.9343, lng: 79.8552, venue: 'WSO2 Innovation Hub (Bay 08)', address: 'WSO2 Sri Lanka, Bay 08, TRACE Expert City, Colombo 01000, Sri Lanka' })}>
            🚀 WSO2 Innovation Hub (Bay 08)
          </option>
          <option value={JSON.stringify({ lat: 6.9341, lng: 79.8550, venue: 'Calcey Technologies (Bay 09)', address: 'Calcey Technologies, Bay 09, TRACE Expert City, Colombo 01000, Sri Lanka' })}>
            ⚙️ Calcey Technologies (Bay 09)
          </option>
          <option value={JSON.stringify({ lat: 6.9340, lng: 79.8549, venue: 'Pearson Sri Lanka (Bay 10)', address: 'Pearson Sri Lanka, Bay 10, TRACE Expert City, Colombo 01000, Sri Lanka' })}>
            📚 Pearson Sri Lanka (Bay 10)
          </option>
          <option value={JSON.stringify({ lat: 6.9344, lng: 79.8553, venue: 'Zone24x7 / Venture Engine (Bay 06)', address: 'Zone24x7, Bay 06, TRACE Expert City, Colombo 01000, Sri Lanka' })}>
            ⚡ Zone24x7 / Venture Engine (Bay 06)
          </option>
          <option value={JSON.stringify({ lat: 6.9344, lng: 79.8552, venue: 'TRACE Open Amphitheatre', address: 'TRACE Central Lawn & Open Amphitheatre, TRACE Expert City, Colombo 01000' })}>
            🎭 TRACE Open Amphitheatre & Central Lawn
          </option>
        </select>
      </div>

      {/* Preset Location Chips */}
      <div style={{ marginTop: '0.75rem' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Quick TRACE Company Chips:
        </span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.35rem' }}>
          <button
            type="button"
            className="btn-location-chip"
            onClick={() => handlePresetLocation(6.9344, 79.8553, 'Bay 07 - TRACE Auditorium', 'Bay 07, TRACE Expert City, Maradana Rd, Colombo 01000, Sri Lanka')}
          >
            🏛️ TRACE Bay 07
          </button>
          <button
            type="button"
            className="btn-location-chip"
            onClick={() => handlePresetLocation(6.9346, 79.8555, 'CodeGen (Bay 01-04)', 'CodeGen International, Bay 01-04, TRACE Expert City, Colombo 01000')}
          >
            💻 CodeGen
          </button>
          <button
            type="button"
            className="btn-location-chip"
            onClick={() => handlePresetLocation(6.9342, 79.8551, 'LSEG Sri Lanka', 'LSEG Sri Lanka, Bay 11-12, TRACE Expert City, Colombo 01000')}
          >
            📈 LSEG
          </button>
          <button
            type="button"
            className="btn-location-chip"
            onClick={() => handlePresetLocation(6.9345, 79.8554, 'Sysco LABS', 'Sysco LABS, Bay 05, TRACE Expert City, Colombo 01000')}
          >
            🍔 Sysco LABS
          </button>
          <button
            type="button"
            className="btn-location-chip"
            onClick={() => handlePresetLocation(6.9343, 79.8552, 'WSO2', 'WSO2 Sri Lanka, Bay 08, TRACE Expert City, Colombo 01000')}
          >
            🚀 WSO2
          </button>
          <button
            type="button"
            className="btn-location-chip"
            onClick={() => handlePresetLocation(6.9341, 79.8550, 'Calcey', 'Calcey Technologies, Bay 09, TRACE Expert City, Colombo 01000')}
          >
            ⚙️ Calcey
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CreateEventPage({ onCancel, onEventCreated, showToast, currentUser }) {
  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Select a category');
  const [shortDescription, setShortDescription] = useState('');
  const [fullDescription, setFullDescription] = useState('');

  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [venueName, setVenueName] = useState('');
  const [fullAddress, setFullAddress] = useState('');

  const [speakerName, setSpeakerName] = useState('');
  const [speakerRole, setSpeakerRole] = useState('');
  const [speakerBio, setSpeakerBio] = useState('');
  const [speakerAvatar, setSpeakerAvatar] = useState('');

  const [coverImage, setCoverImage] = useState('');
  const [coverFileName, setCoverFileName] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [enableRegistration, setEnableRegistration] = useState(true);
  const [capacity, setCapacity] = useState(100);
  const [deadline, setDeadline] = useState('');

  const [submitting, setSubmitting] = useState(false);

  // Image File Compression Helper (Resizes large photos into lightweight JPEGs)
  const compressImageFile = (file, maxWidth, maxHeight, quality, onSuccess) => {
    const reader = new FileReader();
    reader.onerror = () => {
      if (showToast) showToast('Error reading image file', 'error');
    };
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = () => {
        if (showToast) showToast('Invalid image format', 'error');
      };
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        onSuccess(dataUrl);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Cover Image File Upload Handler
  const handleImageFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setCoverFileName(file.name);
    compressImageFile(file, 1200, 800, 0.8, (compressedBase64) => {
      setCoverImage(compressedBase64);
      if (showToast) showToast('Cover image optimized & loaded!', 'success');
    });
  };

  // Speaker Avatar File Upload Handler
  const handleSpeakerAvatarFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    compressImageFile(file, 400, 400, 0.85, (compressedBase64) => {
      setSpeakerAvatar(compressedBase64);
      if (showToast) showToast('Speaker photo optimized & loaded!', 'success');
    });
  };

  // Form Submit Handler
  const handleSubmit = async (isDraft = false) => {
    if (!title.trim()) {
      if (showToast) showToast('Please enter an Event Title', 'error');
      return;
    }
    if (!date) {
      if (showToast) showToast('Please select an Event Date', 'error');
      return;
    }

    setSubmitting(true);

    const eventLocation = venueName.trim()
      ? `${venueName.trim()}${fullAddress.trim() ? ', ' + fullAddress.trim() : ''}`
      : fullAddress.trim() || 'TRACE Expert City, Colombo';

    const formattedTime =
      startTime && endTime
        ? `${startTime} - ${endTime}`
        : startTime || '09:00 AM';

    let isoDate;
    try {
      isoDate = date ? new Date(date).toISOString() : new Date().toISOString();
    } catch (err) {
      isoDate = new Date().toISOString();
    }

    const payload = {
      title: title.trim(),
      category: category !== 'Select a category' ? category : 'Workshop',
      status: isDraft ? 'draft' : (new Date(isoDate) < new Date() ? 'past' : 'upcoming'),
      date: isoDate,
      time: formattedTime,
      location: eventLocation,
      description: fullDescription.trim() || shortDescription.trim() || 'Join us for this exciting TRACE event!',
      shortDescription: shortDescription.trim(),
      capacity: parseInt(capacity, 10) || 100,
      registeredCount: 0,
      createdBy: currentUser?.name || currentUser?.email || 'Uploaded Event',
      coverImage:
        coverImage ||
        'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80',
      videoUrl: videoUrl.trim(),
      speaker: speakerName.trim()
        ? {
            name: speakerName.trim(),
            role: speakerRole.trim() || 'Guest Speaker',
            bio: speakerBio.trim() || '',
            avatar:
              speakerAvatar ||
              'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
          }
        : null,
    };

    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        if (showToast) {
          showToast(
            isDraft
              ? 'Event saved as draft in MongoDB!'
              : 'New Event published successfully to MongoDB!',
            'success'
          );
        }
        if (onEventCreated) onEventCreated();
      } else {
        const detailedMsg = result.error ? `${result.message}: ${result.error}` : (result.message || 'Failed to publish event');
        if (showToast) showToast(detailedMsg, 'error');
      }
    } catch (error) {
      console.error('Error publishing event:', error);
      if (showToast) showToast(`Failed to publish event: ${error.message || 'Please check fields'}`, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="create-event-page">
      {/* Top Header & Actions Bar */}
      <div className="create-event-header">
        <div>
          <h1 className="create-event-title">Create New Event</h1>
          <p className="create-event-sub">
            Fill in the details below to publish a new event on the TRACE platform.
          </p>
        </div>

        <div className="create-event-top-actions">
          <button
            type="button"
            className="btn-create-cancel"
            onClick={onCancel}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn-create-draft"
            onClick={() => handleSubmit(true)}
            disabled={submitting}
          >
            Save Draft
          </button>
          <button
            type="button"
            className="btn-create-publish"
            onClick={() => handleSubmit(false)}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <i className="fa-solid fa-spinner fa-spin"></i> Publishing...
              </>
            ) : (
              <>
                <i className="fa-solid fa-rocket"></i> Publish Event
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2-Column Grid (4 Card Blocks) */}
      <div className="create-event-grid">
        {/* LEFT COLUMN */}
        <div className="create-column">
          {/* Block 1: Basic Information */}
          <div className="create-card-block">
            <div className="block-title-row">
              <i className="fa-regular fa-circle-info block-icon"></i>
              <h3>Basic Information</h3>
            </div>

            <div className="profile-form-group" style={{ marginBottom: '1.25rem' }}>
              <label htmlFor="evt-title">Event Title *</label>
              <input
                type="text"
                id="evt-title"
                required
                placeholder="e.g., Annual Tech Symposium 2024"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="profile-form-group" style={{ marginBottom: '1.25rem' }}>
              <label htmlFor="evt-category">Category *</label>
              <select
                id="evt-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="Select a category" disabled>
                  Select a category
                </option>
                <option value="Workshop">Workshop</option>
                <option value="Meetup">Meetup</option>
                <option value="Talk">Talk</option>
                <option value="Keynote">Keynote</option>
                <option value="Hackathon">Hackathon</option>
                <option value="Sprint">Sprint</option>
              </select>
            </div>

            <div className="profile-form-group" style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label htmlFor="evt-excerpt">Short Description (Excerpt)</label>
                <span className="char-count">{shortDescription.length}/150 chars</span>
              </div>
              <textarea
                id="evt-excerpt"
                rows="2"
                maxLength="150"
                placeholder="A brief summary for event cards..."
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
              ></textarea>
            </div>

            <div className="profile-form-group">
              <label>Full Description</label>
              <div className="rich-toolbar-preview">
                <button type="button" className="toolbar-btn" title="Bold">
                  <i className="fa-solid fa-bold"></i>
                </button>
                <button type="button" className="toolbar-btn" title="Italic">
                  <i className="fa-solid fa-italic"></i>
                </button>
                <button type="button" className="toolbar-btn" title="List">
                  <i className="fa-solid fa-list-ul"></i>
                </button>
                <button type="button" className="toolbar-btn" title="Link">
                  <i className="fa-solid fa-link"></i>
                </button>
              </div>
              <textarea
                rows="5"
                placeholder="Detailed event information..."
                value={fullDescription}
                onChange={(e) => setFullDescription(e.target.value)}
                style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0 }}
              ></textarea>
            </div>
          </div>

          {/* Block 3: Speaker Information */}
          <div className="create-card-block" style={{ marginTop: '1.75rem' }}>
            <div className="block-title-row" style={{ justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <i className="fa-regular fa-user block-icon"></i>
                <h3>Speaker Information</h3>
              </div>
              <button
                type="button"
                className="btn-add-another-link"
                onClick={() =>
                  showToast && showToast('Primary speaker configured.', 'info')
                }
              >
                + Add Another
              </button>
            </div>

            <div className="speaker-input-card">
              <div className="speaker-top-row">
                <label htmlFor="speaker-avatar-upload" className="speaker-avatar-upload-circle">
                  {speakerAvatar ? (
                    <img src={speakerAvatar} alt="Speaker" />
                  ) : (
                    <>
                      <i className="fa-solid fa-camera"></i>
                      <span>Upload</span>
                    </>
                  )}
                </label>
                <input
                  type="file"
                  id="speaker-avatar-upload"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleSpeakerAvatarFile}
                />

                <div className="speaker-fields-grid">
                  <div className="profile-form-group">
                    <label>Name</label>
                    <input
                      type="text"
                      placeholder="Dr. Jane Doe"
                      value={speakerName}
                      onChange={(e) => setSpeakerName(e.target.value)}
                    />
                  </div>

                  <div className="profile-form-group">
                    <label>Role/Title</label>
                    <input
                      type="text"
                      placeholder="Lead Researcher"
                      value={speakerRole}
                      onChange={(e) => setSpeakerRole(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="profile-form-group" style={{ marginTop: '1rem' }}>
                <label>Bio</label>
                <textarea
                  rows="2"
                  placeholder="Brief speaker biography..."
                  value={speakerBio}
                  onChange={(e) => setSpeakerBio(e.target.value)}
                ></textarea>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="create-column">
          {/* Block 2: Schedule & Location */}
          <div className="create-card-block">
            <div className="block-title-row">
              <i className="fa-regular fa-calendar-days block-icon"></i>
              <h3>Schedule & Location</h3>
            </div>

            <div className="profile-form-group" style={{ marginBottom: '1.25rem' }}>
              <label htmlFor="evt-date">Date *</label>
              <input
                type="date"
                id="evt-date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <div className="time-row-grid" style={{ marginBottom: '1.25rem' }}>
              <div className="profile-form-group">
                <label>Start Time *</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>

              <div className="profile-form-group">
                <label>End Time *</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>

            <div className="profile-form-group" style={{ marginBottom: '1.25rem' }}>
              <label>Venue Name</label>
              <input
                type="text"
                placeholder="e.g., TRACE Expert City Main Hall"
                value={venueName}
                onChange={(e) => setVenueName(e.target.value)}
              />
            </div>

            <div className="profile-form-group" style={{ marginBottom: '1.25rem' }}>
              <label>Full Address</label>
              <input
                type="text"
                placeholder="Enter physical address..."
                value={fullAddress}
                onChange={(e) => setFullAddress(e.target.value)}
              />
            </div>

            {/* Interactive Map Location Picker */}
            <InteractiveLocationPicker
              onSelectAddress={(addr) => setFullAddress(addr)}
              onSelectVenue={(v) => setVenueName((prev) => prev || v)}
            />
          </div>

          {/* Block 4: Media & Registration */}
          <div className="create-card-block" style={{ marginTop: '1.75rem' }}>
            <div className="block-title-row">
              <i className="fa-regular fa-image block-icon"></i>
              <h3>Media & Registration</h3>
            </div>

            <div className="profile-form-group" style={{ marginBottom: '1.5rem' }}>
              <label>Event Cover Image</label>
              <label htmlFor="cover-file-upload-input" className="cover-dropzone-box">
                {coverImage ? (
                  <div className="cover-preview-wrapper">
                    <img src={coverImage} alt="Cover preview" />
                    <span className="file-name-pill">{coverFileName || 'Cover Photo'}</span>
                  </div>
                ) : (
                  <>
                    <div className="cloud-upload-circle">
                      <i className="fa-solid fa-cloud-arrow-up"></i>
                    </div>
                    <p className="dropzone-text">
                      <strong>Click to upload</strong> or drag and drop
                    </p>
                    <span className="dropzone-sub">SVG, PNG, JPG or GIF (max. 800x400px)</span>
                  </>
                )}
              </label>
              <input
                type="file"
                id="cover-file-upload-input"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleImageFile}
              />
            </div>

            {/* YouTube Video Link Input */}
            <div className="profile-form-group" style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="evt-video-url" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <i className="fa-brands fa-youtube" style={{ color: '#ff0000', fontSize: '1.1rem' }}></i>
                YouTube Video Link / Keynote Recording
              </label>
              <input
                type="url"
                id="evt-video-url"
                placeholder="https://www.youtube.com/watch?v=..."
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
              />
              <span className="char-count" style={{ display: 'block', marginTop: '0.25rem', fontSize: '0.78rem', color: '#64748b' }}>
                Paste YouTube video URL to display in Keynote Recording section
              </span>
            </div>

            {/* Enable Registration Toggle Switch */}
            <div className="preference-item-row" style={{ padding: '0.75rem 0', marginBottom: '1.25rem' }}>
              <div className="pref-text">
                <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#0f172a' }}>
                  Enable Registration
                </h4>
                <p style={{ fontSize: '0.82rem', color: '#64748b' }}>
                  Allow users to register for this event
                </p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={enableRegistration}
                  onChange={(e) => setEnableRegistration(e.target.checked)}
                />
                <span className="slider round"></span>
              </label>
            </div>

            {/* Capacity & Deadline Grid */}
            <div className="time-row-grid">
              <div className="profile-form-group">
                <label>Max Capacity</label>
                <input
                  type="number"
                  min="1"
                  placeholder="e.g., 100"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                />
              </div>

              <div className="profile-form-group">
                <label>Deadline</label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
