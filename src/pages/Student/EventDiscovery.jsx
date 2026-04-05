import React, { useState, useEffect } from 'react';
import { Search, X, User, LogOut, MapPin, Filter, Calendar, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

const EventDiscovery = () => {

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
        console.error("No authenticated user");
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

  }, []);

  // ---------------- MOCK EVENTS ----------------
  useEffect(() => {

    const mockEvents = [
      {
        id: 1,
        title: "Unity Innovation & Tech Expo",
        date: "Mar 12",
        time: "09:00 AM",
        location: "Gerji Campus Main Hall",
        description: "Showcasing student-led engineering projects.",
        category: "Academic",
        image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800",
      },
      {
        id: 2,
        title: "Great Unity Run: 5K Walk",
        date: "Apr 05",
        time: "07:00 AM",
        location: "Gerji Campus Main Hall",
        description: "Community health event with students and alumni.",
        category: "Sports & Wellness",
        image: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800",
      },
      {
        id: 3,
        title: "Ethiopian Heritage Day",
        date: "May 20",
        time: "02:00 PM",
        location: "Unity University Football Field",
        description: "Celebrating Ethiopia's cultures and traditions.",
        category: "Arts & Culture",
        image: "https://images.unsplash.com/photo-1523438097201-512ae7d59c44?w=800",
      }
    ];

    setEvents(mockEvents);
    setLoadingEvents(false);

  }, []);

  // ---------------- FILTER EVENTS ----------------
  const filteredEvents = events.filter((event) => {

    const matchesSearch =
      event.title.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      categoryFilter === 'all' || event.category === categoryFilter;

    const matchesDate =
      dateFilter === 'all' || event.date === dateFilter;

    return matchesSearch && matchesCategory && matchesDate;

  });

  // ---------------- STUDENT NAME + INITIALS ----------------
  const fullName = student
    ? `${student.profiles.first_name} ${student.profiles.last_name}`
    : '';

  const initials = student
    ? `${student.profiles.first_name[0]}${student.profiles.last_name[0]}`.toUpperCase()
    : '';

  // ---------------- LOADING SCREEN ----------------
  if (loadingStudent) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center">
          <Loader2 className="w-12 h-12 text-[#003366] animate-spin mb-4" />
          <p className="text-slate-500 font-medium animate-pulse">
            Loading student dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">

      {/* HERO */}
      <section className="relative bg-unity-blue py-12 px-6 md:px-12 lg:px-24 text-center overflow-hidden">

        <div className="absolute top-[-50%] right-[-10%] w-[600px] h-[600px] bg-unity-yellow/5 rounded-full blur-[100px]" />

        {/* NAV OVERLAY */}
        <div className="absolute top-6 right-6 flex gap-3 items-center z-10">

          <div className="flex items-center gap-2 px-3 h-10 rounded-full bg-white/10 border border-white/20 text-white">

            <User size={18} />

            <span className="font-bold text-sm tracking-wide">
              {initials}
            </span>

          </div>

          <button
            onClick={() => supabase.auth.signOut()}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 border border-white/20 text-white hover:text-unity-yellow hover:border-unity-yellow transition-all"
          >
            <LogOut size={18} />
          </button>

        </div>

        <div className="max-w-4xl mx-auto relative z-10">

          <span className="inline-block px-4 py-1 mb-4 rounded-full bg-white/10 border border-white/20 text-unity-yellow text-[10px] font-bold tracking-widest uppercase">
            Unity University Campus Core
          </span>

          <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">
            Discover Every Moment on Campus
          </h1>

          <p className="text-slate-300 text-base mb-10 max-w-2xl mx-auto leading-relaxed">
            Welcome {fullName}. Explore events happening across campus.
          </p>

          {/* SEARCH BAR */}
          <div className="relative max-w-2xl mx-auto group">

            <div className="flex items-center bg-white rounded-2xl px-6 h-14 shadow-2xl border-2 border-transparent group-focus-within:border-unity-yellow">

              <Search className="text-slate-400 mr-4" size={20} />

              <input
                type="text"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent outline-none text-base text-slate-900"
              />

              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="p-2 hover:bg-slate-100 rounded-full"
                >
                  <X size={16} />
                </button>
              )}

            </div>

          </div>

        </div>

      </section>

      {/* EVENTS SECTION */}
      <main className="max-w-8xl mx-auto px-6 md:px-12 lg:px-24 py-12">

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">

          <header>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-2 h-8 bg-unity-yellow rounded-full" />
              <h2 className="text-2xl font-bold text-slate-900">Featured Events</h2>
            </div>

            <p className="text-slate-500 ml-5">
              Browse the latest activities across all departments
            </p>
          </header>

          <div className="flex gap-4 w-full md:w-auto">

            <FilterSelect
              label="Category"
              options={['Academic','Arts & Culture','Career','Sports & Wellness']}
              value={categoryFilter}
              onChange={setCategoryFilter}
            />

            <FilterSelect
              label="Date"
              options={['Mar 12','Apr 05','May 20']}
              value={dateFilter}
              onChange={setDateFilter}
            />

          </div>

        </div>

        {loadingEvents ? (
          <div className="flex flex-col items-center py-20">
            <Loader2 className="w-10 h-10 text-[#003366] animate-spin mb-4" />
            <p className="text-slate-400 animate-pulse">Loading events...</p>
          </div>
        ) : filteredEvents.length > 0 ? (

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>

        ) : (
          <div className="text-center py-20 text-slate-400">No matching events found.</div>
        )}

      </main>
    </div>
  );
};


// FILTER COMPONENT
const FilterSelect = ({ label, options, value, onChange }) => (

  <div className="flex-1 md:w-48">

    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">
      {label}
    </label>

    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-xl px-4 py-2.5 outline-none focus:border-unity-blue cursor-pointer"
    >
      <option value="all">All {label}s</option>

      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}

    </select>

  </div>

);


// EVENT CARD
const EventCard = ({ event }) => (

  <article className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col hover:shadow-lg">

    <div className="relative h-48 overflow-hidden bg-slate-100">

      <img
        src={event.image}
        alt={event.title}
        className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
      />

      <div className="absolute top-4 right-4">

        <span className="bg-white/95 px-3 py-1 rounded-lg text-[10px] font-bold text-unity-blue uppercase border border-slate-100">
          {event.category}
        </span>

      </div>

    </div>

    <div className="p-6 flex flex-col flex-grow">

      <h3 className="text-xl font-bold text-slate-900 mb-3">
        {event.title}
      </h3>

      <div className="space-y-3 mb-6">

        <p className="text-sm font-bold text-unity-blue flex items-center gap-2">
          <Calendar size={14} /> {event.date} • {event.time}
        </p>

        <div className="flex items-start gap-2 text-slate-400">
          <MapPin size={16} className="text-unity-yellow" />
          <span className="text-sm text-slate-600">{event.location}</span>
        </div>

        <p className="text-sm text-slate-500 line-clamp-2">
          {event.description}
        </p>

      </div>

      <button className="mt-auto w-full bg-unity-blue hover:bg-unity-navy text-white py-3 rounded-xl font-bold text-sm">
        View Details
      </button>

    </div>

  </article>

);

export default EventDiscovery;