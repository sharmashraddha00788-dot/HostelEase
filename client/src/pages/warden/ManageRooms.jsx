import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import Modal from '../../components/Modal';

const ManageRooms = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [blockFilter, setBlockFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Add Room Modal State
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newRoomNum, setNewRoomNum] = useState('');
  const [newBlock, setNewBlock] = useState('A');
  const [newFloor, setNewFloor] = useState('1');
  const [newCapacity, setNewCapacity] = useState('2');
  const [savingRoom, setSavingRoom] = useState(false);

  // Message alert
  const [feedback, setFeedback] = useState(null);

  const fetchRooms = async () => {
    setLoading(true);
    try {
      let query = [];
      if (blockFilter !== 'all') query.push(`block=${blockFilter}`);
      if (statusFilter !== 'all') query.push(`status=${statusFilter}`);
      const qs = query.length ? `?${query.join('&')}` : '';

      const res = await api.get(`/api/rooms${qs}`);
      if (res.success) {
        setRooms(res.rooms);
      }
    } catch (err) {
      console.error('Failed to load rooms:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, [blockFilter, statusFilter]);

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    setSavingRoom(true);
    setFeedback(null);

    try {
      const res = await api.post('/api/rooms', {
        roomNumber: newRoomNum,
        block: newBlock,
        floor: Number(newFloor),
        capacity: Number(newCapacity),
      });

      if (res.success) {
        setFeedback({ type: 'success', text: `Room ${newBlock}-${newRoomNum} created successfully!` });
        setAddModalOpen(false);
        setNewRoomNum('');
        await fetchRooms();
      }
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Failed to create room' });
    } finally {
      setSavingRoom(false);
    }
  };

  const handleToggleStatus = async (room) => {
    const nextStatus = room.status === 'available' ? 'maintenance' : 'available';
    try {
      const res = await api.patch(`/api/rooms/${room._id}`, { status: nextStatus });
      if (res.success) {
        setFeedback({
          type: 'success',
          text: `Room ${room.block}-${room.roomNumber} marked as ${nextStatus}.`,
        });
        await fetchRooms();
      }
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Failed to update status' });
    }
  };

  const handleDeleteRoom = async (room) => {
    if (!window.confirm(`Are you sure you want to delete Room ${room.block}-${room.roomNumber}?`)) {
      return;
    }

    try {
      const res = await api.delete(`/api/rooms/${room._id}`);
      if (res.success) {
        setFeedback({ type: 'success', text: res.message });
        await fetchRooms();
      }
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Failed to delete room' });
    }
  };

  return (
    <div>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 800 }}>Manage Hostel Rooms</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
            Configure capacity, mark maintenance status, and monitor bed allotments.
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => setAddModalOpen(true)}
        >
          ➕ Add New Room
        </button>
      </div>

      {feedback && (
        <div className={`alert alert-${feedback.type}`}>
          <span>{feedback.type === 'success' ? '✅' : '⚠️'}</span>
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '24px', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '13px', fontWeight: 700, color: '#475569' }}>Block:</label>
          <select
            className="form-select"
            style={{ width: 'auto', padding: '6px 12px', fontSize: '13px' }}
            value={blockFilter}
            onChange={(e) => setBlockFilter(e.target.value)}
          >
            <option value="all">All Blocks</option>
            <option value="A">Block A</option>
            <option value="B">Block B</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '13px', fontWeight: 700, color: '#475569' }}>Status:</label>
          <select
            className="form-select"
            style={{ width: 'auto', padding: '6px 12px', fontSize: '13px' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="available">Available</option>
            <option value="maintenance">Under Maintenance</option>
          </select>
        </div>

        <div style={{ marginLeft: 'auto', fontSize: '13px', color: '#64748b', fontWeight: 600 }}>
          Showing {rooms.length} rooms
        </div>
      </div>

      {/* Rooms Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
            Loading rooms...
          </div>
        ) : rooms.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
            No rooms found matching the selected filters.
          </div>
        ) : (
          <div className="table-container" style={{ border: 'none' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Room</th>
                  <th>Block</th>
                  <th>Floor</th>
                  <th>Occupancy</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rooms.map((room) => {
                  const freeBeds = Math.max(0, room.capacity - room.occupied);
                  return (
                    <tr key={room._id}>
                      <td style={{ fontWeight: 800, fontSize: '15px' }}>
                        Room {room.roomNumber}
                      </td>
                      <td>
                        <span className="badge badge-student">Block {room.block}</span>
                      </td>
                      <td>Floor {room.floor}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 700 }}>
                            {room.occupied} / {room.capacity}
                          </span>
                          <span style={{ fontSize: '12px', color: freeBeds > 0 ? '#10b981' : '#ef4444' }}>
                            ({freeBeds} free)
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${room.status === 'available' ? 'badge-resolved' : 'badge-open'}`}>
                          {room.status === 'available' ? 'Available' : 'Maintenance'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleToggleStatus(room)}
                            title="Toggle Maintenance State"
                          >
                            {room.status === 'available' ? 'Mark Maintenance' : 'Mark Available'}
                          </button>

                          {isAdmin && (
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleDeleteRoom(room)}
                              disabled={room.occupied > 0}
                              title={room.occupied > 0 ? 'Cannot delete room with allocated students' : 'Delete room'}
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Room Modal */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Create New Hostel Room"
      >
        <form onSubmit={handleCreateRoom}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Block</label>
              <select
                className="form-select"
                value={newBlock}
                onChange={(e) => setNewBlock(e.target.value)}
              >
                <option value="A">Block A</option>
                <option value="B">Block B</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Room Number</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. 106, 206, 306"
                value={newRoomNum}
                onChange={(e) => setNewRoomNum(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Floor</label>
              <input
                type="number"
                min="0"
                max="10"
                className="form-input"
                value={newFloor}
                onChange={(e) => setNewFloor(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Capacity (Beds)</label>
              <select
                className="form-select"
                value={newCapacity}
                onChange={(e) => setNewCapacity(e.target.value)}
              >
                <option value="1">1 Bed (Single)</option>
                <option value="2">2 Beds (Double)</option>
                <option value="3">3 Beds (Triple)</option>
                <option value="4">4 Beds</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setAddModalOpen(false)}
              disabled={savingRoom}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={savingRoom}
            >
              {savingRoom ? 'Saving Room...' : 'Create Room'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ManageRooms;
