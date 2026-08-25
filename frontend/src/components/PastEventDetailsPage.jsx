import React, { useState } from 'react';

export default function PastEventDetailsPage({
  event,
  onBack,
  showToast,
  onOpenGalleryLightbox,
}) {
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);

  const getYouTubeEmbedUrl = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? `https://www.youtube.com/embed/${match[2]}?autoplay=1` : null;
  };
  // Default fallback data if event object is partial or missing
  const pastEvent = event || {
    _id: 'default-past-1',
    title: 'CodeFest Colombo: Annual Hackathon',
    category: 'Top Pick',
    date: '2024-08-10T09:00:00.000Z',
    endDate: '2024-08-12T17:00:00.000Z',
    location: 'TRACE Expert City, Colombo, Sri Lanka',
    coverImage: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=1200&q=80',
    description:
      'Over 500 developers, designers, and innovators gathered for 48 hours of non-stop coding, solving real-world challenges in sustainable tech, artificial intelligence, and green mobility.',
    attendeesCount: '520+ Participants',
    winners: 'Team EcoTech (1st Place)',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    highlights: [
      '48-Hour Non-stop Innovation Hackathon',
      'Over 50 Mentors, Industry Experts & Judges',
      'Rs. 1,500,000 Total Prize Pool Awarded',
      '12 Seed-Stage Sustainable Tech Startups Formed',
    ],
    gallery: [
      'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80',
    ],
  };

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
              <div className="video-player-container" style={{ position: 'relative', overflow: 'hidden', borderRadius: '12px', minHeight: '320px' }}>
                {isPlayingVideo && getYouTubeEmbedUrl(pastEvent.videoUrl) ? (
                  <iframe
                    src={getYouTubeEmbedUrl(pastEvent.videoUrl)}
                    title={`${pastEvent.title} Keynote Recording`}
                    style={{ width: '100%', height: '320px', border: 0, borderRadius: '12px' }}
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

            {/* Photo Gallery Showcase Grid */}
            {pastEvent.gallery && pastEvent.gallery.length > 0 && (
              <div className="past-content-card">
                <h2 className="past-card-heading">
                  <i className="fa-solid fa-images"></i> Event Photo Gallery & Moments
                </h2>
                <div className="past-gallery-grid-4col">
                  {pastEvent.gallery.map((item, gIdx) => {
                    const imgUrl = typeof item === 'string' ? item : (item.url || item);
                    return (
                      <div
                        key={gIdx}
                        className="past-gallery-thumb"
                        onClick={() =>
                          onOpenGalleryLightbox &&
                          onOpenGalleryLightbox({ coverImage: imgUrl, title: `${pastEvent.title} Gallery #${gIdx + 1}` }, gIdx)
                        }
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
                  <span className="stat-value status-completed">Completed</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Location</span>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pastEvent.location || 'TRACE Expert City')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="stat-value"
                    title="Click to view location pin on Google Maps"
                    style={{ color: '#5d4df6', textDecoration: 'underline', fontWeight: '600', cursor: 'pointer' }}
                  >
                    {pastEvent.location} <i className="fa-solid fa-arrow-up-right-from-square" style={{ fontSize: '0.68rem' }}></i>
                  </a>
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
                <button
                  className="btn-share-icon btn-linkedin"
                  onClick={() => window.open('https://linkedin.com', '_blank')}
                  title="Share on LinkedIn"
                >
                  <i className="fa-brands fa-linkedin"></i> LinkedIn
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
