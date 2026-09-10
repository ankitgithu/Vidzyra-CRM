import { WorkProject, ClientPayment, EditorPayment, Invoice, CalendarTask, Activity } from '../types';
import { getDeadlineInfo } from './deadlines';

/**
 * Safely converts any input into a canonical 'YYYY-MM-DD' string.
 * Handles null, undefined, timestamps, Date objects, Firebase Timestamps, and ISO strings.
 */
export function normalizeDateStr(val: unknown): string {
  if (!val) return '';
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed) return '';
    // If it already matches YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed;
    }
    // If it is an ISO string with T
    if (trimmed.includes('T')) {
      const part = trimmed.split('T')[0];
      if (/^\d{4}-\d{2}-\d{2}$/.test(part)) {
        return part;
      }
    }
    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) {
      const y = parsed.getFullYear();
      const m = String(parsed.getMonth() + 1).padStart(2, '0');
      const d = String(parsed.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
    return '';
  }

  if (typeof val === 'number') {
    const parsed = new Date(val);
    if (!isNaN(parsed.getTime())) {
      const y = parsed.getFullYear();
      const m = String(parsed.getMonth() + 1).padStart(2, '0');
      const d = String(parsed.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
    return '';
  }

  if (typeof val === 'object' && val !== null) {
    if (val instanceof Date && !isNaN(val.getTime())) {
      const y = val.getFullYear();
      const m = String(val.getMonth() + 1).padStart(2, '0');
      const d = String(val.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
    // Firebase Timestamp with toDate()
    if ('toDate' in val && typeof (val as any).toDate === 'function') {
      try {
        const d = (val as any).toDate();
        if (d instanceof Date && !isNaN(d.getTime())) {
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          return `${y}-${m}-${day}`;
        }
      } catch {
        return '';
      }
    }
    // Firebase Timestamp with seconds
    if ('seconds' in val && typeof (val as any).seconds === 'number') {
      const d = new Date((val as any).seconds * 1000);
      if (!isNaN(d.getTime())) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
      }
    }
  }

  return '';
}

/**
 * Format a date string safely without throwing errors on null or undefined.
 */
export function safeFormatDisplayDate(
  val: unknown,
  format: 'full' | 'short' | 'month-year' | 'day-header' = 'full'
): string {
  const norm = normalizeDateStr(val);
  if (!norm) return 'No Date';

  const parts = norm.split('-');
  if (parts.length < 3) return norm;

  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);

  const dateObj = new Date(y, m, d);
  if (isNaN(dateObj.getTime())) return norm;

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const shortMonthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const dayName = dayNames[dateObj.getDay()];
  const monthName = monthNames[m];
  const shortMonth = shortMonthNames[m];

  switch (format) {
    case 'full':
      return `${dayName}, ${d} ${monthName} ${y}`;
    case 'short':
      return `${d} ${shortMonth} ${y}`;
    case 'month-year':
      return `${monthName} ${y}`;
    case 'day-header':
      return `${dayName}, ${d} ${monthName}`;
    default:
      return `${d} ${monthName} ${y}`;
  }
}

/**
 * Returns today's canonical date string: 'YYYY-MM-DD'.
 */
export function getTodayDateStr(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export interface CalendarDayCell {
  date: Date;
  dateStr: string; // YYYY-MM-DD
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
}

/**
 * Generates the complete 7-column calendar grid for a given year & month (0-indexed).
 * Week starts on Monday.
 */
export function generateMonthGrid(year: number, month: number): CalendarDayCell[] {
  const todayStr = getTodayDateStr();
  const firstDay = new Date(year, month, 1);
  const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  // Convert JS Sunday-first day (0=Sun, 1=Mon, ..., 6=Sat) to Monday-first (0=Mon, ..., 6=Sun)
  const firstDayOfWeek = (firstDay.getDay() + 6) % 7;

  const cells: CalendarDayCell[] = [];

  // 1. Previous month trailing days
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const dayNum = daysInPrevMonth - i;
    const prevDate = new Date(year, month - 1, dayNum);
    const dateStr = normalizeDateStr(prevDate);
    const isWeekend = prevDate.getDay() === 0 || prevDate.getDay() === 6;
    cells.push({
      date: prevDate,
      dateStr,
      dayNumber: dayNum,
      isCurrentMonth: false,
      isToday: dateStr === todayStr,
      isWeekend,
    });
  }

  // 2. Current month days
  for (let dayNum = 1; dayNum <= daysInCurrentMonth; dayNum++) {
    const currentDate = new Date(year, month, dayNum);
    const dateStr = normalizeDateStr(currentDate);
    const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;
    cells.push({
      date: currentDate,
      dateStr,
      dayNumber: dayNum,
      isCurrentMonth: true,
      isToday: dateStr === todayStr,
      isWeekend,
    });
  }

  // 3. Next month leading days to complete the 35 or 42 grid
  const remainingCells = (7 - (cells.length % 7)) % 7;
  // If we only have 35 cells total and month needs 6 rows, pad to 42
  const targetTotal = cells.length + remainingCells <= 35 ? 35 : 42;
  const needToAdd = targetTotal - cells.length;

  for (let dayNum = 1; dayNum <= needToAdd; dayNum++) {
    const nextDate = new Date(year, month + 1, dayNum);
    const dateStr = normalizeDateStr(nextDate);
    const isWeekend = nextDate.getDay() === 0 || nextDate.getDay() === 6;
    cells.push({
      date: nextDate,
      dateStr,
      dayNumber: dayNum,
      isCurrentMonth: false,
      isToday: dateStr === todayStr,
      isWeekend,
    });
  }

  return cells;
}

export interface DayAggregatedData {
  dateStr: string;
  overdueProjects: WorkProject[];
  dueTodayProjects: WorkProject[];
  activeProjects: WorkProject[];
  revisionProjects: WorkProject[];
  payments: {
    clientPayments: ClientPayment[];
    editorPayments: EditorPayment[];
  };
  invoices: Invoice[];
  adminTasks: CalendarTask[];
  completedItems: {
    projects: WorkProject[];
    tasks: CalendarTask[];
  };
  activities: Activity[];
}

export interface DaySummaryCounts {
  overdueCount: number;
  dueCount: number;
  activeCount: number;
  revisionCount: number;
  paymentCount: number;
  invoiceCount: number;
  taskCount: number;
  completedCount: number;
  totalItems: number;
}

/**
 * Collects and groups all CRM records relevant to a specific target date string ('YYYY-MM-DD').
 */
export function aggregateDayData(
  targetDateStr: string,
  projects: WorkProject[],
  clientPayments: ClientPayment[],
  editorPayments: EditorPayment[],
  invoices: Invoice[],
  calendarTasks: CalendarTask[],
  activities: Activity[]
): DayAggregatedData {
  const todayStr = getTodayDateStr();
  const isTargetDateToday = targetDateStr === todayStr;

  // 1. Projects Breakdown
  const overdueProjects: WorkProject[] = [];
  const dueTodayProjects: WorkProject[] = [];
  const activeProjects: WorkProject[] = [];
  const revisionProjects: WorkProject[] = [];
  const completedProjects: WorkProject[] = [];

  projects.forEach((proj) => {
    const isCompleted =
      proj.status === 'Completed' ||
      proj.status === 'Approved' ||
      proj.status === 'Delivered';

    const projDueDateStr = normalizeDateStr(proj.deadline || proj.dueDate);
    const completedDateStr = normalizeDateStr(proj.completedAt || proj.approvedAt);

    // Completed on this target date
    if (isCompleted && completedDateStr === targetDateStr) {
      completedProjects.push(proj);
    }

    // Revisions relevant to this date
    const revReqDateStr = normalizeDateStr(proj.revisionRequestedDate);
    const revUpDateStr = normalizeDateStr(proj.revisionUploadedDate);
    const isRevisionActive =
      proj.revisionStatus === 'Revision Requested' ||
      proj.revisionStatus === 'Revision In Progress' ||
      proj.revisionStatus === 'Revision Uploaded';

    if (
      revReqDateStr === targetDateStr ||
      revUpDateStr === targetDateStr ||
      (isRevisionActive && projDueDateStr === targetDateStr)
    ) {
      revisionProjects.push(proj);
    }

    if (isCompleted) {
      // If completed, not overdue or due today
      return;
    }

    // Overdue evaluation
    // If target date is today: standard overdue check
    // If target date is a past or future date: check relative to target date
    const deadline = getDeadlineInfo(proj);
    if (isTargetDateToday) {
      if (deadline.isOverdue) {
        overdueProjects.push(proj);
        return;
      }
      if (deadline.isDueToday) {
        dueTodayProjects.push(proj);
        return;
      }
    } else {
      // For non-today dates: if this project's due date is the target date
      if (projDueDateStr === targetDateStr) {
        if (targetDateStr < todayStr && !isCompleted) {
          overdueProjects.push(proj);
        } else {
          dueTodayProjects.push(proj);
        }
        return;
      }
    }

    // Active project created or updated or assigned on this date
    const createdDateStr = normalizeDateStr(proj.createdAt);
    if (createdDateStr === targetDateStr && proj.status !== 'Pending') {
      activeProjects.push(proj);
    }
  });

  // 2. Payments on this date
  const targetClientPayments = clientPayments.filter((p) => {
    const pDate = normalizeDateStr(p.date || p.paymentDate || p.createdAt);
    return pDate === targetDateStr;
  });

  const targetEditorPayments = editorPayments.filter((p) => {
    const pDate = normalizeDateStr(p.date || p.paymentDate || p.createdAt);
    return pDate === targetDateStr;
  });

  // 3. Invoices on this date (issue date or due date)
  const targetInvoices = invoices.filter((inv) => {
    const invDueDate = normalizeDateStr(inv.dueDate);
    const invDate = normalizeDateStr(inv.date || inv.createdAt);
    return invDueDate === targetDateStr || invDate === targetDateStr;
  });

  // 4. Admin Tasks for this date
  const pendingTasks: CalendarTask[] = [];
  const completedTasks: CalendarTask[] = [];

  calendarTasks.forEach((task) => {
    const tDate = normalizeDateStr(task.date);
    if (tDate === targetDateStr) {
      if (task.status === 'Completed') {
        completedTasks.push(task);
      } else {
        pendingTasks.push(task);
      }
    }
  });

  // 5. Audit Activities for this date
  const targetActivities = activities.filter((act) => {
    const aDate = normalizeDateStr(act.when || act.timestamp);
    return aDate === targetDateStr;
  });

  return {
    dateStr: targetDateStr,
    overdueProjects,
    dueTodayProjects,
    activeProjects,
    revisionProjects,
    payments: {
      clientPayments: targetClientPayments,
      editorPayments: targetEditorPayments,
    },
    invoices: targetInvoices,
    adminTasks: pendingTasks,
    completedItems: {
      projects: completedProjects,
      tasks: completedTasks,
    },
    activities: targetActivities,
  };
}

/**
 * Computes small badge counts for a calendar cell to keep cells compact and clean.
 */
export function getDaySummaryCounts(data: DayAggregatedData): DaySummaryCounts {
  const overdueCount = data.overdueProjects.length;
  const dueCount = data.dueTodayProjects.length;
  const activeCount = data.activeProjects.length;
  const revisionCount = data.revisionProjects.length;
  const paymentCount = data.payments.clientPayments.length + data.payments.editorPayments.length;
  const invoiceCount = data.invoices.length;
  const taskCount = data.adminTasks.length;
  const completedCount = data.completedItems.projects.length + data.completedItems.tasks.length;

  const totalItems =
    overdueCount +
    dueCount +
    activeCount +
    revisionCount +
    paymentCount +
    invoiceCount +
    taskCount +
    completedCount;

  return {
    overdueCount,
    dueCount,
    activeCount,
    revisionCount,
    paymentCount,
    invoiceCount,
    taskCount,
    completedCount,
    totalItems,
  };
}
