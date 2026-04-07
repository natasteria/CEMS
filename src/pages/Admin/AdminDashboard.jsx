import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Loader2, User, Mail, Phone } from 'lucide-react';

const AdminDashboard = () => {
  const [adminProfile, setAdminProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchAdminData = async () => {
      try {
        setLoading(true);

        // Small delay for UX consistency
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Get logged in user
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError) throw userError;
        if (!user) throw new Error("User not authenticated");

        // Fetch profile directly
        const { data, error: profileError } = await supabase
          .from('profiles')
          .select(`
            first_name,
            last_name,
            email,
            phone_number
          `)
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;

        if (isMounted) {
          setAdminProfile(data);
        }

      } catch (err) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAdminData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Loading screen
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center">
          <Loader2 className="w-12 h-12 text-[#003366] animate-spin mb-4" />
          <p className="text-slate-500 font-medium animate-pulse">
            Loading Administrator Profile...
          </p>
        </div>
      </div>
    );
  }

  if (error) return <div className="p-10 text-red-500">Error: {error}</div>;
  if (!adminProfile) return <div className="p-10">No profile found.</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto">

        <h1 className="text-3xl font-bold text-[#003366] mb-6">
          Admin Dashboard
        </h1>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
          <h2 className="text-xl font-semibold mb-6 border-b pb-4">
            Personal Information
          </h2>

          <div className="space-y-4">

            <div className="flex items-center gap-4">
              <div className="bg-slate-100 p-2 rounded-lg">
                <User className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Full Name</p>
                <p className="font-medium text-slate-800">
                  {adminProfile.first_name} {adminProfile.last_name}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="bg-slate-100 p-2 rounded-lg">
                <Mail className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Email Address</p>
                <p className="font-medium text-slate-800">
                  {adminProfile.email}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="bg-slate-100 p-2 rounded-lg">
                <Phone className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Phone Number</p>
                <p className="font-medium text-slate-800">
                  {adminProfile.phone_number || 'Not provided'}
                </p>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;

