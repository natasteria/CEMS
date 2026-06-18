import React, { useState } from 'react';
import uuLogo from '../assets/uu.png';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

const LoginPage = () => {

  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError(null);

      // 1️⃣ Authenticate with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      const user = data.user;

      // 2️⃣ Fetch role from profiles
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      const role = profile.role;

      // 3️⃣ Check status depending on role

      if (role === "student") {

        const { data: student, error: studentError } = await supabase
          .from("students")
          .select("account_status")
          .eq("id", user.id)
          .single();

        if (studentError) throw studentError;

        if (student.account_status === "banned") {
          await supabase.auth.signOut();
          throw new Error("Your account has been banned.");
        }

        navigate("/event-discovery");
      }

    else if (role === "organizer") {

    const { data: organizer, error: organizerError } = await supabase
        .from("organizers")
        .select("account_status, registration_status")
        .eq("id", user.id)
        .single();

    if (organizerError) throw organizerError;

    // 1️⃣ Check banned
    if (organizer.account_status === "banned") {
        await supabase.auth.signOut();
        throw new Error("Your organizer account has been banned.");
    }

    // 2️⃣ Check registration approval
    if (organizer.registration_status !== "approved") {
        navigate("/organizer-pending");
        return;
    }

    // 3️⃣ Approved organizers go to dashboard
    navigate("/organizer-dashboard");
    }

      else if (role === "admin") {

        navigate("/admin-dashboard");

      }

      else {
        throw new Error("Invalid role assigned to this account.");
      }

    } catch (err) {
      setError(err.message);
    }

    finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden font-sans bg-white text-slate-900">

      {/* LEFT SIDE */}
      <section className="flex-1 flex items-center justify-center p-8 lg:p-16">

        <div className="w-full max-w-[380px]">

          <header className="mb-10">
            <h1 className="text-3xl font-extrabold tracking-tight text-unity-navy mb-2">
              Welcome Back
            </h1>
            <p className="text-sm text-gray-500">
              Access the Unity University Campus Core system.
            </p>
          </header>

          <form onSubmit={handleLogin} className="space-y-6">

            {error && (
              <p className="text-red-500 text-sm">
                {error}
              </p>
            )}

            <div className="space-y-2">

              <label
                htmlFor="email"
                className="block text-[10px] font-bold uppercase tracking-wider text-gray-500"
              >
                 Email
              </label>

              <input
                id="email"
                type="email"
                required
                placeholder="name@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-3 rounded-lg border border-gray-200 bg-slate-50 text-sm outline-none transition-all focus:border-unity-blue focus:bg-white focus:ring-4 focus:ring-unity-blue/10"
              />

            </div>

            <div className="space-y-2">

              <label
                htmlFor="password"
                className="block text-[10px] font-bold uppercase tracking-wider text-gray-500"
              >
                Password
              </label>

              <input
                id="password"
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-3 rounded-lg border border-gray-200 bg-slate-50 text-sm outline-none transition-all focus:border-unity-blue focus:bg-white focus:ring-4 focus:ring-unity-blue/10"
              />

            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 mt-4 bg-unity-blue text-white rounded-lg text-sm font-semibold transition-all hover:bg-blue-800 hover:shadow-lg hover:shadow-unity-blue/20 active:scale-[0.98]"
            >
              {loading ? "Signing In..." : "Sign In"}
            </button>

          </form>

          <footer className="mt-8 text-center text-sm space-y-3">

            <p className="text-gray-500">
              Need an account? Register as{' '}
              <Link
                to={"/register-student"}
                className="text-unity-blue font-semibold hover:underline"
              >
                Student
              </Link>{' '}
              or{' '}
              <Link
                to={"/register-organizer"}
                className="text-unity-blue font-semibold hover:underline"
              >
                Organizer
              </Link>
            </p>

            <p>
              <Link
                to="/password-reset/forgot-password"
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                Forgot Password?
              </Link>
            </p>

          </footer>

        </div>

      </section>

      {/* RIGHT SIDE */}
      <section className="hidden md:flex flex-[1.2] flex-col justify-center p-20 bg-gradient-to-br from-unity-blue to-unity-navy text-white relative overflow-hidden border-l border-white/10">

        <div className="absolute -top-[10%] -right-[10%] w-[400px] h-[400px] bg-[radial-gradient(circle,rgba(250,204,21,0.05)_0%,transparent_70%)] pointer-events-none" />

        <div className="mb-8">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center p-1.5 shadow-2xl">
            <img
              src={uuLogo}
              alt="Unity University Logo"
              className="w-full h-auto"
            />
          </div>
        </div>

        <div className="uppercase tracking-[0.2em] text-[10px] font-bold text-unity-yellow mb-4">
          Unity University Campus Core
        </div>

        <h2 className="text-5xl font-extrabold leading-[1.1] tracking-tighter mb-6">
          Empowering <br /> Campus Life
        </h2>

        <p className="text-lg leading-relaxed text-slate-300 max-w-md">
          Access your personalized dashboard to manage, discover, and engage
          with Unity University events.
        </p>

      </section>

    </div>
  );
};

export default LoginPage;

