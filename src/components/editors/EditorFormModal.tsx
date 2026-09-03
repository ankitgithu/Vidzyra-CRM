import React, { useState, useEffect } from 'react';
import { X, Film, Save } from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { Editor } from '../../types';

interface EditorFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editorToEdit?: Editor | null;
}

export const EditorFormModal: React.FC<EditorFormModalProps> = ({
  isOpen,
  onClose,
  editorToEdit,
}) => {
  const { addEditor, updateEditor } = useCrm();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [contact, setContact] = useState('');
  const [editorRate, setEditorRate] = useState<number>(900);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (editorToEdit) {
      setName(editorToEdit.name);
      setEmail(editorToEdit.email);
      setContact(editorToEdit.contact);
      setEditorRate(editorToEdit.editorRate || 900);
      setNotes(editorToEdit.notes || '');
    } else {
      setName('');
      setEmail('');
      setContact('');
      setEditorRate(900);
      setNotes('');
    }
  }, [editorToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editorToEdit) {
      updateEditor(editorToEdit.id, {
        name: name.trim(),
        email: email.trim(),
        contact: contact.trim(),
        editorRate: Number(editorRate) || 0,
        notes: notes.trim(),
      });
    } else {
      addEditor({
        name: name.trim(),
        email: email.trim(),
        contact: contact.trim(),
        editorRate: Number(editorRate) || 0,
        notes: notes.trim(),
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in">
      <div
        id="editor-form-modal"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden flex flex-col"
      >
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-purple-100 text-purple-700 rounded-lg">
              <Film className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-slate-900 text-base">
              {editorToEdit ? 'Edit Editor Details' : 'Add New Video Editor'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Editor Name *
            </label>
            <input
              id="editor-name-input"
              type="text"
              required
              placeholder="e.g. Karan Sharma"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Contact Number / WhatsApp
              </label>
              <input
                id="editor-contact-input"
                type="tel"
                placeholder="+91 98765 43210"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Default Editor Rate (₹ / video)
              </label>
              <input
                id="editor-rate-input"
                type="number"
                min="0"
                value={editorRate}
                onChange={(e) => setEditorRate(Number(e.target.value))}
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Email Address
            </label>
            <input
              id="editor-email-input"
              type="email"
              placeholder="editor@vidzyra.team"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Skills, Software &amp; Specialization Notes
            </label>
            <textarea
              id="editor-notes-input"
              rows={3}
              placeholder="Premiere Pro, After Effects, DaVinci Resolve, turnaround speed..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              id="btn-submit-editor"
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition"
            >
              <Save className="w-4 h-4" />
              {editorToEdit ? 'Save Changes' : 'Add Editor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
