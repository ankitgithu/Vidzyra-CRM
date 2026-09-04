import React, { useState, useEffect, useMemo } from 'react';
import {
  MessageSquare,
  Search,
  Filter,
  Lock,
  Ban,
  CheckCircle2,
  Trash2,
  ExternalLink,
  ShieldAlert,
  Clock,
  User,
  Film,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { WorkProject, ChatMessage } from '../../types';
import * as firestoreService from '../../services/firestoreService';
import { ProjectChatModal } from './ProjectChatModal';

export const ProjectChatManager: React.FC = () => {
  const {
    projects,
    clients,
    editors,
    clearProjectChat,
    toggleProjectChatDisabled,
  } = useCrm();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'closed'>('all');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [chatCounts, setChatCounts] = useState<Record<string, number>>({});
  const [clearingProjectId, setClearingProjectId] = useState<string | null>(null);

  // Subscribe to all chat messages to display count badges across projects
  useEffect(() => {
    const unsubscribe = firestoreService.subscribeAllChatMessages(
      (allMsgs) => {
        const counts: Record<string, number> = {};
        allMsgs.forEach((msg) => {
          counts[msg.projectId] = (counts[msg.projectId] || 0) + 1;
        });
        setChatCounts(counts);
      },
      (err) => {
        console.error('Failed to load chat message counts:', err);
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  // Filter projects
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const client = clients.find((c) => c.id === p.clientId);
      const editor = editors.find((e) => e.id === p.assignedTo);

      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.workType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (client?.name && client.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (editor?.name && editor.name.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      const isApproved = p.status === 'Approved' || p.reviewStatus === 'Approved';
      const isDisabled = Boolean(p.chatDisabled);
      const isNoEditor = !p.assignedTo || p.workDoneBy === 'Self';
      const isClosed = isApproved || isDisabled || isNoEditor;

      if (statusFilter === 'active') return !isClosed;
      if (statusFilter === 'closed') return isClosed;
      return true;
    });
  }, [projects, clients, editors, searchQuery, statusFilter]);

  const activeCount = useMemo(() => {
    return projects.filter((p) => {
      const isApproved = p.status === 'Approved' || p.reviewStatus === 'Approved';
      const isDisabled = Boolean(p.chatDisabled);
      const isNoEditor = !p.assignedTo || p.workDoneBy === 'Self';
      return !isApproved && !isDisabled && !isNoEditor;
    }).length;
  }, [projects]);

  const closedCount = projects.length - activeCount;

  const handleClearChat = async (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete all chat messages for this project? This cannot be undone.')) {
      return;
    }
    setClearingProjectId(projectId);
    try {
      await clearProjectChat(projectId);
    } catch (err) {
      console.error('Failed to clear chat:', err);
    } finally {
      setClearingProjectId(null);
    }
  };

  const handleToggleDisabled = async (p: WorkProject, e: React.MouseEvent) => {
    e.stopPropagation();
    await toggleProjectChatDisabled(p.id, !p.chatDisabled);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-indigo-600" />
            Client–Editor Chat Monitor
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Oversee project-scoped communication between clients and assigned editors. Content moderation is enforced in real-time.
          </p>
        </div>

        {/* Status Metrics Cards */}
        <div className="flex items-center gap-2">
          <div className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-2xs text-center">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
              Active Chats
            </span>
            <span className="text-sm font-bold text-emerald-600">{activeCount}</span>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-2xs text-center">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
              Closed Chats
            </span>
            <span className="text-sm font-bold text-slate-600">{closedCount}</span>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-2xs text-center">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
              Total Projects
            </span>
            <span className="text-sm font-bold text-slate-900">{projects.length}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search project, client, or editor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
          />
        </div>

        <div className="flex items-center space-x-1.5 w-full sm:w-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All ({projects.length})
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
              statusFilter === 'active'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Active ({activeCount})
          </button>
          <button
            onClick={() => setStatusFilter('closed')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
              statusFilter === 'closed'
                ? 'bg-slate-800 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Closed ({closedCount})
          </button>
        </div>
      </div>

      {/* Projects Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Project &amp; Deliverable</th>
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4">Assigned Editor</th>
                <th className="py-3 px-4">Chat Status</th>
                <th className="py-3 px-4">Messages</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600">No project chats found</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Adjust your search or filter criteria.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredProjects.map((p) => {
                  const client = clients.find((c) => c.id === p.clientId);
                  const editor = editors.find((e) => e.id === p.assignedTo);
                  const count = chatCounts[p.id] || 0;

                  const isApproved = p.status === 'Approved' || p.reviewStatus === 'Approved';
                  const isDisabled = Boolean(p.chatDisabled);
                  const isNoEditor = !p.assignedTo || p.workDoneBy === 'Self';

                  return (
                    <tr
                      key={p.id}
                      onClick={() => setSelectedProjectId(p.id)}
                      className="hover:bg-slate-50/80 transition cursor-pointer group"
                    >
                      <td className="py-3.5 px-4 font-medium text-slate-900">
                        <div className="flex items-center space-x-2">
                          <Film className="w-4 h-4 text-slate-400 shrink-0" />
                          <div>
                            <span className="font-semibold text-slate-900 block truncate max-w-xs">
                              {p.name}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {p.workType} • Due: {p.dueDate || 'N/A'}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-700 font-medium">
                        {client?.name || 'Unassigned Client'}
                      </td>

                      <td className="py-3.5 px-4">
                        {editor ? (
                          <span className="text-slate-800 font-medium">{editor.name}</span>
                        ) : (
                          <span className="text-slate-400 italic">No Editor Assigned</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {isApproved ? (
                          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            <Lock className="w-3 h-3 text-slate-500" />
                            Closed (Approved)
                          </span>
                        ) : isDisabled ? (
                          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            <Ban className="w-3 h-3 text-amber-600" />
                            Disabled by Admin
                          </span>
                        ) : isNoEditor ? (
                          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-500 border border-slate-200">
                            Unassigned
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            Active
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold ${
                            count > 0
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                              : 'text-slate-400 bg-slate-100'
                          }`}
                        >
                          {count} {count === 1 ? 'msg' : 'msgs'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            id={`btn-open-chat-${p.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedProjectId(p.id);
                            }}
                            className="px-2.5 py-1 text-[11px] font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition cursor-pointer flex items-center gap-1"
                          >
                            <MessageSquare className="w-3 h-3" />
                            Open Chat
                          </button>

                          <button
                            onClick={(e) => handleToggleDisabled(p, e)}
                            className={`px-2 py-1 text-[11px] font-semibold rounded-lg border transition cursor-pointer ${
                              p.chatDisabled
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                            }`}
                            title={p.chatDisabled ? 'Enable chat' : 'Disable chat'}
                          >
                            {p.chatDisabled ? 'Enable' : 'Disable'}
                          </button>

                          {count > 0 && (
                            <button
                              onClick={(e) => handleClearChat(p.id, e)}
                              disabled={clearingProjectId === p.id}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer disabled:opacity-40"
                              title="Clear all messages for this project"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Active Modal */}
      {selectedProjectId && (
        <ProjectChatModal
          isOpen={Boolean(selectedProjectId)}
          onClose={() => setSelectedProjectId(null)}
          projectId={selectedProjectId}
          currentRole="admin"
          currentUserId="admin"
          currentUserName="Administrator"
        />
      )}
    </div>
  );
};
