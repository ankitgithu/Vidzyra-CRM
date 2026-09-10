import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Plus,
  Briefcase,
  Filter,
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { WorkProject } from '../../types';
import { getDeadlineInfo } from '../../utils/deadlines';

interface DeadlineCalendarViewProps {
  onOpenWorkDetail: (workId: string) => void;
  onOpenNewWork: (defaultDate?: string) => void;
}

export const DeadlineCalendarView: React.FC<DeadlineCalendarViewProps> = ({
  onOpenWorkDetail,
  onOpenNewWork,
}) => {
  const { projects, clients, editors, settings } = useCrm();

  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [filterPriority, setFilterPriority] = useState<string>('all');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  // Calendar calculations
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 is Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Group projects by deadline (YYYY-MM-DD)
  const projectsByDueDate = useMemo(() => {
    const map: Record<string, WorkProject[]> = {};

    projects.forEach((p) => {
      const deadlineDate = p.deadline || p.dueDate;
      if (!deadlineDate) return;
      if (filterPriority !== 'all' && (p.priority || 'Medium') !== filterPriority) return;

      const dateKey = deadlineDate.trim();
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(p);
    });

    return map;
  }, [projects, filterPriority]);

  // Month Statistics
  const monthStats = useMemo(() => {
    let overdueCount = 0;
    let dueThisMonth = 0;
    let completedThisMonth = 0;

    const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;

    projects.forEach((p) => {
      const deadlineDate = p.deadline || p.dueDate;
      if (!deadlineDate) return;
      if (deadlineDate.startsWith(monthStr)) {
        dueThisMonth++;
        const dl = getDeadlineInfo(p);
        if (dl.isOverdue) overdueCount++;
        if (dl.isCompleted) completedThisMonth++;
      }
    });

    return { overdueCount, dueThisMonth, completedThisMonth };
  }, [projects, year, month]);

  // Today's date string YYYY-MM-DD
  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  // Build 42 grid cells (6 rows x 7 days)
  const calendarCells = useMemo(() => {
    const cells: {
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      projects: WorkProject[];
    }[] = [];

    // 1. Trailing days from previous month
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      const dayNum = prevMonthDays - i;
      const prevM = month === 0 ? 11 : month - 1;
      const prevY = month === 0 ? year - 1 : year;
      const dStr = `${prevY}-${String(prevM + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      cells.push({
        dateStr: dStr,
        dayNumber: dayNum,
        isCurrentMonth: false,
        isToday: dStr === todayStr,
        projects: projectsByDueDate[dStr] || [],
      });
    }

    // 2. Days of current month
    for (let d = 1; d <= daysInMonth; d++) {
      const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({
        dateStr: dStr,
        dayNumber: d,
        isCurrentMonth: true,
        isToday: dStr === todayStr,
        projects: projectsByDueDate[dStr] || [],
      });
    }

    // 3. Leading days for next month to complete grid
    const remaining = 42 - cells.length;
    for (let d = 1; d <= remaining; d++) {
      const nextM = month === 11 ? 0 : month + 1;
      const nextY = month === 11 ? year + 1 : year;
      const dStr = `${nextY}-${String(nextM + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({
        dateStr: dStr,
        dayNumber: d,
        isCurrentMonth: false,
        isToday: dStr === todayStr,
        projects: projectsByDueDate[dStr] || [],
      });
    }

    return cells;
  }, [year, month, firstDayOfMonth, daysInMonth, prevMonthDays, projectsByDueDate, todayStr]);

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-4">
      {/* Calendar Header / Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center space-x-1 border border-slate-200 rounded-lg p-0.5 bg-slate-50">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 hover:bg-white rounded text-slate-600 hover:text-slate-900 transition cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleToday}
              className="px-2.5 py-1 font-semibold text-slate-700 hover:bg-white rounded transition cursor-pointer"
            >
              Today
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1.5 hover:bg-white rounded text-slate-600 hover:text-slate-900 transition cursor-pointer"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-indigo-600" />
            <span>
              {monthNames[month]} {year}
            </span>
          </h3>
        </div>

        {/* Month Stats Summary Pills */}
        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Briefcase className="w-3 h-3" />
            {monthStats.dueThisMonth} Due This Month
          </span>

          {monthStats.overdueCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
              <AlertTriangle className="w-3 h-3" />
              {monthStats.overdueCount} Overdue
            </span>
          )}

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 cursor-pointer text-xs"
          >
            <option value="all">All Priorities</option>
            <option value="Urgent">Urgent Only 🔥</option>
            <option value="High">High Priority</option>
            <option value="Medium">Medium Priority</option>
            <option value="Low">Low Priority</option>
          </select>
        </div>
      </div>

      {/* 7-Day Weekdays Header */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200 text-center py-2.5 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
          {daysOfWeek.map((day, idx) => (
            <div key={day} className={idx === 0 || idx === 6 ? 'text-slate-400' : ''}>
              {day}
            </div>
          ))}
        </div>

        {/* 42 Calendar Cells */}
        <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 min-h-[600px]">
          {calendarCells.map((cell, idx) => {
            return (
              <div
                key={idx}
                className={`min-h-[105px] p-1.5 flex flex-col transition group relative ${
                  !cell.isCurrentMonth
                    ? 'bg-slate-50/40 text-slate-400'
                    : cell.isToday
                    ? 'bg-indigo-50/30'
                    : 'bg-white hover:bg-slate-50/60'
                }`}
              >
                {/* Cell Header: Day Number + Quick Add */}
                <div className="flex items-center justify-between mb-1 px-0.5">
                  <span
                    className={`text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center ${
                      cell.isToday
                        ? 'bg-indigo-600 text-white font-bold'
                        : cell.isCurrentMonth
                        ? 'text-slate-800'
                        : 'text-slate-400'
                    }`}
                  >
                    {cell.dayNumber}
                  </span>

                  <button
                    onClick={() => onOpenNewWork(cell.dateStr)}
                    className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition"
                    title={`Add deliverable due on ${cell.dateStr}`}
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                {/* Project Pills inside Cell */}
                <div className="space-y-1 overflow-y-auto max-h-[85px] flex-1">
                  {cell.projects.map((p) => {
                    const dl = getDeadlineInfo(p);
                    const isUrgent = p.priority === 'Urgent';

                    let pillClass = 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100';
                    if (dl.isOverdue) {
                      pillClass = 'bg-rose-100 text-rose-800 border-rose-300 hover:bg-rose-200 font-bold';
                    } else if (dl.isDueToday) {
                      pillClass = 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200 font-bold';
                    } else if (dl.isCompleted) {
                      pillClass = 'bg-emerald-50 text-emerald-700 border-emerald-200 line-through opacity-75';
                    }

                    return (
                      <button
                        key={p.id}
                        onClick={() => onOpenWorkDetail(p.id)}
                        className={`w-full text-left px-1.5 py-0.5 rounded text-[10px] border truncate block transition cursor-pointer ${pillClass}`}
                        title={`${p.name} (${p.status}) - ${dl.text}`}
                      >
                        <span className="font-semibold">{isUrgent ? '🔥 ' : ''}{p.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
