import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: '72px', fontWeight: 800, background: 'var(--primary-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1 }}>
        404
      </div>
      <h2 style={{ fontSize: '24px', fontWeight: 800, marginTop: '12px', marginBottom: '8px' }}>
        Page Not Found
      </h2>
      <p style={{ color: 'var(--text-muted)', maxWidth: '400px', marginBottom: '24px' }}>
        The page you are looking for does not exist or may have been moved.
      </p>
      <Link to="/" className="btn btn-primary">
        Return Home →
      </Link>
    </div>
  );
};

export default NotFoundPage;
