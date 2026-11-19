import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const Header = ({ onToggleSidebar, title }) => {
  const { user } = useAuth();
  const [imgError, setImgError] = useState(false);

  // Compute initials fallback
  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  return (
    <header className="topbar">
      {/* Left: Mobile Toggle & Page Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button
          onClick={onToggleSidebar}
          className="btn btn-secondary btn-sm"
          style={{ display: 'none' }}
          id="mobile-menu-btn"
          title="Toggle Menu"
        >
          ☰
        </button>
        <style>{`
          @media (max-width: 900px) {
            #mobile-menu-btn { display: inline-flex !important; }
          }
        `}</style>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 800 }}>{title || 'HostelEase Portal'}</h1>
        </div>
      </div>

      {/* Right: User Profile & Role Badge */}
      {user && (
        <div className="user-menu">
          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>
              {user.name}
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {user.email}
            </span>
          </div>

          {/* Role Badge */}
          <span className={`badge badge-${user.role}`}>
            {user.role}
          </span>

          {/* Avatar with fallback */}
          {user.avatar && !imgError ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="avatar"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="avatar">
              {getInitials(user.name)}
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Header;
