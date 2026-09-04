import React from 'react';
import { Database, Download, Cloud, CheckCircle2 } from 'lucide-react';
import { useCrm } from '../../context/CrmContext';

export const DataCenter: React.FC = () => {
  const {
    clients,
    editors,
    projects,
    clientPayments,
    editorPayments,
    expenses,
    activities,
    settings,
    isLoading,
  } = useCrm();

  const handleExportJson = () => {
    const fullDb = {
      version: '2.0-firestore',
      exportedAt: new Date().toISOString(),
      settings,
      clients,
      editors,
      projects,
      clientPayments,
      editorPayments,
      expenses,
      activities,
    };

    const blob = new Blob([JSON.stringify(fullDb, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vidzyra-crm-firestore-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 p-6 lg:p-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Data Center &amp; Storage</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Cloud Firestore database synchronization, snapshots, and backup JSON exports.
        </p>
      </div>

      {/* Cloud Database Status card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-sm">Firebase Firestore Cloud Database</h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  {isLoading ? 'Connecting...' : 'Live Connected'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time cloud database persistence with zero cold-starts and live synchronization.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400 block text-[10px] font-medium uppercase">Source of Truth</span>
            <span className="font-semibold text-slate-800 mt-0.5 block">Firebase Firestore (Single Source)</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400 block text-[10px] font-medium uppercase">Pricing Plan</span>
            <span className="font-semibold text-slate-800 mt-0.5 block">Free Spark Plan (Optimized Reads/Writes)</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400 block text-[10px] font-medium uppercase">Sync Mode</span>
            <span className="font-semibold text-slate-800 mt-0.5 block">Multi-Tab Real-time Listeners</span>
          </div>
        </div>
      </div>

      {/* Database stats overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-[10px] font-bold uppercase text-slate-400">Total Clients</span>
          <div className="text-xl font-bold text-slate-900 mt-1">{clients.length}</div>
          <span className="text-[11px] text-slate-500">Brands &amp; Creators</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-[10px] font-bold uppercase text-slate-400">Total Editors</span>
          <div className="text-xl font-bold text-purple-700 mt-1">{editors.length}</div>
          <span className="text-[11px] text-slate-500">Registered Talent</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-[10px] font-bold uppercase text-slate-400">Deliverable Projects</span>
          <div className="text-xl font-bold text-indigo-700 mt-1">{projects.length}</div>
          <span className="text-[11px] text-slate-500">Four-Link Pipelines</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-[10px] font-bold uppercase text-slate-400">Transactions Logged</span>
          <div className="text-xl font-bold text-emerald-700 mt-1">
            {clientPayments.length + editorPayments.length + expenses.length}
          </div>
          <span className="text-[11px] text-slate-500">Inflows + Outflows</span>
        </div>
      </div>

      {/* Export / Backup Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Full Database Snapshot (JSON)</h3>
            <p className="text-xs text-slate-500">
              Export all client records, project links, payment history, activity logs, and settings to a local JSON backup file.
            </p>
          </div>
        </div>

        <button
          onClick={handleExportJson}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
        >
          <Download className="w-4 h-4" />
          Download JSON Database Snapshot
        </button>
      </div>
    </div>
  );
};
