import React, { useState } from 'react';
import {
  Bell,
  Plus,
  Search,
  ExternalLink,
  ChevronDown,
  User,
  Shield,
  CreditCard,
  Briefcase,
  UserPlus,
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';

interface HeaderProps {
  onOpenNewWork: () => void;
  onOpenNewClient: () => void;
  onOpenNewPayment: () => void;
  onToggleNotifications: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenNewWork,
  onOpenNewClient,
  onOpenNewPayment,
  onToggleNotifications,
  searchQuery,
  setSearchQuery,
}) => {
  const { notifications, clients, editors, setActivePortalUser } = useCrm();
  const [showPortalPicker, setShowPortalPicker] = useState(false);
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between z-10 sticky top-0">
      {/* Search Field */}
      <div className="flex items-center w-72 sm:w-80">
        <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="global-search-input"
            type="text"
            placeholder="Search initiatives, clients, editors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-100 border-none rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 placeholder-slate-400 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Action Buttons & Profile Controls */}
      <div className="flex items-center space-x-3">
        {/* Quick Actions */}
        <button
          id="header-btn-add-work"
          onClick={onOpenNewWork}
          className="flex items-center gap-1.5 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          Add Work
        </button>

        <button
          id="header-btn-add-client"
          onClick={onOpenNewClient}
          className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-xs transition"
        >
          <UserPlus className="w-3.5 h-3.5 text-slate-500" />
          Add Client
        </button>

        <button
          id="header-btn-add-payment"
          onClick={onOpenNewPayment}
          className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-xs transition"
        >
          <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
          Add Payment
        </button>

        <div className="h-6 w-px bg-slate-200 mx-1" />

        {/* Portal Switcher Dropdown */}
        <div className="relative">
          <button
            id="portal-view-switcher-dropdown"
            onClick={() => setShowPortalPicker(!showPortalPicker)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition"
          >
            <ExternalLink className="w-3.5 h-3.5 text-indigo-600" />
            <span>Open Portal</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showPortalPicker && (
            <div
              className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-100"
              onMouseLeave={() => setShowPortalPicker(false)}
            >
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Client Portals (Private Links)
              </div>
              {clients.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setActivePortalUser({ type: 'client', id: c.id });
                    setShowPortalPicker(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between text-slate-700"
                >
                  <span className="font-medium truncate">{c.name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                      c.portalStatus === 'Active'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {c.portalStatus}
                  </span>
                </button>
              ))}

              <div className="border-t border-slate-100 my-1" />

              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Editor Portals (Private Links)
              </div>
              {editors.map((e) => (
                <button
                  key={e.id}
                  onClick={() => {
                    setActivePortalUser({ type: 'editor', id: e.id });
                    setShowPortalPicker(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between text-slate-700"
                >
                  <span className="font-medium truncate">{e.name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                      e.portalStatus === 'Active'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {e.portalStatus}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notifications Icon Button */}
        <button
          id="header-notifications-btn"
          onClick={onToggleNotifications}
          className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
          aria-label="View notifications"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span
              id="notification-badge-count"
              className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center border-2 border-white"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Admin Badge */}
        <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-xs">
            <Shield className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-xs font-semibold text-slate-800">Admin</div>
            <div className="text-[10px] text-slate-400">Vidzyra Studio</div>
          </div>
        </div>
      </div>
    </header>
  );
};
