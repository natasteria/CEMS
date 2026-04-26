import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { 
  User, Building2, Mail, Phone, Calendar, 
  Check, X, Loader2, ShieldCheck, Fingerprint
} from 'lucide-react';

const OrganizerProfile = ({ organizerData, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    orgName: '',
    orgType: '' // Added to match schema
  });

  // Load data from the joined database object
  useEffect(() => {
    if (organizerData) {
      setFormData({
        firstName: organizerData.first_name || '',
        lastName: organizerData.last_name || '',
        phone: organizerData.phone_number || '',
        // In your schema, organizers is likely a single object or an array of 1
        orgName: organizerData.organizers?.organizer_name || organizerData.organizers?.[0]?.organizer_name || '',
        orgType: organizerData.organizers?.organizer_type || organizerData.organizers?.[0]?.organizer_type || 'Other'
      });
    }
  }, [organizerData]);

  const handleSave = async () => {
    if (!formData.orgName.trim()) {
      alert("Organization Name cannot be empty");
      return;
    }

    setLoading(true);
    try {
      // 1. Update PROFILES table (matches schema: first_name, last_name, phone_number)
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone_number: formData.phone
        })
        .eq('id', organizerData.id);

      if (profileError) throw profileError;

      // 2. Update ORGANIZERS table (matches schema: id, organizer_name, organizer_type)
      // We use upsert in case the row doesn't exist yet for this profile ID
      const { error: orgError } = await supabase
        .from('organizers')
        .upsert({
          id: organizerData.id, // Primary Key in your schema
          organizer_name: formData.orgName,
          organizer_type: formData.orgType || 'Other' // Required by your schema NOT NULL
        }, { onConflict: 'id' });

      if (orgError) throw orgError;

      // 3. Close editing and trigger parent to re-fetch data from DB
      setIsEditing(false);
      if (onUpdate) await onUpdate(); 
      
      alert("Profile updated successfully!");
    } catch (err) {
      console.error("Save error:", err);
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = () => {
    return `${formData.firstName?.charAt(0) || ''}${formData.lastName?.charAt(0) || ''}`.toUpperCase() || "OR";
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 px-2">
        <div>
          <h1 className="text-3xl font-black text-[#003366] tracking-tight">Organizer Profile</h1>
          <p className="text-slate-400 text-sm font-medium">Manage your campus organization identity.</p>
        </div>
        
        <div className="flex gap-3">
          {!isEditing ? (
            <button 
              onClick={() => setIsEditing(true)}
              className="px-6 py-2.5 bg-[#003366] text-white rounded-xl font-bold text-sm hover:shadow-lg transition-all active:scale-95"
            >
              Edit Profile
            </button>
          ) : (
            <>
              <button 
                onClick={() => setIsEditing(false)}
                className="px-5 py-2.5 bg-slate-100 text-slate-500 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all flex items-center gap-2"
              >
                <X size={16} /> Cancel
              </button>
              <button 
                onClick={handleSave}
                disabled={loading}
                className="px-7 py-2.5 bg-[#facc15] text-[#003366] rounded-xl font-black text-sm hover:brightness-105 transition-all shadow-lg flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />}
                Save Changes
              </button>
            </>
          )}
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-2xl shadow-slate-200/40 overflow-hidden">
        {/* AVATAR BAR */}
        <div className="bg-slate-50/50 p-6 md:p-10 border-b border-slate-100 flex flex-col md:flex-row items-center gap-6 md:gap-8">
           <div className="relative">
              <div className="w-24 h-24 md:w-28 md:h-28 bg-[#003366] rounded-full flex items-center justify-center text-white text-3xl md:text-4xl font-black shadow-xl">
                {getInitials()}
              </div>
              <div className="absolute -bottom-1 -right-1 bg-emerald-500 p-2 rounded-full border-4 border-white shadow-lg">
                <ShieldCheck size={16} className="text-white" />
              </div>
           </div>
           <div className="text-center md:text-left">
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                {formData.firstName} {formData.lastName}
              </h2>
              <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 mt-2">
                 <p className="text-blue-600 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                    <Building2 size={14}/> {formData.orgName || "No Organization Set"}
                 </p>
                 <span className="hidden md:block text-slate-300">|</span>
                 <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest flex items-center gap-2">
                    <Fingerprint size={14} /> ID: {organizerData?.id?.slice(0,8)}
                 </p>
              </div>
           </div>
        </div>

        {/* FIELDS GRID */}
        <div className="p-6 md:p-12 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
            <ProfileField 
              label="FIRST NAME" 
              value={formData.firstName} 
              isEditing={isEditing} 
              onChange={(v) => setFormData({...formData, firstName: v})} 
            />
            <ProfileField 
              label="LAST NAME" 
              value={formData.lastName} 
              isEditing={isEditing} 
              onChange={(v) => setFormData({...formData, lastName: v})} 
            />
            <ProfileField 
              label="ORGANIZATION NAME" 
              value={formData.orgName} 
              isEditing={isEditing} 
              placeholder="e.g. CS Department"
              onChange={(v) => setFormData({...formData, orgName: v})} 
            />
            <ProfileField 
              label="PHONE NUMBER" 
              value={formData.phone} 
              isEditing={isEditing} 
              placeholder="09..."
              onChange={(v) => setFormData({...formData, phone: v})} 
            />

            <div className="opacity-50 px-1">
              <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Email Address</label>
              <p className="text-sm font-bold text-slate-500 flex items-center gap-3">
                <Mail size={16} className="text-slate-300" /> {organizerData?.email}
              </p>
            </div>

            <div className="opacity-50 px-1">
              <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Account Type</label>
              <p className="text-sm font-bold text-slate-500 flex items-center gap-3 capitalize">
                <ShieldCheck size={16} className="text-slate-300" /> {organizerData?.role}
              </p>
            </div>
        </div>
      </div>
    </div>
  );
};

// Internal Field Component
const ProfileField = ({ label, value, isEditing, onChange, placeholder }) => (
  <div className="px-1">
    <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">{label}</label>
    {isEditing ? (
      <input 
        type="text" 
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white focus:border-blue-500 transition-all"
      />
    ) : (
      <p className="text-sm font-bold text-slate-700 leading-relaxed border-b border-slate-100 pb-1">
        {value || <span className="text-slate-300 italic font-normal">Not specified</span>}
      </p>
    )}
  </div>
);

export default OrganizerProfile;