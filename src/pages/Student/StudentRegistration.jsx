import React, { useState, useEffect } from 'react';
import { IdCard, Mail, Lock, Phone, Search, Filter, Bell } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useNavigate, Link } from 'react-router-dom';
import { useNotification } from '../../context/NotificationContext';

const StudentRegistration = () => {
  const { showNotification } = useNotification();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    studentId: '',
    department: '',
    batchYear: '',
    email: '',
    phone: '',
    password: '',
  });

  const [batchYears, setBatchYears] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const years = [];
    for (let year = 2018; year >= 2013; year--) years.push(year.toString());
    setBatchYears(years);
  }, []);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    if (id === 'studentId') {
      if (value.length !== 8) e.target.setCustomValidity("Student ID must be exactly 8 characters.");
      else e.target.setCustomValidity("");
    }
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validDepartments = [
      'Accounting & Finance',
      'Management',
      'Marketing Management',
      'Computer Science',
      'Economics',
      'Architecture and Urban Planning',
      'Nursing'
    ];

    if (!validDepartments.includes(formData.department)) {
      showNotification('Invalid department selected.', 'error');
      return;
    }

    if (!batchYears.includes(formData.batchYear)) {
      showNotification('Invalid batch year.', 'error');
      return;
    }

    if (formData.studentId.length !== 8) {
      showNotification('Student ID must be exactly 8 characters.', 'error');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            phone_number: formData.phone,
            role: 'student',
            student_id_number: formData.studentId,
            department: formData.department,
            batch_year: formData.batchYear
          }
        }
      });

      if (error) throw error;

      // If session exists, user is automatically logged in
      if (data.session) {
        navigate('/event-discovery'); // redirect to home page
      } else {
        showNotification('Registration successful! Please check your email.', 'success');
      }

      // reset form
      setFormData({
        firstName: '',
        lastName: '',
        studentId: '',
        department: '',
        batchYear: '',
        email: '',
        phone: '',
        password: '',
      });

    } catch (error) {
      if (error.message.includes('already registered')) {
        showNotification('This email is already registered.', 'error');
      } else if (error.message.includes('duplicate key')) {
        showNotification('Student ID already exists.', 'error');
      } else {
        showNotification(`Error: ${error.message}`, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex flex-col lg:flex-row h-screen w-screen overflow-hidden font-sans bg-white">
      {/* Left Section */}
      <section className="w-full lg:w-3/5 p-6 md:p-12 lg:p-16 flex flex-col justify-center overflow-hidden">
        <div className="max-w-xl mx-auto w-full">
          <header className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Create Student Account
            </h1>
            <p className="text-gray-500 text-sm">
              Join the centralized platform for campus opportunities.
            </p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Identity */}
            <section className="space-y-3">
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                Personal Identity
              </h2>
              <div className="space-y-3">
                <input
                  type="text"
                  id="firstName"
                  placeholder="First Name"
                  required
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-unity-blue outline-none transition text-sm"
                />
                <input
                  type="text"
                  id="lastName"
                  placeholder="Last Name"
                  required
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-unity-blue outline-none transition text-sm"
                />
              </div>
            </section>

            {/* Academic Details */}
            <section className="space-y-3">
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                Academic Details
              </h2>
              <div className="space-y-3">
                <div className="relative">
                  <IdCard className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    id="studentId"
                    maxLength={8}
                    placeholder="Student ID"
                    required
                    value={formData.studentId}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-unity-blue outline-none transition text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <select
                    id="department"
                    required
                    value={formData.department}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-unity-blue outline-none transition appearance-none cursor-pointer text-sm text-gray-600"
                  >
                    <option value="" disabled>Department</option>
                    {['Accounting & Finance','Management','Marketing Management','Computer Science','Economics','Architecture and Urban Planning','Nursing'].map(dep => (
                      <option key={dep}>{dep}</option>
                    ))}
                  </select>

                  <select
                    id="batchYear"
                    required
                    value={formData.batchYear}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-unity-blue outline-none transition appearance-none cursor-pointer text-sm text-gray-600"
                  >
                    <option value="" disabled>Batch Year</option>
                    {batchYears.map(year => <option key={year} value={year}>{year}</option>)}
                  </select>
                </div>
              </div>
            </section>

            {/* Contact & Login */}
            <section className="space-y-3">
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                Contact & Login Details
              </h2>
              <div className="space-y-3">
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                  <input
                    type="email"
                    id="email"
                    placeholder="Email Address"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-unity-blue outline-none transition text-sm"
                  />
                </div>

                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                  <input
                    type="tel"
                    id="phone"
                    placeholder="Phone Number"
                    required
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-unity-blue outline-none transition text-sm"
                  />
                </div>

                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                  <input
                    type="password"
                    id="password"
                    placeholder="Password"
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-unity-blue outline-none transition text-sm"
                  />
                </div>
              </div>
            </section>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-unity-blue text-white py-3.5 rounded-lg font-semibold hover:bg-opacity-90 transition shadow-md active:scale-[0.98] disabled:opacity-70"
            >
              {loading ? "Registering..." : "Register"}
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
        <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-unity-yellow/5 rounded-full blur-3xl" />
        <div className="max-w-xs mx-auto relative z-10">
          <h2 className="text-xl font-bold text-unity-yellow mb-8">Why join us?</h2>
          <div className="space-y-8">
            <Feature icon={<Search />} title="Stop Hunting" desc="Find every campus opportunity in one centralized, reliable feed." />
            <Feature icon={<Filter />} title="Tailored to You" desc="Find events that actually match your interests and schedule." />
            <Feature icon={<Bell />} title="Never Miss a Beat" desc="Get instant notifications on venue changes and confirmations." />
          </div>
        </div>
      </section>
    </main>
  );
};

const Feature = ({ icon, title, desc }) => (
  <div className="flex gap-4">
    <div className="bg-white/10 p-2 rounded-lg h-fit">
      <div className="w-5 h-5 text-unity-yellow">{icon}</div>
    </div>
    <div>
      <h3 className="font-bold text-sm text-white">{title}</h3>
      <p className="text-xs text-slate-300 mt-1 leading-relaxed">{desc}</p>
    </div>
  </div>
);

export default StudentRegistration;