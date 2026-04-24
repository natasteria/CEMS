import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { 
  User, Building2, Mail, Phone, Calendar, 
  Check, X, Loader2, ShieldCheck
} from 'lucide-react';

const OrganizerProfile = ({ organizerData, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    orgName: ''
  });

  useEffect(() => {
    if (organizerData) {
      setFormData({
        firstName: organizerData.first_name || '',
        lastName: organizerData.last_name || '',
        phone: organizerData.phone_number || '',
        orgName: organizerData.organizers?.[0]?.organizer_name || ''
      });
    }
  }, [organizerData]);

  const handleSave = async () => {
    setLoading(true);
    try {
      // 1. Update Profiles Table
      const { error: pError } = await supabase
        .from('profiles')
        .update({
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone_number: formData.phone
        })
        .eq('id', organizerData.id);

      if (pError) throw pError;

      // 2. Update Organizers Table 
      // FIX: Using 'id' based on your error. It matches the Auth ID.
      const { error: oError } = await supabase
        .from('organizers')
        .update({ organizer_name: formData.orgName })
        .eq('id', organizerData.id); // Changed from o_id to id

      if (oError) throw oError;

      alert("Profile updated successfully!");
      setIsEditing(false);
      if (onUpdate) await onUpdate(); // Refresh the dashboard data

    } catch (err) {
      console.error(err);
      alert("Update failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = () => {
    const f = formData.firstName?.charAt(0) || "";
    const l = formData.lastName?.charAt(0) || "";
    return (f + l).toUpperCase() || "OR";
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
      
      {/* ── HEADER ── */}
      <div className="mb-8">
        <h1 className="text-2xl font-black text-[#0f172a]">Organizer Profile</h1>
        <p className="text-slate-500 text-sm">View and manage your organization account information.</p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 md:p-12">
        
        {/* ── TOP SECTION (Avatar & Buttons) ── */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-24 h-24 bg-[#1e3a8a] rounded-full flex items-center justify-center text-white text-3xl font-black">
                {getInitials()}
              </div>
              <div className="absolute bottom-1 right-1 w-5 h-5 bg-[#22c55e] border-4 border-white rounded-full"></div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#0f172a]">{formData.firstName} {formData.lastName}</h2>
              <div className="flex items-center gap-2 text-slate-400 text-sm mt-1">
                 <ShieldCheck size={16} className="text-yellow-500" />
                 <span>Verified Organizer</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            {!isEditing ? (
              <button 
                onClick={() => setIsEditing(true)}
                className="px-8 py-2.5 bg-[#003366] text-white rounded-xl font-bold text-sm hover:brightness-110 transition-all"
              >
                Edit Profile
              </button>
            ) : (
              <>
                <button 
                  onClick={() => setIsEditing(false)}
                  className="px-6 py-2.5 bg-white border border-slate-200 text-slate-500 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all flex items-center gap-2"
                >
                  <X size={16} /> Cancel
                </button>
                <button 
                  onClick={handleSave}
                  disabled={loading}
                  className="px-8 py-2.5 bg-[#eab308] text-white rounded-xl font-bold text-sm hover:brightness-105 transition-all flex items-center gap-2"
                >
                  {loading ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />}
                  Save Changes
                </button>
              </>
            )}
          </div>
        </div>

        {/* ── FORM FIELDS (Matching Admin Sample Style) ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 border-t border-slate-100 pt-12">
            
            <InputGroup 
              label="FIRST NAME" 
              icon={<User size={18}/>} 
              value={formData.firstName}
              isEditing={isEditing}
              onChange={(val) => setFormData({...formData, firstName: val})}
            />

            <InputGroup 
              label="LAST NAME" 
              icon={<User size={18}/>} 
              value={formData.lastName}
              isEditing={isEditing}
              onChange={(val) => setFormData({...formData, lastName: val})}
            />

            <InputGroup 
              label="ORGANIZATION NAME" 
              icon={<Building2 size={18}/>} 
              value={formData.orgName}
              isEditing={isEditing}
              onChange={(val) => setFormData({...formData, orgName: val})}
            />

            <InputGroup 
              label="PHONE NUMBER" 
              icon={<Phone size={18}/>} 
              value={formData.phone}
              isEditing={isEditing}
              onChange={(val) => setFormData({...formData, phone: val})}
            />

            <div className="flex items-center gap-4 opacity-70">
              <div className="p-3 bg-slate-50 rounded-xl text-slate-400"><Mail size={18}/></div>
              <div className="flex-1">
                <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Email Address</label>
                <p className="text-sm font-bold text-[#1e293b]">{organizerData?.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 opacity-70">
              <div className="p-3 bg-slate-50 rounded-xl text-slate-400"><Calendar size={18}/></div>
              <div className="flex-1">
                <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Account Created</label>
                <p className="text-sm font-bold text-[#1e293b]">April 20, 2026</p>
              </div>
            </div>

        </div>
      </div>
    </div>
  );
};

// Sub-component for Inputs
const InputGroup = ({ label, icon, value, isEditing, onChange }) => (
  <div className="flex items-center gap-4 group">
    <div className={`p-3 rounded-xl transition-all ${isEditing ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-400'}`}>
      {icon}
    </div>
    <div className="flex-1">
      <label className="block text-[10px] font-black text-slate-400 mb-1 uppercase tracking-wider">{label}</label>
      {isEditing ? (
        <input 
          type="text" 
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-[#1e293b] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
        />
      ) : (
        <p className="text-sm font-bold text-[#1e293b]">{value || "Not set"}</p>
      )}
    </div>
  </div>
);

export default OrganizerProfile;