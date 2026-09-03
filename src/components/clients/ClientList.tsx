import React, { useState, useMemo } from 'react';
import {
  Users,
  Plus,
  Search,
  Filter,
  Share2,
  ExternalLink,
  Edit2,
  Trash2,
  Power,
  ChevronRight,
  CreditCard,
  Briefcase,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  X,
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { Client, ClientType, PortalStatus } from '../../types';

interface ClientListProps {
  onOpenClientDetail: (clientId: string) => void;
  onOpenNewClient: () => void;
  onEditClient: (client: Client) => void;
  onSharePortal: (clientId: string) => void;
  onAddWorkForClient: (clientId: string) => void;
  onAddPaymentForClient: (clientId: string) => void;
  onOpenEditLink: (workId: string) => void;
}

export const ClientList: React.FC<ClientListProps> = ({
  onOpenClientDetail,
  onOpenNewClient,
  onEditClient,
  onSharePortal,
  onAddWorkForClient,
  onAddPaymentForClient,
}) => {
  const { clients, getClientStats, deleteClient, projects } = useCrm();

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | ClientType>('all');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'Paid' | 'Partial' | 'Pending'>('all');
  const [portalFilter, setPortalFilter] = useState<'all' | PortalStatus>('all');
  const [deleteConfirmClient, setDeleteConfirmClient] = useState<Client | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => {
      setSuccessToast(null);
    }, 2800);
  };

  const clientRows = useMemo(() => {
    return clients.map((c) => {
      const stats = getClientStats(c.id);
      return {
        client: c,
        stats,
      };
    });
  }, [clients, getClientStats]);

  const filteredClients = useMemo(() => {
    return clientRows.filter(({ client, stats }) => {
      if (search) {
        const q = search.toLowerCase();
        const matches =
          client.name.toLowerCase().includes(q) ||
          client.email.toLowerCase().includes(q) ||
          client.phone.includes(q);
        if (!matches) return false;
      }
      if (typeFilter !== 'all' && client.clientType !== typeFilter) return false;
      if (paymentFilter !== 'all' && stats.paymentStatus !== paymentFilter) return false;
      if (portalFilter !== 'all' && client.portalStatus !== portalFilter) return false;
      return true;
    });
  }, [clientRows, search, typeFilter, paymentFilter, portalFilter]);

  const handleConfirmDelete = () => {
    if (!deleteConfirmClient) return;
    deleteClient(deleteConfirmClient.id);
    setDeleteConfirmClient(null);
    showToast('Client deleted successfully.');
  };

  return (
    <div className="space-y-6 p-6 lg:p-8 max-w-7xl mx-auto relative">
      {/* Success Toast */}
      {successToast && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-700 text-white text-xs font-semibold py-2.5 px-4 rounded-xl shadow-lg flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            {successToast}
          </span>
          <button onClick={() => setSuccessToast(null)} className="text-white/80 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
      {/* Top Title & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Client Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage agency clients, monitor billing, track payments &amp; configure client portals.
          </p>
        </div>
        <button
          id="btn-add-client-page"
          onClick={onOpenNewClient}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Client
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by client name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto text-xs">
          {/* Client Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
          >
            <option value="all">All Types</option>
            <option value="Regular">Regular Clients</option>
            <option value="Work">Work Clients</option>
          </select>

          {/* Payment Status Filter */}
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value as any)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
          >
            <option value="all">All Payment Statuses</option>
            <option value="Paid">Fully Paid</option>
            <option value="Partial">Partial Paid</option>
            <option value="Pending">Payment Pending</option>
          </select>

          {/* Portal Status Filter */}
          <select
            value={portalFilter}
            onChange={(e) => setPortalFilter(e.target.value as any)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
          >
            <option value="all">All Portal Statuses</option>
            <option value="Active">Active Portal</option>
            <option value="Inactive">Inactive Portal</option>
            <option value="Deleted">Deleted Portal</option>
          </select>
        </div>
      </div>

      {/* Clients Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">Client Name</th>
                <th className="px-3 py-3">Type</th>
                <th className="px-3 py-3 text-center">Total Work</th>
                <th className="px-3 py-3 text-center">Completed</th>
                <th className="px-3 py-3 text-center">Pending</th>
                <th className="px-3 py-3 text-right">Billing</th>
                <th className="px-3 py-3 text-right">Paid</th>
                <th className="px-3 py-3 text-right">Remaining</th>
                <th className="px-3 py-3 text-center">Payment Status</th>
                <th className="px-3 py-3 text-center">Portal</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-12 text-center text-slate-400 italic">
                    No clients found matching the search and filter criteria.
                  </td>
                </tr>
              ) : (
                filteredClients.map(({ client, stats }) => (
                  <tr key={client.id} className="hover:bg-slate-50/80 transition group">
                    {/* Client Name */}
                    <td className="px-4 py-3.5">
                      <button
                        onClick={() => onOpenClientDetail(client.id)}
                        className="font-bold text-slate-900 hover:text-indigo-600 transition text-left block"
                      >
                        {client.name}
                      </button>
                      <span className="text-[10px] text-slate-400 block">{client.phone || client.email}</span>
                    </td>

                    {/* Client Type */}
                    <td className="px-3 py-3.5 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          client.clientType === 'Regular'
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {client.clientType}
                      </span>
                    </td>

                    {/* Total Work */}
                    <td className="px-3 py-3.5 text-center font-semibold text-slate-800">
                      {stats.totalWork}
                    </td>

                    {/* Completed */}
                    <td className="px-3 py-3.5 text-center font-semibold text-emerald-600">
                      {stats.completed}
                    </td>

                    {/* Pending */}
                    <td className="px-3 py-3.5 text-center font-semibold text-amber-600">
                      {stats.pending}
                    </td>

                    {/* Total Billing */}
                    <td className="px-3 py-3.5 text-right font-bold text-slate-900 whitespace-nowrap">
                      ₹{stats.totalBilling.toLocaleString()}
                    </td>

                    {/* Total Paid */}
                    <td className="px-3 py-3.5 text-right font-bold text-emerald-600 whitespace-nowrap">
                      ₹{stats.totalPaid.toLocaleString()}
                    </td>

                    {/* Remaining */}
                    <td className="px-3 py-3.5 text-right font-bold text-rose-600 whitespace-nowrap">
                      ₹{stats.remaining.toLocaleString()}
                    </td>

                    {/* Payment Status (Click to open payment details!) */}
                    <td className="px-3 py-3.5 text-center whitespace-nowrap">
                      <button
                        onClick={() => onOpenClientDetail(client.id)}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition hover:opacity-80 ${
                          stats.paymentStatus === 'Paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : stats.paymentStatus === 'Partial'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                        title="Click to view payment ledger"
                      >
                        {stats.paymentStatus}
                      </button>
                    </td>

                    {/* Portal Status */}
                    <td className="px-3 py-3.5 text-center whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          client.portalStatus === 'Active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : client.portalStatus === 'Inactive'
                            ? 'bg-slate-100 text-slate-500 border border-slate-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {client.portalStatus}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5 text-right whitespace-nowrap space-x-1">
                      {/* Share Button */}
                      <button
                        id={`btn-share-client-${client.id}`}
                        onClick={() => onSharePortal(client.id)}
                        className="p-1 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded transition"
                        title="Share Portal Link"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete Button (Directly beside Share Link) */}
                      <button
                        id={`btn-delete-client-${client.id}`}
                        onClick={() => setDeleteConfirmClient(client)}
                        className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded transition"
                        title="Delete Client"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Edit Details */}
                      <button
                        onClick={() => onEditClient(client)}
                        className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition"
                        title="Edit Client"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Quick Portal Switch */}
                      <button
                        onClick={() => onOpenClientDetail(client.id)}
                        className="px-2 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 rounded text-[11px] font-semibold transition"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Client Confirmation Modal */}
      {deleteConfirmClient && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-100">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Client?</h3>
                <p className="text-xs text-slate-500 truncate max-w-[200px]">
                  {deleteConfirmClient.name}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-6">
              Are you sure you want to delete this client? This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteConfirmClient(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                id="btn-confirm-delete-client"
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition shadow-xs"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
