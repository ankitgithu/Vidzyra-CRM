import React, { useState, useMemo } from 'react';
import {
  Users,
  Film,
  Briefcase,
  Clock,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Filter,
  Layers,
  Award,
  ChevronRight,
  Activity as ActivityIcon,
  RotateCcw,
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { WorkProject, Activity } from '../../types';

interface DashboardProps {
  onOpenWork: (id: string) => void;
  onOpenClient: (id: string) => void;
  onOpenEditor: (id: string) => void;
  onOpenEditLink: (workId: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onOpenWork,
  onOpenClient,
  onOpenEditor,
  onOpenEditLink,
}) => {
  const {
    clients,
    editors,
    projects,
    clientPayments,
    editorPayments,
    expenses,
    activities,
    getFinancialPulse,
    getClientStats,
    getEditorStats,
  } = useCrm();

  const financial = getFinancialPulse();

  // Graph tab state
  const [chartMetric, setChartMetric] = useState<'revenue' | 'payments' | 'profit' | 'completion'>('revenue');

  // Activity filter state
  const [activityFilterPeriod, setActivityFilterPeriod] = useState<'all' | 'today' | 'week' | 'month' | 'custom'>('all');
  const [activityCustomStart, setActivityCustomStart] = useState('');
  const [activityCustomEnd, setActivityCustomEnd] = useState('');
  const [activityTypeFilter, setActivityTypeFilter] = useState('all');
  const [activityClientFilter, setActivityClientFilter] = useState('all');
  const [activityEditorFilter, setActivityEditorFilter] = useState('all');

  // Calculate Client Overview metrics
  const totalClients = clients.length;
  const activeClients = clients.filter((c) => c.portalStatus === 'Active').length;
  const totalWork = projects.length;
  const completedWork = projects.filter((p) => p.status === 'Completed' || p.status === 'Delivered').length;
  const pendingWork = projects.filter((p) => p.status === 'Pending' || p.status === 'Assigned' || p.status === 'In Progress' || p.status === 'Revision Required').length;

  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowObj = new Date();
  tomorrowObj.setDate(tomorrowObj.getDate() + 1);
  const tomorrowStr = tomorrowObj.toISOString().split('T')[0];

  const dueTodayWork = projects.filter((p) => p.dueDate === todayStr && p.status !== 'Completed' && p.status !== 'Delivered');
  const dueTomorrowWork = projects.filter((p) => p.dueDate === tomorrowStr && p.status !== 'Completed' && p.status !== 'Delivered');
  const overdueWork = projects.filter((p) => {
    if (p.status === 'Completed' || p.status === 'Delivered' || !p.dueDate) return false;
    return p.dueDate < todayStr;
  });
  const upcomingWork = projects.filter((p) => {
    if (p.status === 'Completed' || p.status === 'Delivered' || !p.dueDate) return false;
    return p.dueDate > tomorrowStr;
  });

  // Calculate Editor Overview metrics
  const totalEditors = editors.length;
  const assignedWorkCount = projects.filter((p) => p.workDoneBy === 'Assigned' && p.assignedTo).length;
  const inProgressWorkCount = projects.filter((p) => p.status === 'In Progress' || p.status === 'Revision Required').length;
  const todayAssignedWork = projects.filter((p) => p.createdAt?.startsWith(todayStr) && p.assignedTo).length;
  const todayCompletedWork = projects.filter((p) => {
    const isCompleted = p.status === 'Completed' || p.status === 'Delivered';
    const timeline = p.timeline || [];
    const lastEvent = timeline[timeline.length - 1];
    return isCompleted && lastEvent?.date === todayStr;
  }).length;

  // Client Rankings
  const clientRankings = useMemo(() => {
    return clients.map((c) => {
      const stats = getClientStats(c.id);
      const clientProjects = projects.filter((p) => p.clientId === c.id);
      const editorCost = clientProjects.reduce((acc, p) => {
        return acc + (p.assignedTo ? (Number(p.quantity) || 1) * (Number(p.editorRate) || 0) : 0);
      }, 0);
      const profit = (Number(stats.totalBilling) || 0) - editorCost;
      return {
        ...c,
        totalBilling: stats.totalBilling,
        totalPaid: stats.totalPaid,
        profit,
      };
    });
  }, [clients, projects, getClientStats]);

  const highestPayingClient = [...clientRankings].sort((a, b) => b.totalPaid - a.totalPaid)[0];
  const highestRevenueClient = [...clientRankings].sort((a, b) => b.totalBilling - a.totalBilling)[0];
  const highestProfitClient = [...clientRankings].sort((a, b) => b.profit - a.profit)[0];

  // Editor Rankings
  const editorRankings = useMemo(() => {
    return editors.map((e) => {
      const stats = getEditorStats(e.id);
      const rate = stats.assignedWork > 0 ? Math.round((stats.completed / stats.assignedWork) * 100) : 0;
      return {
        ...e,
        ...stats,
        completionRate: rate,
      };
    });
  }, [editors, getEditorStats]);

  const editorWorkloadRanking = [...editorRankings].sort((a, b) => b.assignedWork - a.assignedWork);
  const editorPerformanceRanking = [...editorRankings].sort((a, b) => b.completed - a.completed);

  // Filtered Activities
  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      // Date filter
      if (activityFilterPeriod === 'today') {
        const actDate = act.when.split(' ')[0];
        if (actDate !== todayStr) return false;
      } else if (activityFilterPeriod === 'week') {
        const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        if (act.timestamp < oneWeekAgo) return false;
      } else if (activityFilterPeriod === 'month') {
        const oneMonthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
        if (act.timestamp < oneMonthAgo) return false;
      } else if (activityFilterPeriod === 'custom') {
        if (activityCustomStart && act.when < activityCustomStart) return false;
        if (activityCustomEnd && act.when > activityCustomEnd + ' 23:59') return false;
      }

      // Entity type filter
      if (activityTypeFilter !== 'all' && act.entityType !== activityTypeFilter) return false;

      // Client filter
      if (activityClientFilter !== 'all' && act.clientId !== activityClientFilter) return false;

      // Editor filter
      if (activityEditorFilter !== 'all' && act.editorId !== activityEditorFilter) return false;

      return true;
    });
  }, [
    activities,
    activityFilterPeriod,
    activityCustomStart,
    activityCustomEnd,
    activityTypeFilter,
    activityClientFilter,
    activityEditorFilter,
    todayStr,
  ]);

  return (
    <div className="space-y-8 p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Welcome Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Vidzyra Agency Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Operational and Financial Pulse for your Social Media &amp; Video Production CRM
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-semibold border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Sync Active
          </span>
        </div>
      </div>

      {/* OVERDUE WORK ALERT BANNER (If any work is overdue) */}
      {overdueWork.length > 0 && (
        <div
          id="overdue-work-alert-banner"
          className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-4 flex items-start justify-between shadow-xs transition"
        >
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-rose-600 text-white rounded-xl mt-0.5 shadow-sm">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-rose-900 text-sm">
                Attention: {overdueWork.length} Project{overdueWork.length > 1 ? 's are' : ' is'} Overdue!
              </h3>
              <p className="text-xs text-rose-700 mt-0.5">
                The deadline for these deliverables has passed. Prioritize or reassign them immediately:
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {overdueWork.map((pw) => (
                  <button
                    key={pw.id}
                    onClick={() => onOpenWork(pw.id)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-rose-300 rounded-lg text-xs font-semibold text-rose-800 hover:bg-rose-100 transition shadow-2xs"
                  >
                    <span>{pw.name}</span>
                    <span className="text-[10px] text-rose-500 font-normal">
                      (Due: {pw.dueDate})
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          1. FINANCIAL PULSE (Prominently integrated inside Dashboard)
         ======================================================== */}
      <section id="section-financial-pulse" className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-800">Financial Pulse</h2>
              <p className="text-[11px] text-slate-500 font-normal">
                Auto-calculated: Total Billing, Editor Cost, Profit &amp; Expenses
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {/* 1. Total Revenue */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Total Revenue
            </p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">
              ₹{(financial?.totalRevenue || 0).toLocaleString()}
            </h3>
            <p className="text-[11px] text-slate-500 mt-2 font-medium">All client work billing</p>
          </div>

          {/* 2. Total Payments Received */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Payments Received
            </p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">
              ₹{(financial?.totalPaymentsReceived || 0).toLocaleString()}
            </h3>
            <p className="text-[11px] text-emerald-600 mt-2 font-medium">↑ Collected in cash</p>
          </div>

          {/* 3. Pending Payments */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Pending Payments
            </p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">
              ₹{(financial?.pendingPayments || 0).toLocaleString()}
            </h3>
            <p className="text-[11px] text-amber-500 mt-2 font-medium">Uncollected balance</p>
          </div>

          {/* 4. Total Editor Cost */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Editor Cost
            </p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">
              ₹{(financial?.totalEditorCost || 0).toLocaleString()}
            </h3>
            <p className="text-[11px] text-slate-500 mt-2 font-medium">Editor rate commitments</p>
          </div>

          {/* 5. Other Expenses */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Expenses
            </p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">
              ₹{(financial?.otherExpenses || 0).toLocaleString()}
            </h3>
            <p className="text-[11px] text-slate-500 mt-2 font-medium">Tools, music &amp; assets</p>
          </div>

          {/* 6. Gross Profit */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Gross Profit
            </p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">
              ₹{(financial?.grossProfit || 0).toLocaleString()}
            </h3>
            <p className="text-[11px] text-emerald-600 mt-2 font-medium">Revenue - Editor cost</p>
          </div>

          {/* 7. Net Profit */}
          <div className="bg-[#0f172a] text-white p-5 rounded-xl border border-slate-800 shadow-sm">
            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
              Net Profit
            </p>
            <h3 className="text-2xl font-bold text-white mt-1">
              ₹{(financial?.netProfit || 0).toLocaleString()}
            </h3>
            <p className="text-[11px] text-slate-400 mt-2 font-medium">Realized net margin</p>
          </div>
        </div>
      </section>

      {/* ========================================================
          2. CLIENT OVERVIEW & EDITOR OVERVIEW CARDS
         ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CLIENT OVERVIEW */}
        <div id="card-client-overview" className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
                <Users className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Client Overview</h3>
            </div>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
              {activeClients} Active / {totalClients} Total Clients
            </span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-4">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-[10px] font-medium text-slate-400 uppercase">Total Work</span>
              <div className="text-lg font-bold text-slate-900 mt-0.5">{totalWork}</div>
            </div>
            <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-100">
              <span className="text-[10px] font-medium text-emerald-700 uppercase">Completed</span>
              <div className="text-lg font-bold text-emerald-700 mt-0.5">{completedWork}</div>
            </div>
            <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-100">
              <span className="text-[10px] font-medium text-amber-700 uppercase">Pending</span>
              <div className="text-lg font-bold text-amber-700 mt-0.5">{pendingWork}</div>
            </div>
            <div className="bg-indigo-50/60 p-3 rounded-xl border border-indigo-100">
              <span className="text-[10px] font-medium text-indigo-700 uppercase">Due Soon</span>
              <div className="text-lg font-bold text-indigo-700 mt-0.5">{dueTodayWork.length + dueTomorrowWork.length}</div>
            </div>
            <div className="bg-rose-50/60 p-3 rounded-xl border border-rose-100">
              <span className="text-[10px] font-medium text-rose-700 uppercase">Overdue</span>
              <div className="text-lg font-bold text-rose-700 mt-0.5">{overdueWork.length}</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-xs">
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-medium">Total Billing</span>
              <p className="font-bold text-slate-800 text-sm mt-0.5">₹{(financial?.totalRevenue || 0).toLocaleString()}</p>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-medium">Payment Received</span>
              <p className="font-bold text-emerald-600 text-sm mt-0.5">₹{(financial?.totalPaymentsReceived || 0).toLocaleString()}</p>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-medium">Remaining Payment</span>
              <p className="font-bold text-rose-600 text-sm mt-0.5">₹{(financial?.pendingPayments || 0).toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* EDITOR OVERVIEW */}
        <div id="card-editor-overview" className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-purple-100 text-purple-700 rounded-lg">
                <Film className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Editor Overview</h3>
            </div>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
              {totalEditors} Registered Editors
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-[10px] font-medium text-slate-400 uppercase">Assigned Work</span>
              <div className="text-lg font-bold text-slate-900 mt-0.5">{assignedWorkCount}</div>
            </div>
            <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-100">
              <span className="text-[10px] font-medium text-amber-700 uppercase">In Progress</span>
              <div className="text-lg font-bold text-amber-700 mt-0.5">{inProgressWorkCount}</div>
            </div>
            <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-100">
              <span className="text-[10px] font-medium text-emerald-700 uppercase">Completed Work</span>
              <div className="text-lg font-bold text-emerald-700 mt-0.5">{completedWork}</div>
            </div>
            <div className="bg-purple-50/60 p-3 rounded-xl border border-purple-100">
              <span className="text-[10px] font-medium text-purple-700 uppercase">Pending Work</span>
              <div className="text-lg font-bold text-purple-700 mt-0.5">{pendingWork}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-xs">
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-medium">Today&apos;s Assigned Work</span>
              <p className="font-bold text-slate-800 text-sm mt-0.5">{todayAssignedWork} Tasks</p>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-medium">Today&apos;s Completed Work</span>
              <p className="font-bold text-emerald-600 text-sm mt-0.5">{todayCompletedWork} Tasks</p>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          3. DUE DATE MANAGEMENT (Due Today, Tomorrow, Upcoming, Overdue)
         ======================================================== */}
      <section className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-indigo-600" />
            <h3 className="font-bold text-slate-900 text-base">Due Date Management</h3>
          </div>
          <span className="text-xs text-slate-400">Deadlines &amp; Delivery Tracking</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Due Today */}
          <div className="border border-indigo-200 rounded-xl p-3.5 bg-indigo-50/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-indigo-800 uppercase tracking-wider">Due Today</span>
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] font-bold flex items-center justify-center">
                {dueTodayWork.length}
              </span>
            </div>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-0.5">
              {dueTodayWork.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No tasks due today.</p>
              ) : (
                dueTodayWork.map((w) => (
                  <div
                    key={w.id}
                    id={`due-today-${w.id}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => onOpenWork(w.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onOpenWork(w.id);
                      }
                    }}
                    className="p-2.5 bg-white rounded-lg border border-slate-200 hover:border-indigo-500 hover:shadow-xs hover:scale-[1.01] active:scale-[0.99] cursor-pointer transition text-xs shadow-2xs group"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <p className="font-semibold text-slate-800 group-hover:text-indigo-700 truncate transition">
                        {w.name}
                      </p>
                      <span className="text-[10px] text-indigo-500 opacity-0 group-hover:opacity-100 transition whitespace-nowrap font-medium">
                        View →
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1.5">
                      <span>{w.workType}</span>
                      <span className="text-indigo-600 font-semibold">
                        ₹{(w.totalBilling ?? ((Number(w.quantity) || 1) * (Number(w.clientRate) || 0)) ?? 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Due Tomorrow */}
          <div className="border border-cyan-200 rounded-xl p-3.5 bg-cyan-50/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-cyan-800 uppercase tracking-wider">Due Tomorrow</span>
              <span className="w-5 h-5 rounded-full bg-cyan-600 text-white text-[11px] font-bold flex items-center justify-center">
                {dueTomorrowWork.length}
              </span>
            </div>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-0.5">
              {dueTomorrowWork.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No tasks due tomorrow.</p>
              ) : (
                dueTomorrowWork.map((w) => (
                  <div
                    key={w.id}
                    id={`due-tomorrow-${w.id}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => onOpenWork(w.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onOpenWork(w.id);
                      }
                    }}
                    className="p-2.5 bg-white rounded-lg border border-slate-200 hover:border-cyan-500 hover:shadow-xs hover:scale-[1.01] active:scale-[0.99] cursor-pointer transition text-xs shadow-2xs group"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <p className="font-semibold text-slate-800 group-hover:text-cyan-700 truncate transition">
                        {w.name}
                      </p>
                      <span className="text-[10px] text-cyan-600 opacity-0 group-hover:opacity-100 transition whitespace-nowrap font-medium">
                        View →
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1.5">
                      <span>{w.workType}</span>
                      <span className="text-cyan-600 font-semibold">
                        ₹{(w.totalBilling ?? ((Number(w.quantity) || 1) * (Number(w.clientRate) || 0)) ?? 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Upcoming */}
          <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Upcoming</span>
              <span className="w-5 h-5 rounded-full bg-slate-600 text-white text-[11px] font-bold flex items-center justify-center">
                {upcomingWork.length}
              </span>
            </div>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-0.5">
              {upcomingWork.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No upcoming tasks scheduled.</p>
              ) : (
                upcomingWork.map((w) => (
                  <div
                    key={w.id}
                    id={`due-upcoming-${w.id}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => onOpenWork(w.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onOpenWork(w.id);
                      }
                    }}
                    className="p-2.5 bg-white rounded-lg border border-slate-200 hover:border-indigo-400 hover:shadow-xs hover:scale-[1.01] active:scale-[0.99] cursor-pointer transition text-xs shadow-2xs group"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <p className="font-semibold text-slate-800 group-hover:text-indigo-700 truncate transition">
                        {w.name}
                      </p>
                      <span className="text-[10px] text-indigo-500 opacity-0 group-hover:opacity-100 transition whitespace-nowrap font-medium">
                        View →
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1.5">
                      <span>Due: {w.dueDate}</span>
                      <span className="text-slate-700 font-semibold">
                        ₹{(w.totalBilling ?? ((Number(w.quantity) || 1) * (Number(w.clientRate) || 0)) ?? 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Overdue (Visually Highlighted) */}
          <div className="border-2 border-rose-300 rounded-xl p-3.5 bg-rose-50/60">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-rose-800 uppercase tracking-wider flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                Overdue
              </span>
              <span className="w-5 h-5 rounded-full bg-rose-600 text-white text-[11px] font-bold flex items-center justify-center">
                {overdueWork.length}
              </span>
            </div>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-0.5">
              {overdueWork.length === 0 ? (
                <p className="text-xs text-emerald-600 font-medium">All projects on schedule!</p>
              ) : (
                overdueWork.map((w) => (
                  <div
                    key={w.id}
                    id={`due-overdue-${w.id}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => onOpenWork(w.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onOpenWork(w.id);
                      }
                    }}
                    className="p-2.5 bg-white rounded-lg border border-rose-200 hover:border-rose-500 hover:shadow-xs hover:scale-[1.01] active:scale-[0.99] cursor-pointer transition text-xs shadow-2xs group"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <p className="font-bold text-rose-900 group-hover:text-rose-700 truncate transition">
                        {w.name}
                      </p>
                      <span className="text-[10px] text-rose-600 opacity-0 group-hover:opacity-100 transition whitespace-nowrap font-bold">
                        View →
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-rose-600 mt-1.5">
                      <span>Passed: {w.dueDate}</span>
                      <span className="font-bold">Urgent</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          4. FINANCIAL GRAPHS & MONTHLY TRENDS
         ======================================================== */}
      <section className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-slate-800 text-sm">Execution Velocity &amp; Revenue Trends</h4>
              <span className="text-[10px] px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded border border-indigo-100 uppercase font-bold tracking-widest">
                Quarterly View
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Visual velocity metrics across Revenue, Payments, Profit &amp; Work Completion
            </p>
          </div>
          {/* Chart Switcher */}
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg">
            {(['revenue', 'payments', 'profit', 'completion'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setChartMetric(mode)}
                className={`px-3 py-1 rounded-md text-xs font-semibold capitalize transition ${
                  chartMetric === mode
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Clean SVG Interactive Trend Visualizer */}
        <div className="h-64 w-full bg-slate-50/50 rounded-xl p-4 border border-slate-200/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-medium text-slate-700">
              {chartMetric === 'revenue' && 'Total Billed Work Revenue (August – September 2026)'}
              {chartMetric === 'payments' && 'Client Collected Payments vs Pending Balance'}
              {chartMetric === 'profit' && 'Gross & Net Profit Dynamics'}
              {chartMetric === 'completion' && 'Work Delivered & Completed Ratio'}
            </span>
            <span className="text-[10px] bg-slate-200/70 px-2 py-0.5 rounded text-slate-600 font-mono uppercase font-semibold">
              Monthly Aggregation
            </span>
          </div>

          {/* SVG Line / Bar Chart representation */}
          <div className="flex-1 my-2 flex items-end justify-between gap-4 px-4 pt-4 pb-2 border-b border-slate-200">
            {/* Week 1 */}
            <div className="flex-1 flex flex-col items-center gap-2 group">
              <div
                className="w-full max-w-[40px] bg-indigo-200 group-hover:bg-indigo-300 rounded-t transition-all"
                style={{
                  height:
                    chartMetric === 'revenue' ? '55%' :
                    chartMetric === 'payments' ? '40%' :
                    chartMetric === 'profit' ? '50%' : '60%',
                }}
              />
              <span className="text-[10px] text-slate-400 font-medium">W1 Aug</span>
            </div>

            {/* Week 2 */}
            <div className="flex-1 flex flex-col items-center gap-2 group">
              <div
                className="w-full max-w-[40px] bg-indigo-300 group-hover:bg-indigo-400 rounded-t transition-all"
                style={{
                  height:
                    chartMetric === 'revenue' ? '70%' :
                    chartMetric === 'payments' ? '65%' :
                    chartMetric === 'profit' ? '68%' : '75%',
                }}
              />
              <span className="text-[10px] text-slate-400 font-medium">W2 Aug</span>
            </div>

            {/* Week 3 */}
            <div className="flex-1 flex flex-col items-center gap-2 group">
              <div
                className="w-full max-w-[40px] bg-indigo-400 group-hover:bg-indigo-500 rounded-t transition-all"
                style={{
                  height:
                    chartMetric === 'revenue' ? '60%' :
                    chartMetric === 'payments' ? '50%' :
                    chartMetric === 'profit' ? '55%' : '80%',
                }}
              />
              <span className="text-[10px] text-slate-400 font-medium">W3 Aug</span>
            </div>

            {/* Week 4 */}
            <div className="flex-1 flex flex-col items-center gap-2 group">
              <div
                className="w-full max-w-[40px] bg-indigo-500 group-hover:bg-indigo-600 rounded-t transition-all"
                style={{
                  height:
                    chartMetric === 'revenue' ? '85%' :
                    chartMetric === 'payments' ? '78%' :
                    chartMetric === 'profit' ? '80%' : '90%',
                }}
              />
              <span className="text-[10px] text-slate-400 font-medium">W4 Aug</span>
            </div>

            {/* Current Week (Sep) */}
            <div className="flex-1 flex flex-col items-center gap-2 group">
              <div
                className="w-full max-w-[40px] bg-indigo-600 group-hover:bg-indigo-700 rounded-t transition-all relative"
                style={{
                  height:
                    chartMetric === 'revenue' ? '95%' :
                    chartMetric === 'payments' ? '88%' :
                    chartMetric === 'profit' ? '92%' : '85%',
                }}
              >
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-1.5 py-0.5 rounded font-bold whitespace-nowrap">
                  Current
                </div>
              </div>
              <span className="text-[10px] font-bold text-indigo-700">W1 Sep</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
            <span>
              Peak Value:{' '}
              <strong className="text-slate-900">
                {chartMetric === 'revenue' && `₹${(financial?.totalRevenue || 0).toLocaleString()}`}
                {chartMetric === 'payments' && `₹${(financial?.totalPaymentsReceived || 0).toLocaleString()}`}
                {chartMetric === 'profit' && `₹${(financial?.netProfit || 0).toLocaleString()}`}
                {chartMetric === 'completion' && `${completedWork} Finished Projects`}
              </strong>
            </span>
            <span className="text-emerald-600 font-semibold flex items-center gap-0.5">
              <ArrowUpRight className="w-3.5 h-3.5" /> +24% growth vs previous period
            </span>
          </div>
        </div>
      </section>

      {/* ========================================================
          5. CLIENT RANKINGS & EDITOR RANKINGS
         ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CLIENT RANKINGS */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <div className="flex items-center space-x-2">
              <Award className="w-4 h-4 text-amber-500" />
              <h3 className="font-bold text-slate-900 text-base">Client Rankings</h3>
            </div>
            <span className="text-xs text-slate-400">By Value &amp; Profitability</span>
          </div>

          <div className="space-y-3">
            {/* Highest Paying Client */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                  ★ Highest Paying Client (Cash Inflow)
                </span>
                <p className="font-bold text-slate-900 text-sm mt-0.5">
                  {highestPayingClient?.name || 'N/A'}
                </p>
                <span className="text-xs text-slate-500">{highestPayingClient?.clientType} Client</span>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block">Total Paid</span>
                <span className="text-base font-bold text-emerald-600">
                  ₹{(highestPayingClient?.totalPaid || 0).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Highest Revenue Client */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">
                  ★ Highest Revenue Client (Total Billed)
                </span>
                <p className="font-bold text-slate-900 text-sm mt-0.5">
                  {highestRevenueClient?.name || 'N/A'}
                </p>
                <span className="text-xs text-slate-500">{highestRevenueClient?.clientType} Client</span>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block">Total Billing</span>
                <span className="text-base font-bold text-indigo-600">
                  ₹{(highestRevenueClient?.totalBilling || 0).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Highest Profit Client */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">
                  ★ Highest Profit Client (Margin)
                </span>
                <p className="font-bold text-slate-900 text-sm mt-0.5">
                  {highestProfitClient?.name || 'N/A'}
                </p>
                <span className="text-xs text-slate-500">{highestProfitClient?.clientType} Client</span>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block">Profit Contribution</span>
                <span className="text-base font-bold text-purple-600">
                  ₹{(highestProfitClient?.profit || 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* EDITOR RANKINGS */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <div className="flex items-center space-x-2">
              <Award className="w-4 h-4 text-indigo-600" />
              <h3 className="font-bold text-slate-900 text-base">Editor Rankings</h3>
            </div>
            <span className="text-xs text-slate-400">Workload &amp; Delivery</span>
          </div>

          <div className="space-y-4">
            {/* Top Workload Editor */}
            <div>
              <span className="text-xs font-bold text-slate-700 block mb-2">
                Workload Ranking (Assigned Tasks)
              </span>
              <div className="space-y-2">
                {editorWorkloadRanking.slice(0, 3).map((edt, idx) => (
                  <div
                    key={edt.id}
                    onClick={() => onOpenEditor(edt.id)}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition text-xs"
                  >
                    <div className="flex items-center space-x-2.5">
                      <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-[11px]">
                        #{idx + 1}
                      </span>
                      <div>
                        <p className="font-semibold text-slate-800">{edt.name}</p>
                        <p className="text-[10px] text-slate-400">Rate: ₹{edt.editorRate}/video</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-slate-900">{edt.assignedWork} Assigned</span>
                      <p className="text-[10px] text-amber-600">{edt.inProgress} in progress</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Performance / Completion */}
            <div className="pt-2 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-700 block mb-2">
                Performance Ranking (Completed Deliveries)
              </span>
              <div className="space-y-2">
                {editorPerformanceRanking.slice(0, 3).map((edt, idx) => (
                  <div
                    key={edt.id}
                    onClick={() => onOpenEditor(edt.id)}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition text-xs"
                  >
                    <div className="flex items-center space-x-2.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-[11px]">
                        #{idx + 1}
                      </span>
                      <p className="font-semibold text-slate-800">{edt.name}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-emerald-600">{edt.completed} Completed</span>
                      <p className="text-[10px] text-slate-400">{edt.completionRate}% completion</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          6. RECENT ACTIVITY & AUDIT TRAIL (With Extensive Filters)
         ======================================================== */}
      {/* ========================================================
          6. RECENT ACTIVITY FEED & AUDIT TRAIL
         ======================================================== */}
      <section id="section-recent-activity" className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <ActivityIcon className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-sm">Internal Audit Trail &amp; Activity Log</h4>
              <p className="text-[11px] text-slate-400 font-normal">
                Real-time chronological events ({filteredActivities.length} total logged)
              </p>
            </div>
          </div>

          {/* Quick Date Filters */}
          <div className="flex flex-wrap items-center gap-1 text-xs">
            <button
              onClick={() => setActivityFilterPeriod('all')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                activityFilterPeriod === 'all'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => setActivityFilterPeriod('today')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                activityFilterPeriod === 'today'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setActivityFilterPeriod('week')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                activityFilterPeriod === 'week'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              This Week
            </button>
            <button
              onClick={() => setActivityFilterPeriod('month')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                activityFilterPeriod === 'month'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => setActivityFilterPeriod('custom')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                activityFilterPeriod === 'custom'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Custom Range
            </button>
          </div>
        </div>

        {/* Custom Range & Dropdown Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200 text-xs">
          {activityFilterPeriod === 'custom' && (
            <div className="sm:col-span-2 flex items-center space-x-2">
              <input
                type="date"
                value={activityCustomStart}
                onChange={(e) => setActivityCustomStart(e.target.value)}
                className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
              />
              <span className="text-slate-400">to</span>
              <input
                type="date"
                value={activityCustomEnd}
                onChange={(e) => setActivityCustomEnd(e.target.value)}
                className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
              />
            </div>
          )}

          {/* Activity Type */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
              Activity Type
            </label>
            <select
              value={activityTypeFilter}
              onChange={(e) => setActivityTypeFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">All Activity Types</option>
              <option value="work">Work Created / Updated</option>
              <option value="file">File Uploads &amp; Downloads</option>
              <option value="confirmation">Confirmations</option>
              <option value="payment">Payments</option>
              <option value="portal">Portal Actions</option>
              <option value="revision">Revisions</option>
              <option value="client">Client Profiles</option>
              <option value="editor">Editor Profiles</option>
            </select>
          </div>

          {/* By Client */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
              By Client
            </label>
            <select
              value={activityClientFilter}
              onChange={(e) => setActivityClientFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">All Clients</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* By Editor */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
              By Editor
            </label>
            <select
              value={activityEditorFilter}
              onChange={(e) => setActivityEditorFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">All Editors</option>
              {editors.map((ed) => (
                <option key={ed.id} value={ed.id}>
                  {ed.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Activity Feed List (Format: WHO → ACTION → WHAT → WHEN) with dot indicator */}
        <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto space-y-0.5">
          {filteredActivities.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs italic">
              No activities found matching the selected filters.
            </div>
          ) : (
            filteredActivities.map((act) => (
              <div
                key={act.id}
                className="flex gap-3.5 items-start py-3 px-2 hover:bg-slate-50/80 rounded-lg transition"
              >
                <div
                  className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                    act.action.toLowerCase().includes('payment')
                      ? 'bg-emerald-500'
                      : act.action.toLowerCase().includes('revision')
                      ? 'bg-amber-500'
                      : 'bg-indigo-500'
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] font-bold text-slate-800 truncate">
                      <span className="text-slate-900">{act.who}</span>
                      <span className="text-slate-400 mx-1.5 font-normal">→</span>
                      <span className="text-indigo-600">{act.action}</span>
                    </p>
                    <span className="text-[9px] text-slate-400 font-mono shrink-0">{act.when}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-tight truncate mt-0.5">
                    {act.what}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};
