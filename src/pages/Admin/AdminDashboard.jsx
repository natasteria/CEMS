import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Loader2, User, Calendar, Users, Shield, LogOut } from 'lucide-react';

// Pages that render inside main area
import AdminProfile from './DashBoardComponents/AdminProfile';
import AdminEventManagment from './DashBoardComponents/AdminEventManagment';
import PendingOrganizers from './DashBoardComponents/PendingOrganizers';
// import ManageStudents from './components/ManageStudents';

const AdminDashboard = () => {

  const [currentTab, setCurrentTab] = useState('profile');
  const [adminProfile, setAdminProfile] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {

    let isMounted = true;

    const fetchAdminData = async () => {

      try {

        setLoading(true);

        const { data: { user }, error: userError } =
          await supabase.auth.getUser();

        if (userError) throw userError;
        if (!user) throw new Error("User not authenticated");

        const { data, error: profileError } = await supabase
          .from('profiles')
          .select(`
            first_name,
            last_name,
            email
          `)
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;

        if (isMounted) {
          setAdminProfile(data);
        }

      } catch (err) {

        if (isMounted) {
          setError(err.message);
        }

      } finally {

        if (isMounted) {
          setLoading(false);
        }

      }

    };

    fetchAdminData();

    return () => {
      isMounted = false;
    };

  }, []);

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
        return <AdminProfile adminProfile={adminProfile} />;

      case 'events':
        return <AdminEventManagment />;

      case 'organizers':
        return <PendingOrganizers />;

      case 'students':
        return <ManageStudents />;

      default:
        return <AdminProfile adminProfile={adminProfile} />;
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <Loader2 className="w-10 h-10 animate-spin text-[#003366]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-10 text-red-500">
        Error: {error}
      </div>
    );
  }

  return (

    <div className="flex h-screen w-full overflow-hidden font-sans bg-white text-slate-900">

      {/* Sidebar */}
      <aside className="w-64 bg-[#003366] text-white flex flex-col">

        {/* Admin Info */}
        <div className="p-6 border-b border-white/10">

          <h2 className="text-lg font-semibold">
            {adminProfile.first_name} {adminProfile.last_name}
          </h2>

          <p className="text-sm text-white/70">
            {adminProfile.email}
          </p>

          <div className="flex items-center gap-2 mt-2 text-xs text-white/60">
            <Shield size={14} />
            Administrator
          </div>

        </div>

        {/* Navigation */}
        <nav className="flex flex-col p-4 gap-2">

          <button
            onClick={() => setCurrentTab('profile')}
            className={`flex items-center gap-3 p-3 rounded-lg transition ${
              currentTab === 'profile'
                ? 'bg-white text-[#003366]'
                : 'hover:bg-white/10'
            }`}
          >
            <User size={18} />
            Profile
          </button>

          <button
            onClick={() => setCurrentTab('events')}
            className={`flex items-center gap-3 p-3 rounded-lg transition ${
              currentTab === 'events'
                ? 'bg-white text-[#003366]'
                : 'hover:bg-white/10'
            }`}
          >
            <Calendar size={18} />
            Manage Events
          </button>

          <button
            onClick={() => setCurrentTab('organizers')}
            className={`flex items-center gap-3 p-3 rounded-lg transition ${
              currentTab === 'organizers'
                ? 'bg-white text-[#003366]'
                : 'hover:bg-white/10'
            }`}
          >
            <Users size={18} />
            Pending Organizers
          </button>

          <button
            onClick={() => setCurrentTab('students')}
            className={`flex items-center gap-3 p-3 rounded-lg transition ${
              currentTab === 'students'
                ? 'bg-white text-[#003366]'
                : 'hover:bg-white/10'
            }`}
          >
            <Users size={18} />
            Students
          </button>

        </nav>

        <button onClick={handleLogout} className="mt-auto m-4 flex items-center gap-3 p-3 text-red-300 hover:bg-red-500/10 rounded-xl transition-all font-bold text-sm">
          <LogOut size={18} /> Logout
        </button>

      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col p-10 min-w-0 overflow-y-auto">

        {renderContent()}

      </main>

    </div>
  );
};

export default AdminDashboard;

