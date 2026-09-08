import React, { useState, useEffect } from 'react';
import {
  X,
  FileText,
  Download,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Building,
  Calendar,
  DollarSign,
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { Invoice, InvoiceItem, PaymentStatus } from '../../types';
import { generateInvoicePdf } from '../../utils/pdfGenerator';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialClientId?: string;
  initialWorkId?: string;
  existingInvoice?: Invoice;
  onSuccess?: (invoice: Invoice) => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  isOpen,
  onClose,
  initialClientId,
  initialWorkId,
  existingInvoice,
  onSuccess,
}) => {
  const { clients, projects, settings, invoices, createInvoice, updateInvoice } = useCrm();

  const [clientId, setClientId] = useState<string>(initialClientId || existingInvoice?.clientId || '');
  const [invoiceNumber, setInvoiceNumber] = useState<string>(() => {
    if (existingInvoice?.invoiceNumber) return existingInvoice.invoiceNumber;
    const prefix = (settings?.invoicePrefix || 'INV-').trim();
    const year = new Date().getFullYear();
    const existingNums = (invoices || [])
      .map((inv) => {
        const match = inv.invoiceNumber?.match(/(\d+)$/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter((n) => !isNaN(n));
    const nextSeq = (existingNums.length > 0 ? Math.max(...existingNums) : 1000) + 1;
    return `${prefix}${year}-${nextSeq}`;
  });
  const [date, setDate] = useState<string>(
    existingInvoice?.date || new Date().toISOString().split('T')[0]
  );
  const [dueDate, setDueDate] = useState<string>(
    existingInvoice?.dueDate ||
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [items, setItems] = useState<InvoiceItem[]>(
    existingInvoice?.items || [
      {
        id: 'item-1',
        description: 'Video Editing Deliverables',
        quantity: 1,
        rate: 5000,
        amount: 5000,
      },
    ]
  );
  const [taxPercent, setTaxPercent] = useState<number>(existingInvoice?.tax && existingInvoice?.subtotal ? Math.round((existingInvoice.tax / existingInvoice.subtotal) * 100) : 0);
  const [paidAmount, setPaidAmount] = useState<number>(existingInvoice?.paidAmount || 0);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(
    existingInvoice?.paymentStatus || 'Pending'
  );
  const [notes, setNotes] = useState<string>(
    existingInvoice?.notes || 'Thank you for your business! Please settle the balance before the due date.'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync when initial client/work changes or modal opens
  useEffect(() => {
    if (initialClientId) setClientId(initialClientId);
  }, [initialClientId]);

  useEffect(() => {
    if (initialWorkId) {
      const proj = projects.find((p) => p.id === initialWorkId);
      if (proj) {
        if (!clientId) setClientId(proj.clientId);
        setItems([
          {
            id: `item-${proj.id}`,
            description: `${proj.name} (${proj.workType})`,
            quantity: proj.quantity || 1,
            rate: proj.clientRate || proj.totalBilling || 0,
            amount: proj.totalBilling || 0,
          },
        ]);
      }
    }
  }, [initialWorkId, projects]);

  if (!isOpen) return null;

  const selectedClient = clients.find((c) => c.id === clientId);

  const subtotal = items.reduce((acc, item) => acc + (Number(item.amount) || 0), 0);
  const parsedTaxPercent = Math.max(0, Number(taxPercent) || 0);
  const taxAmount = (subtotal * parsedTaxPercent) / 100;
  const total = subtotal + taxAmount;
  const safePaidAmount = Math.max(0, Number(paidAmount) || 0);
  const dueAmount = Math.max(0, total - safePaidAmount);

  // Derive payment status mathematically to guarantee complete consistency
  const mathematicallyDerivedStatus: PaymentStatus =
    dueAmount <= 0 && total > 0
      ? 'Paid'
      : safePaidAmount > 0
      ? 'Partial'
      : 'Pending';

  const handlePaidAmountChange = (val: number) => {
    const num = Math.max(0, val);
    setPaidAmount(num);
    if (num >= total && total > 0) {
      setPaymentStatus('Paid');
    } else if (num > 0) {
      setPaymentStatus('Partial');
    } else {
      setPaymentStatus('Pending');
    }
  };

  const handleStatusChange = (newStatus: PaymentStatus) => {
    setPaymentStatus(newStatus);
    if (newStatus === 'Paid') {
      setPaidAmount(total);
    } else if (newStatus === 'Pending') {
      setPaidAmount(0);
    } else if (newStatus === 'Partial') {
      if (paidAmount === 0 || paidAmount >= total) {
        setPaidAmount(Math.round(total / 2));
      }
    }
  };

  const handleItemChange = (index: number, field: keyof InvoiceItem, val: any) => {
    setItems((prev) => {
      const updated = [...prev];
      const item = { ...updated[index], [field]: val };
      if (field === 'quantity' || field === 'rate') {
        item.amount = (Number(item.quantity) || 0) * (Number(item.rate) || 0);
      }
      updated[index] = item;
      return updated;
    });
  };

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        description: 'New Project Deliverable',
        quantity: 1,
        rate: 1000,
        amount: 1000,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Quick import all pending deliverables of client
  const handleImportClientWork = () => {
    if (!clientId) return;
    const clientProjects = projects.filter((p) => p.clientId === clientId);
    if (clientProjects.length === 0) {
      setErrorMsg('No deliverables found for this client.');
      setTimeout(() => setErrorMsg(null), 3000);
      return;
    }
    const newItems: InvoiceItem[] = clientProjects.map((p) => ({
      id: `proj-${p.id}`,
      description: `${p.name} (${p.workType} - ${p.status})`,
      quantity: p.quantity || 1,
      rate: p.clientRate || (p.totalBilling ? p.totalBilling / (p.quantity || 1) : 0),
      amount: p.totalBilling || 0,
    }));
    setItems(newItems);
  };

  const handleSubmit = async (shouldDownloadPdf: boolean = false) => {
    if (!clientId) {
      setErrorMsg('Please select a client.');
      return;
    }
    if (items.length === 0 || items.some((it) => !it.description.trim())) {
      setErrorMsg('Please ensure all invoice items have a valid description.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    // Enforce consistent payment status
    const effectiveStatus: PaymentStatus = mathematicallyDerivedStatus;

    const invoiceData: Invoice = {
      id: existingInvoice?.id || `inv-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      invoiceNumber: invoiceNumber.trim() || `INV-${new Date().getFullYear()}-001`,
      clientId,
      clientName: selectedClient?.name || 'Valued Client',
      clientEmail: selectedClient?.email || '',
      clientPhone: selectedClient?.phone || selectedClient?.whatsapp || '',
      date,
      dueDate,
      items,
      subtotal,
      tax: taxAmount,
      total,
      paidAmount: safePaidAmount,
      dueAmount,
      paymentStatus: effectiveStatus,
      notes,
      createdAt: existingInvoice?.createdAt || new Date().toISOString(),
    };

    try {
      if (existingInvoice?.id) {
        await updateInvoice(existingInvoice.id, invoiceData);
      } else {
        await createInvoice(invoiceData);
      }

      if (shouldDownloadPdf) {
        try {
          generateInvoicePdf(invoiceData, settings);
        } catch (pdfErr) {
          console.error('Invoice saved, but PDF export encountered an issue:', pdfErr);
        }
      }

      if (onSuccess) onSuccess(invoiceData);
      onClose();
    } catch (err: any) {
      console.error('Invoice save failed:', err);
      setErrorMsg(err?.message || 'Failed to save invoice. Please check your network and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full my-8 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {existingInvoice ? 'Edit Invoice' : 'Generate New Invoice'}
              </h2>
              <p className="text-xs text-slate-500">
                Create official billing invoices with tax calculations and instant PDF export.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Top Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Invoice Number *</label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Client *</label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                required
              >
                <option value="">-- Select Client --</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Issue Date *</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          {/* Quick Import Toolbar */}
          {clientId && (
            <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-slate-600 font-medium">
                Client: <strong className="text-slate-900">{selectedClient?.name}</strong>{' '}
                {selectedClient?.email && `• ${selectedClient.email}`}
              </span>
              <button
                type="button"
                onClick={handleImportClientWork}
                className="px-2.5 py-1 text-[11px] font-semibold bg-white border border-slate-200 text-indigo-600 hover:bg-indigo-50 rounded-lg shadow-2xs transition cursor-pointer"
              >
                + Import Client's Deliverables
              </button>
            </div>
          )}

          {/* Line Items Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                Line Items / Deliverables
              </h3>
              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Item
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase text-slate-500">
                  <tr>
                    <th className="p-2.5">Description</th>
                    <th className="p-2.5 w-20 text-center">Qty</th>
                    <th className="p-2.5 w-28 text-right">Rate (₹)</th>
                    <th className="p-2.5 w-28 text-right">Amount (₹)</th>
                    <th className="p-2.5 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item, idx) => (
                    <tr key={item.id || idx}>
                      <td className="p-2">
                        <input
                          type="text"
                          value={item.description}
                          placeholder="e.g. YouTube Video Edit, Reel Deliverable"
                          onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                          required
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) =>
                            handleItemChange(idx, 'quantity', Math.max(1, parseInt(e.target.value) || 1))
                          }
                          className="w-full text-center px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          min="0"
                          value={item.rate}
                          onChange={(e) =>
                            handleItemChange(idx, 'rate', Math.max(0, parseFloat(e.target.value) || 0))
                          }
                          className="w-full text-right px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="p-2 text-right font-bold text-slate-900">
                        ₹{(item.amount || 0).toLocaleString()}
                      </td>
                      <td className="p-2 text-center">
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom Totals & Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Notes & Terms */}
            <div className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Invoice Notes &amp; Payment Terms</label>
                <textarea
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Payment Status</label>
                <select
                  value={paymentStatus}
                  onChange={(e) => handleStatusChange(e.target.value as PaymentStatus)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium cursor-pointer"
                >
                  <option value="Pending">Pending</option>
                  <option value="Partial">Partial</option>
                  <option value="Paid">Paid</option>
                </select>
              </div>
            </div>

            {/* Calculations Breakdown */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-semibold text-slate-900">₹{(Number(subtotal) || 0).toLocaleString()}</span>
              </div>

              <div className="flex items-center justify-between text-slate-600">
                <span className="flex items-center gap-1">
                  Tax / GST (%):
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={taxPercent}
                    onChange={(e) => setTaxPercent(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-16 px-1.5 py-0.5 text-center bg-white border border-slate-200 rounded text-xs ml-1"
                  />
                </span>
                <span className="font-semibold text-slate-900">₹{(Number(taxAmount) || 0).toLocaleString()}</span>
              </div>

              <div className="border-t border-slate-200 pt-2 flex justify-between text-sm font-bold text-slate-900">
                <span>Total Amount:</span>
                <span className="text-indigo-600">₹{(Number(total) || 0).toLocaleString()}</span>
              </div>

              <div className="flex items-center justify-between text-slate-600">
                <span>Amount Paid (₹):</span>
                <input
                  type="number"
                  min="0"
                  max={total}
                  value={paidAmount}
                  onChange={(e) => handlePaidAmountChange(parseFloat(e.target.value) || 0)}
                  className="w-28 text-right px-2 py-1 bg-white border border-slate-200 rounded text-xs"
                />
              </div>

              <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-slate-800">
                <span>Balance Due:</span>
                <span className={dueAmount > 0 ? 'text-rose-600 font-bold' : 'text-emerald-600'}>
                  ₹{(Number(dueAmount) || 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50 rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:bg-slate-200/60 rounded-xl font-medium transition cursor-pointer"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSubmit(true)}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Save &amp; Download PDF</span>
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSubmit(false)}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Saving...' : 'Save Invoice'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
