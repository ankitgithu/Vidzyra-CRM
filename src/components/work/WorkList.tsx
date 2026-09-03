import React, { useState, useMemo } from 'react';
import {
  Briefcase,
  Plus,
  Search,
  Filter,
  ExternalLink,
  Edit2,
  Trash2,
  Link as LinkIcon,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  DollarSign,
  UserCheck,
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { WorkProject, ProjectStatus, WorkType } from '../../types';

interface WorkListProps {
  onOpenWorkDetail: (workId: string) => void;
  onOpenNewWork: () => void;
  onEditWork: (project: WorkProject) => void;
  onEditLinks: (workId: string) => void;
}

export const WorkList: React.FC<WorkListProps> = ({
  onOpenWorkDetail,
  onOpenNewWork,
  onEditWork,
  onEditLinks,
}) => {
  const { projects, clients, editors, deleteProject, settings } = useCrm();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ProjectStatus>('all');
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [editorFilter, setEditorFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Available Work Types
  const availableWorkTypes: string[] = useMemo(() => {
    const defaultTypes = [
      'Video Editing',
      'Designing',
      'Vertical Videos',
      'Reels',
      'YouTube Shorts',
      'Poster',
      'Social Media Post',
      'Website Design',
      'Social Media Marketing',
      'Digital Marketing',
      'Custom',
    ];
    if (settings.workTypes && Array.isArray(settings.workTypes)) {
      return Array.from(new Set([...defaultTypes, ...settings.workTypes]));
    }
    return defaultTypes;
  }, [settings.workTypes]);

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      if (search) {
        const q = search.toLowerCase();
        const clientName = clients.find((c) => c.id === p.clientId)?.name.toLowerCase() || '';
        const editorName = editors.find((e) => e.id === p.assignedTo)?.name.toLowerCase() || '';
        const matches =
          p.name.toLowerCase().includes(q) ||
          clientName.includes(q) ||
          editorName.includes(q) ||
          p.workType.toLowerCase().includes(q) ||
          (p.notes && p.notes.toLowerCase().includes(q));
        if (!matches) return false;
      }
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (clientFilter !== 'all' && p.clientId !== clientFilter) return false;
      if (editorFilter !== 'all') {
        if (editorFilter === 'self') {
          if (p.workDoneBy === 'Assigned' && p.assignedTo) return false;
        } else {
          if (p.assignedTo !== editorFilter) return false;
        }
      }
      if (typeFilter !== 'all' && p.workType !== typeFilter) return false;
      return true;
    });
  }, [projects, clients, editors, search, statusFilter, clientFilter, editorFilter, typeFilter]);

  const totalBilling = filteredProjects.reduce((acc, p) => acc + (p.totalBilling || 0), 0);
  const totalCost = filteredProjects.reduce((acc, p) => {
    if (p.workDoneBy === 'Assigned' && p.assignedTo) {
      return acc + (p.quantity * (p.editorRate || 0));
    }
    return acc;
  }, 0);
  const totalProfit = totalBilling - totalCost;

  const handleDelete = (id: string) => {
    deleteProject(id);
    setDeleteConfirmId(null);
  };

  return (
    <div className="space-y-6 p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Work &amp; Deliverables</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage client deliverables, assignment pipelines, four cloud links, and profit margins.
          </p>
        </div>
        <button
          id="btn-add-work-page"
          onClick={onOpenNewWork}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Work / Project
        </button>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase text-slate-400">Total Projects</span>
          <div className="text-xl font-bold text-slate-900 mt-1">{filteredProjects.length}</div>
          <span className="text-[11px] text-slate-500">In current filter view</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-indigo-200 shadow-2xs bg-indigo-50/20">
          <span className="text-[10px] font-bold uppercase text-indigo-700">Deliverable Billing</span>
          <div className="text-xl font-bold text-indigo-900 mt-1">₹{totalBilling.toLocaleString()}</div>
          <span className="text-[11px] text-indigo-600">Client billable total</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-purple-200 shadow-2xs bg-purple-50/20">
          <span className="text-[10px] font-bold uppercase text-purple-700">Editor Cost</span>
          <div className="text-xl font-bold text-purple-900 mt-1">₹{totalCost.toLocaleString()}</div>
          <span className="text-[11px] text-purple-600">Payout commitment</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-2xs bg-emerald-50/20">
          <span className="text-[10px] font-bold uppercase text-emerald-700">Net Agency Profit</span>
          <div className="text-xl font-bold text-emerald-700 mt-1">₹{totalProfit.toLocaleString()}</div>
          <span className="text-[11px] text-emerald-600">
            {totalBilling > 0 ? Math.round((totalProfit / totalBilling) * 100) : 0}% net margin
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-2xs bg-amber-50/20 col-span-2 sm:col-span-1">
          <span className="text-[10px] font-bold uppercase text-amber-700">Active In Pipeline</span>
          <div className="text-xl font-bold text-amber-700 mt-1">
            {filteredProjects.filter((p) => p.status === 'In Progress' || p.status === 'Revision Required' || p.status === 'Assigned').length}
          </div>
          <span className="text-[11px] text-amber-600">Pending or in-edit</span>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="work-search-input"
            type="text"
            placeholder="Search deliverables, clients, editors, notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto text-xs">
          {/* Status Filter */}
          <select
            id="work-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Assigned">Assigned</option>
            <option value="In Progress">In Progress</option>
            <option value="Revision Required">Revision Required</option>
            <option value="Completed">Completed</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          {/* Client Filter */}
          <select
            id="work-client-filter"
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 max-w-[150px] truncate cursor-pointer"
          >
            <option value="all">All Clients</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Editor Filter */}
          <select
            id="work-editor-filter"
            value={editorFilter}
            onChange={(e) => setEditorFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 max-w-[150px] truncate cursor-pointer"
          >
            <option value="all">All Editors</option>
            <option value="self">In-House / Self</option>
            {editors.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>

          {/* Work Type Filter */}
          <select
            id="work-type-filter"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 cursor-pointer"
          >
            <option value="all">All Work Types</option>
            {availableWorkTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Projects Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">Deliverable</th>
                <th className="px-3 py-3">Client</th>
                <th className="px-3 py-3">Work Type</th>
                <th className="px-2 py-3 text-center">Qty</th>
                <th className="px-3 py-3 text-right">Client Rate</th>
                <th className="px-3 py-3 text-right">Total Billing</th>
                <th className="px-3 py-3">Assigned / Done By</th>
                <th className="px-3 py-3 text-right">Editor Rate</th>
                <th className="px-3 py-3 text-center">Status</th>
                <th className="px-3 py-3 text-center">Due Date</th>
                <th className="px-3 py-3 text-center">Four Links</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-4 py-12 text-center text-slate-400 italic">
                    No deliverables found matching your search and filter criteria.
                  </td>
                </tr>
              ) : (
                filteredProjects.map((p) => {
                  const client = clients.find((c) => c.id === p.clientId);
                  const editor = editors.find((e) => e.id === p.assignedTo);
                  const isAssigned = p.workDoneBy === 'Assigned' && p.assignedTo;
                  const itemCost = isAssigned ? p.quantity * (p.editorRate || 0) : 0;
                  const itemProfit = p.totalBilling - itemCost;
                  const linksConfiguredCount = [
                    p.userDownloadLink,
                    p.userUploadLink,
                    p.clientDownloadLink,
                    p.clientUploadLink,
                  ].filter(Boolean).length;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition group">
                      {/* Name & Notes */}
                      <td className="px-4 py-3.5">
                        <button
                          onClick={() => onOpenWorkDetail(p.id)}
                          className="font-bold text-slate-900 hover:text-indigo-600 transition text-left block max-w-xs truncate cursor-pointer"
                        >
                          {p.name}
                        </button>
                        {p.notes ? (
                          <span className="text-[10px] text-slate-500 block truncate max-w-xs">
                            {p.notes}
                          </span>
                        ) : null}
                      </td>

                      {/* Client */}
                      <td className="px-3 py-3.5 font-medium text-slate-800 whitespace-nowrap">
                        {client?.name || '—'}
                      </td>

                      {/* Work Type */}
                      <td className="px-3 py-3.5 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {p.workType}
                        </span>
                      </td>

                      {/* Quantity */}
                      <td className="px-2 py-3.5 text-center font-bold text-slate-800">
                        {p.quantity}
                      </td>

                      {/* Client Rate */}
                      <td className="px-3 py-3.5 text-right font-medium text-slate-600 whitespace-nowrap">
                        ₹{(p.clientRate || 0).toLocaleString()}
                      </td>

                      {/* Total Billing */}
                      <td className="px-3 py-3.5 text-right font-bold text-slate-900 whitespace-nowrap">
                        ₹{(p.totalBilling || 0).toLocaleString()}
                      </td>

                      {/* Work Done By / Assigned Editor */}
                      <td className="px-3 py-3.5 whitespace-nowrap">
                        {!isAssigned ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                            In-House (Self)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                            {editor?.name || 'Assigned Editor'}
                          </span>
                        )}
                      </td>

                      {/* Editor Rate */}
                      <td className="px-3 py-3.5 text-right font-medium text-slate-600 whitespace-nowrap">
                        {isAssigned ? `₹${(p.editorRate || 0).toLocaleString()}` : '—'}
                      </td>

                      {/* Status */}
                      <td className="px-3 py-3.5 text-center whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            p.status === 'Completed' || p.status === 'Delivered'
                              ? 'bg-emerald-100 text-emerald-800'
                              : p.status === 'In Progress'
                              ? 'bg-amber-100 text-amber-800'
                              : p.status === 'Revision Required'
                              ? 'bg-rose-100 text-rose-800'
                              : p.status === 'Assigned'
                              ? 'bg-purple-100 text-purple-800'
                              : p.status === 'Cancelled'
                              ? 'bg-slate-200 text-slate-700'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>

                      {/* Due Date */}
                      <td className="px-3 py-3.5 text-center whitespace-nowrap text-slate-600 text-[11px]">
                        {p.dueDate || '—'}
                      </td>

                      {/* Four Links */}
                      <td className="px-3 py-3.5 text-center whitespace-nowrap">
                        <button
                          onClick={() => onEditLinks(p.id)}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold transition cursor-pointer ${
                            linksConfiguredCount === 4
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                              : linksConfiguredCount > 0
                              ? 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                          }`}
                          title="Click to configure or view 4-link URLs"
                        >
                          <LinkIcon className="w-3 h-3" />
                          {linksConfiguredCount}/4 Links
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right whitespace-nowrap space-x-1">
                        <button
                          onClick={() => onEditWork(p)}
                          className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition cursor-pointer"
                          title="Edit Project"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onOpenWorkDetail(p.id)}
                          className="px-2 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 rounded text-[11px] font-semibold transition cursor-pointer"
                          title="View Details"
                        >
                          View
                        </button>
                        {deleteConfirmId === p.id ? (
                          <span className="inline-flex items-center gap-1 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                            <span className="text-[10px] text-rose-700 font-bold">Delete?</span>
                            <button
                              onClick={() => handleDelete(p.id)}
                              className="text-[10px] text-rose-700 font-bold hover:underline cursor-pointer"
                            >
                              Yes
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="text-[10px] text-slate-500 hover:underline cursor-pointer"
                            >
                              No
                            </button>
                          </span>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirmId(p.id)}
                            className="p-1 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                            title="Delete Deliverable"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
