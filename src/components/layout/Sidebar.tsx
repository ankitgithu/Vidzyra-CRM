import React from 'react';
import {
  LayoutDashboard,
  Users,
  Film,
  Briefcase,
  CreditCard,
  BarChart3,
  Database,
  Settings,
  ExternalLink,
  Sparkles,
  MessageSquare,
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, settings, setActivePortalUser, clients, editors } = useCrm();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'clients', label: 'Clients', icon: Users },
    { id: 'editors', label: 'Editors', icon: Film },
    { id: 'work', label: 'Work / Projects', icon: Briefcase },
    { id: 'chats', label: 'Project Chats', icon: MessageSquare },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'datacenter', label: 'Data Center', icon: Database },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside
      id="admin-sidebar"
      className="w-64 bg-[#0f172a] text-slate-300 flex flex-col h-screen border-r border-slate-800/90 flex-shrink-0 select-none"
    >
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm">
            {settings.businessName ? settings.businessName.charAt(0).toUpperCase() : 'V'}
          </div>
          <div className="min-w-0">
            <h1 className="font-semibold text-lg text-white tracking-tight truncate leading-tight">
              {settings.businessName}
            </h1>
            <p className="text-[11px] text-slate-400 font-medium truncate">{settings.tagline}</p>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-4 py-5 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          Agency Management
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`sidebar-nav-${item.id}`}
              onClick={() => {
                setActivePortalUser(null);
                setActiveTab(item.id);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer text-left ${
                isActive
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Quick Portal Switcher (Preview client / editor experience) */}
      <div className="px-4 py-3 border-t border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-indigo-400" />
            Portal Preview
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            id="sidebar-preview-client-portal"
            onClick={() => {
              if (clients.length > 0) {
                setActivePortalUser({ type: 'client', id: clients[0].id });
              }
            }}
            className="flex items-center justify-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md text-xs font-medium border border-slate-700/80 transition shadow-2xs cursor-pointer"
            title="Open first active client portal"
          >
            <ExternalLink className="w-3 h-3" />
            Client
          </button>
          <button
            id="sidebar-preview-editor-portal"
            onClick={() => {
              if (editors.length > 0) {
                setActivePortalUser({ type: 'editor', id: editors[0].id });
              }
            }}
            className="flex items-center justify-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md text-xs font-medium border border-slate-700/80 transition shadow-2xs cursor-pointer"
            title="Open first active editor portal"
          >
            <ExternalLink className="w-3 h-3" />
            Editor
          </button>
        </div>
      </div>

      {/* User / Producer Profile Footer - links to Settings */}
      <div
        onClick={() => {
          setActivePortalUser(null);
          setActiveTab('settings');
        }}
        className="p-4 sm:p-5 border-t border-slate-800 bg-[#0c1322] hover:bg-slate-900/80 transition cursor-pointer"
        title="Agency & System Settings"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center text-[11px] font-semibold text-white">
            {settings.adminName ? settings.adminName.substring(0, 2).toUpperCase() : 'VZ'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-white truncate">{settings.adminName || 'Studio Director'}</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider">{settings.adminRole || 'Vidzyra Ops'}</p>
          </div>
          <Settings className="w-3.5 h-3.5 text-slate-500 hover:text-slate-300" />
        </div>
      </div>
    </aside>
  );
};
