import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  writeBatch,
  Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import {
  Client,
  Editor,
  WorkProject,
  ClientPayment,
  EditorPayment,
  Expense,
  Activity,
  NotificationItem,
  BusinessSettings,
  ChatMessage,
  Rating,
  Invoice,
  Receipt,
  BackupHistoryRecord,
  CalendarTask,
} from '../types';

export const COLLECTIONS = {
  CLIENTS: 'clients',
  EDITORS: 'editors',
  PROJECTS: 'projects',
  PAYMENTS: 'payments',
  EXPENSES: 'expenses',
  NOTIFICATIONS: 'notifications',
  ACTIVITIES: 'activities',
  REVISIONS: 'revisions',
  SETTINGS: 'settings',
  SHARED_LINKS: 'sharedLinks',
  CHAT_MESSAGES: 'chatMessages',
  RATINGS: 'ratings',
  INVOICES: 'invoices',
  RECEIPTS: 'receipts',
  ADMIN_USERS: 'adminUsers',
  BACKUP_HISTORY: 'backupHistory',
  CALENDAR_TASKS: 'calendarTasks',
} as const;

// ==========================================
// REAL-TIME LISTENERS (With Safe Date & Type Normalization)
// ==========================================

export function safeDateString(val: unknown): string {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'number') return new Date(val).toISOString();
  if (typeof val === 'object' && val !== null) {
    if ('toDate' in val && typeof (val as any).toDate === 'function') {
      try {
        return (val as any).toDate().toISOString();
      } catch {
        return '';
      }
    }
    if ('seconds' in val && typeof (val as any).seconds === 'number') {
      return new Date((val as any).seconds * 1000).toISOString();
    }
  }
  return String(val);
}

export function safeSortDesc(aDate: unknown, bDate: unknown): number {
  const sa = safeDateString(aDate);
  const sb = safeDateString(bDate);
  return sb.localeCompare(sa);
}

/**
 * Recursively strips undefined values from any Firestore payload
 * to guarantee that setDoc, updateDoc, and writeBatch never fail with
 * "Unsupported field value: undefined".
 */
export function cleanFirestoreData<T>(data: T): T {
  if (data === null || data === undefined) {
    return null as unknown as T;
  }
  if (Array.isArray(data)) {
    return data
      .filter((item) => item !== undefined)
      .map((item) => (typeof item === 'object' && item !== null ? cleanFirestoreData(item) : item)) as unknown as T;
  }
  if (typeof data === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(data as Record<string, any>)) {
      if (value !== undefined) {
        if (value !== null && typeof value === 'object') {
          cleaned[key] = cleanFirestoreData(value);
        } else {
          cleaned[key] = value;
        }
      }
    }
    return cleaned as T;
  }
  return data;
}

export function subscribeClients(
  onData: (clients: Client[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const colRef = collection(db, COLLECTIONS.CLIENTS);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: Client[] = [];
      snapshot.forEach((docSnap) => {
        const raw = docSnap.data();
        items.push({
          ...(raw as Client),
          id: docSnap.id,
          createdAt: safeDateString(raw.createdAt) || new Date().toISOString(),
        });
      });
      // Sort newest first
      items.sort((a, b) => safeSortDesc(a.createdAt, b.createdAt));
      onData(items);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, COLLECTIONS.CLIENTS);
      if (onError) onError(err);
    }
  );
}

export function subscribeEditors(
  onData: (editors: Editor[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const colRef = collection(db, COLLECTIONS.EDITORS);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: Editor[] = [];
      snapshot.forEach((docSnap) => {
        const raw = docSnap.data();
        items.push({
          ...(raw as Editor),
          id: docSnap.id,
          editorRate: Number(raw.editorRate) || 0,
          createdAt: safeDateString(raw.createdAt) || new Date().toISOString(),
        });
      });
      items.sort((a, b) => safeSortDesc(a.createdAt, b.createdAt));
      onData(items);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, COLLECTIONS.EDITORS);
      if (onError) onError(err);
    }
  );
}

export function subscribeProjects(
  onData: (projects: WorkProject[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const colRef = collection(db, COLLECTIONS.PROJECTS);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: WorkProject[] = [];
      snapshot.forEach((docSnap) => {
        const raw = docSnap.data();
        const quantity = Number(raw.quantity) || 1;
        const clientRate = Number(raw.clientRate) || 0;
        const totalBilling =
          typeof raw.totalBilling === 'number' && !isNaN(raw.totalBilling)
            ? raw.totalBilling
            : quantity * clientRate;
        const timeline = Array.isArray(raw.timeline) ? raw.timeline : [];

        const canonicalDriveUrl =
          raw.driveFolderUrl ||
          raw.userDownloadLink ||
          raw.clientUploadLink ||
          raw.userUploadLink ||
          raw.clientDownloadLink ||
          '';

        const normalizedClientId =
          raw.clientId ||
          raw.client_id ||
          (raw.client && typeof raw.client === 'object' ? raw.client.id : '') ||
          '';

        const normalizedAssignedTo =
          raw.assignedTo ||
          raw.editorId ||
          raw.assignedEditorId ||
          null;

        const normalizedEditorId =
          raw.editorId ||
          raw.assignedTo ||
          raw.assignedEditorId ||
          undefined;

        items.push({
          ...(raw as WorkProject),
          id: docSnap.id,
          clientId: normalizedClientId || raw.clientId,
          assignedTo: normalizedAssignedTo,
          editorId: normalizedEditorId,
          driveFolderUrl: canonicalDriveUrl,
          quantity,
          clientRate,
          editorRate: Number(raw.editorRate) || 0,
          totalBilling,
          timeline,
          createdAt: safeDateString(raw.createdAt) || new Date().toISOString(),
          dueDate: safeDateString(raw.dueDate) || raw.dueDate || '',
        });
      });
      items.sort((a, b) => safeSortDesc(a.createdAt, b.createdAt));
      onData(items);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, COLLECTIONS.PROJECTS);
      if (onError) onError(err);
    }
  );
}

export function subscribePayments(
  onData: (data: { clientPayments: ClientPayment[]; editorPayments: EditorPayment[] }) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const colRef = collection(db, COLLECTIONS.PAYMENTS);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const clientPays: ClientPayment[] = [];
      const editorPays: EditorPayment[] = [];

      snapshot.forEach((docSnap) => {
        const raw = docSnap.data();
        const category = raw.paymentCategory;
        const amount = Number(raw.amount) || 0;
        const date = safeDateString(raw.date || raw.paymentDate);
        const createdAt = safeDateString(raw.createdAt) || new Date().toISOString();

        const item = {
          ...raw,
          id: docSnap.id,
          amount,
          date,
          createdAt,
        };

        if (category === 'editor' || (!category && raw.editorId && !raw.clientId)) {
          editorPays.push(item as EditorPayment);
        } else {
          clientPays.push(item as ClientPayment);
        }
      });

      clientPays.sort((a, b) => safeSortDesc(a.createdAt || a.date, b.createdAt || b.date));
      editorPays.sort((a, b) => safeSortDesc(a.createdAt || a.date, b.createdAt || b.date));

      onData({ clientPayments: clientPays, editorPayments: editorPays });
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, COLLECTIONS.PAYMENTS);
      if (onError) onError(err);
    }
  );
}

export function subscribeExpenses(
  onData: (expenses: Expense[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const colRef = collection(db, COLLECTIONS.EXPENSES);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: Expense[] = [];
      snapshot.forEach((docSnap) => {
        const raw = docSnap.data();
        items.push({
          ...(raw as Expense),
          id: docSnap.id,
          amount: Number(raw.amount) || 0,
          date: safeDateString(raw.date),
          createdAt: safeDateString(raw.createdAt) || new Date().toISOString(),
        });
      });
      items.sort((a, b) => safeSortDesc(a.date || a.createdAt, b.date || b.createdAt));
      onData(items);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, COLLECTIONS.EXPENSES);
      if (onError) onError(err);
    }
  );
}

export function subscribeNotifications(
  onData: (notifs: NotificationItem[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const colRef = collection(db, COLLECTIONS.NOTIFICATIONS);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: NotificationItem[] = [];
      snapshot.forEach((docSnap) => {
        const raw = docSnap.data();
        let ts = Number(raw.timestamp) || 0;
        if (!ts && raw.createdAt) {
          ts = new Date(safeDateString(raw.createdAt)).getTime() || 0;
        }
        items.push({
          ...(raw as NotificationItem),
          id: docSnap.id,
          timestamp: ts,
          date: safeDateString(raw.date) || raw.date || '',
        });
      });
      // Sort newest timestamp first
      items.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      onData(items);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, COLLECTIONS.NOTIFICATIONS);
      if (onError) onError(err);
    }
  );
}

export function subscribeActivities(
  onData: (acts: Activity[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const colRef = collection(db, COLLECTIONS.ACTIVITIES);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: Activity[] = [];
      snapshot.forEach((docSnap) => {
        const raw = docSnap.data();
        let ts = Number(raw.timestamp) || 0;
        if (!ts && raw.when) {
          ts = new Date(safeDateString(raw.when)).getTime() || 0;
        }
        items.push({
          ...(raw as Activity),
          id: docSnap.id,
          timestamp: ts,
          when: safeDateString(raw.when) || String(raw.when || ''),
        });
      });
      items.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      onData(items);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, COLLECTIONS.ACTIVITIES);
      if (onError) onError(err);
    }
  );
}

export function subscribeSettings(
  onData: (settings: BusinessSettings | null) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const docRef = doc(db, COLLECTIONS.SETTINGS, 'business');
  return onSnapshot(
    docRef,
    (docSnap) => {
      if (docSnap.exists()) {
        onData(docSnap.data() as BusinessSettings);
      } else {
        onData(null);
      }
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, `${COLLECTIONS.SETTINGS}/business`);
      if (onError) onError(err);
    }
  );
}

export function subscribeChatMessages(
  onData: (messages: ChatMessage[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const q = query(collection(db, COLLECTIONS.CHAT_MESSAGES));
  return onSnapshot(
    q,
    (snapshot) => {
      const items: ChatMessage[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        items.push({
          id: d.id,
          projectId: data.projectId || data.workId || '',
          workId: data.workId || data.projectId || '',
          clientId: data.clientId || '',
          editorId: data.editorId || '',
          senderId: data.senderId || '',
          senderRole: data.senderRole || 'client',
          senderName: data.senderName || '',
          recipientId: data.recipientId || '',
          recipientRole: data.recipientRole || 'all',
          message: data.message || '',
          status: data.status || 'PENDING_ADMIN_REVIEW',
          moderationCategory: data.moderationCategory || '',
          createdAt: safeDateString(data.createdAt) || new Date().toISOString(),
          reviewedAt: data.reviewedAt ? safeDateString(data.reviewedAt) : undefined,
          reviewedByAdminId: data.reviewedByAdminId || undefined,
          rejectionReason: data.rejectionReason || undefined,
        });
      });
      // Sort chronologically ascending
      items.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      onData(items);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, COLLECTIONS.CHAT_MESSAGES);
      if (onError) onError(err);
    }
  );
}

export function subscribeCalendarTasks(
  onData: (tasks: CalendarTask[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const colRef = collection(db, COLLECTIONS.CALENDAR_TASKS);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: CalendarTask[] = [];
      snapshot.forEach((docSnap) => {
        const raw = docSnap.data();
        items.push({
          ...(raw as CalendarTask),
          id: docSnap.id,
          title: String(raw.title || ''),
          description: raw.description || '',
          date: safeDateString(raw.date).split('T')[0] || raw.date || '',
          time: raw.time || '',
          priority: (raw.priority || 'Medium') as CalendarTask['priority'],
          type: (raw.type || 'To-Do') as CalendarTask['type'],
          status: (raw.status || 'Pending') as CalendarTask['status'],
          createdAt: safeDateString(raw.createdAt) || new Date().toISOString(),
          updatedAt: raw.updatedAt ? safeDateString(raw.updatedAt) : undefined,
          createdBy: raw.createdBy || 'Admin',
        });
      });
      items.sort((a, b) => safeSortDesc(a.date || a.createdAt, b.date || b.createdAt));
      onData(items);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, COLLECTIONS.CALENDAR_TASKS);
      if (onError) onError(err);
    }
  );
}

// ==========================================
// CRUD MUTATIONS
// ==========================================

export async function createClientDoc(client: Client): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.CLIENTS, client.id);
    await setDoc(docRef, cleanFirestoreData(client), { merge: true });

    // Also register shared portal link token
    if (client.portalToken) {
      await setDoc(
        doc(db, COLLECTIONS.SHARED_LINKS, client.portalToken),
        cleanFirestoreData({
          token: client.portalToken,
          type: 'client',
          targetId: client.id,
          isActive: client.portalStatus === 'Active',
          createdAt: client.createdAt || new Date().toISOString(),
        }),
        { merge: true }
      );
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `${COLLECTIONS.CLIENTS}/${client.id}`);
    throw err;
  }
}

export async function updateClientDoc(id: string, updates: Partial<Client>): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.CLIENTS, id);
    const cleaned = cleanFirestoreData({ ...updates, updatedAt: new Date().toISOString() });
    await setDoc(docRef, cleaned, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `${COLLECTIONS.CLIENTS}/${id}`);
    throw err;
  }
}

export async function deleteClientDoc(id: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.CLIENTS, id);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${COLLECTIONS.CLIENTS}/${id}`);
    throw err;
  }
}

export async function createEditorDoc(editor: Editor): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.EDITORS, editor.id);
    await setDoc(docRef, cleanFirestoreData(editor), { merge: true });

    // Also register shared portal link token
    if (editor.portalToken) {
      await setDoc(
        doc(db, COLLECTIONS.SHARED_LINKS, editor.portalToken),
        cleanFirestoreData({
          token: editor.portalToken,
          type: 'editor',
          targetId: editor.id,
          isActive: editor.portalStatus === 'Active',
          createdAt: editor.createdAt || new Date().toISOString(),
        }),
        { merge: true }
      );
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `${COLLECTIONS.EDITORS}/${editor.id}`);
    throw err;
  }
}

export async function updateEditorDoc(id: string, updates: Partial<Editor>): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.EDITORS, id);
    const cleaned = cleanFirestoreData({ ...updates, updatedAt: new Date().toISOString() });
    await setDoc(docRef, cleaned, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `${COLLECTIONS.EDITORS}/${id}`);
    throw err;
  }
}

export async function deleteEditorDoc(id: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.EDITORS, id);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${COLLECTIONS.EDITORS}/${id}`);
    throw err;
  }
}

export async function createProjectDoc(project: WorkProject): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.PROJECTS, project.id);
    const resolvedEditor =
      project.assignedTo ||
      (project as any).editorId ||
      (project as any).assignedEditorId ||
      null;

    const payload = cleanFirestoreData({
      ...project,
      assignedTo: resolvedEditor,
      editorId: resolvedEditor || null,
      assignedEditorId: resolvedEditor || null,
      userDownloadLink: project.userDownloadLink || '',
      userUploadLink: project.userUploadLink || '',
      clientDownloadLink: project.clientDownloadLink || '',
      clientUploadLink: project.clientUploadLink || '',
      driveFolderUrl: project.driveFolderUrl || '',
      dueDate: project.dueDate || '',
      notes: project.notes || '',
    });
    await setDoc(docRef, payload, { merge: true });
    console.log('[Firestore] Successfully created project doc:', project.id);
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `${COLLECTIONS.PROJECTS}/${project.id}`);
    throw err;
  }
}

export async function updateProjectDoc(id: string, updates: Partial<WorkProject>): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.PROJECTS, id);
    const resolvedEditor =
      updates.assignedTo !== undefined
        ? updates.assignedTo
        : (updates as any).editorId !== undefined
        ? (updates as any).editorId
        : (updates as any).assignedEditorId !== undefined
        ? (updates as any).assignedEditorId
        : undefined;

    const payloadUpdates: any = { ...updates, updatedAt: new Date().toISOString() };
    if (resolvedEditor !== undefined) {
      payloadUpdates.assignedTo = resolvedEditor;
      payloadUpdates.editorId = resolvedEditor || null;
      payloadUpdates.assignedEditorId = resolvedEditor || null;
    }
    const cleaned = cleanFirestoreData(payloadUpdates);
    await setDoc(docRef, cleaned, { merge: true });
    console.log('[Firestore] Successfully updated project doc:', id);
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `${COLLECTIONS.PROJECTS}/${id}`);
    throw err;
  }
}

export async function deleteProjectDoc(id: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.PROJECTS, id);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${COLLECTIONS.PROJECTS}/${id}`);
    throw err;
  }
}

export async function createPaymentDoc(
  payment: (ClientPayment | EditorPayment) & { paymentCategory: 'client' | 'editor' }
): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.PAYMENTS, payment.id);
    await setDoc(docRef, cleanFirestoreData(payment), { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `${COLLECTIONS.PAYMENTS}/${payment.id}`);
    throw err;
  }
}

export async function updatePaymentDoc(
  id: string,
  updates: Partial<ClientPayment | EditorPayment>
): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.PAYMENTS, id);
    const cleaned = cleanFirestoreData({ ...updates, updatedAt: new Date().toISOString() });
    await setDoc(docRef, cleaned, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `${COLLECTIONS.PAYMENTS}/${id}`);
    throw err;
  }
}

export async function deletePaymentDoc(id: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.PAYMENTS, id);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${COLLECTIONS.PAYMENTS}/${id}`);
    throw err;
  }
}

export async function createExpenseDoc(expense: Expense): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.EXPENSES, expense.id);
    await setDoc(docRef, cleanFirestoreData(expense), { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `${COLLECTIONS.EXPENSES}/${expense.id}`);
    throw err;
  }
}

export async function deleteExpenseDoc(id: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.EXPENSES, id);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${COLLECTIONS.EXPENSES}/${id}`);
    throw err;
  }
}

export async function createNotificationDoc(notif: NotificationItem): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.NOTIFICATIONS, notif.id);
    await setDoc(docRef, cleanFirestoreData(notif), { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `${COLLECTIONS.NOTIFICATIONS}/${notif.id}`);
    throw err;
  }
}

export async function updateNotificationDoc(
  id: string,
  updates: Partial<NotificationItem>
): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.NOTIFICATIONS, id);
    const cleaned = cleanFirestoreData(updates);
    await setDoc(docRef, cleaned, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `${COLLECTIONS.NOTIFICATIONS}/${id}`);
    throw err;
  }
}

export async function deleteNotificationDoc(id: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.NOTIFICATIONS, id);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${COLLECTIONS.NOTIFICATIONS}/${id}`);
    throw err;
  }
}

export async function createActivityDoc(act: Activity): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.ACTIVITIES, act.id);
    await setDoc(docRef, cleanFirestoreData(act), { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `${COLLECTIONS.ACTIVITIES}/${act.id}`);
    throw err;
  }
}

export async function createRevisionDoc(rev: Record<string, unknown>): Promise<void> {
  try {
    const id = (rev.id as string) || `rev-${Date.now()}`;
    const docRef = doc(db, COLLECTIONS.REVISIONS, id);
    await setDoc(docRef, cleanFirestoreData({ ...rev, id, createdAt: new Date().toISOString() }), { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `${COLLECTIONS.REVISIONS}`);
    throw err;
  }
}

export async function saveSettingsDoc(settings: BusinessSettings): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.SETTINGS, 'business');
    await setDoc(docRef, cleanFirestoreData(settings), { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `${COLLECTIONS.SETTINGS}/business`);
    throw err;
  }
}

// ------------------------------------------
// Chat Message Mutations (Admin Moderated)
// ------------------------------------------

export async function createChatMessageDoc(msg: ChatMessage): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.CHAT_MESSAGES, msg.id);
    await setDoc(docRef, cleanFirestoreData(msg), { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `${COLLECTIONS.CHAT_MESSAGES}/${msg.id}`);
    throw err;
  }
}

export async function updateChatMessageDoc(
  id: string,
  updates: Partial<ChatMessage>
): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.CHAT_MESSAGES, id);
    const cleaned = cleanFirestoreData(updates);
    await setDoc(docRef, cleaned, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `${COLLECTIONS.CHAT_MESSAGES}/${id}`);
    throw err;
  }
}

export async function deleteChatMessageDoc(id: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.CHAT_MESSAGES, id);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${COLLECTIONS.CHAT_MESSAGES}/${id}`);
    throw err;
  }
}

export async function clearProjectChatMessages(
  projectId: string,
  currentMessages: ChatMessage[]
): Promise<void> {
  try {
    const toDelete = currentMessages.filter(
      (m) => m.projectId === projectId || m.workId === projectId
    );
    if (toDelete.length === 0) return;

    const batch = writeBatch(db);
    toDelete.forEach((msg) => {
      const docRef = doc(db, COLLECTIONS.CHAT_MESSAGES, msg.id);
      batch.delete(docRef);
    });
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${COLLECTIONS.CHAT_MESSAGES}?project=${projectId}`);
    throw err;
  }
}

// ------------------------------------------
// Ratings System (Client & Editor Ratings)
// ------------------------------------------

export function subscribeRatings(
  onData: (ratings: Rating[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const colRef = collection(db, COLLECTIONS.RATINGS);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: Rating[] = [];
      snapshot.forEach((docSnap) => {
        const raw = docSnap.data();
        items.push({
          ...(raw as Rating),
          id: docSnap.id,
          rating: Number(raw.rating) || 5,
          createdAt: safeDateString(raw.createdAt) || new Date().toISOString(),
        });
      });
      items.sort((a, b) => safeSortDesc(a.createdAt, b.createdAt));
      onData(items);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, COLLECTIONS.RATINGS);
      if (onError) onError(err);
    }
  );
}

export async function createRatingDoc(rating: Rating): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.RATINGS, rating.id);
    await setDoc(docRef, cleanFirestoreData(rating), { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `${COLLECTIONS.RATINGS}/${rating.id}`);
    throw err;
  }
}

// ------------------------------------------
// Invoices System
// ------------------------------------------

export function subscribeInvoices(
  onData: (invoices: Invoice[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const colRef = collection(db, COLLECTIONS.INVOICES);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: Invoice[] = [];
      snapshot.forEach((docSnap) => {
        const raw = docSnap.data();
        items.push({
          ...(raw as Invoice),
          id: docSnap.id,
          subtotal: Number(raw.subtotal) || 0,
          total: Number(raw.total) || 0,
          paidAmount: Number(raw.paidAmount) || 0,
          dueAmount: Number(raw.dueAmount) || 0,
          items: Array.isArray(raw.items) ? raw.items : [],
          createdAt: safeDateString(raw.createdAt) || new Date().toISOString(),
          date: safeDateString(raw.date) || raw.date || '',
          dueDate: safeDateString(raw.dueDate) || raw.dueDate || '',
        });
      });
      items.sort((a, b) => safeSortDesc(a.createdAt, b.createdAt));
      onData(items);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, COLLECTIONS.INVOICES);
      if (onError) onError(err);
    }
  );
}

export async function createInvoiceDoc(invoice: Invoice): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.INVOICES, invoice.id);
    await setDoc(docRef, cleanFirestoreData(invoice), { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `${COLLECTIONS.INVOICES}/${invoice.id}`);
    throw err;
  }
}

export async function updateInvoiceDoc(id: string, updates: Partial<Invoice>): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.INVOICES, id);
    await setDoc(docRef, cleanFirestoreData(updates), { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `${COLLECTIONS.INVOICES}/${id}`);
    throw err;
  }
}

export async function deleteInvoiceDoc(id: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.INVOICES, id);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${COLLECTIONS.INVOICES}/${id}`);
    throw err;
  }
}

// ------------------------------------------
// Receipts System
// ------------------------------------------

export function subscribeReceipts(
  onData: (receipts: Receipt[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const colRef = collection(db, COLLECTIONS.RECEIPTS);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: Receipt[] = [];
      snapshot.forEach((docSnap) => {
        const raw = docSnap.data();
        items.push({
          ...(raw as Receipt),
          id: docSnap.id,
          amountReceived: Number(raw.amountReceived) || 0,
          remainingBalance: Number(raw.remainingBalance) || 0,
          createdAt: safeDateString(raw.createdAt) || new Date().toISOString(),
          paymentDate: safeDateString(raw.paymentDate) || raw.paymentDate || '',
        });
      });
      items.sort((a, b) => safeSortDesc(a.createdAt, b.createdAt));
      onData(items);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, COLLECTIONS.RECEIPTS);
      if (onError) onError(err);
    }
  );
}

export async function createReceiptDoc(receipt: Receipt): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.RECEIPTS, receipt.id);
    await setDoc(docRef, cleanFirestoreData(receipt), { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `${COLLECTIONS.RECEIPTS}/${receipt.id}`);
    throw err;
  }
}

export async function deleteReceiptDoc(id: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.RECEIPTS, id);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${COLLECTIONS.RECEIPTS}/${id}`);
    throw err;
  }
}

// ------------------------------------------
// Backup History Metadata
// ------------------------------------------

export function subscribeBackupHistory(
  onData: (records: BackupHistoryRecord[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const colRef = collection(db, COLLECTIONS.BACKUP_HISTORY);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: BackupHistoryRecord[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ ...(docSnap.data() as BackupHistoryRecord), id: docSnap.id });
      });
      items.sort((a, b) => safeSortDesc(a.timestamp || a.createdAt, b.timestamp || b.createdAt));
      onData(items);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, COLLECTIONS.BACKUP_HISTORY);
      if (onError) onError(err);
    }
  );
}

export async function saveBackupHistoryDoc(record: BackupHistoryRecord): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.BACKUP_HISTORY, record.id);
    await setDoc(docRef, cleanFirestoreData(record), { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `${COLLECTIONS.BACKUP_HISTORY}/${record.id}`);
    throw err;
  }
}

export async function fetchBackupHistoryDocs(): Promise<BackupHistoryRecord[]> {
  try {
    const colRef = collection(db, COLLECTIONS.BACKUP_HISTORY);
    const snap = await getDocs(colRef);
    const items: BackupHistoryRecord[] = [];
    snap.forEach((docSnap) => {
      items.push({ ...(docSnap.data() as BackupHistoryRecord), id: docSnap.id });
    });
    items.sort((a, b) => safeSortDesc(a.timestamp || a.createdAt, b.timestamp || b.createdAt));
    return items;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, COLLECTIONS.BACKUP_HISTORY);
    return [];
  }
}

// ------------------------------------------
// Calendar Tasks
// ------------------------------------------

export async function createCalendarTaskDoc(task: CalendarTask): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.CALENDAR_TASKS, task.id);
    const cleaned = cleanFirestoreData({
      ...task,
      createdAt: task.createdAt || new Date().toISOString(),
    });
    await setDoc(docRef, cleaned, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `${COLLECTIONS.CALENDAR_TASKS}/${task.id}`);
    throw err;
  }
}

export async function updateCalendarTaskDoc(id: string, updates: Partial<CalendarTask>): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.CALENDAR_TASKS, id);
    const cleaned = cleanFirestoreData({
      ...updates,
      updatedAt: new Date().toISOString(),
    });
    await setDoc(docRef, cleaned, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `${COLLECTIONS.CALENDAR_TASKS}/${id}`);
    throw err;
  }
}

export async function deleteCalendarTaskDoc(id: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.CALENDAR_TASKS, id);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${COLLECTIONS.CALENDAR_TASKS}/${id}`);
    throw err;
  }
}

// ==========================================
// FULL DATABASE BACKUP & RESTORE UTILITIES
// ==========================================

export async function fetchAllDocumentsInCollection(collectionName: string): Promise<Record<string, any>[]> {
  try {
    const colRef = collection(db, collectionName);
    const snap = await getDocs(colRef);
    const items: Record<string, any>[] = [];
    snap.forEach((d) => {
      items.push({ ...d.data(), id: d.id });
    });
    return items;
  } catch (err) {
    console.warn(`[Firestore] Failed to read collection "${collectionName}":`, err);
    return [];
  }
}

export async function restoreDatabaseToFirestore(backupData: {
  clients?: Client[];
  editors?: Editor[];
  projects?: WorkProject[];
  payments?: (ClientPayment | EditorPayment)[];
  clientPayments?: ClientPayment[];
  editorPayments?: EditorPayment[];
  expenses?: Expense[];
  notifications?: NotificationItem[];
  activities?: Activity[];
  revisions?: any[];
  sharedLinks?: any[];
  chatMessages?: ChatMessage[];
  ratings?: Rating[];
  invoices?: Invoice[];
  receipts?: Receipt[];
  adminUsers?: any[];
  calendarTasks?: CalendarTask[];
  settings?: BusinessSettings;
}): Promise<void> {
  // 1. Collect all existing document IDs from all collections to delete them
  const collectionNames = Object.values(COLLECTIONS);
  const deleteDocRefs: Array<{ col: string; id: string }> = [];

  for (const colName of collectionNames) {
    try {
      const snap = await getDocs(collection(db, colName));
      snap.forEach((d) => {
        deleteDocRefs.push({ col: colName, id: d.id });
      });
    } catch (err) {
      console.warn(`[Restore] Error inspecting existing collection "${colName}":`, err);
    }
  }

  // 2. Prepare atomic operations
  type BatchOp = (batch: any) => void;
  const ops: BatchOp[] = [];

  // Deletions first
  for (const item of deleteDocRefs) {
    ops.push((batch) => {
      batch.delete(doc(db, item.col, item.id));
    });
  }

  // Restorations
  // Settings
  if (backupData.settings) {
    ops.push((batch) => {
      batch.set(doc(db, COLLECTIONS.SETTINGS, 'business'), cleanFirestoreData(backupData.settings));
    });
  }

  // Clients
  if (Array.isArray(backupData.clients)) {
    for (const client of backupData.clients) {
      if (!client.id) continue;
      ops.push((batch) => {
        batch.set(doc(db, COLLECTIONS.CLIENTS, client.id), cleanFirestoreData(client));
      });
      // Ensure shared link exists for portal access
      if (client.portalToken) {
        ops.push((batch) => {
          batch.set(
            doc(db, COLLECTIONS.SHARED_LINKS, client.portalToken),
            cleanFirestoreData({
              id: client.portalToken,
              token: client.portalToken,
              type: 'client',
              targetId: client.id,
              isActive: client.portalStatus === 'Active',
              createdAt: client.createdAt || new Date().toISOString(),
            })
          );
        });
      }
    }
  }

  // Editors
  if (Array.isArray(backupData.editors)) {
    for (const editor of backupData.editors) {
      if (!editor.id) continue;
      ops.push((batch) => {
        batch.set(doc(db, COLLECTIONS.EDITORS, editor.id), cleanFirestoreData(editor));
      });
      // Ensure shared link exists for portal access
      if (editor.portalToken) {
        ops.push((batch) => {
          batch.set(
            doc(db, COLLECTIONS.SHARED_LINKS, editor.portalToken),
            cleanFirestoreData({
              id: editor.portalToken,
              token: editor.portalToken,
              type: 'editor',
              targetId: editor.id,
              isActive: editor.portalStatus === 'Active',
              createdAt: editor.createdAt || new Date().toISOString(),
            })
          );
        });
      }
    }
  }

  // Projects
  if (Array.isArray(backupData.projects)) {
    for (const proj of backupData.projects) {
      if (!proj.id) continue;
      ops.push((batch) => {
        batch.set(doc(db, COLLECTIONS.PROJECTS, proj.id), cleanFirestoreData(proj));
      });
    }
  }

  // Payments (supports unified payments array or separate clientPayments/editorPayments)
  const allPayments: any[] = [];
  if (Array.isArray(backupData.payments)) {
    allPayments.push(...backupData.payments);
  }
  if (Array.isArray(backupData.clientPayments)) {
    for (const cp of backupData.clientPayments) {
      if (!allPayments.some((p) => p.id === cp.id)) {
        allPayments.push({ ...cp, paymentCategory: 'client' });
      }
    }
  }
  if (Array.isArray(backupData.editorPayments)) {
    for (const ep of backupData.editorPayments) {
      if (!allPayments.some((p) => p.id === ep.id)) {
        allPayments.push({ ...ep, paymentCategory: 'editor' });
      }
    }
  }

  for (const pay of allPayments) {
    if (!pay.id) continue;
    ops.push((batch) => {
      batch.set(doc(db, COLLECTIONS.PAYMENTS, pay.id), cleanFirestoreData(pay));
    });
  }

  // Expenses
  if (Array.isArray(backupData.expenses)) {
    for (const exp of backupData.expenses) {
      if (!exp.id) continue;
      ops.push((batch) => {
        batch.set(doc(db, COLLECTIONS.EXPENSES, exp.id), cleanFirestoreData(exp));
      });
    }
  }

  // Notifications
  if (Array.isArray(backupData.notifications)) {
    for (const notif of backupData.notifications) {
      if (!notif.id) continue;
      ops.push((batch) => {
        batch.set(doc(db, COLLECTIONS.NOTIFICATIONS, notif.id), cleanFirestoreData(notif));
      });
    }
  }

  // Activities
  if (Array.isArray(backupData.activities)) {
    for (const act of backupData.activities) {
      if (!act.id) continue;
      ops.push((batch) => {
        batch.set(doc(db, COLLECTIONS.ACTIVITIES, act.id), cleanFirestoreData(act));
      });
    }
  }

  // Revisions
  if (Array.isArray(backupData.revisions)) {
    for (const rev of backupData.revisions) {
      if (!rev.id) continue;
      ops.push((batch) => {
        batch.set(doc(db, COLLECTIONS.REVISIONS, rev.id), cleanFirestoreData(rev));
      });
    }
  }

  // Shared links
  if (Array.isArray(backupData.sharedLinks)) {
    for (const link of backupData.sharedLinks) {
      const linkId = link.id || link.token;
      if (!linkId) continue;
      ops.push((batch) => {
        batch.set(doc(db, COLLECTIONS.SHARED_LINKS, linkId), cleanFirestoreData(link));
      });
    }
  }

  // Chat messages
  if (Array.isArray(backupData.chatMessages)) {
    for (const msg of backupData.chatMessages) {
      if (!msg.id) continue;
      ops.push((batch) => {
        batch.set(doc(db, COLLECTIONS.CHAT_MESSAGES, msg.id), cleanFirestoreData(msg));
      });
    }
  }

  // Ratings
  if (Array.isArray(backupData.ratings)) {
    for (const rating of backupData.ratings) {
      if (!rating.id) continue;
      ops.push((batch) => {
        batch.set(doc(db, COLLECTIONS.RATINGS, rating.id), cleanFirestoreData(rating));
      });
    }
  }

  // Invoices
  if (Array.isArray(backupData.invoices)) {
    for (const inv of backupData.invoices) {
      if (!inv.id) continue;
      ops.push((batch) => {
        batch.set(doc(db, COLLECTIONS.INVOICES, inv.id), cleanFirestoreData(inv));
      });
    }
  }

  // Receipts
  if (Array.isArray(backupData.receipts)) {
    for (const rec of backupData.receipts) {
      if (!rec.id) continue;
      ops.push((batch) => {
        batch.set(doc(db, COLLECTIONS.RECEIPTS, rec.id), cleanFirestoreData(rec));
      });
    }
  }

  // Admin users
  if (Array.isArray(backupData.adminUsers)) {
    for (const admin of backupData.adminUsers) {
      if (!admin.id) continue;
      ops.push((batch) => {
        batch.set(doc(db, COLLECTIONS.ADMIN_USERS, admin.id), cleanFirestoreData(admin));
      });
    }
  }

  // Calendar tasks
  if (Array.isArray(backupData.calendarTasks)) {
    for (const task of backupData.calendarTasks) {
      if (!task.id) continue;
      ops.push((batch) => {
        batch.set(doc(db, COLLECTIONS.CALENDAR_TASKS, task.id), cleanFirestoreData(task));
      });
    }
  }

  // 3. Commit in safe batches of 350 (Firestore limit is 500)
  const CHUNK_SIZE = 350;
  for (let i = 0; i < ops.length; i += CHUNK_SIZE) {
    const chunk = ops.slice(i, i + CHUNK_SIZE);
    const batch = writeBatch(db);
    for (const op of chunk) {
      op(batch);
    }
    await batch.commit();
  }
}


