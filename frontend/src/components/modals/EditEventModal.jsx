import React, { useState, useEffect } from 'react';
import RichTextEditor from '../RichTextEditor';

export default function EditEventModal({
  isOpen,
  onClose,
  event,
  onEventUpdated,
  showToast,
}) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Workshop');
  const [status, setStatus] = useState('upcoming');
  const [capacity, setCapacity] = useState(100);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('09:00 AM');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [gallery, setGallery] = useState([]);
  const [newPhotoCaption, setNewPhotoCaption] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (event && isOpen) {
      setTitle(event.title || '');
      setCategory(event.category || 'Workshop');
      setStatus(event.status || 'upcoming');
      setCapacity(event.capacity || 100);
      setDate(
        event.date
          ? new Date(event.date).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0]
      );
      setTime(event.time || '09:00 AM');
      setLocation(event.location || '');
      setDescription(event.description || '');
      setCoverImage(event.coverImage || '');
      setVideoUrl(event.videoUrl || '');
      setGallery(event.gallery || []);
    }
  }, [event, isOpen]);

  if (!isOpen || !event) return null;

  // Handle Cover Image Upload
  const handleCoverUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      if (showToast) showToast('Please select a cover image smaller than 3MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setCoverImage(reader.result);
      if (showToast) showToast('Cover photo loaded!', 'info');
    };
    reader.readAsDataURL(file);
  };

  // Handle Gallery Photo Upload
  const handleGalleryUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      if (showToast) showToast('Please select a photo smaller than 3MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const newPhoto = {
        url: reader.result,
        caption: newPhotoCaption.trim() || 'Event Photo',
      };
      setGallery((prev) => [...prev, newPhoto]);
      setNewPhotoCaption('');
      if (showToast) showToast('Photo added to event gallery!', 'success');
    };
    reader.readAsDataURL(file);
  };

  // Remove photo from gallery
  const handleRemovePhoto = (index) => {
    setGallery((prev) => prev.filter((_, idx) => idx !== index));
    if (showToast) showToast('Photo removed from gallery', 'info');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch(`/api/events/${event._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          category,
          status,
          capacity: parseInt(capacity, 10),
          date: new Date(date).toISOString(),
          time,
          location,
          description,
          coverImage,
          videoUrl: videoUrl.trim(),
          gallery,
        }),
      });

      const result = await response.json();

      if (result.success) {
        onClose();
        if (showToast) showToast('Event updated successfully in MongoDB!', 'success');
        if (onEventUpdated) onEventUpdated();
      } else {
        if (showToast) showToast(result.message || 'Failed to update event', 'error');
      }
    } catch (error) {
      console.error('Error updating event:', error);
      if (showToast) showToast('Network error updating event', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card admin-card edit-event-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '720px', maxHeight: '90vh', overflowY: 'auto' }}
      >
        <button className="modal-close" onClick={onClose}>
          <i className="fa-solid fa-xmark"></i>
        </button>

        <div className="modal-header">
          <h2>
            <i className="fa-regular fa-pen-to-square" style={{ color: '#5d4df6' }}></i> Edit Event
          </h2>
          <p className="modal-sub">Update event details, status, and photo gallery in database.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="edit-title">Event Title *</label>
              <input
                type="text"
                id="edit-title"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="edit-category">Category</label>
              <select
                id="edit-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="Workshop">Workshop</option>
                <option value="Meetup">Meetup</option>
                <option value="Talk">Talk</option>
                <option value="Keynote">Keynote</option>
                <option value="Hackathon">Hackathon</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="edit-status">Event Status *</label>
              <select
                id="edit-status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="upcoming">Upcoming (Open Registration)</option>
                <option value="past">Past (Completed & Gallery Showcase)</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="edit-capacity">Capacity / Max Seats</label>
              <input
                type="number"
                id="edit-capacity"
                min="1"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="edit-date">Date *</label>
              <input
                type="date"
                id="edit-date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="edit-time">Time *</label>
              <input
                type="text"
                id="edit-time"
                required
                placeholder="e.g. 09:00 AM - 05:00 PM"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="edit-location">Location / Venue *</label>
            <input
              type="text"
              id="edit-location"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="edit-description">Description *</label>
            <RichTextEditor
              id="edit-description"
              rows={4}
              placeholder="Detailed event information..."
              value={description}
              onChange={setDescription}
            />
          </div>

          {/* Cover Image URL / File Upload & Visual Preview */}
          <div className="form-group">
            <label>Cover Image</label>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Image URL or upload file below..."
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                style={{ flex: 1 }}
              />
              <label
                htmlFor="edit-cover-upload"
                className="btn btn-outline"
                style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                <i className="fa-solid fa-cloud-arrow-up"></i> Upload
              </label>
              <input
                type="file"
                id="edit-cover-upload"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleCoverUpload}
              />
            </div>

            {/* Live Uploaded Photo Preview Card */}
            {coverImage && (
              <div style={{ marginTop: '0.75rem', position: 'relative', borderRadius: '10px', overflow: 'hidden', border: '1px solid #cbd5e1', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                <img
                  src={coverImage}
                  alt="Uploaded Cover Preview"
                  style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', display: 'block' }}
                />
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(180deg, transparent 0%, rgba(15,23,42,0.85) 100%)', padding: '0.5rem 0.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#ffffff', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <i className="fa-solid fa-circle-check" style={{ color: '#4ade80' }}></i> Uploaded Photo Preview
                  </span>
                  <button
                    type="button"
                    onClick={() => setCoverImage('')}
                    style={{ background: 'rgba(220, 38, 38, 0.9)', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '0.25rem 0.6rem', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                  >
                    <i className="fa-solid fa-trash-can"></i> Remove Photo
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* YouTube Video Link Field */}
          <div className="form-group">
            <label htmlFor="edit-video-url" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <i className="fa-brands fa-youtube" style={{ color: '#ff0000', fontSize: '1.1rem' }}></i>
              YouTube Video Link / Keynote Recording URL
            </label>
            <input
              type="url"
              id="edit-video-url"
              placeholder="e.g. https://www.youtube.com/watch?v=..."
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
            />
          </div>

          {/* Past Event Photo Gallery Section */}
          <div className="gallery-manager-section" style={{ marginTop: '1.5rem' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: '700', color: '#0f172a', marginBottom: '0.5rem' }}>
              <i className="fa-regular fa-images" style={{ color: '#5d4df6' }}></i> Event Photo Gallery ({gallery.length} photos)
            </h4>
            <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '1rem' }}>
              Upload or manage showcase photos for past events displayed in the gallery.
            </p>

            {/* Gallery Upload Inputs */}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Optional photo caption..."
                value={newPhotoCaption}
                onChange={(e) => setNewPhotoCaption(e.target.value)}
                style={{ flex: 1 }}
              />
              <label
                htmlFor="gallery-photo-upload"
                className="btn btn-primary"
                style={{ cursor: 'pointer', whiteSpace: 'nowrap', backgroundColor: '#5d4df6' }}
              >
                <i className="fa-solid fa-plus"></i> Upload Photo
              </label>
              <input
                type="file"
                id="gallery-photo-upload"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleGalleryUpload}
              />
            </div>

            {/* Gallery Grid Previews */}
            {gallery.length > 0 && (
              <div className="edit-gallery-grid">
                {gallery.map((photo, idx) => (
                  <div key={idx} className="edit-gallery-item">
                    <img src={photo.url} alt={photo.caption || 'Event photo'} />
                    <span className="photo-caption-tag">{photo.caption || 'Photo'}</span>
                    <button
                      type="button"
                      className="remove-photo-btn"
                      onClick={() => handleRemovePhoto(idx)}
                      title="Remove Photo"
                    >
                      <i className="fa-solid fa-trash-can"></i>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="form-actions" style={{ marginTop: '2rem' }}>
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ backgroundColor: '#5d4df6' }}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin"></i> Saving...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-check"></i> Update Event
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
