// =============================
// 🔥 FULL UPDATED COMPONENT
// =============================

import React, { useState, useEffect } from 'react';
import { 
  Calendar, MapPin, History, 
  CheckCircle, AlertCircle, 
  Search, X, Trash2
} from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';

const AdminEventManagement = () => {
  const [activeTab, setActiveTab] = useState('ALL');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionNote, setRejectionNote] = useState('');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchEvents();
    const handleEsc = (e) => { if (e.key === 'Escape') closeModal(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const closeModal = () => {
    setSelectedEvent(null);
    setIsRejecting(false);
    setRejectionNote('');
  };

  const fetchEvents = async () => {
    const { data, error } = await supabase
      .from('events')
      .select(`*, organizers (organizer_name)`)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) return console.error(error);
    setEvents(data);
  };

  const fetchEventHistory = async (eventId) => {
    const { data } = await supabase
      .from('event_status')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: true });

    return data || [];
  };

  const getAdminId = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    const { data } = await supabase
      .from('admins')
      .select('id')
      .eq('id', user.id)
      .single();

    return data.id;
  };

  // =============================
  // 🔥 ACTIONS (UPDATED)
  // =============================

  const handleApprove = async (eventId) => {
    setLoading(true);

    const { error } = await supabase
      .from('events')
      .update({ status: 'approved' })
      .eq('id', eventId);

    if (error) console.error(error);

    await fetchEvents();
    closeModal();
    setLoading(false);
  };

  const handleReject = async (eventId) => {
    if (!rejectionNote.trim()) return;

    setLoading(true);

    const { error } = await supabase
      .from('events')
      .update({
        status: 'rejected',
        rejection_note: rejectionNote
      })
      .eq('id', eventId);

    if (error) console.error(error);

    await fetchEvents();
    closeModal();
    setLoading(false);
  };

  const filteredEvents = activeTab === 'ALL' 
    ? events 
    : events.filter(e => e.status.toUpperCase() === activeTab);

  const getStatusStyles = (status) => {
    switch (status.toUpperCase()) {
      case 'PENDING': return 'bg-[#facc15]/10 text-[#a16207] border-[#facc15]';
      case 'EDITED': return 'bg-[#1d3a8a]/10 text-[#1d3a8a] border-[#1d3a8a]';
      case 'RESUBMITTED': return 'bg-sky-100 text-sky-700 border-sky-500';
      case 'APPROVED': return 'bg-emerald-100 text-emerald-700 border-emerald-500';
      case 'REJECTED': return 'bg-rose-100 text-rose-700 border-rose-500';
      default: return 'bg-gray-100 text-gray-700 border-gray-400';
    }
  };

  return (
    <div className="flex-1 min-h-screen font-sans">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#0f172a]">Event Approvals</h1>
          <p className="text-gray-500 text-sm">Review and moderate incoming event submissions.</p>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input type="text" placeholder="Search events..." className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#facc15]" />
        </div>
      </div>

      <div className="flex gap-6 border-b border-gray-200 mb-6">
        {['ALL', 'PENDING', 'EDITED', 'RESUBMITTED', 'APPROVED'].map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`pb-3 text-sm font-semibold relative transition-colors ${
              activeTab === tab ? 'text-[#0f172a]' : 'text-gray-400 hover:text-gray-600'
            }`}>
            {tab}
            {activeTab === tab && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#facc15] rounded-t-full" />
            )}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 text-[11px] uppercase tracking-wider text-gray-500 border-b border-gray-100">
              <th className="px-6 py-4 font-semibold">Event</th>
              <th className="px-6 py-4 font-semibold">Organizer</th>
              <th className="px-6 py-4 font-semibold">Date & Time</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredEvents.map((event) => (
              <tr key={event.id}
                onClick={async () => {
                  const history = await fetchEventHistory(event.id);
                  setSelectedEvent({ ...event, history });
                }}
                className="group cursor-pointer hover:bg-slate-50">
                <td className="px-6 py-4">
                  <div className="font-semibold text-[#0f172a] group-hover:text-[#1d3a8a]">{event.title}</div>
                  <div className="text-[10px] text-gray-400 font-mono">#{event.id}</div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{event.organizers?.organizer_name}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center text-sm text-gray-600 gap-2">
                    <Calendar className="w-3.5 h-3.5 text-[#1d3a8a]" />
                    {new Date(event.start_datetime).toLocaleDateString()}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${getStatusStyles(event.status)}`}>
                    ● {event.status.toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2 text-gray-400">
                    <button className="p-1.5 hover:text-rose-600"><Trash2 size={16}/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>


      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={closeModal} className="absolute inset-0 bg-[#0f172a]/60 backdrop-blur-sm" />
          <div className="relative bg-white w-full max-w-5xl max-h-[90vh] min-h-0 rounded-2xl shadow-2xl overflow-hidden flex flex-col">

            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
              <h2 className="text-xl font-bold text-[#0f172a] pr-4 line-clamp-2">{selectedEvent.title}</h2>
              <button type="button" onClick={closeModal} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-[#0f172a] shrink-0">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Split body: 1/3 History | 2/3 Details */}
            <div className="flex flex-1 min-h-0 divide-x divide-gray-100">
              {/* History — audit timeline (1/3) */}
              <aside className="flex-1 min-w-[200px] flex flex-col bg-gray-50/40">
                <div className="px-4 py-3 border-b border-gray-100/80 bg-white/80 shrink-0">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-gray-400" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">History</span>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto px-4 py-4">
                  {selectedEvent.history?.length ? (
                    <div className="relative pl-3">
                      <div className="absolute left-[5px] top-2 bottom-2 w-px bg-gray-200" aria-hidden />
                      <ul className="space-y-0">
                        {selectedEvent.history.map((item, idx) => (
                          <li key={idx} className="relative pb-6 last:pb-0">
                            <div
                              className="absolute left-0 top-1.5 z-1 h-2.5 w-2.5 rounded-full border-2 border-white ring-1 ring-gray-300 shadow-sm"
                              style={{
                                backgroundColor:
                                  String(item.status_assigned).toLowerCase() === 'rejected'
                                    ? '#fda4af'
                                    : String(item.status_assigned).toLowerCase() === 'approved'
                                      ? '#6ee7b7'
                                      : '#fde047'
                              }}
                            />
                            <div className="pl-5">
                              <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-1">Status</p>
                              <p className="text-sm font-semibold text-[#0f172a] capitalize">{item.status_assigned}</p>
                              <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mt-2 mb-0.5">Date</p>
                              <p className="text-xs text-gray-600">{new Date(item.created_at).toLocaleString()}</p>
                              {item.rejection_note && (
                                <>
                                  <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mt-2 mb-0.5">Note</p>
                                  <p className="text-xs text-rose-600 leading-snug">{item.rejection_note}</p>
                                </>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">No status history yet.</p>
                  )}
                </div>
              </aside>

              {/* Details (2/3) */}
              <div className="flex-2 min-w-0 overflow-y-auto p-6 space-y-5">
                {selectedEvent.image_url && (
                  <div className="w-full h-48 sm:h-56 bg-gray-100 rounded-xl overflow-hidden border border-gray-100">
                    <img
                      src={selectedEvent.image_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-1">Title</p>
                  <p className="text-base font-semibold text-[#0f172a]">{selectedEvent.title}</p>
                </div>

                <div className="flex flex-wrap gap-6">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-1">Category</p>
                    <p className="text-sm font-medium text-gray-800">
                      {selectedEvent.categories?.join(', ') || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-1">Status</p>
                    <span className={`inline-flex mt-0.5 px-3 py-1 rounded-full text-[10px] font-bold border ${getStatusStyles(selectedEvent.status)}`}>
                      ● {selectedEvent.status.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-2">Description</p>
                  <div className="rounded-xl bg-gray-50/90 border border-gray-100 px-4 py-3">
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{selectedEvent.description || 'N/A'}</p>
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-3">Schedule & venue</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                    <div className="flex gap-3">
                      <Calendar className="w-4 h-4 text-[#1d3a8a] shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-0.5">Start</p>
                        <p className="text-sm font-medium text-gray-800">{new Date(selectedEvent.start_datetime).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Calendar className="w-4 h-4 text-[#1d3a8a] shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-0.5">End</p>
                        <p className="text-sm font-medium text-gray-800">{new Date(selectedEvent.end_datetime).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex gap-3 sm:col-span-2">
                      <MapPin className="w-4 h-4 text-[#1d3a8a] shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-0.5">Venue</p>
                        <p className="text-sm font-medium text-gray-800">{selectedEvent.venue}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-0.5">Capacity</p>
                      <p className="text-sm font-medium text-gray-800">{selectedEvent.capacity ?? 'Unlimited'}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-0.5">Registration deadline</p>
                      <p className="text-sm font-medium text-gray-800">
                        {selectedEvent.registration_deadline
                          ? new Date(selectedEvent.registration_deadline).toLocaleString()
                          : 'N/A'}
                      </p>
                    </div>
                    <div className="sm:col-span-2">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-0.5">Organizer</p>
                      <p className="text-sm font-medium text-gray-800">{selectedEvent.organizers?.organizer_name || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {!['APPROVED', 'REJECTED'].includes(selectedEvent.status?.toUpperCase()) && (
              <div className="px-4 py-3 border-t border-gray-100 bg-white shrink-0">
                {isRejecting ? (
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex-1 min-w-0 flex items-center gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wide text-gray-400 shrink-0 hidden sm:inline">Reason</span>
                      <input
                        type="text"
                        value={rejectionNote}
                        onChange={(e) => setRejectionNote(e.target.value)}
                        placeholder="Brief reason for rejection…"
                        className="w-full min-w-0 rounded-lg border border-gray-200 bg-gray-50/80 px-3 py-2 text-sm text-[#0f172a] placeholder:text-gray-400 focus:border-[#facc15] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#facc15]/40"
                      />
                    </div>
                    <div className="flex items-center justify-end gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => { setIsRejecting(false); setRejectionNote(''); }}
                        className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={loading || !rejectionNote.trim()}
                        onClick={() => handleReject(selectedEvent.id)}
                        className="rounded-lg px-4 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:pointer-events-none"
                      >
                        Confirm rejection
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsRejecting(true)}
                      className="rounded-lg px-4 py-2 text-sm font-semibold border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100"
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => handleApprove(selectedEvent.id)}
                      className="rounded-lg px-4 py-2 text-sm font-semibold text-white bg-[#0f172a] hover:bg-[#1e293b] disabled:opacity-50"
                    >
                      {loading ? 'Working…' : 'Approve'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEventManagement;


// =============================
// 🔥 SQL YOU MUST ADD
// =============================

/*

-- APPROVE FUNCTION
create or replace function approve_event(
  event_id_input uuid,
  admin_id_input uuid
)
returns void as $$
begin
  update events
  set status = 'approved'
  where id = event_id_input;

  insert into event_status (
    event_id,
    admin_id,
    status_assigned
  )
  values (
    event_id_input,
    admin_id_input,
    'approved'
  );
end;
$$ language plpgsql;


-- REJECT FUNCTION
create or replace function reject_event(
  event_id_input uuid,
  admin_id_input uuid,
  note_input text
)
returns void as $$
begin
  update events
  set status = 'rejected'
  where id = event_id_input;

  insert into event_status (
    event_id,
    admin_id,
    status_assigned,
    rejection_note
  )
  values (
    event_id_input,
    admin_id_input,
    'rejected',
    note_input
  );
end;
$$ language plpgsql;

*/
