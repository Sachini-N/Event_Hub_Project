import React, { useState } from 'react';

export default function AddVenueModal({
  isOpen,
  onClose,
  onVenueCreated,
  showToast,
}) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [capacity, setCapacity] = useState('150');
  const [status, setStatus] = useState('Available');
  const [coverImage, setCoverImage] = useState('https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=800&q=80');
  const [amenities, setAmenities] = useState('High-Speed WiFi, 4K Projectors, Air Conditioned, Sound System');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverImage(reader.result);
        if (showToast) showToast('Image uploaded successfully!', 'info');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch('/api/venues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          address,
          capacity: Number(capacity),
          status,
          coverImage,
          amenities: amenities.split(',').map((a) => a.trim()).filter(Boolean),
          description,
        }),
      });

      const result = await response.json();

      if (result.success) {
        if (showToast) showToast(`Venue "${name}" added successfully!`, 'success');
        if (onVenueCreated) onVenueCreated(result.data);
        onClose();
        // Reset form
        setName('');
        setAddress('');
        setCapacity('150');
        setDescription('');
      } else {
        if (showToast) showToast(result.message || 'Failed to add venue', 'error');
      }
    } catch (err) {
      console.error('Error adding venue:', err);
      if (showToast) showToast('Network error while adding venue', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <i className="fa-solid fa-xmark"></i>
        </button>

        <div className="modal-header">
          <h2>Add New Venue</h2>
          <p className="modal-sub">Create a new hall, auditorium, or event facility space.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="venue-name">Venue / Hall Name *</label>
            <input
              type="text"
              id="venue-name"
              required
              placeholder="e.g. TRACE Main Auditorium"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="venue-address">Address & Location Details *</label>
            <input
              type="text"
              id="venue-address"
              required
              placeholder="e.g. Bay 5, TRACE Expert City, Maradana Rd, Colombo"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="venue-capacity">Seating Capacity *</label>
              <input
                type="number"
                id="venue-capacity"
                required
                min="10"
                placeholder="250"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="venue-status">Availability Status</label>
              <select
                id="venue-status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="Available">Available</option>
                <option value="Reserved">Reserved</option>
                <option value="Under Maintenance">Under Maintenance</option>
              </select>
            </div>
          </div>

          {/* Cover Image Upload & URL Input */}
          <div className="form-group">
            <label htmlFor="venue-image">Cover Image (Upload File or Enter Image URL)</label>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <input
                type="text"
                id="venue-image"
                placeholder="https://images.unsplash.com/photo-..."
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                style={{ flex: 1 }}
              />
              <label
                htmlFor="venue-file-upload"
                className="btn btn-outline"
                style={{ cursor: 'pointer', whiteSpace: 'nowrap', padding: '0.65rem 0.9rem', fontSize: '0.85rem' }}
              >
                <i className="fa-solid fa-cloud-arrow-up"></i> Upload Image
              </label>
              <input
                type="file"
                id="venue-file-upload"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
            </div>
            {coverImage && (
              <div style={{ marginTop: '0.65rem', borderRadius: '8px', overflow: 'hidden', height: '130px', border: '1px solid #cbd5e1' }}>
                <img src={coverImage} alt="Venue Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="venue-amenities">Amenities (Comma-separated)</label>
            <input
              type="text"
              id="venue-amenities"
              placeholder="WiFi, 4K Projectors, AC, Stage Lighting, Live Stream AV"
              value={amenities}
              onChange={(e) => setAmenities(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="venue-desc">Description (Optional)</label>
            <textarea
              id="venue-desc"
              rows="3"
              placeholder="Provide a brief overview of the venue facilities..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            ></textarea>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Creating...' : 'Save Venue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
