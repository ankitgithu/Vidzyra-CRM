import React, { useState, useMemo } from 'react';
import {
  Briefcase,
  Plus,
  Search,
  Filter,
  Calendar,
  Clock,
  AlertTriangle,
  Folder,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  MessageSquare,
  UserCheck,
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { WorkProject, ProjectStatus, ProjectPriority } from '../../types';
import { getDeadlineInfo } from '../../utils/deadlines';
import { getProjectDriveFolderUrl } from '../../utils/driveUtils';

interface KanbanBoardProps {
  onOpenWorkDetail: (workId: string) => void;
  onOpenNewWork: () => void;
  onEditWork: (project: WorkProject) => void;
  onEditLinks: (workId: string) => void;
}

const COLUMNS: { id: ProjectStatus; label: string; color: string; badgeBg: string }[] = [
  { id: 'Pending', label: 'Pending', color: 'border-slate-300 text-slate-700', badgeBg: 'bg-slate-100 text-slate-700' },
  { id: 'Assigned', label: 'Assigned', color: 'border-purple-300 text-purple-700', badgeBg: 'bg-purple-100 text-purple-800' },
  { id: 'In Progress', label: 'In Progress', color: 'border-amber-300 text-amber-700', badgeBg: 'bg-amber-100 text-amber-800' },
  { id: 'Revision Required', label: 'Revision', color: 'border-rose-300 text-rose-700', badgeBg: 'bg-rose-100 text-rose-800' },
  { id: 'Completed', label: 'Completed / Delivered', color: 'border-emerald-300 text-emerald-700', badgeBg: 'bg-emerald-100 text-emerald-800' },
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  onOpenWorkDetail,
  onOpenNewWork,
  onEditWork,
  onEditLinks,
}) => {
  const { projects, clients, editors, updateWorkStatus, settings } = useCrm();

  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<'all' | ProjectPriority>('all');
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [editorFilter, setEditorFilter] = useState<string>('all');

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      if (search) {
        const q = search.toLowerCase();
        const client = clients.find((c) => c.id === p.clientId);
        const editor = editors.find((e) => e.id === (p.assignedTo || p.editorId));
        const matches =
          p.name.toLowerCase().includes(q) ||
          (client && client.name.toLowerCase().includes(q)) ||
          (editor && editor.name.toLowerCase().includes(q)) ||
          p.workType.toLowerCase().includes(q);
        if (!matches) return false;
      }
      if (priorityFilter !== 'all' && (p.priority || 'Medium') !== priorityFilter) return false;
      if (clientFilter !== 'all' && p.clientId !== clientFilter) return false;
      if (editorFilter !== 'all') {
        const pEditorId = p.assignedTo || p.editorId;
        if (pEditorId !== editorFilter) return false;
      }
      return true;
    });
  }, [projects, clients, editors, search, priorityFilter, clientFilter, editorFilter]);

  const projectsByStatus = useMemo(() => {
    const map: Record<string, WorkProject[]> = {
      Pending: [],
      Assigned: [],
      'In Progress': [],
      'Revision Required': [],
      Completed: [],
    };

    filteredProjects.forEach((p) => {
      if (p.status === 'Delivered' || p.status === 'Approved' || p.status === 'Completed') {
        map.Completed.push(p);
      } else if (map[p.status]) {
        map[p.status].push(p);
      } else {
        map.Pending.push(p);
      }
    });

    return map;
  }, [filteredProjects]);

  const handleMoveStatus = (project: WorkProject, direction: 'prev' | 'next') => {
    const order: ProjectStatus[] = ['Pending', 'Assigned', 'In Progress', 'Revision Required', 'Completed'];
    let currentIdx = order.indexOf(project.status as ProjectStatus);
    if (project.status === 'Delivered' || project.status === 'Approved') {
      currentIdx = 4;
    }
    if (currentIdx === -1) currentIdx = 0;

    const newIdx = direction === 'next' ? currentIdx + 1 : currentIdx - 1;
    if (newIdx >= 0 && newIdx < order.length) {
      updateWorkStatus(project.id, order[newIdx]);
    }
  };

  const currency = settings.currencySymbol || '₹';

  return (
    <div className="space-y-4">
      {/* Search & Filter Toolbar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          <div className="relative flex-1 min-w-[160px] max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search deliverables in board..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as any)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 cursor-pointer"
          >
            <option value="all">All Priorities</option>
            <option value="Urgent">Urgent 🔥</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          <select
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 cursor-pointer max-w-[160px] truncate"
          >
            <option value="all">All Clients</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={editorFilter}
            onChange={(e) => setEditorFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 cursor-pointer max-w-[160px] truncate"
          >
            <option value="all">All Editors</option>
            {editors.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={onOpenNewWork}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-xs transition cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Deliverable</span>
        </button>
      </div>

      {/* Kanban 5-Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3.5 items-start">
        {COLUMNS.map((col, colIdx) => {
          const columnProjects = projectsByStatus[col.id] || [];
          return (
            <div
              key={col.id}
              className="bg-slate-50/70 border border-slate-200 rounded-xl p-2.5 flex flex-col min-h-[500px]"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200 px-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-800 text-xs">{col.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${col.badgeBg}`}>
                    {columnProjects.length}
                  </span>
                </div>
              </div>

              {/* Cards Container */}
              <div className="space-y-2.5 flex-1 overflow-y-auto">
                {columnProjects.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-[11px] italic">
                    No deliverables
                  </div>
                ) : (
                  columnProjects.map((p) => {
                    const client = clients.find((c) => c.id === p.clientId);
                    const editorId = p.assignedTo || p.editorId;
                    const editor = editors.find((e) => e.id === editorId);
                    const deadline = getDeadlineInfo(p);
                    const driveFolder = getProjectDriveFolderUrl(p);

                    return (
                      <div
                        key={p.id}
                        className={`bg-white rounded-lg border p-3 shadow-xs hover:shadow-md transition group text-xs ${
                          deadline.isOverdue
                            ? 'border-rose-300 bg-rose-50/20'
                            : deadline.isDueToday
                            ? 'border-amber-300 bg-amber-50/20'
                            : 'border-slate-200'
                        }`}
                      >
                        {/* Priority & Deadline Badges */}
                        <div className="flex items-center justify-between gap-1.5 mb-1.5">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                              p.priority === 'Urgent'
                                ? 'bg-rose-100 text-rose-800'
                                : p.priority === 'High'
                                ? 'bg-orange-100 text-orange-800'
                                : p.priority === 'Low'
                                ? 'bg-slate-100 text-slate-600'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {p.priority || 'Medium'}
                          </span>

                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold inline-flex items-center gap-0.5 ${deadline.badgeClass}`}
                          >
                            {deadline.isOverdue && <AlertTriangle className="w-2.5 h-2.5" />}
                            {deadline.isDueToday && <Clock className="w-2.5 h-2.5" />}
                            {deadline.isCompleted && <CheckCircle2 className="w-2.5 h-2.5" />}
                            {deadline.text}
                          </span>
                        </div>

                        {/* Title */}
                        <h4
                          onClick={() => onOpenWorkDetail(p.id)}
                          className="font-bold text-slate-900 hover:text-indigo-600 transition cursor-pointer line-clamp-2 mb-1"
                        >
                          {p.name}
                        </h4>

                        {/* Client & Type */}
                        <div className="text-[11px] text-slate-500 mb-2 flex items-center justify-between">
                          <span className="font-medium text-slate-700 truncate max-w-[120px]">
                            {client?.name || 'No Client'}
                          </span>
                          <span className="text-[10px] text-slate-400 truncate">{p.workType}</span>
                        </div>

                        {/* Editor & Billing Info */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                          <div className="flex items-center gap-1">
                            {editor ? (
                              <span
                                className="inline-flex items-center gap-1 text-[10px] font-medium text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded"
                                title={`Editor: ${editor.name} (${editor.availability || 'Available'})`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    editor.availability === 'Busy'
                                      ? 'bg-amber-500'
                                      : editor.availability === 'Away'
                                      ? 'bg-orange-500'
                                      : editor.availability === 'Offline'
                                      ? 'bg-slate-400'
                                      : 'bg-emerald-500'
                                  }`}
                                />
                                {editor.name.split(' ')[0]}
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400">Self</span>
                            )}
                          </div>

                          <span className="font-bold text-slate-800">
                            {currency}{(p.totalBilling || 0).toLocaleString()}
                          </span>
                        </div>

                        {/* Card Actions (Stage Advance & Links) */}
                        <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            {driveFolder && (
                              <a
                                href={driveFolder}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1 text-indigo-600 hover:bg-indigo-50 rounded"
                                title="Open Drive Folder"
                              >
                                <Folder className="w-3.5 h-3.5" />
                              </a>
                            )}
                            <button
                              onClick={() => onOpenWorkDetail(p.id)}
                              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded"
                              title="Deliverable Details"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="flex items-center gap-1">
                            {colIdx > 0 && (
                              <button
                                onClick={() => handleMoveStatus(p, 'prev')}
                                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded cursor-pointer"
                                title="Move to previous stage"
                              >
                                <ArrowLeft className="w-3 h-3" />
                              </button>
                            )}
                            {colIdx < COLUMNS.length - 1 && (
                              <button
                                onClick={() => handleMoveStatus(p, 'next')}
                                className="p-1 text-indigo-600 hover:bg-indigo-50 rounded font-bold cursor-pointer"
                                title="Move to next stage"
                              >
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
