import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  if (!user) return null;

  const isStudent = user.role === 'student';
  const isWardenOrAdmin = user.role === 'warden' || user.role === 'admin';
  const isAdmin = user.role === 'admin';

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.4)',
            backdropFilter: 'blur(2px)',
            zIndex: 35,
          }}
        />
      )}

      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        {/* Header / Brand */}
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="url(#brandGrad)">
              <defs>
                <linearGradient id="brandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#4f46e5" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
              </defs>
              <path d="M12 3L2 12h3v8h6v-6h2v6h6v-8h3L12 3z" />
            </svg>
            <span>HostelEase</span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="sidebar-nav">
          {/* STUDENT ROUTES */}
          {isStudent && (
            <>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '8px 14px 4px' }}>
                Student Portal
              </div>
              <NavLink
                to="/app/dashboard"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <span>📊</span>
                <span>My Dashboard</span>
              </NavLink>
              <NavLink
                to="/app/rooms"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <span>🛏️</span>
                <span>Available Rooms</span>
              </NavLink>
              <NavLink
                to="/app/complaints"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <span>🛠️</span>
                <span>Complaints</span>
              </NavLink>
            </>
          )}

          {/* WARDEN & ADMIN ROUTES */}
          {isWardenOrAdmin && (
            <>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '8px 14px 4px' }}>
                Management
              </div>
              <NavLink
                to="/app/warden/dashboard"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <span>📊</span>
                <span>Overview & Map</span>
              </NavLink>
              <NavLink
                to="/app/warden/rooms"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <span>🏢</span>
                <span>Manage Rooms</span>
              </NavLink>
              <NavLink
                to="/app/warden/allocations"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <span>📝</span>
                <span>Room Requests</span>
              </NavLink>
              <NavLink
                to="/app/warden/complaints"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <span>🛠️</span>
                <span>Complaint Tickets</span>
              </NavLink>
            </>
          )}

          {/* ADMIN EXCLUSIVE */}
          {isAdmin && (
            <>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '16px 14px 4px' }}>
                Administration
              </div>
              <NavLink
                to="/app/admin/users"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <span>👥</span>
                <span>User Directory</span>
              </NavLink>
            </>
          )}
        </nav>

        {/* Footer / Logout */}
        <div className="sidebar-footer">
          <button
            onClick={logout}
            className="btn btn-secondary"
            style={{ width: '100%', justifyContent: 'flex-start', color: '#ef4444' }}
          >
            <span>🚪</span>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
