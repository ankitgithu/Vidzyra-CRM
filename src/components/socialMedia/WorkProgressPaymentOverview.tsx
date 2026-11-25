import React, { useState } from 'react';
import {
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertCircle,
  Wallet,
  IndianRupee,
  ChevronDown,
  ChevronUp,
  Info,
  Plus,
  Edit2,
} from 'lucide-react';
import { MonthlyDeliverablePlan, SmmPaymentItem } from '../../types';

export type ProgressPaymentStatus =
  | 'Payment Not Due Yet'
  | 'Payment Due'
  | 'Partially Paid'
  | 'Fully Paid'
  | 'Advance Payment';

export interface SmmProgressPaymentMetrics {
  packagePrice: number;
  totalPlanned: number;
  totalCompleted: number;
  pendingWork: number;
  progressRatio: number;
  progressPercentage: number;
  earnedPayment: number;
  totalPaymentReceived: number;
  collectibleNow: number;
  advancePayment: number;
  totalContractBalance: number;
  extraWorkTotal: number;
  status: ProgressPaymentStatus;
  statusDescription: string;
}

export interface CalculateSmmProgressPaymentInput {
  packagePrice: number;
  deliverables?: MonthlyDeliverablePlan[];
  payments?: SmmPaymentItem[];
  extraWorkTotal?: number;
}

/**
 * Pure calculation helper for SMM monthly cycle Work Progress & Progress-Based Payment.
 * Extra work is strictly excluded from package progress and earned package calculations.
 */
export function calculateSmmProgressPayment({
  packagePrice,
  deliverables = [],
  payments = [],
  extraWorkTotal = 0,
}: CalculateSmmProgressPaymentInput): SmmProgressPaymentMetrics {
  const safePackagePrice = Math.max(0, Number(packagePrice) || 0);
  const safeExtraWorkTotal = Math.max(0, Number(extraWorkTotal) || 0);

  const totalPlanned = deliverables.reduce(
    (sum, item) => sum + Math.max(0, Number(item.planned) || 0),
    0
  );
  const totalCompleted = deliverables.reduce(
    (sum, item) => sum + Math.max(0, Number(item.completed) || 0),
    0
  );
  const pendingWork = Math.max(0, totalPlanned - totalCompleted);

  const rawRatio = totalPlanned > 0 ? totalCompleted / totalPlanned : 0;
  const progressRatio = Math.min(1, Math.max(0, rawRatio));
  const progressPercentage = Number((progressRatio * 100).toFixed(1));

  const earnedPayment = Math.round(safePackagePrice * progressRatio);

  const totalPaymentReceived = payments.reduce(
    (sum, p) => sum + Math.max(0, Number(p.amount) || 0),
    0
  );

  const collectibleNow = Math.max(0, earnedPayment - totalPaymentReceived);
  const advancePayment = Math.max(0, totalPaymentReceived - earnedPayment);
  const totalContractBalance = Math.max(0, safePackagePrice - totalPaymentReceived);

  let status: ProgressPaymentStatus;
  let statusDescription: string;

  if (safePackagePrice > 0 && totalPaymentReceived >= safePackagePrice && progressPercentage >= 100) {
    status = 'Fully Paid';
    statusDescription = 'All planned deliverables completed (100%) and full monthly package amount received.';
  } else if (totalPaymentReceived > earnedPayment) {
    status = 'Advance Payment';
    statusDescription =
      totalPaymentReceived >= safePackagePrice && safePackagePrice > 0
        ? `Full package received in advance (₹${advancePayment.toLocaleString('en-IN')} ahead of completed work value).`
        : `Client has paid ₹${advancePayment.toLocaleString('en-IN')} in advance beyond current earned work value.`;
  } else if (earnedPayment === 0) {
    status = 'Payment Not Due Yet';
    statusDescription = 'Complete planned deliverables to unlock progress-based earned payment.';
  } else if (totalPaymentReceived === earnedPayment) {
    status = 'Payment Not Due Yet';
    statusDescription = 'Completed work value to date is fully covered. Next payment unlocks as more deliverables finish.';
  } else if (totalPaymentReceived > 0 && totalPaymentReceived < earnedPayment) {
    status = 'Partially Paid';
    statusDescription = `₹${collectibleNow.toLocaleString('en-IN')} can be collected now based on ${progressPercentage}% completed work.`;
  } else {
    status = 'Payment Due';
    statusDescription = `₹${collectibleNow.toLocaleString('en-IN')} is ready to collect based on ${progressPercentage}% completed work.`;
  }

  return {
    packagePrice: safePackagePrice,
    totalPlanned,
    totalCompleted,
    pendingWork,
    progressRatio,
    progressPercentage,
    earnedPayment,
    totalPaymentReceived,
    collectibleNow,
    advancePayment,
    totalContractBalance,
    extraWorkTotal: safeExtraWorkTotal,
    status,
    statusDescription,
  };
}

interface WorkProgressPaymentOverviewProps {
  cycleLabel: string;
  packagePrice: number;
  deliverables?: MonthlyDeliverablePlan[];
  payments?: SmmPaymentItem[];
  extraWorkTotal?: number;
  onRecordPayment?: () => void;
  onEditPackagePrice?: () => void;
}

export const WorkProgressPaymentOverview: React.FC<WorkProgressPaymentOverviewProps> = ({
  cycleLabel,
  packagePrice,
  deliverables = [],
  payments = [],
  extraWorkTotal = 0,
  onRecordPayment,
  onEditPackagePrice,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const metrics = calculateSmmProgressPayment({
    packagePrice,
    deliverables,
    payments,
    extraWorkTotal,
  });

  const statusVisual = (() => {
    switch (metrics.status) {
      case 'Fully Paid':
        return {
          textColor: 'text-emerald-700',
          bgColor: 'bg-emerald-50',
          borderColor: 'border-emerald-200',
          icon: CheckCircle2,
        };
      case 'Advance Payment':
        return {
          textColor: 'text-indigo-700',
          bgColor: 'bg-indigo-50',
          borderColor: 'border-indigo-200',
          icon: Wallet,
        };
      case 'Partially Paid':
        return {
          textColor: 'text-amber-700',
          bgColor: 'bg-amber-50',
          borderColor: 'border-amber-200',
          icon: Clock,
        };
      case 'Payment Due':
        return {
          textColor: 'text-orange-700',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          icon: AlertCircle,
        };
      case 'Payment Not Due Yet':
      default:
        return {
          textColor: 'text-slate-700',
          bgColor: 'bg-slate-100',
          borderColor: 'border-slate-200',
          icon: Info,
        };
    }
  })();

  const StatusIcon = statusVisual.icon;

  return (
    <section
      id="section-smm-work-progress-payment"
      className="border border-slate-200 rounded-xl bg-white shadow-2xs overflow-hidden"
    >
      {/* Header Bar */}
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1.5 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-600 shrink-0">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-slate-900 text-sm truncate">
              Work Progress &amp; Payment Overview
            </h3>
            <p className="text-[11px] text-slate-500">
              {cycleLabel} · Auto-calculated from completed deliverables and recorded payments
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {/* Payment Collection Status Indicator */}
          <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-bold ${statusVisual.bgColor} ${statusVisual.textColor} ${statusVisual.borderColor}`}
          >
            <StatusIcon className="w-3.5 h-3.5 shrink-0" />
            <span>{metrics.status}</span>
          </div>

          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200/70 rounded-lg transition cursor-pointer"
            title={isExpanded ? 'Collapse Overview' : 'Expand Overview'}
            aria-expanded={isExpanded}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Overall Work Progress Bar & Deliverable Counts */}
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                <span className="text-slate-600">
                  Total Planned Work:{' '}
                  <strong className="text-slate-900 tabular-nums">{metrics.totalPlanned}</strong>
                </span>
                <span className="text-slate-300 hidden sm:inline">·</span>
                <span className="text-emerald-700">
                  Completed Work:{' '}
                  <strong className="tabular-nums">{metrics.totalCompleted}</strong>
                </span>
                <span className="text-slate-300 hidden sm:inline">·</span>
                <span className="text-orange-600">
                  Pending Work:{' '}
                  <strong className="tabular-nums">{metrics.pendingWork}</strong>
                </span>
              </div>

              <div className="flex items-baseline gap-1.5">
                <span className="text-[11px] font-semibold text-slate-500">Overall Completion</span>
                <span className="text-lg font-bold text-slate-900 tabular-nums">
                  {metrics.progressPercentage}%
                </span>
              </div>
            </div>

            {/* Visual Progress Bar */}
            <div
              className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/70"
              role="progressbar"
              aria-valuenow={metrics.progressPercentage}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Overall work completion percentage"
            >
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  metrics.progressPercentage >= 100
                    ? 'bg-emerald-600'
                    : metrics.progressPercentage > 0
                    ? 'bg-indigo-600'
                    : 'bg-slate-300'
                }`}
                style={{ width: `${metrics.progressPercentage}%` }}
              />
            </div>

            {metrics.totalPlanned === 0 && (
              <p className="text-[11px] text-slate-400 italic">
                Add planned deliverables below to track work progress and earned payment automatically.
              </p>
            )}
          </div>

          {/* 6 Dynamic Payment Overview Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {/* 1. Monthly Package Price */}
            <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] font-bold text-slate-500 block leading-tight">
                  Monthly Package Price
                </span>
                {onEditPackagePrice && (
                  <button
                    type="button"
                    onClick={onEditPackagePrice}
                    className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer shrink-0"
                    title="Edit agreed monthly package price"
                  >
                    <Edit2 className="w-2.5 h-2.5" />
                    <span>Edit</span>
                  </button>
                )}
              </div>
              <div className="text-base font-bold text-slate-900 mt-1 tabular-nums">
                ₹{metrics.packagePrice.toLocaleString('en-IN')}
              </div>
              <span className="text-[10px] text-slate-500 mt-0.5 block">Base retainer</span>
            </div>

            {/* 2. Work Completion Percentage */}
            <div className="bg-indigo-50/40 p-3 rounded-xl border border-indigo-200">
              <span className="text-[10px] font-bold text-indigo-700 block leading-tight">
                Work Completion
              </span>
              <div className="text-base font-bold text-indigo-900 mt-1 tabular-nums">
                {metrics.progressPercentage}%
              </div>
              <span className="text-[10px] text-indigo-600 mt-0.5 block tabular-nums">
                {metrics.totalCompleted} of {metrics.totalPlanned} done
              </span>
            </div>

            {/* 3. Earned Payment (Value of Completed Work) */}
            <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-500 block leading-tight">
                Earned Payment
              </span>
              <div className="text-base font-bold text-slate-900 mt-1 tabular-nums">
                ₹{metrics.earnedPayment.toLocaleString('en-IN')}
              </div>
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                Value of completed work
              </span>
            </div>

            {/* 4. Total Payment Received */}
            <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-200">
              <span className="text-[10px] font-bold text-emerald-700 block leading-tight">
                Total Payment Received
              </span>
              <div className="text-base font-bold text-emerald-700 mt-1 tabular-nums">
                ₹{metrics.totalPaymentReceived.toLocaleString('en-IN')}
              </div>
              <span className="text-[10px] text-emerald-600 mt-0.5 block tabular-nums">
                {payments.length} payment{payments.length === 1 ? '' : 's'}
              </span>
            </div>

            {/* 5. Payment Collectible Now (or Advance Payment if received > earned) */}
            {metrics.advancePayment > 0 && metrics.status === 'Advance Payment' ? (
              <div className="bg-indigo-50/60 p-3 rounded-xl border border-indigo-200">
                <span className="text-[10px] font-bold text-indigo-700 block leading-tight">
                  Advance Payment
                </span>
                <div className="text-base font-bold text-indigo-700 mt-1 tabular-nums">
                  ₹{metrics.advancePayment.toLocaleString('en-IN')}
                </div>
                <span className="text-[10px] text-indigo-600 mt-0.5 block">
                  Collectible Now: ₹0
                </span>
              </div>
            ) : (
              <div
                className={`p-3 rounded-xl border ${
                  metrics.collectibleNow > 0
                    ? 'bg-orange-50/70 border-orange-200'
                    : 'bg-emerald-50/40 border-emerald-200'
                }`}
              >
                <span
                  className={`text-[10px] font-bold block leading-tight ${
                    metrics.collectibleNow > 0 ? 'text-orange-700' : 'text-emerald-700'
                  }`}
                >
                  Payment Collectible Now
                </span>
                <div
                  className={`text-base font-bold mt-1 tabular-nums ${
                    metrics.collectibleNow > 0 ? 'text-orange-700' : 'text-emerald-700'
                  }`}
                >
                  ₹{metrics.collectibleNow.toLocaleString('en-IN')}
                </div>
                <span
                  className={`text-[10px] mt-0.5 block ${
                    metrics.collectibleNow > 0 ? 'text-orange-600' : 'text-emerald-600'
                  }`}
                >
                  {metrics.collectibleNow > 0 ? 'Due for completed work' : 'Up to date'}
                </span>
              </div>
            )}

            {/* 6. Total Contract Balance */}
            <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-500 block leading-tight">
                Total Contract Balance
              </span>
              <div
                className={`text-base font-bold mt-1 tabular-nums ${
                  metrics.totalContractBalance > 0 ? 'text-slate-900' : 'text-emerald-700'
                }`}
              >
                ₹{metrics.totalContractBalance.toLocaleString('en-IN')}
              </div>
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                Package − Received
              </span>
            </div>
          </div>

          {/* Collectible Action & Breakdown Strip */}
          <div
            className={`px-3.5 py-2.5 rounded-xl border flex flex-wrap items-center justify-between gap-3 ${statusVisual.bgColor} ${statusVisual.borderColor}`}
          >
            <div className="flex items-start sm:items-center gap-2 text-xs min-w-0">
              <IndianRupee className={`w-4 h-4 shrink-0 mt-0.5 sm:mt-0 ${statusVisual.textColor}`} />
              <div className="space-y-0.5">
                <p className={`font-semibold ${statusVisual.textColor}`}>
                  {metrics.statusDescription}
                </p>
                <p className="text-[11px] text-slate-600 tabular-nums">
                  Earned (₹{metrics.earnedPayment.toLocaleString('en-IN')}) − Received (₹
                  {metrics.totalPaymentReceived.toLocaleString('en-IN')}) ={' '}
                  {metrics.advancePayment > 0 && metrics.status === 'Advance Payment' ? (
                    <strong className="text-indigo-700">
                      Advance ₹{metrics.advancePayment.toLocaleString('en-IN')} (₹0 due now)
                    </strong>
                  ) : (
                    <strong className={metrics.collectibleNow > 0 ? 'text-orange-700' : 'text-emerald-700'}>
                      Collectible Now ₹{metrics.collectibleNow.toLocaleString('en-IN')}
                    </strong>
                  )}
                </p>
              </div>
            </div>

            {onRecordPayment && metrics.collectibleNow > 0 && (
              <button
                type="button"
                onClick={onRecordPayment}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition shadow-2xs cursor-pointer whitespace-nowrap shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Collect Payment</span>
              </button>
            )}
          </div>

          {/* Separate Extra Work Disclosure (if applicable) */}
          {metrics.extraWorkTotal > 0 && (
            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
              <span>
                Extra Work Charges (billed separately from monthly package progress):
              </span>
              <strong className="text-purple-700 tabular-nums">
                ₹{metrics.extraWorkTotal.toLocaleString('en-IN')}
              </strong>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
