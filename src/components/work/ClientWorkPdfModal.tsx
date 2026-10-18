import React, { useState, useMemo } from 'react';
import {
  X,
  FileDown,
  Calendar,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  FileText,
  User,
  ArrowRight,
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { Client, WorkProject } from '../../types';
import { generateClientWorkStatementPdf } from '../../utils/pdfGenerator';
import { formatWorkDate } from '../../utils/crmDateUtils';
import { formatINR } from '../../utils/currencyUtils';

export type StatementDateFilter = 'all' | 'this-month' | 'last-month' | 'custom';

interface ClientWorkPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client | null;
}

export const ClientWorkPdfModal: React.FC<ClientWorkPdfModalProps> = ({
  isOpen,
  onClose,
  client,
}) => {
  const { projects, settings, getClientStats, getWorkPaymentStats, clientPayments } = useCrm();

  const [dateFilter, setDateFilter] = useState<StatementDateFilter>('all');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [successToast, setSuccessToast] = useState(false);

  // All projects for this specific client
  const allClientProjects = useMemo(() => {
    if (!client) return [];
    return projects
      .filter((p) => {
        const pClientId = p.clientId || (p as any).client_id || (p as any).client?.id;
        return pClientId === client.id;
      })
      .sort((a, b) => {
        const dateA = a.workGivenDate || a.createdAt || a.dueDate || '';
        const dateB = b.workGivenDate || b.createdAt || b.dueDate || '';
        return dateB.localeCompare(dateA);
      });
  }, [projects, client]);

  // Current dates for reference
  const now = new Date();
  const currentYearMonth = now.toISOString().slice(0, 7); // YYYY-MM
  const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevYearMonth = prevMonthDate.toISOString().slice(0, 7); // YYYY-MM

  const currentMonthLabel = now.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  const prevMonthLabel = prevMonthDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

  // Filtered projects based on selected filter
  const filteredProjects = useMemo(() => {
    if (!client) return [];

    return allClientProjects.filter((p) => {
      const pDate = p.workGivenDate || p.createdAt?.split('T')[0] || p.dueDate || '';

      if (dateFilter === 'all') {
        return true;
      }
      if (dateFilter === 'this-month') {
        return pDate.startsWith(currentYearMonth);
      }
      if (dateFilter === 'last-month') {
        return pDate.startsWith(prevYearMonth);
      }
      if (dateFilter === 'custom') {
        if (customStart && pDate < customStart) return false;
        if (customEnd && pDate > customEnd) return false;
        return true;
      }
      return true;
    });
  }, [allClientProjects, dateFilter, customStart, customEnd, currentYearMonth, prevYearMonth, client]);

  // Calculate totals for filtered projects
  const filteredTotals = useMemo(() => {
    let totalPayment = 0;
    let totalReceived = 0;

    filteredProjects.forEach((p) => {
      const pStats = getWorkPaymentStats(p.id);
      const amt = pStats.totalAmount ?? (p.totalBilling ?? ((p.quantity || 1) * (p.clientRate || 0)));
      totalPayment += amt;
      totalReceived += (pStats.paymentReceived ?? 0);
    });

    const remaining = Math.max(0, totalPayment - totalReceived);

    return {
      totalPayment,
      totalReceived,
      remaining,
    };
  }, [filteredProjects, getWorkPaymentStats]);

  // If All Time is selected, we can also cross-check clientStats
  const clientStats = useMemo(() => {
    if (!client) return null;
    return getClientStats(client.id);
  }, [client, getClientStats]);

  if (!isOpen || !client) return null;

  // Determine period label string
  let periodLabel = 'All Time';
  if (dateFilter === 'this-month') {
    periodLabel = `This Month (${currentMonthLabel})`;
  } else if (dateFilter === 'last-month') {
    periodLabel = `Last Month (${prevMonthLabel})`;
  } else if (dateFilter === 'custom') {
    const s = customStart ? formatWorkDate(customStart) : 'Beginning';
    const e = customEnd ? formatWorkDate(customEnd) : 'Today';
    periodLabel = `${s} to ${e}`;
  }

  const handleGeneratePdf = () => {
    setIsGenerating(true);
    try {
      // Use clientStats for all time if available to ensure 100% exact match
      const overallSummary = {
        totalPayment: filteredTotals.totalPayment,
        received: filteredTotals.totalReceived,
        remaining: filteredTotals.remaining,
      };

      generateClientWorkStatementPdf({
        client,
        projects: filteredProjects,
        settings,
        periodLabel,
        getWorkPaymentStats,
        overallPaymentSummary: overallSummary,
      });

      setSuccessToast(true);
      setTimeout(() => {
        setSuccessToast(false);
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-linear-to-r from-slate-50 to-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
              <FileDown className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Download Client Work Statement
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Generate clean, shareable PDF statement for <strong className="text-slate-700">{client.name}</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Client Info Banner */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-400 text-[10px] block uppercase font-bold tracking-wider">Client</span>
              <span className="font-bold text-slate-900">{client.name}</span>
              {(client.phone || client.whatsapp || client.email) && (
                <span className="text-slate-500 text-[11px] block mt-0.5">
                  {client.phone || client.whatsapp || client.email}
                </span>
              )}
            </div>
            <div className="text-right">
              <span className="text-slate-400 text-[10px] block uppercase font-bold tracking-wider">Total Works Recorded</span>
              <span className="font-bold text-indigo-600 text-sm">{allClientProjects.length} Deliverables</span>
            </div>
          </div>

          {/* Filter Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              Select Statement Period:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setDateFilter('all')}
                className={`px-3 py-2.5 rounded-xl border text-xs font-semibold transition text-center cursor-pointer ${
                  dateFilter === 'all'
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700 ring-1 ring-indigo-500/20 shadow-2xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                All Time
              </button>

              <button
                type="button"
                onClick={() => setDateFilter('this-month')}
                className={`px-3 py-2.5 rounded-xl border text-xs font-semibold transition text-center cursor-pointer ${
                  dateFilter === 'this-month'
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700 ring-1 ring-indigo-500/20 shadow-2xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                This Month
              </button>

              <button
                type="button"
                onClick={() => setDateFilter('last-month')}
                className={`px-3 py-2.5 rounded-xl border text-xs font-semibold transition text-center cursor-pointer ${
                  dateFilter === 'last-month'
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700 ring-1 ring-indigo-500/20 shadow-2xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                Last Month
              </button>

              <button
                type="button"
                onClick={() => setDateFilter('custom')}
                className={`px-3 py-2.5 rounded-xl border text-xs font-semibold transition text-center cursor-pointer ${
                  dateFilter === 'custom'
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700 ring-1 ring-indigo-500/20 shadow-2xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                Custom Range
              </button>
            </div>
          </div>

          {/* Custom Date Pickers */}
          {dateFilter === 'custom' && (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 animate-in fade-in">
              <span className="text-[11px] font-bold text-slate-700 block">Custom Date Range:</span>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">From Date:</label>
                  <input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">To Date:</label>
                  <input
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 text-xs focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Statement Preview Summary Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-600">Selected Statement Period:</span>
              <span className="font-bold text-indigo-700">{periodLabel}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-600">Works Included in PDF:</span>
              <span className="font-bold text-slate-900">
                {filteredProjects.length} {filteredProjects.length === 1 ? 'Deliverable' : 'Deliverables'}
              </span>
            </div>

            <div className="h-px bg-slate-200" />

            <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Total Payment</span>
                <span className="font-bold text-slate-900 text-sm">
                  {formatINR(filteredTotals.totalPayment)}
                </span>
              </div>

              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Received</span>
                <span className="font-bold text-emerald-600 text-sm">
                  {formatINR(filteredTotals.totalReceived)}
                </span>
              </div>

              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Remaining</span>
                <span className="font-bold text-rose-600 text-sm">
                  {formatINR(filteredTotals.remaining)}
                </span>
              </div>
            </div>

            {clientStats?.advanceCredit && clientStats.advanceCredit > 0 ? (
              <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-[11px] font-semibold flex items-center justify-between">
                <span>Account Advance Credit:</span>
                <span className="font-bold">+{formatINR(clientStats.advanceCredit)}</span>
              </div>
            ) : null}
          </div>

          {/* Toast on complete */}
          {successToast && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-xs font-semibold animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Statement PDF generated and downloaded successfully!</span>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/70 rounded-xl transition cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            id="btn-confirm-download-client-work-pdf"
            onClick={handleGeneratePdf}
            disabled={isGenerating}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer disabled:opacity-50"
          >
            <FileDown className="w-4 h-4" />
            <span>{isGenerating ? 'Generating Statement...' : 'Download Statement PDF'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
