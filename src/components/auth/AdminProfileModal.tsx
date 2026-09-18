import React, { useMemo } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import {
  X,
  Shield,
  Mail,
  Smartphone,
  Tablet,
  Laptop,
  CheckCircle2,
  LogOut,
  Settings as SettingsIcon,
  Key,
  Activity,
} from 'lucide-react';
import { getActiveDeviceSessions, DeviceSession } from '../../utils/deviceSession';

interface AdminProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings?: () => void;
}

export const AdminProfileModal: React.FC<AdminProfileModalProps> = ({
  isOpen,
  onClose,
  onOpenSettings,
}) => {
  const { user, logout } = useAuth0();

  // Inspect real device sessions dynamically from the browser environment
  const deviceSessions = useMemo<DeviceSession[]>(() => {
    const authProvider = user?.sub ? user.sub.split('|')[0] : 'Auth0';
    return getActiveDeviceSessions(authProvider);
  }, [user]);

  if (!isOpen) return null;

  const authConnection = user?.sub ? (
    user.sub.startsWith('google-oauth2')
      ? 'Google Workspace'
      : user.sub.startsWith('auth0')
      ? 'Email & Password'
      : user.sub.split('|')[0]
  ) : 'Auth0 Identity';

  const formattedUpdatedAt = user?.updated_at
    ? new Date(user.updated_at).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        id="admin-profile-modal"
        className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col max-h-[92vh] text-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with User Info Card */}
        <div className="relative p-6 bg-gradient-to-br from-indigo-500/10 via-slate-50 to-white border-b border-slate-200">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/50 transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-start gap-4">
            <div className="relative flex-shrink-0">
              <div className="w-16 h-16 rounded-2xl bg-indigo-600 border-2 border-white shadow-md flex items-center justify-center text-white font-bold text-xl overflow-hidden">
                {user?.picture ? (
                  <img
                    src={user.picture}
                    alt={user.name || 'Admin'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Shield className="w-8 h-8" />
                )}
              </div>
              <span
                className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white"
                title="Online"
              />
            </div>

            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex items-center gap-1.5">
                <h3 className="text-base font-bold text-slate-900 truncate">
                  {user?.name || user?.nickname || 'Administrator'}
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-100 text-indigo-700 rounded-full flex-shrink-0">
                  Admin
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{user?.email || 'Authenticated User'}</span>
                {user?.email_verified && (
                  <span title="Verified Email" className="inline-flex items-center">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-500">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 border border-slate-200/80">
                  <Key className="w-3 h-3 text-indigo-500" />
                  {authConnection}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-5 overflow-y-auto flex-1 text-xs">
          {/* Authenticated Account Details */}
          <div className="space-y-2">
            <h4 className="font-semibold text-slate-700 text-xs flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
              <Shield className="w-3.5 h-3.5 text-indigo-500" />
              Authenticated Account Details
            </h4>

            <div className="bg-slate-50 border border-slate-200 rounded-xl divide-y divide-slate-200/70">
              <div className="px-3 py-2.5 flex items-center justify-between">
                <span className="text-slate-500">Auth0 User ID</span>
                <span className="font-mono text-[11px] text-slate-700 truncate max-w-[200px]" title={user?.sub}>
                  {user?.sub || 'auth0|authenticated'}
                </span>
              </div>

              <div className="px-3 py-2.5 flex items-center justify-between">
                <span className="text-slate-500">Email Status</span>
                <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {user?.email_verified ? 'Verified Email' : 'Authenticated'}
                </span>
              </div>

              {formattedUpdatedAt && (
                <div className="px-3 py-2.5 flex items-center justify-between">
                  <span className="text-slate-500">Last Profile Update</span>
                  <span className="text-slate-700 font-medium">
                    {formattedUpdatedAt}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* ACTIVE DEVICES / LOGGED-IN DEVICES SECTION */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-slate-700 text-xs flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                <Activity className="w-3.5 h-3.5 text-emerald-500" />
                Active Devices
              </h4>
              <span className="text-[10px] text-slate-400 font-medium">
                Session Inspection
              </span>
            </div>

            <div className="space-y-2">
              {deviceSessions.map((device) => {
                const Icon =
                  device.deviceType === 'Mobile'
                    ? Smartphone
                    : device.deviceType === 'Tablet'
                    ? Tablet
                    : Laptop;

                return (
                  <div
                    key={device.id}
                    className={`p-3 rounded-xl border transition ${
                      device.isCurrent
                        ? 'bg-emerald-50/50 border-emerald-200'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`p-2 rounded-lg ${
                            device.isCurrent
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800">
                              {device.os} · {device.browser}
                            </span>
                            {device.isCurrent && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 bg-emerald-500 text-white rounded">
                                Current Device
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                            <span>Display: {device.screenResolution}</span>
                            <span>•</span>
                            <span className={device.isCurrent ? 'text-emerald-600 font-semibold' : ''}>
                              {device.lastActive}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-2">
          {onOpenSettings && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenSettings();
              }}
              className="flex items-center gap-1.5 px-3 py-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-200/60 transition font-medium cursor-pointer"
            >
              <SettingsIcon className="w-4 h-4" />
              Agency Settings
            </button>
          )}

          <button
            id="modal-logout-btn"
            type="button"
            onClick={() =>
              logout({
                logoutParams: {
                  returnTo: window.location.origin,
                },
              })
            }
            className="flex items-center gap-1.5 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg font-semibold transition border border-rose-200 cursor-pointer ml-auto"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};
