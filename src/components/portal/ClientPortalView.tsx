import React, { useState } from 'react';
import {
  ExternalLink,
  MessageSquare,
  CheckCircle,
  AlertTriangle,
  FileCheck,
  Download,
  LogOut,
  FolderDown,
  FolderUp,
  CreditCard,
  Briefcase,
  AlertCircle,
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { ProjectStatus } from '../../types';
import { ReceiptData } from '../../utils/receiptGenerator';
import { PaymentReceiptModal } from '../payments/PaymentReceiptModal';

interface ClientPortalViewProps {
  clientId: string;
  onExit?: () => void;
  isSharedPortal?: boolean;
}

export const ClientPortalView: React.FC<ClientPortalViewProps> = ({
  clientId,
  onExit,
  isSharedPortal = false,
}) => {
  const { clients, projects, clientPayments, getClientStats, updateProjectReview, settings } = useCrm();

  const client = clients.find((c) => c.id === clientId);

  const [revisionWorkId, setRevisionWorkId] = useState<string | null>(null);
  const [revisionNotes, setRevisionNotes] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptData | null>(null);

  if (!client) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-center">
        <div className="bg-white p-8 rounded-2xl max-w-md w-full shadow-2xl space-y-4">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-xl font-bold text-slate-900">Client Portal Not Found</h2>
          <p className="text-xs text-slate-500">
            The requested client portal link is invalid or has expired. Please contact Vidzyra support.
          </p>
          {!isSharedPortal && onExit && (
            <button
              onClick={onExit}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
            >
              Return to Admin Dashboard
            </button>
          )}
        </div>
      </div>
    );
  }

  // If portal is Inactive or Deleted:
  if (client.portalStatus !== 'Active') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-center">
        <div className="bg-white p-8 rounded-2xl max-w-md w-full shadow-2xl space-y-4">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
          <h2 className="text-xl font-bold text-slate-900">Portal Access Suspended</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            This client portal is currently marked as{' '}
            <strong className="text-slate-800">{client.portalStatus}</strong>. Please reach out to Vidzyra management
            to restore your project access.
          </p>
          {!isSharedPortal && onExit && (
            <div className="pt-2 flex justify-center gap-2">
              <button
                onClick={onExit}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Exit to Admin
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  const stats = getClientStats(client.id);
  const clientProjects = projects.filter((p) => p.clientId === client.id);
  const payments = clientPayments.filter((p) => p.clientId === client.id);

  const handleApprove = (workId: string) => {
    updateProjectReview(workId, 'Approved', 'Deliverable approved by client.');
  };

  const handleOpenRevisionModal = (workId: string) => {
    setRevisionWorkId(workId);
    setRevisionNotes('');
  };

  const handleSubmitRevision = () => {
    if (!revisionWorkId || !revisionNotes.trim()) return;
    updateProjectReview(revisionWorkId, 'Revision Requested', revisionNotes.trim());
    setRevisionWorkId(null);
    setRevisionNotes('');
  };

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
      projectName: clientProjects.find((p) => p.id === pay.workId)?.name || 'All Deliverables',
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

  const whatsappUrl = `https://wa.me/${(settings.whatsapp || settings.phone).replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
    `Hi Vidzyra team, this is ${client.name} regarding our video deliverables.`
  )}`;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Top Banner (Admin simulator notice) - Only rendered in Admin Preview mode */}
      {!isSharedPortal && onExit && (
        <div className="bg-indigo-950 text-indigo-200 px-4 py-2 text-xs flex items-center justify-between border-b border-indigo-800">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>
              Viewing in <strong>Client Portal Mode</strong> for <strong>{client.name}</strong>
            </span>
          </div>
          <button
            onClick={onExit}
            className="flex items-center gap-1 px-3 py-1 bg-indigo-800 hover:bg-indigo-700 text-white rounded-md text-[11px] font-semibold transition cursor-pointer"
          >
            <LogOut className="w-3 h-3" />
            Exit Portal View
          </button>
        </div>
      )}

      {/* Main Header */}
      <header className="bg-white border-b border-slate-200 shadow-2xs">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-xl">
              V
            </div>
            <div>
              <h1 className="font-bold text-slate-900 text-base">{settings.businessName}</h1>
              <p className="text-[11px] text-slate-500">{settings.tagline} • Client Portal</p>
            </div>
          </div>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
          >
            <MessageSquare className="w-4 h-4" />
            WhatsApp Vidzyra
          </a>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-6 py-8 flex-1 w-full space-y-6">
        {/* Welcome Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Welcome, {client.name}</h2>
            <p className="text-xs text-slate-500 mt-1">
              Access your real-time editing pipeline, upload raw media assets, download final cuts, and review deliverables.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Active Client Partner
            </span>
          </div>
        </div>

        {/* Financial & Deliverable Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold uppercase text-slate-400">Total Work</span>
            <div className="text-xl font-bold text-slate-900 mt-1">{stats.totalWork}</div>
            <span className="text-[11px] text-slate-500">{stats.completed} delivered</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold uppercase text-slate-400">Total Billing</span>
            <div className="text-xl font-bold text-slate-900 mt-1">₹{stats.totalBilling.toLocaleString()}</div>
            <span className="text-[11px] text-slate-500">Agreed invoice total</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-2xs">
            <span className="text-[10px] font-bold uppercase text-emerald-700">Total Paid</span>
            <div className="text-xl font-bold text-emerald-700 mt-1">₹{stats.totalPaid.toLocaleString()}</div>
            <span className="text-[11px] text-emerald-600">{payments.length} verified receipts</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/20 shadow-2xs">
            <span className="text-[10px] font-bold uppercase text-amber-700">Remaining Balance</span>
            <div className="text-xl font-bold text-amber-700 mt-1">₹{stats.remaining.toLocaleString()}</div>
            <span className="text-[11px] text-amber-600 font-semibold">{stats.paymentStatus}</span>
          </div>
        </div>

        {/* Deliverables List */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">Your Video Deliverables &amp; Cloud Folders</h3>
            <span className="text-xs text-slate-500">{clientProjects.length} deliverables</span>
          </div>

          <div className="divide-y divide-slate-100">
            {clientProjects.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs italic">
                No deliverables currently assigned. Please contact your Vidzyra producer.
              </div>
            ) : (
              clientProjects.map((p) => (
                <div key={p.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-900 text-sm">{p.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {p.workType}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          p.status === 'Completed' || p.status === 'Delivered'
                            ? 'bg-emerald-100 text-emerald-800'
                            : p.status === 'In Progress'
                            ? 'bg-amber-100 text-amber-800'
                            : p.status === 'Revision Required'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {p.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500">
                      Due Date: {p.dueDate || 'Standard turnaround'} • Quantity: {p.quantity}
                    </p>

                    {/* Client Review status banner */}
                    {p.reviewStatus && (
                      <div className="text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-start gap-2">
                        <FileCheck className="w-3.5 h-3.5 text-indigo-600 mt-0.5" />
                        <div>
                          <span className="font-semibold text-slate-800">
                            Review Status: {p.reviewStatus}
                          </span>
                          {p.reviewNotes && (
                            <p className="text-slate-600 mt-0.5 italic">"{p.reviewNotes}"</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 4-Link Cloud Buttons for Client */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Raw Footage link */}
                    {p.userDownloadLink ? (
                      <a
                        href={p.userDownloadLink}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition"
                        title="Upload your raw footage and assets here"
                      >
                        <FolderUp className="w-3.5 h-3.5 text-indigo-600" />
                        Upload Raw Footage
                      </a>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic px-2">Raw link pending</span>
                    )}

                    {/* Final Deliverables download */}
                    {p.userUploadLink ? (
                      <a
                        href={p.userUploadLink}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition"
                        title="Download final exported videos"
                      >
                        <FolderDown className="w-3.5 h-3.5" />
                        Download Final Videos
                      </a>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic px-2">Render in progress</span>
                    )}

                    {/* Review Controls */}
                    {p.status === 'Completed' || p.status === 'Delivered' || p.reviewStatus ? (
                      <div className="flex items-center space-x-1 pl-2 border-l border-slate-200">
                        <button
                          onClick={() => handleApprove(p.id)}
                          className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold transition flex items-center gap-1"
                        >
                          <CheckCircle className="w-3 h-3" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleOpenRevisionModal(p.id)}
                          className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-semibold transition flex items-center gap-1"
                        >
                          <AlertTriangle className="w-3 h-3" />
                          Request Revision
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Payment History & Verified Slips */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">Verified Payment Slips &amp; Receipts</h3>
            <span className="text-xs text-slate-500">{payments.length} receipts</span>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {payments.length === 0 ? (
              <div className="p-6 text-center text-slate-400 italic">No receipts recorded yet.</div>
            ) : (
              payments.map((pay) => (
                <div key={pay.id} className="p-4 flex items-center justify-between">
                  <div>
                    <span className="font-mono font-bold text-indigo-600">{pay.receiptNumber}</span>
                    <span className="text-slate-500 ml-2">{pay.date}</span>
                    <span className="text-slate-400 ml-2">via {pay.paymentMethod}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="font-bold text-emerald-600">₹{pay.amount.toLocaleString()}</span>
                    <button
                      onClick={() => handleOpenReceipt(pay)}
                      className="flex items-center gap-1 px-3 py-1 bg-white border border-slate-300 hover:bg-slate-50 text-indigo-600 rounded-lg font-semibold shadow-2xs"
                    >
                      <Download className="w-3 h-3" />
                      Download Slip JPG
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Revision Modal */}
      {revisionWorkId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Request Deliverable Revision</h3>
            <p className="text-xs text-slate-500">
              Please provide precise timestamps and notes for the changes required (e.g. 0:14 lower music, 1:20 fix caption typo).
            </p>
            <textarea
              rows={4}
              required
              value={revisionNotes}
              onChange={(e) => setRevisionNotes(e.target.value)}
              placeholder="Timestamps, text corrections, sound edits..."
              className="w-full text-xs p-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setRevisionWorkId(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitRevision}
                className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-xs"
              >
                Submit Revision Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      <PaymentReceiptModal
        isOpen={!!selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
        receiptData={selectedReceipt}
      />
    </div>
  );
};
