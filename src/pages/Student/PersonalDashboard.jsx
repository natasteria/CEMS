import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  LogOut,
  CalendarDays,
  MapPin,
  ArrowLeft,
  Loader2,
  Clock,
  CheckCircle2,
  History,
  X,
  Trophy,
  Users
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useNotification } from '../../context/NotificationContext';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [student, setStudent] = useState(null);
  const [activeRegs, setActiveRegs] = useState([]);
  const [pastRegs, setPastRegs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedReg, setSelectedReg] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return navigate('/');

      try {
        setLoading(true);
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
              id, title, venue, start_datetime, end_datetime, categories, image_url, description, capacity, registration_deadline,
              registrations(count)
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
  const formatTime = (ds) =>
    new Date(ds).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const getEventDuration = (start, end) => {
    if (!start || !end) return 'Duration TBD';
    const diffMs = new Date(end) - new Date(start);
    if (diffMs <= 0) return 'Duration TBD';
    const totalMinutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours && minutes) return `${hours}h ${minutes}m`;
    if (hours) return `${hours}h`;
    return `${minutes}m`;
  };

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

  const handleCancelRegistration = async (registrationId) => {
    showNotification(
      'Are you sure you want to cancel your registration for this event?',
      'warning',
      'confirm',
      {
        onConfirm: async () => {
          setIsCancelling(true);
          try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
              showNotification('Session expired. Please login again.', 'error');
              navigate('/');
              return;
            }
            const { error } = await supabase
              .from('registrations')
              .delete()
              .eq('id', registrationId)
              .eq('student_id', user.id);

            if (error) throw error;

            setActiveRegs((prev) => prev.filter((reg) => reg.id !== registrationId));
            if (selectedReg?.id === registrationId) setSelectedReg(null);
            showNotification('Registration cancelled successfully.', 'success');
          } catch (err) {
            showNotification(err.message || 'Could not cancel registration.', 'error');
          } finally {
            setIsCancelling(false);
          }
        }
      }
    );
  };


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
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900">
      <nav className="relative sticky top-0 z-50 border-b border-white/10 bg-[#0f1f52]/95 px-8 py-5 text-white backdrop-blur lg:px-12">

        {/* GRID OVERLAY */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.15]"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.15) 1px, transparent 1px)',
            backgroundSize: '36px 36px'
          }}
        />
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="text-lg font-extrabold uppercase tracking-wider text-[#facc15]">Campus Core</span>
            <Link to="/event-discovery" className="flex items-center gap-2 text-xs font-bold text-slate-300 transition hover:text-white">
              <ArrowLeft size={14} /> Back to Explore Events
            </Link>
          </div>

          <div className="flex items-center gap-3 border-l border-white/10 pl-5">
            <div className="hidden text-right sm:block">
              <p className="text-[10px] font-black uppercase tracking-tight text-white">{fullName}</p>
              <p className="text-[9px] font-bold uppercase tracking-tighter text-slate-300">{student?.student_id_number}</p>
            </div>
            <div className="grid h-8 w-8 place-items-center rounded-full bg-[#facc15] text-xs font-black text-[#0f172a] shadow-sm">
              {initials}
            </div>
            <button onClick={handleLogoutRequest} className="text-slate-300 transition-colors hover:text-red-400">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-6 py-5">

        <section className="mb-14">
          <div className="mb-6 flex items-center gap-2">
            <div className="rounded-md bg-blue-50 p-1.5">
              <CalendarDays className="h-3.5 w-3.5 text-[#1d3a8a]" />
            </div>
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-slate-700">Active Registrations</h2>
          </div>

          <div className="w-full max-w-[1120px] overflow-x-auto rounded-2xl pb-2 scrollbar-hide">
            {activeRegs.length > 0 ? (
              <div className="flex w-max gap-5">
                {activeRegs.map((reg) => (
                  <div
                    key={reg.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedReg(reg)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedReg(reg);
                      }
                    }}
                    className="group relative min-h-[320px] min-w-[320px] cursor-pointer overflow-hidden rounded-2xl border border-slate-200 shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-unity-yellow/70"
                  >
                    <img
                      src={reg.events.image_url || 'https://via.placeholder.com/800'}
                      alt={reg.events.title}
                      className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black via-black/55 to-black/20" />
                    <div className="absolute right-3 top-3 translate-y-1 rounded-full bg-black/45 px-3 py-1 text-[10px] font-semibold text-white/90 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:opacity-100">
                      Click to view details
                    </div>
                    <div className="relative flex h-full flex-col justify-between p-5 text-white">
                      <div className="flex items-start justify-between gap-3">
                        <span className="rounded-md bg-unity-yellow px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-unity-navy">
                          {reg.events.categories?.[0] || 'Event'}
                        </span>
                        <span className="rounded-full border border-emerald-300/35 bg-emerald-500/20 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-emerald-100">
                          Active
                        </span>
                      </div>

                      <div>
                        <h3 className="mb-2 line-clamp-2 text-2xl font-black leading-tight">{reg.events.title}</h3>
                        <div className="space-y-1.5 text-xs text-white/90">
                          <p className="flex items-center gap-1.5">
                            <MapPin size={13} className="text-unity-yellow" />
                            {reg.events.venue}
                          </p>
                          <p className="flex items-center gap-1.5">
                            <Clock size={13} className="text-unity-yellow" />
                            {formatDate(reg.events.start_datetime)} {formatTime(reg.events.start_datetime)}
                          </p>
                        </div>

                        <div className="mt-5 flex items-center justify-between border-t border-white/20 pt-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCancelRegistration(reg.id);
                            }}
                            disabled={isCancelling}
                            className="text-[10px] font-black uppercase tracking-wider text-rose-200 transition hover:text-red-300 disabled:opacity-60"
                          >
                            {isCancelling ? 'Cancelling...' : 'Cancel Registration'}
                          </button>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-white/75">Tap card for details</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-8 py-12 text-center text-sm text-slate-500">
                No active registrations.
              </div>
            )}
          </div>
        </section>

        <section>
          <div className="mb-6 flex items-center gap-2">
            <div className="rounded-md bg-slate-50 p-1.5">
              <History className="h-3.5 w-3.5 text-slate-500" />
            </div>
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Past Registered Events</h2>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full border-collapse text-left">
              <thead className="bg-slate-50 text-[9px] font-black uppercase text-slate-400">
                <tr>
                  <th className="px-6 py-4">Event Name</th>
                  <th className="px-6 py-4">Venue</th>
                  <th className="px-6 py-4">Event Date</th>
                  <th className="px-6 py-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pastRegs.length > 0 ? pastRegs.map((reg) => (
                  <tr key={reg.id} className="transition-colors hover:bg-slate-50/70">
                    <td className="px-6 py-4 text-sm font-bold text-slate-700">{reg.events.title}</td>
                    <td className="px-6 py-4 text-[11px] font-medium text-slate-500">{reg.events.venue}</td>
                    <td className="px-6 py-4 text-[11px] font-medium text-slate-500">{formatDate(reg.events.start_datetime)}</td>
                    <td className="px-6 py-4 text-right">
                      <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-[9px] font-black uppercase tracking-tight text-slate-500">
                        <CheckCircle2 size={10} /> Completed
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="4" className="px-6 py-10 text-center text-[11px] italic text-slate-400">
                      No history found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {selectedReg && (
        <div className="fixed inset-0 z-50 flex flex-col lg:flex-row bg-[#060b13] overflow-hidden">

          {/* Background Image with Gradient Overlay */}
          <div className="absolute inset-0 z-0 pointer-events-none">
            <img
              src={selectedReg.events.image_url || 'https://via.placeholder.com/1200'}
              alt=""
              className="h-full w-full object-cover filter blur-xs scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#060b13]/95 via-[#060b13]/60 to-[#060b13]/40 lg:bg-gradient-to-r lg:from-[#060b13]/85 lg:via-[#060b13]/55 lg:to-[#060b13]/65 backdrop-blur-[2px]" />
          </div>

          {/* Absolute Position Controls Header */}
          <div className="absolute top-6 left-6 right-6 z-20 flex items-center justify-between pointer-events-none">
            <button
              onClick={() => setSelectedReg(null)}
              className="pointer-events-auto flex items-center gap-2 rounded-full bg-black/45 border border-white/10 px-4 py-2 text-xs font-semibold text-white tracking-wide transition hover:bg-black/60 hover:border-white/20 active:scale-[0.97]"
            >
              <ArrowLeft size={14} className="text-white" /> Back to dashboard
            </button>
            <button
              onClick={() => setSelectedReg(null)}
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
                {(selectedReg.events.categories?.length ? selectedReg.events.categories : ['General']).slice(0, 3).map((cat, i) => (
                  <span
                    key={i}
                    className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-200 backdrop-blur-sm"
                  >
                    {cat}
                  </span>
                ))}
                <span className="rounded-full bg-emerald-500 text-white px-3 py-1 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-md">
                  <Trophy size={11} className="fill-white stroke-white" /> Active
                </span>
              </div>

              {/* Event Title */}
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] text-white">
                {selectedReg.events.title || 'Untitled Event'}
              </h2>

              {/* Organized By */}
              <p className="flex items-center gap-2 text-xs sm:text-sm text-slate-300 font-medium mt-4 mb-6">
                <MapPin size={16} className="text-emerald-400 shrink-0" />
                <span>Organized by <strong className="text-white">Unity University</strong></span>
              </p>

              {/* Event Description (Directly under the title) */}
              <p className="text-base text-slate-200 leading-relaxed whitespace-pre-line max-w-3xl">
                {selectedReg.events.description || 'No description provided for this event.'}
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
                    <p className="text-sm font-semibold text-white">{formatEventDateLong(selectedReg.events.start_datetime)}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{formatEventTime(selectedReg.events.start_datetime)}</p>
                  </div>
                </div>

                {/* ENDS */}
                <div className="flex items-start gap-4 border-b border-white/5 pb-4 last:border-none last:pb-0">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/5 border border-white/10 text-unity-yellow">
                    <CalendarDays size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#facc15] mb-0.5">Ends</p>
                    <p className="text-sm font-semibold text-white">{formatEventDateLong(selectedReg.events.end_datetime)}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{formatEventTime(selectedReg.events.end_datetime)}</p>
                  </div>
                </div>

                {/* DURATION */}
                {(() => {
                  const dur = getDurationDetails(selectedReg.events.start_datetime, selectedReg.events.end_datetime);
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
                  const venueInfo = getVenueDetails(selectedReg.events.venue);
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
                {(() => {
                  const regCount = selectedReg.events.registrations?.[0]?.count || 0;
                  const capacity = selectedReg.events.capacity;
                  return (
                    <div className="flex items-start gap-4 border-b border-white/5 pb-4 last:border-none last:pb-0">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/5 border border-white/10 text-unity-yellow">
                        <Users size={18} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#facc15] mb-0.5">Capacity</p>
                        {capacity != null && capacity !== '' ? (
                          <>
                            <p className="text-sm font-semibold text-white">
                              {Math.max(0, capacity - regCount)} spots left
                            </p>
                            <div className="mt-2 flex items-center justify-between gap-4">
                              <div className="h-1.5 flex-1 rounded-full bg-white/10 overflow-hidden">
                                <div
                                  className="h-full bg-unity-yellow rounded-full transition-all duration-500"
                                  style={{
                                    width: `${Math.min(100, Math.max(0, (regCount / capacity) * 100))}%`
                                  }}
                                />
                              </div>
                              <span className="text-[11px] font-bold text-slate-400 shrink-0">
                                {regCount}/{capacity}
                              </span>
                            </div>
                          </>
                        ) : (
                          <>
                            <p className="text-sm font-semibold text-white">Unlimited spots available</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">{regCount} registered</p>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* REGISTRATION DEADLINE */}
                <div className="flex items-start gap-4 border-b border-white/5 pb-4 last:border-none last:pb-0">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/5 border border-white/10 text-unity-yellow">
                    <CalendarDays size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#facc15] mb-0.5">Registration Deadline</p>
                    <p className="text-sm font-semibold text-white">
                      {formatEventDateLong(selectedReg.events.registration_deadline)}
                    </p>
                    {selectedReg.events.registration_deadline && (
                      <p className="text-[11px] text-slate-400 mt-0.5">{formatEventTime(selectedReg.events.registration_deadline)}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <button
                  disabled={isCancelling}
                  onClick={() => handleCancelRegistration(selectedReg.id)}
                  className="w-full rounded-xl bg-rose-500 hover:bg-rose-600 text-white py-3.5 text-xs font-black uppercase tracking-[0.2em] transition duration-200 active:scale-[0.98] disabled:opacity-60 shadow-lg shadow-rose-500/10 cursor-pointer"
                >
                  {isCancelling ? 'Cancelling...' : 'Cancel Registration'}
                </button>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

const InfoRow = ({ label, value }) => (
  <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-2 last:border-none last:pb-0">
    <p className="text-[10px] font-black uppercase tracking-widest text-unity-yellow">{label}</p>
    <p className="text-right text-xs font-semibold text-white/90">{value}</p>
  </div>
);

export default StudentDashboard;