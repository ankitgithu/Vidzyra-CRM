import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
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
  TrendingUp,
  Calendar,
  DollarSign,
  Wallet,
  ArrowUpRight,
  BarChart3,
  PieChart as PieIcon,
  LineChart as LineIcon,
  CheckCircle2,
  Clock,
  Layers,
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';

interface ExecutionTrendsChartProps {
  financial?: {
    totalRevenue?: number;
    totalPaymentsReceived?: number;
    netProfit?: number;
    grossProfit?: number;
    pendingPayments?: number;
  } | null;
  completedWork?: number;
  totalWork?: number;
}

type LineMetricMode = 'financial' | 'volume';

export const ExecutionTrendsChart: React.FC<ExecutionTrendsChartProps> = () => {
  const { projects, clientPayments, editorPayments, expenses } = useCrm();

  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [lineMetric, setLineMetric] = useState<LineMetricMode>('financial');

  // Discover all months available in data, always including current month
  const availableMonths = useMemo(() => {
    const monthSet = new Set<string>();
    const currentYM = new Date().toISOString().substring(0, 7);
    monthSet.add(currentYM);

    projects.forEach((p) => {
      const d = p.workGivenDate || p.createdAt || p.dueDate || p.deadline;
      if (d && d.length >= 7) monthSet.add(d.substring(0, 7));
    });
    clientPayments.forEach((cp) => {
      const d = cp.date || cp.paymentDate || cp.createdAt;
      if (d && d.length >= 7) monthSet.add(d.substring(0, 7));
    });
    editorPayments.forEach((ep) => {
      const d = ep.date || ep.createdAt;
      if (d && d.length >= 7) monthSet.add(d.substring(0, 7));
    });
    expenses.forEach((e) => {
      const d = e.date || e.createdAt;
      if (d && d.length >= 7) monthSet.add(d.substring(0, 7));
    });

    return Array.from(monthSet).sort().reverse();
  }, [projects, clientPayments, editorPayments, expenses]);

  const formatMonthLabel = (ym: string) => {
    if (ym === 'all') return 'All Months';
    const [year, month] = ym.split('-');
    const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  // Filter datasets strictly by selectedMonth
  const filteredProjects = useMemo(() => {
    if (selectedMonth === 'all') return projects;
    return projects.filter((p) => {
      const d = p.workGivenDate || p.createdAt || p.dueDate || p.deadline;
      return d && d.startsWith(selectedMonth);
    });
  }, [projects, selectedMonth]);

  const filteredClientPayments = useMemo(() => {
    if (selectedMonth === 'all') return clientPayments;
    return clientPayments.filter((cp) => {
      const d = cp.date || cp.paymentDate || cp.createdAt;
      return d && d.startsWith(selectedMonth);
    });
  }, [clientPayments, selectedMonth]);

  const filteredEditorPayments = useMemo(() => {
    if (selectedMonth === 'all') return editorPayments;
    return editorPayments.filter((ep) => {
      const d = ep.date || ep.createdAt;
      return d && d.startsWith(selectedMonth);
    });
  }, [editorPayments, selectedMonth]);

  const filteredExpenses = useMemo(() => {
    if (selectedMonth === 'all') return expenses;
    return expenses.filter((e) => {
      const d = e.date || e.createdAt;
      return d && d.startsWith(selectedMonth);
    });
  }, [expenses, selectedMonth]);

  // Check if data actually exists for this month
  const hasData =
    filteredProjects.length > 0 ||
    filteredClientPayments.length > 0 ||
    filteredExpenses.length > 0 ||
    filteredEditorPayments.length > 0;

  // Real financial aggregates for the selected period
  const totalBilledRevenue = useMemo(() => {
    return filteredProjects.reduce((acc, p) => {
      const bill = Number(p.totalBilling) || (Number(p.quantity) || 1) * (Number(p.clientRate) || 0);
      return acc + bill;
    }, 0);
  }, [filteredProjects]);

  const totalPaymentsReceived = useMemo(() => {
    return filteredClientPayments.reduce((acc, cp) => acc + (Number(cp.amount) || 0), 0);
  }, [filteredClientPayments]);

  const totalCosts = useMemo(() => {
    const editorCosts = filteredProjects.reduce((acc, p) => {
      if (p.workDoneBy === 'Assigned' && p.assignedTo) {
        return acc + (Number(p.editorCost) || (Number(p.quantity) || 1) * (Number(p.editorRate) || 0));
      }
      return acc;
    }, 0);
    const editorPayouts = filteredEditorPayments.reduce((acc, ep) => acc + (Number(ep.amount) || 0), 0);
    const expTotal = filteredExpenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
    return Math.max(editorCosts, editorPayouts) + expTotal;
  }, [filteredProjects, filteredEditorPayments, filteredExpenses]);

  const netProfit = totalBilledRevenue - totalCosts;

  // 1. LINE CHART DATA (Trend over time)
  const lineChartData = useMemo(() => {
    if (!hasData) return [];

    if (selectedMonth === 'all') {
      // Group chronologically by available months
      const monthsChronological = [...availableMonths].reverse();
      return monthsChronological.map((ym) => {
        const [year, month] = ym.split('-');
        const dateObj = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
        const name = dateObj.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });

        const monthProjects = projects.filter((p) => {
          const d = p.workGivenDate || p.createdAt || p.dueDate || p.deadline;
          return d && d.startsWith(ym);
        });
        const monthPayments = clientPayments.filter((cp) => {
          const d = cp.date || cp.paymentDate || cp.createdAt;
          return d && d.startsWith(ym);
        });

        const rev = monthProjects.reduce((sum, p) => {
          return sum + (Number(p.totalBilling) || (Number(p.quantity) || 1) * (Number(p.clientRate) || 0));
        }, 0);
        const pay = monthPayments.reduce((sum, cp) => sum + (Number(cp.amount) || 0), 0);

        return {
          name,
          Revenue: rev,
          'Payments Received': pay,
          Deliverables: monthProjects.length,
        };
      });
    }

    // Specific Month Selected: Group into 4 or 5 intervals (Weeks)
    const [yearStr, monthStr] = selectedMonth.split('-');
    const y = parseInt(yearStr, 10);
    const m = parseInt(monthStr, 10);
    const daysInMonth = new Date(y, m, 0).getDate();

    const intervals = [
      { name: 'Week 1 (1-7)', startDay: 1, endDay: 7 },
      { name: 'Week 2 (8-14)', startDay: 8, endDay: 14 },
      { name: 'Week 3 (15-21)', startDay: 15, endDay: 21 },
      { name: 'Week 4 (22-28)', startDay: 22, endDay: 28 },
    ];
    if (daysInMonth > 28) {
      intervals.push({
        name: `Week 5 (29-${daysInMonth})`,
        startDay: 29,
        endDay: daysInMonth,
      });
    }

    return intervals.map((interval) => {
      let intervalRev = 0;
      let intervalPay = 0;
      let intervalCount = 0;

      filteredProjects.forEach((p) => {
        const d = p.workGivenDate || p.createdAt || p.dueDate || p.deadline;
        if (d && d.startsWith(selectedMonth)) {
          const dayNum = parseInt(d.substring(8, 10), 10);
          if (dayNum >= interval.startDay && dayNum <= interval.endDay) {
            intervalRev += Number(p.totalBilling) || (Number(p.quantity) || 1) * (Number(p.clientRate) || 0);
            intervalCount += 1;
          }
        }
      });

      filteredClientPayments.forEach((cp) => {
        const d = cp.date || cp.paymentDate || cp.createdAt;
        if (d && d.startsWith(selectedMonth)) {
          const dayNum = parseInt(d.substring(8, 10), 10);
          if (dayNum >= interval.startDay && dayNum <= interval.endDay) {
            intervalPay += Number(cp.amount) || 0;
          }
        }
      });

      return {
        name: interval.name,
        Revenue: intervalRev,
        'Payments Received': intervalPay,
        Deliverables: intervalCount,
      };
    });
  }, [hasData, selectedMonth, availableMonths, projects, clientPayments, filteredProjects, filteredClientPayments]);

  // 2. COLUMN / BAR CHART DATA (Comparative metrics)
  const columnChartData = useMemo(() => {
    if (!hasData) return [];

    return [
      {
        name: 'Revenue Billed',
        amount: totalBilledRevenue,
        color: '#4f46e5',
        label: 'Total invoiced/agreed work',
      },
      {
        name: 'Payments Received',
        amount: totalPaymentsReceived,
        color: '#10b981',
        label: 'Cash collected in hand',
      },
      {
        name: 'Operating Costs',
        amount: totalCosts,
        color: '#f43f5e',
        label: 'Editor payouts & agency expenses',
      },
      {
        name: 'Net Profit',
        amount: Math.max(0, netProfit),
        color: '#0284c7',
        label: 'Realized agency earnings',
      },
    ];
  }, [hasData, totalBilledRevenue, totalPaymentsReceived, totalCosts, netProfit]);

  // 3. PIE CHART DATA (Deliverable Work Status Breakdown)
  const pieChartData = useMemo(() => {
    if (!hasData || filteredProjects.length === 0) {
      // If payments/expenses exist but no projects in this month
      if (totalPaymentsReceived > 0 || totalCosts > 0) {
        return [
          { name: 'Payments Received', value: totalPaymentsReceived, color: '#10b981' },
          { name: 'Operating Costs', value: totalCosts, color: '#f43f5e' },
        ].filter((it) => it.value > 0);
      }
      return [];
    }

    const counts: Record<string, number> = {
      Completed: 0,
      'In Progress': 0,
      Pending: 0,
      'Revision Required': 0,
    };

    filteredProjects.forEach((p) => {
      if (p.status === 'Completed' || p.status === 'Delivered') {
        counts.Completed += 1;
      } else if (p.status === 'In Progress' || p.status === 'Assigned') {
        counts['In Progress'] += 1;
      } else if (p.status === 'Revision Required') {
        counts['Revision Required'] += 1;
      } else {
        counts.Pending += 1;
      }
    });

    const colors: Record<string, string> = {
      Completed: '#10b981',
      'In Progress': '#4f46e5',
      Pending: '#f59e0b',
      'Revision Required': '#ec4899',
    };

    return Object.entries(counts)
      .map(([name, value]) => ({
        name,
        value,
        color: colors[name] || '#64748b',
      }))
      .filter((item) => item.value > 0);
  }, [hasData, filteredProjects, totalPaymentsReceived, totalCosts]);

  return (
    <section
      id="section-execution-trends"
      className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6 transition hover:shadow-sm"
    >
      {/* Top Header & Month Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-2xs">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base">Agency Performance &amp; Analytics</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Real-time financial trends, comparative metrics, and deliverable status.
            </p>
          </div>
        </div>

        {/* Month Selector */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <label
            htmlFor="dashboard-month-selector"
            className="text-xs font-semibold text-slate-600 flex items-center gap-1.5"
          >
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>Filter Month:</span>
          </label>
          <select
            id="dashboard-month-selector"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 hover:border-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 cursor-pointer shadow-2xs transition"
          >
            <option value="all">All Months</option>
            {availableMonths.map((ym) => (
              <option key={ym} value={ym}>
                {formatMonthLabel(ym)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Empty State when no records exist for the selected month */}
      {!hasData ? (
        <div className="bg-slate-50/70 border border-dashed border-slate-200 rounded-2xl p-10 text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
            <Calendar className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-slate-800 text-base">No data available for this month</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No projects, client payments, or expenses were recorded for{' '}
              <span className="font-semibold text-slate-700">{formatMonthLabel(selectedMonth)}</span>. Switch to &apos;All Months&apos; or record transactions to display analytics.
            </p>
          </div>
          <button
            type="button"
            id="btn-view-all-months"
            onClick={() => setSelectedMonth('all')}
            className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 shadow-2xs transition cursor-pointer"
          >
            View All Months
          </button>
        </div>
      ) : (
        <>
          {/* Real Financial Snapshot Pill Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3.5 bg-indigo-50/60 border border-indigo-100 rounded-xl">
              <span className="text-[11px] font-semibold text-indigo-700 uppercase tracking-wider block">
                Billed Revenue
              </span>
              <span className="text-lg font-bold text-indigo-950 mt-0.5 block">
                ₹{totalBilledRevenue.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-indigo-600/80">
                {filteredProjects.length} deliverables in period
              </span>
            </div>

            <div className="p-3.5 bg-emerald-50/60 border border-emerald-100 rounded-xl">
              <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider block">
                Payments Received
              </span>
              <span className="text-lg font-bold text-emerald-950 mt-0.5 block">
                ₹{totalPaymentsReceived.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-emerald-600/80">
                {filteredClientPayments.length} client receipts
              </span>
            </div>

            <div className="p-3.5 bg-rose-50/60 border border-rose-100 rounded-xl">
              <span className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider block">
                Total Costs
              </span>
              <span className="text-lg font-bold text-rose-950 mt-0.5 block">
                ₹{totalCosts.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-rose-600/80">Editor payouts &amp; bills</span>
            </div>

            <div className="p-3.5 bg-sky-50/60 border border-sky-100 rounded-xl">
              <span className="text-[11px] font-semibold text-sky-700 uppercase tracking-wider block">
                Agency Profit
              </span>
              <span className="text-lg font-bold text-sky-950 mt-0.5 block">
                ₹{Math.max(0, netProfit).toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-sky-600/80">
                Margin: {totalBilledRevenue > 0 ? Math.round((netProfit / totalBilledRevenue) * 100) : 0}%
              </span>
            </div>
          </div>

          {/* 1. LINE CHART: PERIOD TREND */}
          <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-100 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <LineIcon className="w-4 h-4 text-indigo-600" />
                <h4 className="font-bold text-slate-800 text-sm">
                  {selectedMonth === 'all'
                    ? 'Chronological Trend (All Months)'
                    : `${formatMonthLabel(selectedMonth)} Velocity Trend`}
                </h4>
              </div>

              {/* Line chart metric toggle */}
              <div className="flex items-center p-0.5 bg-white border border-slate-200 rounded-lg text-xs self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setLineMetric('financial')}
                  className={`px-2.5 py-1 rounded-md font-medium transition ${
                    lineMetric === 'financial'
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Revenue &amp; Payments (₹)
                </button>
                <button
                  type="button"
                  onClick={() => setLineMetric('volume')}
                  className={`px-2.5 py-1 rounded-md font-medium transition ${
                    lineMetric === 'volume'
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Deliverables Count
                </button>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                {lineMetric === 'financial' ? (
                  <AreaChart data={lineChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="gradPayments" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: '#64748b', fontSize: 11 }}
                      axisLine={{ stroke: '#cbd5e1' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: '#64748b', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(val) => (val >= 1000 ? `₹${val / 1000}k` : `₹${val}`)}
                    />
                    <Tooltip
                      formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, undefined]}
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderRadius: '0.75rem',
                        border: 'none',
                        color: '#f8fafc',
                        fontSize: '12px',
                        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                      }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                    <Area
                      type="monotone"
                      dataKey="Revenue"
                      stroke="#4f46e5"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#gradRevenue)"
                      activeDot={{ r: 5, fill: '#4f46e5', stroke: '#ffffff', strokeWidth: 2 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="Payments Received"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#gradPayments)"
                      activeDot={{ r: 5, fill: '#10b981', stroke: '#ffffff', strokeWidth: 2 }}
                    />
                  </AreaChart>
                ) : (
                  <AreaChart data={lineChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradVolume" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: '#64748b', fontSize: 11 }}
                      axisLine={{ stroke: '#cbd5e1' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: '#64748b', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      formatter={(val: any) => [`${val} Deliverables`, 'Projects']}
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderRadius: '0.75rem',
                        border: 'none',
                        color: '#f8fafc',
                        fontSize: '12px',
                      }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                    <Area
                      type="monotone"
                      dataKey="Deliverables"
                      stroke="#8b5cf6"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#gradVolume)"
                      activeDot={{ r: 5, fill: '#8b5cf6', stroke: '#ffffff', strokeWidth: 2 }}
                    />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          {/* LOWER SECTION: COLUMN CHART + PIE CHART */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 2. COLUMN / BAR CHART: COMPARISON */}
            <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-100 space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center space-x-2 border-b border-slate-200/60 pb-3 mb-3">
                  <BarChart3 className="w-4 h-4 text-emerald-600" />
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">Financial Breakdown &amp; Comparison</h4>
                    <p className="text-[11px] text-slate-400">
                      Direct balance of revenue, collected payments, expenses, and net profit
                    </p>
                  </div>
                </div>

                <div className="h-60 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={columnChartData}
                      margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                      barSize={40}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis
                        dataKey="name"
                        tick={{ fill: '#64748b', fontSize: 10 }}
                        axisLine={{ stroke: '#cbd5e1' }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: '#64748b', fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(val) => (val >= 1000 ? `₹${val / 1000}k` : `₹${val}`)}
                      />
                      <Tooltip
                        cursor={{ fill: 'rgba(241, 245, 249, 0.6)' }}
                        formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Amount']}
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderRadius: '0.75rem',
                          border: 'none',
                          color: '#f8fafc',
                          fontSize: '12px',
                        }}
                      />
                      <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                        {columnChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Quick summary notes under column chart */}
              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-200/60">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-600" />
                  <span className="text-slate-600 text-[11px]">
                    Revenue: <strong className="text-slate-900">₹{totalBilledRevenue.toLocaleString('en-IN')}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-600" />
                  <span className="text-slate-600 text-[11px]">
                    Received: <strong className="text-slate-900">₹{totalPaymentsReceived.toLocaleString('en-IN')}</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* 3. PIE CHART: STATUS / PROPORTION */}
            <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-100 space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center space-x-2 border-b border-slate-200/60 pb-3 mb-3">
                  <PieIcon className="w-4 h-4 text-purple-600" />
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">Deliverable Status Distribution</h4>
                    <p className="text-[11px] text-slate-400">
                      Part-to-whole breakdown of projects for the selected period
                    </p>
                  </div>
                </div>

                <div className="h-60 w-full flex items-center justify-center">
                  {pieChartData.length === 0 ? (
                    <div className="text-center text-slate-400 text-xs py-8">
                      No project status data to display for this timeframe.
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Tooltip
                          formatter={(val: any, name: any) => [
                            `${val} items (${
                              filteredProjects.length > 0
                                ? Math.round((Number(val) / filteredProjects.length) * 100)
                                : 100
                            }%)`,
                            name,
                          ]}
                          contentStyle={{
                            backgroundColor: '#0f172a',
                            borderRadius: '0.75rem',
                            border: 'none',
                            color: '#f8fafc',
                            fontSize: '12px',
                          }}
                        />
                        <Pie
                          data={pieChartData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={75}
                          innerRadius={45}
                          paddingAngle={4}
                        >
                          {pieChartData.map((entry, index) => (
                            <Cell key={`pie-cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Legend
                          verticalAlign="bottom"
                          iconType="circle"
                          wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Summary footnote under pie chart */}
              <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-200/60">
                <span className="text-[11px]">Total Active Records:</span>
                <span className="font-bold text-slate-800 text-xs">
                  {filteredProjects.length} Deliverables
                </span>
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
};
