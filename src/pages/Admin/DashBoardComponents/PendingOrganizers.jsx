import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { Check, X, RefreshCw } from "lucide-react";
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
    return <div className="p-8 text-slate-500">Loading pending organizers...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-[#0F172A]">Pending Organizers</h1>
        
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

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-slate-200 rounded-2xl shadow-sm">
          <thead>
            <tr className="bg-slate-50 text-left text-sm font-semibold text-slate-600">
              <th className="px-6 py-3 border-b">Organizer Name</th>
              <th className="px-6 py-3 border-b">Primary Contact</th>
              <th className="px-6 py-3 border-b">Organizer Type</th>
              <th className="px-6 py-3 border-b">Email</th>
              <th className="px-6 py-3 border-b">Applied At</th>
              <th className="px-6 py-3 border-b">Actions</th>
            </tr>
          </thead>

          <tbody>
            {organizers.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-6 text-slate-500">
                  No pending organizers
                </td>
              </tr>
            ) : (
              organizers.map((org) => (
                <tr key={org.id} className="hover:bg-slate-50 border-b">
                  <td className="px-6 py-4 text-slate-700 font-medium">{org.organizer_name}</td>
                  <td className="px-6 py-4 text-slate-700">{org.primary_contact}</td>
                  <td className="px-6 py-4 text-slate-700">{org.organizer_type}</td>
                  <td className="px-6 py-4 text-slate-700">{org.email}</td>
                  <td className="px-6 py-4 text-slate-500">
                    {new Date(org.applied_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 flex gap-2">
                    <button
                      onClick={() => handleAction(org.id, "approved")}
                      disabled={actionLoading === org.id}
                      className="flex items-center gap-1 px-3 py-1 text-sm font-medium text-white bg-green-500 rounded-lg hover:bg-green-600 disabled:opacity-50"
                    >
                      <Check size={16} /> Approve
                    </button>
                    <button
                      onClick={() => handleAction(org.id, "rejected")}
                      disabled={actionLoading === org.id}
                      className="flex items-center gap-1 px-3 py-1 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 disabled:opacity-50"
                    >
                      <X size={16} /> Reject
                    </button>
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