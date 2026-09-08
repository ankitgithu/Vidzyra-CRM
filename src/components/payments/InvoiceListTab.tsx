import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Search,
  Download,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Trash2,
  Edit3,
  ExternalLink,
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { Invoice } from '../../types';
import { generateInvoicePdf } from '../../utils/pdfGenerator';
import { InvoiceModal } from './InvoiceModal';

export const InvoiceListTab: React.FC = () => {
  const { invoices, clients, settings, deleteInvoice } = useCrm();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedInvoiceForEdit, setSelectedInvoiceForEdit] = useState<Invoice | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);

  const filteredInvoices = invoices.filter((inv) => {
    if (statusFilter !== 'All' && inv.paymentStatus !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchNum = inv.invoiceNumber?.toLowerCase().includes(q);
      const matchClient = inv.clientName?.toLowerCase().includes(q);
      if (!matchNum && !matchClient) return false;
    }
    return true;
  });

  const totalInvoiced = invoices.reduce((acc, inv) => acc + (inv.total || 0), 0);
  const totalPaid = invoices.reduce((acc, inv) => acc + (inv.paidAmount || 0), 0);
  const totalDue = invoices.reduce((acc, inv) => acc + (inv.dueAmount || 0), 0);

  const handleDownload = (inv: Invoice) => {
    generateInvoicePdf(inv, settings);
  };

  const handleConfirmDelete = async () => {
    if (!invoiceToDelete) return;
    try {
      await deleteInvoice(invoiceToDelete.id);
      setInvoiceToDelete(null);
    } catch (err) {
      console.error('Failed to delete invoice:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action & Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <span className="text-[10px] font-bold uppercase text-slate-400">Total Invoiced</span>
          <div className="text-xl font-bold text-slate-900 mt-1">₹{totalInvoiced.toLocaleString()}</div>
          <span className="text-[10px] text-slate-500">{invoices.length} total invoices</span>
        </div>

        <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl shadow-2xs">
          <span className="text-[10px] font-bold uppercase text-emerald-700">Collected Revenue</span>
          <div className="text-xl font-bold text-emerald-700 mt-1">₹{totalPaid.toLocaleString()}</div>
          <span className="text-[10px] text-emerald-600">Settled balances</span>
        </div>

        <div className="p-4 bg-rose-50/50 border border-rose-200 rounded-xl shadow-2xs">
          <span className="text-[10px] font-bold uppercase text-rose-700">Outstanding Balance</span>
          <div className="text-xl font-bold text-rose-700 mt-1">₹{totalDue.toLocaleString()}</div>
          <span className="text-[10px] text-rose-600">Awaiting client payment</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by invoice # or client..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700"
          >
            <option value="All">All Statuses</option>
            <option value="Completed">Paid</option>
            <option value="Partial">Partial</option>
            <option value="Pending">Pending</option>
          </select>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Invoice</span>
        </button>
      </div>

      {/* Invoices Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Invoice #</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Date / Due</th>
                <th className="px-4 py-3 text-right">Total Amount</th>
                <th className="px-4 py-3 text-right">Balance Due</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400 italic">
                    No invoices generated yet. Click "New Invoice" to create your first official client billing document.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-4 py-3 font-bold text-slate-900 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span>{inv.invoiceNumber}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-slate-800 block">{inv.clientName}</span>
                      {inv.clientEmail && <span className="text-[10px] text-slate-400">{inv.clientEmail}</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <div>{inv.date}</div>
                      {inv.dueDate && (
                        <div className="text-[10px] text-slate-400">Due: {inv.dueDate}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-900">
                      ₹{Number(inv.total || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right font-bold">
                      <span className={Number(inv.dueAmount || 0) > 0 ? 'text-rose-600' : 'text-emerald-600'}>
                        ₹{Number(inv.dueAmount || 0).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          inv.paymentStatus === 'Paid'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : inv.paymentStatus === 'Partial'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {inv.paymentStatus || 'Pending'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleDownload(inv)}
                          title="Download PDF"
                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedInvoiceForEdit(inv)}
                          title="Edit Invoice"
                          className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setInvoiceToDelete(inv)}
                          title="Delete Invoice"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {isCreateModalOpen && (
        <InvoiceModal isOpen={true} onClose={() => setIsCreateModalOpen(false)} />
      )}
      {selectedInvoiceForEdit && (
        <InvoiceModal
          isOpen={true}
          existingInvoice={selectedInvoiceForEdit}
          onClose={() => setSelectedInvoiceForEdit(null)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {invoiceToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-sm w-full p-6 space-y-4">
            <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Delete Invoice?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to delete invoice{' '}
                <strong className="text-slate-800">{invoiceToDelete.invoiceNumber}</strong>? This cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setInvoiceToDelete(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Delete Invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
