import React from 'react';

export default function HeroSection({ scrollToEvents }) {
  return (
    <section className="hero-section" id="hero-section">
      <div className="hero-overlay"></div>
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
    </section>
  );
}
