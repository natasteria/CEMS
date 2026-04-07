import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Loader2, User, Mail, Phone, Building2, Tag } from 'lucide-react';

const OrganizerDashboard = () => {
  const [organizerProfile, setOrganizerProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchOrganizerData = async () => {
      try {
        setLoading(true);

        // UX delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Get authenticated user
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError) throw userError;
        if (!user) throw new Error("User not authenticated");

        // Fetch organizer + profile info
        const { data, error: fetchError } = await supabase
          .from('organizers')
          .select(`
            organizer_name,
            organizer_type,
            profiles (
              first_name,
              last_name,
              email,
              phone_number
            )
          `)
          .eq('id', user.id)
          .single();

        if (fetchError) throw fetchError;

        if (isMounted) {
          setOrganizerProfile(data);
        }

      } catch (err) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchOrganizerData();

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-12 h-12 text-[#003366] animate-spin mb-4" />
        <p className="text-slate-500 font-medium animate-pulse">
          Loading Organizer Profile...
        </p>
      </div>
    );
  }

  if (error) return <div className="p-10 text-red-500">Error: {error}</div>;
  if (!organizerProfile) return <div className="p-10">No organizer profile found.</div>;

  const profile = organizerProfile.profiles;

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto">

        <h1 className="text-3xl font-bold text-[#003366] mb-6">
          Organizer Dashboard
        </h1>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">

          <h2 className="text-xl font-semibold mb-6 border-b pb-4">
            Organizer Information
          </h2>

          <div className="space-y-4">

            <div className="flex items-center gap-4">
              <div className="bg-slate-100 p-2 rounded-lg">
                <Building2 className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Organizer Name</p>
                <p className="font-medium text-slate-800">
                  {organizerProfile.organizer_name}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="bg-slate-100 p-2 rounded-lg">
                <Tag className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Organizer Type</p>
                <p className="font-medium text-slate-800">
                  {organizerProfile.organizer_type}
                </p>
              </div>
            </div>

          </div>

          <h2 className="text-xl font-semibold mt-10 mb-6 border-b pb-4">
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
                  {profile.first_name} {profile.last_name}
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
                  {profile.email}
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
                  {profile.phone_number || 'Not provided'}
                </p>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

export default OrganizerDashboard;

