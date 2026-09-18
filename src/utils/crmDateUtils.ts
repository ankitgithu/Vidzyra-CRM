/**
 * Consistent date and time formatting utilities for Vidzyra CRM
 */

export function formatWorkDate(dateString?: string, fallbackIso?: string): string {
  const target = dateString || fallbackIso;
  if (!target) return 'No Date';
  try {
    // Handle YYYY-MM-DD cleanly to avoid timezone day-shift issues
    if (/^\d{4}-\d{2}-\d{2}$/.test(target)) {
      const [year, month, day] = target.split('-').map(Number);
      const d = new Date(year, month - 1, day);
      return d.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    }

    const d = new Date(target);
    if (isNaN(d.getTime())) return target;

    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return target;
  }
}

export function getWorkSortTime(work: { createdAt?: string; workGivenDate?: string; dueDate?: string }): number {
  if (work.createdAt) {
    const t = new Date(work.createdAt).getTime();
    if (!isNaN(t)) return t;
  }
  if (work.workGivenDate) {
    const t = new Date(work.workGivenDate).getTime();
    if (!isNaN(t)) return t;
  }
  if (work.dueDate) {
    const t = new Date(work.dueDate).getTime();
    if (!isNaN(t)) return t;
  }
  return 0;
}
