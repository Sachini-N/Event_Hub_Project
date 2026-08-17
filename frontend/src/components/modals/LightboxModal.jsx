import React, { useState, useEffect } from 'react';

export default function LightboxModal({ isOpen, onClose, event, initialIndex = 0 }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex, event]);

  if (!isOpen || !event || !event.gallery || event.gallery.length === 0) return null;

  const gallery = event.gallery;
  const currentImg = gallery[currentIndex] || gallery[0];

  const prevImage = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : gallery.length - 1));
  };

  const nextImage = () => {
    setCurrentIndex((prev) => (prev < gallery.length - 1 ? prev + 1 : 0));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card lightbox-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <i className="fa-solid fa-xmark"></i>
        </button>

        <div className="lightbox-container">
          <img src={currentImg.url} alt={currentImg.caption || 'Event Highlight'} />
          <div className="lightbox-caption">{currentImg.caption || 'Event Photograph'}</div>
        </div>

        <div className="lightbox-nav">
          <button className="btn btn-outline" onClick={prevImage}>
            <i className="fa-solid fa-chevron-left"></i> Previous
          </button>
          <span>{currentIndex + 1} of {gallery.length}</span>
          <button className="btn btn-outline" onClick={nextImage}>
            Next <i className="fa-solid fa-chevron-right"></i>
          </button>
        </div>
      </div>
    </div>
  );
}
