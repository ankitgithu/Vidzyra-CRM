import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  CreditCard,
  Save,
  ArrowDownRight,
  ArrowUpRight,
  DollarSign,
  Edit3,
  AlertCircle,
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
    clientPayments,
    editorPayments,
    expenses,
    getClientStats,
    getEditorStats,
    addClientPayment,
    updateClientPayment,
    addEditorPayment,
    updateEditorPayment,
    addExpense,
    updateExpense,
  } = useCrm();

  const isEditing = !!paymentToEdit;
  const initialCat = editCategory || defaultRecipientType;
  const [paymentCategory, setPaymentCategory] = useState<'Client' | 'Editor' | 'Expense'>(initialCat);

  // Common fields
  const [amount, setAmount] = useState<number | string>('');
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
  const [selectedExpenseId, setSelectedExpenseId] = useState<string>('new');
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseCategory, setExpenseCategory] = useState<ExpenseCategory>('Software & AI Subscriptions');
  const [expenseTotalBill, setExpenseTotalBill] = useState<number | string>('');

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
      setAmount('');
      setDate(new Date().toISOString().split('T')[0]);
      setPaymentType('Advance');
      setPaymentMethod('Bank Transfer');
      setReferenceNumber('');
      setNotes('');
      setWorkId('');
      setSelectedExpenseId('new');
      setExpenseTitle('');
      setExpenseTotalBill('');
    }
  }, [isOpen, paymentToEdit, editCategory, defaultRecipientType, defaultRecipientId, clients, editors]);

  // When selected existing expense changes in Expense mode
  useEffect(() => {
    if (paymentCategory === 'Expense') {
      if (selectedExpenseId && selectedExpenseId !== 'new') {
        const exp = expenses.find((e) => e.id === selectedExpenseId);
        if (exp) {
          setExpenseTitle(exp.name || exp.title || '');
          setExpenseCategory((exp.category as ExpenseCategory) || 'Software & AI Subscriptions');
          const totalAmt = exp.totalAmount || exp.amount || 0;
          setExpenseTotalBill(totalAmt);
        }
      }
    }
  }, [selectedExpenseId, paymentCategory, expenses]);

  // Dynamic Payment Summary Calculations
  const enteredAmount = typeof amount === 'number' && !isNaN(amount) && amount > 0 ? amount : 0;

  const paymentSummary = useMemo(() => {
    if (paymentCategory === 'Client') {
      const selectedClient = clients.find((c) => c.id === clientId);
      const stats = clientId ? getClientStats(clientId) : { totalBilling: 0, totalPaid: 0, remaining: 0 };

      const totalAmount = stats.totalBilling;
      // If editing, subtract this payment's current recorded amount to see the true base
      const basePaid = isEditing && paymentToEdit ? Math.max(0, stats.totalPaid - (paymentToEdit.amount || 0)) : stats.totalPaid;
      const initialRemaining = Math.max(0, totalAmount - basePaid);

      const calculatedTotalPaid = basePaid + enteredAmount;
      const calculatedRemaining = Math.max(0, totalAmount - calculatedTotalPaid);

      const isOverpaying = totalAmount > 0 && enteredAmount > initialRemaining;

      return {
        entityName: selectedClient?.name || 'Selected Client',
        totalAmount,
        basePaid,
        initialRemaining,
        calculatedTotalPaid,
        calculatedRemaining,
        isOverpaying,
      };
    }

    if (paymentCategory === 'Editor') {
      const selectedEditor = editors.find((e) => e.id === editorId);
      const stats = editorId ? getEditorStats(editorId) : { totalCost: 0, totalPaid: 0, remaining: 0 };

      const totalAmount = stats.totalCost;
      const basePaid = isEditing && paymentToEdit ? Math.max(0, stats.totalPaid - (paymentToEdit.amount || 0)) : stats.totalPaid;
      const initialRemaining = Math.max(0, totalAmount - basePaid);

      const calculatedTotalPaid = basePaid + enteredAmount;
      const calculatedRemaining = Math.max(0, totalAmount - calculatedTotalPaid);

      const isOverpaying = totalAmount > 0 && enteredAmount > initialRemaining;

      return {
        entityName: selectedEditor?.name || 'Selected Editor',
        totalAmount,
        basePaid,
        initialRemaining,
        calculatedTotalPaid,
        calculatedRemaining,
        isOverpaying,
      };
    }

    // Expense mode
    if (selectedExpenseId && selectedExpenseId !== 'new') {
      const exp = expenses.find((e) => e.id === selectedExpenseId);
      const totalAmount = exp ? exp.totalAmount || exp.amount || 0 : 0;
      const basePaid = exp
        ? exp.paidAmount !== undefined
          ? exp.paidAmount
          : exp.remainingAmount !== undefined
          ? (exp.totalAmount || exp.amount) - exp.remainingAmount
          : exp.amount
        : 0;
      const initialRemaining = Math.max(0, totalAmount - basePaid);

      const calculatedTotalPaid = basePaid + enteredAmount;
      const calculatedRemaining = Math.max(0, totalAmount - calculatedTotalPaid);
      const isOverpaying = totalAmount > 0 && enteredAmount > initialRemaining;

      return {
        entityName: exp ? exp.name || exp.title : 'Selected Expense',
        totalAmount,
        basePaid,
        initialRemaining,
        calculatedTotalPaid,
        calculatedRemaining,
        isOverpaying,
      };
    }

    // New Expense
    const totalAmount =
      typeof expenseTotalBill === 'number' && expenseTotalBill > 0
        ? expenseTotalBill
        : enteredAmount;
    const basePaid = 0;
    const initialRemaining = totalAmount;
    const calculatedTotalPaid = enteredAmount;
    const calculatedRemaining = Math.max(0, totalAmount - enteredAmount);
    const isOverpaying = totalAmount > 0 && enteredAmount > totalAmount;

    return {
      entityName: expenseTitle.trim() || 'New Agency Expense',
      totalAmount,
      basePaid,
      initialRemaining,
      calculatedTotalPaid,
      calculatedRemaining,
      isOverpaying,
    };
  }, [
    paymentCategory,
    clientId,
    editorId,
    clients,
    editors,
    getClientStats,
    getEditorStats,
    isEditing,
    paymentToEdit,
    enteredAmount,
    selectedExpenseId,
    expenses,
    expenseTotalBill,
    expenseTitle,
  ]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return;

    if (paymentSummary.isOverpaying) {
      return;
    }

    const numericAmount = Number(amount);

    if (paymentCategory === 'Client') {
      if (!clientId) return;

      if (isEditing && paymentToEdit) {
        const updated = updateClientPayment(paymentToEdit.id, {
          clientId,
          workId: workId || undefined,
          amount: numericAmount,
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
          amount: numericAmount,
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
          amount: numericAmount,
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
          amount: numericAmount,
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

      if (selectedExpenseId && selectedExpenseId !== 'new') {
        // Record payment against existing expense
        const exp = expenses.find((e) => e.id === selectedExpenseId);
        if (exp) {
          const prevPaid =
            exp.paidAmount !== undefined
              ? exp.paidAmount
              : exp.remainingAmount !== undefined
              ? (exp.totalAmount || exp.amount) - exp.remainingAmount
              : exp.amount;
          const newPaid = prevPaid + numericAmount;
          const totalAmt = exp.totalAmount || exp.amount || newPaid;
          const newRemaining = Math.max(0, totalAmt - newPaid);

          updateExpense(exp.id, {
            amount: newPaid,
            paidAmount: newPaid,
            totalAmount: totalAmt,
            remainingAmount: newRemaining,
            paymentMethod,
            date,
            notes: notes.trim() ? `${exp.notes ? exp.notes + ' | ' : ''}${notes.trim()}` : exp.notes,
          });
        }
      } else {
        // Create new expense with Total Amount / Paid / Remaining
        const totalAmt =
          typeof expenseTotalBill === 'number' && expenseTotalBill > 0
            ? expenseTotalBill
            : numericAmount;
        const remainingAmt = Math.max(0, totalAmt - numericAmount);

        addExpense({
          name: expenseTitle.trim(),
          category: expenseCategory,
          amount: numericAmount,
          totalAmount: totalAmt,
          paidAmount: numericAmount,
          remainingAmount: remainingAmt,
          date,
          paymentMethod,
          notes: notes.trim(),
        });
      }
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in">
      <div
        id="payment-form-modal"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden flex flex-col max-h-[94vh]"
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
              {isEditing && paymentToEdit ? (
                <p className="text-[11px] text-slate-500 font-mono">
                  Slip: {paymentToEdit.receiptNumber}
                </p>
              ) : (
                <p className="text-[11px] text-slate-500">
                  {paymentCategory === 'Client'
                    ? 'Client payment receipt with automatic balance calculation'
                    : paymentCategory === 'Editor'
                    ? 'Editor payout with agreed rate balance calculation'
                    : 'Track agency expense and payment balance'}
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
          <div className="px-6 pt-3 pb-1 border-b border-slate-100">
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
                    .filter((p) => p.clientId === clientId || (p as any).client_id === clientId)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (₹{p.totalBilling.toLocaleString('en-IN')})
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
                    .filter((p) => {
                      const assignedEditorId = p.assignedTo || (p as any).editorId;
                      return Boolean(assignedEditorId && assignedEditorId === editorId);
                    })
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (Cost: ₹{((p.quantity || 1) * (p.editorRate || 0)).toLocaleString('en-IN')})
                      </option>
                    ))}
                </select>
              </div>
            </div>
          )}

          {paymentCategory === 'Expense' && (
            <div className="space-y-3">
              {expenses.length > 0 && !isEditing && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Expense Record</label>
                  <select
                    value={selectedExpenseId}
                    onChange={(e) => setSelectedExpenseId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium"
                  >
                    <option value="new">+ Record New Expense</option>
                    {expenses.map((exp) => {
                      const totalAmt = exp.totalAmount || exp.amount || 0;
                      const paidAmt =
                        exp.paidAmount !== undefined
                          ? exp.paidAmount
                          : exp.remainingAmount !== undefined
                          ? totalAmt - exp.remainingAmount
                          : exp.amount;
                      const remAmt = Math.max(0, totalAmt - paidAmt);
                      return (
                        <option key={exp.id} value={exp.id}>
                          {exp.name || exp.title} (Remaining: ₹{remAmt.toLocaleString('en-IN')})
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Expense Title / Item *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Adobe Creative Cloud / Stock Music"
                    value={expenseTitle}
                    onChange={(e) => setExpenseTitle(e.target.value)}
                    disabled={selectedExpenseId !== 'new'}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg disabled:opacity-75"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={expenseCategory}
                    onChange={(e) => setExpenseCategory(e.target.value as ExpenseCategory)}
                    disabled={selectedExpenseId !== 'new'}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg disabled:opacity-75"
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

              {selectedExpenseId === 'new' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Total Expense Amount (₹) <span className="text-slate-400 font-normal">(Invoice / Bill Total)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Leave blank if paying full amount now"
                    value={expenseTotalBill}
                    onChange={(e) => setExpenseTotalBill(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium"
                  />
                </div>
              )}
            </div>
          )}

          {/* DYNAMIC PAYMENT SUMMARY CARD */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                {paymentCategory === 'Client'
                  ? 'Client Payment Summary'
                  : paymentCategory === 'Editor'
                  ? 'Editor Payment Summary'
                  : 'Expense Payment Summary'}
              </span>
              <span className="text-xs font-bold text-slate-800 truncate max-w-[220px]">
                {paymentSummary.entityName}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-tight">
                  {paymentCategory === 'Client'
                    ? 'Total Amount'
                    : paymentCategory === 'Editor'
                    ? 'Total Amount'
                    : 'Total Expense'}
                </p>
                <p className="text-sm font-bold text-slate-900 mt-0.5">
                  ₹{paymentSummary.totalAmount.toLocaleString('en-IN')}
                </p>
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-tight">
                  Total Paid
                </p>
                <p className="text-sm font-bold text-emerald-600 mt-0.5">
                  ₹{paymentSummary.calculatedTotalPaid.toLocaleString('en-IN')}
                </p>
                {enteredAmount > 0 && (
                  <p className="text-[10px] text-emerald-700 font-medium">
                    (₹{paymentSummary.basePaid.toLocaleString('en-IN')} + ₹{enteredAmount.toLocaleString('en-IN')})
                  </p>
                )}
              </div>

              <div
                className={`p-2.5 rounded-lg border shadow-2xs ${
                  paymentSummary.calculatedRemaining === 0
                    ? 'bg-emerald-50/60 border-emerald-200'
                    : paymentSummary.isOverpaying
                    ? 'bg-rose-50 border-rose-300'
                    : 'bg-amber-50/60 border-amber-200'
                }`}
              >
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-tight">
                  Remaining Amount
                </p>
                <p
                  className={`text-sm font-bold mt-0.5 ${
                    paymentSummary.calculatedRemaining === 0
                      ? 'text-emerald-700'
                      : paymentSummary.isOverpaying
                      ? 'text-rose-700'
                      : 'text-amber-700'
                  }`}
                >
                  ₹{paymentSummary.calculatedRemaining.toLocaleString('en-IN')}
                </p>
                {enteredAmount > 0 && paymentSummary.calculatedRemaining < paymentSummary.initialRemaining && (
                  <p className="text-[10px] text-amber-700 font-medium">
                    (-₹{Math.min(paymentSummary.initialRemaining, enteredAmount).toLocaleString('en-IN')})
                  </p>
                )}
              </div>
            </div>

            {/* Overpayment Alert */}
            {paymentSummary.isOverpaying && (
              <div className="flex items-center gap-1.5 p-2 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-[11px] font-semibold animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>
                  Payment of ₹{enteredAmount.toLocaleString('en-IN')} exceeds the remaining balance of ₹
                  {paymentSummary.initialRemaining.toLocaleString('en-IN')}.
                </span>
              </div>
            )}
          </div>

          {/* Amount & Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {paymentCategory === 'Client'
                  ? 'Payment Received (₹) *'
                  : paymentCategory === 'Editor'
                  ? 'Payout Amount (₹) *'
                  : 'Payment Amount (₹) *'}
              </label>
              <input
                id="payment-amount-input"
                type="number"
                min="1"
                required
                placeholder="Enter amount..."
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
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
              disabled={paymentSummary.isOverpaying}
              className={`flex items-center gap-1.5 px-5 py-2 font-semibold text-white rounded-lg shadow-xs transition disabled:opacity-50 disabled:cursor-not-allowed ${
                isEditing
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : paymentCategory === 'Client'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : paymentCategory === 'Editor'
                  ? 'bg-purple-600 hover:bg-purple-700'
                  : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              <Save className="w-4 h-4" />
              {paymentSummary.isOverpaying
                ? 'Amount Exceeds Remaining'
                : isEditing
                ? 'Save Changes & Recalculate'
                : 'Save Payment & Generate Slip'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
