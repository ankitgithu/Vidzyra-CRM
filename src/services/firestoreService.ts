import {
  collection,
  doc,
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
} as const;

// ==========================================
// REAL-TIME LISTENERS
// ==========================================

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
        items.push({ ...(docSnap.data() as Client), id: docSnap.id });
      });
      // Sort newest first
      items.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
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
        items.push({ ...(docSnap.data() as Editor), id: docSnap.id });
      });
      items.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
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
        items.push({ ...(docSnap.data() as WorkProject), id: docSnap.id });
      });
      items.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
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
        const item = { ...raw, id: docSnap.id };
        const category = raw.paymentCategory;

        if (category === 'editor' || (!category && raw.editorId && !raw.clientId)) {
          editorPays.push(item as EditorPayment);
        } else {
          clientPays.push(item as ClientPayment);
        }
      });

      clientPays.sort((a, b) => (b.createdAt || b.date || '').localeCompare(a.createdAt || a.date || ''));
      editorPays.sort((a, b) => (b.createdAt || b.date || '').localeCompare(a.createdAt || a.date || ''));

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
        items.push({ ...(docSnap.data() as Expense), id: docSnap.id });
      });
      items.sort((a, b) => (b.date || b.createdAt || '').localeCompare(a.date || a.createdAt || ''));
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
        items.push({ ...(docSnap.data() as NotificationItem), id: docSnap.id });
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
        items.push({ ...(docSnap.data() as Activity), id: docSnap.id });
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

// ==========================================
// CRUD MUTATIONS
// ==========================================

export async function createClientDoc(client: Client): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.CLIENTS, client.id);
    await setDoc(docRef, client);

    // Also register shared portal link token
    if (client.portalToken) {
      await setDoc(doc(db, COLLECTIONS.SHARED_LINKS, client.portalToken), {
        token: client.portalToken,
        type: 'client',
        targetId: client.id,
        isActive: client.portalStatus === 'Active',
        createdAt: client.createdAt || new Date().toISOString(),
      });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `${COLLECTIONS.CLIENTS}/${client.id}`);
    throw err;
  }
}

export async function updateClientDoc(id: string, updates: Partial<Client>): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.CLIENTS, id);
    await updateDoc(docRef, { ...updates, updatedAt: new Date().toISOString() });
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
    await setDoc(docRef, editor);

    // Also register shared portal link token
    if (editor.portalToken) {
      await setDoc(doc(db, COLLECTIONS.SHARED_LINKS, editor.portalToken), {
        token: editor.portalToken,
        type: 'editor',
        targetId: editor.id,
        isActive: editor.portalStatus === 'Active',
        createdAt: editor.createdAt || new Date().toISOString(),
      });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `${COLLECTIONS.EDITORS}/${editor.id}`);
    throw err;
  }
}

export async function updateEditorDoc(id: string, updates: Partial<Editor>): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.EDITORS, id);
    await updateDoc(docRef, { ...updates, updatedAt: new Date().toISOString() });
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
    await setDoc(docRef, project);
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `${COLLECTIONS.PROJECTS}/${project.id}`);
    throw err;
  }
}

export async function updateProjectDoc(id: string, updates: Partial<WorkProject>): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.PROJECTS, id);
    await updateDoc(docRef, { ...updates, updatedAt: new Date().toISOString() });
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
    await setDoc(docRef, payment);
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
    await updateDoc(docRef, { ...updates, updatedAt: new Date().toISOString() });
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
    await setDoc(docRef, expense);
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
    await setDoc(docRef, notif);
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
    await updateDoc(docRef, updates);
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
    await setDoc(docRef, act);
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `${COLLECTIONS.ACTIVITIES}/${act.id}`);
    throw err;
  }
}

export async function createRevisionDoc(rev: Record<string, unknown>): Promise<void> {
  try {
    const id = (rev.id as string) || `rev-${Date.now()}`;
    const docRef = doc(db, COLLECTIONS.REVISIONS, id);
    await setDoc(docRef, { ...rev, id, createdAt: new Date().toISOString() });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `${COLLECTIONS.REVISIONS}`);
    throw err;
  }
}

export async function saveSettingsDoc(settings: BusinessSettings): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.SETTINGS, 'business');
    await setDoc(docRef, settings, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `${COLLECTIONS.SETTINGS}/business`);
    throw err;
  }
}
