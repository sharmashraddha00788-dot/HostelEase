import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';

const StudentComplaints = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  // New complaint form state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('plumbing');
  const [priority, setPriority] = useState('medium');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/complaints/my');
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
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      const res = await api.post('/api/complaints', {
        title,
        category,
        priority,
        description,
      });

      if (res.success) {
        setMessage({ type: 'success', text: 'Complaint ticket created successfully!' });
        setTitle('');
        setDescription('');
        setCategory('plumbing');
        setPriority('medium');
        await fetchComplaints();
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to submit complaint' });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredComplaints = statusFilter === 'all'
    ? complaints
    : complaints.filter((c) => c.status === statusFilter);

  return (
    <div>
      {/* Title */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 800 }}>Maintenance Complaints</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
          Raise room repair issues and monitor warden actions and inspection remarks.
        </p>
      </div>

      {message && (
        <div className={`alert alert-${message.type}`}>
          <span>{message.type === 'success' ? '✅' : '⚠️'}</span>
          <span>{message.text}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '28px', alignItems: 'flex-start' }}>
        {/* Left: Complaint Submission Form */}
        <div className="card">
          <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '6px' }}>Raise a New Ticket</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
            Submit an issue regarding your assigned hostel room
          </p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Issue Summary / Title</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Washroom tap constantly leaking"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  className="form-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="plumbing">Plumbing</option>
                  <option value="electrical">Electrical</option>
                  <option value="cleaning">Cleaning</option>
                  <option value="internet">Internet / Wi-Fi</option>
                  <option value="furniture">Furniture</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Priority</label>
                <select
                  className="form-select"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High (Urgent)</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Detailed Description</label>
              <textarea
                className="form-textarea"
                placeholder="Describe the issue in detail, exact location in room, and when it started..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%' }}
              disabled={submitting}
            >
              {submitting ? 'Submitting Ticket...' : 'Submit Complaint Ticket →'}
            </button>
          </form>
        </div>

        {/* Right: Complaints List */}
        <div>
          {/* Status Filter Tabs */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
            {['all', 'open', 'in-progress', 'resolved'].map((st) => (
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
                {st}
              </button>
            ))}
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              Loading your tickets...
            </div>
          ) : filteredComplaints.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ fontSize: '36px', marginBottom: '8px' }}>📝</div>
              <h4 style={{ fontSize: '16px', fontWeight: 800 }}>No Complaints in this view</h4>
              <p style={{ color: '#64748b', fontSize: '13px', marginTop: '4px' }}>
                You have no {statusFilter !== 'all' ? statusFilter : ''} complaints filed.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {filteredComplaints.map((comp) => (
                <div key={comp._id} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px', gap: '12px' }}>
                    <h4 style={{ fontSize: '16px', fontWeight: 800 }}>{comp.title}</h4>
                    <span className={`badge badge-${comp.status}`}>
                      {comp.status}
                    </span>
                  </div>

                  <p style={{ fontSize: '13px', color: '#475569', marginBottom: '14px', lineHeight: 1.5 }}>
                    {comp.description}
                  </p>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', fontSize: '12px', color: '#64748b' }}>
                    <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>
                      📁 {comp.category}
                    </span>
                    <span>•</span>
                    <span className={`badge badge-priority-${comp.priority}`} style={{ padding: '2px 8px', fontSize: '11px' }}>
                      Priority: {comp.priority}
                    </span>
                    <span>•</span>
                    <span>🕒 {new Date(comp.createdAt).toLocaleDateString()}</span>
                  </div>

                  {/* Warden Remarks */}
                  {comp.wardenRemarks && (
                    <div style={{ marginTop: '14px', background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', borderLeft: '4px solid #4f46e5' }}>
                      <div style={{ fontSize: '12px', fontWeight: 800, color: '#4f46e5', marginBottom: '2px' }}>
                        🛡️ Warden Inspection Remarks:
                      </div>
                      <div style={{ fontSize: '13px', color: '#1e293b' }}>
                        {comp.wardenRemarks}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentComplaints;
