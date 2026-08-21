import React from 'react';

export default function Footer({ setActiveTab }) {
  const handleNavClick = (tabName, e) => {
    if (setActiveTab) {
      e.preventDefault();
      setActiveTab(tabName);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <footer className="footer">
      <div className="footer-container">
        {/* Brand & Summary Column */}
        <div className="footer-brand">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.75rem' }}>
            <h3 className="footer-logo" style={{ margin: 0 }}>
              TRACE <span className="logo-tracker-sub">Tracker</span>
            </h3>
          </div>
          <p className="footer-desc">
            Sri Lanka’s premier technology & innovation hub. Fostering tech entrepreneurs, innovation events, and world-class developer communities.
          </p>
        </div>

        {/* Contact Column matching reference screenshot */}
        <div className="footer-contact">
          <h4 className="footer-section-title">CONTACT</h4>
          <div className="footer-contact-info">
            <div className="contact-name">TRACE Expert City</div>
            <p>Maradana,</p>
            <p>Colombo 10.</p>
            <p style={{ marginTop: '0.75rem' }}>
              <a href="tel:+94701800786">+94 701 800 786</a> | <a href="tel:+94753637293">+94 753 637 293</a>
            </p>
            <p style={{ marginTop: '0.25rem' }}>
              <a href="mailto:connect@trace.lk">connect@trace.lk</a>
            </p>
          </div>
        </div>

        {/* Quick Links Column */}
        <div className="footer-links-col">
          <h4 className="footer-section-title">QUICK LINKS</h4>
          <ul className="footer-nav-list">
            <li>
              <a href="#upcoming" onClick={(e) => handleNavClick('upcoming', e)}>Upcoming Events</a>
            </li>
            <li>
              <a href="#past" onClick={(e) => handleNavClick('past', e)}>Past Events Archive</a>
            </li>
            <li>
              <a href="#venues" onClick={(e) => handleNavClick('venues', e)}>Explore Venues</a>
            </li>
            <li>
              <a href="#admin" onClick={(e) => handleNavClick('admin', e)}>Admin Portal</a>
            </li>
            <li>
              <a href="#privacy">Privacy Policy</a>
            </li>
            <li>
              <a href="#terms">Terms of Service</a>
            </li>
          </ul>
        </div>
      </div>

      {/* Social Icons Row & Bottom Bar matching reference screenshot */}
      <div className="footer-bottom-wrapper" style={{ maxWidth: '1240px', margin: '0 auto', padding: '0 1.5rem' }}>
        <div className="footer-social-row">
          <span className="footer-social-title">Follow Us</span>
          <div className="social-icons-group">
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="social-icon-btn"
              title="Facebook"
            >
              <i className="fa-brands fa-facebook-f"></i>
            </a>
            <a
              href="https://x.com"
              target="_blank"
              rel="noopener noreferrer"
              className="social-icon-btn"
              title="X (Twitter)"
            >
              <i className="fa-brands fa-x-twitter"></i>
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="social-icon-btn"
              title="Instagram"
            >
              <i className="fa-brands fa-instagram"></i>
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="social-icon-btn"
              title="LinkedIn"
            >
              <i className="fa-brands fa-linkedin-in"></i>
            </a>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} TRACE Sri Lanka. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

