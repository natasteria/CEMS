import React, { useState, useEffect } from 'react';
import { Search, X, LogOut, MapPin, Calendar, Loader2, ArrowUpRight,User } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';

const EventDiscovery = () => {
  const navigate = useNavigate();
  // Add these two lines at the top of your component function
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [myRegs, setMyRegs] = useState([]); // This tracks which events YOU have joined

  // ---------------- STUDENT STATE ----------------
  const [student, setStudent] = useState(null);
  const [loadingStudent, setLoadingStudent] = useState(true);

  // ---------------- EVENT STATE ----------------
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  // ---------------- FILTER STATE ----------------
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  // ---------------- FETCH STUDENT ----------------
  useEffect(() => {
    const fetchStudentData = async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error(userError);
        return;
      }
      if (!user) {
        navigate('/');
        return;
      }

      const { data, error } = await supabase
        .from('students')
        .select(`
          student_id_number,
          department,
          account_status,
          profiles (
            first_name,
            last_name,
            email
          )
        `)
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error(error.message);
      } else {
        setStudent(data);
      }
      setLoadingStudent(false);
    };
    fetchStudentData();
  }, [navigate]);

  // ---------------- FETCH EVENTS ----------------
  useEffect(() => {
    const fetchEvents = async () => {
      setLoadingEvents(true);
      const { data, error } = await supabase
        .from('events')
        .select(`
          id,
          title,
          description,
          start_datetime,
          venue,
          categories,
          image_url
        `)
        .eq('status', 'approved')
        .is('deleted_at', null)
        .order('start_datetime', { ascending: true });

      if (error) {
        console.error(error.message);
        setLoadingEvents(false);
        return;
      }

      const formattedEvents = data.map((event) => {
      const dateObj = new Date(event.start_datetime);

      const handleRegister = async (event) => {
        setIsRegistering(true);
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return alert("Please login to register.");
      
          // 1. Check Deadline
          if (event.registration_deadline && new Date() > new Date(event.registration_deadline)) {
            return alert("Registration closed: The deadline has passed.");
          }
      
          // 2. Check Capacity
          if (event.capacity !== null) {
            const { count } = await supabase
              .from('registrations')
              .select('*', { count: 'exact', head: true })
              .eq('event_id', event.id);
      
            if (count >= event.capacity) {
              return alert("Event Full: No more seats available.");
            }
          }
      
          // 3. Insert Registration
          const { error } = await supabase
            .from('registrations')
            .insert([{ 
              event_id: event.id, 
              student_id: user.id, 
              registration_status: 'registered' 
            }]);
      
          if (error) throw error;
          alert("Successfully registered!");
          setSelectedEvent(null);
        } catch (err) {
          alert(err.message.includes('unique') ? "You are already registered!" : "Registration failed.");
        } finally {
          setIsRegistering(false);
        }
      };
        
        return {
          id: event.id,
          title: event.title,
          rawDate: dateObj, 
          date: dateObj.toLocaleDateString('en-US', {
            month: 'short',
            day: '2-digit'
          }),
          time: dateObj.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          }),
          location: event.venue,
          description: event.description || '',
          categories: event.categories && event.categories.length > 0 
            ? event.categories 
            : ['General'],
          image: event.image_url || 'https://via.placeholder.com/800'
        };
      });

      setEvents(formattedEvents);
      setLoadingEvents(false);
    };
    fetchEvents();
  }, []);

  const handleRegister = async (event) => {
    setIsRegistering(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return alert("Please login to register.");
  
      // 1. Check Deadline
      if (event.registration_deadline && new Date() > new Date(event.registration_deadline)) {
        return alert("Registration closed: The deadline has passed.");
      }
  
      // 2. Check Capacity
      if (event.capacity !== null) {
        const { count } = await supabase
          .from('registrations')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', event.id);
  
        if (count >= event.capacity) {
          return alert("Event Full: No more seats available.");
        }
      }
  
      // 3. Insert Registration
      const { error } = await supabase
        .from('registrations')
        .insert([{ 
          event_id: event.id, 
          student_id: user.id, 
          registration_status: 'registered' 
        }]);
  
      if (error) throw error;
      
      // Update the local state so the button changes to "Registered" immediately
      setMyRegs(prev => [...prev, event.id]);
      alert("Successfully registered!");
    } catch (err) {
      alert(err.message.includes('unique') ? "You are already registered!" : "Registration failed.");
    } finally {
      setIsRegistering(false);
    }
  };

  // ---------------- HANDLERS ----------------
  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      navigate('/'); 
    } else {
      console.error("Error signing out:", error.message);
    }
  };

  // ---------------- FILTER LOGIC ----------------
  // This derived state updates automatically whenever events, searchQuery, 
  // categoryFilter, or dateFilter changes.
  const filteredEvents = events.filter((event) => {
    // Feature 1 & 2: Search by Title/Description + .trim() for robustness
    const normalizedQuery = searchQuery.toLowerCase().trim();
    const matchesSearch = 
      event.title.toLowerCase().includes(normalizedQuery) || 
      event.description.toLowerCase().includes(normalizedQuery);

    // Feature 3: Category Filter
    const matchesCategory = categoryFilter === 'all' || event.categories.includes(categoryFilter);

    // Feature 3: Date Timeline Logic
    let matchesDate = true;
    if (dateFilter !== 'all') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const eventDate = new Date(event.rawDate);
      eventDate.setHours(0, 0, 0, 0);

      if (dateFilter === 'Today') {
        matchesDate = eventDate.getTime() === today.getTime();
      } else if (dateFilter === 'This Week') {
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);
        matchesDate = eventDate >= today && eventDate <= nextWeek;
      } else if (dateFilter === 'This Month') {
        matchesDate = eventDate.getMonth() === today.getMonth() && 
                      eventDate.getFullYear() === today.getFullYear();
      }
    }

    return matchesSearch && matchesCategory && matchesDate;
  });

  const fullName = student ? `${student.profiles.first_name} ${student.profiles.last_name}` : '';
  const initials = student ? `${student.profiles.first_name[0]}${student.profiles.last_name[0]}`.toUpperCase() : '';
  if (loadingStudent) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center">
          <Loader2 className="w-12 h-12 text-unity-blue animate-spin mb-4" />
          <p className="text-slate-500 font-medium animate-pulse">Loading student dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <header className="bg-white border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-unity-blue text-white grid place-items-center shadow-sm">
                <Calendar size={18} />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Unity University</p>
                <p className="text-sm font-semibold text-unity-navy">Event Discovery</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-slate-100 border border-slate-200">
                <div className="w-7 h-7 rounded-full bg-unity-blue text-white grid place-items-center text-[11px] font-bold">
                  {initials}
                </div>
                <div className="leading-tight pr-1">
                  <p className="text-xs font-semibold text-slate-700 max-w-36 truncate">{fullName || 'Student'}</p>
                  <p className="text-[10px] text-slate-400">Student</p>
                </div>
              </div>
              <Link
                to="/Dashboard"
                className="h-9 w-9 rounded-full border border-slate-200 text-slate-500 grid place-items-center hover:text-unity-blue hover:border-unity-yellow transition-colors"
                title="View Profile"
              >
                <User size={16} />
              </Link>             

              <button
                onClick={handleSignOut}
                className="h-9 w-9 rounded-full border border-slate-200 text-slate-500 grid place-items-center hover:text-unity-blue hover:border-unity-yellow transition-colors"
                title="Sign out"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-[1.6fr_0.8fr_0.8fr_auto] gap-3">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-10 text-sm text-slate-900 outline-none focus:border-unity-yellow focus:ring-2 focus:ring-unity-yellow/30"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg text-slate-500 hover:bg-slate-100"
                  aria-label="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <FilterSelect
              label="Category"
              options={[
                'Workshop', 'Seminar', 'Guest Lecture', 'Career Fair',
                'Hackathon', 'Research Symposium', 'Club Meeting',
                'Social Gathering', 'Movie Night', 'Sports & Fitness',
                'Volunteer/Service', 'Competition', 'Networking'
              ]}
              value={categoryFilter}
              onChange={setCategoryFilter}
            />
            <FilterSelect
              label="Timeline"
              options={['Today', 'This Week', 'This Month']}
              value={dateFilter}
              onChange={setDateFilter}
            />
            <button
              type="button"
              onClick={() => { setSearchQuery(''); setCategoryFilter('all'); setDateFilter('all'); }}
              className="h-11 rounded-xl bg-unity-yellow px-4 text-sm font-semibold text-unity-navy hover:brightness-95 transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-widest font-bold text-unity-blue/70">Curated events</p>
            <h2 className="text-2xl font-bold text-unity-navy">Featured picks for you</h2>
          </div>
          <p className="text-sm text-slate-500">{loadingEvents ? 'Loading events...' : `${filteredEvents.length} events found`}</p>
        </div>

        {loadingEvents ? (
          <div className="flex flex-col items-center py-20">
            <Loader2 className="w-10 h-10 text-unity-blue animate-spin mb-4" />
            <p className="text-slate-400 animate-pulse">Loading events...</p>
          </div>
        ) : filteredEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <EventCard key={event.id} event={event} onViewDetails={() => setSelectedEvent(event)}/>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 rounded-2xl border border-dashed border-slate-300 bg-white">
            <p className="text-slate-500 text-lg">No matching events found.</p>
            <button
              onClick={() => { setSearchQuery(''); setCategoryFilter('all'); setDateFilter('all'); }}
              className="mt-4 text-unity-blue font-semibold hover:underline"
            >
              Clear all filters
            </button>
          </div>
        )}
{selectedEvent && (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-100">
      <div className="p-8">
        {/* Header & Categories */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex flex-wrap gap-2">
            {selectedEvent.categories?.length > 0 ? (
              selectedEvent.categories.map((cat, i) => (
                <span key={i} className="bg-blue-50 text-[#1d3a8a] text-[9px] font-black px-2 py-1 rounded uppercase tracking-widest">{cat}</span>
              ))
            ) : (
              <span className="bg-slate-50 text-slate-400 text-[9px] font-black px-2 py-1 rounded uppercase tracking-widest">General</span>
            )}
          </div>
          <button onClick={() => setSelectedEvent(null)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>

        {/* Title & Organizer */}
        <div className="mb-6">
          <h2 className="text-2xl font-black text-slate-900 leading-tight mb-1">{selectedEvent.title || "Untitled Event"}</h2>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tighter">
            Organized by: <span className="text-slate-600">{selectedEvent.organizer || "Campus Core Admin"}</span>
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8 border-y border-slate-50 py-6 text-[12px]">
  <div className="space-y-4">
    {/* Schedule Section */}
    <div>
      <p className="font-black text-slate-400 uppercase text-[9px] mb-1 tracking-widest">Schedule</p>
      <p className="font-bold text-slate-700">
        {(() => {
          // Grabs the raw date string from the database
          const raw = selectedEvent.date || selectedEvent.start_datetime;
          if (!raw) return "Date TBD";
          
          // Takes the first 10 characters to ensure the year (2026) is included
          // Example: "2026-04-20"
          return raw.includes('T') ? raw.split('T')[0] : raw.slice(0, 10);
        })()}
      </p>
      <p className="text-slate-500 text-[10px]">
        {(() => {
          const start = selectedEvent.time || selectedEvent.start_datetime;
          const end = selectedEvent.end_datetime;
          if (!start) return "Time TBD";

          // Manual string slice for HH:MM format
          const startTime = start.includes('T') ? start.split('T')[1].slice(0, 5) : start.slice(0, 5);
          const endTime = end && end.includes('T') ? ` - ${end.split('T')[1].slice(0, 5)}` : "";
          
          return `${startTime}${endTime}`;
        })()}
      </p>
    </div>

    {/* Location Section */}
    <div>
      <p className="font-black text-slate-400 uppercase text-[9px] mb-1 tracking-widest">Location</p>
      <p className="font-bold text-slate-700 flex items-center gap-1">
        <MapPin size={12} className="text-[#facc15]" /> 
        {selectedEvent.venue || selectedEvent.location || "Venue TBD"}
      </p>
    </div>
  </div>

  {/* Right Column: Capacity & Deadline */}
  <div className="space-y-4 border-l border-slate-50 pl-4">
    <div>
      <p className="font-black text-slate-400 uppercase text-[9px] mb-1 tracking-widest">Capacity</p>
      <p className="font-bold text-slate-700">{selectedEvent.capacity || "Unlimited"}</p>
    </div>
    <div>
      <p className="font-black text-slate-400 uppercase text-[9px] mb-1 tracking-widest">Reg. Deadline</p>
      <p className="font-bold text-red-500">
        {selectedEvent.registration_deadline 
          ? selectedEvent.registration_deadline.split('T')[0] 
          : "No Deadline"}
      </p>
    </div>
  </div>
</div>
        {/* Description */}
        <div className="mb-10">
          <p className="text-[9px] font-black text-slate-400 uppercase mb-2 tracking-widest">About the Event</p>
          <p className="text-slate-500 text-sm leading-relaxed max-h-32 overflow-y-auto scrollbar-hide">
            {selectedEvent.description || "No description provided for this event."}
          </p>
        </div>

        {/* Registration Button Logic */}
        {myRegs.includes(selectedEvent.id) ? (
          <div className="w-full py-4 bg-emerald-50 text-emerald-600 font-black uppercase tracking-[0.2em] rounded-xl flex items-center justify-center gap-2 border border-emerald-100">
             Registered
          </div>
        ) : (
          <button
            disabled={isRegistering}
            onClick={() => handleRegister(selectedEvent)}
            className="w-full py-4 bg-[#1d3a8a] text-[#facc15] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-blue-900 transition-all disabled:opacity-50"
          >
            {isRegistering ? "Verifying..." : "Confirm Registration"}
          </button>
        )}
      </div>
    </div>
  </div>
)}
      </main>
    </div>
  );
};

const FilterSelect = ({ label, options, value, onChange }) => (
  <div>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-700 outline-none focus:border-unity-yellow focus:ring-2 focus:ring-unity-yellow/30 cursor-pointer"
      aria-label={label}
    >
      <option value="all">All {label}s</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
  </div>
);

const EventCard = ({ event, onViewDetails }) => (
  <article className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-unity-blue/10">
    <div className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-unity-yellow/20 blur-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
    <div className="relative h-48 overflow-hidden bg-slate-100">
      <img
        src={event.image}
        alt={event.title}
        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-linear-to-t from-unity-navy/70 via-unity-navy/20 to-transparent" />
      <div className="absolute left-3 top-3 flex flex-wrap gap-2 pr-3">
        {event.categories.slice(0, 2).map((cat, index) => (
          <span key={index} className="rounded-full border border-white/30 bg-white/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur">
            {cat}
          </span>
        ))}
      </div>
      <div className="absolute top-3 right-3 rounded-full border border-unity-yellow/30 bg-unity-yellow px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-unity-navy shadow-sm">
        Featured
      </div>
    </div>

    <div className="p-5 flex min-h-[210px] flex-col">
      <h3 className="text-xl font-bold leading-tight text-unity-navy mb-3 line-clamp-2">{event.title}</h3>
      <div className="space-y-3 mb-5">
        <p className="inline-flex items-center gap-2 rounded-lg bg-unity-blue/5 px-2.5 py-1.5 text-xs font-semibold text-unity-blue">
          <Calendar size={14} /> {event.date} • {event.time}
        </p>
        <p className="flex items-start gap-2 text-sm text-slate-600">
          <MapPin size={15} className="mt-0.5 text-unity-yellow shrink-0" />
          <span className="line-clamp-1">{event.location}</span>
        </p>
        <p className="text-sm leading-relaxed text-slate-500 line-clamp-2">{event.description}</p>
      </div>

      <button onClick={onViewDetails}
      className="mt-auto inline-flex w-full items-center justify-center gap-2 rounded-xl bg-unity-yellow py-2.5 text-sm font-bold text-unity-navy transition-all hover:brightness-95">
        View Details
        <ArrowUpRight size={14} />
      </button>



    </div>
  </article>
);

export default EventDiscovery;