import React, { useState, useMemo } from 'react';
import {
  Clock,
  AlertCircle,
  CheckCircle2,
  FolderDown,
  FolderUp,
  MessageSquare,
  Play,
  RotateCcw,
  Sparkles,
  ChevronRight,
  ArrowUpDown,
  Filter,
  Flame,
  Check,
  Calendar,
  Layers,
  FileVideo,
} from 'lucide-react';
import { WorkProject, ProjectStatus } from '../../types';
import { getDeadlineInfo } from '../../utils/deadlines';
import { getProjectDriveFolderUrl } from '../../utils/driveUtils';

interface EditorWorkQueueProps {
  projects: WorkProject[];
  editorId: string;
  editorName: string;
  onUpdateStatus: (projectId: string, status: ProjectStatus) => void;
  onSubmitCompletion: (projectId: string) => void;
  onOpenUploadModal: (projectId: string) => void;
  onOpenChat: (projectId: string) => void;
}

type QueueSortOption = 'urgency' | 'deadline' | 'newest' | 'revisions';

export const EditorWorkQueue: React.FC<EditorWorkQueueProps> = ({
  projects,
  editorId,
  editorName,
  onUpdateStatus,
  onSubmitCompletion,
  onOpenUploadModal,
  onOpenChat,
}) => {
  const [sortOption, setSortOption] = useState<QueueSortOption>('urgency');
  const [filterStatus, setFilterStatus] = useState<string>('active');

  // Filter projects for active queue
  const activeQueueProjects = useMemo(() => {
    return projects.filter((p) => {
      const isFinished = p.status === 'Completed' || p.status === 'Delivered' || p.status === 'Cancelled';
      if (filterStatus === 'active') return !isFinished;
      if (filterStatus === 'completed') return isFinished;
      if (filterStatus === 'revisions') return p.status === 'Revision Required';
      return true;
    });
  }, [projects, filterStatus]);

  // Sort queue
  const sortedQueue = useMemo(() => {
    const list = [...activeQueueProjects];

    return list.sort((a, b) => {
      const deadA = getDeadlineInfo(a);
      const deadB = getDeadlineInfo(b);

      if (sortOption === 'urgency') {
        // High priority: Revisions > Overdue > Due Today > In Progress > Assigned/Pending
        const getPriorityScore = (p: WorkProject, d: typeof deadA) => {
          if (p.status === 'Revision Required') return 100;
          if (d.isOverdue) return 90;
          if (d.isDueToday) return 80;
          if (p.status === 'In Progress') return 60;
          if (p.status === 'Assigned') return 40;
          return 10;
        };
        const scoreA = getPriorityScore(a, deadA);
        const scoreB = getPriorityScore(b, deadB);
        if (scoreB !== scoreA) return scoreB - scoreA;
        // Secondary: deadline ascending
        const dateA = a.deadline || a.dueDate;
        const dateB = b.deadline || b.dueDate;
        if (dateA && dateB) return dateA.localeCompare(dateB);
        return 0;
      }

      if (sortOption === 'deadline') {
        const dateA = a.deadline || a.dueDate;
        const dateB = b.deadline || b.dueDate;
        if (!dateA) return 1;
        if (!dateB) return -1;
        return dateA.localeCompare(dateB);
      }

      if (sortOption === 'newest') {
        return (b.createdAt || '').localeCompare(a.createdAt || '');
      }

      if (sortOption === 'revisions') {
        return (b.revisionCount || 0) - (a.revisionCount || 0);
      }

      return 0;
    });
  }, [activeQueueProjects, sortOption]);

  const activeCount = projects.filter((p) => p.status !== 'Completed' && p.status !== 'Delivered').length;
  const overdueCount = projects.filter((p) => getDeadlineInfo(p).isOverdue).length;
  const revisionsCount = projects.filter((p) => p.status === 'Revision Required').length;

  return (
    <div className="space-y-4">
      {/* Queue Toolbar & Stats */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-purple-50 border border-purple-200 text-purple-800 rounded-lg text-xs font-bold">
            <Layers className="w-3.5 h-3.5 text-purple-600" />
            <span>Active Queue: {activeCount} Tasks</span>
          </div>

          {overdueCount > 0 && (
            <div className="flex items-center gap-1 px-2.5 py-1 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-[11px] font-bold animate-pulse">
              <Flame className="w-3.5 h-3.5 text-rose-600" />
              <span>{overdueCount} Overdue</span>
            </div>
          )}

          {revisionsCount > 0 && (
            <div className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-[11px] font-bold">
              <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
              <span>{revisionsCount} Needs Revision</span>
            </div>
          )}
        </div>

        {/* Filter and Sort controls */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium"
            >
              <option value="active">Active Tasks ({activeCount})</option>
              <option value="revisions">Revisions ({revisionsCount})</option>
              <option value="completed">Delivered</option>
              <option value="all">All Projects</option>
            </select>
          </div>

          <div className="flex items-center gap-1 text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as QueueSortOption)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium"
            >
              <option value="urgency">Sort: Priority Urgency</option>
              <option value="deadline">Sort: Deadline Date</option>
              <option value="revisions">Sort: Most Revisions</option>
              <option value="newest">Sort: Newest First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Queue Task Cards */}
      {sortedQueue.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">Your Work Queue is Clear!</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You currently have no active pending tasks in your queue. Great job staying ahead of deadlines!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedQueue.map((project, index) => {
            const deadline = getDeadlineInfo(project);
            const downloadUrl =
              (project as any).rawFileLink ||
              project.userDownloadLink ||
              project.driveFolderUrl ||
              getProjectDriveFolderUrl(project);

            const isDone = project.status === 'Completed' || project.status === 'Delivered';

            return (
              <div
                key={project.id}
                className={`bg-white rounded-2xl border p-5 transition hover:shadow-md ${
                  deadline.isOverdue
                    ? 'border-rose-300 bg-rose-50/20 shadow-2xs ring-1 ring-rose-300/40'
                    : project.status === 'Revision Required'
                    ? 'border-amber-300 bg-amber-50/20 shadow-2xs ring-1 ring-amber-300/40'
                    : 'border-slate-200 shadow-2xs'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left: Queue Position + Title & Specs */}
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${
                        deadline.isOverdue
                          ? 'bg-rose-600 text-white'
                          : project.status === 'Revision Required'
                          ? 'bg-amber-500 text-white'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      #{index + 1}
                    </div>

                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-bold text-slate-900 text-sm truncate">{project.name}</h4>
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[10px] font-semibold">
                          {project.workType || 'Video'}
                        </span>
                        {(project as any).videoType && (
                          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md text-[10px] font-medium border border-indigo-100">
                            {(project as any).videoType}
                          </span>
                        )}
                        {(project as any).aspectRatio && (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[10px]">
                            {(project as any).aspectRatio}
                          </span>
                        )}
                      </div>

                      {/* Client / Deliverable details */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                        {(project as any).clientName && (
                          <span>
                            Client: <strong className="text-slate-700">{(project as any).clientName}</strong>
                          </span>
                        )}
                        <span>
                          Quantity: <strong className="text-slate-700">{project.quantity || 1}</strong>
                        </span>
                        <span>
                          Payout:{' '}
                          <strong className="text-purple-700">
                            ₹{((project.editorRate || 0) * (project.quantity || 1)).toLocaleString()}
                          </strong>
                        </span>
                        {project.revisionCount && project.revisionCount > 0 ? (
                          <span className="text-amber-700 font-semibold flex items-center gap-1">
                            <RotateCcw className="w-3 h-3" />
                            Revision #{project.revisionCount}
                          </span>
                        ) : null}
                      </div>

                      {/* Revision Feedback Note if present */}
                      {project.revisionNotes && (
                        <div className="mt-2 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                          <RotateCcw className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold">Client Revision Instructions: </span>
                            <span>{project.revisionNotes}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Middle: Deadline Urgency Badge */}
                  <div className="shrink-0 flex flex-col items-start lg:items-end">
                    <div
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold ${
                        deadline.isOverdue
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : deadline.isDueToday
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : deadline.isUpcoming
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>{deadline.text}</span>
                    </div>
                    {(project.deadline || project.dueDate) && (
                      <span className="text-[10px] text-slate-400 mt-1">
                        Deadline: {project.deadline || project.dueDate}
                        {project.workGivenDate ? ` • Given: ${project.workGivenDate}` : ''}
                      </span>
                    )}
                  </div>

                  {/* Right: Quick Workflow Action Controls */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                    {/* Raw Assets Download */}
                    {downloadUrl ? (
                      <a
                        href={downloadUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                        title="Download raw assets"
                      >
                        <FolderDown className="w-3.5 h-3.5 text-slate-600" />
                        <span>Raw Files</span>
                      </a>
                    ) : null}

                    {/* Chat with Client / Producer */}
                    <button
                      type="button"
                      onClick={() => onOpenChat(project.id)}
                      className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer border border-slate-200"
                      title="Open project chat"
                    >
                      <MessageSquare className="w-4 h-4 text-slate-600" />
                    </button>

                    {/* Quick Status Buttons */}
                    {!isDone && (
                      <>
                        {project.status === 'Assigned' && (
                          <button
                            type="button"
                            onClick={() => onUpdateStatus(project.id, 'In Progress')}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs transition cursor-pointer"
                          >
                            <Play className="w-3 h-3 fill-white" />
                            <span>Start Editing</span>
                          </button>
                        )}

                        {project.status === 'In Progress' && (
                          <button
                            type="button"
                            onClick={() => onOpenUploadModal(project.id)}
                            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs transition cursor-pointer"
                          >
                            <FolderUp className="w-3.5 h-3.5" />
                            <span>Upload Draft</span>
                          </button>
                        )}

                        {project.status === 'Revision Required' && (
                          <button
                            type="button"
                            onClick={() => onOpenUploadModal(project.id)}
                            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs transition cursor-pointer"
                          >
                            <FolderUp className="w-3.5 h-3.5" />
                            <span>Upload Revision</span>
                          </button>
                        )}

                        {project.status !== 'Assigned' && (
                          <button
                            type="button"
                            onClick={() => onSubmitCompletion(project.id)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs transition cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Submit Final</span>
                          </button>
                        )}
                      </>
                    )}

                    {isDone && (
                      <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Completed</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
