import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import OrganizerRegistration from './pages/Organizer/OrganizerRegistration';
import PendingReview from './pages/Organizer/PendingReview';
import StudentRegistration from './pages/Student/StudentRegistration';
import EventDiscovery from './pages/Student/EventDiscovery';
import AdminRegistration from './pages/Admin/AdminRegistration';
import AdminDashboard from './pages/Admin/AdminDashboard';
import Login from './pages/Login';
import OrganizerDashboard from './pages/Organizer/OrganizerDashboard';
import StudentDashboard from './pages/Student/PersonalDashboard'

function App() {
  return (
    <Router>
      <Routes>
        {/* Organizer Routes */}
        <Route path="/register-organizer" element={<OrganizerRegistration />} />
        <Route path="/organizer-pending" element={<PendingReview />} />
        <Route path="/organizer-dashboard" element={<OrganizerDashboard />} />

        {/* Student Routes */}
        <Route path="/register-student" element={<StudentRegistration />} />
        <Route path="/event-discovery" element={<EventDiscovery />} /> {/* main student landing/dashboard */}

        {/* Admin Routes */}
        <Route path="/register-admin" element={<AdminRegistration />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />

        {/* Login Routes */}
        <Route path="/dashboard" element={<StudentDashboard />} />
        <Route path="/" element={<Login />} />

        {/* Optional: redirect unknown routes */}
        <Route path="*" element={<div>404 Not Found</div>} />
      </Routes>
    </Router>
  );
}

export default App;