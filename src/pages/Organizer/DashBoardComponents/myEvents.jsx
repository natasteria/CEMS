import React, { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { 
  Search, Plus, Calendar, Users, Edit, Trash2, 
  Loader2, X, MapPin, Clock, FileText, CheckCircle, 
  Hash, ImageIcon, Tag, Info, AlertCircle, 
  GraduationCap, School, Mail, ChevronLeft, Phone, MoreHorizontal
} from 'lucide-react';

const MyEvents = ({ onCreateClick, onEditClick }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showAttendeeModal, setShowAttendeeModal] = useState(false);
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
      }
    } catch (err) { console.error(err); }
  };

  const handleEdit = (e, event) => {
    e.stopPropagation();
    onEditClick(event);
  };

  const handleViewAttendees = async (e, event) => {
    e.stopPropagation();
    setSelectedEvent(event);
    setLoadingAttendees(true);
    setShowAttendeeModal(true);
    try {
      const { data, error } = await supabase
        .from('registrations')
        .select(`id, students (student_id_number, department, batch_year, profiles (first_name, last_name, email, phone_number))`)
        .eq('event_id', event.id);
      if (error) throw error;
      setAttendees(data || []);
    } catch (err) {
      setAttendees([]);
    } finally {
      setLoadingAttendees(false);
    }
  };

  const handleExitToDashboard = () => {
    setShowAttendeeModal(false);
    setSelectedEvent(null);
  };

  const openEventDetails = (event) => {
    setSelectedEvent(event);
    setShowAttendeeModal(false);
  };

  const now = new Date();
  const filteredEvents = (events || []).filter(e => {
    const matchesSearch = e?.title?.toLowerCase().includes(search.toLowerCase());
    const isPast = new Date(e?.start_datetime) < now;
    if (filter === 'upcoming') return matchesSearch && !isPast;
    if (filter === 'past') return matchesSearch && isPast;
    return matchesSearch;
  });

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-white">
      <Loader2 className="animate-spin text-[#003366]" size={40} />
    </div>
  );

  return (
    <div className="space-y-6 pb-20 font-sans px-2 md:px-0">
      
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tight">My Events</h1>
          <p className="text-slate-400 font-medium text-xs md:text-sm mt-1">Manage your activities.</p>
        </div>
        <button onClick={onCreateClick} className="w-full sm:w-auto bg-[#facc15] text-[#003366] px-6 py-3 rounded-2xl font-black flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all text-sm">
          <Plus size={18} strokeWidth={3} /> Create Event
        </button>
      </div>

      {/* ── FILTER & SEARCH ── */}
      <div className="flex flex-col gap-4 bg-white p-2 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex overflow-x-auto no-scrollbar gap-2 p-1">
          <TabBtn active={filter === 'all'} onClick={() => setFilter('all')} label="All" count={events.length} />
          <TabBtn active={filter === 'upcoming'} onClick={() => setFilter('upcoming')} label="Upcoming" count={events.filter(e => new Date(e.start_datetime) >= now).length} />
          <TabBtn active={filter === 'past'} onClick={() => setFilter('past')} label="Past" count={events.filter(e => new Date(e.start_datetime) < now).length} />
        </div>
        <div className="relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
          <input type="text" placeholder="Search events..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500/20 text-sm font-semibold" />
        </div>
      </div>

      {/* ── DESKTOP TABLE (Hidden on Mobile) ── */}
      <div className="hidden lg:block bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-slate-200/50">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <th className="px-8 py-6">Event details</th>
              <th className="px-8 py-6">Schedule</th>
              <th className="px-8 py-6">Registrations</th>
              <th className="px-8 py-6 text-center">Student List</th>
              <th className="px-8 py-6 text-center">Status</th>
              <th className="px-8 py-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredEvents.map(event => {
              const regCount = event.registrations?.[0]?.count || 0;
              const percent = Math.min(Math.round((regCount / (event.capacity || 1)) * 100), 100);
              const isPast = new Date(event.start_datetime) < now;
              return (
                <tr key={event.id} onClick={() => openEventDetails(event)} className="group hover:bg-blue-50/30 transition-all cursor-pointer">
                  <td className="px-8 py-8">
                    <div className="flex items-center gap-4">
                       <div className={`w-1 h-10 rounded-full ${getBarColor(event.status)}`} />
                       <div>
                         <p className="font-bold text-slate-800 text-sm">{event.title}</p>
                         <p className="text-[10px] text-slate-300 font-black uppercase mt-1">ID: {event.id.substring(0,8)}</p>
                       </div>
                    </div>
                  </td>
                  <td className="px-8 py-8">
                    <p className="text-xs font-bold text-slate-600 uppercase">{new Date(event.start_datetime).toLocaleDateString()}</p>
                    <p className="text-[10px] text-slate-400 font-black uppercase">{new Date(event.start_datetime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p>
                  </td>
                  <td className="px-8 py-8 w-32">
                    <div className="flex justify-between text-[10px] font-black mb-1">
                        <span className="text-slate-400">{regCount}/{event.capacity}</span>
                        <span className="text-blue-600">{percent}%</span>
                    </div>
                    <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full transition-all duration-1000 ${getBarColor(event.status)}`} style={{ width: `${percent}%` }} />
                    </div>
                  </td>
                  <td className="px-8 py-8 text-center">
                    <button onClick={(e) => handleViewAttendees(e, event)} className="p-3 bg-blue-50 text-blue-600 rounded-2xl hover:bg-[#003366] hover:text-white transition-all shadow-sm flex items-center justify-center mx-auto gap-2">
                      <Users size={16}/> <span className="text-[10px] font-black uppercase">Attendees</span>
                    </button>
                  </td>
                  <td className="px-8 py-8 text-center">
                    <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black border uppercase tracking-widest ${getStatusPill(event.status)}`}>{event.status}</span>
                  </td>
                  <td className="px-8 py-8 text-right">
                    {!isPast ? (
                      <div className="flex justify-end gap-2">
                        <button onClick={(e) => handleEdit(e, event)} className="p-3 bg-white text-blue-600 rounded-xl shadow-sm border hover:bg-blue-600 hover:text-white transition-all"><Edit size={16}/></button>
                        <button onClick={(e) => handleDelete(e, event.id)} className="p-3 bg-white text-rose-500 rounded-xl shadow-sm border hover:bg-rose-500 hover:text-white transition-all"><Trash2 size={16}/></button>
                      </div>
                    ) : <span className="text-[10px] font-black text-slate-300 uppercase italic">Ended</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── MOBILE CARDS (Visible only on Mobile) ── */}
      <div className="lg:hidden space-y-4">
        {filteredEvents.map(event => {
          const regCount = event.registrations?.[0]?.count || 0;
          const isPast = new Date(event.start_datetime) < now;
          return (
            <div key={event.id} onClick={() => openEventDetails(event)} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm active:scale-[0.98] transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-1 h-8 rounded-full ${getBarColor(event.status)}`} />
                  <div>
                    <p className="font-bold text-slate-800 text-sm leading-tight">{event.title}</p>
                    <p className="text-[9px] text-slate-300 font-black mt-1 uppercase">#{event.id.substring(0,8)}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-lg text-[8px] font-black border uppercase ${getStatusPill(event.status)}`}>{event.status}</span>
              </div>
              
              <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl mb-4">
                 <div className="flex items-center gap-2 text-slate-500">
                    <Calendar size={14}/> <span className="text-[10px] font-bold">{new Date(event.start_datetime).toLocaleDateString()}</span>
                 </div>
                 <div className="flex items-center gap-2 text-slate-500">
                    <Users size={14}/> <span className="text-[10px] font-bold">{regCount} Registered</span>
                 </div>
              </div>

              <div className="flex gap-2">
                <button onClick={(e) => handleViewAttendees(e, event)} className="flex-1 py-3 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2">
                  <Users size={14}/> Attendees
                </button>
                {!isPast && (
                  <>
                    <button onClick={(e) => handleEdit(e, event)} className="p-3 bg-slate-50 text-blue-600 rounded-xl border border-slate-100"><Edit size={16}/></button>
                    <button onClick={(e) => handleDelete(e, event.id)} className="p-3 bg-slate-50 text-rose-500 rounded-xl border border-slate-100"><Trash2 size={16}/></button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── MODAL 1: EVENT DETAILS (Responsive) ── */}
      {selectedEvent && !showAttendeeModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-12 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-[#001a33]/70 backdrop-blur-md" onClick={() => setSelectedEvent(null)}></div>
          <div className="relative bg-white w-full max-w-4xl rounded-t-[2.5rem] sm:rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col h-[92vh] sm:h-[85vh] animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-500">
            <div className="p-6 md:p-10 overflow-y-auto bg-white custom-scrollbar">
               <button onClick={() => setSelectedEvent(null)} className="p-3 bg-slate-100 text-slate-500 rounded-2xl mb-6 hover:bg-rose-500 hover:text-white transition-all"><X size={20}/></button>
               <div className="relative w-full h-56 sm:h-80 rounded-[2rem] sm:rounded-[3rem] overflow-hidden mb-8 shadow-inner border border-slate-100">
                  {selectedEvent.image_url ? <img src={selectedEvent.image_url} alt="Poster" className="w-full h-full object-cover" /> : <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 bg-slate-50"><ImageIcon size={48}/><p className="text-[10px] font-black uppercase mt-2">No Image</p></div>}
                  <div className="absolute top-4 left-4 sm:top-8 sm:left-8"><span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border bg-white/90 shadow-xl ${getStatusPill(selectedEvent.status)}`}>● {selectedEvent.status}</span></div>
               </div>
               <div className="space-y-8 sm:space-y-12 px-2 sm:px-6">
                  <h2 className="text-3xl sm:text-5xl font-black text-slate-900 leading-[1.1]">{selectedEvent.title}</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 py-6 sm:py-10 border-y border-slate-100">
                    <ModalStat label="DATE" val={new Date(selectedEvent.start_datetime).toLocaleDateString()} />
                    <ModalStat label="START TIME" val={new Date(selectedEvent.start_datetime).toLocaleTimeString()} />
                    <ModalStat label="VENUE" val={selectedEvent.venue} />
                    <ModalStat label="CAPACITY" val={`${selectedEvent.capacity} Seats`} />
                  </div>
                  <div className="p-6 sm:p-10 bg-slate-50 rounded-[2rem] sm:rounded-[3rem] border border-slate-100">
                     <p className="text-[11px] font-black text-blue-600 uppercase mb-4 flex items-center gap-2 tracking-[0.2em]"><FileText size={18}/> Description</p>
                     <p className="text-slate-600 text-sm sm:text-base leading-relaxed whitespace-pre-wrap font-medium">{selectedEvent.description || "No description provided."}</p>
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}

{/* ── MODAL 2: RESPONSIVE STUDENT LIST ── */}
      {showAttendeeModal && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-8 animate-in fade-in duration-300">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-[#001a33]/90 backdrop-blur-xl" onClick={handleExitToDashboard}></div>
          
          <div className="relative bg-slate-50 w-full max-w-6xl rounded-t-[2.5rem] sm:rounded-[3rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col h-[95vh] sm:h-[90vh] animate-in slide-in-from-bottom-20 duration-500">
            
            {/* Modal Header (Responsive) */}
            <div className="bg-white p-5 sm:p-10 border-b border-slate-200 flex justify-between items-center shadow-sm">
               <div className="flex items-center gap-3 sm:gap-6">
                  <button onClick={handleExitToDashboard} className="p-2 sm:p-4 bg-slate-50 text-slate-400 hover:bg-[#003366] hover:text-white rounded-xl sm:rounded-2xl transition-all">
                    <ChevronLeft size={20} className="sm:w-6 sm:h-6"/>
                  </button>
                  <div className="hidden xs:block w-1 h-8 sm:w-1.5 sm:h-12 bg-blue-600 rounded-full" />
                  <div>
                    <h3 className="text-lg sm:text-3xl font-black text-slate-800 tracking-tight leading-none">Enrollments</h3>
                    <p className="text-slate-400 font-bold text-[9px] sm:text-xs uppercase tracking-widest mt-1 truncate max-w-[150px] sm:max-w-none">
                       {selectedEvent?.title}
                    </p>
                  </div>
               </div>
               <div className="flex items-center gap-4 sm:gap-8">
                  <div className="text-right">
                    <p className="hidden sm:block text-[10px] font-black text-slate-300 uppercase tracking-widest">Total Students</p>
                    <p className="text-xl sm:text-3xl font-black text-blue-600">{attendees.length}</p>
                  </div>
                  <button onClick={handleExitToDashboard} className="p-3 sm:p-5 bg-slate-100 text-slate-500 hover:bg-rose-500 hover:text-white rounded-xl sm:rounded-[1.5rem] transition-all">
                    <X size={20}/>
                  </button>
               </div>
            </div>

            {/* List Body (Responsive Grid) */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-12 custom-scrollbar">
               {loadingAttendees ? (
                 <div className="flex flex-col items-center justify-center h-full gap-4 opacity-40">
                    <Loader2 className="animate-spin text-blue-600" size={56} />
                    <p className="text-xs font-black uppercase text-slate-400 tracking-[0.3em]">Loading records...</p>
                 </div>
               ) : attendees.length > 0 ? (
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
                   {attendees.map((item, idx) => {
                     const student = item?.students;
                     const profile = student?.profiles;
                     if (!profile) return null;

                     return (
                       <div key={idx} className="bg-white p-5 sm:p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-6 hover:border-blue-500 hover:shadow-xl transition-all duration-300 group relative overflow-hidden">
                          
                          {/* Student Avatar */}
                          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-[#003366] to-[#1e40af] rounded-[1.5rem] sm:rounded-3xl flex items-center justify-center text-xl font-black text-white uppercase shadow-lg flex-shrink-0">
                             {profile.first_name[0]}{profile.last_name[0]}
                          </div>

                          <div className="flex-1 w-full text-center sm:text-left">
                             <div className="flex flex-col sm:flex-row justify-between items-center sm:items-start mb-4 gap-2">
                                <p className="text-lg font-black text-slate-800 tracking-tight">
                                   {profile.first_name} {profile.last_name}
                                </p>
                                <span className="bg-emerald-50 text-emerald-600 text-[8px] font-black uppercase px-2 py-1 rounded-lg border border-emerald-100 whitespace-nowrap">
                                   Verified Student
                                </span>
                             </div>

                             {/* Student Detail Grid */}
                             <div className="grid grid-cols-2 gap-2 sm:gap-4">
                                <StudentInfoItem icon={<Hash size={12}/>} label="ID" val={student.student_id_number} />
                                <StudentInfoItem icon={<School size={12}/>} label="DEPT" val={student.department} />
                                <StudentInfoItem icon={<GraduationCap size={12}/>} label="BATCH" val={student.batch_year} />
                                <StudentInfoItem icon={<Mail size={12}/>} label="EMAIL" val={profile.email} />
                             </div>

                             {/* Mobile Action Buttons (One-tap contact) */}
                             <div className="mt-5 flex gap-2 sm:hidden">
                                <a href={`tel:${profile.phone_number}`} className="flex-1 py-3 bg-slate-50 text-blue-600 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase border border-slate-100">
                                   <Phone size={14}/> Call
                                </a>
                                <a href={`mailto:${profile.email}`} className="flex-1 py-3 bg-slate-50 text-[#003366] rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase border border-slate-100">
                                   <Mail size={14}/> Email
                                </a>
                             </div>

                             {/* Desktop Hover Action */}
                             <div className="hidden sm:flex absolute top-8 right-8 opacity-0 group-hover:opacity-100 transition-opacity gap-2">
                                <a href={`tel:${profile.phone_number}`} title="Call Student" className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all"><Phone size={14}/></a>
                                <a href={`mailto:${profile.email}`} title="Email Student" className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all"><Mail size={14}/></a>
                             </div>
                          </div>
                       </div>
                     )
                   })}
                 </div>
               ) : (
                 <div className="h-full flex flex-col items-center justify-center opacity-20 text-center">
                    <Users size={120} strokeWidth={1} />
                    <p className="mt-6 font-black uppercase text-xl tracking-[0.2em]">No students registered</p>
                 </div>
               )}
            </div>

            {/* Modal Footer */}
            <div className="hidden sm:flex p-6 bg-white border-t border-slate-100 justify-center">
               <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.3em]">Official Enrollment Record • Unity University</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const TabBtn = ({ active, onClick, label, count }) => (
  <button onClick={onClick} className={`whitespace-nowrap px-6 py-2.5 rounded-2xl text-[10px] md:text-[11px] font-black transition-all flex items-center gap-2 uppercase tracking-widest ${active ? 'bg-[#003366] text-white shadow-lg' : 'text-slate-400'}`}>
    {label} <span className={`bg-slate-200 text-slate-500 px-2 py-0.5 rounded-lg text-[9px] ml-1`}>{count}</span>
  </button>
);

const ModalStat = ({ label, val }) => (
  <div className="space-y-1">
    <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">{label}</p>
    <p className="text-sm sm:text-lg font-bold text-slate-700 leading-tight uppercase">{val || 'Not Set'}</p>
  </div>
);

const StudentInfoItem = ({ icon, label, val }) => (
  <div className="flex items-start gap-2 overflow-hidden bg-slate-50 p-2 rounded-xl border border-slate-100/50">
    <span className="text-blue-500 mt-0.5">{icon}</span>
    <div className="truncate">
      <p className="text-[7px] font-black text-slate-300 uppercase leading-none mb-0.5">{label}</p>
      <p className="text-[10px] font-bold text-slate-600 truncate">{val || 'N/A'}</p>
    </div>
  </div>
);

const getBarColor = (s) => {
  const st = s?.toLowerCase();
  if(st === 'approved') return 'bg-emerald-500';
  if(st === 'rejected') return 'bg-rose-500';
  if(st === 'edited') return 'bg-blue-500';
  return 'bg-amber-500';
};

const getStatusPill = (s) => {
  const st = s?.toLowerCase();
  if(st === 'approved') return 'bg-emerald-50 border-emerald-100 text-emerald-600';
  if(st === 'rejected') return 'bg-rose-50 border-rose-100 text-rose-600';
  if(st === 'edited') return 'bg-blue-50 border-blue-100 text-blue-600';
  return 'bg-amber-50 border-amber-100 text-amber-600';
};

export default MyEvents;