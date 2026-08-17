import React from 'react';

export default function WhyJoinSection() {
  return (
    <section className="features-section">
      <div className="section-container">
        <h2 className="features-title">Why Join TRACE Events?</h2>
        <div className="features-grid">
          
          <div className="feature-card">
            <div className="feature-icon icon-teal">
              <i className="fa-solid fa-graduation-cap"></i>
            </div>
            <h3 className="feature-heading">Learn from Experts</h3>
            <p className="feature-desc">
              Gain insights from industry leaders and seasoned professionals through hands-on workshops and insightful keynotes.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon icon-indigo">
              <i className="fa-solid fa-people-group"></i>
            </div>
            <h3 className="feature-heading">Connect with Community</h3>
            <p className="feature-desc">
              Network with like-minded individuals, build lasting relationships, and find collaborators for your next big project.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon icon-purple">
              <i className="fa-regular fa-lightbulb"></i>
            </div>
            <h3 className="feature-heading">Discover New Ideas</h3>
            <p className="feature-desc">
              Stay ahead of the curve by exploring emerging technologies, innovative methodologies, and fresh perspectives.
            </p>
          </div>

        </div>
      </div>
    </section>
  );
}
