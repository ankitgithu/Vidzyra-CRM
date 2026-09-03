import React, { useState } from 'react';
import {
  X,
  User,
  Briefcase,
  CreditCard,
  History,
  Globe,
  Share2,
  ExternalLink,
  Plus,
  AlertCircle,
  FileText,
  Phone,
  Mail,
  MessageSquare,
  Power,
  Trash2,
  Download,
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { ReceiptData } from '../../utils/receiptGenerator';
import { PaymentReceiptModal } from '../payments/PaymentReceiptModal';

interface ClientDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string | null;
  onOpenWork: (workId: string) => void;
  onAddWorkForClient: (clientId: string) => void;
  onAddPaymentForClient: (clientId: string) => void;
  onSharePortal: (clientId: string) => void;
  onEditLink: (workId: string) => void;
}

export const ClientDetailModal: React.FC<ClientDetailModalProps> = ({
  isOpen,
  onClose,
  clientId,
  onOpenWork,
  onAddWorkForClient,
  onAddPaymentForClient,
  onSharePortal,
  onEditLink,
}) => {
  const {
    clients,
    projects,
    clientPayments,
    activities,
    getClientStats,
    setClientPortalStatus,
    setActivePortalUser,
    settings,
  } = useCrm();

  const [activeTab, setActiveTab] = useState<'overview' | 'work' | 'payments' | 'activity' | 'portal'>('overview');
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptData | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!isOpen || !clientId) return null;

  const client = clients.find((c) => c.id === clientId);
  if (!client) return null;

  const stats = getClientStats(client.id);
  const clientProjects = projects.filter((p) => p.clientId === client.id);
  const activeProjects = clientProjects.filter((p) => p.status === 'In Progress' || p.status === 'Revision Required');
  const completedProjects = clientProjects.filter((p) => p.status === 'Completed' || p.status === 'Delivered');
  const pendingProjects = clientProjects.filter((p) => p.status === 'Pending' || p.status === 'Assigned');

  const payments = clientPayments.filter((p) => p.clientId === client.id);
  const clientActivities = activities.filter((a) => a.clientId === client.id);

  const handleOpenReceipt = (pay: typeof payments[0]) => {
    const receipt: ReceiptData = {
      receiptNumber: pay.receiptNumber,
      recipientType: 'Client',
      recipientName: client.name,
      amount: pay.amount,
      date: pay.date,
      paymentType: pay.paymentType,
      paymentMethod: pay.paymentMethod,
      referenceNumber: pay.referenceNumber,
      projectName: clientProjects.find((p) => p.id === pay.workId)?.name || 'All Projects',
      totalAmount: stats.totalBilling,
      totalPaid: stats.totalPaid,
      remainingAmount: stats.remaining,
      paymentStatus: stats.paymentStatus,
      notes: pay.notes,
      businessName: settings.businessName,
      tagline: settings.tagline,
    };
    setSelectedReceipt(receipt);
  };

  const handleDeletePortalPermanent = () => {
    setClientPortalStatus(client.id, 'Deleted');
    setShowDeleteConfirm(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in">
      <div
        id="client-detail-modal"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-start justify-between bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              {client.name.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold text-slate-900">{client.name}</h2>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {client.clientType} Client
                </span>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded ${
                    client.portalStatus === 'Active'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : client.portalStatus === 'Inactive'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  Portal: {client.portalStatus}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Default Rate: ₹{client.defaultClientRate.toLocaleString()} / video • Member since{' '}
                {client.createdAt?.split('T')[0]}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Tabs */}
        <div className="px-6 border-b border-slate-200 flex items-center space-x-6 text-xs font-semibold text-slate-500 bg-white">
          {(['overview', 'work', 'payments', 'activity', 'portal'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 border-b-2 capitalize transition ${
                activeTab === tab
                  ? 'border-indigo-600 text-indigo-600 font-bold'
                  : 'border-transparent hover:text-slate-800'
              }`}
            >
              {tab === 'work' ? `Work (${clientProjects.length})` : tab}
            </button>
          ))}
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Financial Quick Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Total Billing</span>
                  <div className="text-xl font-bold text-slate-900 mt-1">
                    ₹{stats.totalBilling.toLocaleString()}
                  </div>
                  <span className="text-[11px] text-slate-500">{stats.totalWork} deliverables billed</span>
                </div>

                <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40">
                  <span className="text-[10px] font-bold uppercase text-emerald-700">Total Paid</span>
                  <div className="text-xl font-bold text-emerald-700 mt-1">
                    ₹{stats.totalPaid.toLocaleString()}
                  </div>
                  <span className="text-[11px] text-emerald-600 font-medium">{payments.length} transactions</span>
                </div>

                <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40">
                  <span className="text-[10px] font-bold uppercase text-amber-700">Remaining Balance</span>
                  <div className="text-xl font-bold text-amber-700 mt-1">
                    ₹{stats.remaining.toLocaleString()}
                  </div>
                  <span className="text-[11px] text-amber-600 font-medium">Status: {stats.paymentStatus}</span>
                </div>
              </div>

              {/* Client Contact Info */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/40">
                <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-3">
                  Client Contact Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <div>
                      <span className="text-slate-400 block text-[10px]">Email</span>
                      <span className="font-semibold text-slate-800">{client.email || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <div>
                      <span className="text-slate-400 block text-[10px]">Phone</span>
                      <span className="font-semibold text-slate-800">{client.phone || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="w-4 h-4 text-emerald-600" />
                    <div>
                      <span className="text-slate-400 block text-[10px]">WhatsApp</span>
                      <span className="font-semibold text-slate-800">{client.whatsapp || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {client.notes && (
                  <div className="mt-4 pt-3 border-t border-slate-200">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                      Editing Notes &amp; Guidelines
                    </span>
                    <p className="text-xs text-slate-700 bg-white p-3 rounded-lg border border-slate-200">
                      {client.notes}
                    </p>
                  </div>
                )}
              </div>

              {/* Work Breakdown Counts */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                  <span className="text-base font-bold text-amber-800">{activeProjects.length}</span>
                  <p className="text-xs text-amber-700 font-medium mt-0.5">Active Projects</p>
                </div>
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                  <span className="text-base font-bold text-emerald-800">{completedProjects.length}</span>
                  <p className="text-xs text-emerald-700 font-medium mt-0.5">Completed Projects</p>
                </div>
                <div className="p-3 bg-slate-100 rounded-xl border border-slate-200">
                  <span className="text-base font-bold text-slate-800">{pendingProjects.length}</span>
                  <p className="text-xs text-slate-700 font-medium mt-0.5">Pending Projects</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: WORK HISTORY */}
          {activeTab === 'work' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">
                  All work commissioned by {client.name}
                </span>
                <button
                  onClick={() => onAddWorkForClient(client.id)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Work
                </button>
              </div>

              <div className="space-y-3">
                {clientProjects.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-6 text-center">No projects recorded yet.</p>
                ) : (
                  clientProjects.map((p) => (
                    <div
                      key={p.id}
                      className="p-4 rounded-xl border border-slate-200 hover:border-indigo-300 transition bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-900 text-sm">{p.name}</span>
                          <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-medium border border-indigo-200">
                            {p.workType}
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                            {p.status}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-1 flex flex-wrap gap-3">
                          <span>Qty: {p.quantity}</span>
                          <span>Rate: ₹{p.clientRate}</span>
                          <span className="font-semibold text-slate-800">Total: ₹{p.totalBilling.toLocaleString()}</span>
                          <span>Due: {p.dueDate || 'None'}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => onEditLink(p.id)}
                          className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-medium"
                        >
                          Edit Links
                        </button>
                        <button
                          onClick={() => onOpenWork(p.id)}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold"
                        >
                          View Work
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 3: PAYMENT HISTORY */}
          {activeTab === 'payments' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">
                  Total Paid: ₹{stats.totalPaid.toLocaleString()} | Remaining: ₹{stats.remaining.toLocaleString()}
                </span>
                <button
                  onClick={() => onAddPaymentForClient(client.id)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Payment
                </button>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-2.5">Receipt #</th>
                      <th className="px-4 py-2.5">Date</th>
                      <th className="px-4 py-2.5">Amount</th>
                      <th className="px-4 py-2.5">Type</th>
                      <th className="px-4 py-2.5">Method</th>
                      <th className="px-4 py-2.5">Reference</th>
                      <th className="px-4 py-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {payments.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-6 text-center text-slate-400 italic">
                          No payments recorded yet.
                        </td>
                      </tr>
                    ) : (
                      payments.map((pay) => (
                        <tr key={pay.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-mono font-bold text-indigo-600">
                            {pay.receiptNumber}
                          </td>
                          <td className="px-4 py-3 text-slate-600">{pay.date}</td>
                          <td className="px-4 py-3 font-bold text-emerald-600">
                            ₹{pay.amount.toLocaleString()}
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                              {pay.paymentType}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-600">{pay.paymentMethod}</td>
                          <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">
                            {pay.referenceNumber || '—'}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => handleOpenReceipt(pay)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-100 text-indigo-600 rounded-md font-semibold text-[11px] shadow-2xs"
                            >
                              <Download className="w-3 h-3" />
                              Download Payment Slip
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: ACTIVITY HISTORY */}
          {activeTab === 'activity' && (
            <div className="space-y-3">
              <span className="text-xs font-semibold text-slate-500">
                Audit trail for {client.name}
              </span>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl p-3 bg-white">
                {clientActivities.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-4 text-center">No activity logged.</p>
                ) : (
                  clientActivities.map((act) => (
                    <div key={act.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-slate-900">{act.who}</span>
                        <span className="text-indigo-600 font-bold">{act.action}</span>
                        <span className="text-slate-600 truncate max-w-md">{act.what}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">{act.when}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 5: PORTAL MANAGEMENT */}
          {activeTab === 'portal' && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/40 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Globe className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-bold text-slate-900 text-sm">Permanent Client Portal</h3>
                  </div>
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                      client.portalStatus === 'Active'
                        ? 'bg-emerald-100 text-emerald-800'
                        : client.portalStatus === 'Inactive'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {client.portalStatus}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  The client portal allows {client.name} to view real-time work progress, upload raw video footage,
                  download final deliverables, submit review status, request revisions, and communicate via WhatsApp.
                </p>
                <div className="pt-2 flex items-center space-x-2">
                  <button
                    onClick={() => onSharePortal(client.id)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    Share Portal Link
                  </button>
                  <button
                    onClick={() => {
                      setActivePortalUser({ type: 'client', id: client.id });
                      onClose();
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-medium"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Preview Portal View
                  </button>
                </div>
              </div>

              {/* Status Controls: Activate, Inactivate, Delete */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Portal Status Controls
                </h4>

                <div className="flex flex-wrap gap-2">
                  <button
                    id="btn-activate-client-portal"
                    disabled={client.portalStatus === 'Active'}
                    onClick={() => setClientPortalStatus(client.id, 'Active')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      client.portalStatus === 'Active'
                        ? 'bg-emerald-600 text-white opacity-70 cursor-not-allowed'
                        : 'bg-white border border-slate-300 hover:bg-emerald-50 text-slate-700'
                    }`}
                  >
                    Activate
                  </button>

                  <button
                    id="btn-inactivate-client-portal"
                    disabled={client.portalStatus === 'Inactive'}
                    onClick={() => setClientPortalStatus(client.id, 'Inactive')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      client.portalStatus === 'Inactive'
                        ? 'bg-amber-600 text-white opacity-70 cursor-not-allowed'
                        : 'bg-white border border-slate-300 hover:bg-amber-50 text-slate-700'
                    }`}
                  >
                    Inactivate
                  </button>

                  <button
                    id="btn-delete-client-portal"
                    disabled={client.portalStatus === 'Deleted'}
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-rose-300 hover:bg-rose-50 text-rose-700 transition flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>

                {/* Delete Confirmation Alert */}
                {showDeleteConfirm && (
                  <div className="mt-3 p-3.5 bg-rose-50 border border-rose-300 rounded-xl space-y-2 text-xs">
                    <p className="font-bold text-rose-900 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4 text-rose-600" />
                      This portal link will be permanently deleted. This action cannot be undone.
                    </p>
                    <div className="flex items-center space-x-2 pt-1">
                      <button
                        onClick={handleDeletePortalPermanent}
                        className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded font-bold"
                      >
                        Confirm Permanent Deletion
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        className="px-3 py-1 bg-white border border-slate-300 rounded text-slate-700 font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">Client ID: {client.id}</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition"
          >
            Close
          </button>
        </div>
      </div>

      {/* Payment Receipt Modal if selected */}
      <PaymentReceiptModal
        isOpen={!!selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
        receiptData={selectedReceipt}
      />
    </div>
  );
};
