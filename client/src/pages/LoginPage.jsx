import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    if (!email || !password) {
      setErrorMessage('Please fill in both email and password');
      return;
    }

    setLoading(true);
    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      if (result.user.role === 'student') {
        navigate('/app/dashboard');
      } else {
        navigate('/app/warden/dashboard');
      }
    } else {
      setErrorMessage(result.message || 'Invalid email or password');
    }
  };

  // Demo credential autofill helpers
  const fillDemo = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setErrorMessage('');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div className="card" style={{ maxWidth: '440px', width: '100%', padding: '36px' }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <span style={{ fontSize: '24px' }}>🏠</span>
            <span style={{ fontSize: '22px', fontWeight: 800, background: 'var(--primary-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              HostelEase
            </span>
          </Link>
          <h2 style={{ fontSize: '20px', fontWeight: 800 }}>Sign in to your account</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Enter your credentials to access the hostel portal
          </p>
        </div>

        {errorMessage && (
          <div className="alert alert-error">
            <span>⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              placeholder="e.g. student1@krmu.edu.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '8px' }}
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In →'}
          </button>
        </form>

        {/* Demo Fast Fill Buttons for Viva */}
        <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Fast Demo Login (For Viva / Evaluation):
          </span>
          <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => fillDemo('student1@krmu.edu.in', 'Student@123')}
            >
              🎓 Student
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => fillDemo('warden@hostelease.com', 'Warden@123')}
            >
              🛡️ Warden
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => fillDemo('admin@hostelease.com', 'Admin@123')}
            >
              👑 Admin
            </button>
          </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)', marginTop: '24px' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ fontWeight: 700, color: 'var(--primary)' }}>
            Register as a Student
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
