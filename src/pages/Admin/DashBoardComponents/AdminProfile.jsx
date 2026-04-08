import React, { useState, useEffect } from "react";
import { User, Mail, Phone, ShieldCheck, Calendar, Pencil, X, Check } from "lucide-react";
import { supabase } from "../../../lib/supabaseClient";

const AdminProfile = () => {
  const [adminProfile, setAdminProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
  });

  // Fetch admin profile dynamically
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error) throw error;

        setAdminProfile(data);
        setFormData({
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          email: data.email || "",
          phone_number: data.phone_number || "",
        });
      } catch (err) {
        console.error("Failed to fetch profile:", err.message);
      }
    };

    fetchProfile();
  }, []);

  if (!adminProfile) {
    return <div className="p-8 text-slate-500">Loading profile...</div>;
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleEdit = () => {
    if (isEditing) {
      // revert changes if canceling
      setFormData({
        first_name: adminProfile.first_name || "",
        last_name: adminProfile.last_name || "",
        email: adminProfile.email || "",
        phone_number: adminProfile.phone_number || "",
      });
    }
    setIsEditing(!isEditing);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Only update editable fields
      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone_number: formData.phone_number,
        })
        .eq("id", user.id);

      if (error) throw error;

      // update local state to reflect changes immediately
      setAdminProfile((prev) => ({
        ...prev,
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone_number: formData.phone_number,
      }));

      setIsEditing(false);
    } catch (err) {
      console.error(err);
      alert("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full max-w-5xl p-6">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-[#0F172A]">Administrator Profile</h1>
        <p className="text-sm text-slate-500">
          View and manage your administrator account information.
        </p>
      </header>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-8">

          {/* Avatar + Name */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10 pb-6 border-b border-slate-100">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-[#1E3A8A] flex items-center justify-center text-white text-2xl font-bold">
                  {formData.first_name?.charAt(0)}
                  {formData.last_name?.charAt(0)}
                </div>
                <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
              </div>

              <div>
                <h2 className="text-xl font-bold text-[#0F172A]">
                  {formData.first_name} {formData.last_name}
                </h2>
                <div className="flex items-center gap-2 text-sm text-slate-500 mt-0.5">
                  <ShieldCheck size={16} className="text-[#FACC15]" />
                  <span>System Administrator</span>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              {!isEditing ? (
                <button
                  onClick={toggleEdit}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <Pencil size={16} /> Edit Profile
                </button>
              ) : (
                <>
                  <button
                    onClick={toggleEdit}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <X size={16} /> Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#EAB308] rounded-lg hover:bg-yellow-600 transition-colors shadow-sm disabled:opacity-50"
                  >
                    <Check size={16} /> {saving ? "Saving..." : "Save Changes"}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Profile Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
            <ProfileField label="First Name" icon={<User size={18} />} isEditing={isEditing} name="first_name" value={formData.first_name} onChange={handleInputChange} />
            <ProfileField label="Last Name" icon={<User size={18} />} isEditing={isEditing} name="last_name" value={formData.last_name} onChange={handleInputChange} />

            {/* Email read-only */}
            <ProfileField label="Email Address" icon={<Mail size={18} />} isEditing={false} value={formData.email} />

            <ProfileField label="Phone Number" icon={<Phone size={18} />} isEditing={isEditing} name="phone_number" value={formData.phone_number} placeholder="Not provided" onChange={handleInputChange} />

            {/* Role */}
            <div className="flex items-start gap-4">
              <div className="p-2.5 bg-slate-50 rounded-xl text-slate-400 border border-slate-100">
                <ShieldCheck size={18} />
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Role</p>
                <p className="text-slate-700 font-medium capitalize">{adminProfile.role}</p>
              </div>
            </div>

            {/* Account Created */}
            <div className="flex items-start gap-4">
              <div className="p-2.5 bg-slate-50 rounded-xl text-slate-400 border border-slate-100">
                <Calendar size={18} />
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Account Created</p>
                <p className="text-slate-700 font-medium">
                  {new Date(adminProfile.created_at).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

const ProfileField = ({ label, icon, isEditing, name, value, onChange, type = "text", placeholder }) => (
  <div className="flex items-start gap-4">
    <div className="p-2.5 bg-slate-50 rounded-xl text-slate-500 border border-slate-100">{icon}</div>
    <div className="flex-1">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{label}</p>
      {isEditing ? (
        <input type={type} name={name} value={value} onChange={onChange} placeholder={placeholder} className="w-full px-3 py-2 text-slate-700 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" />
      ) : (
        <p className="text-[#334155] font-semibold">{value || placeholder || "—"}</p>
      )}
    </div>
  </div>
);

export default AdminProfile;