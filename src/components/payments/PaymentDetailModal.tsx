import React from 'react';
import {
  X,
  CreditCard,
  Download,
  Edit3,
  CheckCircle2,
  Clock,
  AlertCircle,
  Building,
  User,
  Briefcase,
  Calendar,
  Hash,
  Copy,
  Check,
  History,
  Tag,
  Trash2,
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { ClientPayment, EditorPayment } from '../../types';

interface PaymentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentId: string | null;
  paymentCategory: 'Client' | 'Editor';
  onEditPayment: (payment: ClientPayment | EditorPayment, category: 'Client' | 'Editor') => void;
  onOpenReceipt: (payment: ClientPayment | EditorPayment, category: 'Client' | 'Editor') => void;
  onDeletePayment?: (payment: ClientPayment | EditorPayment, category: 'Client' | 'Editor') => void;
}

export const PaymentDetailModal: React.FC<PaymentDetailModalProps> = ({
  isOpen,
  onClose,
  paymentId,
  paymentCategory,
  onEditPayment,
  onOpenReceipt,
  onDeletePayment,
}) => {
  const {
    clientPayments,
    editorPayments,
    clients,
    editors,
    projects,
    activities,
    getClientStats,
    getEditorStats,
  } = useCrm();

  const [copied, setCopied] = React.useState(false);

  if (!isOpen || !paymentId) return null;

  const payment: ClientPayment | EditorPayment | undefined =
    paymentCategory === 'Client'
      ? clientPayments.find((p) => p.id === paymentId)
      : editorPayments.find((p) => p.id === paymentId);

  if (!payment) return null;

  const isClient = paymentCategory === 'Client';
  const client = isClient ? clients.find((c) => c.id === (payment as ClientPayment).clientId) : null;
  const editor = !isClient ? editors.find((e) => e.id === (payment as EditorPayment).editorId) : null;
  const recipientName = isClient ? (client?.name || 'Unknown Client') : (editor?.name || 'Unknown Editor');

  const project = payment.workId ? projects.find((p) => p.id === payment.workId) : null;

  // Calculate cumulative financial figures
  let totalAmount = 0;
  let totalPaid = 0;
  let remaining = 0;
  let paymentStatus: 'Paid' | 'Partial' | 'Pending' = 'Pending';

  if (isClient) {
    if (project) {
      totalAmount = project.totalBilling;
      const pays = clientPayments.filter((p) => p.workId === project.id);
      totalPaid = pays.reduce((sum, p) => sum + p.amount, 0);
      remaining = Math.max(0, totalAmount - totalPaid);
      paymentStatus = totalPaid >= totalAmount && totalAmount > 0 ? 'Paid' : totalPaid > 0 ? 'Partial' : 'Pending';
    } else if (client) {
      const stats = getClientStats(client.id);
      totalAmount = stats.totalBilling;
      totalPaid = stats.totalPaid;
      remaining = stats.remaining;
      paymentStatus = stats.paymentStatus;
    }
  } else {
    if (project) {
      totalAmount = project.quantity * (project.editorRate || 0);
      const pays = editorPayments.filter((p) => p.workId === project.id);
      totalPaid = pays.reduce((sum, p) => sum + p.amount, 0);
      remaining = Math.max(0, totalAmount - totalPaid);
      paymentStatus = totalPaid >= totalAmount && totalAmount > 0 ? 'Paid' : totalPaid > 0 ? 'Partial' : 'Pending';
    } else if (editor) {
      const stats = getEditorStats(editor.id);
      totalAmount = stats.totalCost;
      totalPaid = stats.totalPaid;
      remaining = stats.remaining;
      paymentStatus = stats.paymentStatus;
    }
  }

  // Related audit / activity items
  const relatedActivities = activities.filter(
    (a) =>
      a.entityId === payment.id ||
      (payment.receiptNumber && a.what?.includes(payment.receiptNumber)) ||
      (isClient && a.clientId === (payment as ClientPayment).clientId && a.entityType === 'payment') ||
      (!isClient && a.editorId === (payment as EditorPayment).editorId && a.entityType === 'payment')
  );

  const handleCopyReceipt = () => {
    navigator.clipboard.writeText(payment.receiptNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in overflow-y-auto">
      <div
        id="payment-detail-modal"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden flex flex-col my-auto max-h-[92vh]"
      >
        {/* Modal Top Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-3">
            <div
              className={`p-2.5 rounded-xl ${
                isClient ? 'bg-emerald-100 text-emerald-700' : 'bg-purple-100 text-purple-700'
              }`}
            >
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-base">
                  {isClient ? 'Client Payment Details' : 'Editor Payment Details'}
                </h3>
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    isClient
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'bg-purple-100 text-purple-800 border border-purple-200'
                  }`}
                >
                  {isClient ? 'Client Inflow' : 'Editor Outflow'}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5">ID: {payment.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
          {/* Main Key Amount Card */}
          <div
            className={`p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              isClient
                ? 'bg-emerald-50/70 border-emerald-200'
                : 'bg-purple-50/70 border-purple-200'
            }`}
          >
            <div>
              <span
                className={`text-[11px] font-bold uppercase tracking-wider block ${
                  isClient ? 'text-emerald-700' : 'text-purple-700'
                }`}
              >
                {isClient ? 'Amount Received' : 'Payout Amount'}
              </span>
              <div
                className={`text-3xl font-black tracking-tight mt-1 ${
                  isClient ? 'text-emerald-900' : 'text-purple-900'
                }`}
              >
                ₹{payment.amount.toLocaleString('en-IN')}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[11px] font-semibold bg-white px-2.5 py-1 rounded-md border border-slate-200 text-slate-700 shadow-2xs">
                  Stage: {payment.paymentType}
                </span>
                <span
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-md flex items-center gap-1 shadow-2xs ${
                    paymentStatus === 'Paid'
                      ? 'bg-emerald-600 text-white'
                      : paymentStatus === 'Partial'
                      ? 'bg-amber-500 text-white'
                      : 'bg-rose-500 text-white'
                  }`}
                >
                  {paymentStatus === 'Paid' ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : paymentStatus === 'Partial' ? (
                    <Clock className="w-3.5 h-3.5" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5" />
                  )}
                  Status: {paymentStatus}
                </span>
              </div>
            </div>

            {/* Receipt Number with Copy */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs min-w-[200px]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Official Receipt Number
              </span>
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono font-bold text-sm text-indigo-700">
                  {payment.receiptNumber}
                </span>
                <button
                  type="button"
                  onClick={handleCopyReceipt}
                  title="Copy Receipt Number"
                  className="p-1 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <span className="text-[10px] text-slate-400 block mt-1">
                Recorded: {payment.date || payment.paymentDate || 'N/A'}
              </span>
            </div>
          </div>

          {/* 2-Column Info Grid: Recipient & Project */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                {isClient ? <Building className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                {isClient ? 'Client Information' : 'Editor Information'}
              </span>
              <div className="font-bold text-slate-900 text-sm">{recipientName}</div>
              {isClient && client?.email && (
                <div className="text-slate-500 text-[11px]">{client.email}</div>
              )}
              {isClient && client?.phone && (
                <div className="text-slate-500 text-[11px]">Phone: {client.phone}</div>
              )}
              {!isClient && editor?.specialty && (
                <div className="text-slate-500 text-[11px]">Role: {editor.specialty}</div>
              )}
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5" />
                Work / Associated Project
              </span>
              {project ? (
                <div>
                  <div className="font-bold text-slate-900 text-sm">{project.name}</div>
                  <div className="text-slate-500 text-[11px] mt-0.5">
                    Type: <span className="font-semibold text-slate-700">{project.workType}</span> (Qty: {project.quantity})
                  </div>
                  <div className="text-slate-500 text-[11px]">
                    Project Status: <span className="font-semibold text-slate-700">{project.status}</span>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="font-semibold text-slate-700 text-sm">General Account Transaction</div>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    Applied across all project deliverables for this account.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Payment Method & Transaction Details */}
          <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Transaction Details &amp; Method
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <span className="text-slate-400 text-[10px] block">Payment Method</span>
                <span className="font-semibold text-slate-800 text-xs">{payment.paymentMethod}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Payment Date</span>
                <span className="font-semibold text-slate-800 text-xs">
                  {payment.date || payment.paymentDate}
                </span>
              </div>
              <div className="col-span-2 sm:col-span-2">
                <span className="text-slate-400 text-[10px] block">Reference / UTR Number</span>
                <span className="font-mono font-semibold text-indigo-700 text-xs break-all">
                  {payment.referenceNumber || 'No reference recorded'}
                </span>
              </div>
            </div>

            {payment.notes && (
              <div className="pt-2 border-t border-slate-100">
                <span className="text-slate-400 text-[10px] block mb-0.5">Remarks / Notes</span>
                <p className="text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  {payment.notes}
                </p>
              </div>
            )}
          </div>

          {/* Cumulative Financial Ledger */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <div className="bg-slate-100 px-4 py-2.5 font-bold text-slate-700 flex items-center justify-between">
              <span>Account Financial Balance</span>
              <span className="text-[11px] font-normal text-slate-500">
                {project ? 'Project Specific' : 'Cumulative Account'}
              </span>
            </div>
            <table className="w-full text-xs text-left">
              <tbody className="divide-y divide-slate-100 text-slate-700">
                <tr className="hover:bg-slate-50/50">
                  <td className="px-4 py-2.5 text-slate-600">
                    Total {isClient ? 'Billing' : 'Editor Cost'}
                  </td>
                  <td className="px-4 py-2.5 text-right font-bold text-slate-900">
                    ₹{totalAmount.toLocaleString('en-IN')}
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="px-4 py-2.5 text-slate-600">
                    Total Payments Received / Paid
                  </td>
                  <td className="px-4 py-2.5 text-right font-bold text-emerald-600">
                    ₹{totalPaid.toLocaleString('en-IN')}
                  </td>
                </tr>
                <tr className="bg-slate-50/80 font-bold">
                  <td className="px-4 py-2.5 text-slate-900">Remaining Balance</td>
                  <td
                    className={`px-4 py-2.5 text-right ${
                      remaining > 0 ? 'text-rose-600' : 'text-emerald-600'
                    }`}
                  >
                    {remaining > 0 ? `₹${remaining.toLocaleString('en-IN')}` : '₹0 (Cleared)'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Activity / Audit Trail */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/40 space-y-2.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <History className="w-3.5 h-3.5" />
              Activity History &amp; Audit Trail
            </span>
            {relatedActivities.length === 0 ? (
              <p className="text-slate-400 italic text-[11px]">
                No specific activity logs recorded for this transaction.
              </p>
            ) : (
              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                {relatedActivities.map((act) => (
                  <div
                    key={act.id}
                    className="p-2 bg-white rounded-lg border border-slate-200 flex items-start justify-between gap-2 text-[11px]"
                  >
                    <div>
                      <span className="font-semibold text-slate-800">{act.who}: </span>
                      <span className="text-indigo-600 font-medium">{act.action}</span>
                      <p className="text-slate-600 mt-0.5">{act.what}</p>
                    </div>
                    <span className="text-slate-400 font-mono text-[10px] whitespace-nowrap">
                      {act.when}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-200 transition"
            >
              Close
            </button>
            {onDeletePayment && (
              <button
                id="btn-delete-payment-details"
                type="button"
                onClick={() => {
                  onClose();
                  onDeletePayment(payment, paymentCategory);
                }}
                className="flex items-center gap-1 px-3 py-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg font-semibold text-xs transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              id="btn-edit-payment-details"
              type="button"
              onClick={() => {
                onClose();
                onEditPayment(payment, paymentCategory);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg font-semibold text-xs shadow-2xs transition"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Edit Payment
            </button>

            <button
              id="btn-download-slip-from-details"
              type="button"
              onClick={() => {
                onClose();
                onOpenReceipt(payment, paymentCategory);
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-xs shadow-xs transition"
            >
              <Download className="w-3.5 h-3.5" />
              Download Payment Slip
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
