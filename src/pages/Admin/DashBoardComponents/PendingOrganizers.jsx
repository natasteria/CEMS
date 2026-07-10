import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { Check, X, RefreshCw, Loader2 } from "lucide-react";
import { useNotification } from "../../../context/NotificationContext";

const PendingOrganizers = () => {
  const { showNotification } = useNotification();
  const [organizers, setOrganizers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false); // For the refresh button spin
  const [actionLoading, setActionLoading] = useState(null);

  // 1. Move fetch logic to a useCallback so it can be reused by the button and interval
  const fetchPendingOrganizers = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setRefreshing(true);

      const { data, error } = await supabase
        .from("organizers")
        .select(`
          id,
          organizer_name,
          organizer_type,
          registration_status,
          profiles!inner(
            email,
            created_at,
            first_name,
            last_name
          )
        `)
        .eq("registration_status", "pending")
        .order('created_at', { foreignTable: 'profiles', ascending: true });

      if (error) throw error;

      const formatted = data.map((o) => ({
        id: o.id,
        organizer_name: o.organizer_name,
        organizer_type: o.organizer_type,
        primary_contact: `${o.profiles?.first_name || ''} ${o.profiles?.last_name || ''}`.trim() || "N/A",
        email: o.profiles?.email || "N/A",
        applied_at: o.profiles?.created_at || new Date().toISOString(),
      }));

      setOrganizers(formatted);
    } catch (err) {
      console.error("Failed to fetch pending organizers:", err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // 2. Initial fetch + Auto-polling setup
  useEffect(() => {
    fetchPendingOrganizers();

    // Set interval to check for new requests every 30 seconds
    const interval = setInterval(() => {
      fetchPendingOrganizers(true); // 'true' means silent update (no loading spinners)
    }, 30000);

    return () => clearInterval(interval); // Cleanup on unmount
  }, [fetchPendingOrganizers]);

  const handleAction = async (id, status) => {
    try {
      setActionLoading(id);
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from("organizers")
        .update({ 
          registration_status: status,
          reviewed_by: user?.id 
        })
        .eq("id", id);

      if (error) throw error;
      setOrganizers((prev) => prev.filter((o) => o.id !== id));
      showNotification(`Organizer successfully ${status}`, 'success');
    } catch (err) {
      console.error(`Failed to ${status} organizer:`, err.message);
      showNotification(`Failed to ${status} organizer`, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-[#003366]" />
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-screen font-sans">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#0f172a]">Pending Organizers</h1>
          <p className="text-gray-500 text-sm mt-1">Review and approve new organizer applications.</p>
        </div>
        
        {/* Manual Refresh Button */}
        <button
          onClick={() => fetchPendingOrganizers()}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 text-[11px] uppercase tracking-wider text-gray-500 border-b border-gray-100">
              <th className="px-6 py-4 font-semibold">Organizer</th>
              <th className="px-6 py-4 font-semibold">Contact Info</th>
              <th className="px-6 py-4 font-semibold">Type</th>
              <th className="px-6 py-4 font-semibold">Applied At</th>
              <th className="px-6 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-50">
            {organizers.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-8 text-slate-500 text-sm">
                  No pending organizers
                </td>
              </tr>
            ) : (
              organizers.map((org) => (
                <tr key={org.id} className="group hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-[#0f172a]">{org.organizer_name}</div>
                    <div className="text-[10px] text-gray-400 font-mono">#{org.id?.slice(0,8)}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div className="font-medium">{org.primary_contact}</div>
                    <div className="text-[11px] text-slate-400">{org.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 rounded-full text-[10px] font-bold border bg-gray-100 text-gray-700 border-gray-200 uppercase">
                      {org.organizer_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(org.applied_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleAction(org.id, "approved")}
                        disabled={actionLoading === org.id}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[#0f172a] bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                      >
                        <Check size={14} className="text-emerald-600" /> Approve
                      </button>
                      <button
                        onClick={() => handleAction(org.id, "rejected")}
                        disabled={actionLoading === org.id}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-100 rounded-lg hover:bg-rose-100 disabled:opacity-50 transition-colors"
                      >
                        <X size={14} /> Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PendingOrganizers;