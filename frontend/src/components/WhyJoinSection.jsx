import React from 'react';

export default function WhyJoinSection() {
  return (
    <section className="features-section">
      <div className="section-container">
        <h2 className="features-title">Why Join TRACE Events?</h2>
        <div className="features-grid">

          {/* Card 1 */}
          <div className="feature-card">
            <div className="feature-icon icon-teal">
              <i className="fa-solid fa-graduation-cap"></i>
            </div>
            <h3 className="feature-heading">Learn from Experts</h3>
            <p className="feature-desc">
              Gain insights from industry leaders and seasoned professionals through hands-on workshops and insightful keynotes.
            </p>
          </div>

          {/* Card 2 */}
          <div className="feature-card">
            <div className="feature-icon icon-indigo">
              <i className="fa-solid fa-people-group"></i>
            </div>
            <h3 className="feature-heading">Connect with Community</h3>
            <p className="feature-desc">
              Network with like-minded individuals, build lasting relationships, and find collaborators for your next big project.
            </p>
          </div>

          {/* Card 3 */}
          <div className="feature-card">
            <div className="feature-icon icon-purple">
              <i className="fa-regular fa-lightbulb"></i>
            </div>
            <h3 className="feature-heading">Discover New Ideas</h3>
            <p className="feature-desc">
              Stay ahead of the curve by exploring emerging technologies, innovative methodologies, and fresh perspectives.
            </p>
          </div>

          {/* Card 4 */}
          <div className="feature-card">
            <div className="feature-icon icon-amber">
              <i className="fa-solid fa-rocket"></i>
            </div>
            <h3 className="feature-heading">Accelerate Career & Startups</h3>
            <p className="feature-desc">
              Connect with top tech companies, pitch to angel investors, and discover high-impact career and internship opportunities.
            </p>
          </div>

          {/* Card 5 */}
          <div className="feature-card">
            <div className="feature-icon icon-rose">
              <i className="fa-solid fa-laptop-code"></i>
            </div>
            <h3 className="feature-heading">Hands-on Tech & Hackathons</h3>
            <p className="feature-desc">
              Tackle real-world challenges, build innovative AI & software solutions, and compete for exciting prizes in team hackathons.
            </p>
          </div>

          {/* Card 6 */}
          <div className="feature-card">
            <div className="feature-icon icon-blue">
              <i className="fa-solid fa-building-circle-check"></i>
            </div>
            <h3 className="feature-heading">Access World-Class Facilities</h3>
            <p className="feature-desc">
              Enjoy state-of-the-art auditoriums, high-speed fiber spaces, and creative co-working hubs across all TRACE regional campuses.
            </p>
          </div>

        </div>
      </div>
    </section>
  );
}
