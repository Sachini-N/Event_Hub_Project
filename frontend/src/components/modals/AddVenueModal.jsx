import React, { useState, useEffect } from 'react';
import RichTextEditor from '../RichTextEditor';

export default function AddVenueModal({
  isOpen,
  onClose,
  onVenueCreated,
  onVenueUpdated,
  editingVenue,
  showToast,
}) {
  const [name, setName] = useState('');
  const [branch, setBranch] = useState('TRACE Expert City (Colombo)');
  const [province, setProvince] = useState('Western Province');
  const [address, setAddress] = useState('');
  const [capacity, setCapacity] = useState('150');
  const [pricePerHour, setPricePerHour] = useState('25000');
  const [status, setStatus] = useState('Available');
  const [coverImage, setCoverImage] = useState('https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=800&q=80');
  const [imageList, setImageList] = useState([
    'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1431540015161-0bf868a2d407?auto=format&fit=crop&w=800&q=80'
  ]);
  const [amenities, setAmenities] = useState('High-Speed WiFi, 4K Projectors, Air Conditioned, Sound System');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const getProvinceForBranch = (bName) => {
    if (!bName) return 'Western Province';
    if (bName.includes('Colombo')) return 'Western Province';
    if (bName.includes('Kandy')) return 'Central Province';
    if (bName.includes('Jaffna')) return 'Northern Province';
    if (bName.includes('Galle')) return 'Southern Province';
    if (bName.includes('Kurunegala')) return 'North Western Province';
    return 'Western Province';
  };

  const handleBranchChange = (newBranch) => {
    setBranch(newBranch);
    setProvince(getProvinceForBranch(newBranch));
  };

  useEffect(() => {
    if (editingVenue) {
      setName(editingVenue.name || '');
      const b = editingVenue.branch || 'TRACE Expert City (Colombo)';
      setBranch(b);
      setProvince(editingVenue.province || getProvinceForBranch(b));
      setAddress(editingVenue.address || '');
      setCapacity(editingVenue.capacity ? String(editingVenue.capacity) : '150');
      const numPrice = editingVenue.pricePerHour 
        ? String(editingVenue.pricePerHour) 
        : (editingVenue.rentalPrice ? String(editingVenue.rentalPrice).replace(/[^0-9]/g, '') : '25000');
      setPricePerHour(numPrice || '25000');
      setStatus(editingVenue.status || 'Available');
      const existingImgs = Array.isArray(editingVenue.images) && editingVenue.images.length > 0
        ? editingVenue.images
        : (editingVenue.coverImage ? [editingVenue.coverImage] : []);
      setImageList(existingImgs);
      setCoverImage(editingVenue.coverImage || existingImgs[0] || 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=800&q=80');
      setAmenities(Array.isArray(editingVenue.amenities) ? editingVenue.amenities.join(', ') : (editingVenue.amenities || ''));
      setDescription(editingVenue.description || '');
    } else {
      setName('');
      setBranch('TRACE Expert City (Colombo)');
      setProvince('Western Province');
      setAddress('');
      setCapacity('150');
      setPricePerHour('25000');
      setStatus('Available');
      const defaultImgs = [
        'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1431540015161-0bf868a2d407?auto=format&fit=crop&w=800&q=80'
      ];
      setCoverImage(defaultImgs[0]);
      setImageList(defaultImgs);
      setAmenities('High-Speed WiFi, 4K Projectors, Air Conditioned, Sound System');
      setDescription('');
    }
  }, [editingVenue, isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      files.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImageList((prev) => {
            const next = [...prev, reader.result];
            setCoverImage(next[0]);
            return next;
          });
        };
        reader.readAsDataURL(file);
      });
      if (showToast) showToast(`${files.length} image(s) uploaded successfully!`, 'info');
    }
  };

  const handleAddUrl = () => {
    if (coverImage && coverImage.trim()) {
      const trimmed = coverImage.trim();
      if (!imageList.includes(trimmed)) {
        setImageList((prev) => [...prev, trimmed]);
        if (showToast) showToast('Image URL added to gallery!', 'info');
      }
    }
  };

  const handleRemoveImage = (index) => {
    const updated = imageList.filter((_, idx) => idx !== index);
    setImageList(updated);
    if (updated.length > 0) {
      setCoverImage(updated[0]);
    } else {
      setCoverImage('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const numPrice = Number(pricePerHour) || 25000;
    const formattedRentalPrice = `Rs. ${numPrice.toLocaleString()} / hr`;

    const isEdit = Boolean(editingVenue);
    const venueId = editingVenue?._id || editingVenue?.id;
    const url = isEdit ? `/api/venues/${venueId}` : '/api/venues';
    const method = isEdit ? 'PUT' : 'POST';

    const finalImages = imageList.length > 0 ? imageList : [coverImage].filter(Boolean);

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          branch,
          province,
          address,
          capacity: Number(capacity),
          rentalPrice: formattedRentalPrice,
          pricePerHour: numPrice,
          status,
          coverImage: finalImages[0] || coverImage,
          images: finalImages,
          amenities: amenities.split(',').map((a) => a.trim()).filter(Boolean),
          description,
        }),
      });

      const result = await response.json();

      if (result.success) {
        const msg = isEdit ? `Venue "${name}" updated successfully!` : `Venue "${name}" added successfully!`;
        if (showToast) showToast(msg, 'success');
        if (isEdit && onVenueUpdated) onVenueUpdated(result.data);
        else if (onVenueCreated) onVenueCreated(result.data);
        onClose();
      } else {
        if (showToast) showToast(result.message || 'Failed to save venue', 'error');
      }
    } catch (err) {
      console.error('Error saving venue:', err);
      if (showToast) showToast('Network error while saving venue', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="create-event-modal-backdrop" onClick={onClose}>
      <div className="create-event-modal-card" style={{ maxWidth: '860px' }} onClick={(e) => e.stopPropagation()}>
        {/* Modal Close Button */}
        <button
          type="button"
          className="create-event-modal-close"
          onClick={onClose}
          title="Close modal"
        >
          <i className="fa-solid fa-xmark"></i>
        </button>

        {/* Modal Header */}
        <div className="create-event-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div className="create-event-title-badge" style={{ background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)', boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)' }}>
              <i className="fa-solid fa-building-circle-check"></i>
            </div>
            <div>
              <h1 className="create-event-title">
                {editingVenue ? 'Edit Space Facility' : 'Add New Space'}
              </h1>
              <p className="create-event-sub">
                {editingVenue ? 'Modify details, capacity, rental price, and amenities for this space.' : 'Create a new hall, auditorium, or event facility space on TRACE.'}
              </p>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="add-venue-modal-form">
          {/* Section 1: Location & Branch */}
          <div className="create-card-block" style={{ marginBottom: '1.5rem' }}>
            <div className="block-title-row">
              <div className="section-icon-badge badge-indigo">
                <i className="fa-solid fa-location-dot"></i>
              </div>
              <h3>Branch & Location Details</h3>
            </div>

            <div className="time-row-grid" style={{ marginBottom: '1.25rem' }}>
              <div className="profile-form-group">
                <label htmlFor="venue-branch">
                  <i className="fa-solid fa-building" style={{ color: '#6366f1' }}></i>
                  TRACE Branch *
                </label>
                <select
                  id="venue-branch"
                  required
                  value={branch}
                  onChange={(e) => handleBranchChange(e.target.value)}
                >
                  <option value="TRACE Expert City (Colombo)">TRACE Expert City (Colombo)</option>
                  <option value="TRACE Innovation Hub (Kandy)">TRACE Innovation Hub (Kandy)</option>
                  <option value="TRACE Tech Park (Jaffna)">TRACE Tech Park (Jaffna)</option>
                  <option value="TRACE Hub (Galle)">TRACE Hub (Galle)</option>
                  <option value="TRACE Tech Bay (Kurunegala)">TRACE Tech Bay (Kurunegala)</option>
                </select>
              </div>

              <div className="profile-form-group">
                <label htmlFor="venue-province">
                  <i className="fa-solid fa-map" style={{ color: '#6366f1' }}></i>
                  Sri Lanka Province *
                </label>
                <select
                  id="venue-province"
                  required
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                >
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
            </div>

            <div className="time-row-grid" style={{ marginBottom: '1.25rem' }}>
              <div className="profile-form-group">
                <label htmlFor="venue-name">
                  <i className="fa-solid fa-landmark" style={{ color: '#6366f1' }}></i>
                  Venue / Hall Name *
                </label>
                <input
                  type="text"
                  id="venue-name"
                  required
                  placeholder="e.g. TRACE Main Auditorium"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="profile-form-group">
                <label htmlFor="venue-status">
                  <i className="fa-solid fa-shield-halved" style={{ color: '#6366f1' }}></i>
                  Availability Status
                </label>
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

            <div className="profile-form-group">
              <label htmlFor="venue-address">
                <i className="fa-solid fa-location-dot" style={{ color: '#6366f1' }}></i>
                Address & Location Details *
              </label>
              <input
                type="text"
                id="venue-address"
                required
                placeholder="e.g. Bay 5, TRACE Expert City, Maradana Rd, Colombo"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
          </div>

          {/* Section 2: Space Specs & Pricing */}
          <div className="create-card-block" style={{ marginBottom: '1.5rem' }}>
            <div className="block-title-row">
              <div className="section-icon-badge badge-emerald">
                <i className="fa-solid fa-sliders"></i>
              </div>
              <h3>Space Capacity & Rental Pricing</h3>
            </div>

            <div className="time-row-grid">
              <div className="profile-form-group">
                <label htmlFor="venue-capacity">
                  <i className="fa-solid fa-users" style={{ color: '#059669' }}></i>
                  Seating Capacity (Guests) *
                </label>
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

              <div className="profile-form-group">
                <label htmlFor="venue-price">
                  <i className="fa-solid fa-money-bill-wave" style={{ color: '#059669' }}></i>
                  Rental Price (LKR per hour) *
                </label>
                <input
                  type="number"
                  id="venue-price"
                  required
                  min="1000"
                  placeholder="25000"
                  value={pricePerHour}
                  onChange={(e) => setPricePerHour(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Section 3: Photo Gallery & Amenities */}
          <div className="create-card-block">
            <div className="block-title-row">
              <div className="section-icon-badge badge-amber">
                <i className="fa-solid fa-photo-film"></i>
              </div>
              <h3>Photo Gallery, Amenities & Description</h3>
            </div>

            {/* Cover Image Upload & URL Input */}
            <div className="profile-form-group" style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="venue-image">
                <i className="fa-solid fa-images" style={{ color: '#d97706' }}></i>
                Venue Photos (Upload multiple photos for gallery carousel)
              </label>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <input
                  type="text"
                  id="venue-image"
                  placeholder="Paste Image URL..."
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  className="btn-create-draft"
                  onClick={handleAddUrl}
                  style={{ whiteSpace: 'nowrap', padding: '0.65rem 0.9rem', fontSize: '0.85rem' }}
                >
                  + Add URL
                </button>
                <label
                  htmlFor="venue-file-upload"
                  className="btn-create-publish"
                  style={{ cursor: 'pointer', whiteSpace: 'nowrap', padding: '0.65rem 0.9rem', fontSize: '0.85rem' }}
                >
                  <i className="fa-solid fa-cloud-arrow-up"></i> Upload Photos
                </label>
                <input
                  type="file"
                  id="venue-file-upload"
                  accept="image/*"
                  multiple
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
              </div>

              {/* Thumbnail Gallery of Uploaded Photos */}
              {imageList.length > 0 && (
                <div style={{ marginTop: '0.85rem' }}>
                  <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700, display: 'block', marginBottom: '0.4rem' }}>
                    Uploaded Gallery ({imageList.length} Photos - Click ✕ to remove):
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem' }}>
                    {imageList.map((url, idx) => (
                      <div
                        key={idx}
                        style={{
                          position: 'relative',
                          width: '105px',
                          height: '75px',
                          borderRadius: '10px',
                          overflow: 'hidden',
                          border: idx === 0 ? '2px solid #5d4df6' : '1px solid #cbd5e1',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                        }}
                        title={idx === 0 ? 'Primary Cover Photo' : `Gallery Photo #${idx + 1}`}
                      >
                        <img src={url} alt={`Preview ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        {idx === 0 && (
                          <span style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(135deg, #5d4df6 0%, #4f46e5 100%)', color: '#fff', fontSize: '9px', fontWeight: 'bold', textAlign: 'center', padding: '1px 0' }}>
                            COVER
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          style={{
                            position: 'absolute',
                            top: '3px',
                            right: '3px',
                            background: 'rgba(239, 68, 68, 0.95)',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '50%',
                            width: '22px',
                            height: '22px',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                          }}
                          title="Remove photo"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="profile-form-group" style={{ marginBottom: '1.25rem' }}>
              <label htmlFor="venue-amenities">
                <i className="fa-solid fa-wand-magic-sparkles" style={{ color: '#d97706' }}></i>
                Amenities & Facilities (Comma-separated)
              </label>
              <input
                type="text"
                id="venue-amenities"
                placeholder="WiFi, 4K Projectors, AC, Stage Lighting, Live Stream AV"
                value={amenities}
                onChange={(e) => setAmenities(e.target.value)}
              />
            </div>

            <div className="profile-form-group">
              <label htmlFor="venue-desc">
                <i className="fa-solid fa-paragraph" style={{ color: '#d97706' }}></i>
                Space Description
              </label>
              <RichTextEditor
                id="venue-desc"
                rows={4}
                placeholder="Provide a brief overview of the space facilities..."
                value={description}
                onChange={setDescription}
              />
            </div>
          </div>

          {/* Form Bottom Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.75rem' }}>
            <button type="button" className="btn-create-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-create-publish" disabled={submitting}>
              {submitting ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin"></i> Saving...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-check"></i> {editingVenue ? 'Update Space' : 'Save & Publish Space'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
