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
  CheckCircle2,
  CheckSquare,
  Square,
  Layers,
  Sparkles,
  Calendar,
  Check,
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import {
  PaymentType,
  PaymentMethod,
  ExpenseCategory,
  ClientPayment,
  EditorPayment,
} from '../../types';
import {
  sortWorksOldestFirst,
  computePaymentPreview,
  computeClientWorkAllocations,
  getWorkEffectiveDate,
} from '../../utils/paymentAllocation';

interface PaymentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRecipientType?: 'Client' | 'Editor' | 'Expense';
  defaultRecipientId?: string | null;
  defaultWorkId?: string | null;
  paymentToEdit?: ClientPayment | EditorPayment | null;
  editCategory?: 'Client' | 'Editor' | null;
  onPaymentSaved?: (payment: ClientPayment | EditorPayment, category: 'Client' | 'Editor') => void;
}

export const PaymentFormModal: React.FC<PaymentFormModalProps> = ({
  isOpen,
  onClose,
  defaultRecipientType = 'Client',
  defaultRecipientId,
  defaultWorkId,
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
  const [selectedWorkIds, setSelectedWorkIds] = useState<string[]>([]);

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
        const cp = paymentToEdit as ClientPayment;
        setClientId(cp.clientId);
        if (cp.allocatedWorkIds && Array.isArray(cp.allocatedWorkIds) && cp.allocatedWorkIds.length > 0) {
          setSelectedWorkIds(cp.allocatedWorkIds);
        } else if (cp.allocations && Array.isArray(cp.allocations) && cp.allocations.length > 0) {
          setSelectedWorkIds(cp.allocations.map((a) => a.workId));
        } else if (cp.workId) {
          setSelectedWorkIds([cp.workId]);
        } else {
          setSelectedWorkIds([]);
        }
      } else if ('editorId' in paymentToEdit) {
        setEditorId(paymentToEdit.editorId);
        setSelectedWorkIds([]);
      }
    } else {
      setPaymentCategory(defaultRecipientType);
      if (defaultRecipientType === 'Client') {
        if (defaultWorkId) {
          const pr = projects.find((p) => p.id === defaultWorkId);
          setClientId(pr ? (pr.clientId || (pr as any).client_id || defaultRecipientId || '') : (defaultRecipientId || clients[0]?.id || ''));
          setWorkId(defaultWorkId);
          setSelectedWorkIds([defaultWorkId]);
        } else {
          setClientId(defaultRecipientId || clients[0]?.id || '');
          setWorkId('');
          setSelectedWorkIds([]);
        }
      } else if (defaultRecipientType === 'Editor') {
        setEditorId(defaultRecipientId || editors[0]?.id || '');
        setWorkId(defaultWorkId || '');
        setSelectedWorkIds([]);
      } else {
        setWorkId('');
        setSelectedWorkIds([]);
      }
      setAmount('');
      setDate(new Date().toISOString().split('T')[0]);
      setPaymentType('Advance');
      setPaymentMethod('Bank Transfer');
      setReferenceNumber('');
      setNotes('');
      setSelectedExpenseId('new');
      setExpenseTitle('');
      setExpenseTotalBill('');
    }
  }, [isOpen, paymentToEdit, editCategory, defaultRecipientType, defaultRecipientId, defaultWorkId, clients, editors, projects]);

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

  // Candidate works for the selected client, sorted oldest first
  const clientCandidateWorks = useMemo(() => {
    if (!clientId) return [];
    const works = projects.filter((p) => {
      const pClientId = p.clientId || (p as any).client_id || (p as any).client?.id;
      return Boolean(pClientId && pClientId === clientId);
    });
    return sortWorksOldestFirst(works);
  }, [projects, clientId]);

  // Base allocation for this client excluding the payment currently being edited
  const baseClientAllocations = useMemo(() => {
    if (!clientId) return null;
    const otherPayments =
      isEditing && paymentToEdit
        ? clientPayments.filter((p) => p.id !== paymentToEdit.id)
        : clientPayments;
    return computeClientWorkAllocations(clientId, projects, otherPayments);
  }, [clientId, projects, clientPayments, isEditing, paymentToEdit]);

  // Live preview of how the entered amount will settle the selected works
  const allocationPreview = useMemo(() => {
    if (paymentCategory !== 'Client' || !clientId) return null;
    return computePaymentPreview({
      clientId,
      clientWorks: clientCandidateWorks,
      clientPayments,
      selectedWorkIds,
      enteredAmount,
      paymentIdBeingEdited: isEditing && paymentToEdit ? paymentToEdit.id : undefined,
    });
  }, [
    paymentCategory,
    clientId,
    clientCandidateWorks,
    clientPayments,
    selectedWorkIds,
    enteredAmount,
    isEditing,
    paymentToEdit,
  ]);

  const paymentSummary = useMemo(() => {
    if (paymentCategory === 'Client') {
      const selectedClient = clients.find((c) => c.id === clientId);

      if (selectedWorkIds.length > 0 && allocationPreview) {
        const totalAmount = allocationPreview.totalSelectedAmount;
        const initialRemaining = allocationPreview.totalSelectedRemainingBefore;
        const basePaid = Math.max(0, totalAmount - initialRemaining);
        const calculatedTotalPaid = basePaid + allocationPreview.totalAllocatedFromPayment;
        const calculatedRemaining = Math.max(
          0,
          initialRemaining - allocationPreview.totalAllocatedFromPayment
        );
        const advanceAmount = allocationPreview.excessAdvanceAmount;

        return {
          entityName: `${selectedClient?.name || 'Client'} (${selectedWorkIds.length} ${
            selectedWorkIds.length === 1 ? 'Work' : 'Works'
          } Selected)`,
          totalAmount,
          basePaid,
          initialRemaining,
          calculatedTotalPaid,
          calculatedRemaining,
          isOverpaying: false,
          advanceAmount,
          isWorkSpecific: true,
        };
      }

      const stats = clientId ? getClientStats(clientId) : { totalBilling: 0, totalPaid: 0, remaining: 0 };

      const totalAmount = stats.totalBilling;
      const basePaid =
        isEditing && paymentToEdit
          ? Math.max(0, stats.totalPaid - (paymentToEdit.amount || 0))
          : stats.totalPaid;
      const initialRemaining = Math.max(0, totalAmount - basePaid);

      const calculatedTotalPaid = basePaid + enteredAmount;
      const calculatedRemaining = Math.max(0, totalAmount - calculatedTotalPaid);
      const advanceAmount = Math.max(0, enteredAmount - initialRemaining);

      return {
        entityName: `${selectedClient?.name || 'Selected Client'} (Account Settlement)`,
        totalAmount,
        basePaid,
        initialRemaining,
        calculatedTotalPaid,
        calculatedRemaining,
        isOverpaying: false,
        advanceAmount,
        isWorkSpecific: false,
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

    if (paymentCategory !== 'Client' && paymentSummary.isOverpaying) {
      return;
    }

    const numericAmount = Number(amount);

    if (paymentCategory === 'Client') {
      if (!clientId) return;

      let allocationsToSave: { workId: string; amount: number; workName?: string }[] | undefined =
        undefined;
      let advanceAmountToSave = 0;

      if (allocationPreview && selectedWorkIds.length > 0) {
        allocationsToSave = allocationPreview.items
          .filter((item) => item.allocatedFromThisPayment > 0)
          .map((item) => ({
            workId: item.workId,
            amount: item.allocatedFromThisPayment,
            workName: item.workName,
          }));
        advanceAmountToSave = allocationPreview.excessAdvanceAmount;
      } else if (allocationPreview) {
        advanceAmountToSave = allocationPreview.excessAdvanceAmount;
      }

      const clientPaymentPayload = {
        clientId,
        workId: selectedWorkIds[0] || undefined,
        allocatedWorkIds: selectedWorkIds.length > 0 ? selectedWorkIds : undefined,
        allocations: allocationsToSave,
        advanceAmount: advanceAmountToSave > 0 ? advanceAmountToSave : undefined,
        amount: numericAmount,
        date,
        paymentDate: date,
        paymentType,
        paymentMethod,
        referenceNumber: referenceNumber.trim(),
        notes: notes.trim(),
      };

      if (isEditing && paymentToEdit) {
        const updated = updateClientPayment(paymentToEdit.id, clientPaymentPayload);
        if (updated && onPaymentSaved) {
          onPaymentSaved(updated, 'Client');
        }
      } else {
        const created = addClientPayment(clientPaymentPayload);
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
            <div className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Client *</label>
                <select
                  required
                  value={clientId}
                  onChange={(e) => {
                    setClientId(e.target.value);
                    setSelectedWorkIds([]);
                    setWorkId('');
                  }}
                  disabled={isEditing}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg disabled:opacity-70 disabled:cursor-not-allowed font-medium text-slate-900"
                >
                  <option value="">Select a Client</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.clientType ? `(${c.clientType})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* SELECT WORK(S) TO SETTLE */}
              {clientId && (
                <div className="space-y-2 pt-1 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-indigo-600" />
                      <label className="font-semibold text-slate-800 text-xs">
                        Select Work(s) to Settle
                      </label>
                      {selectedWorkIds.length > 0 && (
                        <span className="bg-indigo-100 text-indigo-800 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                          {selectedWorkIds.length} selected
                        </span>
                      )}
                    </div>
                    {clientCandidateWorks.filter((w) => {
                      if (selectedWorkIds.includes(w.id)) return true;
                      const trk = baseClientAllocations?.workStatsMap[w.id];
                      return trk ? trk.remainingAmount > 0 : w.totalBilling > 0;
                    }).length > 0 && (
                      <div className="flex items-center gap-2 text-[11px]">
                        <button
                          type="button"
                          onClick={() => {
                            const unpaidIds = clientCandidateWorks
                              .filter((w) => {
                                const trk = baseClientAllocations?.workStatsMap[w.id];
                                const rem = trk ? trk.remainingAmount : w.totalBilling;
                                return rem > 0 || selectedWorkIds.includes(w.id);
                              })
                              .map((w) => w.id);
                            setSelectedWorkIds(unpaidIds);
                          }}
                          className="text-indigo-600 hover:text-indigo-800 font-semibold hover:underline cursor-pointer"
                        >
                          Select All Unpaid
                        </button>
                        <span className="text-slate-300">•</span>
                        <button
                          type="button"
                          onClick={() => setSelectedWorkIds([])}
                          className="text-slate-500 hover:text-slate-700 font-semibold hover:underline cursor-pointer"
                        >
                          Clear Selection
                        </button>
                      </div>
                    )}
                  </div>

                  {clientCandidateWorks.filter((w) => {
                    if (selectedWorkIds.includes(w.id)) return true;
                    const trk = baseClientAllocations?.workStatsMap[w.id];
                    return trk ? trk.remainingAmount > 0 : w.totalBilling > 0;
                  }).length === 0 ? (
                    <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl text-center text-emerald-800 text-xs">
                      All existing deliverables for this client are already fully paid. Any additional payment will be credited as Client Advance.
                    </div>
                  ) : (
                    <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 border border-slate-200 rounded-xl p-2 bg-slate-50/70">
                      {clientCandidateWorks
                        .filter((w) => {
                          if (selectedWorkIds.includes(w.id)) return true;
                          const trk = baseClientAllocations?.workStatsMap[w.id];
                          return trk ? trk.remainingAmount > 0 : w.totalBilling > 0;
                        })
                        .map((w) => {
                          const trk = baseClientAllocations?.workStatsMap[w.id];
                        const totalAmt = trk ? trk.totalAmount : w.totalBilling;
                        const alreadyPaid = trk ? trk.paymentReceived : 0;
                        const remaining = trk ? trk.remainingAmount : totalAmt;
                        const status = trk ? trk.status : 'Pending';
                        const isSelected = selectedWorkIds.includes(w.id);
                        const effectiveDate = getWorkEffectiveDate(w);

                        return (
                          <div
                            key={w.id}
                            onClick={() => {
                              setSelectedWorkIds((prev) =>
                                prev.includes(w.id)
                                  ? prev.filter((id) => id !== w.id)
                                  : [...prev, w.id]
                              );
                            }}
                            className={`p-2.5 rounded-lg border transition cursor-pointer flex items-start gap-2.5 text-xs select-none ${
                              isSelected
                                ? 'bg-indigo-50/80 border-indigo-400 shadow-2xs ring-1 ring-indigo-400/40'
                                : 'bg-white border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="pt-0.5 shrink-0">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {}}
                                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 pointer-events-none"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1 flex-wrap">
                                <span className="font-bold text-slate-900 truncate">{w.name}</span>
                                <span
                                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold shrink-0 ${
                                    status === 'Paid'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : status === 'Partially Paid'
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-slate-100 text-slate-700'
                                  }`}
                                >
                                  {status}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1 flex-wrap">
                                {effectiveDate && (
                                  <span className="bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded text-[10px] font-medium">
                                    {effectiveDate}
                                  </span>
                                )}
                                <span>
                                  Total: <strong className="text-slate-800">₹{totalAmt.toLocaleString('en-IN')}</strong>
                                </span>
                                <span>
                                  Paid: <strong className="text-emerald-700">₹{alreadyPaid.toLocaleString('en-IN')}</strong>
                                </span>
                                <span className={remaining > 0 ? 'text-amber-700 font-bold' : 'text-slate-500'}>
                                  Remaining: ₹{remaining.toLocaleString('en-IN')}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* ALLOCATION BREAKDOWN LIVE PREVIEW */}
                  {selectedWorkIds.length > 0 && allocationPreview && (
                    <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-indigo-900 flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                          Settlement Order (Oldest First)
                        </span>
                        <span className="text-slate-500">
                          {enteredAmount > 0
                            ? `Allocating ₹${Math.min(
                                enteredAmount,
                                allocationPreview.totalSelectedRemainingBefore
                              ).toLocaleString('en-IN')} of ₹${enteredAmount.toLocaleString('en-IN')}`
                            : 'Enter amount to preview'}
                        </span>
                      </div>

                      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                        {allocationPreview.items.map((item, idx) => (
                          <div
                            key={item.workId}
                            className="bg-white/95 border border-indigo-100 rounded-lg p-2.5 flex items-center justify-between text-xs gap-2"
                          >
                            <div className="min-w-0 pr-1 flex-1">
                              <span className="font-bold text-slate-900 truncate block">
                                {idx + 1}. {item.workName} — ₹{item.totalAmount.toLocaleString('en-IN')}
                              </span>
                              <span className="text-[10px] text-slate-500 block mt-0.5">
                                {item.workDate ? `${item.workDate} • ` : ''}
                                {item.allocatedFromThisPayment > 0
                                  ? `Allocating: +₹${item.allocatedFromThisPayment.toLocaleString('en-IN')}`
                                  : 'No allocation from this payment'}
                              </span>
                            </div>
                            <div className="text-right shrink-0">
                              <span
                                className={`font-bold block ${
                                  item.newRemaining === 0
                                    ? 'text-emerald-700'
                                    : item.allocatedFromThisPayment > 0
                                    ? 'text-amber-700'
                                    : 'text-slate-600'
                                }`}
                              >
                                Paid ₹{item.newTotalPaid.toLocaleString('en-IN')} → Remaining ₹{item.newRemaining.toLocaleString('en-IN')}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full inline-block mt-0.5 ${
                                  item.newRemaining === 0
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : item.newTotalPaid > 0
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {item.newRemaining === 0
                                  ? 'Fully Paid'
                                  : item.newTotalPaid > 0
                                  ? 'Partially Paid'
                                  : 'Pending'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {allocationPreview.excessAdvanceAmount > 0 && (
                        <div className="flex items-center gap-1.5 p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-[11px] font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>
                            Selected works fully settled! Excess of ₹
                            {allocationPreview.excessAdvanceAmount.toLocaleString('en-IN')} kept as Client Advance.
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {selectedWorkIds.length === 0 && (
                    <div className="p-2.5 bg-slate-100/70 border border-slate-200 rounded-xl text-slate-600 text-[11px] flex items-start gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span>
                        <strong>General Account Settlement:</strong> No individual work selected. This payment will be credited to the client&apos;s account and automatically allocated across their unpaid deliverables chronologically.
                      </span>
                    </div>
                  )}
                </div>
              )}
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
                  ? (paymentSummary as any).isWorkSpecific
                    ? 'Work Payment Summary'
                    : 'Client Payment Summary'
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
                  paymentCategory === 'Client' && (paymentSummary as any).advanceAmount > 0
                    ? 'bg-emerald-50/60 border-emerald-300'
                    : paymentSummary.calculatedRemaining === 0
                    ? 'bg-emerald-50/60 border-emerald-200'
                    : paymentSummary.isOverpaying
                    ? 'bg-rose-50 border-rose-300'
                    : 'bg-amber-50/60 border-amber-200'
                }`}
              >
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-tight">
                  {paymentCategory === 'Client' && (paymentSummary as any).advanceAmount > 0
                    ? 'Advance Balance'
                    : 'Remaining Amount'}
                </p>
                <p
                  className={`text-sm font-bold mt-0.5 ${
                    paymentCategory === 'Client' && (paymentSummary as any).advanceAmount > 0
                      ? 'text-emerald-700'
                      : paymentSummary.calculatedRemaining === 0
                      ? 'text-emerald-700'
                      : paymentSummary.isOverpaying
                      ? 'text-rose-700'
                      : 'text-amber-700'
                  }`}
                >
                  ₹{paymentCategory === 'Client' && (paymentSummary as any).advanceAmount > 0
                    ? (paymentSummary as any).advanceAmount.toLocaleString('en-IN')
                    : paymentSummary.calculatedRemaining.toLocaleString('en-IN')}
                </p>
                {paymentCategory === 'Client' && (paymentSummary as any).advanceAmount > 0 ? (
                  <p className="text-[10px] text-emerald-700 font-medium">(Client Credit)</p>
                ) : enteredAmount > 0 && paymentSummary.calculatedRemaining < paymentSummary.initialRemaining ? (
                  <p className="text-[10px] text-amber-700 font-medium">
                    (-₹{Math.min(paymentSummary.initialRemaining, enteredAmount).toLocaleString('en-IN')})
                  </p>
                ) : null}
              </div>
            </div>

            {/* Overpayment Alert for non-client */}
            {paymentCategory !== 'Client' && paymentSummary.isOverpaying && (
              <div className="flex items-center gap-1.5 p-2 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-[11px] font-semibold animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>
                  Payment of ₹{enteredAmount.toLocaleString('en-IN')} exceeds the remaining balance of ₹
                  {paymentSummary.initialRemaining.toLocaleString('en-IN')}.
                </span>
              </div>
            )}

            {/* Client Advance Notification */}
            {paymentCategory === 'Client' && (paymentSummary as any).advanceAmount > 0 && (
              <div className="flex items-center gap-1.5 p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-[11px] font-semibold animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  All selected deliverables will be fully paid, and ₹
                  {(paymentSummary as any).advanceAmount.toLocaleString('en-IN')} will remain as Client Advance credit.
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
              disabled={paymentCategory !== 'Client' && paymentSummary.isOverpaying}
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
              {paymentCategory !== 'Client' && paymentSummary.isOverpaying
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
