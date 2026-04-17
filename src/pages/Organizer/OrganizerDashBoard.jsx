import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { 
  Loader2, 
  User, 
  CalendarPlus, 
  ClipboardList, 
  LayoutDashboard,
  Building2 
} from 'lucide-react';

// Sub-components for Organizer
// import OrganizerProfile from './OrganizerComponents/OrganizerProfile';
import CreateEvent from './DashBoardComponents/CreateEvent';
// import MyEvents from './OrganizerComponents/MyEvents';
// import EventRegistrations from './OrganizerComponents/EventRegistrations';

const OrganizerDashboard = () => {
  const [currentTab, setCurrentTab] = useState('profile');
  const [organizerData, setOrganizerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchOrganizerData = async () => {
      try {
        setLoading(true);

        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        if (!user) throw new Error("User not authenticated");

        // Fetch profile AND organizer specific details (organizer_name, type, status)
        const { data, error: profileError } = await supabase
          .from('profiles')
          .select(`
            first_name,
            last_name,
            email,
            organizers (
              organizer_name,
              organizer_type,
              registration_status,
              account_status
            )
          `)
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;

        if (isMounted) {
          setOrganizerData(data);
        }
      } catch (err) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchOrganizerData();

    return () => { isMounted = false; };
  }, []);

const renderContent = () => {
  switch (currentTab) {
    case 'profile':
      return <div>Profile Page</div>

    case 'create-event':
      return <CreateEvent />

    case 'my-events':
      return <div>My Events Page</div>

    case 'registrations':
      return <div>Registrations Page</div>

    default:
      return <CreateEvent />
  }
}

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <Loader2 className="w-10 h-10 animate-spin text-[#003366]" />
      </div>
    );
  }

  if (error) {
    return <div className="p-10 text-red-500 font-medium">Error: {error}</div>;
  }

  // Extract organizer details for easier access
  const details = organizerData?.organizers?.[0];

  return (
    <div className="flex h-screen w-full overflow-hidden font-sans bg-slate-50 text-slate-900">
      
      {/* Sidebar */}
      <aside className="w-72 bg-[#003366] text-white flex flex-col shadow-xl">
        
        {/* Organizer Branding/Info */}
        <div className="p-6 border-b border-white/10">
          <h2 className="text-xl font-bold truncate">
            {details?.organizer_name || "Organizer Account"}
          </h2>
          <p className="text-sm text-white/60 truncate mb-3">
            {organizerData.email}
          </p>
          
          <div className="flex flex-wrap gap-2">
            <span className="flex items-center gap-1 px-2 py-1 rounded bg-white/10 text-[10px] uppercase tracking-wider">
              <Building2 size={12} /> {details?.organizer_type}
            </span>
            <span className={`px-2 py-1 rounded text-[10px] uppercase tracking-wider ${
              details?.registration_status === 'approved' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
            }`}>
              {details?.registration_status}
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col p-4 gap-2">
          <NavItem 
            active={currentTab === 'profile'} 
            onClick={() => setCurrentTab('profile')}
            icon={<User size={18} />}
            label="My Profile"
          />
          
          <div className="mt-4 mb-2 ml-3 text-[10px] uppercase text-white/40 font-bold tracking-widest">
            Event Management
          </div>

          <NavItem 
            active={currentTab === 'my-events'} 
            onClick={() => setCurrentTab('my-events')}
            icon={<LayoutDashboard size={18} />}
            label="Dashboard / My Events"
          />

          <NavItem 
            active={currentTab === 'create-event'} 
            onClick={() => setCurrentTab('create-event')}
            icon={<CalendarPlus size={18} />}
            label="Create New Event"
          />

          <NavItem 
            active={currentTab === 'registrations'} 
            onClick={() => setCurrentTab('registrations')}
            icon={<ClipboardList size={18} />}
            label="Registrations"
          />
        </nav>

        {/* Account Status Alert */}
        {details?.account_status === 'banned' && (
          <div className="mt-auto m-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-xs text-red-200">
            <strong>Account Restricted:</strong> You cannot publish new events at this time.
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-white shadow-inner">
        <div className="p-8">
            {renderContent()}
        </div>
      </main>
    </div>
  );
};

// Helper component for cleaner Nav items
const NavItem = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 font-medium ${
      active
        ? 'bg-white text-[#003366] shadow-lg'
        : 'hover:bg-white/10 text-white/80 hover:text-white'
    }`}
  >
    {icon}
    {label}
  </button>
);

export default OrganizerDashboard;