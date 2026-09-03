import React, { useState } from 'react';
import { Database, Download, Upload, RefreshCw, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
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
    resetToDemoData,
  } = useCrm();

  const [confirmReset, setConfirmReset] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleExportJson = () => {
    const fullDb = {
      version: '1.0',
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
    a.download = `vidzyra-crm-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    resetToDemoData();
    setConfirmReset(false);
    setResetSuccess(true);
    setTimeout(() => setResetSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 p-6 lg:p-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Data Center &amp; Storage</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Local database snapshots, backup JSON exports, and system reset controls.
        </p>
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
              Export all client records, project links, payment history, activity logs, and settings to a JSON file.
            </p>
          </div>
        </div>

        <button
          onClick={handleExportJson}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
        >
          <Download className="w-4 h-4" />
          Download JSON Database Snapshot
        </button>
      </div>

      {/* Demo Data Reset */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
            <RefreshCw className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Restore Demo Seed Data</h3>
            <p className="text-xs text-slate-500">
              Reset your database to Vidzyra's rich initial demo state (clients, editors, projects, receipts, and links).
            </p>
          </div>
        </div>

        {resetSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Demo data successfully restored!
          </div>
        )}

        {confirmReset ? (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-2 text-xs">
            <p className="font-bold text-rose-900 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              Are you sure? This will replace your local storage database with initial demo data.
            </p>
            <div className="flex items-center space-x-2 pt-1">
              <button
                onClick={handleReset}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold"
              >
                Yes, Restore Demo Data
              </button>
              <button
                onClick={() => setConfirmReset(false)}
                className="px-4 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-lg font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setConfirmReset(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-white border border-rose-300 hover:bg-rose-50 text-rose-700 rounded-xl text-xs font-semibold transition"
          >
            <RefreshCw className="w-4 h-4" />
            Reset Database to Demo Seed
          </button>
        )}
      </div>
    </div>
  );
};
