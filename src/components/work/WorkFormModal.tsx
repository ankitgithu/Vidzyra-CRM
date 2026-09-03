import React, { useState, useEffect } from 'react';
import { X, Briefcase, Save, Link as LinkIcon, DollarSign, UserCheck } from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { WorkProject, WorkType, ProjectStatus, WorkDoneBy } from '../../types';

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
  const [notes, setNotes] = useState('');

  // 4 Links
  const [userDownloadLink, setUserDownloadLink] = useState('');
  const [userUploadLink, setUserUploadLink] = useState('');
  const [clientDownloadLink, setClientDownloadLink] = useState('');
  const [clientUploadLink, setClientUploadLink] = useState('');

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
      setWorkDoneBy(workToEdit.workDoneBy || 'Me / Custom');
      setAssignedTo(workToEdit.assignedTo || '');
      setEditorRate(workToEdit.editorRate || settings.defaultEditorRate || 900);
      setStatus(workToEdit.status);
      setDueDate(workToEdit.dueDate || '');
      setNotes(workToEdit.notes || '');
      setUserDownloadLink(workToEdit.userDownloadLink || '');
      setUserUploadLink(workToEdit.userUploadLink || '');
      setClientDownloadLink(workToEdit.clientDownloadLink || '');
      setClientUploadLink(workToEdit.clientUploadLink || '');
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
      setNotes('');
      setUserDownloadLink('');
      setUserUploadLink('');
      setClientDownloadLink('');
      setClientUploadLink('');
    }
  }, [workToEdit, isOpen, defaultClientId, clients, settings]);

  if (!isOpen) return null;

  const totalBilling = quantity * clientRate;
  const editorCost = workDoneBy === 'Assigned' ? quantity * editorRate : 0;
  const profit = totalBilling - editorCost;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !clientId) return;

    const projectPayload = {
      name: name.trim(),
      clientId,
      workType,
      quantity: Number(quantity) || 1,
      clientRate: Number(clientRate) || 0,
      workDoneBy,
      assignedTo: workDoneBy === 'Assigned' ? assignedTo : undefined,
      editorRate: workDoneBy === 'Assigned' ? Number(editorRate) || 0 : 0,
      status,
      dueDate: dueDate || undefined,
      notes: notes.trim(),
      userDownloadLink: userDownloadLink.trim(),
      userUploadLink: userUploadLink.trim(),
      clientDownloadLink: clientDownloadLink.trim(),
      clientUploadLink: clientUploadLink.trim(),
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

          {/* Type, Quantity, Status, Due Date */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
                Total: ₹{totalBilling.toLocaleString()}
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
                  {quantity} units × ₹{clientRate} = ₹{totalBilling.toLocaleString()}
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
                        {ed.name} (Default: ₹{ed.editorRate}/vid)
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
                  <span>Editor Cost: ₹{editorCost.toLocaleString()}</span>
                  <span className="font-bold text-emerald-700">Estimated Agency Profit: ₹{profit.toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>

          {/* The Four-Link System */}
          <div className="border border-slate-200 p-4 rounded-xl space-y-3 bg-white">
            <div className="flex items-center space-x-2">
              <LinkIcon className="w-4 h-4 text-indigo-600" />
              <h4 className="font-bold text-slate-900">The Four-Link Cloud Workflow</h4>
            </div>
            <p className="text-slate-500 text-[11px]">
              Set the Google Drive, Dropbox, Frame.io, or Mega storage links for client and editor portals.
            </p>

            <div className="space-y-3 pt-1">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  1. User Download Link (Client's Raw Footage Folder)
                </label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/drive/folders/raw-footage..."
                  value={userDownloadLink}
                  onChange={(e) => setUserDownloadLink(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  2. User Upload Link (Client's Final Deliverables Folder)
                </label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/drive/folders/final-renders..."
                  value={userUploadLink}
                  onChange={(e) => setUserUploadLink(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  3. Client Download Link (Editor's Raw Materials Folder)
                </label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/drive/folders/editor-raw-assets..."
                  value={clientDownloadLink}
                  onChange={(e) => setClientDownloadLink(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  4. Client Upload Link (Editor's Render Upload Submission Folder)
                </label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/drive/folders/editor-render-drop..."
                  value={clientUploadLink}
                  onChange={(e) => setClientUploadLink(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>
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
