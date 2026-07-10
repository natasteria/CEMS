import React, { useState, useEffect, useCallback } from "react";
import {
  Users,
  Calendar,
  UserCheck,
  ClipboardList,
  TrendingUp,
  RefreshCw,
  Loader2,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  GraduationCap,
  Building2,
  CalendarCheck,
  CalendarClock,
  CalendarX,
  AlertCircle,
  X,
} from "lucide-react";
import { supabase } from "../../../lib/supabaseClient";

// ─── Tiny SVG‑based chart helpers (no external library) ──────────────────────

/** Horizontal bar chart drawn with SVG */
const BarChart = ({ data, maxValue, colorMap }) => {
  if (!data || data.length === 0) {
    return <p className="text-sm text-slate-400 italic">No data available</p>;
  }
  const max = maxValue || Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="flex flex-col gap-2.5">
      {data.map((item, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="w-28 shrink-0 text-[11px] font-semibold text-slate-500 text-right truncate" title={item.label}>
            {item.label}
          </span>
          <div className="flex-1 h-6 bg-slate-100 rounded-md overflow-hidden relative">
            <div
              className="h-full rounded-md transition-all duration-700 ease-out"
              style={{
                width: `${Math.max(2, (item.value / max) * 100)}%`,
                backgroundColor: colorMap?.[item.label] || item.color || "#003366",
              }}
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-600">
              {item.value}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

/** Donut / pie chart drawn with SVG conic‑gradient trick via <circle> stroke‑dasharray */
const DonutChart = ({ data, size = 160 }) => {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;

  let accumulated = 0;
  const segments = data.map((d) => {
    const pct = d.value / total;
    const offset = accumulated;
    accumulated += pct;
    return { ...d, pct, offset };
  });

  return (
    <div className="flex flex-col items-center gap-4">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {segments.map((seg, i) => (
          <circle
            key={i}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={seg.color}
            strokeWidth={20}
            strokeDasharray={`${seg.pct * circumference} ${circumference}`}
            strokeDashoffset={-seg.offset * circumference}
            strokeLinecap="butt"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            className="transition-all duration-700"
          />
        ))}
        {/* Center text */}
        <text x="50%" y="48%" textAnchor="middle" className="text-2xl font-black fill-slate-800">{total}</text>
        <text x="50%" y="62%" textAnchor="middle" className="text-[10px] font-semibold fill-slate-400 uppercase tracking-wider">Total</text>
      </svg>
      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
            <span className="text-[11px] text-slate-600 font-medium">{seg.label}</span>
            <span className="text-[10px] text-slate-400 font-semibold">({seg.value})</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Stat card ────────────────────────────────────────────────────────────────

const StatCard = ({ icon: Icon, label, value, accent = "#003366", sub, onClick }) => (
  <div 
    onClick={onClick}
    className={`bg-white border border-slate-200 rounded-2xl p-5 flex items-start gap-4 shadow-sm hover:shadow-md transition-shadow ${onClick ? 'cursor-pointer' : ''}`}
  >
    <div className="p-2.5 rounded-xl border border-slate-100" style={{ backgroundColor: `${accent}10` }}>
      <Icon size={20} style={{ color: accent }} />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">{label}</p>
      <p className="text-2xl font-black text-[#0F172A] leading-tight">{value ?? "—"}</p>
      {sub && <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

// ─── Main component ──────────────────────────────────────────────────────────

const Overview = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState(null);
  const [showOrganizersModal, setShowOrganizersModal] = useState(false);

  const fetchStats = useCallback(async (silent = false) => {
    try {
      if (silent) setRefreshing(true);
      else setLoading(true);

      // Parallel queries ─────────────────────────────────────────

      const [
        studentsRes,
        organizersRes,
        eventsRes,
        registrationsRes,
        pendingOrgRes,
        studentDeptRes,
      ] = await Promise.all([
        // Total students
        supabase.from("students").select("*", { count: "exact", head: true }),
        // Approved organizers (fetch list)
        supabase
          .from("organizers")
          .select(`
            id,
            organizer_name,
            organizer_type,
            profiles!inner(email, first_name, last_name)
          `)
          .eq("registration_status", "approved"),
        // All non‑deleted events (with status + categories)
        supabase
          .from("events")
          .select("id, status, categories, start_datetime, capacity")
          .is("deleted_at", null),
        // Total registrations
        supabase.from("registrations").select("*", { count: "exact", head: true }),
        // Pending organizer count
        supabase
          .from("organizers")
          .select("*", { count: "exact", head: true })
          .eq("registration_status", "pending"),
        // Students grouped by department
        supabase.from("students").select("department"),
      ]);

      // Counts ────────────────────────────────────────────────────

      const totalStudents = studentsRes.count ?? 0;
      const approvedOrganizers = organizersRes.data || [];
      const totalOrganizers = approvedOrganizers.length;
      const totalRegistrations = registrationsRes.count ?? 0;
      const pendingOrganizers = pendingOrgRes.count ?? 0;

      const events = eventsRes.data || [];
      const totalEvents = events.length;

      // Events by status ──────────────────────────────────────────
      const statusCounts = { approved: 0, pending: 0, rejected: 0, edited: 0 };
      events.forEach((e) => {
        const s = (e.status || "").toLowerCase();
        if (s in statusCounts) statusCounts[s]++;
      });

      // Upcoming vs Past events ────────────────────────────────────
      const now = new Date();
      let upcomingEvents = 0;
      let pastEvents = 0;
      events.forEach((e) => {
        if (new Date(e.start_datetime) > now) upcomingEvents++;
        else pastEvents++;
      });

      // Events by category (flatten array field) ──────────────────
      const categoryCounts = {};
      events.forEach((e) => {
        (e.categories || []).forEach((cat) => {
          categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
        });
      });

      // Students by department ────────────────────────────────────
      const deptCounts = {};
      (studentDeptRes.data || []).forEach((s) => {
        const dept = s.department || "Unknown";
        deptCounts[dept] = (deptCounts[dept] || 0) + 1;
      });

      setStats({
        totalStudents,
        totalOrganizers,
        approvedOrganizers,
        totalEvents,
        totalRegistrations,
        pendingOrganizers,
        statusCounts,
        upcomingEvents,
        pastEvents,
        categoryCounts,
        deptCounts,
      });
    } catch (err) {
      console.error("Overview fetch error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // ── Loading state ──────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-[#003366]" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-8 text-slate-500 flex items-center gap-2">
        <AlertCircle size={18} /> Failed to load overview data.
      </div>
    );
  }

  // ── Palette ────────────────────────────────────────────────────

  const STATUS_COLORS = {
    Approved: "#10b981",
    Pending: "#f59e0b",
    Rejected: "#ef4444",
    Edited: "#3b82f6",
  };

  const DEPT_COLORS = [
    "#003366", "#0369a1", "#0891b2", "#0d9488",
    "#059669", "#65a30d", "#ca8a04",
  ];

  const CATEGORY_COLORS = [
    "#6366f1", "#8b5cf6", "#a855f7", "#d946ef",
    "#ec4899", "#f43f5e", "#ef4444", "#f97316",
    "#f59e0b", "#84cc16", "#22c55e", "#14b8a6", "#06b6d4",
  ];

  // ── Build chart data ───────────────────────────────────────────

  const eventStatusData = Object.entries(stats.statusCounts)
    .filter(([, v]) => v > 0)
    .map(([key, value]) => ({
      label: key.charAt(0).toUpperCase() + key.slice(1),
      value,
      color: STATUS_COLORS[key.charAt(0).toUpperCase() + key.slice(1)] || "#94a3b8",
    }));

  const deptData = Object.entries(stats.deptCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([label, value], i) => ({
      label,
      value,
      color: DEPT_COLORS[i % DEPT_COLORS.length],
    }));

  const categoryData = Object.entries(stats.categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([label, value], i) => ({
      label,
      value,
      color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
    }));

  const categoryColorMap = {};
  categoryData.forEach((d) => { categoryColorMap[d.label] = d.color; });

  // ── Render ─────────────────────────────────────────────────────

  return (
    <div className="w-full max-w-6xl">
      {/* Header */}
      <header className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">System Overview</h1>
          <p className="text-sm text-slate-500">
            A high‑level snapshot of the Campus Event Management System.
          </p>
        </div>
        <button
          onClick={() => fetchStats(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          Refresh
        </button>
      </header>

      {/* ── KPI Cards ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard icon={GraduationCap} label="Number of Students" value={stats.totalStudents} accent="#003366" />
        <StatCard 
          icon={Building2} 
          label="Approved Organizers" 
          value={stats.totalOrganizers} 
          accent="#0891b2" 
          sub={stats.pendingOrganizers > 0 ? `${stats.pendingOrganizers} pending approval` : "All reviewed"} 
          onClick={() => setShowOrganizersModal(true)}
        />
        <StatCard icon={Calendar} label="Total Events Posted" value={stats.totalEvents} accent="#7c3aed" sub={`${stats.upcomingEvents} upcoming · ${stats.pastEvents} past`} />
      </div>

      {/* ── Charts ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Event Status Donut */}
        <ChartCard title="Events by Status" icon={PieChartIcon}>
          {eventStatusData.length > 0 ? (
            <DonutChart data={eventStatusData} />
          ) : (
            <p className="text-sm text-slate-400 italic text-center py-8">No events yet</p>
          )}
        </ChartCard>

        {/* Events by Category */}
        <ChartCard title="Events by Category" icon={Activity}>
          <BarChart data={categoryData} colorMap={categoryColorMap} />
        </ChartCard>
      </div>

      {/* Organizers Modal */}
      {showOrganizersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Building2 size={20} className="text-[#0891b2]" /> Approved Organizers
              </h2>
              <button onClick={() => setShowOrganizersModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-200">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              {stats.approvedOrganizers?.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {stats.approvedOrganizers.map(org => (
                    <div key={org.id} className="p-4 border border-slate-100 rounded-xl hover:border-slate-300 transition-colors flex items-center gap-4 bg-slate-50/50">
                      <div className="w-10 h-10 rounded-full bg-[#0891b2]/10 flex items-center justify-center text-[#0891b2] font-bold shrink-0">
                        {org.organizer_name?.charAt(0).toUpperCase() || "O"}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-slate-800 text-sm truncate">{org.organizer_name}</h3>
                        <p className="text-xs text-slate-500 truncate">{org.profiles?.first_name} {org.profiles?.last_name} • {org.organizer_type}</p>
                        <p className="text-xs text-slate-400 mt-0.5 truncate">{org.profiles?.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-slate-500 py-8 text-sm">No approved organizers found.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Small helpers ────────────────────────────────────────────────────────────

const MiniStat = ({ icon: Icon, label, value, color }) => (
  <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex items-center gap-3 shadow-sm">
    <Icon size={16} style={{ color }} className="shrink-0" />
    <div className="min-w-0">
      <p className="text-lg font-bold text-[#0F172A] leading-tight">{value}</p>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
    </div>
  </div>
);

const ChartCard = ({ title, icon: Icon, children }) => (
  <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
    <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
      {Icon && <Icon size={16} className="text-slate-400" />}
      <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-500">{title}</h3>
    </div>
    <div className="p-6">{children}</div>
  </div>
);

export default Overview;
