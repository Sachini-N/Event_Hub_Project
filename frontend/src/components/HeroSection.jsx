import React, { useRef, useEffect, useState } from 'react';
import traceVideo from '../assets/Trace Vedio.mp4';

const DEFAULT_SETTINGS = {
  heroMediaType: 'default',
  heroImageUrl: '',
  heroVideoUrl: '',
  heroBadge: 'TRACE COMMUNITY HUB, SRI LANKA',
  heroTitle: 'Where innovation meets community and culture.',
  heroSubtitle:
    'From Shed sessions to Midweek Boost evenings, discover and register for the events shaping TRACE Expert City — then keep every one of them in view.',
};

export default function HeroSection({ scrollToEvents }) {
  const videoRef = useRef(null);
  const [settings, setSettings] = useState(() => {
    try {
      const cached = localStorage.getItem('eventhub_hero_settings');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.heroImageUrl === '/home.jpeg' || parsed.heroTitle === 'Where Innovation Meets Community and Creativity.') {
          return DEFAULT_SETTINGS;
        }
        return parsed;
      }
      return DEFAULT_SETTINGS;
    } catch (e) {
      return DEFAULT_SETTINGS;
    }
  });

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings/hero');
      const data = await res.json();
      if (data.success && data.data) {
        setSettings(data.data);
        localStorage.setItem('eventhub_hero_settings', JSON.stringify(data.data));
      }
    } catch (e) {
      // Use fallback cached settings
    }
  };

  useEffect(() => {
    fetchSettings();

    const handleUpdate = (e) => {
      if (e.detail) {
        setSettings(e.detail);
      } else {
        fetchSettings();
      }
    };

    window.addEventListener('hero_settings_updated', handleUpdate);
    return () => window.removeEventListener('hero_settings_updated', handleUpdate);
  }, []);

  useEffect(() => {
    if (settings.heroMediaType !== 'image' && videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, [settings.heroMediaType, settings.heroVideoUrl]);

  const isImageMode = settings.heroMediaType === 'image' && Boolean(settings.heroImageUrl);
  const isCustomVideoMode = settings.heroMediaType === 'video' && Boolean(settings.heroVideoUrl);

  return (
    <section className="hero-custom-section" id="hero-section">
      {/* Background Layer (Video or Custom Image) */}
      <div className="hero-video-wrapper">
        {isImageMode ? (
          <img
            src={settings.heroImageUrl}
            alt="Hero Banner"
            className="hero-image-element"
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              minWidth: '100%',
              minHeight: '100%',
              width: '100%',
              height: '100%',
              transform: 'translate(-50%, -50%)',
              objectFit: 'cover',
              objectPosition: 'center',
              zIndex: 0,
            }}
          />
        ) : isCustomVideoMode ? (
          <video
            ref={videoRef}
            key={settings.heroVideoUrl}
            className="hero-video-element video-ready"
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
          >
            <source src={settings.heroVideoUrl} />
          </video>
        ) : (
          <video
            ref={videoRef}
            className="hero-video-element video-ready"
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
          >
            <source src={traceVideo} type="video/mp4" />
            <source src="/trace-video.mp4" type="video/mp4" />
          </video>
        )}
        <div className="hero-video-overlay" />
      </div>

      <div className="section-container hero-custom-container">
        {/* Hero Content Area */}
        <div className="hero-custom-content">
          {/* Badge */}
          <div className="hero-custom-badge">
            <span className="badge-dot-amber"></span>
            <span>{settings.heroBadge || 'TRACE COMMUNITY HUB, SRI LANKA'}</span>
          </div>

          {/* Heading */}
          <h1 className="hero-custom-title">
            {settings.heroTitle || 'Where innovation meets community and culture.'}
          </h1>

          {/* Subtitle */}
          <p className="hero-custom-subtitle">
            {settings.heroSubtitle ||
              'From Shed sessions to Midweek Boost evenings, discover and register for the events shaping TRACE Expert City — then keep every one of them in view.'}
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
