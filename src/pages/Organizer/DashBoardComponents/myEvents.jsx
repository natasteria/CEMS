import React, { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { 
  Search, Plus, Calendar, Users, Edit, Trash2, 
  Loader2, X, MapPin, Clock, FileText, CheckCircle, 
  Hash, ImageIcon, Tag, Info, AlertCircle, CalendarRange
} from 'lucide-react';

const MyEvents = ({ onCreateClick, onEditClick }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  
  // Modal State
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [loadingAttendees, setLoadingAttendees] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('events')
        .select('*, registrations(count)')
        .eq('organizer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEvents(data || []);
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!id || !window.confirm("Delete this event permanently?")) return;
    try {
      const { error } = await supabase.from('events').delete().eq('id', id);
      if (!error) {
        setEvents(prev => prev.filter(ev => ev.id !== id));
        alert("Event successfully deleted.");
      }
    } catch (err) { console.error(err); }
  };

  const handleEdit = (e, event) => {
    e.stopPropagation();
    onEditClick(event);
  };

  const openEventDetails = async (event) => {
    setSelectedEvent(event);
    setLoadingAttendees(true);
    try {
      const { data, error } = await supabase
        .from('registrations')
        .select(`profiles ( id, first_name, last_name, email )`)
        .eq('event_id', event.id);
      if (!error) setAttendees(data || []);
    } catch (err) { 
      setAttendees([]);
    } finally { 
      setLoadingAttendees(false); 
    }
  };

  const now = new Date();
  const filteredEvents = (events || []).filter(e => {
    const matchesSearch = e?.title?.toLowerCase().includes(search.toLowerCase()) || 
                         e?.venue?.toLowerCase().includes(search.toLowerCase());
    const eventDate = e?.start_datetime ? new Date(e.start_datetime) : null;
    if (filter === 'upcoming') return matchesSearch && eventDate && eventDate >= now;
    if (filter === 'past') return matchesSearch && eventDate && eventDate < now;
    return matchesSearch;
  });

  if (loading) return (
    <div className="h-screen flex items-center justify-center">
      <Loader2 className="animate-spin text-[#003366]" size={40} />
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-20 font-sans">
      
      {/* ── HEADER ── */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">My Events</h1>
          <p className="text-slate-400 font-medium mt-1 text-sm">Real-time management of your organization's activities.</p>
        </div>
        <button onClick={onCreateClick} className="bg-[#facc15] text-[#003366] px-8 py-3.5 rounded-2xl font-black flex items-center gap-2 shadow-xl hover:scale-105 active:scale-95 transition-all">
          <Plus size={20} strokeWidth={3} /> Create Event
        </button>
      </div>

      {/* ── SEARCH & TABS ── */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white p-2 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex gap-2 p-1">
          <TabBtn active={filter === 'all'} onClick={() => setFilter('all')} label="All Events" count={events.length} />
          <TabBtn active={filter === 'upcoming'} onClick={() => setFilter('upcoming')} label="Upcoming" count={events.filter(e => new Date(e.start_datetime) >= now).length} />
          <TabBtn active={filter === 'past'} onClick={() => setFilter('past')} label="Past" count={events.filter(e => new Date(e.start_datetime) < now).length} />
        </div>

        <div className="relative w-full md:w-96 mr-2">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
          <input 
            type="text" placeholder="Search title, category, venue..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500/20 transition-all text-sm font-semibold"
          />
        </div>
      </div>

      {/* ── MAIN TABLE ── */}
      <div className="bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-slate-200/50">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-50">
              <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Event details</th>
              <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Schedule</th>
              <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Registrations</th>
              <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
              <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredEvents.map(event => {
              const regCount = event.registrations?.[0]?.count || 0;
              const percent = Math.min(Math.round((regCount / (event.capacity || 1)) * 100), 100);
              const isPast = new Date(event.start_datetime) < now;
              
              return (
                <tr key={event.id} onClick={() => openEventDetails(event)} className="group hover:bg-blue-50/30 transition-all cursor-pointer">
                  <td className="px-10 py-8">
                    <div className="flex items-center gap-5">
                       <div className={`w-1.5 h-12 rounded-full ${getBarColor(event.status)}`} />
                       <div>
                         <div className="font-bold text-slate-800 text-base mb-1">{event.title}</div>
                         <div className="flex items-center gap-2 text-[10px] text-slate-300 font-black tracking-widest uppercase">
                            <Hash size={10}/> {event.id.substring(0,8)}
                         </div>
                       </div>
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    <div className="flex flex-col gap-1">
                      <div className="text-xs font-bold text-slate-600 flex items-center gap-2 uppercase">
                         <Calendar size={12} className="text-blue-500" /> {new Date(event.start_datetime).toLocaleDateString()}
                      </div>
                      <div className="text-[10px] text-slate-400 font-black uppercase flex items-center gap-2">
                         <Clock size={12} /> {new Date(event.start_datetime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    <div className="w-40">
                       <div className="flex justify-between items-end mb-2 text-[10px] font-black">
                          <span className="text-slate-400">{regCount} / {event.capacity || '∞'}</span>
                          <span className={percent > 90 ? 'text-rose-500' : 'text-blue-600'}>{percent}%</span>
                       </div>
                       <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full transition-all duration-1000 ${getBarColor(event.status)}`} style={{ width: `${percent}%` }} />
                       </div>
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    {/* ── REFINED STATUS UI ── */}
                    <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center w-fit gap-2 border ${getStatusPill(event.status)}`}>
                       <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                       {event.status}
                    </span>
                  </td>
                  <td className="px-10 py-8 text-right">
                    {!isPast ? (
                      <div className="flex justify-end gap-2">
                        <button onClick={(e) => handleEdit(e, event)} className="p-3 bg-white text-blue-600 rounded-2xl shadow-sm border border-slate-100 hover:bg-blue-600 hover:text-white transition-all"><Edit size={16}/></button>
                        <button onClick={(e) => handleDelete(e, event.id)} className="p-3 bg-white text-rose-500 rounded-2xl shadow-sm border border-slate-100 hover:bg-rose-500 hover:text-white transition-all"><Trash2 size={16}/></button>
                      </div>
                    ) : <span className="text-[9px] font-black text-slate-300 uppercase italic">Completed</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── COMPLETE EVENT DETAILS MODAL ── */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-12 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-[#001a33]/60 backdrop-blur-md" onClick={() => setSelectedEvent(null)}></div>
          
          <div className="relative bg-white w-full max-w-7xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row h-[90vh] animate-in zoom-in-95 duration-500">
            
            {/* LEFT: DETAILED INFORMATION */}
            <div className="md:w-3/5 p-12 overflow-y-auto bg-white border-r border-slate-50 custom-scrollbar">
               <button onClick={() => setSelectedEvent(null)} className="mb-8 p-3 bg-slate-50 text-slate-400 hover:text-[#003366] rounded-2xl transition-all shadow-sm"><X size={20}/></button>
               
               <div className="relative w-full h-80 rounded-[2.5rem] overflow-hidden mb-10 shadow-inner bg-slate-100 border border-slate-100">
                  {selectedEvent.image_url ? (
                    <img src={selectedEvent.image_url} alt="Poster" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-3">
                       <ImageIcon size={64} strokeWidth={1} />
                       <p className="text-[10px] font-black uppercase tracking-widest">No Poster Image</p>
                    </div>
                  )}
                  <div className="absolute top-6 left-6 shadow-lg bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl border border-slate-200">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${getStatusPill(selectedEvent.status)}`}>● {selectedEvent.status}</span>
                  </div>
               </div>

               <div className="space-y-10">
                  <div>
                    <h2 className="text-4xl font-black text-slate-900 leading-tight mb-4">{selectedEvent.title}</h2>
                    <div className="flex flex-wrap gap-2">
                        {selectedEvent.categories?.map((cat, i) => (
                          <span key={i} className="px-4 py-1.5 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 border border-blue-100">
                            <Tag size={12}/> {cat}
                          </span>
                        ))}
                    </div>
                  </div>

                  {/* Comprehensive Data Grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-8 py-10 border-y border-slate-100">
                    <ModalStat icon={<Calendar/>} label="START DATE" val={new Date(selectedEvent.start_datetime).toLocaleDateString()} />
                    <ModalStat icon={<Clock/>} label="START TIME" val={new Date(selectedEvent.start_datetime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} />
                    <ModalStat icon={<Clock/>} label="END TIME" val={new Date(selectedEvent.end_datetime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} />
                    <ModalStat icon={<MapPin/>} label="VENUE" val={selectedEvent.venue} />
                    <ModalStat icon={<Users/>} label="TOTAL CAPACITY" val={`${selectedEvent.capacity || 'Unlimited'} Seats`} />
                    <ModalStat icon={<AlertCircle/>} label="DEADLINE" val={selectedEvent.registration_deadline ? new Date(selectedEvent.registration_deadline).toLocaleDateString() : 'None'} />
                    <ModalStat icon={<CalendarRange/>} label="CREATED AT" val={new Date(selectedEvent.created_at).toLocaleDateString()} />
                    <ModalStat icon={<CheckCircle/>} label="TOTAL REG" val={`${attendees.length} Students`} />
                    <ModalStat icon={<Hash/>} label="EVENT ID" val={selectedEvent.id.substring(0,12).toUpperCase()} />
                  </div>

                  <div className="p-8 bg-slate-50 rounded-[2.5rem]">
                     <p className="text-[11px] font-black text-blue-600 uppercase tracking-widest mb-4 flex items-center gap-2"><FileText size={16}/> Description</p>
                     <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap font-medium">{selectedEvent.description || "No description provided."}</p>
                  </div>
               </div>
            </div>

            {/* RIGHT: REGISTERED STUDENTS LIST */}
            <div className="md:w-2/5 bg-[#003366] p-12 flex flex-col text-white">
               <div className="flex items-center justify-between mb-10">
                  <div>
                    <h3 className="text-2xl font-black tracking-tight">Attendees</h3>
                    <p className="text-blue-300 text-[10px] font-black uppercase mt-1 tracking-widest">Live Enrollment Feed</p>
                  </div>
                  <div className="bg-white/10 px-4 py-2 rounded-2xl border border-white/10 text-xl font-black">
                    {attendees.length}
                  </div>
               </div>

               <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar-white">
                  {loadingAttendees ? (
                    <div className="flex flex-col items-center justify-center h-full gap-4 opacity-40">
                        <Loader2 className="animate-spin" size={32} />
                        <p className="text-[10px] font-black uppercase">Fetching records...</p>
                    </div>
                  ) : attendees.length > 0 ? attendees.map((item, idx) => (
                    <div key={idx} className="bg-white/5 p-5 rounded-[1.5rem] border border-white/5 flex items-center gap-4 group hover:bg-white/10 transition-all cursor-default">
                       <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-sm font-black text-blue-200">
                         {item.profiles?.first_name?.[0]}{item.profiles?.last_name?.[0]}
                       </div>
                       <div className="flex-1">
                         <p className="font-bold text-white text-sm">{item.profiles?.first_name} {item.profiles?.last_name}</p>
                         <p className="text-[10px] text-blue-300/60 font-black tracking-widest uppercase mt-1">ID: {item.profiles?.id.substring(0,12)}</p>
                       </div>
                       <CheckCircle size={14} className="text-emerald-400 opacity-20 group-hover:opacity-100 transition-all" />
                    </div>
                  )) : (
                    <div className="h-full flex flex-col items-center justify-center opacity-20 text-center">
                       <Users size={64} strokeWidth={1} />
                       <p className="text-xs font-black uppercase mt-4 tracking-widest">No registrations yet</p>
                    </div>
                  )}
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── SUB-COMPONENTS ──
const TabBtn = ({ active, onClick, label, count }) => (
  <button onClick={onClick} className={`px-6 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 ${
    active ? 'bg-[#003366] text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'
  }`}>
    {label} <span className={`bg-slate-200 text-slate-500 px-2 py-0.5 rounded-lg text-[10px] ml-1`}>{count}</span>
  </button>
);

const ModalStat = ({ icon, label, val }) => (
  <div className="flex gap-4">
    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl h-fit">{icon}</div>
    <div>
      <p className="text-[9px] font-black text-slate-300 uppercase mb-1 tracking-wider">{label}</p>
      <p className="text-sm font-bold text-slate-700 leading-tight">{val || 'Not Set'}</p>
    </div>
  </div>
);

// ── COLOR HELPERS ──
const getBarColor = (s) => {
  const st = s?.toLowerCase();
  if(st === 'approved') return 'bg-emerald-500';
  if(st === 'rejected') return 'bg-rose-500';
  if(st === 'edited') return 'bg-blue-500';
  return 'bg-amber-500'; // pending
};

const getStatusPill = (s) => {
  const st = s?.toLowerCase();
  if(st === 'approved') return 'bg-emerald-50 border-emerald-100 text-emerald-600';
  if(st === 'rejected') return 'bg-rose-50 border-rose-100 text-rose-600';
  if(st === 'edited') return 'bg-blue-50 border-blue-100 text-blue-600';
  return 'bg-amber-50 border-amber-100 text-amber-600'; // pending
};

export default MyEvents;