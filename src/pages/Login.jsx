import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BookOpen, LogIn, Lock, Mail, Eye, EyeOff, UserPlus, ShieldCheck } from 'lucide-react';
import Button from '../components/common/Button';

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, signup, user } = useAuth();
  const navigate = useNavigate();

  // If already logged in, redirect to dashboard
  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        await signup(email, password, name || 'Study Point Owner');
      } else {
        await login(email, password);
      }
      navigate('/');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100/20 animate-in fade-in zoom-in-95 duration-200">
        {/* Header Branding */}
        <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 p-8 text-center text-white relative">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-md mb-3 shadow-inner ring-2 ring-white/20">
            <BookOpen size={32} className="text-white" />
          </div>
          <h2 className="text-2xl font-black tracking-tight">Study Point Manager</h2>
          <p className="text-indigo-100 text-xs mt-1 font-medium">
            {isSignUp ? 'Create New Owner Account' : 'Library Management & Billing Portal'}
          </p>
        </div>

        {/* Login / Signup Form */}
        <div className="p-7 sm:p-8">
          {error && (
            <div className="mb-5 bg-rose-50 text-rose-700 p-3.5 rounded-2xl text-xs border border-rose-200 font-semibold leading-relaxed">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Owner Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm outline-none transition-all"
                  placeholder="e.g. Manish Sharma"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm outline-none transition-all"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm outline-none transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full py-3 flex justify-center items-center gap-2 text-sm font-black shadow-md shadow-indigo-600/25 mt-2 rounded-xl"
              loading={loading}
            >
              {isSignUp ? <UserPlus size={18} /> : <LogIn size={18} />}
              <span>{isSignUp ? 'Create Owner Account' : 'Sign In to Dashboard'}</span>
            </Button>
          </form>

          {/* Toggle between Sign In and Sign Up */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              {isSignUp ? 'Already have an owner account?' : 'New library owner?'}
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError('');
                }}
                className="ml-1.5 font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
              >
                {isSignUp ? 'Sign In' : 'Create an Account'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
