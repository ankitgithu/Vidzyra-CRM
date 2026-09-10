import React from 'react';
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  Circle,
  CreditCard,
  FileText,
  RotateCcw,
  Plus,
  ArrowLeft,
  ArrowRight,
  Calendar as CalendarIcon,
  Trash2,
  Edit2,
  ExternalLink,
  ChevronLeft,
} from 'lucide-react';
import { WorkProject, CalendarTask } from '../../types';
import {
  DayAggregatedData,
  safeFormatDisplayDate,
  getTodayDateStr,
} from '../../utils/calendarUtils';
import { getDeadlineInfo } from '../../utils/deadlines';
import { useCrm } from '../../context/CrmContext';

interface CalendarDayViewProps {
  currentDateStr: string;
  dayData: DayAggregatedData;
  onNavigatePrev: () => void;
  onNavigateNext: () => void;
  onNavigateToday: () => void;
  onBackToMonth: () => void;
  onOpenAddTask: (date?: string) => void;
  onEditTask: (task: CalendarTask) => void;
  onSelectProject: (projectId: string) => void;
}

export const CalendarDayView: React.FC<CalendarDayViewProps> = ({
  currentDateStr,
  dayData,
  onNavigatePrev,
  onNavigateNext,
  onNavigateToday,
  onBackToMonth,
  onOpenAddTask,
  onEditTask,
  onSelectProject,
}) => {
  const {
    settings,
    clients,
    editors,
    toggleCalendarTaskStatus,
    deleteCalendarTask,
  } = useCrm();

  const todayStr = getTodayDateStr();
  const isToday = currentDateStr === todayStr;
  const currency = settings.currencySymbol || '₹';

  const clientMap = new Map(clients.map((c) => [c.id, c.name]));
  const editorMap = new Map(editors.map((e) => [e.id, e.name]));

  const getClientName = (proj: WorkProject) =>
    clientMap.get(proj.clientId) || 'Client';
  const getEditorName = (proj: WorkProject) =>
    (proj.editorId ? editorMap.get(proj.editorId) : undefined) || 'Unassigned';

  const totalItemsCount =
    dayData.overdueProjects.length +
    dayData.dueTodayProjects.length +
    dayData.revisionProjects.length +
    dayData.payments.clientPayments.length +
    dayData.payments.editorPayments.length +
    dayData.invoices.length +
    dayData.adminTasks.length +
    dayData.completedItems.projects.length +
    dayData.completedItems.tasks.length;

  return (
    <div id="calendar-day-view-container" className="space-y-6">
      {/* Day View Top Header Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            id="day-back-to-month-btn"
            type="button"
            onClick={onBackToMonth}
            className="p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 border border-slate-200 transition-colors flex items-center gap-1.5 text-xs font-semibold shadow-2xs"
            title="Return to Month Grid"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Month View</span>
          </button>

          <div className="h-6 w-px bg-slate-200 hidden sm:block" />

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {safeFormatDisplayDate(currentDateStr, 'day-header')}
              </h2>
              {isToday && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Today
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {safeFormatDisplayDate(currentDateStr, 'month-year')} • {totalItemsCount}{' '}
              {totalItemsCount === 1 ? 'item scheduled' : 'items scheduled'}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl p-0.5 shadow-2xs">
            <button
              id="day-prev-btn"
              type="button"
              onClick={onNavigatePrev}
              className="p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-white transition-colors"
              title="Previous Day"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button
              id="day-today-btn"
              type="button"
              onClick={onNavigateToday}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-indigo-600 rounded-lg hover:bg-white transition-colors"
            >
              Today
            </button>
            <button
              id="day-next-btn"
              type="button"
              onClick={onNavigateNext}
              className="p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-white transition-colors"
              title="Next Day"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <button
            id="day-add-task-btn"
            type="button"
            onClick={() => onOpenAddTask(currentDateStr)}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* Main Day Content Sections */}
      <div className="space-y-6">
        {/* 1. OVERDUE PROJECTS (CRITICAL) */}
        {dayData.overdueProjects.length > 0 && (
          <div
            id="day-overdue-section"
            className="bg-rose-50/40 border border-rose-200 rounded-2xl p-5 shadow-xs"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-rose-100 text-rose-600 rounded-lg">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-rose-900 uppercase tracking-wider">
                  Overdue Deadlines ({dayData.overdueProjects.length})
                </h3>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                Action Required
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {dayData.overdueProjects.map((proj) => {
                const deadline = getDeadlineInfo(proj);
                return (
                  <div
                    key={proj.id}
                    id={`day-overdue-card-${proj.id}`}
                    className="bg-white border border-rose-200 rounded-xl p-4 shadow-2xs hover:border-rose-400 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-semibold text-slate-900 text-sm">
                          {proj.name || (proj as any).title}
                        </h4>
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-500 text-white whitespace-nowrap">
                          {deadline.diffDays < 0
                            ? `${Math.abs(deadline.diffDays)}d Overdue`
                            : deadline.text || 'Overdue'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Client: <span className="font-medium text-slate-700">{getClientName(proj)}</span>
                        {' • '}
                        Editor: <span className="font-medium text-slate-700">{getEditorName(proj)}</span>
                      </p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500 mt-2">
                        {proj.workGivenDate && (
                          <span>Given: <strong className="text-slate-700">{proj.workGivenDate}</strong></span>
                        )}
                        <span>Deadline: <strong className="text-rose-700">{proj.deadline || proj.dueDate || 'N/A'}</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 text-xs">
                      <span className="font-semibold text-slate-700">
                        {currency}{proj.totalBilling || (proj as any).amount || 0}
                      </span>
                      <button
                        type="button"
                        onClick={() => onSelectProject(proj.id)}
                        className="text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1 hover:underline"
                      >
                        <span>Open Project</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 2. PROJECTS DUE TODAY / ON THIS DAY */}
        {dayData.dueTodayProjects.length > 0 && (
          <div
            id="day-due-section"
            className="bg-amber-50/30 border border-amber-200 rounded-2xl p-5 shadow-xs"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-amber-100 text-amber-600 rounded-lg">
                  <Clock className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-amber-900 uppercase tracking-wider">
                  Deliverables Due ({dayData.dueTodayProjects.length})
                </h3>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                Due Target
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {dayData.dueTodayProjects.map((proj) => (
                <div
                  key={proj.id}
                  id={`day-due-card-${proj.id}`}
                  className="bg-white border border-amber-200 rounded-xl p-4 shadow-2xs hover:border-amber-400 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-semibold text-slate-900 text-sm">
                        {proj.name || (proj as any).title}
                      </h4>
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-500 text-white whitespace-nowrap">
                        Due
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Client: <span className="font-medium text-slate-700">{getClientName(proj)}</span>
                      {' • '}
                      Editor: <span className="font-medium text-slate-700">{getEditorName(proj)}</span>
                    </p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500 mt-2">
                      {proj.workGivenDate && (
                        <span>Work Given Date: <strong className="text-slate-700">{proj.workGivenDate}</strong></span>
                      )}
                      <span>Deadline: <strong className="text-amber-800">{proj.deadline || proj.dueDate || 'N/A'}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-amber-100 text-xs">
                    <span className="font-semibold text-slate-700">
                      {currency}{proj.totalBilling || (proj as any).amount || 0}
                    </span>
                    <button
                      type="button"
                      onClick={() => onSelectProject(proj.id)}
                      className="text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1 hover:underline"
                    >
                      <span>Open Project</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. REVISIONS ON THIS DAY */}
        {dayData.revisionProjects.length > 0 && (
          <div
            id="day-revisions-section"
            className="bg-purple-50/30 border border-purple-200 rounded-2xl p-5 shadow-xs"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-purple-100 text-purple-600 rounded-lg">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-purple-900 uppercase tracking-wider">
                  Revisions &amp; Feedback ({dayData.revisionProjects.length})
                </h3>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                Active Iteration
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {dayData.revisionProjects.map((proj) => (
                <div
                  key={proj.id}
                  id={`day-rev-card-${proj.id}`}
                  className="bg-white border border-purple-200 rounded-xl p-4 shadow-2xs hover:border-purple-300 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-semibold text-slate-900 text-sm">
                        {proj.name || (proj as any).title}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Client: {getClientName(proj)} • Editor: {getEditorName(proj)}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500 mt-1">
                        {proj.workGivenDate && (
                          <span>Given: <strong className="text-slate-700">{proj.workGivenDate}</strong></span>
                        )}
                        <span>Deadline: <strong className="text-purple-800">{proj.deadline || proj.dueDate || 'N/A'}</strong></span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-purple-600 text-white whitespace-nowrap">
                      {proj.revisionStatus || 'In Revision'}
                    </span>
                  </div>

                  {proj.revisionNotes && (
                    <p className="text-xs text-slate-600 mt-2 bg-purple-50/50 p-2.5 rounded-lg border border-purple-100 italic">
                      "{proj.revisionNotes}"
                    </p>
                  )}

                  <div className="flex items-center justify-end mt-3 pt-2 text-xs">
                    <button
                      type="button"
                      onClick={() => onSelectProject(proj.id)}
                      className="text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1 hover:underline"
                    >
                      <span>Review Revision</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. ADMIN TASKS & TO-DO ITEMS */}
        <div
          id="day-tasks-section"
          className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg">
                <CalendarIcon className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Admin Tasks &amp; To-Dos ({dayData.adminTasks.length})
              </h3>
            </div>
            <button
              type="button"
              onClick={() => onOpenAddTask(currentDateStr)}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Task</span>
            </button>
          </div>

          {dayData.adminTasks.length === 0 ? (
            <div className="py-6 text-center border-2 border-dashed border-slate-200 rounded-xl">
              <p className="text-xs text-slate-400">
                No admin tasks scheduled for this day.
              </p>
              <button
                type="button"
                onClick={() => onOpenAddTask(currentDateStr)}
                className="mt-2 text-xs font-semibold text-indigo-600 hover:underline inline-flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>Create to-do or reminder</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {dayData.adminTasks.map((task) => {
                const isHigh = task.priority === 'High';
                const isMedium = task.priority === 'Medium';
                return (
                  <div
                    key={task.id}
                    id={`task-item-${task.id}`}
                    className="flex items-start justify-between gap-3 p-3 bg-slate-50/80 border border-slate-200 rounded-xl hover:border-indigo-300 transition-all shadow-2xs"
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <button
                        type="button"
                        onClick={() => toggleCalendarTaskStatus(task.id)}
                        className="mt-0.5 text-slate-400 hover:text-emerald-500 transition-colors"
                        title="Mark as completed"
                      >
                        <Circle className="w-4 h-4" />
                      </button>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-sm font-semibold text-slate-900 break-words">
                            {task.title}
                          </h4>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              isHigh
                                ? 'bg-rose-100 text-rose-700 border border-rose-200'
                                : isMedium
                                ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {task.priority} Priority
                          </span>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-50 text-indigo-600 border border-indigo-100">
                            {task.type}
                          </span>
                          {task.time && (
                            <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {task.time}
                            </span>
                          )}
                        </div>
                        {task.description && (
                          <p className="text-xs text-slate-500 mt-1 whitespace-pre-line">
                            {task.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => onEditTask(task)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-white transition-colors"
                        title="Edit Task"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Delete task "${task.title}"?`)) {
                            deleteCalendarTask(task.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-white transition-colors"
                        title="Delete Task"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 5. PAYMENTS & INVOICES */}
        {(dayData.payments.clientPayments.length > 0 ||
          dayData.payments.editorPayments.length > 0 ||
          dayData.invoices.length > 0) && (
          <div
            id="day-finance-section"
            className="bg-white border border-emerald-200 rounded-2xl p-5 shadow-xs"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg">
                  <CreditCard className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-emerald-900 uppercase tracking-wider">
                  Billing &amp; Transactions
                </h3>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                Financial
              </span>
            </div>

            <div className="space-y-2">
              {/* Client Payments */}
              {dayData.payments.clientPayments.map((cp) => (
                <div
                  key={cp.id}
                  className="flex items-center justify-between p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <div>
                      <p className="text-xs font-semibold text-slate-900">
                        Client Payment: {(cp as any).clientName || 'Client'}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {(cp as any).method || cp.paymentMethod || 'Online'} • Status: {(cp as any).status || 'Received'}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-emerald-600">
                    +{currency}{cp.amount || 0}
                  </span>
                </div>
              ))}

              {/* Editor Payments */}
              {dayData.payments.editorPayments.map((ep) => (
                <div
                  key={ep.id}
                  className="flex items-center justify-between p-3 bg-blue-50/50 border border-blue-100 rounded-xl"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <div>
                      <p className="text-xs font-semibold text-slate-900">
                        Editor Payout: {(ep as any).editorName || 'Editor'}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Status: {(ep as any).status || 'Paid'}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-slate-700">
                    -{currency}{ep.amount || 0}
                  </span>
                </div>
              ))}

              {/* Invoices */}
              {dayData.invoices.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-4 h-4 text-indigo-500" />
                    <div>
                      <p className="text-xs font-semibold text-slate-900">
                        Invoice #{inv.invoiceNumber} • {inv.clientName}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Due: {inv.dueDate || 'N/A'} • Status: {(inv as any).status || inv.paymentStatus}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-slate-900">
                    {currency}{(inv as any).totalAmount || inv.total || 0}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 6. COMPLETED DELIVERABLES & FINISHED TASKS */}
        {(dayData.completedItems.projects.length > 0 ||
          dayData.completedItems.tasks.length > 0) && (
          <div
            id="day-completed-section"
            className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                  Completed on this Day
                </h3>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                {dayData.completedItems.projects.length +
                  dayData.completedItems.tasks.length}{' '}
                Completed
              </span>
            </div>

            <div className="space-y-2">
              {dayData.completedItems.projects.map((proj) => (
                <div
                  key={proj.id}
                  className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl opacity-90"
                >
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <div>
                      <h4 className="text-xs font-semibold text-slate-800 line-through">
                        {proj.name || (proj as any).title}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        {getClientName(proj)} • Deliverable Completed &amp; Approved
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onSelectProject(proj.id)}
                    className="text-xs text-indigo-600 hover:underline font-semibold"
                  >
                    View
                  </button>
                </div>
              ))}

              {dayData.completedItems.tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl opacity-80"
                >
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => toggleCalendarTaskStatus(task.id)}
                      className="text-emerald-500 hover:text-slate-400 transition-colors"
                      title="Reopen task"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                    <div>
                      <h4 className="text-xs font-medium text-slate-700 line-through">
                        {task.title}
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        {task.type} • {task.priority} Priority
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Delete completed task "${task.title}"?`)) {
                        deleteCalendarTask(task.id);
                      }
                    }}
                    className="text-slate-400 hover:text-rose-500 p-1"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 7. BLANK STATE IF NO ITEMS */}
        {totalItemsCount === 0 && (
          <div className="py-16 text-center bg-white border border-slate-200 rounded-2xl p-8 shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <CalendarIcon className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-800">
              Clear Schedule for This Day
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              There are no project deadlines, revisions, financial transactions, or admin tasks
              recorded on {safeFormatDisplayDate(currentDateStr, 'full')}.
            </p>
            <button
              type="button"
              onClick={() => onOpenAddTask(currentDateStr)}
              className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs inline-flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add an Admin Task / Reminder</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
