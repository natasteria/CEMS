import React, { useState, useEffect, useRef } from 'react';
import { Search, X, LogOut, MapPin, Calendar, Loader2, User, ChevronDown, Trophy, Clock, Users, ArrowLeft, CalendarDays } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useNotification } from '../../context/NotificationContext';

const EventDiscovery = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const searchInputRef = useRef(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [myRegs, setMyRegs] = useState([]);

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

  const handleLogoutRequest = () => {
    showNotification(
      'Are you sure you want to log out?',
      'warning',
      'confirm',
      {
        onConfirm: async () => {
          const { error } = await supabase.auth.signOut();
          if (error) {
            showNotification(error.message || 'Logout failed. Please try again.', 'error');
            return;
          }
          navigate('/');
        }
      }
    );
  };

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

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
      const { data: { user } } = await supabase.auth.getUser();

      // 1. Fetch my registrations
      if (user) {
        const { data: regs } = await supabase
          .from('registrations')
          .select('event_id')
          .eq('student_id', user.id);
        setMyRegs(regs?.map(r => r.event_id) || []);
      }

      // 2. Fetch events with registration counts
      const { data, error } = await supabase
        .from('events')
        .select(`
        *,
        registrations(count)
      `)
        .eq('status', 'approved')
        .is('deleted_at', null)
        .gt('start_datetime', new Date().toISOString())
        .or(`registration_deadline.is.null,registration_deadline.gt.${new Date().toISOString()}`)
        .order('start_datetime', { ascending: true });

      if (error) {
        console.error(error.message);
        setLoadingEvents(false);
        return;
      }

      const formattedEvents = data.map((event) => {
        const dateObj = new Date(event.start_datetime);
        const endDateObj = event.end_datetime ? new Date(event.end_datetime) : null;
        const regCount = event.registrations?.[0]?.count || 0;

        return {
          id: event.id,
          title: event.title,
          rawDate: dateObj,
          start_datetime: event.start_datetime,
          end_datetime: event.end_datetime,
          date: dateObj.toLocaleDateString('en-US', {
            month: 'short',
            day: '2-digit'
          }),
          time: dateObj.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          }),
          endDate: endDateObj
            ? endDateObj.toLocaleDateString('en-US', { month: 'short', day: '2-digit' })
            : null,
          endTime: endDateObj
            ? endDateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : null,
          location: event.venue,
          description: event.description || '',
          categories: event.categories && event.categories.length > 0
            ? event.categories
            : ['General'],
          image: event.image_url || 'https://via.placeholder.com/800',
          registration_deadline: event.registration_deadline,
          capacity: event.capacity,
          regCount
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
      if (!user) {
        showNotification('Please log in to register.', 'error');
        return;
      }

      if (event.registration_deadline && new Date() > new Date(event.registration_deadline)) {
        showNotification('Registration closed: The deadline has passed.', 'error');
        return;
      }

      if (event.capacity !== null && event.capacity !== undefined) {
        const { count } = await supabase
          .from('registrations')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', event.id);

        if (count >= event.capacity) {
          showNotification('Event full: No more seats available.', 'error');
          return;
        }
      }

      const { error } = await supabase
        .from('registrations')
        .insert([{
          event_id: event.id,
          student_id: user.id,
          registration_status: 'registered'
        }]);

      if (error) throw error;

      setMyRegs(prev => [...prev, event.id]);
      setSelectedEvent(null);
      showNotification('Successfully registered!', 'success');

      // Update local events list count
      setEvents(prev => prev.map(e => e.id === event.id ? { ...e, regCount: e.regCount + 1 } : e));
    } catch (err) {
      showNotification(
        err.message?.includes('unique') ? 'You are already registered!' : 'Registration failed.',
        'error'
      );
    } finally {
      setIsRegistering(false);
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

  const formatEventDateLong = (dateTimeStr) => {
    if (!dateTimeStr) return 'Date TBD';
    const dateObj = new Date(dateTimeStr);
    if (Number.isNaN(dateObj.getTime())) return 'Date TBD';
    return dateObj.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatEventTime = (dateTimeStr) => {
    if (!dateTimeStr) return 'Time TBD';
    const dateObj = new Date(dateTimeStr);
    if (Number.isNaN(dateObj.getTime())) return 'Time TBD';
    return dateObj.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const getDurationDetails = (startStr, endStr) => {
    if (!startStr || !endStr) return { primary: 'Duration TBD', secondary: '' };
    const start = new Date(startStr);
    const end = new Date(endStr);
    const diffMs = end - start;
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || diffMs <= 0) {
      return { primary: 'Duration TBD', secondary: '' };
    }

    const totalMinutes = Math.floor(diffMs / 60000);
    const totalHours = Math.floor(totalMinutes / 60);
    const days = Math.floor(totalHours / 24);
    const remainingHours = totalHours % 24;

    let primary = '';
    if (days > 0) {
      primary = `${days} day${days > 1 ? 's' : ''}`;
      if (remainingHours > 0) {
        primary += ` ${remainingHours} hr${remainingHours > 1 ? 's' : ''}`;
      }
    } else {
      primary = `${totalHours} hr${totalHours > 1 ? 's' : ''}`;
      const remainingMins = totalMinutes % 60;
      if (remainingMins > 0) {
        primary += ` ${remainingMins} min${remainingMins > 1 ? 's' : ''}`;
      }
    }

    const secondary = `${totalHours} hour${totalHours !== 1 ? 's' : ''} total`;
    return { primary, secondary };
  };

  const getVenueDetails = (venueStr) => {
    if (!venueStr) return { primary: 'Main Campus Hall', secondary: '' };
    const parts = venueStr.split(',');
    const primary = parts[0]?.trim() || 'Main Campus Hall';
    const secondary = parts.slice(1).join(',')?.trim() || '';
    return { primary, secondary };
  };

  if (loadingStudent) {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-white p-4 font-sans text-slate-900">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(148, 163, 184, 0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(148, 163, 184, 0.1) 1px, transparent 1px)',
            backgroundSize: '32px 32px'
          }}
        />
        <div className="relative flex flex-col items-center">
          <Loader2 className="mb-4 h-12 w-12 animate-spin text-unity-yellow" />
          <p className="font-medium text-slate-300 animate-pulse">Loading Event Discovery...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-white font-sans text-slate-900">

      {/* FULL PAGE GRID */}
      {/* <div
      className="pointer-events-none absolute inset-0"
      style={{
        backgroundImage:
          'linear-gradient(to right, rgba(19, 42, 92, 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(19, 42, 92, 0.05) 1px, transparent 1px)',
        backgroundSize: '40px 40px'
      }}
    /> */}

      <div className="relative z-10">
        <header className="bg-[#233f9c] border-b border-white/10 px-4 pb-8 pt-6 sm:px-8 lg:px-12">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.15]"
            style={{
              backgroundImage:
                'linear-gradient(to right, rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.15) 1px, transparent 1px)',
              backgroundSize: '36px 36px'
            }}
          />
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="relative shrink-0">
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-unity-yellow text-unity-navy shadow-lg sm:h-12 sm:w-12">
                    <Calendar className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2.25} />
                  </div>
                  <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-[#0f1f52]" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-200/90">Unity University</p>
                  <h1 className="mt-0.5 text-2xl font-black tracking-tight text-white sm:text-3xl">Event Discovery</h1>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 py-1.5 pl-1.5 pr-2.5 backdrop-blur-md sm:flex">
                  <div className="relative">
                    <div className="grid h-8 w-8 place-items-center rounded-full bg-unity-yellow text-[11px] font-black text-unity-navy">
                      {initials}
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-[#0f1f52]" />
                  </div>
                  <div className="leading-tight">
                    <p className="flex max-w-40 items-center gap-1 text-xs font-semibold text-white">
                      <span className="truncate">{fullName || 'Student'}</span>
                      <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    </p>
                    <p className="text-[10px] text-slate-400">Student</p>
                  </div>
                </div>
                <Link
                  to="/Dashboard"
                  className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/5 text-slate-300 backdrop-blur-md transition hover:border-unity-yellow/50 hover:text-white"
                  title="View profile"
                >
                  <User size={17} />
                </Link>
                <button
                  type="button"
                  onClick={handleLogoutRequest}
                  className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/5 text-slate-300 backdrop-blur-md transition hover:border-red-400/40 hover:text-red-300"
                  title="Sign out"
                >
                  <LogOut size={17} />
                </button>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)_minmax(0,1fr)]">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search events, speakers, venues..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-12 w-full rounded-full border border-white/10 bg-[#0f2550]/80 py-2 pl-11 pr-12 text-sm text-white placeholder:text-slate-400 outline-none backdrop-blur-md transition focus:border-unity-yellow/60 focus:ring-2 focus:ring-unity-yellow/25 sm:pr-20"
                />
                {!searchQuery && (
                  <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-md border border-white/15 bg-white/5 px-1.5 py-0.5 text-[10px] font-medium text-slate-400 sm:inline">
                    ⌘K
                  </kbd>
                )}
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
                    aria-label="Clear search"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <FilterSelect
                allLabel="All Categories"
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
                allLabel="All Timelines"
                options={['Today', 'This Week', 'This Month']}
                value={dateFilter}
                onChange={setDateFilter}
              />
            </div>
          </div>
        </header>

        <main className="relative mx-auto max-w-7xl px-4 pb-12 pt-6 sm:px-8 lg:px-12">

          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-600">
                Curated events
              </p>
              <h2 className="text-2xl font-bold text-slate-900">
                Featured picks for you
              </h2>
            </div>
            <p className="text-sm text-slate-500">
              {loadingEvents ? 'Loading events...' : `${filteredEvents.length} events found`}
            </p>
          </div>

          {loadingEvents ? (
            <div className="flex flex-col items-center py-20">
              <Loader2 className="mb-4 h-10 w-10 animate-spin text-unity-yellow" />
              <p className="animate-pulse text-slate-500">Loading events...</p>
            </div>
          ) : filteredEvents.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filteredEvents.map((event) => (
                <EventCard key={event.id} event={event} onViewDetails={() => setSelectedEvent(event)} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-20 text-center">
              <p className="text-lg text-slate-600">No matching events found.</p>
              <button
                type="button"
                onClick={() => { setSearchQuery(''); setCategoryFilter('all'); setDateFilter('all'); }}
                className="mt-4 text-sm font-semibold text-unity-yellow hover:underline"
              >
                Clear all filters
              </button>
            </div>
          )}

        </main>
        {selectedEvent && (
          <div className="fixed inset-0 z-50 flex flex-col lg:flex-row bg-[#060b13] overflow-hidden">

            {/* Background Image with Gradient Overlay */}
            <div className="absolute inset-0 z-0 pointer-events-none">
              <img
                src={selectedEvent.image}
                alt=""
                className="h-full w-full object-cover filter blur-xs scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#060b13]/95 via-[#060b13]/60 to-[#060b13]/40 lg:bg-gradient-to-r lg:from-[#060b13]/85 lg:via-[#060b13]/55 lg:to-[#060b13]/65 backdrop-blur-[2px]" />
            </div>

            {/* Absolute Position Controls Header */}
            <div className="absolute top-6 left-6 right-6 z-20 flex items-center justify-between pointer-events-none">
              <button
                onClick={() => setSelectedEvent(null)}
                className="pointer-events-auto flex items-center gap-2 rounded-full bg-black/45 border border-white/10 px-4 py-2 text-xs font-semibold text-white tracking-wide transition hover:bg-black/60 hover:border-white/20 active:scale-[0.97]"
              >
                <ArrowLeft size={14} className="text-white" /> Back to events
              </button>
              <button
                onClick={() => setSelectedEvent(null)}
                className="pointer-events-auto rounded-full bg-black/45 border border-white/10 p-2 text-white transition hover:bg-black/60 hover:border-white/20 active:scale-[0.97]"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Left Content Column */}
            <div className="relative z-10 flex-1 flex flex-col justify-start gap-8 text-white p-6 sm:p-8 lg:p-16 pt-24 lg:pt-28 max-w-4xl">
              <div>
                {/* Badges */}
                <div className="flex flex-wrap gap-2 items-center mb-5">
                  {(selectedEvent.categories?.length ? selectedEvent.categories : ['General']).slice(0, 3).map((cat, i) => (
                    <span
                      key={i}
                      className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-200 backdrop-blur-sm"
                    >
                      {cat}
                    </span>
                  ))}
                  <span className="rounded-full bg-unity-yellow px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-unity-navy flex items-center gap-1.5 shadow-md">
                    <Trophy size={11} className="fill-unity-navy stroke-unity-navy" /> Featured
                  </span>
                </div>

                {/* Event Title */}
                <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] text-white">
                  {selectedEvent.title || 'Untitled Event'}
                </h2>

                {/* Organized By */}
                <p className="flex items-center gap-2 text-xs sm:text-sm text-slate-300 font-medium mt-4 mb-6">
                  <MapPin size={16} className="text-emerald-400 shrink-0" />
                  <span>Organized by <strong className="text-white">{selectedEvent.organizer || 'Unity University'}</strong></span>
                </p>

                {/* Event Description (Directly under the title) */}
                <p className="text-base text-slate-200 leading-relaxed whitespace-pre-line max-w-3xl">
                  {selectedEvent.description || 'No description provided for this event.'}
                </p>
              </div>
            </div>

            {/* Right Sidebar Column */}
            <div className="relative z-10 w-full lg:w-[420px] p-6 sm:p-8 lg:p-12 lg:pl-0 shrink-0 flex flex-col justify-center">
              <div className="w-full rounded-3xl border border-white/10 bg-[#070e1e]/90 backdrop-blur-md p-6 sm:p-8 flex flex-col gap-6 shadow-2xl relative overflow-hidden">
                <div className="flex flex-col gap-5">
                  {/* STARTS */}
                  <div className="flex items-start gap-4 border-b border-white/5 pb-4 last:border-none last:pb-0">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/5 border border-white/10 text-unity-yellow">
                      <CalendarDays size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[#facc15] mb-0.5">Starts</p>
                      <p className="text-sm font-semibold text-white">{formatEventDateLong(selectedEvent.start_datetime)}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{formatEventTime(selectedEvent.start_datetime)}</p>
                    </div>
                  </div>

                  {/* ENDS */}
                  <div className="flex items-start gap-4 border-b border-white/5 pb-4 last:border-none last:pb-0">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/5 border border-white/10 text-unity-yellow">
                      <CalendarDays size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[#facc15] mb-0.5">Ends</p>
                      <p className="text-sm font-semibold text-white">{formatEventDateLong(selectedEvent.end_datetime)}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{formatEventTime(selectedEvent.end_datetime)}</p>
                    </div>
                  </div>

                  {/* DURATION */}
                  {(() => {
                    const dur = getDurationDetails(selectedEvent.start_datetime, selectedEvent.end_datetime);
                    return (
                      <div className="flex items-start gap-4 border-b border-white/5 pb-4 last:border-none last:pb-0">
                        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/5 border border-white/10 text-unity-yellow">
                          <Clock size={18} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-[#facc15] mb-0.5">Duration</p>
                          <p className="text-sm font-semibold text-white">{dur.primary}</p>
                          {dur.secondary && <p className="text-[11px] text-slate-400 mt-0.5">{dur.secondary}</p>}
                        </div>
                      </div>
                    );
                  })()}

                  {/* VENUE */}
                  {(() => {
                    const venueInfo = getVenueDetails(selectedEvent.venue || selectedEvent.location);
                    return (
                      <div className="flex items-start gap-4 border-b border-white/5 pb-4 last:border-none last:pb-0">
                        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/5 border border-white/10 text-unity-yellow">
                          <MapPin size={18} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-[#facc15] mb-0.5">Venue</p>
                          <p className="text-sm font-semibold text-white break-words">{venueInfo.primary}</p>
                          {venueInfo.secondary && <p className="text-[11px] text-slate-400 mt-0.5 break-words">{venueInfo.secondary}</p>}
                        </div>
                      </div>
                    );
                  })()}

                  {/* CAPACITY */}
                  <div className="flex items-start gap-4 border-b border-white/5 pb-4 last:border-none last:pb-0">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/5 border border-white/10 text-unity-yellow">
                      <Users size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[#facc15] mb-0.5">Capacity</p>
                      {selectedEvent.capacity != null && selectedEvent.capacity !== '' ? (
                        <>
                          <p className="text-sm font-semibold text-white">
                            {Math.max(0, selectedEvent.capacity - (selectedEvent.regCount || 0))} spots left
                          </p>
                          <div className="mt-2 flex items-center justify-between gap-4">
                            <div className="h-1.5 flex-1 rounded-full bg-white/10 overflow-hidden">
                              <div
                                className="h-full bg-unity-yellow rounded-full transition-all duration-500"
                                style={{
                                  width: `${Math.min(100, Math.max(0, ((selectedEvent.regCount || 0) / selectedEvent.capacity) * 100))}%`
                                }}
                              />
                            </div>
                            <span className="text-[11px] font-bold text-slate-400 shrink-0">
                              {selectedEvent.regCount || 0}/{selectedEvent.capacity}
                            </span>
                          </div>
                        </>
                      ) : (
                        <>
                          <p className="text-sm font-semibold text-white">Unlimited spots available</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">{selectedEvent.regCount || 0} registered</p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* REGISTRATION DEADLINE */}
                  <div className="flex items-start gap-4 border-b border-white/5 pb-4 last:border-none last:pb-0">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/5 border border-white/10 text-unity-yellow">
                      <CalendarDays size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[#facc15] mb-0.5">Registration Deadline</p>
                      <p className="text-sm font-semibold text-white">
                        {formatEventDateLong(selectedEvent.registration_deadline)}
                      </p>
                      {selectedEvent.registration_deadline && (
                        <p className="text-[11px] text-slate-400 mt-0.5">{formatEventTime(selectedEvent.registration_deadline)}</p>
                      )}
                    </div>
                  </div>
                </div>

                {myRegs.includes(selectedEvent.id) ? (
                  <div className="mt-4">
                    <div className="w-full rounded-xl border border-emerald-500/30 bg-emerald-500/10 py-3.5 text-center text-xs font-black uppercase tracking-[0.2em] text-emerald-300">
                      Registered
                    </div>
                    <p className="text-center text-[10px] text-slate-500 mt-2">
                      You are signed up for this event
                    </p>
                  </div>
                ) : (
                  <div className="mt-4">
                    <button
                      disabled={isRegistering}
                      onClick={() => handleRegister(selectedEvent)}
                      className="w-full rounded-xl bg-unity-yellow hover:bg-[#eab308] text-unity-navy py-3.5 text-xs font-black uppercase tracking-[0.2em] transition duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none shadow-lg shadow-unity-yellow/10 cursor-pointer"
                    >
                      {isRegistering ? 'Verifying...' : 'Register for this event'}
                    </button>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

const InfoRow = ({ label, value }) => (
  <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-2 last:border-none last:pb-0">
    <p className="text-[10px] font-black uppercase tracking-widest text-unity-yellow">{label}</p>
    <p className="text-right text-xs font-semibold text-white/90">{value}</p>
  </div>
);

const FilterSelect = ({ allLabel, options, value, onChange }) => (
  <div className="relative">
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-12 w-full cursor-pointer appearance-none rounded-full border border-white/10 bg-[#0f2550]/80 py-2 pl-4 pr-10 text-sm font-medium text-white outline-none backdrop-blur-md transition focus:border-unity-yellow/60 focus:ring-2 focus:ring-unity-yellow/25"
      aria-label={allLabel}
    >
      <option value="all">{allLabel}</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
    <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
  </div>
);

const EventCard = ({ event, onViewDetails }) => (
  <article
    role="button"
    tabIndex={0}
    onClick={onViewDetails}
    onKeyDown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onViewDetails();
      }
    }}
    className="group relative h-[400px] cursor-pointer overflow-hidden rounded-2xl border border-white/10 shadow-lg shadow-black/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-unity-blue/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-unity-yellow/70"
  >
    <img
      src={event.image}
      alt={event.title}
      className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
    />
    <div className="absolute inset-0 bg-linear-to-t from-black/95 via-black/55 to-black/15" />

    <div className="absolute right-3 top-3 rounded-full bg-black/45 px-3 py-1 text-[10px] font-semibold text-white/90 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:opacity-100 translate-y-1">
      Click to view details
    </div>

    <div className="absolute inset-x-0 bottom-0 p-4 text-white sm:p-5">
      <h3 className="line-clamp-2 text-2xl font-black leading-tight">{event.title}</h3>
      <p className="mt-2 text-[12px] text-white/90">
        <span className="inline-flex items-center gap-1.5">
          <Calendar size={13} className="text-unity-yellow" />
          {event.date} {event.time}
          {event.endDate && event.endTime ? `, ${event.endDate} ${event.endTime}` : ''}
        </span>
      </p>
      <p className="mt-1 inline-flex min-w-0 items-center gap-1.5 text-[12px] text-white/85">
        <MapPin size={13} className="shrink-0 text-unity-yellow" />
        <span className="truncate">{event.location}</span>
      </p>
      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-white/80">
        {event.description || 'No description provided.'}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {event.categories.slice(0, 3).map((cat, index) => (
          <span
            key={index}
            className="rounded-md bg-unity-yellow px-2.5 py-1 text-[9px] font-black uppercase tracking-wide text-unity-navy"
          >
            {cat}
          </span>
        ))}
      </div>
    </div>
  </article>
);


export default EventDiscovery;