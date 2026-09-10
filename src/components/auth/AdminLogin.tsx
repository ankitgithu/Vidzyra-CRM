import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { Shield, LogIn, UserPlus, AlertCircle } from 'lucide-react';

export const AdminLogin: React.FC = () => {
  const { loginWithRedirect, error, isLoading } = useAuth0();

  const handleLogin = () => {
    loginWithRedirect();
  };

  const handleSignup = () => {
    loginWithRedirect({
      authorizationParams: {
        screen_hint: 'signup',
      },
    });
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 flex flex-col items-center justify-center p-6 antialiased select-none">
      {/* Background glow effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 left-1/2 -translate-x-1/2 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md bg-slate-900/90 border border-slate-800/90 rounded-2xl p-8 shadow-2xl backdrop-blur-xl space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-500/25 mx-auto">
            <span className="font-extrabold text-2xl tracking-wider">V</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Vidzyra CRM</h1>
            <p className="text-sm font-medium text-slate-400 mt-1">Admin Login</p>
          </div>
        </div>

        {/* User-Friendly Error Message if Auth0 error occurs */}
        {error && (
          <div
            id="auth-error-banner"
            className="flex items-start gap-3 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300"
          >
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">
              <p className="font-semibold text-rose-200">Authentication Failed</p>
              <p className="text-rose-300/90 mt-0.5">
                We could not complete your sign in. Please try again.
              </p>
            </div>
          </div>
        )}

        {/* Informational Subtext */}
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 text-xs text-slate-300 text-center leading-relaxed">
          <div className="flex items-center justify-center gap-1.5 text-indigo-400 font-semibold mb-1">
            <Shield className="w-3.5 h-3.5" />
            <span>Secure Admin Access</span>
          </div>
          Authenticate securely with Auth0 Universal Login to access the agency control center.
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          {/* Primary Login Button */}
          <button
            id="admin-login-btn"
            type="button"
            disabled={isLoading}
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-indigo-600/30 transition duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <LogIn className="w-4 h-4" />
            <span>Login</span>
          </button>

          {/* Admin Signup Option */}
          <div className="pt-2 text-center">
            <button
              id="admin-signup-btn"
              type="button"
              disabled={isLoading}
              onClick={handleSignup}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/70 font-medium text-xs rounded-xl transition duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <UserPlus className="w-3.5 h-3.5 text-indigo-400" />
              <span>Create Admin Account</span>
            </button>
          </div>
        </div>

        {/* Security Footer Note */}
        <div className="text-center pt-2 border-t border-slate-800/80">
          <p className="text-[11px] text-slate-400">
            Protected by Auth0 Universal Login &bull; Vidzyra Operations
          </p>
        </div>
      </div>
    </div>
  );
};
