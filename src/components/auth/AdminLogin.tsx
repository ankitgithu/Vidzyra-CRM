import React, { useState } from 'react';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldAlert,
  ArrowRight,
  Loader2,
  CheckCircle2,
  ArrowLeft,
  KeyRound,
  ShieldCheck,
} from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { AUTHORIZED_ADMIN_EMAIL } from '../../supabase';

export const AdminLogin: React.FC = () => {
  const {
    login,
    isLoggingIn,
    authError,
    clearAuthError,
    requestPasswordReset,
    updatePassword,
    isPasswordRecovery,
    setIsPasswordRecovery,
  } = useAdminAuth();

  // Mode: 'login' | 'forgot-password'
  const [viewMode, setViewMode] = useState<'login' | 'forgot-password'>('login');

  // Form states
  const [email, setEmail] = useState<string>(AUTHORIZED_ADMIN_EMAIL);
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Forgot password form states
  const [resetEmail, setResetEmail] = useState<string>(AUTHORIZED_ADMIN_EMAIL);
  const [isSendingReset, setIsSendingReset] = useState<boolean>(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);
  const [resetErrorMessage, setResetErrorMessage] = useState<string | null>(null);

  // Recovery / New password form states
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState<boolean>(false);
  const [updateSuccessMessage, setUpdateSuccessMessage] = useState<string | null>(null);
  const [updateErrorMessage, setUpdateErrorMessage] = useState<string | null>(null);

  // Handle Login submission
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoggingIn) return;

    if (!email.trim() || !password) {
      return;
    }

    await login(email.trim(), password);
  };

  // Handle Forgot Password submission
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSendingReset) return;

    if (!resetEmail.trim()) {
      setResetErrorMessage('Please enter your admin email address.');
      return;
    }

    setIsSendingReset(true);
    setResetSuccessMessage(null);
    setResetErrorMessage(null);

    const result = await requestPasswordReset(resetEmail.trim());
    setIsSendingReset(false);

    if (result.success) {
      setResetSuccessMessage(
        `A secure password reset link has been dispatched to ${resetEmail.trim()}. Please check your inbox or spam folder.`
      );
    } else {
      setResetErrorMessage(result.error || 'Unable to send password reset email. Please try again.');
    }
  };

  // Handle Update Password submission (Password Recovery mode)
  const handleUpdatePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isUpdatingPassword) return;

    if (newPassword.length < 6) {
      setUpdateErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setUpdateErrorMessage('Passwords do not match. Please re-enter.');
      return;
    }

    setIsUpdatingPassword(true);
    setUpdateErrorMessage(null);
    setUpdateSuccessMessage(null);

    const result = await updatePassword(newPassword);
    setIsUpdatingPassword(false);

    if (result.success) {
      setUpdateSuccessMessage(
        'Your password has been updated successfully. You may now proceed with your new password.'
      );
      setTimeout(() => {
        setIsPasswordRecovery(false);
        setViewMode('login');
      }, 2000);
    } else {
      setUpdateErrorMessage(result.error || 'Unable to update password. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-12 relative select-none">
      {/* Background ambient accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container Card */}
      <div className="w-full max-w-md z-10">
        {/* Brand Header */}
        <div className="text-center mb-8 space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 text-white font-black text-2xl shadow-xl shadow-indigo-500/20 border border-indigo-400/30">
            V
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight sm:text-3xl">
              Vidzyra CRM
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 font-medium">
              Video Editing Agency Management & Operations
            </p>
          </div>
        </div>

        {/* Card Box */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-2xl p-7 sm:p-8 space-y-6">
          {/* ======================================================== */}
          {/* VIEW: PASSWORD RECOVERY MODE                             */}
          {/* ======================================================== */}
          {isPasswordRecovery ? (
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                    Reset Admin Password
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Enter your new secure password for Vidzyra CRM
                  </p>
                </div>
              </div>

              {updateErrorMessage && (
                <div
                  id="auth-recovery-error-alert"
                  className="bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl p-3.5 flex items-start gap-2.5 animate-in fade-in duration-200"
                >
                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span className="font-medium leading-relaxed">{updateErrorMessage}</span>
                </div>
              )}

              {updateSuccessMessage && (
                <div
                  id="auth-recovery-success-alert"
                  className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl p-3.5 flex items-start gap-2.5 animate-in fade-in duration-200"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="font-medium leading-relaxed">{updateSuccessMessage}</span>
                </div>
              )}

              <form onSubmit={handleUpdatePasswordSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="new-password-input"
                    className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
                  >
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      id="new-password-input"
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800 transition placeholder-slate-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="confirm-password-input"
                    className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
                  >
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      id="confirm-password-input"
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter your new password"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800 transition placeholder-slate-400"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  id="btn-submit-new-password"
                  disabled={isUpdatingPassword}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-md shadow-indigo-600/20 transition disabled:opacity-50 cursor-pointer"
                >
                  {isUpdatingPassword ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving New Password...</span>
                    </>
                  ) : (
                    <>
                      <span>Save Password & Continue</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          ) : viewMode === 'forgot-password' ? (
            /* ======================================================== */
            /* VIEW: FORGOT PASSWORD REQUEST                           */
            /* ======================================================== */
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  id="btn-back-to-login"
                  onClick={() => {
                    setViewMode('login');
                    setResetSuccessMessage(null);
                    setResetErrorMessage(null);
                  }}
                  className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
                  title="Back to Sign In"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                    Reset Password
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    We will send a Supabase password recovery link to your inbox
                  </p>
                </div>
              </div>

              {resetErrorMessage && (
                <div
                  id="auth-reset-error-alert"
                  className="bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl p-3.5 flex items-start gap-2.5 animate-in fade-in duration-200"
                >
                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span className="font-medium leading-relaxed">{resetErrorMessage}</span>
                </div>
              )}

              {resetSuccessMessage && (
                <div
                  id="auth-reset-success-alert"
                  className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl p-3.5 flex items-start gap-2.5 animate-in fade-in duration-200"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="font-medium leading-relaxed">{resetSuccessMessage}</span>
                </div>
              )}

              <form onSubmit={handleResetSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="reset-email-input"
                    className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
                  >
                    Authorized Admin Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      id="reset-email-input"
                      type="email"
                      required
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="akrp1432@gmail.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800 transition placeholder-slate-400"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  id="btn-send-reset-link"
                  disabled={isSendingReset}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-md shadow-indigo-600/20 transition disabled:opacity-50 cursor-pointer"
                >
                  {isSendingReset ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending Reset Link...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Recovery Link</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setViewMode('login');
                      setResetSuccessMessage(null);
                      setResetErrorMessage(null);
                    }}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition cursor-pointer"
                  >
                    Back to Admin Sign In
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* ======================================================== */
            /* VIEW: DEFAULT ADMIN LOGIN FORM                          */
            /* ======================================================== */
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                    Admin Portal Sign In
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Authorized access to Vidzyra CRM Studio Operations
                  </p>
                </div>
                <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl" title="Supabase Protected">
                  <ShieldCheck className="w-5 h-5" />
                </span>
              </div>

              {authError && (
                <div
                  id="admin-auth-error-alert"
                  className="bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl p-3.5 flex items-start gap-2.5 animate-in fade-in duration-200"
                >
                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span className="font-medium leading-relaxed">{authError}</span>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                {/* Email input */}
                <div>
                  <label
                    htmlFor="admin-email-input"
                    className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
                  >
                    Admin Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      id="admin-email-input"
                      type="email"
                      required
                      autoComplete="username"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (authError) clearAuthError();
                      }}
                      placeholder="akrp1432@gmail.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800 transition placeholder-slate-400"
                    />
                  </div>
                </div>

                {/* Password input */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="admin-password-input"
                      className="block text-xs font-semibold text-slate-700 uppercase tracking-wider"
                    >
                      Password
                    </label>
                    <button
                      type="button"
                      id="btn-forgot-password"
                      onClick={() => {
                        clearAuthError();
                        setResetEmail(email || AUTHORIZED_ADMIN_EMAIL);
                        setViewMode('forgot-password');
                      }}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      id="admin-password-input"
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (authError) clearAuthError();
                      }}
                      placeholder="Enter your admin password"
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800 transition placeholder-slate-400"
                    />
                    <button
                      type="button"
                      id="btn-toggle-password-visibility"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 transition cursor-pointer"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  id="btn-admin-login-submit"
                  disabled={isLoggingIn}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-md shadow-indigo-600/20 transition disabled:opacity-50 cursor-pointer mt-2"
                >
                  {isLoggingIn ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In to Admin CRM</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Security / System Footer Notice */}
        <div className="mt-6 text-center space-y-2">
          <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
            <span>Secured via Supabase Authentication &bull; Live CRM on Firebase Firestore</span>
          </p>
          <p className="text-[10px] text-slate-500">
            Vidzyra CRM &copy; {new Date().getFullYear()} &bull; Video Editing Agency Management System
          </p>
        </div>
      </div>
    </div>
  );
};
