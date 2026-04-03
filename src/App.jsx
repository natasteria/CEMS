import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import OrganizerRegistration from './pages/Organizer/OrganizerRegistration';
import PendingReview from './pages/Organizer/PendingReview';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/organizer/register" element={<OrganizerRegistration />} />
        <Route path="/organizer/pending" element={<PendingReview />} />
      </Routes>
    </Router>
  );
}

export default App; 