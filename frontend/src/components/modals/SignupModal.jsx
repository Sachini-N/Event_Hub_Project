import React, { useState } from 'react';

export default function SignupModal({
  isOpen,
  onClose,
  onSignupSuccess,
  switchToLogin,
  showToast,
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, contactNumber: phone, password }),
      });

      const result = await response.json();

      if (result.success && result.data) {
        onSignupSuccess(result.data);
        onClose();
        showToast(`Account created! Welcome to TRACE Event Hub, ${result.data.user.name}!`, 'success');
      } else {
        showToast(result.message || 'Signup failed', 'error');
      }
    } catch (error) {
      console.error('Signup error:', error);
      showToast('Network error during registration', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <i className="fa-solid fa-xmark"></i>
        </button>
        
        <div className="modal-header">
          <h2>Create Account</h2>
          <p className="modal-sub">Sign up for TRACE Event Hub to easily manage your event passes.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="signup-name">Full Name *</label>
            <input
              type="text"
              id="signup-name"
              required
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="signup-email">Email Address *</label>
            <input
              type="email"
              id="signup-email"
              required
              placeholder="john.doe@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="signup-phone">Contact Phone Number</label>
            <input
              type="tel"
              id="signup-phone"
              placeholder="+94 77 123 4567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="signup-password">Password *</label>
            <input
              type="password"
              id="signup-password"
              required
              minLength="6"
              placeholder="Min 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" class="btn btn-blue-pill" disabled={submitting}>
              {submitting ? 'Registering...' : 'Sign Up'}
            </button>
          </div>

          <p class="auth-switch-text" style={{ marginTop: '15px', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                switchToLogin();
              }}
              style={{ color: 'var(--primary-blue)', fontWeight: 600, textDecoration: 'none' }}
            >
              Log In
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}
