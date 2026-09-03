import React, { useState, useEffect } from 'react';
import {
  X,
  CreditCard,
  Save,
  ArrowDownRight,
  ArrowUpRight,
  DollarSign,
  FileCheck,
  Edit3,
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import {
  PaymentType,
  PaymentMethod,
  ExpenseCategory,
  ClientPayment,
  EditorPayment,
} from '../../types';

interface PaymentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRecipientType?: 'Client' | 'Editor' | 'Expense';
  defaultRecipientId?: string | null;
  paymentToEdit?: ClientPayment | EditorPayment | null;
  editCategory?: 'Client' | 'Editor' | null;
  onPaymentSaved?: (payment: ClientPayment | EditorPayment, category: 'Client' | 'Editor') => void;
}

export const PaymentFormModal: React.FC<PaymentFormModalProps> = ({
  isOpen,
  onClose,
  defaultRecipientType = 'Client',
  defaultRecipientId,
  paymentToEdit,
  editCategory,
  onPaymentSaved,
}) => {
  const {
    clients,
    editors,
    projects,
    addClientPayment,
    updateClientPayment,
    addEditorPayment,
    updateEditorPayment,
    addExpense,
  } = useCrm();

  const isEditing = !!paymentToEdit;
  const initialCat = editCategory || defaultRecipientType;
  const [paymentCategory, setPaymentCategory] = useState<'Client' | 'Editor' | 'Expense'>(initialCat);

  // Common fields
  const [amount, setAmount] = useState<number>(5000);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentType, setPaymentType] = useState<PaymentType>('Advance');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Bank Transfer');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');

  // Target specific
  const [clientId, setClientId] = useState('');
  const [editorId, setEditorId] = useState('');
  const [workId, setWorkId] = useState('');

  // Expense specific
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseCategory, setExpenseCategory] = useState<ExpenseCategory>('Software & AI Subscriptions');

  useEffect(() => {
    if (paymentToEdit) {
      const cat = editCategory || ('clientId' in paymentToEdit ? 'Client' : 'Editor');
      setPaymentCategory(cat);
      setAmount(paymentToEdit.amount || 0);
      setDate(paymentToEdit.date || paymentToEdit.paymentDate || new Date().toISOString().split('T')[0]);
      setPaymentType(
        paymentToEdit.paymentType === 'Advance' ||
        paymentToEdit.paymentType === 'Partial' ||
        paymentToEdit.paymentType === 'Final'
          ? paymentToEdit.paymentType
          : 'Advance'
      );
      setPaymentMethod(paymentToEdit.paymentMethod || 'Bank Transfer');
      setReferenceNumber(paymentToEdit.referenceNumber || '');
      setNotes(paymentToEdit.notes || '');
      setWorkId(paymentToEdit.workId || '');

      if ('clientId' in paymentToEdit) {
        setClientId(paymentToEdit.clientId);
      } else if ('editorId' in paymentToEdit) {
        setEditorId(paymentToEdit.editorId);
      }
    } else {
      setPaymentCategory(defaultRecipientType);
      if (defaultRecipientType === 'Client') {
        setClientId(defaultRecipientId || clients[0]?.id || '');
      } else if (defaultRecipientType === 'Editor') {
        setEditorId(defaultRecipientId || editors[0]?.id || '');
      }
      setAmount(5000);
      setDate(new Date().toISOString().split('T')[0]);
      setPaymentType('Advance');
      setPaymentMethod('Bank Transfer');
      setReferenceNumber('');
      setNotes('');
      setWorkId('');
      setExpenseTitle('');
    }
  }, [isOpen, paymentToEdit, editCategory, defaultRecipientType, defaultRecipientId, clients, editors]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0) return;

    if (paymentCategory === 'Client') {
      if (!clientId) return;

      if (isEditing && paymentToEdit) {
        const updated = updateClientPayment(paymentToEdit.id, {
          clientId,
          workId: workId || undefined,
          amount: Number(amount),
          date,
          paymentDate: date,
          paymentType,
          paymentMethod,
          referenceNumber: referenceNumber.trim(),
          notes: notes.trim(),
        });
        if (updated && onPaymentSaved) {
          onPaymentSaved(updated, 'Client');
        }
      } else {
        const created = addClientPayment({
          clientId,
          workId: workId || undefined,
          amount: Number(amount),
          date,
          paymentDate: date,
          paymentType,
          paymentMethod,
          referenceNumber: referenceNumber.trim(),
          notes: notes.trim(),
        });
        if (created && onPaymentSaved) {
          onPaymentSaved(created, 'Client');
        }
      }
    } else if (paymentCategory === 'Editor') {
      if (!editorId) return;

      if (isEditing && paymentToEdit) {
        const updated = updateEditorPayment(paymentToEdit.id, {
          editorId,
          workId: workId || undefined,
          amount: Number(amount),
          date,
          paymentDate: date,
          paymentType,
          paymentMethod,
          referenceNumber: referenceNumber.trim(),
          notes: notes.trim(),
        });
        if (updated && onPaymentSaved) {
          onPaymentSaved(updated, 'Editor');
        }
      } else {
        const created = addEditorPayment({
          editorId,
          workId: workId || undefined,
          amount: Number(amount),
          date,
          paymentDate: date,
          paymentType,
          paymentMethod,
          referenceNumber: referenceNumber.trim(),
          notes: notes.trim(),
        });
        if (created && onPaymentSaved) {
          onPaymentSaved(created, 'Editor');
        }
      }
    } else if (paymentCategory === 'Expense') {
      if (!expenseTitle.trim()) return;
      addExpense({
        name: expenseTitle.trim(),
        category: expenseCategory,
        amount: Number(amount),
        date,
        notes: notes.trim(),
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in">
      <div
        id="payment-form-modal"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2">
            <div
              className={`p-2 rounded-lg ${
                isEditing
                  ? 'bg-amber-100 text-amber-700'
                  : paymentCategory === 'Client'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-purple-100 text-purple-700'
              }`}
            >
              {isEditing ? <Edit3 className="w-4 h-4" /> : <CreditCard className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-base">
                {isEditing
                  ? `Edit ${paymentCategory} Payment`
                  : `Record ${paymentCategory} Payment`}
              </h3>
              {isEditing && paymentToEdit && (
                <p className="text-[11px] text-slate-500 font-mono">
                  Slip: {paymentToEdit.receiptNumber}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Transaction Type Picker (Disabled while editing to preserve integrity) */}
        {!isEditing && (
          <div className="px-6 pt-4 pb-1 border-b border-slate-100">
            <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setPaymentCategory('Client')}
                className={`py-2 rounded-lg transition flex items-center justify-center gap-1 ${
                  paymentCategory === 'Client'
                    ? 'bg-white text-emerald-700 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ArrowDownRight className="w-3.5 h-3.5 text-emerald-600" />
                Client Payment
              </button>

              <button
                type="button"
                onClick={() => setPaymentCategory('Editor')}
                className={`py-2 rounded-lg transition flex items-center justify-center gap-1 ${
                  paymentCategory === 'Editor'
                    ? 'bg-white text-purple-700 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ArrowUpRight className="w-3.5 h-3.5 text-purple-600" />
                Editor Payout
              </button>

              <button
                type="button"
                onClick={() => setPaymentCategory('Expense')}
                className={`py-2 rounded-lg transition flex items-center justify-center gap-1 ${
                  paymentCategory === 'Expense'
                    ? 'bg-white text-rose-700 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <DollarSign className="w-3.5 h-3.5 text-rose-600" />
                Agency Expense
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Target Selector */}
          {paymentCategory === 'Client' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Client *</label>
                <select
                  required
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  disabled={isEditing}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  <option value="">Select a Client</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Related Project (Optional)</label>
                <select
                  value={workId}
                  onChange={(e) => setWorkId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                >
                  <option value="">General / All Deliverables</option>
                  {projects
                    .filter((p) => p.clientId === clientId)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (₹{p.totalBilling.toLocaleString()})
                      </option>
                    ))}
                </select>
              </div>
            </div>
          )}

          {paymentCategory === 'Editor' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Editor *</label>
                <select
                  required
                  value={editorId}
                  onChange={(e) => setEditorId(e.target.value)}
                  disabled={isEditing}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  <option value="">Select an Editor</option>
                  {editors.map((ed) => (
                    <option key={ed.id} value={ed.id}>
                      {ed.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Related Project (Optional)</label>
                <select
                  value={workId}
                  onChange={(e) => setWorkId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                >
                  <option value="">General / Batch Payout</option>
                  {projects
                    .filter((p) => p.assignedTo === editorId)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (Cost: ₹{(p.quantity * (p.editorRate || 0)).toLocaleString()})
                      </option>
                    ))}
                </select>
              </div>
            </div>
          )}

          {paymentCategory === 'Expense' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Expense Title / Item *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Adobe Premiere Team Subscription"
                  value={expenseTitle}
                  onChange={(e) => setExpenseTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value as ExpenseCategory)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                >
                  <option value="Software & AI Subscriptions">Software &amp; AI Subscriptions</option>
                  <option value="Assets & Music">Assets &amp; Music (Envato, Artlist)</option>
                  <option value="Gear & Hardware">Gear &amp; Hardware</option>
                  <option value="Marketing & Ads">Marketing &amp; Ads</option>
                  <option value="Team Perks">Team Perks</option>
                  <option value="Other">Other Operational</option>
                </select>
              </div>
            </div>
          )}

          {/* Amount & Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Payment Amount (₹) *</label>
              <input
                id="payment-amount-input"
                type="number"
                min="1"
                required
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Payment Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          {/* Payment Type & Method */}
          <div className="grid grid-cols-2 gap-3">
            {paymentCategory !== 'Expense' && (
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Payment Type *</label>
                <select
                  value={paymentType}
                  onChange={(e) => setPaymentType(e.target.value as PaymentType)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium"
                >
                  <option value="Advance">Advance</option>
                  <option value="Partial">Partial</option>
                  <option value="Final">Final</option>
                </select>
              </div>
            )}

            <div className={paymentCategory === 'Expense' ? 'col-span-2' : ''}>
              <label className="block font-semibold text-slate-700 mb-1">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
              >
                <option value="Bank Transfer">Bank Transfer (IMPS/NEFT/RTGS)</option>
                <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                <option value="Cash">Cash</option>
                <option value="Credit/Debit Card">Credit/Debit Card</option>
                <option value="PayPal">PayPal</option>
                <option value="Cheque">Cheque</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Reference / UTR Number */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Transaction ID / UTR / Reference Number
            </label>
            <input
              type="text"
              placeholder="e.g. UTR-982341908234 or UPI/7823418"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Payment Notes &amp; Remarks</label>
            <textarea
              rows={2}
              placeholder="Optional payment remarks, invoice reference, or terms..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              id="btn-submit-payment"
              type="submit"
              className={`flex items-center gap-1.5 px-5 py-2 font-semibold text-white rounded-lg shadow-xs transition ${
                isEditing
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : paymentCategory === 'Client'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-purple-600 hover:bg-purple-700'
              }`}
            >
              <Save className="w-4 h-4" />
              {isEditing ? 'Save Changes & Recalculate' : 'Save Payment & Generate Slip'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
