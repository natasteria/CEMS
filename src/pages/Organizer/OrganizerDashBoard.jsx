import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useNavigate } from 'react-router-dom'; // 1. Import useNavigate
import { 
  Loader2, User, CalendarPlus, LayoutDashboard, LogOut, Building2 
} from 'lucide-react';

import MyEvents from './DashBoardComponents/MyEvents';
import CreateEvent from './DashBoardComponents/CreateEvent';
import OrganizerProfile from './DashboardComponents/OrganizerProfile';

const OrganizerDashboard = () => {
  const [currentTab, setCurrentTab] = useState('my-events');
  const [organizerData, setOrganizerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingEvent, setEditingEvent] = useState(null);
  
  const navigate = useNavigate(); // 2. Initialize navigate

  useEffect(() => {
    fetchOrganizerData();
  }, []);

  const fetchOrganizerData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/'); // Redirect if no user found on load
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select(`*, organizers (*)`)
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setOrganizerData(data);
    } catch (err) {
      console.error("Dashboard Load Error:", err.message);
      navigate('/'); // Redirect on error
    } finally {
      setLoading(false);
    }
  };

  // 3. New Logout Function
// 1. Improved Logout Function with a "Hard" Redirect
  const handleLogout = async () => {
    try {
      // Clear the session from Supabase
      await supabase.auth.signOut();
      
      // Clear any local storage that might be keeping the user logged in
      localStorage.clear();
      sessionStorage.clear();

      // "Hard" redirect to the login page. 
      // This is better than navigate() for logouts because it resets the app state entirely.
      window.location.replace('/'); 
      
    } catch (err) {
      console.error("Logout Error:", err.message);
      window.location.replace('/');
    }
  };

  const renderContent = () => {
    switch (currentTab) {
      case 'profile':
        return <OrganizerProfile organizerData={organizerData} onUpdate={fetchOrganizerData} />;
      
      case 'create-event':
        return (
          <CreateEvent 
            initialData={editingEvent} 
            onRefresh={() => {
              setEditingEvent(null);
              setCurrentTab('my-events');
            }} 
          />
        );

      case 'my-events':
        return (
          <MyEvents 
            onCreateClick={() => {
              setEditingEvent(null);
              setCurrentTab('create-event');
            }} 
            onEditClick={(event) => {
              setEditingEvent(event);
              setCurrentTab('create-event');
            }}
          />
        );
      default:
        return <MyEvents onCreateClick={() => setCurrentTab('create-event')} />;
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-10 h-10 animate-spin text-[#003366]" />
      </div>
    );
  }

  const details = organizerData?.organizers?.[0];

  return (
    <div className="flex h-screen w-full overflow-hidden font-sans bg-slate-50 text-slate-900">
      <aside className="w-72 bg-[#003366] text-white flex flex-col shadow-xl z-20">
        <div className="p-6 border-b border-white/10">
          <h2 className="text-xl font-bold truncate">{details?.organizer_name || "Organizer"}</h2>
          <p className="text-sm text-white/60 truncate mb-3">{organizerData?.email}</p>
          <div className="flex flex-wrap gap-2">
            <span className="flex items-center gap-1 px-2 py-1 rounded bg-white/10 text-[10px] uppercase tracking-wider">
              <Building2 size={12} /> {details?.organizer_type || 'Dept'}
            </span>
          </div>
        </div>

        <nav className="flex flex-col p-4 gap-2">
          <NavItem active={currentTab === 'profile'} onClick={() => setCurrentTab('profile')} icon={<User size={18} />} label="My Profile" />
          <div className="mt-4 mb-2 ml-3 text-[10px] uppercase text-white/40 font-bold tracking-widest">Management</div>
          <NavItem active={currentTab === 'my-events'} onClick={() => setCurrentTab('my-events')} icon={<LayoutDashboard size={18} />} label="Dashboard / My Events" />
          <NavItem active={currentTab === 'create-event'} onClick={() => { setEditingEvent(null); setCurrentTab('create-event'); }} icon={<CalendarPlus size={18} />} label="Create New Event" />
        </nav>

        {/* 4. Update the Button to use handleLogout */}
        <button 
          onClick={handleLogout} 
          className="mt-auto m-4 flex items-center gap-3 p-3 text-red-300 hover:bg-red-500/10 rounded-xl transition-all font-bold text-sm"
        >
          <LogOut size={18} /> Logout
        </button>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-white">
        <div className="p-8 max-w-7xl mx-auto w-full">
            {renderContent()}
        </div>
      </main>
    </div>
  );
};

const NavItem = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 font-medium ${active ? 'bg-white text-[#003366] shadow-lg translate-x-2' : 'hover:bg-white/10 text-white/80 hover:text-white'}`}>
    {icon} {label}
  </button>
);

export default OrganizerDashboard;