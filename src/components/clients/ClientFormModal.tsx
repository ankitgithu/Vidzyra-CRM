import React, { useState, useEffect } from 'react';
import { X, UserPlus, Save, User } from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { Client, ClientType } from '../../types';

interface ClientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientToEdit?: Client | null;
}

export const ClientFormModal: React.FC<ClientFormModalProps> = ({
  isOpen,
  onClose,
  clientToEdit,
}) => {
  const { addClient, updateClient } = useCrm();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [clientType, setClientType] = useState<ClientType>('Regular');
  const [defaultClientRate, setDefaultClientRate] = useState<number>(2000);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (clientToEdit) {
      setName(clientToEdit.name);
      setEmail(clientToEdit.email);
      setPhone(clientToEdit.phone);
      setWhatsapp(clientToEdit.whatsapp);
      setClientType(clientToEdit.clientType);
      setDefaultClientRate(clientToEdit.defaultClientRate || 2000);
      setNotes(clientToEdit.notes || '');
    } else {
      setName('');
      setEmail('');
      setPhone('');
      setWhatsapp('');
      setClientType('Regular');
      setDefaultClientRate(2000);
      setNotes('');
    }
  }, [clientToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (clientToEdit) {
      updateClient(clientToEdit.id, {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        whatsapp: whatsapp.trim() || phone.trim(),
        clientType,
        defaultClientRate: Number(defaultClientRate) || 0,
        notes: notes.trim(),
      });
    } else {
      addClient({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        whatsapp: whatsapp.trim() || phone.trim(),
        clientType,
        defaultClientRate: Number(defaultClientRate) || 0,
        notes: notes.trim(),
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in">
      <div
        id="client-form-modal"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden flex flex-col"
      >
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
              <UserPlus className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-slate-900 text-base">
              {clientToEdit ? 'Edit Client Details' : 'Add New Client'}
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
              Client / Brand Name *
            </label>
            <input
              id="client-name-input"
              type="text"
              required
              placeholder="e.g. Neon Peak Media"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Client Type
              </label>
              <select
                id="client-type-select"
                value={clientType}
                onChange={(e) => setClientType(e.target.value as ClientType)}
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="Regular">Regular</option>
                <option value="Work">Work</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Default Rate (₹ / video)
              </label>
              <input
                id="client-default-rate-input"
                type="number"
                min="0"
                value={defaultClientRate}
                onChange={(e) => setDefaultClientRate(Number(e.target.value))}
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <input
                id="client-email-input"
                type="email"
                placeholder="contact@brand.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Phone Number
              </label>
              <input
                id="client-phone-input"
                type="tel"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              WhatsApp Number (for automated links &amp; direct messages)
            </label>
            <input
              id="client-whatsapp-input"
              type="tel"
              placeholder="+919876543210 (country code included)"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Notes &amp; Video Style Guidelines
            </label>
            <textarea
              id="client-notes-input"
              rows={3}
              placeholder="Brand fonts, pacing, 4K requirements, color palettes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
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
              id="btn-submit-client"
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition"
            >
              <Save className="w-4 h-4" />
              {clientToEdit ? 'Save Changes' : 'Add Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
