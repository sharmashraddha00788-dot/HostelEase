import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import Modal from '../../components/Modal';

const ManageUsers = () => {
  const { user: currentAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [feedback, setFeedback] = useState(null);

  // Role Edit Modal
  const [selectedUser, setSelectedUser] = useState(null);
  const [newRole, setNewRole] = useState('student');
  const [updating, setUpdating] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      let params = [];
      if (roleFilter !== 'all') params.push(`role=${roleFilter}`);
      if (searchQuery.trim()) params.push(`search=${encodeURIComponent(searchQuery.trim())}`);
      const qs = params.length ? `?${params.join('&')}` : '';

      const res = await api.get(`/api/users${qs}`);
      if (res.success) {
        setUsers(res.users);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleOpenRoleModal = (u) => {
    setSelectedUser(u);
    setNewRole(u.role);
  };

  const handleRoleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    setUpdating(true);
    setFeedback(null);

    try {
      const res = await api.patch(`/api/users/${selectedUser._id}/role`, {
        role: newRole,
      });

      if (res.success) {
        setFeedback({
          type: 'success',
          text: `Role for ${selectedUser.name} updated to "${newRole}".`,
        });
        setSelectedUser(null);
        await fetchUsers();
      }
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Failed to update role' });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 800 }}>User Directory & Access Control</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
          Admin panel to inspect student accounts, staff wardens, and promote or reassign system roles.
        </p>
      </div>

      {feedback && (
        <div className={`alert alert-${feedback.type}`}>
          <span>{feedback.type === 'success' ? '✅' : '⚠️'}</span>
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '24px', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px', flex: 1, minWidth: '260px' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Search by student name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit" className="btn btn-secondary">
            Search
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '13px', fontWeight: 700, color: '#475569' }}>Role:</label>
          <select
            className="form-select"
            style={{ width: 'auto', padding: '6px 12px', fontSize: '13px' }}
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="all">All Roles</option>
            <option value="student">Students</option>
            <option value="warden">Wardens</option>
            <option value="admin">Administrators</option>
          </select>
        </div>

        <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>
          {users.length} accounts found
        </div>
      </div>

      {/* Users Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
            Loading user directory...
          </div>
        ) : users.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
            No users found matching query.
          </div>
        ) : (
          <div className="table-container" style={{ border: 'none' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>User Details</th>
                  <th>Role</th>
                  <th>Allocated Room</th>
                  <th>Contact</th>
                  <th>Joined Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {u.avatar ? (
                          <img
                            src={u.avatar}
                            alt={u.name}
                            className="avatar"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="avatar">
                            {u.name?.charAt(0) || 'U'}
                          </div>
                        )}
                        <div>
                          <div style={{ fontWeight: 800, color: 'var(--text-main)' }}>
                            {u.name}
                            {u._id === currentAdmin?._id && (
                              <span style={{ fontSize: '11px', color: '#4f46e5', marginLeft: '6px' }}>(You)</span>
                            )}
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>
                            {u.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className={`badge badge-${u.role}`}>
                        {u.role}
                      </span>
                    </td>

                    <td>
                      {u.room ? (
                        <span style={{ fontWeight: 700 }}>
                          Block {u.room.block} — {u.room.roomNumber}
                        </span>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>None</span>
                      )}
                    </td>

                    <td style={{ fontSize: '13px', color: '#64748b' }}>
                      {u.phone || '—'}
                    </td>

                    <td style={{ fontSize: '13px', color: '#64748b' }}>
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleOpenRoleModal(u)}
                        disabled={u._id === currentAdmin?._id}
                        title={u._id === currentAdmin?._id ? 'You cannot alter your own admin role' : 'Change role'}
                      >
                        Change Role ⚙️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Role Change Modal */}
      <Modal
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        title="Change User Access Role"
      >
        {selectedUser && (
          <form onSubmit={handleRoleSubmit}>
            <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
              <div style={{ fontWeight: 800, fontSize: '15px' }}>{selectedUser.name}</div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{selectedUser.email}</div>
              <div style={{ fontSize: '12px', marginTop: '6px' }}>
                Current Role: <strong style={{ textTransform: 'uppercase' }}>{selectedUser.role}</strong>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Select New Role</label>
              <select
                className="form-select"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
              >
                <option value="student">Student (Standard Access)</option>
                <option value="warden">Warden (Manage Rooms, Allocations, Complaints)</option>
                <option value="admin">Administrator (Full Control, Delete Rooms, User Roles)</option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSelectedUser(null)}
                disabled={updating}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={updating}
              >
                {updating ? 'Updating...' : 'Confirm Role Change'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default ManageUsers;
