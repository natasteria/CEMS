import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { 
  Loader2, User, CalendarPlus, LayoutDashboard, LogOut, Building2, Menu, X 
} from 'lucide-react';

import MyEvents from './DashBoardComponents/MyEvents';
import CreateEvent from './DashBoardComponents/CreateEvent';
import OrganizerProfile from './DashboardComponents/OrganizerProfile';

const OrganizerDashboard = () => {
  const [currentTab, setCurrentTab] = useState('my-events');
  const [organizerData, setOrganizerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingEvent, setEditingEvent] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile sidebar state
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrganizerData();
  }, []);

  const fetchOrganizerData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/');
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
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.clear();
      sessionStorage.clear();
      window.location.replace('/'); 
    } catch (err) {
      window.location.replace('/');
    }
  };

  const renderContent = () => {
    switch (currentTab) {
      case 'profile':
        return <OrganizerProfile organizerData={organizerData} onUpdate={fetchOrganizerData} />;
      case 'create-event':
        return <CreateEvent initialData={editingEvent} onRefresh={() => { setEditingEvent(null); setCurrentTab('my-events'); }} />;
      case 'my-events':
        return <MyEvents onCreateClick={() => { setEditingEvent(null); setCurrentTab('create-event'); }} onEditClick={(event) => { setEditingEvent(event); setCurrentTab('create-event'); }} />;
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
    <div className="flex h-screen w-full overflow-hidden font-sans bg-slate-50 text-slate-900 relative">
      
      {/* --- Mobile Header --- */}
      <div className="lg:hidden fixed top-0 w-full bg-[#003366] text-white p-4 flex justify-between items-center z-30 shadow-md">
        <div className="flex flex-col">
          <h2 className="font-bold truncate text-sm">{details?.organizer_name || "Organizer"}</h2>
          <span className="text-[10px] text-white/70 italic">Primary Contact: {organizerData?.first_name} {organizerData?.last_name}</span>
        </div>
        <button onClick={() => setIsSidebarOpen(true)} className="p-2 hover:bg-white/10 rounded-lg">
          <Menu size={24} />
        </button>
      </div>

      {/* --- Sidebar Overlay (Mobile only) --- */}
      {isSidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* --- Sidebar --- */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-72 bg-[#003366] text-white flex flex-col shadow-xl transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold truncate">{details?.organizer_name || "Organizer"}</h2>
            <p className="text-xs text-white/80 font-medium mb-1">Contact: {organizerData?.first_name} {organizerData?.last_name}</p>
            <p className="text-xs text-white/60 truncate mb-2">{organizerData?.email}</p>
            <div className="flex flex-wrap gap-2">
              <span className="flex items-center gap-1 px-2 py-1 rounded bg-white/10 text-[10px] uppercase tracking-wider">
                <Building2 size={12} /> {details?.organizer_type || 'Dept'}
              </span>
            </div>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 hover:bg-white/10 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <nav className="flex flex-col p-4 gap-2">
          <NavItem 
            active={currentTab === 'profile'} 
            onClick={() => { setCurrentTab('profile'); setIsSidebarOpen(false); }} 
            icon={<User size={18} />} label="My Profile" 
          />
          <div className="mt-4 mb-2 ml-3 text-[10px] uppercase text-white/40 font-bold tracking-widest">Management</div>
          <NavItem 
            active={currentTab === 'my-events'} 
            onClick={() => { setCurrentTab('my-events'); setIsSidebarOpen(false); }} 
            icon={<LayoutDashboard size={18} />} label="Dashboard / My Events" 
          />
          <NavItem 
            active={currentTab === 'create-event'} 
            onClick={() => { setEditingEvent(null); setCurrentTab('create-event'); setIsSidebarOpen(false); }} 
            icon={<CalendarPlus size={18} />} label="Create New Event" 
          />
        </nav>

        <button onClick={handleLogout} className="mt-auto m-4 flex items-center gap-3 p-3 text-red-300 hover:bg-red-500/10 rounded-xl transition-all font-bold text-sm">
          <LogOut size={18} /> Logout
        </button>
      </aside>

      {/* --- Main Content --- */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-white pt-16 lg:pt-0">
        <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
            {renderContent()}
        </div>
      </main>
    </div>
  );
};

const NavItem = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 font-medium ${active ? 'bg-white text-[#003366] shadow-lg translate-x-1 lg:translate-x-2' : 'hover:bg-white/10 text-white/80 hover:text-white'}`}>
    {icon} {label}
  </button>
);

export default OrganizerDashboard;