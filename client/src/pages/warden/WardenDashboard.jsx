import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';

const WardenDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedBlock, setSelectedBlock] = useState('all');

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/dashboard/stats');
      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading || !data) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
        <p>Crunching hostel aggregations and room statuses...</p>
      </div>
    );
  }

  const { summary, occupancyByBlock, complaintsByStatus, complaintsByCategory, roomMap } = data;

  const filteredRoomMap = selectedBlock === 'all'
    ? roomMap
    : roomMap.filter((r) => r.block === selectedBlock);

  return (
    <div>
      {/* Top Banner */}
      <div style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 800 }}>Hostel Overview & Live Map</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
          Real-time occupancy statistics, pending workflows, and block-wise spatial room grid.
        </p>
      </div>

      {/* 5 Primary KPI Cards */}
      <div className="stat-grid">
        <div className="stat-card">
          <div>
            <div className="stat-value" style={{ color: summary.openComplaints > 0 ? '#ef4444' : '#10b981' }}>
              {summary.openComplaints}
            </div>
            <div className="stat-label">Open Complaints</div>
          </div>
          <div className="stat-icon" style={{ background: '#fef2f2', color: '#ef4444' }}>
            ⚠️
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-value" style={{ color: '#10b981' }}>
              {summary.vacantRooms}
            </div>
            <div className="stat-label">Vacant Rooms Available</div>
          </div>
          <div className="stat-icon" style={{ background: '#ecfdf5', color: '#10b981' }}>
            🛏️
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-value" style={{ color: summary.pendingRequests > 0 ? '#f59e0b' : '#64748b' }}>
              {summary.pendingRequests}
            </div>
            <div className="stat-label">Pending Room Requests</div>
          </div>
          <div className="stat-icon" style={{ background: '#fffbeb', color: '#f59e0b' }}>
            📝
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-value" style={{ color: 'var(--primary)' }}>
              {summary.totalStudents}
            </div>
            <div className="stat-label">Registered Students</div>
          </div>
          <div className="stat-icon" style={{ background: '#e0e7ff', color: '#4f46e5' }}>
            🎓
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-value">
              {summary.occupancyPercentage}%
            </div>
            <div className="stat-label">Overall Occupancy</div>
          </div>
          <div className="stat-icon" style={{ background: '#f0fdf4', color: '#059669' }}>
            📈
          </div>
        </div>
      </div>

      {/* 2-Column Analytics Section (MongoDB Aggregations) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px', marginBottom: '30px' }}>
        {/* Block Occupancy Aggregation */}
        <div className="card">
          <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '6px' }}>
            Block-Wise Occupancy (Aggregation)
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
            Aggregated bed capacity and occupancy percentage per hostel block
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {occupancyByBlock.map((block) => (
              <div key={block.block} style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '16px', fontWeight: 800 }}>Block {block.block}</span>
                  <span className="badge badge-student" style={{ fontSize: '13px' }}>
                    {block.occupancyPercentage}% Occupied
                  </span>
                </div>

                {/* Bar */}
                <div style={{ height: '10px', background: '#e2e8f0', borderRadius: '6px', overflow: 'hidden', marginBottom: '12px' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${block.occupancyPercentage}%`,
                      background: 'var(--primary-gradient)',
                      borderRadius: '6px',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b' }}>
                  <span>Occupied: <strong>{block.totalOccupied} / {block.totalCapacity} Beds</strong></span>
                  <span>Free Beds: <strong style={{ color: '#10b981' }}>{block.freeBeds}</strong></span>
                  {block.maintenanceRooms > 0 && (
                    <span>Maintenance: <strong style={{ color: '#f59e0b' }}>{block.maintenanceRooms}</strong></span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Complaints Breakdown Aggregation */}
        <div className="card">
          <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '6px' }}>
            Complaints by Category (Aggregation)
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
            Maintenance ticket distribution across facilities
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {complaintsByCategory.map((item) => (
              <div key={item.category} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#f8fafc', borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ textTransform: 'capitalize', fontWeight: 600, fontSize: '14px' }}>
                    {item.category === 'plumbing' && '🚰 '}
                    {item.category === 'electrical' && '💡 '}
                    {item.category === 'cleaning' && '🧹 '}
                    {item.category === 'internet' && '📶 '}
                    {item.category === 'furniture' && '🪑 '}
                    {item.category === 'other' && '📦 '}
                    {item.category}
                  </span>
                </div>
                <span className="badge badge-priority-medium">
                  {item.count} tickets
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Colour-Coded Spatial Room Map */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 800 }}>Spatial Room Map</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Interactive colour-coded matrix of all hostel rooms and live bed availability
            </p>
          </div>

          {/* Block Selector and Legend */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '6px', background: '#f1f5f9', padding: '4px', borderRadius: '10px' }}>
              {['all', 'A', 'B'].map((b) => (
                <button
                  key={b}
                  onClick={() => setSelectedBlock(b)}
                  className="btn btn-sm"
                  style={{
                    background: selectedBlock === b ? '#ffffff' : 'transparent',
                    color: selectedBlock === b ? 'var(--text-main)' : 'var(--text-muted)',
                    boxShadow: selectedBlock === b ? 'var(--shadow-sm)' : 'none',
                    border: 'none',
                  }}
                >
                  {b === 'all' ? 'All Blocks' : `Block ${b}`}
                </button>
              ))}
            </div>

            {/* Map Legend */}
            <div style={{ display: 'flex', gap: '12px', fontSize: '12px', fontWeight: 600 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span className="status-dot dot-green" /> Empty (0 Occupied)
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span className="status-dot dot-amber" /> Has Students
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span className="status-dot dot-red" /> Full
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span className="status-dot dot-gray" /> Maintenance
              </span>
            </div>
          </div>
        </div>

        {/* Room Grid */}
        <div className="room-matrix">
          {filteredRoomMap.map((room) => (
            <div
              key={room._id}
              className={`room-cell state-${room.state}`}
              title={`Block ${room.block} - Room ${room.roomNumber} | Occupied: ${room.occupied}/${room.capacity}`}
            >
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>
                Block {room.block}
              </div>
              <div style={{ fontSize: '18px', fontWeight: 800, margin: '2px 0' }}>
                {room.roomNumber}
              </div>
              <div style={{ fontSize: '11px', fontWeight: 600 }}>
                {room.status === 'maintenance' ? (
                  <span style={{ color: '#64748b' }}>Under Repair</span>
                ) : (
                  <span>{room.occupied}/{room.capacity} Beds</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WardenDashboard;
