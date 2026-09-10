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
  Folder,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Calendar,
  MessageSquare,
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { ProjectStatus } from '../../types';
import { getProjectDriveFolderUrl } from '../../utils/driveUtils';
import { ProjectChatBox } from '../chat/ProjectChatBox';

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
    chatMessages,
    settings,
  } = useCrm();

  const [activeTab, setActiveTab] = useState<'details' | 'chat'>('details');
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!isOpen || !workId) return null;

  const project = projects.find((p) => p.id === workId);
  if (!project) return null;

  const client = clients.find((c) => c.id === project.clientId || c.id === (project as any).client_id);
  const assignedEditorId = project.assignedTo || project.editorId || project.assignedEditorId;
  const editor = assignedEditorId ? editors.find((e) => e.id === assignedEditorId) : null;
  const projectActivities = activities.filter((a) => a.workId === project.id);

  const projectChatMessages = chatMessages.filter(
    (m) => m.projectId === project.id || m.workId === project.id
  );
  const pendingChatMessages = projectChatMessages.filter(
    (m) => m.status === 'PENDING_ADMIN_REVIEW'
  );

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

        {/* Navigation Tabs */}
        <div className="px-6 border-b border-slate-200 bg-white flex items-center space-x-4">
          <button
            id="tab-work-details"
            type="button"
            onClick={() => setActiveTab('details')}
            className={`py-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'details'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Project Details &amp; Files</span>
          </button>

          <button
            id="tab-work-chat"
            type="button"
            onClick={() => setActiveTab('chat')}
            className={`py-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'chat'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Live Chat &amp; Moderation</span>
            {pendingChatMessages.length > 0 ? (
              <span className="px-1.5 py-0.2 bg-amber-500 text-white rounded-full text-[10px] font-bold animate-pulse">
                {pendingChatMessages.length} pending
              </span>
            ) : projectChatMessages.length > 0 ? (
              <span className="px-1.5 py-0.2 bg-slate-200 text-slate-700 rounded-full text-[10px] font-semibold">
                {projectChatMessages.length}
              </span>
            ) : null}
          </button>
        </div>

        {/* Content Body */}
        {activeTab === 'chat' ? (
          <div className="p-4 flex-1 overflow-hidden flex flex-col bg-slate-50/50">
            <ProjectChatBox
              projectId={project.id}
              viewerRole="admin"
              currentUserId="admin"
              currentUserName={settings.businessName || 'Admin'}
            />
          </div>
        ) : (
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

            <div className="flex flex-wrap items-center gap-3 text-slate-600">
              <div className="flex items-center space-x-1.5">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span className="font-semibold text-slate-600">Work Given:</span>
                <input
                  type="date"
                  value={project.workGivenDate || ''}
                  onChange={(e) => updateProject(project.id, { workGivenDate: e.target.value })}
                  className="font-bold text-xs px-2 py-0.5 rounded border border-slate-300 bg-white text-slate-800 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center space-x-1.5">
                <Clock className="w-4 h-4 text-slate-400" />
                <span className="font-semibold text-slate-600">Deadline:</span>
                <input
                  type="date"
                  value={project.deadline || project.dueDate || ''}
                  onChange={(e) => updateProject(project.id, { deadline: e.target.value, dueDate: e.target.value })}
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
                ₹{(project.totalBilling || 0).toLocaleString()}
              </div>
              <span className="text-[10px] text-indigo-600">
                {project.quantity} × ₹{project.clientRate}
              </span>
            </div>

            <div className="p-3.5 bg-purple-50/50 border border-purple-200 rounded-xl">
              <span className="text-[10px] font-bold uppercase text-purple-700">Editor Cost</span>
              <div className="text-lg font-bold text-purple-900 mt-1">
                ₹{(editorCost || 0).toLocaleString()}
              </div>
              <span className="text-[10px] text-purple-600">
                {project.workDoneBy === 'Self' ? 'In-house (₹0 cost)' : `${project.quantity} × ₹${project.editorRate || 0}`}
              </span>
            </div>

            <div className="p-3.5 bg-emerald-50/50 border border-emerald-200 rounded-xl">
              <span className="text-[10px] font-bold uppercase text-emerald-700">Agency Net Profit</span>
              <div className="text-lg font-bold text-emerald-800 mt-1">
                ₹{(profit || 0).toLocaleString()}
              </div>
              <span className="text-[10px] text-emerald-600 font-semibold">
                {profitMargin}% Profit Margin
              </span>
            </div>
          </div>

          {/* Project Drive Folder Card (Single Shared Folder) */}
          {(() => {
            const canonicalDriveFolder = getProjectDriveFolderUrl(project);
            return (
              <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Folder className="w-4 h-4 text-indigo-600" />
                    <h3 className="font-bold text-slate-900 text-sm">Project Drive Folder</h3>
                  </div>
                  <button
                    id="btn-edit-drive-folder"
                    onClick={() => onEditLinks(project.id)}
                    className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1"
                  >
                    <Edit2 className="w-3 h-3" />
                    {canonicalDriveFolder ? 'Edit / Replace Folder' : 'Add Drive Folder'}
                  </button>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  {canonicalDriveFolder ? (
                    <div className="space-y-3">
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                          Canonical Google Drive Folder URL
                        </span>
                        <a
                          href={canonicalDriveFolder}
                          target="_blank"
                          rel="noreferrer"
                          className="font-mono text-xs text-indigo-600 hover:text-indigo-800 hover:underline break-all block mt-0.5"
                        >
                          {canonicalDriveFolder}
                        </a>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-200/80">
                        <a
                          id="btn-open-drive-folder"
                          href={canonicalDriveFolder}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Open Folder
                        </a>

                        <button
                          id="btn-copy-drive-folder"
                          onClick={() => handleCopy(canonicalDriveFolder, 'driveFolder')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold shadow-2xs transition cursor-pointer"
                        >
                          {copiedLink === 'driveFolder' ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-emerald-700">Copied Link</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy Link</span>
                            </>
                          )}
                        </button>
                      </div>

                      <p className="text-[11px] text-slate-500 pt-1 leading-relaxed">
                        <span className="font-semibold text-slate-700">Shared Project Directory:</span> Client and Editor use this exact folder. Suggested subfolders: Client Raw Files • References • Edited Videos • Revisions • Final Deliverables
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-4 space-y-2">
                      <p className="text-xs text-slate-500">
                        No Google Drive folder URL configured yet for this project.
                      </p>
                      <button
                        onClick={() => onEditLinks(project.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
                      >
                        <Folder className="w-3.5 h-3.5" />
                        Add Drive Folder URL
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

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
        )}
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
