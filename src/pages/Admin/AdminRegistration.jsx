import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../../context/NotificationContext';

const AdminRegistrationForm = () => {
  const { showNotification } = useNotification();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
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
            first_name: formData.firstName,
            last_name: formData.lastName,
            phone_number: formData.phone,
            role: 'admin', // mark user as admin
          }
        }
      });

      if (error) throw error;

      if (data.session) {
        // auto-login if session exists
        navigate('/admin-dashboard'); 
      } else {
        showNotification('Admin registered successfully! Check email for confirmation.', 'success');
      }

      // reset form
      setFormData({ firstName: '', lastName: '', email: '', phone: '', password: '' });

    } catch (err) {
      if (err.message.includes('already registered')) {
        showNotification('This email is already registered.', 'error');
      } else {
        showNotification(`Error: ${err.message}`, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16 p-6 bg-white rounded-xl shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Register Admin</h2>

      <form onSubmit={handleSubmit} className="space-y-4">

        <input
          type="text"
          id="firstName"
          placeholder="First Name"
          value={formData.firstName}
          onChange={handleChange}
          required
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-unity-blue"
        />

        <input
          type="text"
          id="lastName"
          placeholder="Last Name"
          value={formData.lastName}
          onChange={handleChange}
          required
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-unity-blue"
        />

        <input
          type="email"
          id="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          required
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-unity-blue"
        />

        <input
          type="tel"
          id="phone"
          placeholder="Phone Number"
          value={formData.phone}
          onChange={handleChange}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-unity-blue"
        />

        <input
          type="password"
          id="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          required
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-unity-blue"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-unity-blue text-white py-2 rounded-lg font-bold hover:bg-unity-navy transition-colors"
        >
          {loading ? 'Registering...' : 'Register Admin'}
        </button>
      </form>
    </div>
  );
};

export default AdminRegistrationForm;