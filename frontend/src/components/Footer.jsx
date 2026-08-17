import React from 'react';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-left">
          <h3 className="footer-logo">TRACE <span className="logo-sub">Sri Lanka</span></h3>
          <p className="footer-copyright">&copy; 2024 TRACE Sri Lanka. All rights reserved.</p>
        </div>

        <div className="footer-links">
          <a href="#">About Us</a>
          <a href="#">Contact</a>
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
        </div>
      </div>
    </footer>
  );
}
