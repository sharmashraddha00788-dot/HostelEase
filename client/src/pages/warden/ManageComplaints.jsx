import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import Modal from '../../components/Modal';

const ManageComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [feedback, setFeedback] = useState(null);

  // Edit / Status Update Modal State
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [newStatus, setNewStatus] = useState('open');
  const [remarks, setRemarks] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      let params = [];
      if (statusFilter !== 'all') params.push(`status=${statusFilter}`);
      if (categoryFilter !== 'all') params.push(`category=${categoryFilter}`);
      const qs = params.length ? `?${params.join('&')}` : '';

      const res = await api.get(`/api/complaints${qs}`);
      if (res.success) {
        setComplaints(res.complaints);
      }
    } catch (err) {
      console.error('Failed to load complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [statusFilter, categoryFilter]);

  const handleOpenEdit = (comp) => {
    setSelectedComplaint(comp);
    setNewStatus(comp.status);
    setRemarks(comp.wardenRemarks || '');
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!selectedComplaint) return;
    setSaving(true);
    setFeedback(null);

    try {
      const res = await api.patch(`/api/complaints/${selectedComplaint._id}`, {
        status: newStatus,
        wardenRemarks: remarks,
      });

      if (res.success) {
        setFeedback({
          type: 'success',
          text: `Ticket #${selectedComplaint._id.slice(-6)} updated to "${newStatus}".`,
        });
        setSelectedComplaint(null);
        await fetchComplaints();
      }
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Failed to update ticket' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 800 }}>Maintenance Ticket Management</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
          Inspect room issues, assign technicians, update resolution status, and add remarks.
        </p>
      </div>

      {feedback && (
        <div className={`alert alert-${feedback.type}`}>
          <span>{feedback.type === 'success' ? '✅' : '⚠️'}</span>
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '24px', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '13px', fontWeight: 700, color: '#475569' }}>Status:</label>
          <select
            className="form-select"
            style={{ width: 'auto', padding: '6px 12px', fontSize: '13px' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="open">Open</option>
            <option value="in-progress">In-Progress</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '13px', fontWeight: 700, color: '#475569' }}>Category:</label>
          <select
            className="form-select"
            style={{ width: 'auto', padding: '6px 12px', fontSize: '13px' }}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">All Categories</option>
            <option value="plumbing">Plumbing</option>
            <option value="electrical">Electrical</option>
            <option value="cleaning">Cleaning</option>
            <option value="internet">Internet / Wi-Fi</option>
            <option value="furniture">Furniture</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div style={{ marginLeft: 'auto', fontSize: '13px', color: '#64748b', fontWeight: 600 }}>
          {complaints.length} tickets matching filters
        </div>
      </div>

      {/* Complaints List / Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
            Loading tickets...
          </div>
        ) : complaints.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
            No complaints found with current filters.
          </div>
        ) : (
          <div className="table-container" style={{ border: 'none' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Issue Details</th>
                  <th>Student & Room</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Warden Remarks</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map((comp) => (
                  <tr key={comp._id}>
                    <td style={{ maxWidth: '280px' }}>
                      <div style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '14px' }}>
                        {comp.title}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px', lineHeight: 1.4 }}>
                        {comp.description}
                      </div>
                    </td>

                    <td>
                      <div style={{ fontWeight: 700 }}>
                        {comp.student?.name || 'Student'}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>
                        {comp.room ? `Block ${comp.room.block}-${comp.room.roomNumber}` : 'No room'}
                      </div>
                    </td>

                    <td style={{ textTransform: 'capitalize' }}>{comp.category}</td>

                    <td>
                      <span className={`badge badge-priority-${comp.priority}`}>
                        {comp.priority}
                      </span>
                    </td>

                    <td>
                      <span className={`badge badge-${comp.status}`}>
                        {comp.status}
                      </span>
                    </td>

                    <td style={{ fontSize: '12px', maxWidth: '200px', color: '#334155' }}>
                      {comp.wardenRemarks ? (
                        <span>💬 {comp.wardenRemarks}</span>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>None</span>
                      )}
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleOpenEdit(comp)}
                      >
                        Update Status ✏️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Status & Remarks Modal */}
      <Modal
        isOpen={!!selectedComplaint}
        onClose={() => setSelectedComplaint(null)}
        title="Update Maintenance Ticket Status"
      >
        {selectedComplaint && (
          <form onSubmit={handleUpdate}>
            <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '18px' }}>
              <div style={{ fontWeight: 800, fontSize: '15px' }}>{selectedComplaint.title}</div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                Raised by {selectedComplaint.student?.name} ({selectedComplaint.student?.email})
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Update Ticket Status</label>
              <select
                className="form-select"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
              >
                <option value="open">Open (Unresolved)</option>
                <option value="in-progress">In-Progress (Technician Assigned)</option>
                <option value="resolved">Resolved (Completed)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Warden Remarks / Resolution Notes</label>
              <textarea
                className="form-textarea"
                rows="4"
                placeholder="Enter actions taken or note for the student (e.g. Electrician visited and replaced damaged starter)..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSelectedComplaint(null)}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
              >
                {saving ? 'Updating...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default ManageComplaints;
