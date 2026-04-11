import React, { useState } from 'react';
import { Building2, Mail, Lock, Phone, ChevronDown, Search, Filter, Bell } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';

const OrganizerRegistration = () => {
  const [formData, setFormData] = useState({
    organizerName: '',
    organizerType: '',
    email: '',
    phone: '',
    password: ''
  });

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            role: 'organizer',
            phone_number: formData.phone,
            organizer_name: formData.organizerName,
            organizer_type: formData.organizerType
          }
        }
      });

      if (error) throw error;

      // Navigate to pending review page
      if (data.session) {
        navigate('/organizer-pending');
      }
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-white font-sans">
      <main className="flex flex-col lg:flex-row h-full">
        {/* Left Section: Form */}
        <section className="w-full lg:w-3/5 p-6 md:p-12 lg:p-16 bg-white flex flex-col justify-center overflow-y-auto">
          <div className="max-w-xl mx-auto w-full">
            <header className="mb-8">
              <h1 className="text-3xl font-black text-unity-navy tracking-tight">
                Create Organizer Account
              </h1>
              <p className="text-slate-500 text-sm mt-2 font-medium">
                Register your department or club to start hosting campus events.
              </p>
            </header>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Organization Identity */}
              <section className="space-y-4">
                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100 pb-2">
                  Organization Identity
                </h2>
                <div className="space-y-3">
                  <div className="relative">
                    <Building2 className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
                    <input
                      type="text"
                      name="organizerName"
                      placeholder="Organizer Name (e.g. CS Department)"
                      required
                      value={formData.organizerName}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-unity-blue outline-none transition text-sm font-medium"
                    />
                  </div>
                  <div className="relative">
                    <select
                      name="organizerType"
                      required
                      value={formData.organizerType}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-unity-blue outline-none transition appearance-none cursor-pointer text-sm font-medium text-slate-700"
                    >
                      <option value="" disabled>Select Organizer Type</option>
                      <option value="student-club">Student Club</option>
                      <option value="academic-department">Academic Department</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-3.5 text-slate-400 w-4 h-4 pointer-events-none" />
                  </div>
                </div>
              </section>

              {/* Contact & Security */}
              <section className="space-y-4 pt-2">
                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100 pb-2">
                  Contact & Login Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
                    <input
                      type="email"
                      name="email"
                      placeholder="Email Address"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-unity-blue outline-none transition text-sm font-medium"
                    />
                  </div>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
                    <input
                      type="tel"
                      name="phone"
                      placeholder="Phone Number"
                      required
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-unity-blue outline-none transition text-sm font-medium"
                    />
                  </div>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
                  <input
                    type="password"
                    name="password"
                    placeholder="Create Password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-unity-blue outline-none transition text-sm font-medium"
                  />
                </div>
              </section>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-unity-blue text-white py-4 rounded-xl font-bold hover:bg-unity-navy transition-all shadow-lg shadow-blue-900/20 active:scale-[0.98] disabled:opacity-70"
              >
                {loading ? "Registering..." : "Create Organizer Account"}
              </button>

            <p className="text-center text-sm text-gray-500">
              Already have an account?{" "}
              <Link
                to="/"
                className="text-unity-blue font-semibold hover:underline"
              >
                Login
              </Link>
            </p>
            </form>
          </div>
        </section>

        {/* Right Section */}
        <section className="hidden lg:flex lg:w-2/5 p-16 bg-gradient-to-br from-unity-blue to-unity-navy border-l border-white/10 items-center relative overflow-hidden">
          <div className="absolute top-[-10%] right-[-10%] w-80 h-80 bg-unity-yellow/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-white/5 rounded-full blur-2xl"></div>
          <div className="max-w-xs mx-auto relative z-10">
            <h2 className="text-2xl font-black text-unity-yellow mb-10 tracking-tight">
              Empower Your Community
            </h2>
            <div className="space-y-10">
              <FeatureItem icon={<Search className="w-5 h-5 text-unity-yellow" />} title="Direct Visibility" description="Put your events directly in front of thousands of active students." />
              <FeatureItem icon={<Filter className="w-5 h-5 text-unity-yellow" />} title="Targeted Reach" description="Filter your audience by department or batch for maximum relevance." />
              <FeatureItem icon={<Bell className="w-5 h-5 text-unity-yellow" />} title="Instant Updates" description="Notify all registered attendees about venue or time changes instantly." />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

const FeatureItem = ({ icon, title, description }) => (
  <div className="flex gap-5 group">
    <div className="bg-white/10 p-3 rounded-2xl h-fit border border-white/10 group-hover:bg-white/20 transition-colors">
      {icon}
    </div>
    <div>
      <h3 className="font-bold text-base text-white tracking-tight">{title}</h3>
      <p className="text-xs text-slate-300 mt-2 leading-relaxed font-medium">{description}</p>
    </div>
  </div>
);

export default OrganizerRegistration;