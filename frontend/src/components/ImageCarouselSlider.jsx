import React, { useState } from 'react';

export default function ImageCarouselSlider({
  images = [],
  fallbackImage = 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=800&q=80',
  alt = 'Banner',
  className = '',
  style = {},
  children
}) {
  // Extract and normalize image list
  let imgList = [];
  if (Array.isArray(images) && images.length > 0) {
    imgList = images.filter(Boolean);
  } else if (typeof images === 'string' && images.trim()) {
    imgList = [images.trim()];
  }

  if (imgList.length === 0) {
    imgList = [fallbackImage];
  }

  const [currentIndex, setCurrentIndex] = useState(0);

  const handlePrev = (e) => {
    if (e) e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? imgList.length - 1 : prev - 1));
  };

  const handleNext = (e) => {
    if (e) e.stopPropagation();
    setCurrentIndex((prev) => (prev === imgList.length - 1 ? 0 : prev + 1));
  };

  const activeImage = imgList[currentIndex] || fallbackImage;

  return (
    <div className={`carousel-slider-container ${className}`} style={style}>
      <img
        key={currentIndex}
        src={activeImage}
        alt={`${alt} slide ${currentIndex + 1}`}
        className="carousel-slide-img"
      />

      {/* Navigation Controls when multiple photos exist */}
      {imgList.length > 1 && (
        <>
          <button
            type="button"
            className="carousel-nav-btn prev-btn"
            onClick={handlePrev}
            title="Previous Photo"
          >
            <i className="fa-solid fa-chevron-left"></i>
          </button>

          <button
            type="button"
            className="carousel-nav-btn next-btn"
            onClick={handleNext}
            title="Next Photo"
          >
            <i className="fa-solid fa-chevron-right"></i>
          </button>

          {/* Dots Indicator & Slide Counter */}
          <div className="carousel-indicators-bar">
            <div className="carousel-dots-group">
              {imgList.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`carousel-dot-pill ${idx === currentIndex ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentIndex(idx);
                  }}
                  title={`View photo ${idx + 1}`}
                />
              ))}
            </div>
            <span className="carousel-count-tag">
              <i className="fa-solid fa-camera"></i> {currentIndex + 1} / {imgList.length}
            </span>
          </div>
        </>
      )}

      {/* Overlay Children (Title, Badges, Close Button, etc.) */}
      {children}
    </div>
  );
}
