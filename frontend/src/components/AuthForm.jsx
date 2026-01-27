import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../Auth.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

export default function AuthForm({ mode = 'login' }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [showPwd, setShowPwd] = useState(false);

  const endpoint = mode === 'signup' ? '/api/auth/signup' : '/api/auth/login';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (res.ok) {
        if (mode === 'signup') {
          setMessage('Signup successful — please login.');
          setEmail('');
          setPassword('');
          setTimeout(() => navigate('/login', { replace: true }), 900);
        } else {
          localStorage.setItem('token', data.token);
          setMessage('Login successful — redirecting...');
          setTimeout(() => navigate('/dashboard'), 600);
        }
      } else {
        setError(data.message || 'Request failed');
      }
    } catch (err) {
      setError('Server error — is the backend running?');
      console.error('Auth error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="auth-header">
          <div className="auth-logo" aria-hidden>
            <svg width="42" height="42" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="2" y="2" width="20" height="20" rx="6" fill="#4F46E5" />
              <path d="M7 12h10M7 8h10M7 16h6" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h2>{mode === 'signup' ? 'Create account' : 'Welcome back'}</h2>
          <p className="auth-sub">{mode === 'signup' ? 'Fill details to join us' : 'Sign in to continue'}</p>
        </div>

        {error && <div className="auth-message error">{error}</div>}
        {message && <div className="auth-message success">{message}</div>}

        <label className="input-label">Email</label>
        <input
          type="email"
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label className="input-label">Password</label>
        <div className="password-row">
          <input
            type={showPwd ? 'text' : 'password'}
            placeholder="Choose a strong password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="button"
            className="pwd-toggle"
            onClick={() => setShowPwd((s) => !s)}
            aria-label="Toggle password visibility"
          >
            {showPwd ? 'Hide' : 'Show'}
          </button>
        </div>

        <button type="submit" disabled={loading} className="primary-btn">
          {loading ? (mode === 'signup' ? 'Signing up...' : 'Signing in...') : mode === 'signup' ? 'Create account' : 'Sign in'}
        </button>

        <div className="auth-footer">
          {mode === 'signup' ? (
            <span>
              Already have an account? <a href="/login">Sign in</a>
            </span>
          ) : (
            <span>
              Don't have an account? <a href="/signup">Create one</a>
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
