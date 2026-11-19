import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LandingPage = () => {
  const { user } = useAuth();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Navigation Bar */}
      <nav style={{
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid var(--border-color)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'var(--primary-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontSize: '20px',
              boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)',
            }}>
              🏠
            </div>
            <span style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.02em', background: 'var(--primary-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              HostelEase
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {user ? (
              <Link
                to={user.role === 'student' ? '/app/dashboard' : '/app/warden/dashboard'}
                className="btn btn-primary"
              >
                Go to Portal →
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn btn-secondary">
                  Log in
                </Link>
                <Link to="/register" className="btn btn-primary">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{
        padding: '80px 24px 60px',
        maxWidth: '1200px',
        margin: '0 auto',
        textAlign: 'center',
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 14px',
          background: 'var(--primary-light)',
          color: 'var(--primary)',
          borderRadius: '9999px',
          fontSize: '13px',
          fontWeight: 700,
          marginBottom: '24px',
        }}>
          ✨ Next-Gen Campus Residence Platform
        </div>

        <h1 style={{
          fontSize: 'clamp(36px, 6vw, 56px)',
          fontWeight: 800,
          lineHeight: 1.15,
          marginBottom: '20px',
          letterSpacing: '-0.03em',
        }}>
          Welcome to <span style={{ background: 'var(--primary-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>HostelEase</span>
        </h1>

        <p style={{
          fontSize: '18px',
          color: 'var(--text-muted)',
          maxWidth: '680px',
          margin: '0 auto 36px',
          lineHeight: 1.6,
        }}>
          Simplify hostel room allocations and streamline maintenance complaints with real-time atomic bookings, automated warden workflows, and instant ticket tracking.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '60px' }}>
          <Link to="/register" className="btn btn-primary btn-lg">
            Apply for a Room
          </Link>
          <Link to="/login" className="btn btn-secondary btn-lg">
            Warden / Admin Sign In
          </Link>
        </div>

        {/* Floating Dashboard Preview Card */}
        <div className="card" style={{
          maxWidth: '960px',
          margin: '0 auto',
          padding: '30px',
          textAlign: 'left',
          border: '1px solid rgba(226, 232, 240, 0.9)',
          boxShadow: '0 25px 50px -12px rgba(79, 70, 229, 0.15)',
          background: '#ffffff',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ef4444' }} />
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#f59e0b' }} />
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#10b981' }} />
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#64748b', marginLeft: '8px' }}>
                HostelEase Central Console Preview
              </span>
            </div>
            <span className="badge badge-student">Live Campus System</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Total Rooms</span>
              <div style={{ fontSize: '24px', fontWeight: 800, marginTop: '4px' }}>30 Rooms</div>
            </div>
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Total Residents</span>
              <div style={{ fontSize: '24px', fontWeight: 800, marginTop: '4px', color: '#4f46e5' }}>56 Students</div>
            </div>
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Occupancy Rate</span>
              <div style={{ fontSize: '24px', fontWeight: 800, marginTop: '4px', color: '#10b981' }}>82.4%</div>
            </div>
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Maintenance Tickets</span>
              <div style={{ fontSize: '24px', fontWeight: 800, marginTop: '4px', color: '#f59e0b' }}>14 Tracked</div>
            </div>
          </div>

          {/* Mini Room Map Preview */}
          <div style={{ background: '#ffffff', borderRadius: '12px', padding: '16px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700 }}>Block A & B Allocation Grid</span>
              <div style={{ display: 'flex', gap: '8px', fontSize: '11px', fontWeight: 600 }}>
                <span style={{ color: '#059669' }}>● Available</span>
                <span style={{ color: '#b45309' }}>● Partial</span>
                <span style={{ color: '#dc2626' }}>● Full</span>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: '6px' }}>
              {Array.from({ length: 20 }).map((_, i) => {
                const colors = ['#ecfdf5', '#fefce8', '#fff1f2', '#f1f5f9'];
                const borders = ['#a7f3d0', '#fde047', '#fca5a5', '#cbd5e1'];
                const idx = i % 4;
                return (
                  <div
                    key={i}
                    style={{
                      height: '28px',
                      borderRadius: '6px',
                      background: colors[idx],
                      border: `1px solid ${borders[idx]}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      fontWeight: 700,
                      color: '#334155',
                    }}
                  >
                    {101 + i}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section style={{
        padding: '60px 24px 80px',
        maxWidth: '1200px',
        margin: '0 auto',
        width: '100%',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '12px' }}>
            Engineered for Effortless Hostel Management
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '16px' }}>
            Everything students and campus administration need in one unified portal.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px',
        }}>
          <div className="card">
            <div style={{ fontSize: '32px', marginBottom: '14px' }}>⚡</div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '8px' }}>Atomic Capacity Control</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: 1.6 }}>
              Concurrent requests are safely checked and allotted in single atomic MongoDB operations to prevent overfilling beds.
            </p>
          </div>

          <div className="card">
            <div style={{ fontSize: '32px', marginBottom: '14px' }}>🛠️</div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '8px' }}>Maintenance Ticket Tracking</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: 1.6 }}>
              Students raise plumbing, electrical, and internet issues with priority tags and track live warden notes until resolution.
            </p>
          </div>

          <div className="card">
            <div style={{ fontSize: '32px', marginBottom: '14px' }}>📊</div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '8px' }}>Aggregation Dashboard</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: 1.6 }}>
              Wardens and admins visualize block-wise occupancy bars, colour-coded room maps, and real-time complaint status breakdowns.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        marginTop: 'auto',
        background: '#ffffff',
        borderTop: '1px solid var(--border-color)',
        padding: '24px',
        textAlign: 'center',
        color: 'var(--text-muted)',
        fontSize: '13px',
      }}>
        <p>
          <strong>HostelEase</strong> — Capstone Project #13 | KR Mangalam University (KRMU) | Built by Shraddha
        </p>
      </footer>
    </div>
  );
};

export default LandingPage;
