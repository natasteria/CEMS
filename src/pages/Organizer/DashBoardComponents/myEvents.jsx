import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../../../lib/supabaseClient';
import {
  Plus, Calendar, Users, Edit, Trash2, RefreshCw,
  Loader2, X, MapPin, ImageIcon, Infinity,
  ChevronLeft, Clock
} from 'lucide-react';

const MyEvents = ({ onCreateClick, onEditClick }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('upcoming');

  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showAttendeeModal, setShowAttendeeModal] = useState(false);
  const [attendees, setAttendees] = useState([]);
  const [loadingAttendees, setLoadingAttendees] = useState(false);

  const [rejectionNote, setRejectionNote] = useState(null);

  useEffect(() => {
    fetchEvents();
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        setShowAttendeeModal(false);
        setSelectedEvent(null);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  useEffect(() => {
    if (!showAttendeeModal) return undefined;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [showAttendeeModal]);

  const fetchEvents = async ({ silent = false } = {}) => {
    try {
      if (silent) setRefreshing(true);
      else setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from('events')
        .select('*, registrations(count)')
        .eq('organizer_id', user.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setEvents(data || []);
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      if (silent) setRefreshing(false);
      else setLoading(false);
    }
  };

  const fetchRejectionNote = async (eventId) => {
    const { data, error } = await supabase
      .from('event_status')
      .select('rejection_note')
      .eq('event_id', eventId)
      .eq('status_assigned', 'rejected')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
  
    if (error) return null;
  
    return data?.rejection_note;
  };

  const handleRefresh = () => fetchEvents({ silent: true });

  const handleDelete = async (e, id) => {
    e.stopPropagation();
  
    if (!id || !window.confirm("Delete this event?")) return;
  
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
  
      const { error } = await supabase
        .from('events')
        .update({
          deleted_at: new Date().toISOString(),
          deleted_by: user.id,
          deletion_note: 'Deleted by organizer',
        })
        .eq('id', id);
  
      if (error) throw error;
  
      setEvents(prev => prev.filter(ev => ev.id !== id));
    } catch (err) {
      console.error(err);
    }
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
        .select(`id, registration_date, students (student_id_number, department, batch_year, profiles (first_name, last_name, email, phone_number))`)
        .eq('event_id', event.id)
        .order('registration_date', { ascending: false });
      if (error) throw error;
      const sorted = (data || []).sort(
        (a, b) => new Date(b.registration_date) - new Date(a.registration_date)
      );
      setAttendees(sorted);
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

  const openEventDetails = async (event) => {
    setSelectedEvent(event);
    setRejectionNote(null);
  
    if (event.status === 'rejected') {
      const note = await fetchRejectionNote(event.id);
      setRejectionNote(note);
    }
  };

  const now = new Date();
  const filteredEvents = (events || []).filter(e => {
    const isPast = new Date(e?.start_datetime) < now;
    if (filter === 'upcoming') return !isPast;
    if (filter === 'past') return isPast;
    return true;
  });

  const filterTabs = [
    { id: 'all', label: 'All', count: events.length },
    { id: 'upcoming', label: 'Upcoming', count: events.filter(e => new Date(e.start_datetime) >= now).length },
    { id: 'past', label: 'Past', count: events.filter(e => new Date(e.start_datetime) < now).length },
  ];

  if (loading) {
    return (
      <div className="flex-1 min-h-[40vh] flex items-center justify-center font-sans">
        <Loader2 className="w-8 h-8 animate-spin text-[#1d3a8a]" />
      </div>
    );
  }

  return (
    <div className="flex-1 font-sans">
      <header className="mb-6 border-b border-gray-100 pb-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-[#0f172a] tracking-tight">My Events</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage your activities and registrations.
            </p>
          </div>

          <div className="flex w-full items-center gap-2 sm:gap-3 lg:w-auto lg:shrink-0">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              aria-label={refreshing ? 'Refreshing events' : 'Refresh event list'}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50 sm:px-4"
            >
              <RefreshCw className={`h-4 w-4 shrink-0 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{refreshing ? 'Refreshing…' : 'Refresh'}</span>
            </button>
            <button
              type="button"
              onClick={onCreateClick}
              className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-[#facc15] px-4 text-sm font-semibold text-[#003366] shadow-sm transition-colors hover:bg-[#eab308] sm:flex-initial sm:min-w-[9.5rem]"
            >
              <Plus className="h-4 w-4 shrink-0" />
              Create Event
            </button>
          </div>
        </div>
      </header>

      <nav className="-mx-1 mb-6 flex gap-4 overflow-x-auto border-b border-gray-200 px-1 pb-px sm:gap-6" aria-label="Event filters">
        {filterTabs.map(({ id, label, count }) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilter(id)}
            className={`pb-3 text-sm font-semibold relative transition-colors whitespace-nowrap ${
              filter === id ? 'text-[#0f172a]' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {label} ({count})
            {filter === id && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#facc15] rounded-t-full" />
            )}
          </button>
        ))}
      </nav>

      {/* Desktop table */}
      <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 text-[11px] uppercase tracking-wider text-gray-500 border-b border-gray-100">
              <th className="px-6 py-4 font-semibold">Event</th>
              <th className="px-6 py-4 font-semibold">Date & Time</th>
              <th className="px-6 py-4 font-semibold">Registrations</th>
              <th className="px-6 py-4 font-semibold text-center">Attendees</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredEvents.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-400">
                  No events found.
                </td>
              </tr>
            ) : (
              filteredEvents.map(event => {
                const regCount = event.registrations?.[0]?.count || 0;
                const isPast = new Date(event.start_datetime) < now;
                return (
                  <tr
                    key={event.id}
                    onClick={() => openEventDetails(event)}
                    className="group cursor-pointer hover:bg-slate-50"
                  >
                    <td className="px-6 py-4">
                      <div className="font-semibold text-[#0f172a] group-hover:text-[#1d3a8a]">{event.title}</div>
                      <div className="text-[10px] text-gray-400 font-mono">#{event.id.substring(0, 8)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-sm text-gray-600 gap-2">
                        <Calendar className="w-3.5 h-3.5 text-[#1d3a8a]" />
                        {new Date(event.start_datetime).toLocaleDateString()}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5 ml-5">
                        {new Date(event.start_datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <RegistrationsDisplay event={event} regCount={regCount} />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        type="button"
                        onClick={(e) => handleViewAttendees(e, event)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[#1d3a8a] hover:bg-[#1d3a8a]/10 rounded-lg transition-colors"
                      >
                        <Users className="w-4 h-4" /> 
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${getStatusStyles(event.status)}`}>
                        ● {event.status?.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {!isPast ? (
                        <div className="flex justify-end gap-2 text-gray-400">
                          <button
                            type="button"
                            onClick={(e) => handleEdit(e, event)}
                            className="p-1.5 hover:text-[#1d3a8a]"
                            title="Edit"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDelete(e, event.id)}
                            className="p-1.5 hover:text-rose-600"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 italic">Ended</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile list */}
      <div className="lg:hidden space-y-3">
        {filteredEvents.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-8">No events found.</p>
        ) : (
          filteredEvents.map(event => {
            const regCount = event.registrations?.[0]?.count || 0;
            const isPast = new Date(event.start_datetime) < now;
            return (
              <div
                key={event.id}
                onClick={() => openEventDetails(event)}
                className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 cursor-pointer hover:bg-slate-50"
              >
                <div className="flex justify-between items-start gap-2 mb-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-[#0f172a] truncate">{event.title}</p>
                    <p className="text-[10px] text-gray-400 font-mono mt-0.5">#{event.id.substring(0, 8)}</p>
                  </div>
                  <span className={`shrink-0 px-3 py-1 rounded-full text-[10px] font-bold border ${getStatusStyles(event.status)}`}>
                    ● {event.status?.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center text-sm text-gray-600 gap-2 mb-3">
                  <Calendar className="w-3.5 h-3.5 text-[#1d3a8a]" />
                  {new Date(event.start_datetime).toLocaleString()}
                </div>
                <div className="mb-3">
                  <RegistrationsDisplay event={event} regCount={regCount} compact />
                </div>
                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={(e) => handleViewAttendees(e, event)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 text-sm font-medium text-[#1d3a8a] border border-gray-200 rounded-lg hover:bg-slate-50"
                  >
                    <Users className="w-4 h-4" /> Attendees
                  </button>
                  {!isPast && (
                    <>
                      <button
                        type="button"
                        onClick={(e) => handleEdit(e, event)}
                        className="p-2 text-gray-400 hover:text-[#1d3a8a] border border-gray-200 rounded-lg"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDelete(e, event.id)}
                        className="p-2 text-gray-400 hover:text-rose-600 border border-gray-200 rounded-lg"
                      >
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Event details modal */}
      {selectedEvent && !showAttendeeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#0f172a]/60 backdrop-blur-sm" onClick={() => setSelectedEvent(null)} />
          <div className="relative bg-white w-full max-w-3xl max-h-[90vh] min-h-0 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
              <h2 className="text-xl font-bold text-[#0f172a] pr-4 line-clamp-2">{selectedEvent.title}</h2>
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-[#0f172a] shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {selectedEvent.image_url ? (
                <div className="w-full h-48 sm:h-56 bg-gray-100 rounded-xl overflow-hidden border border-gray-100">
                  <img src={selectedEvent.image_url} alt="" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-full h-40 bg-gray-50 rounded-xl border border-gray-100 flex flex-col items-center justify-center text-gray-300">
                  <ImageIcon className="w-10 h-10" />
                  <p className="text-xs text-gray-400 mt-2">No image</p>
                </div>
              )}

              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-1">Status</p>
                <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-bold border ${getStatusStyles(selectedEvent.status)}`}>
                  ● {selectedEvent.status?.toUpperCase()}
                </span>
              </div>
              {selectedEvent.status === 'rejected' && rejectionNote && (
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-rose-500 mb-2">
                    Rejection Reason
                  </p>

                  <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3">
                    <p className="text-sm text-rose-700 whitespace-pre-wrap">
                      {rejectionNote}
                    </p>
                  </div>
                </div>
              )}

              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-2">Description</p>
                <div className="rounded-xl bg-gray-50/90 border border-gray-100 px-4 py-3">
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {selectedEvent.description || 'No description provided.'}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-3">Schedule & venue</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                  <div className="flex gap-3">
                    <Calendar className="w-4 h-4 text-[#1d3a8a] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-0.5">Start</p>
                      <p className="text-sm font-medium text-gray-800">
                        {new Date(selectedEvent.start_datetime).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <MapPin className="w-4 h-4 text-[#1d3a8a] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-0.5">Venue</p>
                      <p className="text-sm font-medium text-gray-800">{selectedEvent.venue || 'N/A'}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-0.5">Capacity</p>
                    <p className="text-sm font-medium text-gray-800">
                      {isUnlimitedCapacity(selectedEvent) ? 'Unlimited' : `${selectedEvent.capacity} seats`}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Attendees full-screen modal — portaled to body for true full viewport */}
      {showAttendeeModal && createPortal(
        <div className="fixed inset-0 z-[200] flex flex-col bg-white font-sans text-slate-900 animate-in fade-in duration-200">
          <header className="shrink-0 bg-[#003366] text-white shadow-md">
            <div className="px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4 border-b border-white/10">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={handleExitToDashboard}
                  className="p-2 rounded-xl text-white/70 hover:bg-white/10 hover:text-white transition-colors shrink-0"
                  aria-label="Close attendees view"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-unity-yellow mb-0.5">
                    Event Attendees
                  </p>
                  <h2 className="text-base sm:text-lg font-bold truncate">{selectedEvent?.title}</h2>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-unity-yellow text-unity-navy text-xs sm:text-sm font-bold">
                  <Users className="w-4 h-4" />
                  {attendees.length} registered
                </span>
                <button
                  type="button"
                  onClick={handleExitToDashboard}
                  className="p-2 rounded-xl text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </header>

          <main className="flex-1 min-h-0 overflow-hidden flex flex-col bg-white">
            {loadingAttendees ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 bg-slate-50">
                <Loader2 className="w-10 h-10 animate-spin text-[#003366]" />
                <p className="text-sm text-slate-500">Loading attendee records…</p>
              </div>
            ) : attendees.length > 0 ? (
              <>
                <div className="flex-1 min-h-0 overflow-auto">
                  <table className="w-full text-left border-collapse min-w-[900px]">
                    <thead className="sticky top-0 z-10">
                      <tr className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
                        <th className="px-4 sm:px-6 py-3.5 font-semibold align-top">#</th>
                        <th className="px-4 sm:px-6 py-3.5 font-semibold align-top">Name</th>
                        <th className="px-4 sm:px-6 py-3.5 font-semibold align-top">Student ID</th>
                        <th className="px-4 sm:px-6 py-3.5 font-semibold align-top">Department</th>
                        <th className="px-4 sm:px-6 py-3.5 font-semibold align-top">Batch</th>
                        <th className="px-4 sm:px-6 py-3.5 font-semibold align-top">Email</th>
                        <th className="px-4 sm:px-6 py-3.5 font-semibold align-top">Phone</th>
                        <th className="px-4 sm:px-6 py-3.5 font-semibold align-top">Registered At</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 align-top">
                      {attendees.map((item, idx) => {
                        const student = item?.students;
                        const profile = student?.profiles;
                        if (!profile) return null;
                        const fullName = `${profile.first_name} ${profile.last_name}`;
                        const initials = `${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}`.toUpperCase();
                        return (
                          <tr
                            key={item.id}
                            className="group hover:bg-slate-50 transition-colors align-top"
                          >
                            <td className="px-4 sm:px-6 py-3.5 text-sm text-slate-400 font-mono align-top">{idx + 1}</td>
                            <td className="px-4 sm:px-6 py-3.5 align-top">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-[#003366] flex items-center justify-center text-xs font-bold text-white shrink-0">
                                  {initials}
                                </div>
                                <span className="font-semibold text-slate-900 whitespace-nowrap group-hover:text-unity-blue">
                                  {fullName}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 sm:px-6 py-3.5 align-top">
                              <span className="inline-flex px-2.5 py-1 rounded-md bg-slate-100 text-xs font-mono font-medium text-slate-700">
                                {student.student_id_number || '—'}
                              </span>
                            </td>
                            <td className="px-4 sm:px-6 py-3.5 text-sm text-slate-700 align-top">{student.department || '—'}</td>
                            <td className="px-4 sm:px-6 py-3.5 align-top">
                              <span className="inline-flex px-2.5 py-1 rounded-full bg-unity-yellow/20 text-xs font-semibold text-[#a16207]">
                                {student.batch_year || '—'}
                              </span>
                            </td>
                            <td className="px-4 sm:px-6 py-3.5 align-top">
                              <a
                                href={`mailto:${profile.email}`}
                                className="text-sm text-unity-blue hover:underline truncate max-w-[200px] inline-block"
                              >
                                {profile.email || '—'}
                              </a>
                            </td>
                            <td className="px-4 sm:px-6 py-3.5 align-top">
                              {profile.phone_number ? (
                                <a
                                  href={`tel:${profile.phone_number}`}
                                  className="text-sm text-slate-700 hover:text-unity-blue whitespace-nowrap"
                                >
                                  {profile.phone_number}
                                </a>
                              ) : (
                                <span className="text-sm text-slate-400">—</span>
                              )}
                            </td>
                            <td className="px-4 sm:px-6 py-3.5 align-top">
                              <div className="flex items-center gap-2 text-sm text-slate-600 whitespace-nowrap">
                                <Clock className="w-3.5 h-3.5 text-unity-yellow shrink-0" />
                                {item.registration_date
                                  ? new Date(item.registration_date).toLocaleString([], {
                                      dateStyle: 'medium',
                                      timeStyle: 'short',
                                    })
                                  : '—'}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <footer className="shrink-0 px-4 sm:px-6 py-2.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
                  <p className="text-xs text-slate-500">
                    Showing {attendees.length} attendee{attendees.length !== 1 ? 's' : ''}
                  </p>
                  <div className="h-1 w-16 rounded-full bg-unity-yellow" aria-hidden />
                </footer>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center bg-slate-50">
                <div className="w-20 h-20 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mb-4 shadow-sm">
                  <Users className="w-10 h-10 text-slate-300" strokeWidth={1.5} />
                </div>
                <p className="text-base font-semibold text-slate-700">No attendees yet</p>
                <p className="mt-1 text-sm text-slate-400">Students will appear here once they register.</p>
              </div>
            )}
          </main>
        </div>,
        document.body
      )}
    </div>
  );
};

const isUnlimitedCapacity = (event) =>
  event?.capacity == null || event?.capacity === '';

const RegistrationsDisplay = ({ event, regCount, compact = false }) => {
  const unlimited = isUnlimitedCapacity(event);
  const percent = unlimited
    ? 0
    : Math.min(Math.round((regCount / event.capacity) * 100), 100);

  if (unlimited) {
    return (
      <div
        className={`flex items-center gap-2 text-gray-600 ${compact ? 'text-sm' : ''}`}
        title="Unlimited capacity"
      >
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-[#facc15]/20 text-[#a16207]">
          <Infinity className="w-4 h-4" aria-hidden />
        </span>
        <span className={compact ? 'text-sm text-gray-500' : 'text-sm font-medium'}>
          {regCount} registered
        </span>
      </div>
    );
  }

  return (
    <div>
      <p className={`text-gray-600 ${compact ? 'text-sm' : 'text-sm'}`}>
        {regCount} / {event.capacity}
      </p>
      {!compact && (
        <div className="mt-1.5 h-1.5 w-24 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${getProgressColor(event.status)}`}
            style={{ width: `${percent}%` }}
          />
        </div>
      )}
    </div>
  );
};

const getStatusStyles = (status) => {
  switch (status?.toUpperCase()) {
    case 'PENDING': return 'bg-[#facc15]/10 text-[#a16207] border-[#facc15]';
    case 'EDITED': return 'bg-[#1d3a8a]/10 text-[#1d3a8a] border-[#1d3a8a]';
    case 'RESUBMITTED': return 'bg-sky-100 text-sky-700 border-sky-500';
    case 'APPROVED': return 'bg-emerald-100 text-emerald-700 border-emerald-500';
    case 'REJECTED': return 'bg-rose-100 text-rose-700 border-rose-500';
    default: return 'bg-gray-100 text-gray-700 border-gray-400';
  }
};

const getProgressColor = (status) => {
  switch (status?.toUpperCase()) {
    case 'APPROVED': return 'bg-emerald-500';
    case 'REJECTED': return 'bg-rose-500';
    case 'EDITED': return 'bg-[#1d3a8a]';
    default: return 'bg-[#facc15]';
  }
};

export default MyEvents;
