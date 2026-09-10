import { WorkProject, Client, Editor, NotificationItem } from '../types';
import { getDeadlineInfo } from './deadlines';
import * as firestoreService from '../services/firestoreService';

/**
 * Checks all active projects for deadlines (Upcoming, Due Today, Overdue)
 * and generates automated notifications without duplicate spamming.
 */
export async function processDueReminders(
  projects: WorkProject[],
  clients: Client[],
  editors: Editor[],
  existingNotifications: NotificationItem[],
  onNewNotification?: (notification: NotificationItem) => void
): Promise<number> {
  const todayStr = new Date().toISOString().split('T')[0];
  let remindersCreated = 0;

  for (const project of projects) {
    // Only check active projects
    if (
      project.status === 'Completed' ||
      project.status === 'Approved' ||
      project.status === 'Delivered' ||
      project.status === 'Cancelled'
    ) {
      continue;
    }

    if (!project.deadline && !project.dueDate) continue;

    const info = getDeadlineInfo(project);
    if (info.state !== 'Due Today' && info.state !== 'Overdue' && info.state !== 'Upcoming') {
      continue;
    }

    // Only notify for upcoming if within 2 days
    if (info.state === 'Upcoming' && info.diffDays > 2) {
      continue;
    }

    const reminderKey = `due-reminder-${project.id}-${info.state}-${todayStr}`;

    // Check if reminder was already generated today for this project and state
    const alreadySentToday = existingNotifications.some((n) => {
      const isWork = n.relatedWorkId === project.id;
      const isDeadline = n.type === 'deadline' || n.type === 'work';
      const isToday = n.date === todayStr;
      const matchesState = n.message.toLowerCase().includes(info.state.toLowerCase());
      return isWork && isDeadline && isToday && matchesState;
    });

    if (alreadySentToday) {
      continue;
    }

    const client = clients.find((c) => c.id === project.clientId);
    const clientName = client ? client.name : 'Client';
    const editor = editors.find((e) => e.id === project.assignedTo || e.id === project.editorId);
    const editorName = editor ? editor.name : 'Unassigned';

    let actionRequired = 'Review project progress.';
    if (info.state === 'Overdue') {
      actionRequired = 'Immediate action required: Deliverable is past due date!';
    } else if (info.state === 'Due Today') {
      actionRequired = 'Action required: Complete and submit deliverable today.';
    } else if (info.state === 'Upcoming') {
      actionRequired = `Action required: Finalize work within ${info.diffDays} day${info.diffDays > 1 ? 's' : ''}.`;
    }

    const effectiveDeadline = project.deadline || project.dueDate;
    const message = `[${info.state.toUpperCase()}] Project "${project.name}" (ID: ${project.id}) for ${clientName}. Deadline: ${effectiveDeadline} (${info.text}). ${actionRequired}`;

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // 1. Notification for Admin
    const adminNotif: NotificationItem = {
      id: `notif-remind-admin-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type: 'deadline',
      message,
      recipientRole: 'admin',
      targetRole: 'admin',
      relatedWorkId: project.id,
      relatedClientId: project.clientId,
      relatedEditorId: project.assignedTo || undefined,
      date: todayStr,
      time: timeStr,
      timestamp: now.getTime(),
      read: false,
    };

    try {
      await firestoreService.createNotificationDoc(adminNotif);
      if (onNewNotification) onNewNotification(adminNotif);
      remindersCreated++;

      // 2. Notification for Assigned Editor (if assigned)
      if (project.assignedTo) {
        const editorNotif: NotificationItem = {
          id: `notif-remind-editor-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          type: 'deadline',
          message: `[${info.state.toUpperCase()}] Assigned Project "${project.name}" is ${info.text}. Deadline: ${effectiveDeadline}. ${actionRequired}`,
          recipientRole: 'editor',
          recipientId: project.assignedTo,
          targetRole: 'editor',
          relatedWorkId: project.id,
          relatedClientId: project.clientId,
          relatedEditorId: project.assignedTo,
          date: todayStr,
          time: timeStr,
          timestamp: now.getTime(),
          read: false,
        };
        await firestoreService.createNotificationDoc(editorNotif);
        if (onNewNotification) onNewNotification(editorNotif);
        remindersCreated++;
      }

      // Update project with reminder tracking
      await firestoreService.updateProjectDoc(project.id, {
        lastReminderState: info.state,
        lastReminderSentAt: now.toISOString(),
      });
    } catch (err) {
      console.warn('Failed to persist reminder notification:', err);
    }
  }

  return remindersCreated;
}
