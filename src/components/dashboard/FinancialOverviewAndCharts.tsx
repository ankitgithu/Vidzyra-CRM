import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import {
  Calendar,
  DollarSign,
  TrendingUp,
  CreditCard,
  Briefcase,
  Share2,
  Layers,
  ArrowUpRight,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
} from 'lucide-react';
import { WorkProject, ClientPayment, Client, SocialMediaClient } from '../../types';

export type FinancialDatePeriod =
  | 'this-month'
  | 'last-month'
  | 'last-3-months'
  | 'last-6-months'
  | 'this-year'
  | 'all-time'
  | 'custom';

interface FinancialOverviewAndChartsProps {
  projects: WorkProject[];
  clientPayments: ClientPayment[];
  clients: Client[];
  socialMediaClients: SocialMediaClient[];
}

export const FinancialOverviewAndCharts: React.FC<FinancialOverviewAndChartsProps> = ({
  projects,
  clientPayments,
  clients,
  socialMediaClients,
}) => {
  // Date filter state
  const [period, setPeriod] = useState<FinancialDatePeriod>('this-month');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [activeChartTab, setActiveChartTab] = useState<'all' | 'comparison' | 'trends' | 'distribution'>('all');

  // Compute start and end ISO dates for the chosen period
  const dateRange = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-indexed

    const pad = (n: number) => String(n).padStart(2, '0');

    let start = '';
    let end = '';

    switch (period) {
      case 'this-month': {
        start = `${year}-${pad(month + 1)}-01`;
        const lastDay = new Date(year, month + 1, 0).getDate();
        end = `${year}-${pad(month + 1)}-${pad(lastDay)}`;
        break;
      }
      case 'last-month': {
        const prev = new Date(year, month - 1, 1);
        const prevYear = prev.getFullYear();
        const prevMonth = prev.getMonth();
        start = `${prevYear}-${pad(prevMonth + 1)}-01`;
        const lastDay = new Date(prevYear, prevMonth + 1, 0).getDate();
        end = `${prevYear}-${pad(prevMonth + 1)}-${pad(lastDay)}`;
        break;
      }
      case 'last-3-months': {
        const threeAgo = new Date(year, month - 2, 1);
        start = `${threeAgo.getFullYear()}-${pad(threeAgo.getMonth() + 1)}-01`;
        const lastDay = new Date(year, month + 1, 0).getDate();
        end = `${year}-${pad(month + 1)}-${pad(lastDay)}`;
        break;
      }
      case 'last-6-months': {
        const sixAgo = new Date(year, month - 5, 1);
        start = `${sixAgo.getFullYear()}-${pad(sixAgo.getMonth() + 1)}-01`;
        const lastDay = new Date(year, month + 1, 0).getDate();
        end = `${year}-${pad(month + 1)}-${pad(lastDay)}`;
        break;
      }
      case 'this-year': {
        start = `${year}-01-01`;
        end = `${year}-12-31`;
        break;
      }
      case 'custom': {
        start = customStart || '1970-01-01';
        end = customEnd || '2099-12-31';
        break;
      }
      case 'all-time':
      default: {
        start = '1970-01-01';
        end = '2099-12-31';
        break;
      }
    }

    return { start, end };
  }, [period, customStart, customEnd]);

  // Helper date checker
  const isDateInRange = (dateStr?: string) => {
    if (!dateStr) return false;
    const clean = dateStr.slice(0, 10);
    return clean >= dateRange.start && clean <= dateRange.end;
  };

  const isCycleInRange = (yearMonth?: string) => {
    if (!yearMonth) return false;
    const cycleStart = `${yearMonth}-01`;
    const [y, m] = yearMonth.split('-').map(Number);
    const lastDay = new Date(y, m, 0).getDate();
    const cycleEnd = `${yearMonth}-${String(lastDay).padStart(2, '0')}`;
    // Overlaps if cycleEnd >= range.start and cycleStart <= range.end
    return cycleEnd >= dateRange.start && cycleStart <= dateRange.end;
  };

  // ========================================================
  // SECTION A: NORMAL CLIENT PAYMENTS (Strict Isolation)
  // ========================================================
  const normalMetrics = useMemo(() => {
    // Filter projects within range
    const filteredProjects = projects.filter((p) => {
      if (period === 'all-time') return true;
      const d = p.workGivenDate || p.createdAt || p.dueDate || p.deadline;
      return isDateInRange(d);
    });

    // Filter normal client payments within range
    const filteredPayments = clientPayments.filter((cp) => {
      if (period === 'all-time') return true;
      const d = cp.paymentDate || cp.date || cp.createdAt;
      return isDateInRange(d);
    });

    const totalRevenue = filteredProjects.reduce((sum, p) => sum + (Number(p.totalBilling) || 0), 0);
    const totalReceived = filteredPayments.reduce((sum, cp) => sum + (Number(cp.amount) || 0), 0);
    const totalRemaining = Math.max(0, totalRevenue - totalReceived);

    // Number of clients with activity
    const activeClientIds = new Set<string>();
    filteredProjects.forEach((p) => {
      if (p.clientId) activeClientIds.add(p.clientId);
    });
    filteredPayments.forEach((cp) => {
      if (cp.clientId) activeClientIds.add(cp.clientId);
    });
    const clientCount = period === 'all-time' ? clients.length : (activeClientIds.size || clients.length);

    // Pending payments count: count of projects or clients with outstanding balance
    const pendingCount = filteredProjects.filter(
      (p) => p.status !== 'Completed' && p.status !== 'Delivered'
    ).length;

    return {
      totalRevenue,
      totalReceived,
      totalRemaining,
      clientCount,
      pendingCount,
    };
  }, [projects, clientPayments, clients, period, dateRange]);

  // ========================================================
  // SECTION B: SOCIAL MEDIA MANAGEMENT PAYMENTS (Strict Isolation)
  // ========================================================
  const smmMetrics = useMemo(() => {
    let totalRevenue = 0;
    let totalReceived = 0;
    let pendingCount = 0;

    socialMediaClients.forEach((client) => {
      const cycles = client.cycles || [];
      cycles.forEach((cycle) => {
        const matchesCycle = period === 'all-time' || isCycleInRange(cycle.yearMonth);
        if (!matchesCycle) return;

        const pkgPrice = Number(cycle.packagePrice) || Number(client.monthlyPackagePrice) || 0;
        const extraWork = (cycle.extraWork || []).reduce((s, e) => s + (Number(e.amount) || 0), 0);
        const cycleTotal = pkgPrice + extraWork;

        const cyclePayments = (cycle.payments || []).reduce((s, p) => s + (Number(p.amount) || 0), 0);

        totalRevenue += cycleTotal;
        totalReceived += cyclePayments;

        if (cycleTotal > cyclePayments) {
          pendingCount += 1;
        }
      });
    });

    const totalRemaining = Math.max(0, totalRevenue - totalReceived);
    const activeClientsCount = socialMediaClients.filter((c) => c.clientStatus === 'Active').length;

    return {
      totalRevenue,
      totalReceived,
      totalRemaining,
      activeClientsCount,
      pendingCount,
    };
  }, [socialMediaClients, period, dateRange]);

  // ========================================================
  // SECTION C: COMBINED FINANCIAL SUMMARY
  // ========================================================
  const combinedMetrics = useMemo(() => {
    const totalRevenue = normalMetrics.totalRevenue + smmMetrics.totalRevenue;
    const totalReceived = normalMetrics.totalReceived + smmMetrics.totalReceived;
    const totalRemaining = Math.max(0, normalMetrics.totalRemaining + smmMetrics.totalRemaining);

    const normalRevPct = totalRevenue > 0 ? Math.round((normalMetrics.totalRevenue / totalRevenue) * 100) : 50;
    const smmRevPct = totalRevenue > 0 ? 100 - normalRevPct : 50;

    return {
      totalRevenue,
      totalReceived,
      totalRemaining,
      normalRevPct,
      smmRevPct,
    };
  }, [normalMetrics, smmMetrics]);

  // ========================================================
  // MONTHLY TIMELINE DATA (For Historical Charts)
  // ========================================================
  const monthlyTimelineData = useMemo(() => {
    // Generate chronological list of the last 6 months (or up to 12 if 'this-year' / 'all-time')
    const monthsCount = period === 'all-time' || period === 'this-year' ? 12 : 6;
    const now = new Date();
    const result: Array<{
      monthKey: string;
      monthLabel: string;
      normalRevenue: number;
      smmRevenue: number;
      combinedRevenue: number;
      normalReceived: number;
      smmReceived: number;
      combinedReceived: number;
      normalRemaining: number;
      smmRemaining: number;
    }> = [];

    for (let i = monthsCount - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });

      // Normal projects in this month
      const mProjects = projects.filter((p) => {
        const dt = p.workGivenDate || p.createdAt || p.dueDate;
        return dt && dt.startsWith(ym);
      });
      const nRev = mProjects.reduce((s, p) => s + (Number(p.totalBilling) || 0), 0);

      // Normal payments in this month
      const mPayments = clientPayments.filter((cp) => {
        const dt = cp.paymentDate || cp.date || cp.createdAt;
        return dt && dt.startsWith(ym);
      });
      const nRec = mPayments.reduce((s, cp) => s + (Number(cp.amount) || 0), 0);

      // SMM in this month
      let sRev = 0;
      let sRec = 0;
      socialMediaClients.forEach((c) => {
        const cy = (c.cycles || []).find((cycle) => cycle.yearMonth === ym);
        if (cy) {
          const pkg = Number(cy.packagePrice) || Number(c.monthlyPackagePrice) || 0;
          const extra = (cy.extraWork || []).reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
          sRev += pkg + extra;
          sRec += (cy.payments || []).reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
        }
      });

      result.push({
        monthKey: ym,
        monthLabel: label,
        normalRevenue: nRev,
        smmRevenue: sRev,
        combinedRevenue: nRev + sRev,
        normalReceived: nRec,
        smmReceived: sRec,
        combinedReceived: nRec + sRec,
        normalRemaining: Math.max(0, nRev - nRec),
        smmRemaining: Math.max(0, sRev - sRec),
      });
    }

    return result;
  }, [projects, clientPayments, socialMediaClients, period]);

  // Distribution Pie Data
  const pieData = useMemo(() => {
    return [
      { name: 'Normal Clients', value: normalMetrics.totalRevenue, color: '#3b82f6' },
      { name: 'Social Media Management', value: smmMetrics.totalRevenue, color: '#6366f1' },
    ];
  }, [normalMetrics.totalRevenue, smmMetrics.totalRevenue]);

  // Side-by-side comparison data
  const comparisonData = useMemo(() => {
    return [
      {
        category: 'Total Revenue',
        'Normal Clients': normalMetrics.totalRevenue,
        'Social Media': smmMetrics.totalRevenue,
      },
      {
        category: 'Received Payment',
        'Normal Clients': normalMetrics.totalReceived,
        'Social Media': smmMetrics.totalReceived,
      },
      {
        category: 'Remaining Payment',
        'Normal Clients': normalMetrics.totalRemaining,
        'Social Media': smmMetrics.totalRemaining,
      },
    ];
  }, [normalMetrics, smmMetrics]);

  const currencyFormatter = (val: number) => `₹${(val || 0).toLocaleString('en-IN')}`;

  return (
    <div className="space-y-6">
      {/* ========================================================
          DATE FILTER BAR (Part 6)
         ======================================================== */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Financial Overview &amp; Analytics</h2>
              <p className="text-[11px] text-slate-500">
                Filter and analyze financial performance across Normal CRM and Social Media Management
              </p>
            </div>
          </div>

          {/* Quick Filter Buttons */}
          <div className="flex items-center gap-1 p-1 bg-slate-100/80 rounded-xl overflow-x-auto">
            {(
              [
                { id: 'this-month', label: 'This Month' },
                { id: 'last-month', label: 'Last Month' },
                { id: 'last-3-months', label: 'Last 3M' },
                { id: 'last-6-months', label: 'Last 6M' },
                { id: 'this-year', label: 'This Year' },
                { id: 'all-time', label: 'All Time' },
                { id: 'custom', label: 'Custom Range' },
              ] as const
            ).map((btn) => (
              <button
                key={btn.id}
                type="button"
                onClick={() => setPeriod(btn.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition cursor-pointer ${
                  period === btn.id
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Date Range Inputs */}
        {period === 'custom' && (
          <div className="pt-2 border-t border-slate-100 flex items-center gap-3 flex-wrap text-xs">
            <span className="font-semibold text-slate-600">Custom Date Range:</span>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="px-2.5 py-1 border border-slate-200 rounded-lg text-slate-800 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              />
              <span className="text-slate-400">to</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="px-2.5 py-1 border border-slate-200 rounded-lg text-slate-800 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* ========================================================
          SECTION C: COMBINED FINANCIAL SUMMARY (Top High-Level)
         ======================================================== */}
      <div className="bg-linear-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-700/60 pb-4 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/20 text-indigo-300 rounded-xl border border-indigo-400/30">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">
                Unified Ecosystem Summary
              </span>
              <h3 className="text-lg font-bold text-white">Combined Financial Overview</h3>
            </div>
          </div>
          <span className="text-xs text-slate-300 font-medium bg-white/10 px-3 py-1 rounded-full self-start sm:self-auto border border-white/10">
            Normal Clients + Social Media Clients
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* 1. Combined Total Revenue */}
          <div className="bg-white/5 p-4 rounded-xl border border-white/10 backdrop-blur-xs">
            <span className="text-[11px] font-semibold text-slate-300 block">Combined Total Revenue</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-white mt-1 tabular-nums">
              ₹{combinedMetrics.totalRevenue.toLocaleString('en-IN')}
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-2">
              <span>Normal: ₹{normalMetrics.totalRevenue.toLocaleString('en-IN')}</span>
              <span>•</span>
              <span>SMM: ₹{smmMetrics.totalRevenue.toLocaleString('en-IN')}</span>
            </p>
          </div>

          {/* 2. Combined Received Payment */}
          <div className="bg-emerald-500/10 p-4 rounded-xl border border-emerald-400/20 backdrop-blur-xs">
            <span className="text-[11px] font-semibold text-emerald-300 block">Combined Received Payment</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 mt-1 tabular-nums">
              ₹{combinedMetrics.totalReceived.toLocaleString('en-IN')}
            </div>
            <p className="text-[11px] text-emerald-200/80 mt-1.5 flex items-center gap-2">
              <span>Normal: ₹{normalMetrics.totalReceived.toLocaleString('en-IN')}</span>
              <span>•</span>
              <span>SMM: ₹{smmMetrics.totalReceived.toLocaleString('en-IN')}</span>
            </p>
          </div>

          {/* 3. Combined Remaining Payment */}
          <div className="bg-rose-500/10 p-4 rounded-xl border border-rose-400/20 backdrop-blur-xs">
            <span className="text-[11px] font-semibold text-rose-300 block">Combined Remaining Payment</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-rose-400 mt-1 tabular-nums">
              ₹{combinedMetrics.totalRemaining.toLocaleString('en-IN')}
            </div>
            <p className="text-[11px] text-rose-200/80 mt-1.5 flex items-center gap-2">
              <span>Normal: ₹{normalMetrics.totalRemaining.toLocaleString('en-IN')}</span>
              <span>•</span>
              <span>SMM: ₹{smmMetrics.totalRemaining.toLocaleString('en-IN')}</span>
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================
          SIDE-BY-SIDE: SECTION A (NORMAL) & SECTION B (SMM)
         ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SECTION A: NORMAL CLIENT PAYMENTS */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-50 text-blue-700 rounded-lg">
                <Briefcase className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">
                  Section A
                </span>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">Normal Client Payments</h3>
              </div>
            </div>
            <span className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-full">
              CRM Projects Ledger
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Total Normal Revenue
              </span>
              <div className="text-lg font-bold text-slate-900 mt-0.5 tabular-nums">
                ₹{normalMetrics.totalRevenue.toLocaleString('en-IN')}
              </div>
            </div>

            <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                Total Received
              </span>
              <div className="text-lg font-bold text-emerald-700 mt-0.5 tabular-nums">
                ₹{normalMetrics.totalReceived.toLocaleString('en-IN')}
              </div>
            </div>

            <div className="bg-rose-50/60 p-3 rounded-xl border border-rose-100 col-span-2 sm:col-span-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 block">
                Total Remaining
              </span>
              <div className="text-lg font-bold text-rose-700 mt-0.5 tabular-nums">
                ₹{normalMetrics.totalRemaining.toLocaleString('en-IN')}
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Number of Clients
              </span>
              <div className="text-lg font-bold text-slate-900 mt-0.5 tabular-nums">
                {normalMetrics.clientCount}
              </div>
              <span className="text-[10px] text-slate-500">Active in period</span>
            </div>

            <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">
                Pending Payments
              </span>
              <div className="text-lg font-bold text-amber-700 mt-0.5 tabular-nums">
                {normalMetrics.pendingCount}
              </div>
              <span className="text-[10px] text-amber-600">Pending tasks</span>
            </div>

            <div className="bg-indigo-50/40 p-3 rounded-xl border border-indigo-100 flex flex-col justify-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 block">
                Collection Ratio
              </span>
              <div className="text-lg font-bold text-indigo-700 mt-0.5 tabular-nums">
                {normalMetrics.totalRevenue > 0
                  ? Math.round((normalMetrics.totalReceived / normalMetrics.totalRevenue) * 100)
                  : 0}
                %
              </div>
            </div>
          </div>
        </div>

        {/* SECTION B: SOCIAL MEDIA MANAGEMENT PAYMENTS */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-indigo-50 text-indigo-700 rounded-lg">
                <Share2 className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">
                  Section B
                </span>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  Social Media Management Payments
                </h3>
              </div>
            </div>
            <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-full">
              Recurring Retainers
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Total Social Revenue
              </span>
              <div className="text-lg font-bold text-slate-900 mt-0.5 tabular-nums">
                ₹{smmMetrics.totalRevenue.toLocaleString('en-IN')}
              </div>
            </div>

            <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                Total Received
              </span>
              <div className="text-lg font-bold text-emerald-700 mt-0.5 tabular-nums">
                ₹{smmMetrics.totalReceived.toLocaleString('en-IN')}
              </div>
            </div>

            <div className="bg-rose-50/60 p-3 rounded-xl border border-rose-100 col-span-2 sm:col-span-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 block">
                Total Remaining
              </span>
              <div className="text-lg font-bold text-rose-700 mt-0.5 tabular-nums">
                ₹{smmMetrics.totalRemaining.toLocaleString('en-IN')}
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Active SMM Clients
              </span>
              <div className="text-lg font-bold text-slate-900 mt-0.5 tabular-nums">
                {smmMetrics.activeClientsCount}
              </div>
              <span className="text-[10px] text-slate-500">Active accounts</span>
            </div>

            <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">
                Pending Cycles
              </span>
              <div className="text-lg font-bold text-amber-700 mt-0.5 tabular-nums">
                {smmMetrics.pendingCount}
              </div>
              <span className="text-[10px] text-amber-600">Balance dues</span>
            </div>

            <div className="bg-indigo-50/40 p-3 rounded-xl border border-indigo-100 flex flex-col justify-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 block">
                Collection Ratio
              </span>
              <div className="text-lg font-bold text-indigo-700 mt-0.5 tabular-nums">
                {smmMetrics.totalRevenue > 0
                  ? Math.round((smmMetrics.totalReceived / smmMetrics.totalRevenue) * 100)
                  : 0}
                %
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          PART 7: FINANCIAL CHARTS & GRAPHS
         ======================================================== */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <div>
            <h3 className="text-base font-bold text-slate-900">Financial Visualizations &amp; Trends</h3>
            <p className="text-xs text-slate-500">
              Comparing payment velocity, revenue distribution, and monthly collection trends
            </p>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-medium">
            <button
              type="button"
              onClick={() => setActiveChartTab('all')}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                activeChartTab === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              All Charts
            </button>
            <button
              type="button"
              onClick={() => setActiveChartTab('comparison')}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                activeChartTab === 'comparison' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Comparisons
            </button>
            <button
              type="button"
              onClick={() => setActiveChartTab('trends')}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                activeChartTab === 'trends' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Trends
            </button>
            <button
              type="button"
              onClick={() => setActiveChartTab('distribution')}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                activeChartTab === 'distribution' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Distribution
            </button>
          </div>
        </div>

        {/* 1. REVENUE COMPARISON & 4. REVENUE DISTRIBUTION */}
        {(activeChartTab === 'all' || activeChartTab === 'comparison' || activeChartTab === 'distribution') && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 1. REVENUE COMPARISON CHART */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">1. Revenue Comparison</h4>
                  <p className="text-[11px] text-slate-500">Normal Client Revenue vs Social Media Management</p>
                </div>
                <div className="flex items-center gap-4 text-xs font-medium">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-blue-500" />
                    <span>Normal Clients</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-indigo-600" />
                    <span>Social Media</span>
                  </div>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparisonData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="category" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis
                      tickFormatter={(val) => `₹${val >= 1000 ? `${Math.round(val / 1000)}k` : val}`}
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      formatter={(val: any) => [currencyFormatter(Number(val)), '']}
                      contentStyle={{
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        fontSize: '12px',
                        fontWeight: 'bold',
                      }}
                    />
                    <Bar dataKey="Normal Clients" fill="#3b82f6" radius={[6, 6, 0, 0]} maxBarSize={45} />
                    <Bar dataKey="Social Media" fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={45} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 4. REVENUE DISTRIBUTION PIE CHART */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900">4. Revenue Distribution</h4>
                <p className="text-[11px] text-slate-500">Percentage Contribution by Category</p>

                <div className="h-48 w-full mt-2 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(val: any) => [currencyFormatter(Number(val)), '']} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Total</span>
                    <span className="text-sm font-bold text-slate-900 tabular-nums">
                      ₹{(combinedMetrics.totalRevenue / 1000).toFixed(0)}k
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-3 border-t border-slate-100 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    <span className="font-medium text-slate-700">Normal CRM</span>
                  </div>
                  <span className="font-bold text-slate-900 tabular-nums">{combinedMetrics.normalRevPct}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                    <span className="font-medium text-slate-700">Social Media</span>
                  </div>
                  <span className="font-bold text-slate-900 tabular-nums">{combinedMetrics.smmRevPct}%</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. PAYMENT COLLECTION CHART & 3. REMAINING PAYMENT CHART */}
        {(activeChartTab === 'all' || activeChartTab === 'comparison') && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 2. PAYMENT COLLECTION CHART */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">2. Payment Collection</h4>
                  <p className="text-[11px] text-slate-500">Normal Received vs Social Media Received</p>
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                  ₹{combinedMetrics.totalReceived.toLocaleString('en-IN')} Collected
                </span>
              </div>

              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      {
                        name: 'Received Payments',
                        'Normal CRM': normalMetrics.totalReceived,
                        'Social Media': smmMetrics.totalReceived,
                      },
                    ]}
                    margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis
                      tickFormatter={(val) => `₹${val >= 1000 ? `${Math.round(val / 1000)}k` : val}`}
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip formatter={(val: any) => [currencyFormatter(Number(val)), '']} />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Bar dataKey="Normal CRM" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={60} />
                    <Bar dataKey="Social Media" fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={60} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 3. REMAINING PAYMENT CHART */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">3. Remaining Payment</h4>
                  <p className="text-[11px] text-slate-500">Normal Remaining vs Social Media Remaining</p>
                </div>
                <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-100">
                  ₹{combinedMetrics.totalRemaining.toLocaleString('en-IN')} Outstanding
                </span>
              </div>

              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      {
                        name: 'Outstanding Balances',
                        'Normal CRM Remaining': normalMetrics.totalRemaining,
                        'Social Media Remaining': smmMetrics.totalRemaining,
                      },
                    ]}
                    margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis
                      tickFormatter={(val) => `₹${val >= 1000 ? `${Math.round(val / 1000)}k` : val}`}
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip formatter={(val: any) => [currencyFormatter(Number(val)), '']} />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Bar dataKey="Normal CRM Remaining" fill="#f43f5e" radius={[6, 6, 0, 0]} maxBarSize={60} />
                    <Bar dataKey="Social Media Remaining" fill="#fb923c" radius={[6, 6, 0, 0]} maxBarSize={60} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* 5. MONTHLY REVENUE GRAPH & 6. PAYMENT COLLECTION TREND */}
        {(activeChartTab === 'all' || activeChartTab === 'trends') && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 5. MONTHLY REVENUE GRAPH */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">5. Monthly Revenue Graph</h4>
                  <p className="text-[11px] text-slate-500">Trend over time: Normal, SMM, and Combined Revenue</p>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyTimelineData} margin={{ top: 10, right: 15, left: 10, bottom: 5 }}>
                    <defs>
                      <linearGradient id="colorCombined" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0f172a" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#0f172a" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorNormal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorSmm" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="monthLabel" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis
                      tickFormatter={(val) => `₹${val >= 1000 ? `${Math.round(val / 1000)}k` : val}`}
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip formatter={(val: any) => [currencyFormatter(Number(val)), '']} />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Area
                      type="monotone"
                      dataKey="combinedRevenue"
                      name="Combined Revenue"
                      stroke="#0f172a"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorCombined)"
                    />
                    <Area
                      type="monotone"
                      dataKey="normalRevenue"
                      name="Normal CRM"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorNormal)"
                    />
                    <Area
                      type="monotone"
                      dataKey="smmRevenue"
                      name="Social Media"
                      stroke="#6366f1"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorSmm)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 6. PAYMENT COLLECTION TREND */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">6. Payment Collection Trend</h4>
                  <p className="text-[11px] text-slate-500">Monthly received payments for Normal and SMM</p>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyTimelineData} margin={{ top: 10, right: 15, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="monthLabel" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis
                      tickFormatter={(val) => `₹${val >= 1000 ? `${Math.round(val / 1000)}k` : val}`}
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip formatter={(val: any) => [currencyFormatter(Number(val)), '']} />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Line
                      type="monotone"
                      dataKey="normalReceived"
                      name="Normal Received"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: '#10b981' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="smmReceived"
                      name="Social Media Received"
                      stroke="#6366f1"
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: '#6366f1' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="combinedReceived"
                      name="Combined Received"
                      stroke="#0f172a"
                      strokeWidth={1.5}
                      strokeDasharray="4 4"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
