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
        <p style={{ color: '#64748b', maxWidth: '400px', marginBottom: '1rem' }}>The requested past event could not be found.</p>
        <button className="btn btn-primary" onClick={onBack}>
          <i className="fa-solid fa-arrow-left"></i> Back to Past Events
        </button>
      </div>
    );
  }

  const pastEvent = activeEvent;

  const handleDownloadResource = (resourceName) => {
    if (showToast) showToast(`Downloading ${resourceName}...`, 'info');
    setTimeout(() => {
      if (showToast) showToast(`Downloaded ${resourceName}`, 'success');
    }, 1000);
  };

  const handleCopyShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    if (showToast) showToast('Event link copied to clipboard!', 'success');
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
                <i className="fa-solid fa-location-dot" style={{ color: '#5d4df6' }}></i>
                <span style={{ textDecoration: 'underline', color: '#5d4df6', fontWeight: '600' }}>{pastEvent.location || 'TRACE Expert City'}</span>
                <i className="fa-solid fa-arrow-up-right-from-square" style={{ fontSize: '0.68rem', color: '#5d4df6', marginLeft: '2px' }}></i>
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

            {/* Keynote Video Recording Card */}
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
                          } else {
                            if (showToast) showToast('Opening YouTube Keynote Video...', 'info');
                            window.open('https://www.youtube.com', '_blank');
                          }
                        }}
                      >
                        <i className="fa-solid fa-play"></i>
                      </div>
                      <span className="video-label">Watch Full Keynote & Winner Presentation</span>
                    </div>
                  </>
                )}
              </div>
            </div>
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
                  <span className="stat-value status-completed">Completed</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Location</span>
                  {(() => {
                    const rawLoc = pastEvent.location || 'TRACE Expert City, Colombo';
                    const cleanLoc = Array.from(new Set(rawLoc.split(',').map((s) => s.trim()).filter(Boolean))).join(', ');
                    return (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cleanLoc)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="stat-value"
                        title="Click to view location pin on Google Maps"
                        style={{ color: '#5d4df6', textDecoration: 'underline', fontWeight: '600', cursor: 'pointer' }}
                      >
                        {cleanLoc} <i className="fa-solid fa-arrow-up-right-from-square" style={{ fontSize: '0.68rem', marginLeft: '3px' }}></i>
                      </a>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Share Panel */}
            <div className="past-sidebar-card">
              <h3 className="sidebar-card-title">Share Event Archive</h3>
              <div className="share-buttons-row">
                <button className="btn-share-icon" onClick={handleCopyShareLink} title="Copy Link">
                  <i className="fa-solid fa-link"></i> Copy Link
                </button>
              </div>
            </div>

            {/* Photo Gallery Showcase Grid (positioned in the right space next to the YouTube recording) */}
            {(() => {
              const galleryList = (pastEvent.gallery && pastEvent.gallery.length > 0)
                ? pastEvent.gallery
                : (pastEvent.coverImage ? [pastEvent.coverImage] : []);

              if (galleryList.length === 0) return null;

              return (
                <div className="past-sidebar-card past-gallery-sidebar-card">
                  <h3 className="sidebar-card-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.15rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <i className="fa-solid fa-images" style={{ color: '#5d4df6' }}></i> Event Gallery & Moments
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
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
