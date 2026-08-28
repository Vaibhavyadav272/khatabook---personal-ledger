import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Lock, Mail, User as UserIcon, ArrowRight, Eye, EyeOff } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { authModalOpen, authModalMode, closeAuthModal, login, signup, forgotPassword, openAuthModal } =
    useAuth();
  const { success: toastSuccess, error: toastError } = useToast();

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setErrorMsg('Please enter a valid email address');
      return;
    }

    setLoading(true);

    if (authModalMode === 'login') {
      if (!password) {
        setErrorMsg('Please enter your password');
        setLoading(false);
        return;
      }
      const res = await login(trimmedEmail, password);
      if (res.success) {
        toastSuccess('Signed in successfully');
        closeAuthModal();
      } else {
        setErrorMsg(res.error || 'Failed to sign in');
      }
    } else if (authModalMode === 'signup') {
      const trimmedName = name.trim();
      if (!trimmedName) {
        setErrorMsg('Please enter your full name');
        setLoading(false);
        return;
      }
      if (!password || password.length < 6) {
        setErrorMsg('Password must be at least 6 characters');
        setLoading(false);
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('Passwords do not match');
        setLoading(false);
        return;
      }

      const res = await signup(trimmedName, trimmedEmail, password);
      if (res.success) {
        if (res.message) {
          toastSuccess(res.message);
        } else {
          toastSuccess(`Welcome, ${trimmedName}! Your private ledger is ready.`);
        }
        closeAuthModal();
      } else {
        setErrorMsg(res.error || 'Failed to create account');
      }
    } else if (authModalMode === 'forgot') {
      const res = await forgotPassword(trimmedEmail);
      if (res.success) {
        toastSuccess(res.message);
        openAuthModal('login');
      } else {
        setErrorMsg(res.error || 'Error sending password reset email');
      }
    }

    setLoading(false);
  };

  return (
    <Modal
      isOpen={authModalOpen}
      onClose={closeAuthModal}
      title={
        authModalMode === 'login'
          ? 'Sign In to Khatabook'
          : authModalMode === 'signup'
          ? 'Create Your Account'
          : 'Reset Your Password'
      }
      subtitle={
        authModalMode === 'login'
          ? 'Access your private personal ledger and expenses'
          : authModalMode === 'signup'
          ? 'Maintain person-by-person money records privately'
          : 'Enter your email to receive recovery instructions'
      }
      maxWidth="sm"
    >
      {errorMsg && (
        <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-300 text-xs">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {authModalMode === 'signup' && (
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

        {authModalMode !== 'forgot' && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                Password
              </label>
              {authModalMode === 'login' && (
                <button
                  type="button"
                  onClick={() => openAuthModal('forgot')}
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
                className="absolute right-3.5 top-3 text-zinc-400 hover:text-zinc-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}

        {authModalMode === 'signup' && (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
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
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-98 disabled:opacity-60 text-white rounded-xl font-medium text-sm transition-all shadow-xs cursor-pointer"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <span>
                {authModalMode === 'login'
                  ? 'Sign In'
                  : authModalMode === 'signup'
                  ? 'Create Account'
                  : 'Send Reset Instructions'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        {/* Bottom Switch Mode */}
        <div className="text-center pt-2 text-xs text-zinc-500 dark:text-zinc-400">
          {authModalMode === 'login' ? (
            <>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => openAuthModal('signup')}
                className="font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                Sign Up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => openAuthModal('login')}
                className="font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                Sign In
              </button>
            </>
          )}
        </div>
      </form>
    </Modal>
  );
};
