import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    const result = await register(name, email, password, phone);
    setLoading(false);

    if (result.success) {
      navigate('/app/dashboard');
    } else {
      setErrorMessage(result.message || 'Registration failed');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div className="card" style={{ maxWidth: '460px', width: '100%', padding: '36px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <span style={{ fontSize: '24px' }}>🏠</span>
            <span style={{ fontSize: '22px', fontWeight: 800, background: 'var(--primary-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              HostelEase
            </span>
          </Link>
          <h2 style={{ fontSize: '20px', fontWeight: 800 }}>Create Student Account</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Register to request hostel rooms and submit maintenance tickets
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
            <label className="form-label">Full Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Shraddha Sharma"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">College Email Address</label>
            <input
              type="email"
              className="form-input"
              placeholder="e.g. yourname@krmu.edu.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Mobile Number (Optional)</label>
            <input
              type="tel"
              className="form-input"
              placeholder="e.g. +91 9876543210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="Minimum 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '16px' }}>
            🔒 Note: Public registrations are assigned the <strong>Student</strong> role.
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%' }}
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Complete Registration →'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)', marginTop: '24px' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ fontWeight: 700, color: 'var(--primary)' }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
