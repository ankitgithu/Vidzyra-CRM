import React, { useMemo } from 'react';
import { Plus } from 'lucide-react';
import {
  CalendarDayCell,
  generateMonthGrid,
  aggregateDayData,
  getDaySummaryCounts,
} from '../../utils/calendarUtils';
import { WorkProject, ClientPayment, EditorPayment, Invoice, CalendarTask, Activity } from '../../types';

interface CalendarMonthViewProps {
  currentYear: number;
  currentMonth: number; // 0-indexed (0 = Jan, 11 = Dec)
  selectedCategoryFilter: string; // 'all' | 'overdue' | 'due' | 'revisions' | 'payments' | 'tasks' | 'completed'
  projects: WorkProject[];
  clientPayments: ClientPayment[];
  editorPayments: EditorPayment[];
  invoices: Invoice[];
  calendarTasks: CalendarTask[];
  activities: Activity[];
  onSelectDay: (dateStr: string) => void;
  onQuickAddTask: (dateStr: string, e: React.MouseEvent) => void;
}

export const CalendarMonthView: React.FC<CalendarMonthViewProps> = ({
  currentYear,
  currentMonth,
  selectedCategoryFilter,
  projects,
  clientPayments,
  editorPayments,
  invoices,
  calendarTasks,
  activities,
  onSelectDay,
  onQuickAddTask,
}) => {
  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const gridCells: CalendarDayCell[] = useMemo(() => {
    return generateMonthGrid(currentYear, currentMonth);
  }, [currentYear, currentMonth]);

  // Precompute aggregated day data for each cell in the month grid for performance
  const aggregatedMap = useMemo(() => {
    const map = new Map<string, ReturnType<typeof aggregateDayData>>();
    gridCells.forEach((cell) => {
      if (!map.has(cell.dateStr)) {
        map.set(
          cell.dateStr,
          aggregateDayData(
            cell.dateStr,
            projects,
            clientPayments,
            editorPayments,
            invoices,
            calendarTasks,
            activities
          )
        );
      }
    });
    return map;
  }, [gridCells, projects, clientPayments, editorPayments, invoices, calendarTasks, activities]);

  return (
    <div
      id="calendar-month-grid-wrapper"
      className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden"
    >
      {/* Weekday Column Headers */}
      <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/90 text-center select-none">
        {daysOfWeek.map((day, idx) => (
          <div
            key={day}
            className={`py-2.5 text-xs font-semibold tracking-wider uppercase ${
              idx >= 5 ? 'text-slate-400' : 'text-slate-600'
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 divide-x divide-y divide-slate-100">
        {gridCells.map((cell) => {
          const dayData = aggregatedMap.get(cell.dateStr);
          const counts = dayData
            ? getDaySummaryCounts(dayData)
            : {
                overdueCount: 0,
                dueCount: 0,
                activeCount: 0,
                revisionCount: 0,
                paymentCount: 0,
                invoiceCount: 0,
                taskCount: 0,
                completedCount: 0,
                totalItems: 0,
              };

          // Check if matches category filter
          let matchesFilter = true;
          if (selectedCategoryFilter === 'overdue') matchesFilter = counts.overdueCount > 0;
          else if (selectedCategoryFilter === 'due') matchesFilter = counts.dueCount > 0;
          else if (selectedCategoryFilter === 'revisions') matchesFilter = counts.revisionCount > 0;
          else if (selectedCategoryFilter === 'payments') matchesFilter = counts.paymentCount > 0 || counts.invoiceCount > 0;
          else if (selectedCategoryFilter === 'tasks') matchesFilter = counts.taskCount > 0;
          else if (selectedCategoryFilter === 'completed') matchesFilter = counts.completedCount > 0;

          const isFaded = !cell.isCurrentMonth || (!matchesFilter && selectedCategoryFilter !== 'all');

          return (
            <div
              key={cell.dateStr}
              id={`calendar-cell-${cell.dateStr}`}
              onClick={() => onSelectDay(cell.dateStr)}
              className={`min-h-[105px] sm:min-h-[120px] p-2 flex flex-col justify-between cursor-pointer transition-colors relative group ${
                cell.isToday
                  ? 'bg-indigo-50/30'
                  : cell.isCurrentMonth
                  ? 'bg-white hover:bg-slate-50/80'
                  : 'bg-slate-50/40 hover:bg-slate-100/50'
              } ${isFaded ? 'opacity-35' : 'opacity-100'}`}
            >
              {/* Day Number Header */}
              <div className="flex items-center justify-between">
                <span
                  className={`inline-flex items-center justify-center text-xs font-semibold rounded-lg ${
                    cell.isToday
                      ? 'w-6 h-6 bg-indigo-600 text-white font-bold shadow-xs'
                      : cell.isCurrentMonth
                      ? 'text-slate-800 w-6 h-6'
                      : 'text-slate-400 w-6 h-6'
                  }`}
                >
                  {cell.dayNumber}
                </span>

                {/* Quick Add Task Button on Hover */}
                <button
                  type="button"
                  onClick={(e) => onQuickAddTask(cell.dateStr, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-md transition-all"
                  title="Quick add task for this day"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Badges / Compact Indicators Container */}
              <div className="space-y-1 mt-1.5 flex-1 overflow-hidden">
                {/* 1. Overdue indicator (red) */}
                {counts.overdueCount > 0 && (
                  <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-rose-50 border border-rose-200/80 text-rose-700 text-[10px] font-bold truncate shadow-2xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 flex-shrink-0 animate-pulse" />
                    <span className="truncate">{counts.overdueCount} Overdue</span>
                  </div>
                )}

                {/* 2. Due Today indicator (amber) */}
                {counts.dueCount > 0 && (
                  <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-50 border border-amber-200/80 text-amber-800 text-[10px] font-semibold truncate shadow-2xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                    <span className="truncate">{counts.dueCount} Due</span>
                  </div>
                )}

                {/* 3. Revisions (purple) */}
                {counts.revisionCount > 0 && (
                  <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-purple-50 border border-purple-200/80 text-purple-800 text-[10px] font-semibold truncate shadow-2xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500 flex-shrink-0" />
                    <span className="truncate">{counts.revisionCount} Rev</span>
                  </div>
                )}

                {/* 4. Admin Tasks (sky) */}
                {counts.taskCount > 0 && (
                  <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-sky-50 border border-sky-200/80 text-sky-800 text-[10px] font-semibold truncate shadow-2xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-500 flex-shrink-0" />
                    <span className="truncate">{counts.taskCount} Tasks</span>
                  </div>
                )}

                {/* 5. Payments / Invoices (emerald) */}
                {(counts.paymentCount > 0 || counts.invoiceCount > 0) && (
                  <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-[10px] font-semibold truncate shadow-2xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                    <span className="truncate">
                      {counts.paymentCount > 0 && `${counts.paymentCount} Pay`}
                      {counts.paymentCount > 0 && counts.invoiceCount > 0 && ' • '}
                      {counts.invoiceCount > 0 && `${counts.invoiceCount} Inv`}
                    </span>
                  </div>
                )}

                {/* 6. Completed items (slate) */}
                {counts.completedCount > 0 && (
                  <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-100 border border-slate-200/70 text-slate-600 text-[10px] font-medium truncate">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 flex-shrink-0" />
                    <span className="truncate">{counts.completedCount} Done</span>
                  </div>
                )}
              </div>

              {/* Bottom Dot for Today */}
              {cell.isToday && (
                <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-indigo-600" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
