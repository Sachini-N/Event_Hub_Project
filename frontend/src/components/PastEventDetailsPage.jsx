import React, { useState } from 'react';

export default function PastEventDetailsPage({
  event: initialEvent,
  onBack,
  showToast,
  onOpenGalleryLightbox,
}) {
  const [activeEvent, setActiveEvent] = useState(initialEvent);
  const [loadingEvent, setLoadingEvent] = useState(!initialEvent);
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);

  React.useEffect(() => {
    if (initialEvent) {
      setActiveEvent(initialEvent);
      setLoadingEvent(false);
      return;
    }

    const hash = window.location.hash || '';
    const match = hash.match(/[?&]id=([^&]+)/);
    const eventId = match ? match[1] : sessionStorage.getItem('eventhub_past_event_id');

    if (eventId) {
      setLoadingEvent(true);
      fetch(`/api/events/${eventId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data) {
            setActiveEvent(data.data);
          } else {
            setActiveEvent(null);
          }
        })
        .catch((err) => {
          console.error('Error fetching past event on reload:', err);
          setActiveEvent(null);
        })
        .finally(() => setLoadingEvent(false));
    } else {
      setLoadingEvent(false);
    }
  }, [initialEvent]);

  const getYouTubeEmbedUrl = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? `https://www.youtube.com/embed/${match[2]}?autoplay=1` : null;
  };

  if (loadingEvent) {
    return (
      <div className="past-event-details-page" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem', padding: '4rem 1rem' }}>
        <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '2.5rem', color: '#5d4df6' }}></i>
        <p style={{ color: '#64748b', fontWeight: '600' }}>Loading past event details...</p>
      </div>
    );
  }

  if (!activeEvent) {
    return (
      <div className="past-event-details-page" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem', padding: '4rem 1rem', textAlign: 'center' }}>
        <i className="fa-regular fa-calendar-xmark" style={{ fontSize: '3rem', color: '#94a3b8' }}></i>
        <h2 style={{ fontSize: '1.5rem', color: '#0f172a', margin: '0.5rem 0' }}>Past Event Not Found</h2>
        <p style={{ color: '#64748b', maxWidth: '400px', marginBottom: '1rem' }}>The requested past event could not be found in the system archives.</p>
        <button className="btn-back-link" onClick={onBack}>
          <i className="fa-solid fa-arrow-left"></i> Back to Past Events
        </button>
      </div>
    );
  }

  const pastEvent = activeEvent;
  const hasVideoUrl = Boolean(pastEvent.videoUrl && pastEvent.videoUrl.trim());
  const galleryList = (pastEvent.gallery && pastEvent.gallery.length > 0)
    ? pastEvent.gallery
    : (pastEvent.coverImage ? [pastEvent.coverImage] : []);

  const handleCopyShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    if (showToast) showToast('Event archive link copied to clipboard!', 'success');
  };

  const handleSocialShare = (platform) => {
    const customLinks = pastEvent.socialLinks || {};

    if (platform === 'facebook' && customLinks.facebook && customLinks.facebook.trim()) {
      window.open(customLinks.facebook, '_blank', 'noopener,noreferrer');
      return;
    }
    if (platform === 'instagram' && customLinks.instagram && customLinks.instagram.trim()) {
      window.open(customLinks.instagram, '_blank', 'noopener,noreferrer');
      return;
    }
    if (platform === 'twitter' && customLinks.twitter && customLinks.twitter.trim()) {
      window.open(customLinks.twitter, '_blank', 'noopener,noreferrer');
      return;
    }
    if (platform === 'linkedin' && customLinks.linkedin && customLinks.linkedin.trim()) {
      window.open(customLinks.linkedin, '_blank', 'noopener,noreferrer');
      return;
    }

    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(`Check out ${pastEvent.title} at TRACE!`);
    let shareUrl = '';

    if (platform === 'twitter') shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${title}`;
    else if (platform === 'facebook') shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
    else if (platform === 'linkedin') shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
    else if (platform === 'instagram') {
      window.open('https://www.instagram.com', '_blank', 'noopener,noreferrer');
      return;
    }

    if (shareUrl) window.open(shareUrl, '_blank', 'width=600,height=400');
  };

  return (
    <div className="past-event-details-page">
      <div className="section-container">
        {/* Navigation Bar */}
        <div className="past-nav-bar">
          <button className="btn-back-link" onClick={onBack}>
            <i className="fa-solid fa-arrow-left"></i> Back to Past Events
          </button>
        </div>

        {/* Hero Header Banner */}
        <div className="past-details-hero-card">
          <div className="past-hero-image-box">
            <img src={pastEvent.coverImage} alt={pastEvent.title} />
            <div className="past-hero-overlay"></div>
            <span className="past-status-badge">
              <span className="badge-pulse-dot"></span>
              <i className="fa-solid fa-clock-rotate-left"></i> COMPLETED ARCHIVE
            </span>
          </div>

          <div className="past-hero-content">
            <div className="past-category-pill">{pastEvent.category || 'Archive Event'}</div>
            <h1 className="past-hero-title">{pastEvent.title}</h1>

            <div className="past-meta-pills-row">
              <div className="past-meta-pill">
                <i className="fa-regular fa-calendar"></i>
                <span>
                  {pastEvent.date ? (() => {
                    try {
                      const d = new Date(pastEvent.date);
                      return isNaN(d.getTime()) ? 'Past Event' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                    } catch (e) { return 'Past Event'; }
                  })() : 'Past Event'}
                </span>
              </div>

              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pastEvent.location || 'TRACE Expert City')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="past-meta-pill location-link-pill"
                title="Click to view location pin on Google Maps"
                style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}
              >
                <i className="fa-solid fa-location-dot" style={{ color: '#2563eb' }}></i>
                <span style={{ textDecoration: 'underline', color: '#2563eb', fontWeight: '600' }}>{pastEvent.location || 'TRACE Expert City'}</span>
                <i className="fa-solid fa-arrow-up-right-from-square" style={{ fontSize: '0.68rem', color: '#2563eb', marginLeft: '2px' }}></i>
              </a>

              <div className="past-meta-pill">
                <i className="fa-solid fa-users"></i>
                <span>{pastEvent.attendeesCount || (pastEvent.registeredCount ? `${pastEvent.registeredCount} Attendees` : '300+ Attendees')}</span>
              </div>

              {pastEvent.winners && (
                <div className="past-meta-pill winner-pill">
                  <i className="fa-solid fa-trophy"></i>
                  <span>{pastEvent.winners}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 2-Column Main Layout */}
        <div className="past-details-main-grid">
          {/* LEFT MAIN COLUMN */}
          <div className="past-details-left-column">
            {/* Executive Recap & Summary Box */}
            <div className="past-content-card">
              <h2 className="past-card-heading">
                <i className="fa-solid fa-file-lines"></i> Executive Summary & Event Recap
              </h2>
              <p className="past-recap-text">{pastEvent.description}</p>

              {/* Key Highlights List */}
              {pastEvent.highlights && pastEvent.highlights.length > 0 && (
                <div className="past-highlights-box">
                  <h3 className="highlights-subtitle">Key Event Highlights & Outcomes</h3>
                  <ul className="highlights-list">
                    {pastEvent.highlights.map((item, idx) => (
                      <li key={idx}>
                        <i className="fa-solid fa-circle-check"></i>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Keynote Speaker Section (If Available) */}
            {pastEvent.speaker && pastEvent.speaker.name && (
              <div className="past-content-card">
                <h2 className="past-card-heading">
                  <i className="fa-solid fa-user-tie"></i> Keynote Speaker & Guest
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                  <img
                    src={pastEvent.speaker.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80'}
                    alt={pastEvent.speaker.name}
                    style={{ width: '70px', height: '70px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #2563eb' }}
                  />
                  <div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>{pastEvent.speaker.name}</h3>
                    <span style={{ fontSize: '0.85rem', color: '#2563eb', fontWeight: 700, display: 'block', margin: '2px 0 4px 0' }}>
                      {pastEvent.speaker.role || 'Guest Keynote Speaker'}
                    </span>
                    {pastEvent.speaker.bio && (
                      <p style={{ fontSize: '0.88rem', color: '#475569', margin: 0, lineHeight: 1.5 }}>{pastEvent.speaker.bio}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Keynote Video Recording Card (Only displayed if YouTube video link exists) */}
            {hasVideoUrl && (
              <div className="past-content-card">
                <h2 className="past-card-heading">
                  <i className="fa-solid fa-circle-play"></i> Keynote Recording & Media Session
                </h2>
                <div className="video-player-container">
                  {isPlayingVideo && getYouTubeEmbedUrl(pastEvent.videoUrl) ? (
                    <iframe
                      src={getYouTubeEmbedUrl(pastEvent.videoUrl)}
                      title={`${pastEvent.title} Keynote Recording`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  ) : (
                    <>
                      <img
                        src={pastEvent.coverImage}
                        alt="Keynote Recording Thumbnail"
                        className="video-thumbnail"
                      />
                      <div className="video-play-overlay">
                        <div
                          className="video-play-btn"
                          onClick={() => {
                            const embedUrl = getYouTubeEmbedUrl(pastEvent.videoUrl);
                            if (embedUrl) {
                              setIsPlayingVideo(true);
                              if (showToast) showToast('Playing Keynote Recording Video...', 'info');
                            } else if (pastEvent.videoUrl) {
                              if (showToast) showToast('Opening Keynote Recording Video...', 'info');
                              window.open(pastEvent.videoUrl, '_blank');
                            }
                          }}
                        >
                          <i className="fa-solid fa-play"></i>
                        </div>
                        <span className="video-label">Watch Full Keynote Recording</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Event Photo Gallery Grid in Main Column (Displayed if NO YouTube video link exists) */}
            {!hasVideoUrl && galleryList.length > 0 && (
              <div className="past-content-card">
                <h2 className="past-card-heading" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>
                    <i className="fa-solid fa-images" style={{ color: '#2563eb' }}></i> Event Gallery & Moments
                  </span>
                  <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '700', background: '#f1f5f9', padding: '4px 12px', borderRadius: '14px' }}>
                    {galleryList.length} Photos
                  </span>
                </h2>
                <div className="past-gallery-sidebar-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.85rem' }}>
                  {galleryList.map((item, gIdx) => {
                    const imgUrl = typeof item === 'string' ? item : (item.url || item);
                    return (
                      <div
                        key={gIdx}
                        className="past-gallery-thumb"
                        onClick={() =>
                          onOpenGalleryLightbox &&
                          onOpenGalleryLightbox({ title: pastEvent.title, gallery: galleryList }, gIdx)
                        }
                        title="Click to view full photo"
                        style={{ height: '120px' }}
                      >
                        <img src={imgUrl} alt={`Gallery moment ${gIdx + 1}`} />
                        <div className="thumb-hover-overlay">
                          <i className="fa-solid fa-magnifying-glass-plus"></i>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT SIDEBAR COLUMN */}
          <div className="past-details-right-column">
            {/* Quick Stats Panel */}
            <div className="past-sidebar-card">
              <h3 className="sidebar-card-title">Event Information</h3>
              <div className="sidebar-stats-list">
                <div className="stat-item">
                  <span className="stat-label">Category</span>
                  <span className="stat-value">{pastEvent.category || 'Conference'}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Organizer</span>
                  <span className="stat-value">TRACE Sri Lanka</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Status</span>
                  <span className="stat-value status-completed">
                    <i className="fa-solid fa-circle-check"></i> Completed
                  </span>
                </div>
                <div className="stat-item" style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.2rem' }}>
                  <span className="stat-label" style={{ minWidth: '80px' }}>Location</span>
                  {(() => {
                    const rawLoc = pastEvent.location || 'TRACE Expert City, Colombo';
                    const cleanParts = Array.from(new Set(rawLoc.split(',').map((s) => s.trim()).filter(Boolean)));
                    let displayLoc = cleanParts.join(', ');
                    if (displayLoc.length > 35) {
                      displayLoc = cleanParts.length > 2
                        ? `${cleanParts[0]}, ${cleanParts[cleanParts.length - 1]}`
                        : cleanParts[0];
                    }
                    return (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pastEvent.location || 'TRACE Expert City')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="stat-value"
                        title="Click to view location pin on Google Maps"
                        style={{
                          color: '#2563eb',
                          textDecoration: 'underline',
                          fontWeight: '600',
                          cursor: 'pointer',
                          textAlign: 'right',
                          wordBreak: 'break-word',
                          lineHeight: '1.4',
                          fontSize: '0.84rem',
                          flex: 1,
                        }}
                      >
                        {displayLoc} <i className="fa-solid fa-arrow-up-right-from-square" style={{ fontSize: '0.65rem', marginLeft: '3px' }}></i>
                      </a>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Share Panel */}
            <div className="past-sidebar-card">
              <h3 className="sidebar-card-title">Share Event Archive</h3>
              <div className="share-buttons-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.65rem' }}>
                <button
                  className="btn-share-icon"
                  onClick={() => handleSocialShare('facebook')}
                  title="Share on Facebook"
                  style={{ color: '#1877f2', borderColor: '#bfdbfe', background: '#eff6ff' }}
                >
                  <i className="fa-brands fa-facebook" style={{ fontSize: '0.95rem' }}></i>
                  <span>Facebook</span>
                </button>
                <button
                  className="btn-share-icon"
                  onClick={() => handleSocialShare('instagram')}
                  title="Share on Instagram"
                  style={{ color: '#e1306c', borderColor: '#fbcfe8', background: '#fdf2f8' }}
                >
                  <i className="fa-brands fa-instagram" style={{ fontSize: '0.95rem' }}></i>
                  <span>Instagram</span>
                </button>
                <button
                  className="btn-share-icon"
                  onClick={() => handleSocialShare('twitter')}
                  title="Share on Twitter"
                  style={{ color: '#0f172a', borderColor: '#cbd5e1', background: '#f8fafc' }}
                >
                  <i className="fa-brands fa-x-twitter" style={{ fontSize: '0.95rem' }}></i>
                  <span>Twitter</span>
                </button>
                <button
                  className="btn-share-icon"
                  onClick={() => handleSocialShare('linkedin')}
                  title="Share on LinkedIn"
                  style={{ color: '#0a66c2', borderColor: '#c7d2fe', background: '#eef2ff' }}
                >
                  <i className="fa-brands fa-linkedin" style={{ fontSize: '0.95rem' }}></i>
                  <span>LinkedIn</span>
                </button>
              </div>
            </div>

            {/* Photo Gallery Showcase Grid in Sidebar (Displayed if video URL is present) */}
            {hasVideoUrl && galleryList.length > 0 && (
              <div className="past-sidebar-card past-gallery-sidebar-card">
                <h3 className="sidebar-card-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.15rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <i className="fa-solid fa-images" style={{ color: '#2563eb' }}></i> Event Gallery & Moments
                  </span>
                  <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: '700', background: '#f1f5f9', padding: '3px 9px', borderRadius: '12px' }}>
                    {galleryList.length} Photos
                  </span>
                </h3>
                <div className="past-gallery-sidebar-grid">
                  {galleryList.map((item, gIdx) => {
                    const imgUrl = typeof item === 'string' ? item : (item.url || item);
                    return (
                      <div
                        key={gIdx}
                        className="past-gallery-thumb"
                        onClick={() =>
                          onOpenGalleryLightbox &&
                          onOpenGalleryLightbox({ title: pastEvent.title, gallery: galleryList }, gIdx)
                        }
                        title="Click to view full photo"
                      >
                        <img src={imgUrl} alt={`Gallery moment ${gIdx + 1}`} />
                        <div className="thumb-hover-overlay">
                          <i className="fa-solid fa-magnifying-glass-plus"></i>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
