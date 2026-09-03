import React, { useState, useEffect } from 'react';
import { X, Link2, Download, Upload, Info, Check, Save } from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { WorkProject } from '../../types';

interface EditLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  workId: string | null;
}

export const EditLinkModal: React.FC<EditLinkModalProps> = ({
  isOpen,
  onClose,
  workId,
}) => {
  const { projects, updateWorkLinks, clients, editors } = useCrm();

  const project = projects.find((p) => p.id === workId);
  const client = clients.find((c) => c.id === project?.clientId);
  const editor = editors.find((e) => e.id === project?.assignedTo);

  const [userDownloadLink, setUserDownloadLink] = useState('');
  const [userUploadLink, setUserUploadLink] = useState('');
  const [clientDownloadLink, setClientDownloadLink] = useState('');
  const [clientUploadLink, setClientUploadLink] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (project) {
      setUserDownloadLink(project.userDownloadLink || '');
      setUserUploadLink(project.userUploadLink || '');
      setClientDownloadLink(project.clientDownloadLink || '');
      setClientUploadLink(project.clientUploadLink || '');
      setSavedSuccess(false);
    }
  }, [project]);

  if (!isOpen || !project) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateWorkLinks(project.id, {
      userDownloadLink: userDownloadLink.trim(),
      userUploadLink: userUploadLink.trim(),
      clientDownloadLink: clientDownloadLink.trim(),
      clientUploadLink: clientUploadLink.trim(),
    });

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in">
      <div
        id="edit-link-modal"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg">
                <Link2 className="w-4 h-4" />
              </span>
              <h3 className="font-semibold text-slate-900 text-base">Edit Portal Cloud Links</h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Configure the exact 4-link system for{' '}
              <span className="font-semibold text-slate-700">{project.name}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Informational Guidance */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-start space-x-3 text-xs text-amber-900">
            <Info className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold">Four-Link Architecture Rule:</p>
              <p className="mt-0.5 text-amber-800">
                Heavy video assets remain securely hosted in your Google Drive or cloud folders. The CRM
                binds these exact URLs to the corresponding action buttons in the Editor and Client portals.
              </p>
            </div>
          </div>

          {/* Section 1: EDITOR LINKS */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                Editor Link Settings ({editor?.name || 'Assigned Editor'})
              </span>
              <span className="text-[11px] text-slate-400">Editor Portal</span>
            </div>

            {/* Link 1: User Download Link */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Download className="w-3.5 h-3.5 text-indigo-600" />
                1. User Download Link
                <span className="text-slate-400 font-normal">(Editor: Download Raw Data)</span>
              </label>
              <input
                id="input-user-download-link"
                type="url"
                placeholder="https://drive.google.com/drive/folders/..."
                value={userDownloadLink}
                onChange={(e) => setUserDownloadLink(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono text-slate-800"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Mapped to editor's &quot;Download Raw Data&quot; button.
              </p>
            </div>

            {/* Link 2: User Upload Link */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5 text-indigo-600" />
                2. User Upload Link
                <span className="text-slate-400 font-normal">(Editor: Upload Edited Data)</span>
              </label>
              <input
                id="input-user-upload-link"
                type="url"
                placeholder="https://drive.google.com/drive/folders/..."
                value={userUploadLink}
                onChange={(e) => setUserUploadLink(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono text-slate-800"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Mapped to editor's &quot;Upload Edited Data&quot; button.
              </p>
            </div>
          </div>

          {/* Section 2: CLIENT LINKS */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-700 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-600"></span>
                Client Link Settings ({client?.name || 'Client'})
              </span>
              <span className="text-[11px] text-slate-400">Client Portal</span>
            </div>

            {/* Link 3: Client Upload Link */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5 text-cyan-600" />
                3. Client Upload Link
                <span className="text-slate-400 font-normal">(Client: Upload Raw Data)</span>
              </label>
              <input
                id="input-client-upload-link"
                type="url"
                placeholder="https://drive.google.com/drive/folders/..."
                value={clientUploadLink}
                onChange={(e) => setClientUploadLink(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 font-mono text-slate-800"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Mapped to client's &quot;Upload Raw Data&quot; button.
              </p>
            </div>

            {/* Link 4: Client Download Link */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Download className="w-3.5 h-3.5 text-cyan-600" />
                4. Client Download Link
                <span className="text-slate-400 font-normal">(Client: Download Edited Data)</span>
              </label>
              <input
                id="input-client-download-link"
                type="url"
                placeholder="https://drive.google.com/drive/folders/..."
                value={clientDownloadLink}
                onChange={(e) => setClientDownloadLink(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 font-mono text-slate-800"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Mapped to client's &quot;Download Edited Data&quot; button.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              id="btn-save-links"
              type="submit"
              disabled={savedSuccess}
              className={`flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white rounded-lg shadow-xs transition ${
                savedSuccess ? 'bg-emerald-600' : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  Saved Successfully!
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Links
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
