import { useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { Link, useNavigate } from 'react-router-dom';
import uuLogo from '../../assets/uu.png';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  const navigate = useNavigate();

  // ✅ IMPORTANT: ensure recovery session is active
  useEffect(() => {
    const initSession = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error(error);
        setError('Failed to load session');
        return;
      }

      if (!data.session) {
        setError('Invalid or expired reset link. Please request a new one.');
        return;
      }

      setSessionReady(true);
    };

    initSession();
  }, []);

  const handleUpdatePassword = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError('');

      // ✅ double-check session before update
      const { data } = await supabase.auth.getSession();

      if (!data.session) {
        throw new Error('No active recovery session. Please use the reset link again.');
      }

      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) throw error;

      setSuccess(true);

      // optional cleanup logout
      setTimeout(async () => {
        await supabase.auth.signOut();
        navigate('/');
      }, 1500);

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
              Reset Password
            </h1>
            <p className="text-sm text-gray-500">
              Enter your new password below.
            </p>
          </header>

          {/* ❌ SESSION ERROR */}
          {error && !sessionReady ? (
            <div className="space-y-6">
              <p className="text-sm text-red-500">
                {error}
              </p>

              <Link
                to="/password-reset/forgot-password"
                className="inline-block w-full py-3.5 text-center bg-unity-blue text-white rounded-lg text-sm font-semibold"
              >
                Request New Reset Link
              </Link>
            </div>
          ) : success ? (

            /* ✅ SUCCESS STATE */
            <div className="space-y-6">
              <p className="text-sm text-gray-600 leading-relaxed">
                Your password has been updated successfully.
              </p>

              <Link
                to="/"
                className="inline-block w-full py-3.5 text-center bg-unity-blue text-white rounded-lg text-sm font-semibold"
              >
                Back to Sign In
              </Link>
            </div>

          ) : (
            /* FORM */
            <form onSubmit={handleUpdatePassword} className="space-y-6">

              <div className="space-y-2">

                <label
                  htmlFor="password"
                  className="block text-[10px] font-bold uppercase tracking-wider text-gray-500"
                >
                  New Password
                </label>

                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3.5 py-3 pr-11 rounded-lg border border-gray-200 bg-slate-50 text-sm outline-none transition-all focus:border-unity-blue focus:bg-white focus:ring-4 focus:ring-unity-blue/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

              </div>

              {error && sessionReady && (
                <p className="text-red-500 text-sm">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading || !sessionReady}
                className="w-full py-3.5 mt-4 bg-unity-blue text-white rounded-lg text-sm font-semibold transition-all hover:bg-blue-800 disabled:opacity-50"
              >
                {loading ? 'Updating...' : 'Update Password'}
              </button>

            </form>
          )}

          {!success && (
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
          Secure <br /> Your Account
        </h2>

        <p className="text-lg leading-relaxed text-slate-300 max-w-md">
          Set a new password to regain access to your Unity University dashboard.
        </p>

      </section>

    </div>
  );
}