import React from 'react';

export default function PastEventsSection({ events = [], setActiveTab, onSelectPastEvent }) {
  const samplePastEvents = [
    {
      _id: 'past-evt-1',
      title: 'CodeFest Colombo: Annual Hackathon',
      category: 'Top Pick',
      date: '2024-08-10T09:00:00.000Z',
      endDate: '2024-08-12T17:00:00.000Z',
      location: 'TRACE Expert City, Colombo, Sri Lanka',
      coverImage: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=1200&q=80',
      description:
        'Over 500 developers gathered for 48 hours of non-stop coding, solving real-world challenges in sustainable tech, artificial intelligence, and green mobility.',
      attendeesCount: '520+ Participants',
      winners: 'Team EcoTech (1st Place)',
      videoUrl: 'https://www.youtube.com/',
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
    },
    {
      _id: 'past-evt-2',
      title: 'FinTech Innovation Summit',
      category: 'Keynote',
      date: '2024-07-22T09:30:00.000Z',
      location: 'BMICH, Colombo, Sri Lanka',
      coverImage: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=1200&q=80',
      description:
        'Sri Lanka’s premier financial technology gathering featuring keynotes from global leaders, digital banking showcases, and open finance discussions.',
      attendeesCount: '450+ Attendees',
      winners: 'PayNext (FinTech Startup of the Year)',
      videoUrl: 'https://www.youtube.com/',
      highlights: [
        'Keynote Speeches on Central Bank Digital Currency (CBDC)',
        'Panel Discussions on AI Fraud Detection & Open Banking API',
        'Live FinTech Product Demos from 15 Companies',
      ],
      gallery: [
        'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80',
      ],
    },
    {
      _id: 'past-evt-3',
      title: 'Future of Cloud Computing',
      category: 'Archive',
      date: '2024-06-15T10:00:00.000Z',
      location: 'TRACE Auditorium, Colombo',
      coverImage: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
      description:
        'Hands-on technical summit exploring serverless architecture, Kubernetes orchestration, multi-cloud strategy, and cloud cost optimization.',
      attendeesCount: '380+ Engineers',
      winners: 'CloudArchitect Certification Recipients',
      videoUrl: 'https://www.youtube.com/',
      highlights: [
        'Serverless & Microservices Deep Dive Workshops',
        'Multi-Cloud Security Best Practices',
        'Real-world Cloud Migration Case Studies',
      ],
      gallery: [
        'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80',
      ],
    },
  ];

  // Filter real past events from database (events with status === 'past' or past dates)
  const dbPastEvents = events.filter(
    (e) => e.status === 'past' || (e.date && new Date(e.date) < new Date() && e.status !== 'draft')
  );

  // Combine DB past events with sample past events
  const displayList = dbPastEvents.length > 0 ? [...dbPastEvents, ...samplePastEvents] : samplePastEvents;

  const card1 = displayList[0] || samplePastEvents[0];
  const card2 = displayList[1] || samplePastEvents[1];
  const card3 = displayList[2] || samplePastEvents[2];

  const handleCardClick = (evt) => {
    if (onSelectPastEvent) {
      onSelectPastEvent(evt);
    } else if (setActiveTab) {
      setActiveTab('past');
    }
  };

  return (
    <section className="past-events-section" id="past-showcase">
      <div className="section-container">
        <div className="past-section-header">
          <h2>Explore Past Events</h2>
          <p>Catch up on what you missed and get a feel for the TRACE experience.</p>
        </div>

        <div className="past-grid-layout">
          {/* Large Past Event Card */}
          <div
            className="past-card past-card-large"
            style={{
              backgroundImage: `url('${card1.coverImage}')`,
              cursor: 'pointer',
            }}
            onClick={() => handleCardClick(card1)}
          >
            <div className="past-card-overlay"></div>
            <div className="past-card-content">
              <span className="past-badge">{card1.category || 'Past Event'}</span>
              <h3 className="past-card-title">{card1.title}</h3>
              <p className="past-card-text">{card1.description || card1.shortDescription}</p>
              <button
                className="btn btn-outline-light"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCardClick(card1);
                }}
              >
                View Event Details
              </button>
            </div>
          </div>

          {/* Medium Past Event Card 1 */}
          <div
            className="past-card past-card-medium"
            style={{
              backgroundImage: `url('${card2.coverImage}')`,
              cursor: 'pointer',
            }}
            onClick={() => handleCardClick(card2)}
          >
            <div className="past-card-overlay"></div>
            <div className="past-card-content">
              <span className="past-badge">{card2.category || 'Past Event'}</span>
              <h3 className="past-card-title">{card2.title}</h3>
              <button
                className="btn btn-solid-white"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCardClick(card2);
                }}
              >
                View Details
              </button>
            </div>
          </div>

          {/* Medium Past Event Card 2 */}
          <div
            className="past-card past-card-medium"
            style={{
              backgroundImage: `url('${card3.coverImage}')`,
              cursor: 'pointer',
            }}
            onClick={() => handleCardClick(card3)}
          >
            <div className="past-card-overlay"></div>
            <div className="past-card-content">
              <span className="past-badge">{card3.category || 'Archive'}</span>
              <h3 className="past-card-title">{card3.title}</h3>
              <button
                className="btn btn-solid-white"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCardClick(card3);
                }}
              >
                Read Summary
              </button>
            </div>
          </div>

          {/* Full Archive Banner Card */}
          <div
            className="past-card archive-banner-card"
            style={{ cursor: 'pointer' }}
            onClick={() => handleCardClick(card1)}
          >
            <div className="archive-watermark">ARCHIVE</div>
            <div className="past-card-content">
              <h3 className="archive-title">Access the Full Archive</h3>
              <p className="archive-desc">
                Browse through years of workshops, summits, and meetups. Filter by topic to find the resources most relevant to your career.
              </p>
              <button
                className="btn btn-white-pill"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCardClick(card1);
                }}
              >
                Browse All Past Events ({dbPastEvents.length} Published) <i className="fa-solid fa-arrow-right-long"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
