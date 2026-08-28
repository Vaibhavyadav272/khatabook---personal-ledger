import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  Lock,
  Mail,
  User as UserIcon,
  ArrowRight,
  ShieldCheck,
  Smartphone,
  Database,
  Users,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Eye,
  EyeOff,
} from 'lucide-react';

export const AuthPage: React.FC = () => {
  const { login, signup, forgotPassword, isConfigured } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();

  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setErrorMessage('Please enter a valid email address');
      return;
    }

    if (mode === 'signup') {
      const trimmedName = name.trim();
      if (!trimmedName) {
        setErrorMessage('Please enter your full name');
        return;
      }
      if (!password) {
        setErrorMessage('Please enter a password');
        return;
      }
      if (password.length < 6) {
        setErrorMessage('Password must be at least 6 characters');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage('Passwords do not match. Please check again.');
        return;
      }

      setLoading(true);
      const res = await signup(trimmedName, trimmedEmail, password);
      setLoading(false);

      if (res.success) {
        if (res.message) {
          toastSuccess(res.message);
          setMode('login');
        } else {
          toastSuccess(`Welcome to Khatabook, ${trimmedName}!`);
        }
      } else {
        setErrorMessage(res.error || 'Failed to create account');
        toastError(res.error || 'Failed to create account');
      }
    } else if (mode === 'login') {
      if (!password) {
        setErrorMessage('Please enter your password');
        return;
      }

      setLoading(true);
      const res = await login(trimmedEmail, password);
      setLoading(false);

      if (res.success) {
        toastSuccess('Signed in successfully');
      } else {
        setErrorMessage(res.error || 'Invalid credentials');
        toastError(res.error || 'Sign in failed');
      }
    } else if (mode === 'forgot') {
      setLoading(true);
      const res = await forgotPassword(trimmedEmail);
      setLoading(false);

      if (res.success) {
        toastSuccess(res.message);
        setMode('login');
      } else {
        setErrorMessage(res.error || 'Could not send reset instructions');
        toastError(res.error || 'Error sending password reset');
      }
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Configuration Alert if Supabase Env vars missing */}
      {!isConfigured && (
        <div className="max-w-md mx-auto w-full px-4 mb-6">
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200 text-xs flex gap-3 items-start">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">Supabase Environment Setup Notice</div>
              <p className="mt-1 text-amber-800 dark:text-amber-300">
                To connect to your PostgreSQL database, ensure <code className="font-mono bg-amber-100 dark:bg-amber-900/80 px-1 py-0.5 rounded">VITE_SUPABASE_URL</code> and <code className="font-mono bg-amber-100 dark:bg-amber-900/80 px-1 py-0.5 rounded">VITE_SUPABASE_ANON_KEY</code> are configured in your environment.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center px-4">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 mb-4">
          <Database className="w-7 h-7" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
          Khatabook
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Secure, multi-device personal ledger and expense tracker
        </p>
      </div>

      {/* Main Auth Card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white dark:bg-zinc-900 py-8 px-6 sm:px-10 shadow-xl shadow-zinc-200/50 dark:shadow-none rounded-3xl border border-zinc-200/80 dark:border-zinc-800">
          {/* Mode Switcher Tabs */}
          <div className="flex bg-zinc-100 dark:bg-zinc-800/80 p-1 rounded-2xl mb-6">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMessage(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                mode === 'login'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setErrorMessage(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                mode === 'signup'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Form Title & Subtitle */}
          <div className="mb-6">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              {mode === 'login'
                ? 'Welcome Back'
                : mode === 'signup'
                ? 'Create Your Ledger Account'
                : 'Reset Password'}
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              {mode === 'login'
                ? 'Enter your credentials to access your private ledger.'
                : mode === 'signup'
                ? 'All financial records are encrypted and isolated with Row Level Security.'
                : 'Enter your account email to receive a password reset link.'}
            </p>
          </div>

          {/* Inline Error Message */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Authentication Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>

            {mode !== 'forgot' && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                    Password
                  </label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot');
                        setErrorMessage(null);
                      }}
                      className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-98 disabled:opacity-60 text-white rounded-xl font-bold text-sm transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>
                    {mode === 'login'
                      ? 'Sign In to Account'
                      : mode === 'signup'
                      ? 'Register & Create Ledger'
                      : 'Send Password Reset Link'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {mode === 'forgot' && (
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMessage(null);
                }}
                className="w-full text-center py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:underline"
              >
                Back to Sign In
              </button>
            )}
          </form>

          {/* Privacy & Cloud Sync Guarantee */}
          <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800 space-y-2.5">
            <div className="flex items-center gap-2.5 text-xs text-zinc-600 dark:text-zinc-400">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>PostgreSQL Row Level Security ensures 100% data isolation</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-zinc-600 dark:text-zinc-400">
              <Smartphone className="w-4 h-4 text-indigo-500 shrink-0" />
              <span>Access same contacts and balances across all your devices</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-zinc-600 dark:text-zinc-400">
              <Users className="w-4 h-4 text-amber-500 shrink-0" />
              <span>Real-time calculations of Who Owes Who dynamically</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
