import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid #e2e8f0',
            borderTopColor: '#4f46e5',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 16px',
          }} />
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          <p style={{ color: '#64748b', fontWeight: 600 }}>Loading HostelEase...</p>
        </div>
      </div>
    );
  }

  // Not logged in -> redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Role check: if current user role is not in allowedRoles
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '80vh',
        padding: '24px',
        textAlign: 'center',
      }}>
        <div style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          background: '#fee2e2',
          color: '#ef4444',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '32px',
          marginBottom: '20px',
        }}>
          🚫
        </div>
        <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>403 — Access Forbidden</h2>
        <p style={{ color: '#64748b', maxWidth: '440px', marginBottom: '24px' }}>
          You do not have permission to view this section. This portal is restricted to {allowedRoles.join(' or ')} accounts.
        </p>
        <button
          className="btn btn-primary"
          onClick={() => {
            window.location.href = user.role === 'student' ? '/app/dashboard' : '/app/warden/dashboard';
          }}
        >
          Return to Your Dashboard
        </button>
      </div>
    );
  }

  return <Outlet />;
};

export default ProtectedRoute;
