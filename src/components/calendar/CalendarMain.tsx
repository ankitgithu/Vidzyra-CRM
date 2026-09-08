import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  AlertTriangle,
  Clock,
  RotateCcw,
  CheckSquare,
  Filter,
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { CalendarMonthView } from './CalendarMonthView';
import { CalendarDayView } from './CalendarDayView';
import { CalendarTaskModal } from './CalendarTaskModal';
import {
  getTodayDateStr,
  normalizeDateStr,
  safeFormatDisplayDate,
  aggregateDayData,
} from '../../utils/calendarUtils';
import { getDeadlineInfo } from '../../utils/deadlines';
import { CalendarTask } from '../../types';

export const CalendarMain: React.FC = () => {
  const {
    projects,
    clientPayments,
    editorPayments,
    invoices,
    calendarTasks,
    activities,
    addCalendarTask,
    updateCalendarTask,
    setSelectedWorkId,
    setActiveTab,
  } = useCrm();

  const todayStr = getTodayDateStr();
  const [todayY, todayM, todayD] = todayStr.split('-').map(Number);

  // View state: 'month' | 'day' (Strictly no Yearly view per requirements)
  const [currentView, setCurrentView] = useState<'month' | 'day'>('month');

  // Month navigation state
  const [currentYear, setCurrentYear] = useState<number>(todayY);
  const [currentMonth, setCurrentMonth] = useState<number>(todayM - 1); // 0-indexed

  // Selected Day state (for Day view)
  const [selectedDateStr, setSelectedDateStr] = useState<string>(todayStr);

  // Filter state
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Modal state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState<boolean>(false);
  const [taskModalDate, setTaskModalDate] = useState<string>(todayStr);
  const [taskToEdit, setTaskToEdit] = useState<CalendarTask | null>(null);

  // Global KPIs for the summary ribbon
  const summaryKpis = useMemo(() => {
    let overdueCount = 0;
    let dueTodayCount = 0;
    let revisionsCount = 0;

    projects.forEach((proj) => {
      const isCompleted =
        proj.status === 'Completed' ||
        proj.status === 'Approved' ||
        proj.status === 'Delivered';

      if (!isCompleted) {
        const deadline = getDeadlineInfo(proj);
        if (deadline.isOverdue) overdueCount++;
        else if (deadline.isDueToday) dueTodayCount++;

        if (
          proj.revisionStatus === 'Revision Requested' ||
          proj.revisionStatus === 'Revision In Progress' ||
          proj.revisionStatus === 'Revision Uploaded'
        ) {
          revisionsCount++;
        }
      }
    });

    const pendingTasksCount = calendarTasks.filter((t) => t.status !== 'Completed').length;

    return {
      overdueCount,
      dueTodayCount,
      revisionsCount,
      pendingTasksCount,
    };
  }, [projects, calendarTasks]);

  // Handlers for Month Navigation
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((prev) => prev - 1);
    } else {
      setCurrentMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((prev) => prev + 1);
    } else {
      setCurrentMonth((prev) => prev + 1);
    }
  };

  const handleGoToToday = () => {
    const [y, m] = todayStr.split('-').map(Number);
    setCurrentYear(y);
    setCurrentMonth(m - 1);
    setSelectedDateStr(todayStr);
  };

  // Handlers for Day Navigation
  const handlePrevDay = () => {
    const parts = selectedDateStr.split('-').map(Number);
    const d = new Date(parts[0], parts[1] - 1, parts[2] - 1);
    const nextStr = normalizeDateStr(d);
    setSelectedDateStr(nextStr);
    setCurrentYear(d.getFullYear());
    setCurrentMonth(d.getMonth());
  };

  const handleNextDay = () => {
    const parts = selectedDateStr.split('-').map(Number);
    const d = new Date(parts[0], parts[1] - 1, parts[2] + 1);
    const nextStr = normalizeDateStr(d);
    setSelectedDateStr(nextStr);
    setCurrentYear(d.getFullYear());
    setCurrentMonth(d.getMonth());
  };

  // Switch to Day view for selected cell
  const handleSelectDay = (dateStr: string) => {
    setSelectedDateStr(dateStr);
    setCurrentView('day');
  };

  // Task creation / editing
  const handleOpenAddTask = (date?: string) => {
    setTaskToEdit(null);
    setTaskModalDate(date ? normalizeDateStr(date) : selectedDateStr || todayStr);
    setIsTaskModalOpen(true);
  };

  const handleQuickAddTask = (dateStr: string, e: React.MouseEvent) => {
    e.stopPropagation();
    handleOpenAddTask(dateStr);
  };

  const handleEditTask = (task: CalendarTask) => {
    setTaskToEdit(task);
    setTaskModalDate(normalizeDateStr(task.date));
    setIsTaskModalOpen(true);
  };

  const handleSelectProject = (projectId: string) => {
    setSelectedWorkId(projectId);
    setActiveTab('work');
  };

  // Selected Day Data Aggregation
  const selectedDayData = useMemo(() => {
    return aggregateDayData(
      selectedDateStr,
      projects,
      clientPayments,
      editorPayments,
      invoices,
      calendarTasks,
      activities
    );
  }, [selectedDateStr, projects, clientPayments, editorPayments, invoices, calendarTasks, activities]);

  // Current Month Display Name
  const monthName = safeFormatDisplayDate(
    `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`,
    'month-year'
  );

  return (
    <div id="calendar-module-root" className="space-y-6 p-6 lg:p-8 max-w-7xl mx-auto">
      {/* 1. Page Header with Title, Live Badge, Subtitle & Action Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Calendar &amp; Deadlines</h1>
            <span className="text-[11px] font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200">
              Live Real-Time
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            Monitor client deliverables, active revisions, financial milestones, and administrative follow-ups.
          </p>
        </div>

        {/* Header Action Button */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            id="add-calendar-task-top-btn"
            type="button"
            onClick={() => handleOpenAddTask()}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards (Matching Financial Ledger visual card style) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Card 1: Overdue Deadlines */}
        <div
          id="calendar-kpi-overdue"
          onClick={() => setCategoryFilter(categoryFilter === 'overdue' ? 'all' : 'overdue')}
          className={`bg-white p-3.5 rounded-xl border shadow-2xs flex flex-col justify-between cursor-pointer transition-all ${
            categoryFilter === 'overdue'
              ? 'border-rose-300 ring-2 ring-rose-200 bg-rose-50/30'
              : 'border-rose-200 bg-rose-50/20 hover:border-rose-300 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-rose-700">
            <span className="text-[10px] font-bold uppercase tracking-wider">
              1. Overdue Deadlines
            </span>
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
          </div>
          <div className="mt-2">
            <div className="text-lg font-bold text-rose-700 tracking-tight">
              {summaryKpis.overdueCount}
            </div>
            <span className="text-[10px] text-rose-600 block mt-0.5 truncate">
              {summaryKpis.overdueCount === 1 ? 'Action required immediately' : 'Projects past due date'}
            </span>
          </div>
        </div>

        {/* Card 2: Due Today */}
        <div
          id="calendar-kpi-due"
          onClick={() => setCategoryFilter(categoryFilter === 'due' ? 'all' : 'due')}
          className={`bg-white p-3.5 rounded-xl border shadow-2xs flex flex-col justify-between cursor-pointer transition-all ${
            categoryFilter === 'due'
              ? 'border-amber-300 ring-2 ring-amber-200 bg-amber-50/30'
              : 'border-amber-200 bg-amber-50/20 hover:border-amber-300 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-amber-700">
            <span className="text-[10px] font-bold uppercase tracking-wider">
              2. Due Today
            </span>
            <Clock className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="mt-2">
            <div className="text-lg font-bold text-amber-700 tracking-tight">
              {summaryKpis.dueTodayCount}
            </div>
            <span className="text-[10px] text-amber-600 block mt-0.5 truncate">
              Deliverables targeted today
            </span>
          </div>
        </div>

        {/* Card 3: In Revision */}
        <div
          id="calendar-kpi-revisions"
          onClick={() => setCategoryFilter(categoryFilter === 'revisions' ? 'all' : 'revisions')}
          className={`bg-white p-3.5 rounded-xl border shadow-2xs flex flex-col justify-between cursor-pointer transition-all ${
            categoryFilter === 'revisions'
              ? 'border-purple-300 ring-2 ring-purple-200 bg-purple-50/30'
              : 'border-purple-200 bg-purple-50/20 hover:border-purple-300 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-purple-700">
            <span className="text-[10px] font-bold uppercase tracking-wider">
              3. In Revision
            </span>
            <RotateCcw className="w-3.5 h-3.5 text-purple-600" />
          </div>
          <div className="mt-2">
            <div className="text-lg font-bold text-purple-700 tracking-tight">
              {summaryKpis.revisionsCount}
            </div>
            <span className="text-[10px] text-purple-600 block mt-0.5 truncate">
              Active client feedback loops
            </span>
          </div>
        </div>

        {/* Card 4: Admin Tasks */}
        <div
          id="calendar-kpi-tasks"
          onClick={() => setCategoryFilter(categoryFilter === 'tasks' ? 'all' : 'tasks')}
          className={`bg-white p-3.5 rounded-xl border shadow-2xs flex flex-col justify-between cursor-pointer transition-all ${
            categoryFilter === 'tasks'
              ? 'border-sky-300 ring-2 ring-sky-200 bg-sky-50/30'
              : 'border-slate-200 hover:border-sky-300 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              4. Admin Tasks
            </span>
            <CheckSquare className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="mt-2">
            <div className="text-lg font-bold text-slate-900 tracking-tight">
              {summaryKpis.pendingTasksCount}
            </div>
            <span className="text-[10px] text-slate-500 block mt-0.5 truncate">
              Pending to-dos &amp; reminders
            </span>
          </div>
        </div>
      </div>

      {/* 3. Section Navigation & View Switcher Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Left: Segmented Tabs (Month / Day View) */}
          <div className="flex items-center space-x-1 p-1 bg-slate-100 rounded-xl text-xs font-semibold w-full md:w-auto">
            <button
              id="view-month-btn"
              type="button"
              onClick={() => setCurrentView('month')}
              className={`px-4 py-2 rounded-lg transition flex items-center gap-1.5 ${
                currentView === 'month'
                  ? 'bg-white text-indigo-800 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5 text-indigo-600" />
              <span>MONTH VIEW</span>
            </button>
            <button
              id="view-day-btn"
              type="button"
              onClick={() => setCurrentView('day')}
              className={`px-4 py-2 rounded-lg transition flex items-center gap-1.5 ${
                currentView === 'day'
                  ? 'bg-white text-indigo-800 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-indigo-600" />
              <span>DAY VIEW</span>
            </button>
          </div>

          {/* Right: Date Navigation Controls */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl p-0.5 shadow-2xs">
              <button
                id="cal-prev-btn"
                type="button"
                onClick={currentView === 'month' ? handlePrevMonth : handlePrevDay}
                className="p-1.5 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-white transition-colors"
                title="Previous"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                id="cal-today-btn"
                type="button"
                onClick={handleGoToToday}
                className="px-3 py-1 text-xs font-semibold text-slate-700 hover:text-indigo-600 rounded-lg hover:bg-white transition-colors"
              >
                Today
              </button>
              <button
                id="cal-next-btn"
                type="button"
                onClick={currentView === 'month' ? handleNextMonth : handleNextDay}
                className="p-1.5 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-white transition-colors"
                title="Next"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Current View Date / Month Label */}
            <div className="text-sm font-bold text-slate-900 min-w-[140px] text-right">
              {currentView === 'month' ? monthName : safeFormatDisplayDate(selectedDateStr, 'day-header')}
            </div>
          </div>
        </div>

        {/* Category Filter Pills (Integrated inside the controls container) */}
        {currentView === 'month' && (
          <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 mr-1">
              <Filter className="w-3 h-3 text-slate-400" />
              Filter:
            </span>
            {[
              { id: 'all', label: 'All Items' },
              { id: 'overdue', label: 'Overdue', dot: 'bg-rose-500' },
              { id: 'due', label: 'Due Deadlines', dot: 'bg-amber-500' },
              { id: 'revisions', label: 'Revisions', dot: 'bg-purple-500' },
              { id: 'tasks', label: 'Admin Tasks', dot: 'bg-sky-500' },
              { id: 'payments', label: 'Financials', dot: 'bg-emerald-500' },
              { id: 'completed', label: 'Completed', dot: 'bg-slate-400' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setCategoryFilter(item.id)}
                className={`px-3 py-1.5 rounded-xl font-medium border text-xs transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  categoryFilter === item.id
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-2xs font-semibold'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {item.dot && <span className={`w-1.5 h-1.5 rounded-full ${item.dot}`} />}
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 4. Main View Area: Month or Day */}
      {currentView === 'month' ? (
        <CalendarMonthView
          currentYear={currentYear}
          currentMonth={currentMonth}
          selectedCategoryFilter={categoryFilter}
          projects={projects}
          clientPayments={clientPayments}
          editorPayments={editorPayments}
          invoices={invoices}
          calendarTasks={calendarTasks}
          activities={activities}
          onSelectDay={handleSelectDay}
          onQuickAddTask={handleQuickAddTask}
        />
      ) : (
        <CalendarDayView
          currentDateStr={selectedDateStr}
          dayData={selectedDayData}
          onNavigatePrev={handlePrevDay}
          onNavigateNext={handleNextDay}
          onNavigateToday={handleGoToToday}
          onBackToMonth={() => setCurrentView('month')}
          onOpenAddTask={handleOpenAddTask}
          onEditTask={handleEditTask}
          onSelectProject={handleSelectProject}
        />
      )}

      {/* 5. Task Creation & Edit Modal */}
      <CalendarTaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        initialDate={taskModalDate}
        taskToEdit={taskToEdit}
        onSave={async (taskData) => {
          await addCalendarTask(taskData);
        }}
        onUpdate={async (id, updates) => {
          await updateCalendarTask(id, updates);
        }}
      />
    </div>
  );
};
