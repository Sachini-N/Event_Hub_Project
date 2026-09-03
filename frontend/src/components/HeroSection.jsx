import React, { useState, useEffect } from 'react';

const HERO_IMAGES = [
  'https://tracesrilanka.lk/api/media/file/trace-home-1200x630.webp',
  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTqWPzowUKUV7bq9rMng9rq1qVinKqUn6Q0I5yeO99YN2SD8oNeoRi3h0Q&s=10',
  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ4rL5gs0wwiJqtAcvBMRzijYWUhXiOyKn3sTp-d-7kYQ&s=10',
];

export default function HeroSection({ scrollToEvents }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % HERO_IMAGES.length);
    }, 5000); // Cycles every 5 seconds

    return () => clearInterval(timer);
  }, []);

  return (
    <section className="hero-section" id="hero-section">
      {/* Background Slideshow with Smooth Crossfade */}
      <div className="hero-slideshow-container">
        {HERO_IMAGES.map((imgSrc, idx) => (
          <div
            key={idx}
            className={`hero-slide ${idx === currentImageIndex ? 'active' : ''}`}
            style={{
              backgroundImage: `url("${imgSrc}")`,
            }}
          />
        ))}
      </div>

      {/* Elegant Overlay for Text Contrast */}
      <div className="hero-overlay"></div>

      {/* Hero Content */}
      <div className="hero-content">
        <h1 className="hero-title">Discover What's Happening at TRACE</h1>
        <p className="hero-subtitle">
          Join our vibrant community. Participate in free events, meet industry experts, and connect with peers to foster innovation and professional growth.
        </p>
        <div className="hero-actions">
          <button className="btn btn-blue-pill" onClick={() => scrollToEvents('upcoming')}>
            Explore Upcoming Events
          </button>
          <button className="btn btn-outline-pill" onClick={() => scrollToEvents('past')}>
            View Past Events
          </button>
        </div>
      </div>

      {/* Slide Indicators */}
      <div className="hero-indicators">
        {HERO_IMAGES.map((_, idx) => (
          <button
            key={idx}
            type="button"
            className={`hero-indicator-dot ${idx === currentImageIndex ? 'active' : ''}`}
            onClick={() => setCurrentImageIndex(idx)}
            aria-label={`Switch to slide ${idx + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
