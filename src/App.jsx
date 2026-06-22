import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import OrganizerRegistration from './pages/Organizer/OrganizerRegistration';
import PendingReview from './pages/Organizer/PendingReview';
import StudentRegistration from './pages/Student/StudentRegistration';
import EventDiscovery from './pages/Student/EventDiscovery';
import AdminRegistration from './pages/Admin/AdminRegistration';
import AdminDashboard from './pages/Admin/AdminDashboard';
import Login from './pages/Login';
import ForgotPassword from './pages/PasswordReset/ForgotPassword';
import ResetPassword from './pages/PasswordReset/ResetPassword';
import OrganizerDashboard from './pages/Organizer/OrganizerDashboard';
import StudentDashboard from './pages/Student/PersonalDashboard';

import { NotificationProvider } from './context/NotificationContext';

function App() {
  return (
    <NotificationProvider>
      <Router>
        <Routes>

        {/* Organizer Routes */}
        <Route path="/register-organizer" element={<OrganizerRegistration />} />
        <Route path="/organizer-pending" element={<PendingReview />} />
        <Route path="/organizer-dashboard" element={<OrganizerDashboard />} />

        {/* Student Routes */}
        <Route path="/register-student" element={<StudentRegistration />} />
        <Route path="/event-discovery" element={<EventDiscovery />} />

        {/* Admin Routes */}
        <Route path="/register-admin" element={<AdminRegistration />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />

        {/* Auth Routes */}
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<StudentDashboard />} />

        {/* Password Reset Routes */}
        <Route path="/password-reset/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Fallback */}
        <Route path="*" element={<div>404 Not Found</div>} />

      </Routes>
    </Router>
    </NotificationProvider>
  );
}

export default App;