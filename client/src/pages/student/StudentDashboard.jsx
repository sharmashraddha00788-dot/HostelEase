import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import Modal from '../../components/Modal';

const StudentDashboard = () => {
  const { user, refreshUser } = useAuth();
  const [allocation, setAllocation] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [vacateModalOpen, setVacateModalOpen] = useState(false);
  const [message, setMessage] = useState(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [allocRes, compRes] = await Promise.all([
        api.get('/api/allocations/my'),
        api.get('/api/complaints/my'),
      ]);

      if (allocRes.success) {
        setAllocation(allocRes.allocation);
      }
      if (compRes.success) {
        setComplaints(compRes.complaints);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleVacateRoom = async () => {
    setActionLoading(true);
    setMessage(null);
    try {
      const res = await api.post('/api/allocations/vacate', {});
      if (res.success) {
        setMessage({ type: 'success', text: 'You have vacated your room successfully.' });
        setVacateModalOpen(false);
        await refreshUser();
        await fetchDashboardData();
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to vacate room.' });
    } finally {
      setActionLoading(false);
    }
  };

  const openComplaintsCount = complaints.filter((c) => c.status !== 'resolved').length;
  const resolvedComplaintsCount = complaints.filter((c) => c.status === 'resolved').length;

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
        <p>Loading your residence details...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Welcome Banner */}
      <div style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '26px', fontWeight: 800 }}>
          Welcome back, {user?.name?.split(' ')[0]} 👋
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
          Manage your room allotment status and track ongoing maintenance requests.
        </p>
      </div>

      {message && (
        <div className={`alert alert-${message.type}`}>
          <span>{message.type === 'success' ? '✅' : '⚠️'}</span>
          <span>{message.text}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="stat-grid">
        <div className="stat-card">
          <div>
            <div className="stat-value">
              {allocation?.status === 'approved' && allocation?.room
                ? `${allocation.room.block}-${allocation.room.roomNumber}`
                : allocation?.status === 'requested'
                ? 'Pending'
                : 'None'}
            </div>
            <div className="stat-label">Allocated Room</div>
          </div>
          <div className="stat-icon" style={{ background: '#e0e7ff', color: '#4f46e5' }}>
            🛏️
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-value" style={{ color: '#f59e0b' }}>
              {openComplaintsCount}
            </div>
            <div className="stat-label">Active Complaints</div>
          </div>
          <div className="stat-icon" style={{ background: '#fef3c7', color: '#b45309' }}>
            ⏳
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-value" style={{ color: '#10b981' }}>
              {resolvedComplaintsCount}
            </div>
            <div className="stat-label">Resolved Tickets</div>
          </div>
          <div className="stat-icon" style={{ background: '#ecfdf5', color: '#047857' }}>
            ✅
          </div>
        </div>
      </div>

      {/* Room Status Section */}
      <div className="card" style={{ marginBottom: '30px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 800 }}>Room Allotment Status</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Current residential status and room details
            </p>
          </div>
          {allocation && (
            <span className={`badge badge-${allocation.status}`}>
              {allocation.status}
            </span>
          )}
        </div>

        {/* Case 1: Approved Room */}
        {allocation?.status === 'approved' && allocation?.room ? (
          <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '24px' }}>
              <div>
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Room Number</span>
                <div style={{ fontSize: '20px', fontWeight: 800, marginTop: '2px' }}>
                  Block {allocation.room.block} — Room {allocation.room.roomNumber}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Floor</span>
                <div style={{ fontSize: '20px', fontWeight: 800, marginTop: '2px' }}>
                  Floor {allocation.room.floor}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Room Occupancy</span>
                <div style={{ fontSize: '20px', fontWeight: 800, marginTop: '2px' }}>
                  {allocation.room.occupied} / {allocation.room.capacity} Beds
                </div>
              </div>
              <div>
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Allotted Date</span>
                <div style={{ fontSize: '15px', fontWeight: 700, marginTop: '6px' }}>
                  {new Date(allocation.allottedDate || allocation.updatedAt).toLocaleDateString()}
                </div>
              </div>
            </div>

            {allocation.wardenNotes && (
              <div style={{ background: '#ffffff', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '20px', fontSize: '13px' }}>
                <strong>Warden Remarks:</strong> {allocation.wardenNotes}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                className="btn btn-danger btn-sm"
                onClick={() => setVacateModalOpen(true)}
              >
                Vacate This Room
              </button>
              <Link to="/app/complaints" className="btn btn-secondary btn-sm">
                Raise Room Issue
              </Link>
            </div>
          </div>
        ) : allocation?.status === 'requested' && allocation?.room ? (
          /* Case 2: Pending Request */
          <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', padding: '24px', borderRadius: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <span style={{ fontSize: '24px' }}>⏳</span>
              <div>
                <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#92400e' }}>
                  Room Request Submitted & Awaiting Approval
                </h4>
                <p style={{ fontSize: '13px', color: '#b45309' }}>
                  Requested <strong>Block {allocation.room.block} — Room {allocation.room.roomNumber}</strong> on {new Date(allocation.requestDate).toLocaleDateString()}.
                </p>
              </div>
            </div>
            <p style={{ fontSize: '13px', color: '#78350f' }}>
              The hostel warden is reviewing room availability and will verify your request shortly.
            </p>
          </div>
        ) : allocation?.status === 'rejected' ? (
          /* Case 3: Rejected */
          <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', padding: '24px', borderRadius: '12px' }}>
            <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#991b1b', marginBottom: '4px' }}>
              Previous Room Request Rejected
            </h4>
            <p style={{ fontSize: '13px', color: '#b91c1c', marginBottom: '16px' }}>
              Reason: {allocation.rejectionReason || 'No specific reason provided.'}
            </p>
            <Link to="/app/rooms" className="btn btn-primary btn-sm">
              Request Another Available Room →
            </Link>
          </div>
        ) : (
          /* Case 4: No room, no active request */
          <div style={{ textAlign: 'center', padding: '40px 20px', background: '#f8fafc', borderRadius: '12px', border: '1.5px dashed #cbd5e1' }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>🏢</div>
            <h4 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '6px' }}>No Room Allocated Yet</h4>
            <p style={{ fontSize: '13px', color: '#64748b', maxWidth: '440px', margin: '0 auto 20px' }}>
              You are currently not assigned to any hostel room. Browse available rooms with free beds to submit an allocation request.
            </p>
            <Link to="/app/rooms" className="btn btn-primary">
              View Available Rooms →
            </Link>
          </div>
        )}
      </div>

      {/* Recent Complaints Summary */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 800 }}>Recent Maintenance Complaints</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Latest tickets submitted from your room
            </p>
          </div>
          <Link to="/app/complaints" className="btn btn-secondary btn-sm">
            View All ({complaints.length})
          </Link>
        </div>

        {complaints.length === 0 ? (
          <p style={{ color: '#94a3b8', fontSize: '14px', textAlign: 'center', padding: '20px' }}>
            No complaints logged. Everything is in order! 🎉
          </p>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Submitted</th>
                </tr>
              </thead>
              <tbody>
                {complaints.slice(0, 4).map((c) => (
                  <tr key={c._id}>
                    <td style={{ fontWeight: 600 }}>{c.title}</td>
                    <td style={{ textTransform: 'capitalize' }}>{c.category}</td>
                    <td>
                      <span className={`badge badge-priority-${c.priority}`}>
                        {c.priority}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-${c.status}`}>
                        {c.status}
                      </span>
                    </td>
                    <td style={{ color: '#64748b', fontSize: '13px' }}>
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Vacate Confirmation Modal */}
      <Modal
        isOpen={vacateModalOpen}
        onClose={() => setVacateModalOpen(false)}
        title="Confirm Room Vacating"
      >
        <p style={{ color: '#475569', fontSize: '14px', lineHeight: 1.6, marginBottom: '20px' }}>
          Are you sure you want to vacate <strong>Block {allocation?.room?.block} — Room {allocation?.room?.roomNumber}</strong>?
          Your bed will immediately be made available for other students.
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setVacateModalOpen(false)}
            disabled={actionLoading}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={handleVacateRoom}
            disabled={actionLoading}
          >
            {actionLoading ? 'Vacating...' : 'Yes, Vacate Room'}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default StudentDashboard;
