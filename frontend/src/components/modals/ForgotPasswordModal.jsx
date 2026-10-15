import React, { useState, useEffect, useRef } from 'react';

export default function ForgotPasswordModal({
  isOpen,
  onClose,
  switchToLogin,
  initialEmail = '',
  showToast,
}) {
  const [step, setStep] = useState('request'); // 'request' | 'reset' | 'success'
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [devOtpHint, setDevOtpHint] = useState(null);

  const otpInputRef = useRef(null);

  // Initialize or reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setEmail(initialEmail || '');
      setStep('request');
      setOtp('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPassword(false);
      setShowConfirmPassword(false);
      setDevOtpHint(null);
    }
  }, [isOpen, initialEmail]);

  // Resend countdown timer
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  if (!isOpen) return null;

  // Step 1: Request 6-digit Reset OTP
  const handleRequestOtp = async (e) => {
    if (e) e.preventDefault();
    if (!email || !email.includes('@')) {
      showToast('Please enter a valid email address.', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();

      if (data.success) {
        showToast(data.message || 'Verification code sent to your email!', 'success');
        if (data.devOtp) {
          setDevOtpHint(data.devOtp);
        }
        setStep('reset');
        setCountdown(60); // 60s cooldown before resend
        setTimeout(() => {
          if (otpInputRef.current) otpInputRef.current.focus();
        }, 150);
      } else {
        showToast(data.message || 'Failed to send reset code.', 'error');
      }
    } catch (err) {
      console.error('Forgot password request error:', err);
      showToast('Network error while requesting reset code.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Resend code handler
  const handleResendOtp = async () => {
    if (countdown > 0 || loading) return;
    await handleRequestOtp();
  };

  // Step 2: Submit Reset Password with OTP
  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!otp || otp.trim().length < 6) {
      showToast('Please enter the 6-digit verification code.', 'error');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      showToast('New password must be at least 6 characters long.', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match. Please verify.', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          otp: otp.trim(),
          newPassword,
        }),
      });

      const data = await response.json();

      if (data.success) {
        showToast('Password reset successfully!', 'success');
        setStep('success');
      } else {
        showToast(data.message || 'Failed to reset password.', 'error');
      }
    } catch (err) {
      console.error('Reset password error:', err);
      showToast('Network error while resetting password.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFinishAndLogin = () => {
    onClose();
    if (switchToLogin) {
      switchToLogin(email.trim());
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1250 }}>
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '460px',
          width: '92%',
          borderRadius: '20px',
          padding: '2.25rem 2rem',
          boxShadow: '0 24px 48px rgba(15, 23, 42, 0.28)',
          background: '#ffffff',
          position: 'relative',
          border: '1px solid #e2e8f0',
        }}
      >
        {/* Close Button */}
        <button
          className="modal-close"
          onClick={onClose}
          type="button"
          style={{
            top: '20px',
            right: '20px',
            background: '#f1f5f9',
            color: '#475569',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            cursor: 'pointer',
            transition: 'background 0.2s',
          }}
          title="Close modal"
        >
          <i className="fa-solid fa-xmark"></i>
        </button>

        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #ede9fe 0%, #e0e7ff 100%)',
              color: '#5d4df6',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              marginBottom: '0.85rem',
              boxShadow: '0 6px 16px rgba(93, 77, 246, 0.15)',
            }}
          >
            {step === 'success' ? (
              <i className="fa-solid fa-circle-check" style={{ color: '#10b981' }}></i>
            ) : step === 'reset' ? (
              <i className="fa-solid fa-shield-halved"></i>
            ) : (
              <i className="fa-solid fa-key"></i>
            )}
          </div>

          <h2 style={{ fontSize: '1.45rem', fontWeight: '800', color: '#0f172a', margin: '0 0 0.35rem 0' }}>
            {step === 'request' && 'Forgot Password?'}
            {step === 'reset' && 'Reset Your Password'}
            {step === 'success' && 'Password Reset Complete!'}
          </h2>

          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0, lineHeight: 1.45 }}>
            {step === 'request' &&
              "Enter your registered account email, and we'll send a 6-digit recovery code to reset your password."}
            {step === 'reset' && (
              <>
                Enter the 6-digit code sent to <strong style={{ color: '#0f172a' }}>{email}</strong> and set your new password.
              </>
            )}
            {step === 'success' && 'Your account password has been updated securely. You can now log in.'}
          </p>
        </div>

        {/* STEP 1: Request Code */}
        {step === 'request' && (
          <form onSubmit={handleRequestOtp} autoComplete="off">
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label
                htmlFor="forgot-email"
                style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#334155', marginBottom: '0.4rem' }}
              >
                Registered Email Address *
              </label>
              <div style={{ position: 'relative' }}>
                <i
                  className="fa-regular fa-envelope"
                  style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#94a3b8',
                    fontSize: '0.9rem',
                  }}
                ></i>
                <input
                  type="email"
                  id="forgot-email"
                  name="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 0.85rem 0.75rem 2.5rem',
                    fontSize: '0.88rem',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    outline: 'none',
                    background: '#ffffff',
                    color: '#0f172a',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            {/* Action Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.85rem 1rem',
                fontSize: '0.95rem',
                fontWeight: '800',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #5d4df6 0%, #4338ca 100%)',
                color: '#ffffff',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(93, 77, 246, 0.35)',
                transition: 'all 0.2s ease',
              }}
            >
              {loading ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin"></i> Sending Recovery Code...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-paper-plane"></i> Send 6-Digit Code
                </>
              )}
            </button>

            {/* Back to Login Link */}
            <div style={{ marginTop: '1.25rem', textAlign: 'center', fontSize: '0.85rem', color: '#64748b' }}>
              Remember your password?{' '}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  onClose();
                  if (switchToLogin) switchToLogin(email);
                }}
                style={{ color: '#5d4df6', fontWeight: '800', textDecoration: 'none' }}
              >
                Back to Log In
              </a>
            </div>
          </form>
        )}

        {/* STEP 2: Enter OTP & Set New Password */}
        {step === 'reset' && (
          <form onSubmit={handleResetPassword} autoComplete="off">
            {/* Dev OTP auto-hint banner if local/demo */}
            {devOtpHint && (
              <div
                style={{
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  color: '#166534',
                  borderRadius: '10px',
                  padding: '0.65rem 0.85rem',
                  fontSize: '0.82rem',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span>
                  <i className="fa-solid fa-circle-info" style={{ marginRight: '6px' }}></i>
                  Test Code: <strong>{devOtpHint}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => setOtp(devOtpHint)}
                  style={{
                    background: '#166534',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '2px 8px',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                  }}
                >
                  Auto Fill
                </button>
              </div>
            )}

            {/* 6-Digit Verification Code */}
            <div className="form-group" style={{ marginBottom: '1.1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <label
                  htmlFor="reset-otp"
                  style={{ fontSize: '0.82rem', fontWeight: '700', color: '#334155', margin: 0 }}
                >
                  6-Digit Verification Code *
                </label>
                <button
                  type="button"
                  onClick={() => setStep('request')}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    color: '#64748b',
                    fontSize: '0.78rem',
                    textDecoration: 'underline',
                    cursor: 'pointer',
                  }}
                >
                  Change email
                </button>
              </div>

              <div style={{ position: 'relative' }}>
                <i
                  className="fa-solid fa-key"
                  style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#94a3b8',
                    fontSize: '0.9rem',
                  }}
                ></i>
                <input
                  ref={otpInputRef}
                  type="text"
                  id="reset-otp"
                  name="otp"
                  required
                  maxLength={6}
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  style={{
                    width: '100%',
                    padding: '0.72rem 0.85rem 0.72rem 2.5rem',
                    fontSize: '1.05rem',
                    letterSpacing: '4px',
                    fontWeight: '700',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    outline: 'none',
                    background: '#f8fafc',
                    color: '#1e1b4b',
                    boxSizing: 'border-box',
                    fontFamily: 'monospace',
                  }}
                />
              </div>

              {/* Resend Code Row */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.4rem' }}>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={countdown > 0 || loading}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    fontSize: '0.8rem',
                    fontWeight: '700',
                    color: countdown > 0 ? '#94a3b8' : '#5d4df6',
                    cursor: countdown > 0 ? 'default' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <i className="fa-solid fa-rotate-right" style={{ fontSize: '0.75rem' }}></i>
                  {countdown > 0 ? `Resend code in ${countdown}s` : 'Resend Code'}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="form-group" style={{ marginBottom: '1.1rem' }}>
              <label
                htmlFor="reset-new-password"
                style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#334155', marginBottom: '0.4rem' }}
              >
                New Password * <span style={{ fontSize: '0.75rem', fontWeight: '400', color: '#64748b' }}>(min. 6 characters)</span>
              </label>
              <div style={{ position: 'relative' }}>
                <i
                  className="fa-solid fa-lock"
                  style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#94a3b8',
                    fontSize: '0.9rem',
                  }}
                ></i>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="reset-new-password"
                  name="newPassword"
                  required
                  placeholder="Enter new strong password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.72rem 2.6rem 0.72rem 2.5rem',
                    fontSize: '0.88rem',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    outline: 'none',
                    background: '#ffffff',
                    color: '#0f172a',
                    boxSizing: 'border-box',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    padding: 0,
                  }}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  <i className={`fa-regular ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div className="form-group" style={{ marginBottom: '1.35rem' }}>
              <label
                htmlFor="reset-confirm-password"
                style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#334155', marginBottom: '0.4rem' }}
              >
                Confirm New Password *
              </label>
              <div style={{ position: 'relative' }}>
                <i
                  className="fa-solid fa-check-double"
                  style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#94a3b8',
                    fontSize: '0.9rem',
                  }}
                ></i>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="reset-confirm-password"
                  name="confirmPassword"
                  required
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.72rem 2.6rem 0.72rem 2.5rem',
                    fontSize: '0.88rem',
                    borderRadius: '10px',
                    border: `1px solid ${
                      confirmPassword && confirmPassword !== newPassword ? '#f43f5e' : '#cbd5e1'
                    }`,
                    outline: 'none',
                    background: '#ffffff',
                    color: '#0f172a',
                    boxSizing: 'border-box',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    padding: 0,
                  }}
                  title={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  <i className={`fa-regular ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
              {confirmPassword && confirmPassword !== newPassword && (
                <div style={{ color: '#e11d48', fontSize: '0.75rem', marginTop: '0.35rem', fontWeight: '600' }}>
                  Passwords do not match
                </div>
              )}
            </div>

            {/* Reset Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.85rem 1rem',
                fontSize: '0.95rem',
                fontWeight: '800',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #5d4df6 0%, #4338ca 100%)',
                color: '#ffffff',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(93, 77, 246, 0.35)',
                transition: 'all 0.2s ease',
              }}
            >
              {loading ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin"></i> Resetting Password...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-lock-open"></i> Reset Password & Save
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 3: Success State */}
        {step === 'success' && (
          <div style={{ textAlign: 'center', paddingTop: '0.5rem' }}>
            <div
              style={{
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '12px',
                padding: '1.25rem',
                marginBottom: '1.5rem',
                color: '#166534',
                fontSize: '0.9rem',
                lineHeight: 1.5,
              }}
            >
              <i className="fa-solid fa-circle-check" style={{ fontSize: '1.5rem', marginBottom: '0.5rem', display: 'block', color: '#10b981' }}></i>
              Your password has been reset successfully. You can now log into TRACE Event Hub with your new password!
            </div>

            <button
              type="button"
              onClick={handleFinishAndLogin}
              style={{
                width: '100%',
                padding: '0.85rem 1rem',
                fontSize: '0.95rem',
                fontWeight: '800',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#ffffff',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
              }}
            >
              <i className="fa-solid fa-right-to-bracket"></i> Go to Log In Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
