import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import OrganizerRegistration from './pages/Organizer/OrganizerRegistration';
import PendingReview from './pages/Organizer/PendingReview';
import StudentRegistration from './pages/Student/StudentRegistration';
import EventDiscovery from './pages/Student/EventDiscovery'; // create this page or replace with your main student page

function App() {
  return (
    <Router>
      <Routes>
        {/* Organizer Routes */}
        <Route path="/register-organizer" element={<OrganizerRegistration />} />
        <Route path="/organizer/pending" element={<PendingReview />} />

        {/* Student Routes */}
        <Route path="/register-student" element={<StudentRegistration />} />
        <Route path="/eventDiscovery" element={<EventDiscovery />} /> {/* main student landing/dashboard */}

        {/* Login Routes */}
        {/* <Route path="/" element={<Login />} /> */}

        {/* Optional: redirect unknown routes */}
        <Route path="*" element={<div>404 Not Found</div>} />
      </Routes>
    </Router>
  );
}

export default App;