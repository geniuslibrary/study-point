import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BookOpen, LogIn, Key, Sparkles, CheckCircle2 } from 'lucide-react';
import Button from '../components/common/Button';

export default function Login() {
  const [email, setEmail] = useState('study@gmail.com');
  const [password, setPassword] = useState('study123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, user } = useAuth();
  const navigate = useNavigate();

  // If already logged in, redirect to dashboard
  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickOwnerLogin = () => {
    setEmail('study@gmail.com');
    setPassword('study123');
    setError('');
    setLoading(true);
    login('study@gmail.com', 'study123')
      .then(() => navigate('/'))
      .catch((err) => {
        setError(err.message || 'Login failed');
        setLoading(false);
      });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden border border-indigo-100/20">
        {/* Header Branding */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 p-8 text-center text-white relative">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-md mb-3 shadow-inner">
            <BookOpen size={34} className="text-white" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight">Study Point Manager</h2>
          <p className="text-indigo-100 text-xs mt-1 font-medium">Owner Management & Billing Portal</p>
        </div>

        {/* Login Form Body */}
        <div className="p-7">
          {/* Quick Demo/Owner Card Banner */}
          <div className="mb-5 bg-indigo-50/90 border border-indigo-100 p-3.5 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-950">
                <Key className="w-4 h-4 text-indigo-600" />
                <span>Owner Credentials Pre-filled:</span>
              </div>
              <span className="text-[11px] bg-indigo-200/70 text-indigo-800 font-semibold px-2 py-0.5 rounded">
                Owner Access
              </span>
            </div>
            <div className="text-xs text-indigo-800/90 mt-1.5 font-mono bg-white/70 p-2 rounded border border-indigo-100/60 flex items-center justify-between">
              <span>📧 study@gmail.com</span>
              <span>🔑 study123</span>
            </div>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 text-red-700 p-3 rounded-xl text-xs border border-red-200 text-center font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Owner Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm outline-none transition-all"
                placeholder="study@gmail.com"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm outline-none transition-all"
                placeholder="study123"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full py-3 flex justify-center items-center gap-2 text-sm font-bold shadow-md shadow-indigo-200"
              loading={loading}
            >
              <LogIn size={18} /> Log In to Dashboard
            </Button>
          </form>

          <div className="mt-4 pt-4 border-t border-gray-100 text-center">
            <button
              type="button"
              onClick={handleQuickOwnerLogin}
              className="w-full py-2.5 px-4 bg-gray-50 hover:bg-indigo-50 text-indigo-700 border border-gray-200 hover:border-indigo-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>1-Click Owner Login (study@gmail.com)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
