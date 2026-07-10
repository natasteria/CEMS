import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Loader2, User, Calendar, Users, Shield, LogOut, BarChart3 } from 'lucide-react';

// Pages that render inside main area
import Overview from './DashBoardComponents/Overview';
import AdminProfile from './DashBoardComponents/AdminProfile';
import AdminEventManagment from './DashBoardComponents/AdminEventManagment';
import PendingOrganizers from './DashBoardComponents/PendingOrganizers';
// import ManageStudents from './components/ManageStudents';

const AdminDashboard = () => {

  const [currentTab, setCurrentTab] = useState('overview');
  const [adminProfile, setAdminProfile] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

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

      case 'overview':
        return <Overview />;

      case 'profile':
        return <AdminProfile adminProfile={adminProfile} />;

      case 'events':
        return <AdminEventManagment />;

      case 'organizers':
        return <PendingOrganizers />;

      // case 'students':
      //   return <ManageStudents />;

      default:
        return <Overview />;
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

          <div className="flex items-center gap-2 mt-2 text-base font-medium text-[#facc15]">
            <Shield size={18} />
            Administrator
          </div>

        </div>

        {/* Navigation */}
        <nav className="flex flex-col p-4 gap-2">

          <button
            onClick={() => setCurrentTab('overview')}
            className={`flex items-center gap-3 p-3 rounded-lg transition ${
              currentTab === 'overview'
                ? 'bg-white text-[#003366]'
                : 'hover:bg-white/10'
            }`}
          >
            <BarChart3 size={18} />
            Overview
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

          {/* <button
            onClick={() => setCurrentTab('students')}
            className={`flex items-center gap-3 p-3 rounded-lg transition ${
              currentTab === 'students'
                ? 'bg-white text-[#003366]'
                : 'hover:bg-white/10'
            }`}
          >
            <Users size={18} />
            Students
          </button> */}

        </nav>

        <div className="mt-auto flex flex-col p-4 gap-2 border-t border-white/10">
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
          
          <button onClick={() => setShowLogoutConfirm(true)} className="flex items-center gap-3 p-3 text-red-300 hover:bg-red-500/10 rounded-xl transition-all font-bold text-sm">
            <LogOut size={18} /> Logout
          </button>
        </div>

      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col p-10 min-w-0 overflow-y-auto">

        {renderContent()}

      </main>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <LogOut className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Confirm Logout</h3>
              <p className="text-sm text-slate-500 mb-6">Are you sure you want to log out of your session?</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleLogout}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors shadow-sm shadow-red-200"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;

