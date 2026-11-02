import { useState, useEffect } from 'react';
import { authApi } from '../services/api.js';

export default function Login({ onLogin }) {
  // Modes: 'login' | 'register' | 'forgot' | 'reset'
  const [mode, setMode] = useState('login');
  const [f, set] = useState({ name: '', email: '', password: '', newPassword: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetToken, setResetToken] = useState('');

  // Handle URL actions from transactional email links (?action=verify-email, ?action=reset-password)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const action = params.get('action');
    const token = params.get('token');
    const emailParam = params.get('email');

    if (emailParam) {
      set((prev) => ({ ...prev, email: emailParam }));
    }

    if (action === 'verify-email' && token) {
      setLoading(true);
      authApi
        .verifyEmail(token)
        .then((res) => {
          setSuccess('Email verified successfully! Welcome to Savastro.');
          if (res.user) {
            setTimeout(() => onLogin(res.user), 1500);
          }
        })
        .catch((err) => {
          setError(err.message || 'Verification link is invalid or has expired.');
        })
        .finally(() => setLoading(false));
    } else if (action === 'reset-password' && token) {
      setResetToken(token);
      setMode('reset');
      setSuccess('Please enter your new password below.');
    }
  }, [onLogin]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setSuccess('');

    const email = f.email.trim();
    const name = f.name.trim();
    const password = f.password;

    // Mode: LOGIN
    if (mode === 'login') {
      if (!email || !email.includes('@')) {
        setError('Please enter a valid email address.');
        return;
      }
      setLoading(true);
      try {
        const res = await authApi.login({ email, password });
        if (res.user) {
          onLogin(res.user);
        }
      } catch (err) {
        setError(err.message || 'Unable to log in. Please check your credentials.');
      } finally {
        setLoading(false);
      }
      return;
    }

    // Mode: REGISTER
    if (mode === 'register') {
      if (!name) {
        setError('Please enter your name.');
        return;
      }
      if (!email || !email.includes('@')) {
        setError('Please enter a valid email address.');
        return;
      }
      if (!password || password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }

      setLoading(true);
      try {
        const res = await authApi.register({ name, email, password });
        if (res.user) {
          onLogin(res.user);
        }
      } catch (err) {
        setError(err.message || 'Registration failed. Please try again.');
      } finally {
        setLoading(false);
      }
      return;
    }

    // Mode: FORGOT PASSWORD
    if (mode === 'forgot') {
      if (!email || !email.includes('@')) {
        setError('Please enter a valid email address.');
        return;
      }
      setLoading(true);
      try {
        const res = await authApi.forgotPassword(email);
        setSuccess(res.message || 'If an account exists, a password reset link has been sent to your email.');
      } catch (err) {
        setError(err.message || 'Unable to send password reset email.');
      } finally {
        setLoading(false);
      }
      return;
    }

    // Mode: RESET PASSWORD
    if (mode === 'reset') {
      const newPass = f.newPassword || f.password;
      if (!newPass || newPass.length < 6) {
        setError('New password must be at least 6 characters.');
        return;
      }
      setLoading(true);
      try {
        const res = await authApi.resetPassword({ token: resetToken, password: newPass });
        setSuccess('Password reset successfully! Redirecting...');
        if (res.user) {
          setTimeout(() => onLogin(res.user), 1500);
        }
      } catch (err) {
        setError(err.message || 'Failed to reset password. Link may be expired.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 16 }}>
      <div className="card center" style={{ maxWidth: 380, width: '100%' }}>
        <div className="logo" style={{ padding: 0 }}>Savastro</div>
        <p className="sub">
          {mode === 'login' && 'Your mood, your healing journey.'}
          {mode === 'register' && 'Begin your mindful healing journey.'}
          {mode === 'forgot' && 'Reset your password via email.'}
          {mode === 'reset' && 'Choose a secure new password.'}
        </p>

        {mode === 'register' && (
          <input
            placeholder="Your name"
            value={f.name}
            disabled={loading}
            onChange={(e) => {
              set({ ...f, name: e.target.value });
              if (error) setError('');
            }}
          />
        )}

        {mode !== 'reset' && (
          <input
            type="email"
            placeholder="Email"
            value={f.email}
            disabled={loading}
            aria-invalid={error ? 'true' : 'false'}
            onChange={(e) => {
              set({ ...f, email: e.target.value });
              if (error) setError('');
            }}
            onKeyDown={(e) => e.key === 'Enter' && !loading && handleSubmit()}
          />
        )}

        {(mode === 'login' || mode === 'register') && (
          <input
            type="password"
            placeholder="Password"
            value={f.password}
            disabled={loading}
            onChange={(e) => {
              set({ ...f, password: e.target.value });
              if (error) setError('');
            }}
            onKeyDown={(e) => e.key === 'Enter' && !loading && handleSubmit()}
          />
        )}

        {mode === 'reset' && (
          <input
            type="password"
            placeholder="New Password (min 6 characters)"
            value={f.newPassword}
            disabled={loading}
            onChange={(e) => {
              set({ ...f, newPassword: e.target.value });
              if (error) setError('');
            }}
            onKeyDown={(e) => e.key === 'Enter' && !loading && handleSubmit()}
          />
        )}

        {error && (
          <p
            role="alert"
            style={{ color: '#ef4444', fontSize: 13, margin: '8px 0 0', textAlign: 'center' }}
          >
            {error}
          </p>
        )}

        {success && (
          <p
            role="status"
            style={{ color: '#4cd7f6', fontSize: 13, margin: '8px 0 0', textAlign: 'center' }}
          >
            {success}
          </p>
        )}

        <p style={{ marginTop: error || success ? 12 : 16 }}>
          <button
            className="btn"
            style={{ width: '100%' }}
            disabled={loading}
            onClick={handleSubmit}
          >
            {loading
              ? 'Please wait...'
              : mode === 'login'
              ? 'Login'
              : mode === 'register'
              ? 'Create Account'
              : mode === 'forgot'
              ? 'Send Reset Link'
              : 'Reset Password'}
          </button>
        </p>

        {/* Minimal, elegant mode toggle links matching card typography */}
        <div style={{ marginTop: 14, fontSize: 13, color: '#9aa0b6', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {mode === 'login' && (
            <>
              <div>
                Don't have an account?{' '}
                <button
                  type="button"
                  style={{ background: 'none', border: 0, color: '#d0bcff', padding: 0, textDecoration: 'underline' }}
                  onClick={() => {
                    setMode('register');
                    setError('');
                    setSuccess('');
                  }}
                >
                  Sign up
                </button>
              </div>
              <div>
                <button
                  type="button"
                  style={{ background: 'none', border: 0, color: '#9aa0b6', padding: 0 }}
                  onClick={() => {
                    setMode('forgot');
                    setError('');
                    setSuccess('');
                  }}
                >
                  Forgot password?
                </button>
              </div>
            </>
          )}

          {mode === 'register' && (
            <div>
              Already have an account?{' '}
              <button
                type="button"
                style={{ background: 'none', border: 0, color: '#d0bcff', padding: 0, textDecoration: 'underline' }}
                onClick={() => {
                  setMode('login');
                  setError('');
                  setSuccess('');
                }}
              >
                Login
              </button>
            </div>
          )}

          {(mode === 'forgot' || mode === 'reset') && (
            <div>
              <button
                type="button"
                style={{ background: 'none', border: 0, color: '#d0bcff', padding: 0, textDecoration: 'underline' }}
                onClick={() => {
                  setMode('login');
                  setError('');
                  setSuccess('');
                }}
              >
                Back to Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
