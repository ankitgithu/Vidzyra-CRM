import React, { useState, useMemo } from 'react';
import {
  X,
  Briefcase,
  Plus,
  ExternalLink,
  Edit2,
  Trash2,
  Calendar,
  Clock,
  Folder,
  AlertTriangle,
  FileText,
  User,
  DollarSign,
  ChevronRight,
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { WorkProject } from '../../types';
import { formatWorkDate, getWorkSortTime } from '../../utils/crmDateUtils';
import { getProjectDriveFolderUrl } from '../../utils/driveUtils';

interface ClientWorkDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string | null;
  onOpenWorkDetail: (workId: string) => void;
  onOpenNewWork: (clientId?: string) => void;
  onEditWork: (project: WorkProject) => void;
  onEditLinks: (workId: string) => void;
}

export const ClientWorkDetailModal: React.FC<ClientWorkDetailModalProps> = ({
  isOpen,
  onClose,
  clientId,
  onOpenWorkDetail,
  onOpenNewWork,
  onEditWork,
  onEditLinks,
}) => {
  const { clients, projects, editors, getClientStats, deleteProject, settings } = useCrm();
  const [projectToDelete, setProjectToDelete] = useState<WorkProject | null>(null);

  const client = useMemo(() => {
    if (!clientId) return null;
    return (
      clients.find((c) => c.id === clientId) || {
        id: clientId,
        name: 'Client',
        email: '',
        phone: '',
        whatsapp: '',
        clientType: 'Work' as const,
        defaultClientRate: 0,
        notes: '',
        portalToken: '',
        portalStatus: 'Active' as const,
        createdAt: '',
      }
    );
  }, [clients, clientId]);

  const clientWorks = useMemo(() => {
    if (!clientId) return [];
    return projects
      .filter((p) => {
        const pClientId = p.clientId || (p as any).client_id || (p as any).client?.id;
        return pClientId === clientId;
      })
      .sort((a, b) => getWorkSortTime(b) - getWorkSortTime(a));
  }, [projects, clientId]);

  const stats = useMemo(() => {
    if (!clientId) return null;
    return getClientStats(clientId);
  }, [getClientStats, clientId]);

  if (!isOpen || !client) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
      case 'Delivered':
      case 'Approved':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'In Progress':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Revision Required':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Assigned':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const handleDeleteConfirm = () => {
    if (projectToDelete) {
      deleteProject(projectToDelete.id);
      setProjectToDelete(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in">
      <div
        id="client-work-detail-modal"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              {client.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-slate-900">{client.name}</h2>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  {client.clientType} Client
                </span>
                <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                  {clientWorks.length} {clientWorks.length === 1 ? 'Work' : 'Works'}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                {client.phone && <span>Phone: {client.phone}</span>}
                {client.email && <span>• Email: {client.email}</span>}
                {client.defaultClientRate > 0 && (
                  <span>• Default Rate: ₹{client.defaultClientRate.toLocaleString()}</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-end sm:self-auto">
            <button
              id="btn-add-work-for-client"
              type="button"
              onClick={() => onOpenNewWork(client.id)}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Work
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-200/60 transition cursor-pointer"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Financial & Work Overview Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-6 py-3.5 bg-slate-50/40 border-b border-slate-200 text-xs">
          <div className="p-2.5 rounded-xl bg-white border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Billing</span>
            <span className="text-base font-bold text-slate-900 mt-0.5 block">
              ₹{(stats?.totalBilling || 0).toLocaleString()}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-white border border-emerald-200 bg-emerald-50/20">
            <span className="text-[10px] uppercase font-bold text-emerald-700 block">Total Paid</span>
            <span className="text-base font-bold text-emerald-700 mt-0.5 block">
              ₹{(stats?.totalPaid || 0).toLocaleString()}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-white border border-amber-200 bg-amber-50/20">
            <span className="text-[10px] uppercase font-bold text-amber-700 block">Remaining Balance</span>
            <span className="text-base font-bold text-amber-700 mt-0.5 block">
              ₹{(stats?.remaining || 0).toLocaleString()}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-white border border-indigo-200 bg-indigo-50/20">
            <span className="text-[10px] uppercase font-bold text-indigo-700 block">Works Status</span>
            <span className="text-xs font-semibold text-indigo-900 mt-1 block">
              {stats?.completed || 0} Done • {stats?.pending || 0} Pending
            </span>
          </div>
        </div>

        {/* Work History Section */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                Work History
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Showing all {clientWorks.length} work {clientWorks.length === 1 ? 'record' : 'records'} belonging to {client.name} (ordered newest first)
              </p>
            </div>
            <button
              onClick={() => onOpenNewWork(client.id)}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Another Work
            </button>
          </div>

          {clientWorks.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <Briefcase className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h4 className="text-sm font-semibold text-slate-700">No work records for this client yet</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                You can add multiple separate work records for {client.name}. Each work retains its own status, date, rate, and files.
              </p>
              <button
                onClick={() => onOpenNewWork(client.id)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Add First Work
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {clientWorks.map((work) => {
                const assignedEditorId = work.assignedTo || work.editorId || (work as any).assignedEditorId;
                const editor = assignedEditorId ? editors.find((e) => e.id === assignedEditorId) : null;
                const driveFolderUrl = getProjectDriveFolderUrl(work);
                const displayDate = formatWorkDate(work.workGivenDate, work.createdAt);

                return (
                  <div
                    key={work.id}
                    id={`client-work-item-${work.id}`}
                    className="p-4 bg-white border border-slate-200 rounded-xl hover:border-indigo-300 hover:shadow-xs transition space-y-3"
                  >
                    {/* Top Row: Date, Work Name & Status */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-start sm:items-center gap-2.5 flex-wrap">
                        {/* Prominent Date Stamp */}
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-800 rounded-lg text-xs font-bold">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          <span>{displayDate}</span>
                        </div>

                        {/* Deliverable Name */}
                        <h4 className="text-base font-bold text-slate-900 hover:text-indigo-600 transition">
                          {work.name}
                        </h4>

                        {/* Work Type Badge */}
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-md text-[11px] font-semibold">
                          {work.workType}
                        </span>
                      </div>

                      {/* Status Badge */}
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusColor(
                          work.status
                        )}`}
                      >
                        Status: {work.status}
                      </span>
                    </div>

                    {/* Metadata Details Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-slate-100 text-xs">
                      <div>
                        <span className="text-slate-400 text-[10px] uppercase font-bold block">Deliverable Billing</span>
                        <span className="font-bold text-slate-900 text-sm">
                          ₹{(work.totalBilling || 0).toLocaleString()}
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          Qty: {work.quantity || 1} @ ₹{(work.clientRate || 0).toLocaleString()}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-400 text-[10px] uppercase font-bold block">Execution / Assigned</span>
                        <span className="font-semibold text-slate-800 truncate block mt-0.5">
                          {work.workDoneBy === 'Self'
                            ? 'In-House (Self)'
                            : editor
                            ? editor.name
                            : 'Unassigned'}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-400 text-[10px] uppercase font-bold block">Timeline</span>
                        <span className="text-slate-700 block mt-0.5">
                          {work.deadline ? `Due: ${work.deadline}` : 'No deadline'}
                        </span>
                        {work.dueDate && work.dueDate !== work.deadline && (
                          <span className="text-[10px] text-slate-500">Target: {work.dueDate}</span>
                        )}
                      </div>

                      <div>
                        <span className="text-slate-400 text-[10px] uppercase font-bold block">Drive Folder</span>
                        {driveFolderUrl ? (
                          <a
                            href={driveFolderUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center gap-1 mt-0.5"
                          >
                            <Folder className="w-3.5 h-3.5" />
                            Open Drive
                          </a>
                        ) : (
                          <span className="text-slate-400 italic mt-0.5 block">Not configured</span>
                        )}
                      </div>
                    </div>

                    {/* Remarks/Notes if present */}
                    {work.notes && (
                      <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <span className="font-semibold text-slate-700">Remarks: </span>
                        {work.notes}
                      </p>
                    )}

                    {/* Action Bar */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <div className="text-[11px] text-slate-400">
                        Work ID: <span className="font-mono">{work.id}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => onOpenWorkDetail(work.id)}
                          className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1"
                          title="Open full work detail view"
                        >
                          View Details
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onEditWork(work)}
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                          title="Edit Work Project"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onEditLinks(work.id)}
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                          title="Edit Drive Links"
                        >
                          <Folder className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setProjectToDelete(work)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="Delete this work"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div>
            Total deliverables for this client:{' '}
            <span className="font-bold text-slate-800">{clientWorks.length}</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl font-semibold transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {projectToDelete && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in"
          onClick={() => setProjectToDelete(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-sm w-full p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Work Record?</h3>
                <p className="text-xs text-slate-500 truncate max-w-[200px]">
                  {projectToDelete.name}
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to delete this work record from {client.name}? The client record will remain intact.
            </p>
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setProjectToDelete(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition shadow-xs cursor-pointer"
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
