import React, { useEffect, useState } from 'react';
import { Clock, CheckCircle2, ShieldCheck, ShieldAlert, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';

const PendingReview = () => {
  const [status, setStatus] = useState('pending');
  const [organizerName, setOrganizerName] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const fetchStatus = async () => {
      // 1. Get current user session
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // 2. Fetch organizer profile
      // .maybeSingle() prevents 406 errors if the row hasn't been created yet
      const { data, error } = await supabase
        .from('organizers')
        .select(`
          registration_status, 
          organizer_name,
          profiles (
            first_name,
            last_name
          )
        `)
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching organizer status:', error.message);
        // We don't set loading to false here to allow the interval to keep trying
        return;
      }

      console.log(data.organizer_name)

      // 3. If the row exists, update state and stop loading
      if (data && isMounted) {
        setStatus(data.registration_status);
        setOrganizerName(`${data.organizer_name} (${data.profiles?.first_name} ${data.profiles?.last_name})`);
        setLoading(false);

        // 4. Handle Redirection
        if (data.registration_status === 'approved') {
          navigate('/organizer-dashboard');
        } else if (data.registration_status === 'rejected') {
          navigate('/organizer-rejected');
        }
      }
    };

    fetchStatus();
    
    // Check every 5 seconds for status updates
    const interval = setInterval(fetchStatus, 5000);

    return () => {
      clearInterval(interval);
      isMounted = false;
    };
  }, [navigate]);

  // --- LOADING SCREEN (Prevents the "Flicker" effect) ---
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center">
          <Loader2 className="w-12 h-12 text-[#003366] animate-spin mb-4" />
          <p className="text-slate-500 font-medium animate-pulse">
            Verifying application status...
          </p>
        </div>
      </div>
    );
  }

  // --- MAIN UI HELPER ---
  const getStepOpacity = (step) => {
    switch (step) {
      case 'registered': 
        return (status === 'pending' || status === 'approved') ? 'opacity-100' : 'opacity-40';
      case 'reviewing': 
        return status === 'pending' ? 'opacity-100' : 'opacity-40';
      case 'approved': 
        return status === 'approved' ? 'opacity-100' : 'opacity-40';
      default: 
        return 'opacity-40';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans">
      {/* Header Section */}
      <div className="flex flex-col items-center mb-8 text-center">
        <div className="bg-[#003366] p-4 rounded-xl shadow-lg mb-6">
          <ShieldAlert className="w-10 h-10 text-[#FFCC00]" />
        </div>
        <h1 className="text-4xl font-bold text-[#003366] mb-2">Application Pending</h1>
        <p className="text-slate-500 text-lg">
          <span className="font-semibold text-slate-800">{organizerName}</span>, your organizer credentials are being verified by the administrator.
        </p>
      </div>

      {/* Status Card */}
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Banner */}
        <div className="bg-[#fef9c3] px-6 py-3 flex items-center gap-2 border-b border-yellow-100">
          <div className="flex items-center gap-1.5 bg-[#FFCC00] px-3 py-1 rounded-full text-[#003366] text-sm font-semibold">
            <Clock className="w-4 h-4" />
            <span className="capitalize">{status}</span>
          </div>
          <span className="text-slate-500 text-sm font-medium">~24 hour manual review</span>
        </div>

        <div className="p-8">
          <p className="text-slate-600 leading-relaxed mb-12">
            To maintain the safety of the Unity community, we manually review every organizer application.
            Once your account is reviewed, You will recieve an email notification.
          </p>

          {/* Progress Stepper */}
          <div className="relative flex items-center justify-between px-4">
            {/* Background Line */}
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 -translate-y-1/2 z-0" />
            
            {/* Active Progress Line */}
            <div 
              className="absolute top-1/2 left-0 h-0.5 bg-[#003366] -translate-y-1/2 z-0 transition-all duration-1000 ease-in-out" 
              style={{ width: status === 'approved' ? '100%' : '50%' }}
            />

            {/* Step 1: Registered */}
            <div className={`relative z-10 flex flex-col items-center transition-opacity duration-500 ${getStepOpacity('registered')}`}>
              <div className="bg-[#003366] p-2.5 rounded-full ring-4 ring-white">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
              <span className="mt-3 text-sm font-bold text-[#003366]">Registered</span>
            </div>

            {/* Step 2: Reviewing */}
            <div className={`relative z-10 flex flex-col items-center transition-opacity duration-500 ${getStepOpacity('reviewing')}`}>
              <div className="bg-[#FFCC00] p-2.5 rounded-full ring-4 ring-white">
                <Clock className="w-6 h-6 text-[#003366]" />
              </div>
              <span className="mt-3 text-sm font-bold text-[#003366]">Reviewing</span>
            </div>

            {/* Step 3: Approved */}
            <div className={`relative z-10 flex flex-col items-center transition-all duration-500 ${getStepOpacity('approved')}`}>
              <div className={`p-2.5 rounded-full ring-4 ring-white border transition-colors ${status === 'approved' ? 'bg-green-500 border-green-600' : 'bg-slate-100 border-slate-300'}`}>
                <ShieldCheck className={`w-6 h-6 ${status === 'approved' ? 'text-white' : 'text-slate-400'}`} />
              </div>
              <span className={`mt-3 text-sm font-bold ${status === 'approved' ? 'text-green-600' : 'text-slate-400'}`}>Approved</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PendingReview;