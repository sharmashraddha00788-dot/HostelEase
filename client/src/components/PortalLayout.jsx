import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const PortalLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Determine page title based on path
  const getPageTitle = (pathname) => {
    if (pathname.includes('/rooms')) return 'Available Hostel Rooms';
    if (pathname.includes('/complaints')) return 'Hostel Maintenance Complaints';
    if (pathname.includes('/warden/dashboard')) return 'Warden Overview & Analytics';
    if (pathname.includes('/warden/rooms')) return 'Room & Bed Management';
    if (pathname.includes('/warden/allocations')) return 'Room Allocation Requests';
    if (pathname.includes('/warden/complaints')) return 'Maintenance Tickets';
    if (pathname.includes('/admin/users')) return 'User & Role Administration';
    return 'HostelEase Dashboard';
  };

  return (
    <div className="app-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-wrapper">
        <Header
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          title={getPageTitle(location.pathname)}
        />
        <main className="content-area">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default PortalLayout;
