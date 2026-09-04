import React, { useState, useMemo, useRef } from 'react';
import {
  TrendingUp,
  Briefcase,
  Users,
  Film,
  CreditCard,
  Download,
  Share2,
  Calendar,
  Filter,
  FileSpreadsheet,
  Printer,
  Copy,
  Check,
  ExternalLink,
  DollarSign,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Search,
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { downloadCsv, isDateInRange } from '../../utils/exportUtils';
import { ProjectStatus, WorkType } from '../../types';

type ReportTab = 'clients' | 'editors' | 'work' | 'payments' | 'financial';
type DatePreset = 'all' | 'today' | 'week' | 'month' | 'year' | 'custom';

export const Reports: React.FC = () => {
  const {
    projects,
    clients,
    editors,
    clientPayments,
    editorPayments,
    expenses,
    settings,
    getClientStats,
    getEditorStats,
  } = useCrm();

  const [activeReport, setActiveReport] = useState<ReportTab>('clients');
  const [datePreset, setDatePreset] = useState<DatePreset>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Additional Filter states
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [editorFilter, setEditorFilter] = useState<string>('all');
  const [workTypeFilter, setWorkTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [copied, setCopied] = useState(false);

  const reportContainerRef = useRef<HTMLDivElement>(null);

  // Compute active date boundaries based on preset
  const { startDate, endDate } = useMemo(() => {
    if (datePreset === 'all') return { startDate: undefined, endDate: undefined };
    if (datePreset === 'custom') return { startDate: customStartDate || undefined, endDate: customEndDate || undefined };

    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const toYMD = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    if (datePreset === 'today') {
      const todayStr = toYMD(now);
      return { startDate: todayStr, endDate: todayStr };
    }

    if (datePreset === 'week') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
      const monday = new Date(now.setDate(diff));
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      return { startDate: toYMD(monday), endDate: toYMD(sunday) };
    }

    if (datePreset === 'month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { startDate: toYMD(firstDay), endDate: toYMD(lastDay) };
    }

    if (datePreset === 'year') {
      const firstDay = new Date(now.getFullYear(), 0, 1);
      const lastDay = new Date(now.getFullYear(), 11, 31);
      return { startDate: toYMD(firstDay), endDate: toYMD(lastDay) };
    }

    return { startDate: undefined, endDate: undefined };
  }, [datePreset, customStartDate, customEndDate]);

  // Filtered dataset according to dates
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const pDate = p.dueDate || p.createdAt?.split('T')[0] || '';
      if (!isDateInRange(pDate, startDate, endDate)) return false;
      if (clientFilter !== 'all' && p.clientId !== clientFilter) return false;
      if (editorFilter !== 'all') {
        if (editorFilter === 'self') {
          if (p.workDoneBy === 'Assigned' && p.assignedTo) return false;
        } else {
          if (p.assignedTo !== editorFilter) return false;
        }
      }
      if (workTypeFilter !== 'all' && p.workType !== workTypeFilter) return false;
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      return true;
    });
  }, [projects, startDate, endDate, clientFilter, editorFilter, workTypeFilter, statusFilter]);

  const filteredClientPayments = useMemo(() => {
    return clientPayments.filter((p) => {
      if (!isDateInRange(p.date, startDate, endDate)) return false;
      if (clientFilter !== 'all' && p.clientId !== clientFilter) return false;
      return true;
    });
  }, [clientPayments, startDate, endDate, clientFilter]);

  const filteredEditorPayments = useMemo(() => {
    return editorPayments.filter((p) => {
      if (!isDateInRange(p.date, startDate, endDate)) return false;
      if (editorFilter !== 'all' && editorFilter !== 'self' && p.editorId !== editorFilter) return false;
      return true;
    });
  }, [editorPayments, startDate, endDate, editorFilter]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => isDateInRange(e.date, startDate, endDate));
  }, [expenses, startDate, endDate]);

  // Client Report Data
  const clientReportRows = useMemo(() => {
    return clients
      .filter((c) => (clientFilter === 'all' ? true : c.id === clientFilter))
      .map((c) => {
        const clientProjects = filteredProjects.filter((p) => p.clientId === c.id);
        const totalBilling = clientProjects.reduce((acc, p) => acc + (p.totalBilling || 0), 0);
        const payments = filteredClientPayments.filter((cp) => cp.clientId === c.id);
        const totalPaid = payments.reduce((acc, cp) => acc + (cp.amount || 0), 0);
        const remaining = totalBilling - totalPaid;

        const statusBreakdown = {
          pending: clientProjects.filter((p) => p.status === 'Pending').length,
          assigned: clientProjects.filter((p) => p.status === 'Assigned').length,
          inProgress: clientProjects.filter((p) => p.status === 'In Progress').length,
          revision: clientProjects.filter((p) => p.status === 'Revision Required').length,
          completed: clientProjects.filter((p) => p.status === 'Completed' || p.status === 'Delivered').length,
        };

        return {
          id: c.id,
          name: c.name,
          email: c.email,
          totalWork: clientProjects.length,
          totalBilling,
          totalPaid,
          remaining,
          statusBreakdown,
        };
      });
  }, [clients, filteredProjects, filteredClientPayments, clientFilter]);

  // Editor Report Data
  const editorReportRows = useMemo(() => {
    return editors
      .filter((e) => (editorFilter === 'all' || editorFilter === 'self' ? true : e.id === editorFilter))
      .map((ed) => {
        const assignedProjects = filteredProjects.filter(
          (p) => p.workDoneBy === 'Assigned' && p.assignedTo === ed.id
        );
        const completedProjects = assignedProjects.filter(
          (p) => p.status === 'Completed' || p.status === 'Delivered'
        );
        const pendingProjects = assignedProjects.filter(
          (p) => p.status !== 'Completed' && p.status !== 'Delivered' && p.status !== 'Cancelled'
        );
        const totalEarnings = assignedProjects.reduce(
          (acc, p) => acc + p.quantity * (p.editorRate || 0),
          0
        );
        const edPayments = filteredEditorPayments.filter((ep) => ep.editorId === ed.id);
        const paidAmount = edPayments.reduce((acc, ep) => acc + (ep.amount || 0), 0);
        const remainingBalance = totalEarnings - paidAmount;

        return {
          id: ed.id,
          name: ed.name,
          email: ed.email,
          phone: ed.phone,
          totalAssigned: assignedProjects.length,
          completedCount: completedProjects.length,
          pendingCount: pendingProjects.length,
          totalEarnings,
          paidAmount,
          remainingBalance,
        };
      });
  }, [editors, filteredProjects, filteredEditorPayments, editorFilter]);

  // Payment Report Data
  const paymentMethodBreakdown = useMemo(() => {
    const methods: Record<string, { received: number; paidOut: number; count: number }> = {};
    filteredClientPayments.forEach((p) => {
      const m = p.paymentMethod || 'Other';
      if (!methods[m]) methods[m] = { received: 0, paidOut: 0, count: 0 };
      methods[m].received += p.amount;
      methods[m].count += 1;
    });
    filteredEditorPayments.forEach((p) => {
      const m = p.paymentMethod || 'Other';
      if (!methods[m]) methods[m] = { received: 0, paidOut: 0, count: 0 };
      methods[m].paidOut += p.amount;
      methods[m].count += 1;
    });
    return methods;
  }, [filteredClientPayments, filteredEditorPayments]);

  const totalPaymentsReceived = useMemo(
    () => filteredClientPayments.reduce((acc, p) => acc + p.amount, 0),
    [filteredClientPayments]
  );
  const totalPaymentsPaidOut = useMemo(
    () => filteredEditorPayments.reduce((acc, p) => acc + p.amount, 0),
    [filteredEditorPayments]
  );

  // Financial / Profit Report Metrics
  const financialData = useMemo(() => {
    const totalRevenue = filteredProjects.reduce((acc, p) => acc + (p.totalBilling || 0), 0);
    const totalEditorCost = filteredProjects.reduce((acc, p) => {
      if (p.workDoneBy === 'Assigned' && p.assignedTo) {
        return acc + p.quantity * (p.editorRate || 0);
      }
      return acc;
    }, 0);
    const grossProfit = totalRevenue - totalEditorCost;
    const totalExp = filteredExpenses.reduce((acc, e) => acc + (e.amount || 0), 0);
    const netProfit = grossProfit - totalExp;
    const profitMarginPercentage =
      totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0;

    return {
      totalRevenue,
      totalEditorCost,
      grossProfit,
      totalExpenses: totalExp,
      netProfit,
      profitMarginPercentage,
      totalCashInflow: totalPaymentsReceived,
      totalCashOutflow: totalPaymentsPaidOut + totalExp,
      netCashflow: totalPaymentsReceived - (totalPaymentsPaidOut + totalExp),
    };
  }, [filteredProjects, filteredExpenses, totalPaymentsReceived, totalPaymentsPaidOut]);

  // Export handlers
  const handleExportCsv = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    if (activeReport === 'clients') {
      const headers = ['Client Name', 'Email', 'Total Deliverables', 'Total Invoiced (INR)', 'Total Paid (INR)', 'Remaining Balance (INR)'];
      const rows = clientReportRows.map((r) => [r.name, r.email, r.totalWork, r.totalBilling, r.totalPaid, r.remaining]);
      downloadCsv(`Vidzyra-Client-Report-${todayStr}.csv`, [headers, ...rows]);
    } else if (activeReport === 'editors') {
      const headers = ['Editor Name', 'Email', 'Total Assigned', 'Completed Work', 'Pending Work', 'Total Earnings (INR)', 'Paid (INR)', 'Remaining Balance (INR)'];
      const rows = editorReportRows.map((r) => [r.name, r.email, r.totalAssigned, r.completedCount, r.pendingCount, r.totalEarnings, r.paidAmount, r.remainingBalance]);
      downloadCsv(`Vidzyra-Editor-Report-${todayStr}.csv`, [headers, ...rows]);
    } else if (activeReport === 'work') {
      const headers = ['Work Name', 'Client', 'Work Type', 'Quantity', 'Client Rate', 'Total Billing', 'Assigned Editor', 'Editor Rate', 'Editor Cost', 'Profit', 'Status', 'Due Date'];
      const rows = filteredProjects.map((p) => {
        const client = clients.find((c) => c.id === p.clientId)?.name || p.clientId;
        const editor = editors.find((e) => e.id === p.assignedTo)?.name || 'In-House';
        const cost = p.workDoneBy === 'Assigned' && p.assignedTo ? p.quantity * p.editorRate : 0;
        const profit = p.totalBilling - cost;
        return [p.name, client, p.workType, p.quantity, p.clientRate, p.totalBilling, editor, p.editorRate, cost, profit, p.status, p.dueDate];
      });
      downloadCsv(`Vidzyra-Work-Report-${todayStr}.csv`, [headers, ...rows]);
    } else if (activeReport === 'payments') {
      const headers = ['Receipt', 'Type', 'Party', 'Date', 'Amount (INR)', 'Stage', 'Method', 'Reference', 'Notes'];
      const rows = [
        ...filteredClientPayments.map((p) => [
          p.receiptNumber,
          'Client Payment',
          clients.find((c) => c.id === p.clientId)?.name || p.clientId,
          p.date,
          p.amount,
          p.paymentType,
          p.paymentMethod,
          p.referenceNumber,
          p.notes,
        ]),
        ...filteredEditorPayments.map((p) => [
          p.receiptNumber,
          'Editor Payout',
          editors.find((e) => e.id === p.editorId)?.name || p.editorId,
          p.date,
          p.amount,
          p.paymentType,
          p.paymentMethod,
          p.referenceNumber,
          p.notes,
        ]),
      ];
      downloadCsv(`Vidzyra-Payment-Report-${todayStr}.csv`, [headers, ...rows]);
    } else {
      const headers = ['Metric', 'Amount (INR)'];
      const rows = [
        ['Total Revenue / Billing', financialData.totalRevenue],
        ['Total Editor Production Cost', financialData.totalEditorCost],
        ['Gross Margin', financialData.grossProfit],
        ['Operating Expenses', financialData.totalExpenses],
        ['Net Agency Profit', financialData.netProfit],
        ['Profit Margin %', `${financialData.profitMarginPercentage}%`],
        ['Total Cash Received', financialData.totalCashInflow],
        ['Total Cash Paid Out', financialData.totalCashOutflow],
        ['Net In-Hand Cashflow', financialData.netCashflow],
      ];
      downloadCsv(`Vidzyra-Financial-Profit-Report-${todayStr}.csv`, [headers, ...rows]);
    }
  };

  const handlePrintPdf = () => {
    window.print();
  };

  const handleDownloadJpg = () => {
    // Generate a simple canvas rendering of the report summary card
    const canvas = document.createElement('canvas');
    canvas.width = 900;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#6366f1';
    ctx.fillRect(40, 40, 60, 60);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText(settings.businessName || 'Vidzyra CRM', 120, 75);

    ctx.font = '14px sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`${activeReport.toUpperCase()} REPORT - Generated ${new Date().toLocaleDateString()}`, 120, 100);

    ctx.fillStyle = '#1e293b';
    ctx.roundRect(40, 140, 820, 400, 16);
    ctx.fill();

    ctx.font = 'bold 18px sans-serif';
    ctx.fillStyle = '#f8fafc';
    ctx.fillText('Executive Performance Snapshot', 70, 180);

    ctx.font = '14px sans-serif';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText(`• Total Deliverables in Scope: ${filteredProjects.length}`, 70, 230);
    ctx.fillText(`• Total Agency Revenue: ₹${(financialData.totalRevenue || 0).toLocaleString()}`, 70, 270);
    ctx.fillText(`• Total Editor Cost: ₹${(financialData.totalEditorCost || 0).toLocaleString()}`, 70, 310);
    ctx.fillText(`• Net Realized Profit: ₹${(financialData.netProfit || 0).toLocaleString()} (${financialData.profitMarginPercentage || 0}%)`, 70, 350);
    ctx.fillText(`• Client Collections: ₹${(financialData.totalCashInflow || 0).toLocaleString()}`, 70, 390);
    ctx.fillText(`• Total Expenses: ₹${(financialData.totalExpenses || 0).toLocaleString()}`, 70, 430);

    ctx.font = 'italic 12px sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText('Generated securely by Vidzyra Media Agency Management Suite', 70, 500);

    const link = document.createElement('a');
    link.download = `Vidzyra-${activeReport}-report-${new Date().toISOString().split('T')[0]}.jpg`;
    link.href = canvas.toDataURL('image/jpeg', 0.95);
    link.click();
  };

  const getReportSummaryText = () => {
    return (
      `📊 *${settings.businessName} - ${activeReport.toUpperCase()} REPORT*\n` +
      `📅 Period: ${datePreset.toUpperCase()} (${startDate || 'Start'} to ${endDate || 'Now'})\n\n` +
      `• Total Deliverables: ${filteredProjects.length}\n` +
      `• Total Invoiced: ₹${(financialData.totalRevenue || 0).toLocaleString()}\n` +
      `• Editor Costs: ₹${(financialData.totalEditorCost || 0).toLocaleString()}\n` +
      `• Net Profit: ₹${(financialData.netProfit || 0).toLocaleString()} (${financialData.profitMarginPercentage || 0}% Margin)\n` +
      `• Cash Collected: ₹${(financialData.totalCashInflow || 0).toLocaleString()}\n\n` +
      `_Generated via Vidzyra CRM_`
    );
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(getReportSummaryText());
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleShareEmail = () => {
    const subject = encodeURIComponent(`${settings.businessName} - ${activeReport.toUpperCase()} Report`);
    const body = encodeURIComponent(getReportSummaryText());
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  const handleCopySummary = () => {
    navigator.clipboard.writeText(getReportSummaryText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div ref={reportContainerRef} className="space-y-6 p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header & Main Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Agency Reports &amp; Analytics</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Real-time calculations from live projects, client invoices, editor compensation, and cashflow.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* CSV Download */}
          <button
            id="btn-report-export-csv"
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
            title="Download CSV report"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Export CSV
          </button>

          {/* Printable PDF */}
          <button
            id="btn-report-export-pdf"
            onClick={handlePrintPdf}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
            title="Print or Save as PDF"
          >
            <Printer className="w-4 h-4" />
            Print / PDF
          </button>

          {/* JPG Snapshot */}
          <button
            id="btn-report-export-jpg"
            onClick={handleDownloadJpg}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold border border-slate-300 transition cursor-pointer"
            title="Download report image"
          >
            <Download className="w-4 h-4" />
            JPG
          </button>

          {/* WhatsApp Share */}
          <button
            id="btn-report-share-wa"
            onClick={handleShareWhatsApp}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
            title="Share via WhatsApp"
          >
            <Share2 className="w-4 h-4" />
            WhatsApp
          </button>

          {/* Email Share */}
          <button
            id="btn-report-share-email"
            onClick={handleShareEmail}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold border border-slate-300 transition cursor-pointer"
            title="Share via Email"
          >
            Email
          </button>

          {/* Copy Summary */}
          <button
            id="btn-report-copy-summary"
            onClick={handleCopySummary}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold border border-slate-300 transition cursor-pointer"
            title="Copy summary text"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Primary Report Subnav Tabs */}
      <div className="flex items-center space-x-1 p-1 bg-slate-100 rounded-xl text-xs font-semibold overflow-x-auto">
        {[
          { id: 'clients', label: '1. Client Report', icon: Users },
          { id: 'editors', label: '2. Editor Report', icon: Film },
          { id: 'work', label: '3. Work / Project Report', icon: Briefcase },
          { id: 'payments', label: '4. Payment Report', icon: CreditCard },
          { id: 'financial', label: '5. Financial / Profit Report', icon: TrendingUp },
        ].map((t) => {
          const Icon = t.icon;
          const isActive = activeReport === t.id;
          return (
            <button
              key={t.id}
              id={`report-tab-${t.id}`}
              onClick={() => setActiveReport(t.id as ReportTab)}
              className={`flex-1 py-2.5 px-3 rounded-lg transition flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
                isActive ? 'bg-white text-indigo-700 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Global Filter Bar: Date Range + Dimension Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Date presets */}
        <div className="flex flex-wrap items-center gap-1.5">
          <Calendar className="w-4 h-4 text-slate-400 mr-1" />
          <span className="font-semibold text-slate-700 mr-1">Timeframe:</span>
          {(['all', 'today', 'week', 'month', 'year', 'custom'] as DatePreset[]).map((p) => (
            <button
              key={p}
              id={`report-date-${p}`}
              onClick={() => setDatePreset(p)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                datePreset === p
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {p === 'all'
                ? 'All Time'
                : p === 'today'
                ? 'Today'
                : p === 'week'
                ? 'This Week'
                : p === 'month'
                ? 'This Month'
                : p === 'year'
                ? 'This Year'
                : 'Custom'}
            </button>
          ))}
        </div>

        {/* Custom Date Inputs if custom is chosen */}
        {datePreset === 'custom' && (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs"
            />
          </div>
        )}

        {/* Contextual Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Client Filter */}
          <select
            id="report-client-filter"
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
            className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 cursor-pointer"
          >
            <option value="all">All Clients</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Editor Filter */}
          <select
            id="report-editor-filter"
            value={editorFilter}
            onChange={(e) => setEditorFilter(e.target.value)}
            className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 cursor-pointer"
          >
            <option value="all">All Editors</option>
            <option value="self">In-House / Self</option>
            {editors.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>

          {/* Work Type Filter (Relevant for Work & Financial reports) */}
          {(activeReport === 'work' || activeReport === 'financial') && (
            <select
              id="report-worktype-filter"
              value={workTypeFilter}
              onChange={(e) => setWorkTypeFilter(e.target.value)}
              className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 cursor-pointer"
            >
              <option value="all">All Work Types</option>
              {[
                'Video Editing',
                'Designing',
                'Vertical Videos',
                'Reels',
                'YouTube Shorts',
                'Poster',
                'Social Media Post',
                'Website Design',
                'Social Media Marketing',
                'Digital Marketing',
              ].map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          )}

          {/* Status Filter (for Work Report) */}
          {activeReport === 'work' && (
            <select
              id="report-status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Assigned">Assigned</option>
              <option value="In Progress">In Progress</option>
              <option value="Revision Required">Revision Required</option>
              <option value="Completed">Completed</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 1. CLIENT REPORT */}
      {/* ========================================================= */}
      {activeReport === 'clients' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold uppercase text-slate-400">Total Clients In Scope</span>
              <div className="text-xl font-bold text-slate-900 mt-1">{clientReportRows.length}</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-indigo-200 bg-indigo-50/20 shadow-2xs">
              <span className="text-[10px] font-bold uppercase text-indigo-700">Total Client Billing</span>
              <div className="text-xl font-bold text-indigo-900 mt-1">
                ₹{clientReportRows.reduce((a, b) => a + (b.totalBilling || 0), 0).toLocaleString()}
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-2xs">
              <span className="text-[10px] font-bold uppercase text-emerald-700">Total Cash Received</span>
              <div className="text-xl font-bold text-emerald-700 mt-1">
                ₹{clientReportRows.reduce((a, b) => a + (b.totalPaid || 0), 0).toLocaleString()}
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-rose-200 bg-rose-50/20 shadow-2xs">
              <span className="text-[10px] font-bold uppercase text-rose-700">Total Outstanding</span>
              <div className="text-xl font-bold text-rose-700 mt-1">
                ₹{clientReportRows.reduce((a, b) => a + Math.max(0, b.remaining || 0), 0).toLocaleString()}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Client Ledger &amp; Work Pipeline Breakdown</h3>
                <p className="text-xs text-slate-500">
                  Calculated from client projects and recorded payment receipts.
                </p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-6 py-3">Client Name</th>
                    <th className="px-4 py-3 text-center">Total Work</th>
                    <th className="px-4 py-3 text-right">Total Billing</th>
                    <th className="px-4 py-3 text-right">Total Paid</th>
                    <th className="px-4 py-3 text-right">Remaining Balance</th>
                    <th className="px-6 py-3 text-center">Work Status Breakdown</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {clientReportRows.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-6 py-3.5">
                        <div className="font-bold text-slate-900">{r.name}</div>
                        <div className="text-[10px] text-slate-400">{r.email}</div>
                      </td>
                      <td className="px-4 py-3.5 text-center font-bold text-slate-800">{r.totalWork}</td>
                      <td className="px-4 py-3.5 text-right font-bold text-slate-900">
                        ₹{(r.totalBilling || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3.5 text-right font-bold text-emerald-600">
                        ₹{(r.totalPaid || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3.5 text-right font-bold">
                        <span className={(r.remaining || 0) > 0 ? 'text-rose-600' : 'text-slate-600'}>
                          ₹{(r.remaining || 0).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-center">
                        <div className="inline-flex items-center gap-1.5 text-[10px]">
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700" title="Pending">
                            {r.statusBreakdown.pending} Pend
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800" title="In Progress">
                            {r.statusBreakdown.inProgress} Prog
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800" title="Revision Required">
                            {r.statusBreakdown.revision} Rev
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800" title="Completed">
                            {r.statusBreakdown.completed} Done
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. EDITOR REPORT */}
      {/* ========================================================= */}
      {activeReport === 'editors' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold uppercase text-slate-400">Total Editors</span>
              <div className="text-xl font-bold text-slate-900 mt-1">{editorReportRows.length}</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-purple-200 bg-purple-50/20 shadow-2xs">
              <span className="text-[10px] font-bold uppercase text-purple-700">Total Editor Earnings</span>
              <div className="text-xl font-bold text-purple-900 mt-1">
                ₹{editorReportRows.reduce((a, b) => a + (b.totalEarnings || 0), 0).toLocaleString()}
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-2xs">
              <span className="text-[10px] font-bold uppercase text-emerald-700">Total Paid Out</span>
              <div className="text-xl font-bold text-emerald-700 mt-1">
                ₹{editorReportRows.reduce((a, b) => a + (b.paidAmount || 0), 0).toLocaleString()}
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-rose-200 bg-rose-50/20 shadow-2xs">
              <span className="text-[10px] font-bold uppercase text-rose-700">Pending Compensation</span>
              <div className="text-xl font-bold text-rose-700 mt-1">
                ₹{editorReportRows.reduce((a, b) => a + Math.max(0, b.remainingBalance || 0), 0).toLocaleString()}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Editor Workload &amp; Production Report</h3>
                <p className="text-xs text-slate-500">
                  Track completed projects, turnaround workload, and payable balances.
                </p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-6 py-3">Editor Name</th>
                    <th className="px-4 py-3 text-center">Total Assigned</th>
                    <th className="px-4 py-3 text-center">Completed Work</th>
                    <th className="px-4 py-3 text-center">Pending Work</th>
                    <th className="px-4 py-3 text-right">Total Earnings</th>
                    <th className="px-4 py-3 text-right">Paid Amount</th>
                    <th className="px-6 py-3 text-right">Remaining Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {editorReportRows.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-6 py-3.5">
                        <div className="font-bold text-slate-900">{r.name}</div>
                        <div className="text-[10px] text-slate-400">{r.email}</div>
                      </td>
                      <td className="px-4 py-3.5 text-center font-bold text-slate-800">{r.totalAssigned}</td>
                      <td className="px-4 py-3.5 text-center font-bold text-emerald-600">{r.completedCount}</td>
                      <td className="px-4 py-3.5 text-center font-bold text-amber-600">{r.pendingCount}</td>
                      <td className="px-4 py-3.5 text-right font-bold text-purple-700">
                        ₹{(r.totalEarnings || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3.5 text-right font-bold text-emerald-600">
                        ₹{(r.paidAmount || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-3.5 text-right font-bold">
                        <span className={(r.remainingBalance || 0) > 0 ? 'text-rose-600' : 'text-slate-600'}>
                          ₹{(r.remainingBalance || 0).toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. WORK / PROJECT REPORT */}
      {/* ========================================================= */}
      {activeReport === 'work' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold uppercase text-slate-400">Deliverables In Filter</span>
              <div className="text-xl font-bold text-slate-900 mt-1">{filteredProjects.length}</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-indigo-200 bg-indigo-50/20 shadow-2xs">
              <span className="text-[10px] font-bold uppercase text-indigo-700">Total Billing</span>
              <div className="text-xl font-bold text-indigo-900 mt-1">
                ₹{(financialData.totalRevenue || 0).toLocaleString()}
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-purple-200 bg-purple-50/20 shadow-2xs">
              <span className="text-[10px] font-bold uppercase text-purple-700">Total Editor Cost</span>
              <div className="text-xl font-bold text-purple-900 mt-1">
                ₹{(financialData.totalEditorCost || 0).toLocaleString()}
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-2xs">
              <span className="text-[10px] font-bold uppercase text-emerald-700">Gross Margin / Profit</span>
              <div className="text-xl font-bold text-emerald-700 mt-1">
                ₹{(financialData.grossProfit || 0).toLocaleString()}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Granular Work &amp; Deliverable Ledger</h3>
                <p className="text-xs text-slate-500">
                  Comprehensive listing filtered by client, editor, type, status, and date range.
                </p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Project / Deliverable</th>
                    <th className="px-3 py-3">Client</th>
                    <th className="px-3 py-3">Type</th>
                    <th className="px-2 py-3 text-center">Qty</th>
                    <th className="px-3 py-3 text-right">Client Rate</th>
                    <th className="px-3 py-3 text-right">Total Billing</th>
                    <th className="px-3 py-3">Editor / Done By</th>
                    <th className="px-3 py-3 text-right">Editor Cost</th>
                    <th className="px-3 py-3 text-right">Profit</th>
                    <th className="px-3 py-3 text-center">Status</th>
                    <th className="px-3 py-3 text-center">Due Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredProjects.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="px-4 py-8 text-center text-slate-400 italic">
                        No projects match the current filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredProjects.map((p) => {
                      const client = clients.find((c) => c.id === p.clientId);
                      const editor = editors.find((e) => e.id === p.assignedTo);
                      const isAssigned = p.workDoneBy === 'Assigned' && p.assignedTo;
                      const cost = isAssigned ? p.quantity * (p.editorRate || 0) : 0;
                      const profit = p.totalBilling - cost;

                      return (
                        <tr key={p.id} className="hover:bg-slate-50/80 transition">
                          <td className="px-4 py-3 font-bold text-slate-900 max-w-xs truncate">{p.name}</td>
                          <td className="px-3 py-3 font-medium text-slate-800">{client?.name || '—'}</td>
                          <td className="px-3 py-3">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                              {p.workType}
                            </span>
                          </td>
                          <td className="px-2 py-3 text-center font-bold text-slate-800">{p.quantity}</td>
                          <td className="px-3 py-3 text-right font-medium text-slate-600">
                            ₹{(p.clientRate || 0).toLocaleString()}
                          </td>
                          <td className="px-3 py-3 text-right font-bold text-slate-900">
                            ₹{(p.totalBilling || 0).toLocaleString()}
                          </td>
                          <td className="px-3 py-3">
                            {isAssigned ? (
                              <span className="text-purple-700 font-medium">{editor?.name || 'Assigned'}</span>
                            ) : (
                              <span className="text-slate-500">In-House</span>
                            )}
                          </td>
                          <td className="px-3 py-3 text-right font-medium text-slate-600">
                            ₹{(cost || 0).toLocaleString()}
                          </td>
                          <td className="px-3 py-3 text-right font-bold text-emerald-600">
                            ₹{(profit || 0).toLocaleString()}
                          </td>
                          <td className="px-3 py-3 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800">
                              {p.status}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-center text-[11px] text-slate-600">{p.dueDate || '—'}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. PAYMENT REPORT */}
      {/* ========================================================= */}
      {activeReport === 'payments' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-2xs">
              <span className="text-[10px] font-bold uppercase text-emerald-700">Total Payments Received</span>
              <div className="text-2xl font-bold text-emerald-700 mt-1">
                ₹{(totalPaymentsReceived || 0).toLocaleString()}
              </div>
              <span className="text-[11px] text-emerald-600">{filteredClientPayments.length} client receipts</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-purple-200 bg-purple-50/20 shadow-2xs">
              <span className="text-[10px] font-bold uppercase text-purple-700">Total Paid Out (Editors)</span>
              <div className="text-2xl font-bold text-purple-900 mt-1">
                ₹{(totalPaymentsPaidOut || 0).toLocaleString()}
              </div>
              <span className="text-[11px] text-purple-600">{filteredEditorPayments.length} disbursements</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-indigo-200 bg-indigo-50/20 shadow-2xs">
              <span className="text-[10px] font-bold uppercase text-indigo-700">Net Payments In-Hand</span>
              <div className="text-2xl font-bold text-indigo-900 mt-1">
                ₹{((totalPaymentsReceived || 0) - (totalPaymentsPaidOut || 0)).toLocaleString()}
              </div>
              <span className="text-[11px] text-indigo-600">Net positive inflow</span>
            </div>
          </div>

          {/* Payment Method Breakdown */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Payment Method Channel Breakdown</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {(Object.entries(paymentMethodBreakdown) as [string, { received: number; paidOut: number; count: number }][]).map(([method, data]) => (
                <div key={method} className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="font-bold text-slate-800 text-xs truncate">{method}</div>
                  <div className="text-sm font-bold text-slate-900 mt-1">
                    ₹{((data.received || 0) - (data.paidOut || 0)).toLocaleString()}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Rec: ₹{(data.received || 0).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Combined Inflows & Outflows List */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">Transaction Ledger</h3>
              <span className="text-xs text-slate-500">
                {filteredClientPayments.length + filteredEditorPayments.length} transactions
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-6 py-3">Receipt No</th>
                    <th className="px-4 py-3">Party Type</th>
                    <th className="px-4 py-3">Beneficiary / Client</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Method</th>
                    <th className="px-4 py-3">Reference No</th>
                    <th className="px-6 py-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredClientPayments.map((p) => {
                    const client = clients.find((c) => c.id === p.clientId);
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition">
                        <td className="px-6 py-3.5 font-mono font-bold text-indigo-700">{p.receiptNumber}</td>
                        <td className="px-4 py-3.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Client Inflow
                          </span>
                        </td>
                        <td className="px-4 py-3.5 font-bold text-slate-900">{client?.name || p.clientId}</td>
                        <td className="px-4 py-3.5 text-slate-600">{p.date}</td>
                        <td className="px-4 py-3.5 text-slate-700">{p.paymentMethod}</td>
                        <td className="px-4 py-3.5 font-mono text-slate-500">{p.referenceNumber || '—'}</td>
                        <td className="px-6 py-3.5 text-right font-bold text-emerald-600">
                          +₹{(p.amount || 0).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                  {filteredEditorPayments.map((p) => {
                    const editor = editors.find((e) => e.id === p.editorId);
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition">
                        <td className="px-6 py-3.5 font-mono font-bold text-purple-700">{p.receiptNumber}</td>
                        <td className="px-4 py-3.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                            Editor Payout
                          </span>
                        </td>
                        <td className="px-4 py-3.5 font-bold text-slate-900">{editor?.name || p.editorId}</td>
                        <td className="px-4 py-3.5 text-slate-600">{p.date}</td>
                        <td className="px-4 py-3.5 text-slate-700">{p.paymentMethod}</td>
                        <td className="px-4 py-3.5 font-mono text-slate-500">{p.referenceNumber || '—'}</td>
                        <td className="px-6 py-3.5 text-right font-bold text-purple-700">
                          -₹{(p.amount || 0).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. FINANCIAL / PROFIT REPORT */}
      {/* ========================================================= */}
      {activeReport === 'financial' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="bg-white p-3.5 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold uppercase text-slate-400">Total Revenue</span>
              <div className="text-lg font-bold text-slate-900 mt-1">
                ₹{(financialData.totalRevenue || 0).toLocaleString()}
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-purple-200 bg-purple-50/20">
              <span className="text-[10px] font-bold uppercase text-purple-700">Editor Cost</span>
              <div className="text-lg font-bold text-purple-700 mt-1">
                ₹{(financialData.totalEditorCost || 0).toLocaleString()}
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-indigo-200 bg-indigo-50/20">
              <span className="text-[10px] font-bold uppercase text-indigo-700">Gross Profit</span>
              <div className="text-lg font-bold text-indigo-900 mt-1">
                ₹{(financialData.grossProfit || 0).toLocaleString()}
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-rose-200 bg-rose-50/20">
              <span className="text-[10px] font-bold uppercase text-rose-700">Agency Expenses</span>
              <div className="text-lg font-bold text-rose-700 mt-1">
                ₹{(financialData.totalExpenses || 0).toLocaleString()}
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-emerald-300 bg-emerald-50/40">
              <span className="text-[10px] font-bold uppercase text-emerald-800">Net Profit ({financialData.profitMarginPercentage || 0}%)</span>
              <div className="text-lg font-bold text-emerald-800 mt-1">
                ₹{(financialData.netProfit || 0).toLocaleString()}
              </div>
            </div>
          </div>

          {/* Mathematical Formula Waterfall */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">P&amp;L Financial Waterfall Calculation</h3>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                Profit Margin: {financialData.profitMarginPercentage || 0}%
              </span>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-slate-600">Total Client Invoiced Revenue</span>
                <span className="font-bold text-slate-900">₹{(financialData.totalRevenue || 0).toLocaleString()}</span>
              </div>
              <div className="py-2.5 flex items-center justify-between text-purple-700">
                <span>(-) Total Editor Production &amp; Editing Costs</span>
                <span className="font-bold">- ₹{(financialData.totalEditorCost || 0).toLocaleString()}</span>
              </div>
              <div className="py-2.5 flex items-center justify-between font-bold text-indigo-900 bg-indigo-50/40 px-3 rounded-lg">
                <span>(=) Gross Profit Margin</span>
                <span>₹{(financialData.grossProfit || 0).toLocaleString()}</span>
              </div>
              <div className="py-2.5 flex items-center justify-between text-rose-600">
                <span>(-) Operational Software &amp; Assets Expenses</span>
                <span className="font-bold">- ₹{(financialData.totalExpenses || 0).toLocaleString()}</span>
              </div>
              <div className="py-2.5 flex items-center justify-between font-bold text-emerald-800 bg-emerald-50/50 px-3 rounded-lg text-sm">
                <span>(=) Net Agency Profit</span>
                <span>₹{(financialData.netProfit || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
