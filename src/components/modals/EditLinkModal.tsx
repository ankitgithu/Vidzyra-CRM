import React, { useState, useEffect } from 'react';
import { X, Folder, ExternalLink, Copy, Check, Save, AlertCircle } from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import {
  isValidGoogleDriveFolderUrl,
  getProjectDriveFolderUrl,
  DRIVE_FOLDER_VALIDATION_ERROR,
} from '../../utils/driveUtils';

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
  const { projects, updateProjectDriveFolder } = useCrm();

  const project = projects.find((p) => p.id === workId);

  const [driveFolderUrl, setDriveFolderUrl] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (project) {
      setDriveFolderUrl(getProjectDriveFolderUrl(project));
      setErrorMessage(null);
      setSavedSuccess(false);
      setCopied(false);
    }
  }, [project, isOpen]);

  if (!isOpen || !project) return null;

  const handleCopy = () => {
    if (!driveFolderUrl) return;
    navigator.clipboard.writeText(driveFolderUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = driveFolderUrl.trim();

    if (trimmed && !isValidGoogleDriveFolderUrl(trimmed)) {
      setErrorMessage(DRIVE_FOLDER_VALIDATION_ERROR);
      return;
    }

    setErrorMessage(null);
    updateProjectDriveFolder(project.id, trimmed);

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in">
      <div
        id="edit-drive-folder-modal"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg">
                <Folder className="w-4 h-4" />
              </span>
              <h3 className="font-semibold text-slate-900 text-base">Project Google Drive Folder</h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Set or update canonical folder for <span className="font-semibold text-slate-700">{project.name}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Architecture Note */}
          <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-3.5 flex items-start space-x-3 text-xs text-indigo-950">
            <Folder className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <p className="font-semibold text-indigo-900">One Project = One Google Drive Folder</p>
              <p className="text-[11px] text-indigo-800 leading-relaxed">
                Both the client and assigned editor will use this single shared folder for raw assets, references, revisions, and final deliverables.
              </p>
            </div>
          </div>

          {/* Drive Folder Field */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="input-modal-drive-folder" className="block text-xs font-bold text-slate-800">
                Project Drive Folder URL
              </label>
              {driveFolderUrl && (
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="text-[11px] text-slate-600 hover:text-slate-900 flex items-center gap-1 font-medium cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-600 font-semibold">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>
                  <span className="text-slate-300">•</span>
                  <a
                    href={driveFolderUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-medium"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Open
                  </a>
                </div>
              )}
            </div>

            <input
              id="input-modal-drive-folder"
              type="url"
              placeholder="https://drive.google.com/drive/folders/1a2b3c4d5e..."
              value={driveFolderUrl}
              onChange={(e) => {
                setDriveFolderUrl(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              className={`w-full text-xs px-3 py-2.5 bg-slate-50 border rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono text-slate-800 transition ${
                errorMessage ? 'border-rose-400 bg-rose-50/50' : 'border-slate-300'
              }`}
            />

            {errorMessage ? (
              <p className="text-rose-600 text-xs font-medium flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                {errorMessage}
              </p>
            ) : (
              <p className="text-[11px] text-slate-400">
                Paste the full URL of the project's Google Drive folder.
              </p>
            )}
          </div>

          {/* Folder Structure Recommendation */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
              Recommended Internal Subfolders:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
              <div className="flex items-center gap-2 p-1.5 bg-white rounded border border-slate-200">
                <span className="text-slate-400">📁</span>
                <span>Client Raw Files</span>
              </div>
              <div className="flex items-center gap-2 p-1.5 bg-white rounded border border-slate-200">
                <span className="text-slate-400">📁</span>
                <span>References</span>
              </div>
              <div className="flex items-center gap-2 p-1.5 bg-white rounded border border-slate-200">
                <span className="text-slate-400">📁</span>
                <span>Edited Videos</span>
              </div>
              <div className="flex items-center gap-2 p-1.5 bg-white rounded border border-slate-200">
                <span className="text-slate-400">📁</span>
                <span>Revisions</span>
              </div>
              <div className="flex items-center gap-2 p-1.5 bg-white rounded border border-slate-200 sm:col-span-2">
                <span className="text-emerald-500">📁</span>
                <span className="font-semibold text-slate-700">Final Deliverables</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="btn-save-drive-folder"
              type="submit"
              disabled={savedSuccess}
              className={`flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white rounded-lg shadow-xs transition cursor-pointer ${
                savedSuccess ? 'bg-emerald-600' : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  Folder Saved!
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Drive Folder
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
