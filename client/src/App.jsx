import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Public Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import NotFoundPage from './pages/NotFoundPage';

// Layout & Protected Route Guard
import PortalLayout from './components/PortalLayout';
import ProtectedRoute from './components/ProtectedRoute';

// Student Pages
import StudentDashboard from './pages/student/StudentDashboard';
import AvailableRooms from './pages/student/AvailableRooms';
import StudentComplaints from './pages/student/StudentComplaints';

// Warden & Admin Pages
import WardenDashboard from './pages/warden/WardenDashboard';
import ManageRooms from './pages/warden/ManageRooms';
import AllocationRequests from './pages/warden/AllocationRequests';
import ManageComplaints from './pages/warden/ManageComplaints';

// Admin Exclusive
import ManageUsers from './pages/admin/ManageUsers';

// Helper component to redirect authenticated users to their primary portal
const AppIndexRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'student') return <Navigate to="/app/dashboard" replace />;
  return <Navigate to="/app/warden/dashboard" replace />;
};

function App() {
  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Main App Redirection */}
      <Route path="/app" element={<AppIndexRedirect />} />

      {/* STUDENT PROTECTED ROUTES */}
      <Route element={<ProtectedRoute allowedRoles={['student']} />}>
        <Route path="/app" element={<PortalLayout />}>
          <Route path="dashboard" element={<StudentDashboard />} />
          <Route path="rooms" element={<AvailableRooms />} />
          <Route path="complaints" element={<StudentComplaints />} />
        </Route>
      </Route>

      {/* WARDEN & ADMIN PROTECTED ROUTES */}
      <Route element={<ProtectedRoute allowedRoles={['warden', 'admin']} />}>
        <Route path="/app/warden" element={<PortalLayout />}>
          <Route path="dashboard" element={<WardenDashboard />} />
          <Route path="rooms" element={<ManageRooms />} />
          <Route path="allocations" element={<AllocationRequests />} />
          <Route path="complaints" element={<ManageComplaints />} />
        </Route>
      </Route>

      {/* ADMIN EXCLUSIVE PROTECTED ROUTES */}
      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route path="/app/admin" element={<PortalLayout />}>
          <Route path="users" element={<ManageUsers />} />
        </Route>
      </Route>

      {/* 404 Fallback */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
