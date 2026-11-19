import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import Modal from '../../components/Modal';

const AvailableRooms = () => {
  const { user, refreshUser } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [blockFilter, setBlockFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [requestModalRoom, setRequestModalRoom] = useState(null);
  const [requestLoading, setRequestLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [hasActiveAllocation, setHasActiveAllocation] = useState(false);

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const url = blockFilter === 'all'
        ? '/api/rooms/available'
        : `/api/rooms/available?block=${blockFilter}`;

      const [roomRes, myAllocRes] = await Promise.all([
        api.get(url),
        api.get('/api/allocations/my'),
      ]);

      if (roomRes.success) {
        setRooms(roomRes.rooms);
      }
      if (myAllocRes.success && myAllocRes.allocation) {
        if (['requested', 'approved'].includes(myAllocRes.allocation.status)) {
          setHasActiveAllocation(true);
        } else {
          setHasActiveAllocation(false);
        }
      }
    } catch (err) {
      console.error('Failed to fetch rooms:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, [blockFilter]);

  const handleSendRequest = async () => {
    if (!requestModalRoom) return;
    setRequestLoading(true);
    setFeedback(null);
    try {
      const res = await api.post('/api/allocations/request', {
        roomId: requestModalRoom._id,
      });
      if (res.success) {
        setFeedback({
          type: 'success',
          text: `Request for Room ${requestModalRoom.block}-${requestModalRoom.roomNumber} submitted successfully! Awaiting warden approval.`,
        });
        setRequestModalRoom(null);
        setHasActiveAllocation(true);
        await refreshUser();
        await fetchRooms();
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.message || 'Failed to submit room request.',
      });
    } finally {
      setRequestLoading(false);
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 800 }}>Available Hostel Rooms</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
            Browse rooms that have vacant beds and are currently open for allocation
          </p>
        </div>

        {/* Block Filter Buttons */}
        <div style={{ display: 'flex', gap: '8px', background: '#ffffff', padding: '4px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          {['all', 'A', 'B'].map((blk) => (
            <button
              key={blk}
              onClick={() => setBlockFilter(blk)}
              className="btn btn-sm"
              style={{
                background: blockFilter === blk ? 'var(--primary-gradient)' : 'transparent',
                color: blockFilter === blk ? '#ffffff' : 'var(--text-muted)',
                border: 'none',
              }}
            >
              {blk === 'all' ? 'All Blocks' : `Block ${blk}`}
            </button>
          ))}
        </div>
      </div>

      {feedback && (
        <div className={`alert alert-${feedback.type}`}>
          <span>{feedback.type === 'success' ? '🎉' : '⚠️'}</span>
          <span>{feedback.text}</span>
        </div>
      )}

      {hasActiveAllocation && (
        <div className="alert alert-info">
          <span>ℹ️</span>
          <span>
            You already have an active room allocation or a pending request. Under hostel rules, a student can have only one active request or room at a time.
          </span>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
          <p>Scanning room vacancy...</p>
        </div>
      ) : rooms.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>🏨</div>
          <h3 style={{ fontSize: '18px', fontWeight: 800 }}>No Available Rooms Found</h3>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '6px' }}>
            All rooms in the selected block are either fully occupied or under maintenance.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          {rooms.map((room) => {
            const freeBeds = room.freeBeds ?? Math.max(0, room.capacity - room.occupied);
            const occupancyPct = Math.round((room.occupied / room.capacity) * 100);

            return (
              <div key={room._id} className="card card-hover" style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                  <div>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase' }}>
                      Block {room.block} • Floor {room.floor}
                    </span>
                    <h3 style={{ fontSize: '22px', fontWeight: 800, marginTop: '2px' }}>
                      Room {room.roomNumber}
                    </h3>
                  </div>
                  <span className="badge badge-resolved">
                    {freeBeds} {freeBeds === 1 ? 'bed free' : 'beds free'}
                  </span>
                </div>

                {/* Progress bar */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>
                    <span>Occupancy</span>
                    <span style={{ fontWeight: 700 }}>{room.occupied} / {room.capacity} Beds</span>
                  </div>
                  <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${occupancyPct}%`,
                        background: occupancyPct > 80 ? '#f59e0b' : 'var(--primary-gradient)',
                        borderRadius: '4px',
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>
                </div>

                <div style={{ marginTop: 'auto', paddingTop: '14px', borderTop: '1px solid #f1f5f9' }}>
                  <button
                    className="btn btn-primary btn-sm"
                    style={{ width: '100%' }}
                    disabled={hasActiveAllocation}
                    onClick={() => setRequestModalRoom(room)}
                  >
                    {hasActiveAllocation ? 'Active Request Exists' : 'Request This Room →'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal */}
      <Modal
        isOpen={!!requestModalRoom}
        onClose={() => setRequestModalRoom(null)}
        title="Confirm Room Allocation Request"
      >
        {requestModalRoom && (
          <div>
            <p style={{ color: '#475569', fontSize: '14px', lineHeight: 1.6, marginBottom: '16px' }}>
              You are applying for <strong>Block {requestModalRoom.block} — Room {requestModalRoom.roomNumber}</strong> (Floor {requestModalRoom.floor}).
            </p>
            <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '20px', fontSize: '13px' }}>
              <div>🛏️ <strong>Free Beds:</strong> {requestModalRoom.freeBeds} of {requestModalRoom.capacity}</div>
              <div style={{ marginTop: '4px' }}>🛡️ <strong>Rule:</strong> Your request will be queued for warden verification and atomic seat booking.</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setRequestModalRoom(null)}
                disabled={requestLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSendRequest}
                disabled={requestLoading}
              >
                {requestLoading ? 'Submitting...' : 'Submit Room Request'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AvailableRooms;
