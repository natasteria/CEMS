import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import uuLogo from '../../assets/uu.png';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError('');

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setSubmitted(true);
    } catch (err) {
      setError(err.message);
    } finally {
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
              Forgot Password
            </h1>
            <p className="text-sm text-gray-500">
              Enter your email and we&apos;ll send you a reset link.
            </p>
          </header>

          {submitted ? (
            <div className="space-y-6">
              <p className="text-sm text-gray-600 leading-relaxed">
                If an account exists for{' '}
                <span className="font-semibold text-slate-900">{email}</span>,
                you will receive password reset instructions shortly.
              </p>

              <Link
                to="/"
                className="inline-block w-full py-3.5 text-center bg-unity-blue text-white rounded-lg text-sm font-semibold transition-all hover:bg-blue-800 hover:shadow-lg hover:shadow-unity-blue/20 active:scale-[0.98]"
              >
                Back to Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">

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

              {error && (
                <p className="text-red-500 text-sm">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 mt-4 bg-unity-blue text-white rounded-lg text-sm font-semibold transition-all hover:bg-blue-800 hover:shadow-lg hover:shadow-unity-blue/20 active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>

            </form>
          )}

          {!submitted && (
            <footer className="mt-8 text-center text-sm">
              <Link
                to="/"
                className="text-unity-blue font-semibold hover:underline"
              >
                Back to Sign In
              </Link>
            </footer>
          )}

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
}