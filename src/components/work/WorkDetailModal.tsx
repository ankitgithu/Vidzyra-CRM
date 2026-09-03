import React, { useState } from 'react';
import {
  X,
  Briefcase,
  ExternalLink,
  Copy,
  Check,
  Edit2,
  Trash2,
  Clock,
  Link as LinkIcon,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Calendar,
  MessageSquare,
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { ProjectStatus } from '../../types';

interface WorkDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  workId: string | null;
  onEditWork: (workId: string) => void;
  onEditLinks: (workId: string) => void;
}

export const WorkDetailModal: React.FC<WorkDetailModalProps> = ({
  isOpen,
  onClose,
  workId,
  onEditWork,
  onEditLinks,
}) => {
  const {
    projects,
    clients,
    editors,
    activities,
    updateProject,
    deleteProject,
  } = useCrm();

  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!isOpen || !workId) return null;

  const project = projects.find((p) => p.id === workId);
  if (!project) return null;

  const client = clients.find((c) => c.id === project.clientId);
  const editor = project.assignedTo ? editors.find((e) => e.id === project.assignedTo) : null;
  const projectActivities = activities.filter((a) => a.workId === project.id);

  const editorCost =
    project.editorCost ??
    (project.workDoneBy === 'Self' ? 0 : (project.editorRate || 0) * (project.quantity || 1));
  const profit =
    project.profit ??
    ((project.totalBilling || 0) - editorCost);
  const profitMargin =
    project.totalBilling > 0 ? Math.round((profit / project.totalBilling) * 100) : 0;

  const handleCopy = (url: string, label: string) => {
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopiedLink(label);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const handleStatusChange = (newStatus: ProjectStatus) => {
    updateProject(project.id, { status: newStatus });
  };

  const handleDelete = () => {
    deleteProject(project.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in">
      <div
        id="work-detail-modal"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-start justify-between bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-slate-900">{project.name}</h2>
                <span className="text-xs px-2 py-0.5 rounded font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {project.workType}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Client: <span className="font-semibold text-slate-800">{client?.name || 'Unknown'}</span>
                {editor && (
                  <span>
                    {' '}• Assigned: <span className="font-semibold text-purple-700">{editor.name}</span>
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onEditWork(project.id)}
              className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
            >
              <Edit2 className="w-3.5 h-3.5" />
              Edit
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Status & Due Date Pill Bar */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-slate-600">Status:</span>
              <select
                value={project.status}
                onChange={(e) => handleStatusChange(e.target.value as ProjectStatus)}
                className="font-bold text-xs px-3 py-1 rounded-lg border border-slate-300 bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="Pending">Pending</option>
                <option value="Assigned">Assigned</option>
                <option value="In Progress">In Progress</option>
                <option value="Revision Required">Revision Required</option>
                <option value="Completed">Completed</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <div className="flex items-center space-x-4 text-slate-600">
              <div className="flex items-center space-x-1.5">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span className="font-semibold text-slate-600">Due Date:</span>
                <input
                  type="date"
                  value={project.dueDate || ''}
                  onChange={(e) => updateProject(project.id, { dueDate: e.target.value })}
                  className="font-bold text-xs px-2 py-0.5 rounded border border-slate-300 bg-white text-slate-800 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <span>Quantity: <strong>{project.quantity}</strong></span>
              </div>
            </div>
          </div>

          {/* Financial Breakdown Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 bg-indigo-50/50 border border-indigo-200 rounded-xl">
              <span className="text-[10px] font-bold uppercase text-indigo-700">Client Billing</span>
              <div className="text-lg font-bold text-indigo-900 mt-1">
                ₹{project.totalBilling.toLocaleString()}
              </div>
              <span className="text-[10px] text-indigo-600">
                {project.quantity} × ₹{project.clientRate}
              </span>
            </div>

            <div className="p-3.5 bg-purple-50/50 border border-purple-200 rounded-xl">
              <span className="text-[10px] font-bold uppercase text-purple-700">Editor Cost</span>
              <div className="text-lg font-bold text-purple-900 mt-1">
                ₹{editorCost.toLocaleString()}
              </div>
              <span className="text-[10px] text-purple-600">
                {project.workDoneBy === 'Self' ? 'In-house (₹0 cost)' : `${project.quantity} × ₹${project.editorRate || 0}`}
              </span>
            </div>

            <div className="p-3.5 bg-emerald-50/50 border border-emerald-200 rounded-xl">
              <span className="text-[10px] font-bold uppercase text-emerald-700">Agency Net Profit</span>
              <div className="text-lg font-bold text-emerald-800 mt-1">
                ₹{profit.toLocaleString()}
              </div>
              <span className="text-[10px] text-emerald-600 font-semibold">
                {profitMargin}% Profit Margin
              </span>
            </div>
          </div>

          {/* The Four-Link System Card */}
          <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <LinkIcon className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm">Four-Link Cloud Delivery Pipeline</h3>
              </div>
              <button
                onClick={() => onEditLinks(project.id)}
                className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold transition"
              >
                Edit Links
              </button>
            </div>

            <div className="space-y-2.5 pt-1">
              {[
                {
                  label: '1. User Download Link',
                  sub: "Client's Raw Footage Folder",
                  url: project.userDownloadLink,
                  id: 'userDownload',
                },
                {
                  label: '2. User Upload Link',
                  sub: "Client's Final Deliverables Folder",
                  url: project.userUploadLink,
                  id: 'userUpload',
                },
                {
                  label: '3. Client Download Link',
                  sub: "Editor's Raw Footage Folder",
                  url: project.clientDownloadLink,
                  id: 'clientDownload',
                },
                {
                  label: '4. Client Upload Link',
                  sub: "Editor's Render Upload Submission Folder",
                  url: project.clientUploadLink,
                  id: 'clientUpload',
                },
              ].map((link) => (
                <div
                  key={link.id}
                  className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <span className="font-bold text-slate-800 block text-[11px]">{link.label}</span>
                    <span className="text-slate-500 text-[10px] block truncate">
                      {link.sub} • {link.url || <em className="text-slate-400">Not configured yet</em>}
                    </span>
                  </div>

                  {link.url ? (
                    <div className="flex items-center space-x-1.5 flex-shrink-0">
                      <button
                        onClick={() => handleCopy(link.url, link.id)}
                        className="p-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-md transition"
                        title="Copy Link"
                      >
                        {copiedLink === link.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition"
                        title="Open in new tab"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  ) : (
                    <button
                      onClick={() => onEditLinks(project.id)}
                      className="text-xs text-indigo-600 font-semibold hover:underline"
                    >
                      Set Link
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Client Review & Feedback */}
          {project.reviewStatus && (
            <div className="p-3.5 bg-amber-50/50 border border-amber-200 rounded-xl space-y-1.5">
              <div className="flex items-center space-x-2">
                <FileCheck className="w-4 h-4 text-amber-700" />
                <h4 className="font-bold text-amber-900 text-xs">Client Review Feedback</h4>
                <span className="px-2 py-0.5 rounded font-semibold text-[10px] bg-amber-200/80 text-amber-900">
                  {project.reviewStatus}
                </span>
              </div>
              {project.reviewNotes && (
                <p className="text-slate-700 text-xs bg-white p-2.5 rounded-lg border border-amber-200">
                  {project.reviewNotes}
                </p>
              )}
            </div>
          )}

          {/* Revision Information */}
          {project.revisionStatus && project.revisionStatus !== 'No Revision' && (
            <div className="p-3.5 bg-rose-50/60 border border-rose-200 rounded-xl space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <h4 className="font-bold text-rose-900 text-xs">Revision Details</h4>
                  <span className="px-2 py-0.5 rounded font-semibold text-[10px] bg-rose-200 text-rose-800">
                    {project.revisionStatus} ({project.revisionCount || 1} requested)
                  </span>
                </div>
                {project.revisionRequestedDate && (
                  <span className="text-[10px] text-rose-600">{project.revisionRequestedDate}</span>
                )}
              </div>
              {project.revisionNotes && (
                <p className="text-slate-700 text-xs bg-white p-2.5 rounded-lg border border-rose-200 whitespace-pre-wrap">
                  {project.revisionNotes}
                </p>
              )}
            </div>
          )}

          {/* Project Notes */}
          {project.notes && (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="font-bold text-slate-700 block mb-1 text-[11px]">Instructions &amp; Notes</span>
              <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{project.notes}</p>
            </div>
          )}

          {/* Activity Log / Timeline */}
          <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-2">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Project Timeline &amp; Activity</h4>
            <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
              {project.timeline && project.timeline.length > 0 ? (
                project.timeline.map((tm) => (
                  <div key={tm.id} className="py-2 flex items-center justify-between text-[11px]">
                    <span className="text-slate-700">
                      <strong className="text-indigo-700">{tm.person}</strong>: {tm.action}
                      <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600">
                        {tm.status}
                      </span>
                    </span>
                    <span className="text-slate-400">{tm.date} {tm.time}</span>
                  </div>
                ))
              ) : projectActivities.length === 0 ? (
                <p className="text-slate-400 italic py-3 text-center">No activity logged for this project yet.</p>
              ) : (
                projectActivities.map((act) => (
                  <div key={act.id} className="py-2 flex items-center justify-between text-[11px]">
                    <span className="text-slate-700">
                      <strong>{act.who}</strong> {act.action} — {act.what}
                    </span>
                    <span className="text-slate-400">{act.when}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Delete confirmation section */}
          <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
            <button
              id="btn-delete-work-detail"
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="text-rose-600 hover:text-rose-800 flex items-center gap-1 font-semibold text-xs cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Project
            </button>

            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Delete Work / Project Confirmation Modal */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            id="delete-work-detail-modal"
            className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-bold text-slate-900">Delete Work / Project?</h3>
                <p className="text-xs text-slate-500 truncate">
                  {project.name}
                  {project.workType ? ` • ${project.workType}` : ''}
                </p>
              </div>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed">
              Are you sure you want to delete this Work / Project? This action cannot be undone.
            </p>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                id="cancel-delete-work-detail-btn"
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="confirm-delete-work-detail-btn"
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition shadow-xs cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
