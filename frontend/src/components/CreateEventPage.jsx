import React, { useState } from 'react';

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

            {/* Map Preview Placeholder */}
            <div className="map-preview-box">
              <i className="fa-solid fa-map-location-dot map-icon"></i>
              <span>Map Preview (Interactive in Prod)</span>
            </div>
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
