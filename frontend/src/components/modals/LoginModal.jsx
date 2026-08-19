import React, { useState } from 'react';

export default function LoginModal({
  isOpen,
  onClose,
  onLoginSuccess,
  switchToSignup,
  showToast,
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (result.success && result.data) {
        onLoginSuccess(result.data);
        onClose();
        showToast(`Welcome back, ${result.data.user.name}!`, 'success');
      } else {
        showToast(result.message || 'Login failed', 'error');
      }
    } catch (error) {
      console.error('Login error:', error);
      showToast('Network error during login', 'error');
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
          <h2>Log In</h2>
          <p className="modal-sub">Log in to your TRACE Event Hub account.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="login-email">Email Address *</label>
            <input
              type="email"
              id="login-email"
              required
              placeholder="john.doe@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="login-password">Password *</label>
            <input
              type="password"
              id="login-password"
              required
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-blue-pill" disabled={submitting}>
              {submitting ? 'Logging in...' : 'Log In'}
            </button>
          </div>

          <p className="auth-switch-text" style={{ marginTop: '15px', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Don't have an account?{' '}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                switchToSignup();
              }}
              style={{ color: 'var(--primary-blue)', fontWeight: 600, textDecoration: 'none' }}
            >
              Sign Up
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}
