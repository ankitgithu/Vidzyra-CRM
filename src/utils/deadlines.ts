import { WorkProject, WorkStatus } from '../types';

export type DeadlineState =
  | 'No Deadline'
  | 'Upcoming'
  | 'Due Today'
  | 'Overdue'
  | 'Completed';

export interface DeadlineInfo {
  state: DeadlineState;
  text: string;
  diffDays: number;
  badgeClass: string;
  dotColor: string;
  isOverdue: boolean;
  isDueToday: boolean;
  isUpcoming: boolean;
  isCompleted: boolean;
  completedOnTime?: boolean;
}

/**
 * Calculates project deadline state based on dueDate, status, and current date.
 * If project is completed/approved before or on deadline, it must NOT remain marked overdue.
 */
export function getDeadlineInfo(project: WorkProject): DeadlineInfo {
  const isCompleted =
    project.status === 'Completed' ||
    project.status === 'Approved' ||
    project.status === 'Delivered';

  const effectiveDeadline = (project.deadline || project.dueDate || '').trim();

  if (!effectiveDeadline) {
    return {
      state: isCompleted ? 'Completed' : 'No Deadline',
      text: isCompleted ? 'Completed' : 'No Deadline',
      diffDays: 0,
      badgeClass: isCompleted
        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
        : 'bg-slate-100 text-slate-600 border-slate-200',
      dotColor: isCompleted ? 'bg-emerald-500' : 'bg-slate-400',
      isOverdue: false,
      isDueToday: false,
      isUpcoming: false,
      isCompleted,
    };
  }

  // Parse deadline (supports YYYY-MM-DD or ISO string)
  const dueParts = effectiveDeadline.split('T')[0].split('-');
  if (dueParts.length < 3) {
    return {
      state: isCompleted ? 'Completed' : 'No Deadline',
      text: isCompleted ? 'Completed' : 'No Deadline',
      diffDays: 0,
      badgeClass: 'bg-slate-100 text-slate-600 border-slate-200',
      dotColor: 'bg-slate-400',
      isOverdue: false,
      isDueToday: false,
      isUpcoming: false,
      isCompleted,
    };
  }

  const dueYear = parseInt(dueParts[0], 10);
  const dueMonth = parseInt(dueParts[1], 10) - 1;
  const dueDay = parseInt(dueParts[2], 10);

  const dueDate = new Date(dueYear, dueMonth, dueDay);

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Difference in calendar days
  const msPerDay = 1000 * 60 * 60 * 24;
  const diffTime = dueDate.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / msPerDay);

  // If completed: check whether it was completed on time or late
  if (isCompleted) {
    let completedDate = today;
    if (project.completedAt) {
      const cParts = project.completedAt.split('T')[0].split('-');
      if (cParts.length >= 3) {
        completedDate = new Date(
          parseInt(cParts[0], 10),
          parseInt(cParts[1], 10) - 1,
          parseInt(cParts[2], 10)
        );
      }
    } else if (project.approvedAt) {
      const aParts = project.approvedAt.split('T')[0].split('-');
      if (aParts.length >= 3) {
        completedDate = new Date(
          parseInt(aParts[0], 10),
          parseInt(aParts[1], 10) - 1,
          parseInt(aParts[2], 10)
        );
      }
    }

    const onTime = completedDate.getTime() <= dueDate.getTime();
    return {
      state: 'Completed',
      text: onTime ? 'Completed on time' : 'Completed (Past Deadline)',
      diffDays,
      badgeClass: onTime
        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
        : 'bg-teal-50 text-teal-700 border-teal-200',
      dotColor: 'bg-emerald-500',
      isOverdue: false,
      isDueToday: false,
      isUpcoming: false,
      isCompleted: true,
      completedOnTime: onTime,
    };
  }

  // Active / in-progress states
  if (diffDays < 0) {
    const overdueDays = Math.abs(diffDays);
    return {
      state: 'Overdue',
      text: overdueDays === 1 ? '1 day overdue' : `${overdueDays} days overdue`,
      diffDays,
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 font-semibold',
      dotColor: 'bg-rose-500',
      isOverdue: true,
      isDueToday: false,
      isUpcoming: false,
      isCompleted: false,
    };
  }

  if (diffDays === 0) {
    return {
      state: 'Due Today',
      text: 'Due Today',
      diffDays: 0,
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 font-semibold animate-pulse',
      dotColor: 'bg-amber-500',
      isOverdue: false,
      isDueToday: true,
      isUpcoming: false,
      isCompleted: false,
    };
  }

  if (diffDays === 1) {
    return {
      state: 'Upcoming',
      text: 'Due Tomorrow',
      diffDays: 1,
      badgeClass: 'bg-amber-50/70 text-amber-800 border-amber-200',
      dotColor: 'bg-amber-400',
      isOverdue: false,
      isDueToday: false,
      isUpcoming: true,
      isCompleted: false,
    };
  }

  return {
    state: 'Upcoming',
    text: `${diffDays} days left`,
    diffDays,
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    dotColor: 'bg-blue-500',
    isOverdue: false,
    isDueToday: false,
    isUpcoming: true,
    isCompleted: false,
  };
}

export interface DeadlineSummary {
  dueToday: number;
  upcoming: number;
  overdue: number;
  completedOnTime: number;
  completedLate: number;
  noDeadline: number;
  totalActive: number;
}

export function calculateDeadlineSummary(projects: WorkProject[]): DeadlineSummary {
  let dueToday = 0;
  let upcoming = 0;
  let overdue = 0;
  let completedOnTime = 0;
  let completedLate = 0;
  let noDeadline = 0;
  let totalActive = 0;

  for (const project of projects) {
    const info = getDeadlineInfo(project);
    if (info.isCompleted) {
      if (info.completedOnTime) {
        completedOnTime++;
      } else {
        completedLate++;
      }
    } else {
      totalActive++;
      if (info.isOverdue) overdue++;
      else if (info.isDueToday) dueToday++;
      else if (info.isUpcoming) upcoming++;
      else noDeadline++;
    }
  }

  return {
    dueToday,
    upcoming,
    overdue,
    completedOnTime,
    completedLate,
    noDeadline,
    totalActive,
  };
}
