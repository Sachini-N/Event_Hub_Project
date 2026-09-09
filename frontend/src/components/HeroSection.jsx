import React, { useRef, useEffect } from 'react';
import traceVideo from '../assets/Trace Vedio.mp4';

export default function HeroSection({ scrollToEvents }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, []);

  return (
    <section className="hero-custom-section" id="hero-section">
      {/* Background Video Layer */}
      <div className="hero-video-wrapper">
        <video
          ref={videoRef}
          className="hero-video-element"
          autoPlay
          loop
          muted
          playsInline
        >
          <source src={traceVideo} type="video/mp4" />
          <source src="/trace-video.mp4" type="video/mp4" />
        </video>
        <div className="hero-video-overlay" />
      </div>

      <div className="section-container hero-custom-container">
        
        {/* Hero Content Area */}
        <div className="hero-custom-content">
          {/* Badge */}
          <div className="hero-custom-badge">
            <span className="badge-dot-amber"></span>
            <span>TRACE COMMUNITY HUB, SRI LANKA</span>
          </div>

          {/* Heading */}
          <h1 className="hero-custom-title">
            Where innovation meets community and culture.
          </h1>

          {/* Subtitle */}
          <p className="hero-custom-subtitle">
            From Shed sessions to Midweek Boost evenings, discover and register for the events shaping TRACE Expert City — then keep every one of them in view.
          </p>

          {/* Action Buttons */}
          <div className="hero-custom-actions">
            <button
              type="button"
              className="btn-hero-primary"
              onClick={() => scrollToEvents && scrollToEvents('upcoming')}
            >
              Explore Upcoming Events
            </button>
            <button
              type="button"
              className="btn-hero-secondary"
              onClick={() => scrollToEvents && scrollToEvents('past')}
            >
              View Past Highlights
            </button>
          </div>
        </div>

      </div>
    </section>
  );
}
