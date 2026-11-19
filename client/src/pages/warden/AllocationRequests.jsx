import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import Modal from '../../components/Modal';

const AllocationRequests = () => {
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('requested');
  const [feedback, setFeedback] = useState(null);

  // Approve Modal State
  const [approveItem, setApproveItem] = useState(null);
  const [wardenNotes, setWardenNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Reject Modal State
  const [rejectItem, setRejectItem] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const fetchAllocations = async () => {
    setLoading(true);
    try {
      const qs = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
      const res = await api.get(`/api/allocations${qs}`);
      if (res.success) {
        setAllocations(res.allocations);
      }
    } catch (err) {
      console.error('Failed to load allocations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllocations();
  }, [statusFilter]);

  const handleApprove = async () => {
    if (!approveItem) return;
    setActionLoading(true);
    setFeedback(null);

    try {
      const res = await api.patch(`/api/allocations/${approveItem._id}/approve`, {
        wardenNotes,
      });

      if (res.success) {
        setFeedback({
          type: 'success',
          text: res.message || 'Request approved successfully! Bed taken atomically.',
        });
        setApproveItem(null);
        setWardenNotes('');
        await fetchAllocations();
      }
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Approval failed' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectItem) return;
    setActionLoading(true);
    setFeedback(null);

    try {
      const res = await api.patch(`/api/allocations/${rejectItem._id}/reject`, {
        rejectionReason: rejectionReason || 'Request rejected by warden',
      });

      if (res.success) {
        setFeedback({ type: 'success', text: 'Room request rejected.' });
        setRejectItem(null);
        setRejectionReason('');
        await fetchAllocations();
      }
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Rejection failed' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleAdminVacate = async (alloc) => {
    if (
      !window.confirm(
        `Vacate student ${alloc.student?.name} from Room ${alloc.room?.block}-${alloc.room?.roomNumber}?`
      )
    ) {
      return;
    }

    try {
      const res = await api.post(`/api/allocations/${alloc._id}/admin-vacate`);
      if (res.success) {
        setFeedback({ type: 'success', text: res.message });
        await fetchAllocations();
      }
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Failed to vacate room' });
    }
  };

  return (
    <div>
      {/* Page Title */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 800 }}>Room Allotments & Requests</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
          Process incoming room requests with atomic concurrency checks and track current allotments.
        </p>
      </div>

      {feedback && (
        <div className={`alert alert-${feedback.type}`}>
          <span>{feedback.type === 'success' ? '✅' : '⚠️'}</span>
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {['requested', 'approved', 'rejected', 'vacated', 'all'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className="btn btn-sm"
            style={{
              background: statusFilter === st ? 'var(--primary-gradient)' : '#ffffff',
              color: statusFilter === st ? '#ffffff' : 'var(--text-muted)',
              border: '1px solid var(--border-color)',
              textTransform: 'capitalize',
            }}
          >
            {st === 'requested' ? '⏳ Pending Requests' : st}
          </button>
        ))}
      </div>

      {/* Allocations Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
            Loading requests...
          </div>
        ) : allocations.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
            <div style={{ fontSize: '36px', marginBottom: '8px' }}>📂</div>
            <h4 style={{ fontSize: '16px', fontWeight: 800 }}>No requests in this category</h4>
            <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
              Check another status tab or wait for new student applications.
            </p>
          </div>
        ) : (
          <div className="table-container" style={{ border: 'none' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Requested Room</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Warden Remarks</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {allocations.map((item) => (
                  <tr key={item._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {item.student?.avatar ? (
                          <img
                            src={item.student.avatar}
                            alt={item.student.name}
                            className="avatar"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="avatar">
                            {item.student?.name?.charAt(0) || 'S'}
                          </div>
                        )}
                        <div>
                          <div style={{ fontWeight: 800, color: 'var(--text-main)' }}>
                            {item.student?.name || 'Unknown Student'}
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>
                            {item.student?.email} • {item.student?.phone || 'No phone'}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td>
                      {item.room ? (
                        <div>
                          <span style={{ fontWeight: 700 }}>
                            Block {item.room.block} — Room {item.room.roomNumber}
                          </span>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>
                            Floor {item.room.floor} • Occupied: {item.room.occupied}/{item.room.capacity}
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>Room unassigned</span>
                      )}
                    </td>

                    <td style={{ fontSize: '13px', color: '#64748b' }}>
                      {new Date(item.requestDate || item.createdAt).toLocaleDateString()}
                    </td>

                    <td>
                      <span className={`badge badge-${item.status}`}>
                        {item.status}
                      </span>
                    </td>

                    <td style={{ fontSize: '12px', maxWidth: '220px', color: '#475569' }}>
                      {item.wardenNotes || item.rejectionReason || '—'}
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      {item.status === 'requested' ? (
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => {
                              setApproveItem(item);
                              setWardenNotes('');
                            }}
                          >
                            ✓ Approve
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => {
                              setRejectItem(item);
                              setRejectionReason('');
                            }}
                          >
                            ✕ Reject
                          </button>
                        </div>
                      ) : item.status === 'approved' ? (
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ color: '#ef4444' }}
                          onClick={() => handleAdminVacate(item)}
                        >
                          Vacate Student
                        </button>
                      ) : (
                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>Archived</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Approve Modal */}
      <Modal
        isOpen={!!approveItem}
        onClose={() => setApproveItem(null)}
        title="Approve Room Allocation"
      >
        {approveItem && (
          <div>
            <p style={{ color: '#475569', fontSize: '14px', lineHeight: 1.6, marginBottom: '16px' }}>
              Approve allocation for <strong>{approveItem.student?.name}</strong> to{' '}
              <strong>
                Block {approveItem.room?.block} — Room {approveItem.room?.roomNumber}
              </strong>?
            </p>
            <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '16px', fontSize: '13px' }}>
              ⚡ <strong>Concurrency Safe:</strong> MongoDB will atomically increment room occupied count and check available capacity.
            </div>

            <div className="form-group">
              <label className="form-label">Warden Remarks / Instructions (Optional)</label>
              <textarea
                className="form-textarea"
                rows="3"
                placeholder="e.g. Approved. Keys can be collected from warden desk..."
                value={wardenNotes}
                onChange={(e) => setWardenNotes(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setApproveItem(null)}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleApprove}
                disabled={actionLoading}
              >
                {actionLoading ? 'Approving...' : 'Confirm & Allot Bed'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Reject Modal */}
      <Modal
        isOpen={!!rejectItem}
        onClose={() => setRejectItem(null)}
        title="Reject Room Allocation Request"
      >
        {rejectItem && (
          <div>
            <p style={{ color: '#475569', fontSize: '14px', lineHeight: 1.6, marginBottom: '16px' }}>
              Please specify the reason for rejecting <strong>{rejectItem.student?.name}</strong>'s request:
            </p>

            <div className="form-group">
              <label className="form-label">Rejection Reason</label>
              <textarea
                className="form-textarea"
                rows="3"
                placeholder="e.g. Document verification incomplete, please apply for Block B..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setRejectItem(null)}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleReject}
                disabled={actionLoading}
              >
                {actionLoading ? 'Rejecting...' : 'Reject Request'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AllocationRequests;
