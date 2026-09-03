import React, { useState, useMemo } from 'react';
import {
  ExternalLink,
  MessageSquare,
  CheckCircle,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Download,
  LogOut,
  FolderDown,
  FolderUp,
  CreditCard,
  Briefcase,
  AlertCircle,
  Clock,
  Bell,
  X,
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { ProjectStatus } from '../../types';
import { ReceiptData } from '../../utils/receiptGenerator';
import { PaymentReceiptModal } from '../payments/PaymentReceiptModal';
import { NotificationDrawer } from '../notifications/NotificationDrawer';

interface EditorPortalViewProps {
  editorId: string;
  onExit?: () => void;
  isSharedPortal?: boolean;
}

export const EditorPortalView: React.FC<EditorPortalViewProps> = ({
  editorId,
  onExit,
  isSharedPortal = false,
}) => {
  const {
    editors,
    projects,
    editorPayments,
    getEditorStats,
    updateProject,
    submitEditorCompletion,
    notifications,
    settings,
  } = useCrm();

  const editor = editors.find((e) => e.id === editorId);
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptData | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<Record<string, ProjectStatus>>({});
  const [submittingWorkId, setSubmittingWorkId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);

  const editorNotifications = useMemo(
    () => notifications.filter((n) => n.relatedEditorId === editorId && n.targetRole !== 'client'),
    [notifications, editorId]
  );
  const unreadEditorNotifs = editorNotifications.filter((n) => !n.read).length;

  if (!editor) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-center">
        <div className="bg-white p-8 rounded-2xl max-w-md w-full shadow-2xl space-y-4">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-xl font-bold text-slate-900">Editor Portal Not Found</h2>
          <p className="text-xs text-slate-500">
            The requested editor portal link is invalid or has expired. Please contact Vidzyra management.
          </p>
          {!isSharedPortal && onExit && (
            <button
              onClick={onExit}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
            >
              Return to Admin Dashboard
            </button>
          )}
        </div>
      </div>
    );
  }

  // If portal is Inactive or Deleted
  if (editor.portalStatus !== 'Active') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-center">
        <div className="bg-white p-8 rounded-2xl max-w-md w-full shadow-2xl space-y-4">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
          <h2 className="text-xl font-bold text-slate-900">Editor Portal Access Suspended</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            This editor portal is currently marked as{' '}
            <strong className="text-slate-800">{editor.portalStatus}</strong>. Please contact Vidzyra management to
            reactivate your portal.
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

  const stats = getEditorStats(editor.id);
  const assignedProjects = projects.filter((p) => p.assignedTo === editor.id && p.workDoneBy === 'Assigned');
  const payments = editorPayments.filter((p) => p.editorId === editor.id);

  const handleDropdownChange = (projectId: string, newStatus: ProjectStatus) => {
    setSelectedStatus((prev) => ({ ...prev, [projectId]: newStatus }));
    if (newStatus !== 'Completed') {
      updateProject(projectId, { status: newStatus });
    }
  };

  const handleSubmitCompletion = (projectId: string) => {
    if (submittingWorkId) return;
    setSubmittingWorkId(projectId);
    try {
      submitEditorCompletion(projectId, editor.id, editor.name);
      setToastMessage('Work completion submitted successfully! Client and Admin have been notified.');
      setTimeout(() => setToastMessage(null), 4500);
      setSelectedStatus((prev) => {
        const next = { ...prev };
        delete next[projectId];
        return next;
      });
    } finally {
      setSubmittingWorkId(null);
    }
  };

  const handleOpenReceipt = (pay: typeof payments[0]) => {
    const receipt: ReceiptData = {
      receiptNumber: pay.receiptNumber,
      recipientType: 'Editor',
      recipientName: editor.name,
      amount: pay.amount,
      date: pay.date,
      paymentType: pay.paymentType,
      paymentMethod: pay.paymentMethod,
      referenceNumber: pay.referenceNumber,
      projectName: assignedProjects.find((p) => p.id === pay.workId)?.name || 'Batch Deliverables',
      totalAmount: stats.totalCost,
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
    `Hi Vidzyra team, this is ${editor.name} regarding my assigned editing tasks.`
  )}`;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-purple-700 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle className="w-4 h-4 text-white flex-shrink-0" />
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 text-white/80 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Banner - Only rendered in Admin Preview mode */}
      {!isSharedPortal && onExit && (
        <div className="bg-purple-950 text-purple-200 px-4 py-2 text-xs flex items-center justify-between border-b border-purple-800">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></span>
            <span>
              Viewing in <strong>Editor Portal Mode</strong> for <strong>{editor.name}</strong>
            </span>
          </div>
          <button
            onClick={onExit}
            className="flex items-center gap-1 px-3 py-1 bg-purple-800 hover:bg-purple-700 text-white rounded-md text-[11px] font-semibold transition cursor-pointer"
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
            <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center text-white font-bold text-xl">
              V
            </div>
            <div>
              <h1 className="font-bold text-slate-900 text-base">{settings.businessName}</h1>
              <p className="text-[11px] text-slate-500">{settings.tagline} • Editor Portal</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Notification Bell */}
            <button
              id="btn-editor-notifications"
              onClick={() => setShowNotifications(true)}
              className="relative p-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition border border-slate-200 bg-white cursor-pointer"
              title="View notifications"
              aria-label="View notifications"
            >
              <Bell className="w-4 h-4 text-slate-700" />
              {unreadEditorNotifs > 0 && (
                <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full ring-2 ring-white">
                  {unreadEditorNotifs}
                </span>
              )}
            </button>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
            >
              <MessageSquare className="w-4 h-4" />
              WhatsApp Producer
            </a>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-6 py-8 flex-1 w-full space-y-6">
        {/* Welcome Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Welcome, {editor.name}</h2>
            <p className="text-xs text-slate-500 mt-1">
              Download your project raw footage assets, submit final render exports, update status, and track your
              earnings ledger.
            </p>
          </div>
          <div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
              Rate: ₹{editor.editorRate} / video
            </span>
          </div>
        </div>

        {/* Task & Compensation Metrics (Strictly Privacy Protected) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold uppercase text-slate-400">Assigned Tasks</span>
            <div className="text-xl font-bold text-slate-900 mt-1">{stats.assignedWork}</div>
            <span className="text-[11px] text-slate-500">{stats.completed} delivered</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-purple-200 bg-purple-50/20 shadow-2xs">
            <span className="text-[10px] font-bold uppercase text-purple-700">Total Earned</span>
            <div className="text-xl font-bold text-purple-900 mt-1">₹{stats.totalCost.toLocaleString()}</div>
            <span className="text-[11px] text-purple-600">Calculated on deliveries</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-2xs">
            <span className="text-[10px] font-bold uppercase text-emerald-700">Paid to You</span>
            <div className="text-xl font-bold text-emerald-700 mt-1">₹{stats.totalPaid.toLocaleString()}</div>
            <span className="text-[11px] text-emerald-600">{payments.length} payout slips</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-rose-200 bg-rose-50/20 shadow-2xs">
            <span className="text-[10px] font-bold uppercase text-rose-700">Pending Payout</span>
            <div className="text-xl font-bold text-rose-700 mt-1">₹{stats.remaining.toLocaleString()}</div>
            <span className="text-[11px] text-rose-600 font-semibold">{stats.paymentStatus}</span>
          </div>
        </div>

        {/* Assigned Projects Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">Your Assigned Editing Deliverables</h3>
            <span className="text-xs text-slate-500">{assignedProjects.length} deliverables</span>
          </div>

          <div className="divide-y divide-slate-100">
            {assignedProjects.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs italic">
                No editing deliverables currently assigned.
              </div>
            ) : (
              assignedProjects.map((p) => (
                <div key={p.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-900 text-sm">{p.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                        {p.workType}
                      </span>
                    </div>

                    <div className="flex items-center space-x-3 text-xs text-slate-500">
                      <span>Due Date: <strong>{p.dueDate || 'Urgent'}</strong></span>
                      <span>•</span>
                      <span>Qty: <strong>{p.quantity}</strong></span>
                      <span>•</span>
                      <span className="font-semibold text-purple-700">
                        Your Payout: ₹{(p.quantity * p.editorRate).toLocaleString()}
                      </span>
                    </div>

                    {p.notes && (
                      <div className="text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700">
                        <strong>Brief / Instructions:</strong> {p.notes}
                      </div>
                    )}
                  </div>

                  {/* 4-Links Cloud Buttons & Status for Editor */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Raw Footage link for Editor */}
                    {p.clientDownloadLink ? (
                      <a
                        href={p.clientDownloadLink}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition"
                        title="Download raw assets and footage"
                      >
                        <FolderDown className="w-3.5 h-3.5 text-purple-600" />
                        Download Raw Assets
                      </a>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic px-2">Raw link pending</span>
                    )}

                    {/* Upload Final Render link for Editor */}
                    {p.clientUploadLink ? (
                      <a
                        href={p.clientUploadLink}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition"
                        title="Upload your completed render here"
                      >
                        <FolderUp className="w-3.5 h-3.5" />
                        Upload Final Render
                      </a>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic px-2">Upload link pending</span>
                    )}

                    {/* Status Workflow for Editor */}
                    {p.status === 'Approved' || p.reviewStatus === 'Approved' ? (
                      <span
                        id={`editor-approved-badge-${p.id}`}
                        className="px-3 py-1.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-bold flex items-center gap-1.5 select-none shadow-2xs"
                      >
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                        Approved by Client
                      </span>
                    ) : p.status === 'Completed' ? (
                      <div className="flex items-center gap-2">
                        <span
                          id={`editor-completed-badge-${p.id}`}
                          className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Completed (Awaiting Client Review)
                        </span>
                        {/* Option to re-open if needed */}
                        <select
                          value="Completed"
                          onChange={(e) => {
                            const val = e.target.value as ProjectStatus;
                            if (val !== 'Completed') {
                              handleDropdownChange(p.id, val);
                            }
                          }}
                          className="text-[11px] font-medium px-2 py-1 bg-white border border-slate-200 rounded-lg text-slate-500 cursor-pointer"
                          title="Change status if further edits required"
                        >
                          <option value="Completed">Completed</option>
                          <option value="In Progress">Reopen (In Progress)</option>
                        </select>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <select
                          id={`select-status-${p.id}`}
                          value={selectedStatus[p.id] || p.status}
                          onChange={(e) => handleDropdownChange(p.id, e.target.value as ProjectStatus)}
                          className="text-xs font-semibold px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 cursor-pointer focus:ring-2 focus:ring-purple-500/20"
                        >
                          <option value="Pending">Pending</option>
                          <option value="In Progress">In Progress</option>
                          {p.status === 'Revision Required' && (
                            <option value="Revision Required">Revision in Progress</option>
                          )}
                          <option value="Completed">Mark as Complete</option>
                        </select>

                        {/* Submit button appears when "Mark as Complete" is selected */}
                        {(selectedStatus[p.id] === 'Completed' || (p.status === 'Completed' && false)) && (
                          <button
                            id={`btn-submit-editor-${p.id}`}
                            type="button"
                            disabled={submittingWorkId === p.id}
                            onClick={() => handleSubmitCompletion(p.id)}
                            className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer disabled:cursor-not-allowed animate-in fade-in"
                          >
                            {submittingWorkId === p.id ? (
                              <>
                                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                Submitting...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-3.5 h-3.5" />
                                Submit
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Revision Alert Box if revision requested */}
                  {p.status === 'Revision Required' && (
                    <div className="mt-3 p-3 bg-amber-50/90 border border-amber-200 rounded-xl text-xs space-y-1.5">
                      <div className="flex items-center justify-between font-semibold text-amber-900">
                        <span className="flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                          Client Requested Revision
                        </span>
                        {p.revisionTimecode && (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-mono text-[11px]">
                            Timecode: {p.revisionTimecode}
                          </span>
                        )}
                      </div>
                      {p.revisionNotes && (
                        <p className="text-slate-700 whitespace-pre-line pl-5">{p.revisionNotes}</p>
                      )}
                      <p className="text-[11px] text-amber-700 italic pl-5">
                        Please upload your new render to the "Upload Final Render" link above, select "Mark as Complete" from the dropdown, and click <strong>Submit</strong>.
                      </p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Payout Slips & Ledger */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">Your Payout Slips &amp; Disbursements</h3>
            <span className="text-xs text-slate-500">{payments.length} disbursements</span>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {payments.length === 0 ? (
              <div className="p-6 text-center text-slate-400 italic">No disbursements recorded yet.</div>
            ) : (
              payments.map((pay) => (
                <div key={pay.id} className="p-4 flex items-center justify-between">
                  <div>
                    <span className="font-mono font-bold text-purple-600">{pay.receiptNumber}</span>
                    <span className="text-slate-500 ml-2">{pay.date}</span>
                    <span className="text-slate-400 ml-2">via {pay.paymentMethod}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="font-bold text-emerald-600">₹{pay.amount.toLocaleString()}</span>
                    <button
                      onClick={() => handleOpenReceipt(pay)}
                      className="flex items-center gap-1 px-3 py-1 bg-white border border-slate-300 hover:bg-slate-50 text-purple-700 rounded-lg font-semibold shadow-2xs"
                    >
                      <Download className="w-3 h-3" />
                      Download Payment Slip
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Notification Drawer for Editor */}
      <NotificationDrawer
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        filterRole="editor"
        currentEntityId={editor.id}
      />

      {/* Receipt Modal */}
      <PaymentReceiptModal
        isOpen={!!selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
        receiptData={selectedReceipt}
      />
    </div>
  );
};
