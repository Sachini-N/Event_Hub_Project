import React, { useState } from 'react';

/**
 * CloudinaryUploader Component
 * Allows users to upload images or videos to Cloudinary via Express /api/upload endpoint.
 *
 * @param {Function} onUploadSuccess Callback function receiving (url, fileData)
 * @param {string} accept Mime type accept string e.g. "image/*,video/*"
 * @param {string} label Button or section label text
 */
export default function CloudinaryUploader({ 
  onUploadSuccess, 
  accept = "image/*,video/*", 
  label = "Upload Image or Video" 
}) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [resourceType, setResourceType] = useState('image');
  const [errorMsg, setErrorMsg] = useState('');

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setErrorMsg('');
    setUploading(true);

    const token = localStorage.getItem('eventhub_token');
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      const result = await response.json();

      if (result.success && result.data) {
        setPreviewUrl(result.data.url);
        setResourceType(result.data.resourceType || (file.type.startsWith('video/') ? 'video' : 'image'));
        
        if (onUploadSuccess) {
          onUploadSuccess(result.data.url, result.data);
        }
      } else {
        setErrorMsg(result.message || 'Failed to upload media.');
      }
    } catch (err) {
      console.error('Cloudinary Upload Error:', err);
      setErrorMsg('Network error while uploading file.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="cloudinary-uploader-container" style={{ margin: '1rem 0' }}>
      <label className="btn btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', borderColor: '#5d4df6', color: '#5d4df6' }}>
        <i className={`fa-solid ${uploading ? 'fa-spinner fa-spin' : 'fa-cloud-arrow-up'}`}></i>
        <span>{uploading ? 'Uploading to Cloudinary...' : label}</span>
        <input 
          type="file" 
          accept={accept} 
          onChange={handleFileSelect} 
          disabled={uploading} 
          style={{ display: 'none' }} 
        />
      </label>

      {errorMsg && (
        <p style={{ color: '#ef4444', fontSize: '0.82rem', marginTop: '0.5rem', fontWeight: '600' }}>
          ⚠️ {errorMsg}
        </p>
      )}

      {previewUrl && (
        <div className="media-preview-box" style={{ marginTop: '0.85rem', padding: '0.75rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#059669' }}>
              ✅ Cloudinary CDN URL Ready
            </span>
            <button 
              type="button" 
              onClick={() => setPreviewUrl('')}
              style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.8rem' }}
            >
              Remove
            </button>
          </div>

          {resourceType === 'video' ? (
            <video src={previewUrl} controls style={{ width: '100%', maxHeight: '250px', borderRadius: '8px', objectFit: 'cover' }} />
          ) : (
            <img src={previewUrl} alt="Uploaded Media Preview" style={{ width: '100%', maxHeight: '250px', borderRadius: '8px', objectFit: 'cover' }} />
          )}
          
          <input 
            type="text" 
            readOnly 
            value={previewUrl} 
            style={{ width: '100%', marginTop: '0.5rem', fontSize: '0.78rem', padding: '0.35rem 0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#ffffff' }} 
          />
        </div>
      )}
    </div>
  );
}
