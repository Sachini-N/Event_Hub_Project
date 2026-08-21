import React, { useState, useEffect } from 'react';

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
      setCoverImage(editingVenue.coverImage || 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=800&q=80');
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
      setCoverImage('https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=800&q=80');
      setAmenities('High-Speed WiFi, 4K Projectors, Air Conditioned, Sound System');
      setDescription('');
    }
  }, [editingVenue, isOpen]);

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

    const numPrice = Number(pricePerHour) || 25000;
    const formattedRentalPrice = `Rs. ${numPrice.toLocaleString()} / hr`;

    const isEdit = Boolean(editingVenue);
    const venueId = editingVenue?._id || editingVenue?.id;
    const url = isEdit ? `/api/venues/${venueId}` : '/api/venues';
    const method = isEdit ? 'PUT' : 'POST';

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
          coverImage,
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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <i className="fa-solid fa-xmark"></i>
        </button>

        <div className="modal-header">
          <h2>{editingVenue ? 'Edit Space Facility' : 'Add New Space'}</h2>
          <p className="modal-sub">
            {editingVenue ? 'Modify details, capacity, rental price, and amenities for this space.' : 'Create a new hall, auditorium, or event facility space.'}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="venue-branch">TRACE Branch *</label>
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

          <div className="form-group">
            <label htmlFor="venue-province">Sri Lanka Province *</label>
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
              <label htmlFor="venue-price">Rental Price (LKR per hour) *</label>
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
              {submitting
                ? editingVenue
                  ? 'Updating...'
                  : 'Creating...'
                : editingVenue
                ? 'Update Venue'
                : 'Save Venue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
