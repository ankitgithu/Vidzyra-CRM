import React, { useState, useEffect } from 'react';
import { X, Briefcase, Save, Folder, DollarSign, UserCheck } from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { WorkProject, WorkType, ProjectStatus, WorkDoneBy, ProjectPriority } from '../../types';
import {
  isValidGoogleDriveFolderUrl,
  getProjectDriveFolderUrl,
  DRIVE_FOLDER_VALIDATION_ERROR,
} from '../../utils/driveUtils';

interface WorkFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  workToEdit?: WorkProject | null;
  defaultClientId?: string | null;
}

export const WorkFormModal: React.FC<WorkFormModalProps> = ({
  isOpen,
  onClose,
  workToEdit,
  defaultClientId,
}) => {
  const { clients, editors, addProject, updateProject, settings } = useCrm();

  const [name, setName] = useState('');
  const [clientId, setClientId] = useState('');
  const [workType, setWorkType] = useState<WorkType>('Video Editing');
  const [quantity, setQuantity] = useState<number>(1);
  const [clientRate, setClientRate] = useState<number>(settings.defaultClientRate || 2000);
  const [workDoneBy, setWorkDoneBy] = useState<WorkDoneBy>('Me / Custom');
  const [assignedTo, setAssignedTo] = useState<string>('');
  const [editorRate, setEditorRate] = useState<number>(settings.defaultEditorRate || 900);
  const [status, setStatus] = useState<ProjectStatus>('Pending');
  const [dueDate, setDueDate] = useState<string>('');
  const [priority, setPriority] = useState<ProjectPriority>('Medium');
  const [notes, setNotes] = useState('');

  // Single Canonical Project Google Drive Folder
  const [driveFolderUrl, setDriveFolderUrl] = useState('');
  const [driveUrlError, setDriveUrlError] = useState<string | null>(null);

  // All 11 Base Work Types + dynamic settings
  const availableWorkTypes: WorkType[] = [
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
    'Custom',
  ];

  // Sync client default rate when client selected
  const handleClientChange = (cId: string) => {
    setClientId(cId);
    const selected = clients.find((c) => c.id === cId);
    if (selected && !workToEdit) {
      setClientRate(selected.defaultClientRate || settings.defaultClientRate || 2000);
    }
  };

  // Sync editor default rate when editor selected
  const handleEditorChange = (eId: string) => {
    setAssignedTo(eId);
    const selected = editors.find((e) => e.id === eId);
    if (selected && !workToEdit) {
      setEditorRate(selected.editorRate || settings.defaultEditorRate || 900);
    }
  };

  useEffect(() => {
    if (workToEdit) {
      setName(workToEdit.name);
      setClientId(workToEdit.clientId);
      setWorkType(workToEdit.workType);
      setQuantity(workToEdit.quantity);
      setClientRate(workToEdit.clientRate);
      const resolvedEditorId = workToEdit.assignedTo || (workToEdit as any).editorId || (workToEdit as any).assignedEditorId || '';
      const resolvedWorkDoneBy = workToEdit.workDoneBy || (resolvedEditorId ? 'Assigned' : 'Me / Custom');
      setWorkDoneBy(resolvedWorkDoneBy);
      setAssignedTo(resolvedEditorId);
      setEditorRate(workToEdit.editorRate || settings.defaultEditorRate || 900);
      setStatus(workToEdit.status);
      setDueDate(workToEdit.dueDate || '');
      setPriority(workToEdit.priority || 'Medium');
      setNotes(workToEdit.notes || '');
      setDriveFolderUrl(getProjectDriveFolderUrl(workToEdit));
      setDriveUrlError(null);
    } else {
      const initialClientId = defaultClientId || (clients[0]?.id ?? '');
      setName('');
      setClientId(initialClientId);
      const initialClient = clients.find((c) => c.id === initialClientId);
      setClientRate(initialClient?.defaultClientRate || settings.defaultClientRate || 2000);
      setWorkType('Video Editing');
      setQuantity(1);
      setWorkDoneBy('Me / Custom');
      setAssignedTo('');
      setEditorRate(settings.defaultEditorRate || 900);
      setStatus('Pending');
      setDueDate('');
      setPriority('Medium');
      setNotes('');
      setDriveFolderUrl('');
      setDriveUrlError(null);
    }
  }, [workToEdit, isOpen, defaultClientId, clients, settings]);

  if (!isOpen) return null;

  const totalBilling = quantity * clientRate;
  const editorCost = workDoneBy === 'Assigned' ? quantity * editorRate : 0;
  const profit = totalBilling - editorCost;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !clientId) return;

    const trimmedDriveUrl = driveFolderUrl.trim();
    if (trimmedDriveUrl && !isValidGoogleDriveFolderUrl(trimmedDriveUrl)) {
      setDriveUrlError(DRIVE_FOLDER_VALIDATION_ERROR);
      return;
    }

    const finalWorkDoneBy = (workDoneBy === 'Assigned' || Boolean(assignedTo)) && assignedTo ? 'Assigned' : workDoneBy;
    const resolvedAssignedTo = finalWorkDoneBy === 'Assigned' ? (assignedTo || null) : null;
    const resolvedEditorRate = finalWorkDoneBy === 'Assigned' ? Number(editorRate) || 0 : 0;
    const cleanDueDate = dueDate ? dueDate.trim() : '';

    const projectPayload = {
      name: name.trim(),
      clientId,
      workType,
      quantity: Number(quantity) || 1,
      clientRate: Number(clientRate) || 0,
      totalBilling: (Number(quantity) || 1) * (Number(clientRate) || 0),
      workDoneBy: finalWorkDoneBy,
      assignedTo: resolvedAssignedTo,
      editorId: resolvedAssignedTo || null,
      assignedEditorId: resolvedAssignedTo || null,
      editorRate: resolvedEditorRate,
      status,
      dueDate: cleanDueDate,
      priority,
      completedAt:
        status === 'Completed' || status === 'Approved' || status === 'Delivered'
          ? workToEdit?.completedAt || new Date().toISOString()
          : undefined,
      notes: notes.trim(),
      driveFolderUrl: trimmedDriveUrl,
      // For existing projects: safely preserve existing legacy link fields without overwriting
      userDownloadLink: workToEdit?.userDownloadLink || '',
      userUploadLink: workToEdit?.userUploadLink || '',
      clientDownloadLink: workToEdit?.clientDownloadLink || '',
      clientUploadLink: workToEdit?.clientUploadLink || '',
    };

    if (workToEdit) {
      updateProject(workToEdit.id, projectPayload);
    } else {
      addProject(projectPayload);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in">
      <div
        id="work-form-modal"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden flex flex-col max-h-[92vh]"
      >
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
              <Briefcase className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-slate-900 text-base">
              {workToEdit ? 'Edit Work Project' : 'Create New Work Project'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
          {/* Work Name & Client */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Project / Deliverable Name *
              </label>
              <input
                id="work-name-input"
                type="text"
                required
                placeholder="e.g. Finance Podcast Episode #14"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Client / Brand *
              </label>
              <select
                id="work-client-select"
                required
                value={clientId}
                onChange={(e) => handleClientChange(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="">Select a Client</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.clientType})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Type, Quantity, Status, Priority, Due Date */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Work Type</label>
              <select
                value={workType}
                onChange={(e) => setWorkType(e.target.value as WorkType)}
                className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-lg"
              >
                {availableWorkTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Quantity</label>
              <input
                type="number"
                min="1"
                required
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-lg"
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

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as ProjectPriority)}
                className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-lg"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent 🔥</option>
              </select>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="block font-semibold text-slate-700 mb-1">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          {/* Client Rate & Billing */}
          <div className="p-3.5 bg-indigo-50/50 border border-indigo-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-indigo-900 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-indigo-600" />
                Client Billing
              </span>
              <span className="text-indigo-700 font-semibold">
                Total: ₹{(totalBilling || 0).toLocaleString()}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Client Rate (₹ / unit)</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={clientRate}
                  onChange={(e) => setClientRate(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg"
                />
              </div>
              <div className="flex flex-col justify-end">
                <span className="text-[11px] text-slate-500 mb-1">Billing Formula</span>
                <span className="text-slate-700 font-mono">
                  {quantity} units × ₹{clientRate} = ₹{(totalBilling || 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Assignment: Self vs Assigned */}
          <div className="border border-slate-200 p-4 rounded-xl space-y-3 bg-slate-50/50">
            <label className="block font-bold text-slate-800">Who will edit this project?</label>
            <div className="flex items-center space-x-6">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="workDoneBy"
                  value="Me / Custom"
                  checked={workDoneBy !== 'Assigned'}
                  onChange={() => setWorkDoneBy('Me / Custom')}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                <span className="font-semibold text-slate-800">In-House / Self (100% Profit)</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="workDoneBy"
                  value="Assigned"
                  checked={workDoneBy === 'Assigned'}
                  onChange={() => setWorkDoneBy('Assigned')}
                  className="text-purple-600 focus:ring-purple-500"
                />
                <span className="font-semibold text-slate-800">Assign to Video Editor</span>
              </label>
            </div>

            {workDoneBy === 'Assigned' && (
              <div className="pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Select Editor *</label>
                  <select
                    required
                    value={assignedTo}
                    onChange={(e) => handleEditorChange(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg"
                  >
                    <option value="">Select Editor</option>
                    {editors.map((ed) => (
                      <option key={ed.id} value={ed.id}>
                        {ed.name} • [{ed.availability || 'Available'}] (Rate: ₹{ed.editorRate}/vid)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Editor Rate (₹ / unit)</label>
                  <input
                    type="number"
                    min="0"
                    value={editorRate}
                    onChange={(e) => setEditorRate(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg"
                  />
                </div>

                <div className="sm:col-span-2 flex items-center justify-between p-2.5 bg-purple-50 border border-purple-200 rounded-lg text-purple-900 font-medium">
                  <span>Editor Cost: ₹{(editorCost || 0).toLocaleString()}</span>
                  <span className="font-bold text-emerald-700">Estimated Agency Profit: ₹{(profit || 0).toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>

          {/* Project Drive Folder */}
          <div className="border border-slate-200 p-4 rounded-xl space-y-3 bg-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Folder className="w-4 h-4 text-indigo-600" />
                <h4 className="font-bold text-slate-900 text-sm">Project Drive Folder</h4>
              </div>
              <span className="text-[10px] text-indigo-700 font-semibold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                Single Shared Folder
              </span>
            </div>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Canonical Google Drive folder for this project. Client raw assets, references, editor cuts, revisions, and final deliverables are all organized within this single folder.
            </p>

            <div>
              <label className="block font-semibold text-slate-700 text-xs mb-1">
                Google Drive Folder URL
              </label>
              <input
                id="input-project-drive-folder"
                type="url"
                placeholder="https://drive.google.com/drive/folders/..."
                value={driveFolderUrl}
                onChange={(e) => {
                  setDriveFolderUrl(e.target.value);
                  if (driveUrlError) setDriveUrlError(null);
                }}
                className={`w-full px-3 py-2 bg-slate-50 border rounded-lg font-mono text-xs text-slate-900 focus:bg-white transition ${
                  driveUrlError ? 'border-rose-400 bg-rose-50/40 text-rose-900' : 'border-slate-300'
                }`}
              />
              {driveUrlError ? (
                <p className="text-rose-600 text-xs mt-1.5 font-medium flex items-center gap-1">
                  {driveUrlError}
                </p>
              ) : (
                <p className="text-[10px] text-slate-400 mt-1">
                  Suggested internal structure: Client Raw Files • References • Edited Videos • Revisions • Final Deliverables
                </p>
              )}
            </div>
          </div>

          {/* Project Notes */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Project Description &amp; Edit Instructions
            </label>
            <textarea
              rows={2}
              placeholder="Sound design, sound effects, subtitles, color grading notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              id="btn-submit-work-project"
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition"
            >
              <Save className="w-4 h-4" />
              {workToEdit ? 'Save Changes' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
