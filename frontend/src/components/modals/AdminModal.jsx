import React, { useState, useEffect } from 'react';

export default function AdminModal({ isOpen, onClose, onEventCreated, showToast }) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Workshop');
  const [status, setStatus] = useState('upcoming');
  const [capacity, setCapacity] = useState(100);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('09:00 AM');
  const [location, setLocation] = useState('TRACE Expert City, Colombo');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const futureDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      setDate(futureDate);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          category,
          status: new Date(date) < new Date() ? 'past' : status,
          capacity: parseInt(capacity, 10),
          date: new Date(date).toISOString(),
          time,
          location,
          description,
          createdBy: 'TRACE Admin',
          coverImage: coverImage.trim() || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80',
        }),
      });

      const result = await response.json();

      if (result.success) {
        onClose();
        showToast('Event created and published successfully!', 'success');
        onEventCreated();
      } else {
        showToast(result.message || 'Failed to create event', 'error');
      }
    } catch (error) {
      console.error('Error creating event:', error);
      showToast('Network error creating event', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card admin-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <i className="fa-solid fa-xmark"></i>
        </button>

        <div className="modal-header">
          <h2><i className="fa-solid fa-sliders"></i> TRACE Admin Portal</h2>
          <p className="modal-sub">Create new events or publish past showcase events.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="admin-title">Event Title *</label>
              <input
                type="text"
                id="admin-title"
                required
                placeholder="e.g. AI & Cloud Masterclass"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="admin-category">Category</label>
              <select id="admin-category" value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="Workshop">Workshop</option>
                <option value="Meetup">Meetup</option>
                <option value="Sprint">Sprint</option>
                <option value="Keynote">Keynote</option>
                <option value="Hackathon">Hackathon</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="admin-status">Event Status *</label>
              <select id="admin-status" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="upcoming">Upcoming (Open Registration)</option>
                <option value="past">Past (Showcase & Gallery)</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="admin-capacity">Capacity / Max Seats</label>
              <input
                type="number"
                id="admin-capacity"
                min="1"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="admin-date">Date *</label>
              <input
                type="date"
                id="admin-date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="admin-time">Time *</label>
              <input
                type="text"
                id="admin-time"
                required
                placeholder="e.g. 09:00 AM"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="admin-location">Location / Stream URL *</label>
            <input
              type="text"
              id="admin-location"
              required
              placeholder="e.g. TRACE Expert City, Colombo"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="admin-description">Description *</label>
            <textarea
              id="admin-description"
              rows="3"
              required
              placeholder="Event details and agenda..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            ></textarea>
          </div>

          <div class="form-group">
            <label htmlFor="admin-image">Cover Image URL</label>
            <input
              type="url"
              id="admin-image"
              placeholder="https://images.unsplash.com/..."
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
            />
          </div>

          <div class="form-actions">
            <button type="button" class="btn btn-outline" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" class="btn btn-teal-submit" disabled={submitting}>
              {submitting ? (
                <><i class="fa-solid fa-spinner fa-spin"></i> Creating...</>
              ) : (
                <><i class="fa-solid fa-plus"></i> Create & Publish Event</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
