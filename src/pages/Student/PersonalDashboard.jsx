import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  LogOut, 
  User, 
  CalendarDays, 
  MapPin, 
  ArrowLeft,
  Loader2,
  Clock,
  CheckCircle2,
  History
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [activeRegs, setActiveRegs] = useState([]);
  const [pastRegs, setPastRegs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return navigate('/');

      try {
        const now = new Date();

        const { data: profile } = await supabase
          .from('students')
          .select('student_id_number, profiles(first_name, last_name)')
          .eq('id', user.id)
          .single();

        const { data: allRegs } = await supabase
          .from('registrations')
          .select(`
            id,
            events (
              id, title, venue, start_datetime, end_datetime, categories
            )
          `)
          .eq('student_id', user.id);

        const active = [];
        const past = [];

        allRegs?.forEach(reg => {
          if (new Date(reg.events.end_datetime) > now) {
            active.push(reg);
          } else {
            past.push(reg);
          }
        });

        setStudent(profile);
        setActiveRegs(active);
        setPastRegs(past);
      } catch (err) {
        console.error("Dashboard error:", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [navigate]);

  const formatDate = (ds) => new Date(ds).toLocaleDateString('en-US', { 
    month: 'short', day: 'numeric', year: 'numeric' 
  });

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="animate-spin text-blue-900" size={40} />
    </div>
  );

  const firstName = student?.profiles?.first_name || '';
  const lastName = student?.profiles?.last_name || '';
  const fullName = `${firstName} ${lastName}`.toUpperCase();
  const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      {/* Navigation */}
      <nav className="bg-[#1d3a8a] text-white py-3 px-6 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <span className="font-extrabold text-lg text-[#facc15] uppercase tracking-wider">Campus Core</span>
          <Link to="/events" className="text-xs font-bold text-slate-300 hover:text-white flex items-center gap-2">
            <ArrowLeft size={14} /> Back to Explore Events
          </Link>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 border-l border-white/10 pl-5">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] font-black text-white uppercase tracking-tight">{fullName}</p>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">{student?.student_id_number}</p>
            </div>
            {/* The Yellow Badge from your HTML */}
            <div className="w-8 h-8 bg-[#facc15] rounded-full flex items-center justify-center text-[#0f172a] font-black text-xs shadow-sm">
              {initials}
            </div>
        
            <button onClick={() => supabase.auth.signOut()} className="text-slate-400 hover:text-red-400 transition-colors">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {/* Header matches font sizes from format */}
        <header className="mb-12">
          <div className="flex items-center gap-3 mb-1">
            <span className="h-1 w-8 bg-[#facc15] rounded-full"></span>
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Student Portal</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Personal Dashboard</h1>
          <p className="text-slate-500 text-[11px] font-medium mt-1">Review your upcoming schedules and registration history.</p>
        </header>

        {/* Active Section */}
        <section className="mb-16">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-1 bg-blue-50 rounded-md">
              <CalendarDays className="text-[#1d3a8a] w-3.5 h-3.5" />
            </div>
            <h2 className="font-bold text-slate-800 uppercase text-[10px] tracking-widest">Active Registrations</h2>
          </div>
          
          <div className="flex gap-5 overflow-x-auto pb-6 scrollbar-hide">
            {activeRegs.length > 0 ? activeRegs.map(reg => (
              <div key={reg.id} className="min-w-[300px] p-5 border border-slate-100 rounded-xl bg-white shadow-sm">
                <span className="bg-blue-50 text-[#1d3a8a] text-[9px] font-black px-1.5 py-0.5 rounded uppercase mb-3 inline-block">
                  {reg.events.categories?.[0] || 'Event'}
                </span>
                <h3 className="font-bold text-slate-900 text-base mb-1 leading-tight">{reg.events.title}</h3>
                <div className="text-slate-500 text-[11px] space-y-1 mb-6">
                   <p className="flex items-center gap-1.5"><MapPin size={12} className="text-[#facc15]" /> {reg.events.venue}</p>
                   <p className="flex items-center gap-1.5"><Clock size={12} /> {formatDate(reg.events.start_datetime)}</p>
                </div>
                <div className="flex justify-between items-center border-t border-slate-50 pt-4">
                  <button className="text-[10px] font-black text-red-500 hover:underline">CANCEL</button>
                  <Link to={`/events/${reg.events.id}`} className="bg-[#0f172a] text-white text-[10px] px-3 py-1.5 rounded-lg font-bold">VIEW DETAILS</Link>
                </div>
              </div>
            )) : (
              <p className="text-slate-400 text-[11px] italic">No active registrations.</p>
            )}
          </div>
        </section>

        {/* Past Section - Table format */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <div className="p-1 bg-slate-50 rounded-md">
              <History className="text-slate-400 w-3.5 h-3.5" />
            </div>
            <h2 className="font-bold text-slate-500 uppercase text-[10px] tracking-widest">Past Registered Events</h2>
          </div>
          
          <div className="overflow-hidden border border-slate-100 rounded-xl shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 text-[9px] font-black uppercase text-slate-400">
                <tr>
                  <th className="px-6 py-4">Event Name</th>
                  <th className="px-6 py-4">Venue</th>
                  <th className="px-6 py-4">Event Date</th>
                  <th className="px-6 py-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {pastRegs.length > 0 ? pastRegs.map(reg => (
                  <tr key={reg.id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-700 text-sm">{reg.events.title}</td>
                    <td className="px-6 py-4 text-[11px] text-slate-500 font-medium">{reg.events.venue}</td>
                    <td className="px-6 py-4 text-[11px] text-slate-500 font-medium">{formatDate(reg.events.start_datetime)}</td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-slate-400 text-[9px] font-black uppercase tracking-tight px-2 py-0.5 bg-slate-50 rounded inline-flex items-center gap-1">
                        <CheckCircle2 size={10} /> Completed
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan="4" className="px-6 py-10 text-center text-slate-400 text-[11px] italic">No history found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
};

export default StudentDashboard;