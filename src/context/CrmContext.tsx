import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
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
  WorkStatus,
  PortalStatus,
  RevisionStatus,
  TimelineEvent,
} from '../types';
import { initialSettings } from '../mockData';
import * as firestoreService from '../services/firestoreService';

export interface CrmContextType {
  clients: Client[];
  editors: Editor[];
  projects: WorkProject[];
  clientPayments: ClientPayment[];
  editorPayments: EditorPayment[];
  expenses: Expense[];
  activities: Activity[];
  notifications: NotificationItem[];
  settings: BusinessSettings;

  // Real-time Database state
  isLoading: boolean;
  firestoreError: string | null;

  // Active view, search & navigation
  activeTab: string;
  setActiveTab: (tab: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedClientId: string | null;
  setSelectedClientId: (id: string | null) => void;
  selectedEditorId: string | null;
  setSelectedEditorId: (id: string | null) => void;
  selectedWorkId: string | null;
  setSelectedWorkId: (id: string | null, updateHistory?: boolean) => void;

  // Portal simulation / preview
  activePortalUser: { type: 'admin' | 'client' | 'editor'; id: string } | null;
  setActivePortalUser: (user: { type: 'admin' | 'client' | 'editor'; id: string } | null) => void;

  // Client CRUD
  addClient: (clientData: Omit<Client, 'id' | 'createdAt' | 'portalToken' | 'portalStatus'>) => Client;
  updateClient: (id: string, updates: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  setClientPortalStatus: (id: string, status: PortalStatus) => void;

  // Editor CRUD
  addEditor: (editorData: Omit<Editor, 'id' | 'createdAt' | 'portalToken' | 'portalStatus'>) => Editor;
  updateEditor: (id: string, updates: Partial<Editor>) => void;
  deleteEditor: (id: string) => void;
  setEditorPortalStatus: (id: string, status: PortalStatus) => void;

  // Work / Project CRUD
  addProject: (
    projectData: Omit<
      WorkProject,
      | 'id'
      | 'createdAt'
      | 'timeline'
      | 'revisionCount'
      | 'revisionStatus'
      | 'editorDownloadConfirmed'
      | 'editorUploadConfirmed'
      | 'clientUploadConfirmed'
      | 'clientDownloadConfirmed'
    >
  ) => WorkProject;
  updateProject: (id: string, updates: Partial<WorkProject>) => void;
  deleteProject: (id: string) => void;
  updateWorkLinks: (
    workId: string,
    links: {
      userDownloadLink?: string;
      userUploadLink?: string;
      clientDownloadLink?: string;
      clientUploadLink?: string;
      rawFileLink?: string;
      finalFileLink?: string;
      clientFolderLink?: string;
      editorFolderLink?: string;
    }
  ) => void;
  updateWorkStatus: (workId: string, newStatus: WorkStatus, updatedBy: string) => void;

  // Manual Confirmation Actions
  confirmAction: (
    workId: string,
    actionType: 'editor_download' | 'editor_upload' | 'client_upload' | 'client_download',
    confirmedBy: string
  ) => void;
  resetConfirmation: (
    workId: string,
    actionType: 'editor_download' | 'editor_upload' | 'client_upload' | 'client_download'
  ) => void;

  // Revision Workflow
  requestRevision: (workId: string, notes: string, requestedBy: string) => void;
  updateRevisionStatus: (workId: string, status: RevisionStatus, notes?: string) => void;

  // Review & Portal Completion Actions
  submitEditorCompletion: (workId: string, editorId: string, editorName?: string) => boolean;
  approveWork: (workId: string, clientName?: string) => boolean;
  submitClientRevision: (params: { workId: string; notes: string; timecode?: string; clientName?: string }) => boolean;
  submitClientDataUpload: (params: { workId: string; clientName?: string; notes?: string }) => boolean;
  updateProjectReview: (workId: string, reviewStatus: string, notes?: string, clientName?: string) => void;

  // Payments
  addClientPayment: (paymentData: Omit<ClientPayment, 'id' | 'receiptNumber' | 'createdAt'>) => ClientPayment;
  updateClientPayment: (id: string, updates: Partial<ClientPayment>) => ClientPayment | null;
  deleteClientPayment: (id: string) => void;
  addEditorPayment: (paymentData: Omit<EditorPayment, 'id' | 'receiptNumber' | 'createdAt'>) => EditorPayment;
  updateEditorPayment: (id: string, updates: Partial<EditorPayment>) => EditorPayment | null;
  deleteEditorPayment: (id: string) => void;

  // Expenses
  addExpense: (expenseData: Omit<Expense, 'id' | 'createdAt'>) => Expense;
  deleteExpense: (id: string) => void;

  // Notifications & Activities
  addNotification: (notif: Omit<NotificationItem, 'id' | 'date' | 'time' | 'timestamp' | 'read'> & { id?: string }) => NotificationItem;
  addNotifications: (items: (Omit<NotificationItem, 'id' | 'date' | 'time' | 'timestamp' | 'read'> & { id?: string })[]) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: (filter?: { role?: 'admin' | 'client' | 'editor'; id?: string }) => void;
  deleteNotification: (id: string) => void;
  clearAllNotifications: (filter?: { role?: 'admin' | 'client' | 'editor'; id?: string }) => void;
  addActivity: (activity: Omit<Activity, 'id' | 'timestamp' | 'when'>) => void;

  // Settings
  updateSettings: (newSettings: Partial<BusinessSettings>) => void;

  // Financial & Metric Calculations
  getFinancialPulse: () => {
    totalRevenue: number;
    totalClientBilling: number;
    totalPaymentsReceived: number;
    totalClientPaid: number;
    pendingPayments: number;
    clientPendingPayments: number;
    totalEditorCost: number;
    totalEditorPaid: number;
    editorPendingPayments: number;
    otherExpenses: number;
    totalExpenses: number;
    grossProfit: number;
    netProfit: number;
    realizedProfit: number;
  };

  financialMetrics: {
    totalRevenue: number;
    totalClientBilling: number;
    totalPaymentsReceived: number;
    totalClientPaid: number;
    pendingPayments: number;
    clientPendingPayments: number;
    totalEditorCost: number;
    totalEditorPaid: number;
    editorPendingPayments: number;
    otherExpenses: number;
    totalExpenses: number;
    grossProfit: number;
    netProfit: number;
    realizedProfit: number;
  };

  getClientStats: (clientId: string) => {
    totalWork: number;
    completed: number;
    pending: number;
    totalBilling: number;
    totalPaid: number;
    remaining: number;
    paymentStatus: 'Paid' | 'Partial' | 'Pending';
  };

  getEditorStats: (editorId: string) => {
    assignedWork: number;
    inProgress: number;
    completed: number;
    pending: number;
    totalCost: number;
    totalPaid: number;
    remaining: number;
    paymentStatus: 'Paid' | 'Partial' | 'Pending';
  };

  resetToDefaultData: () => void;
  resetToDemoData: () => void;
}

const CrmContext = createContext<CrmContextType | undefined>(undefined);

export const ROUTE_TO_TAB: Record<string, string> = {
  '/': 'dashboard',
  '/dashboard': 'dashboard',
  '/clients': 'clients',
  '/editors': 'editors',
  '/work': 'work',
  '/projects': 'work',
  '/payments': 'payments',
  '/reports': 'reports',
  '/data': 'datacenter',
  '/datacenter': 'datacenter',
  '/settings': 'settings',
};

export const TAB_TO_ROUTE: Record<string, string> = {
  dashboard: '/dashboard',
  clients: '/clients',
  editors: '/editors',
  work: '/work',
  payments: '/payments',
  reports: '/reports',
  datacenter: '/data',
  settings: '/settings',
};

export function getInitialWorkId(): string | null {
  if (typeof window === 'undefined') return null;
  const path = window.location.pathname;
  const match = path.match(/^\/(?:work|projects)\/([a-zA-Z0-9_-]+)/i);
  if (match && match[1]) {
    return match[1];
  }
  const hash = window.location.hash.replace(/^#\/?/, '');
  const hashMatch = hash.match(/^(?:work|projects)\/([a-zA-Z0-9_-]+)/i);
  if (hashMatch && hashMatch[1]) {
    return hashMatch[1];
  }
  try {
    const params = new URLSearchParams(window.location.search);
    const workParam = params.get('work') || params.get('workId') || params.get('project');
    if (workParam) {
      return workParam;
    }
  } catch {
    // ignore
  }
  return null;
}

export function getInitialTab(): string {
  if (typeof window === 'undefined') return 'dashboard';
  const path = window.location.pathname.toLowerCase().replace(/\/+$/, '') || '/';
  if (path.startsWith('/work/') || path.startsWith('/projects/')) {
    return 'work';
  }
  if (ROUTE_TO_TAB[path]) {
    return ROUTE_TO_TAB[path];
  }
  const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase();
  if (hash.startsWith('work/') || hash.startsWith('projects/')) {
    return 'work';
  }
  if (hash && ROUTE_TO_TAB['/' + hash]) {
    return ROUTE_TO_TAB['/' + hash];
  }
  try {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab') || params.get('page') || params.get('section');
    if (tabParam && ROUTE_TO_TAB['/' + tabParam.toLowerCase()]) {
      return ROUTE_TO_TAB['/' + tabParam.toLowerCase()];
    }
  } catch {
    // ignore
  }
  try {
    const savedTab = localStorage.getItem('vidzyra_crm_active_tab');
    if (
      savedTab &&
      ['dashboard', 'clients', 'editors', 'work', 'payments', 'reports', 'datacenter', 'settings'].includes(savedTab)
    ) {
      return savedTab;
    }
  } catch {
    // ignore
  }
  return 'dashboard';
}

export const CrmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Empty default database state - NO DEMO OR MOCK DATA
  const [clients, setClients] = useState<Client[]>([]);
  const [editors, setEditors] = useState<Editor[]>([]);
  const [projects, setProjects] = useState<WorkProject[]>([]);
  const [clientPayments, setClientPayments] = useState<ClientPayment[]>([]);
  const [editorPayments, setEditorPayments] = useState<EditorPayment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [settings, setSettings] = useState<BusinessSettings>(initialSettings);

  // Firestore status
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [firestoreError, setFirestoreError] = useState<string | null>(null);

  // UI state & navigation
  const [activeTab, setActiveTabState] = useState<string>(() => getInitialTab());
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedEditorId, setSelectedEditorId] = useState<string | null>(null);
  const [selectedWorkId, setSelectedWorkIdState] = useState<string | null>(() => getInitialWorkId());

  // Portal simulation state
  const [activePortalUser, setActivePortalUser] = useState<{
    type: 'admin' | 'client' | 'editor';
    id: string;
  } | null>(null);

  const setSelectedWorkId = (workId: string | null, updateHistory: boolean = true) => {
    setSelectedWorkIdState(workId);
    if (typeof window !== 'undefined' && updateHistory) {
      if (workId) {
        const targetRoute = `/work/${workId}`;
        try {
          if (window.location.pathname !== targetRoute) {
            window.history.pushState({ tab: activeTab, workId }, '', targetRoute);
          }
        } catch {
          // Ignore iframe error
        }
        try {
          window.location.hash = `work/${workId}`;
        } catch {
          // Ignore
        }
      } else {
        const targetRoute = TAB_TO_ROUTE[activeTab] || `/${activeTab}`;
        try {
          if (window.location.pathname.startsWith('/work/') || window.location.pathname.startsWith('/projects/')) {
            window.history.pushState({ tab: activeTab, workId: null }, '', targetRoute);
          }
        } catch {
          // Ignore
        }
        try {
          if (window.location.hash.startsWith('#work/') || window.location.hash.startsWith('work/')) {
            window.location.hash = activeTab;
          }
        } catch {
          // Ignore
        }
      }
    }
  };

  const setActiveTab = (tab: string) => {
    setActiveTabState(tab);
    try {
      localStorage.setItem('vidzyra_crm_active_tab', tab);
    } catch {
      // Ignore
    }
    if (typeof window !== 'undefined') {
      const targetRoute = TAB_TO_ROUTE[tab] || `/${tab}`;
      try {
        if (window.location.pathname !== targetRoute) {
          window.history.pushState({ tab, workId: null }, '', targetRoute);
        }
      } catch {
        // Ignore
      }
      try {
        if (window.location.hash.replace(/^#\/?/, '') !== tab) {
          window.location.hash = tab;
        }
      } catch {
        // Ignore
      }
    }
  };

  // Synchronize browser history & hash changes
  useEffect(() => {
    const handleRouteSync = (e?: Event) => {
      const tab = getInitialTab();
      setActiveTabState(tab);
      const popState = (e as PopStateEvent)?.state;
      let workId: string | null = null;
      if (popState && typeof popState === 'object' && 'workId' in popState) {
        workId = popState.workId;
      } else {
        workId = getInitialWorkId();
      }
      setSelectedWorkIdState(workId);
    };
    window.addEventListener('popstate', handleRouteSync);
    window.addEventListener('hashchange', handleRouteSync);
    return () => {
      window.removeEventListener('popstate', handleRouteSync);
      window.removeEventListener('hashchange', handleRouteSync);
    };
  }, [activeTab]);

  // ==========================================
  // REAL-TIME FIRESTORE SUBSCRIPTIONS
  // ==========================================
  useEffect(() => {
    let active = true;
    let initialCount = 0;
    const requiredFeeds = 8;

    const checkReady = () => {
      initialCount++;
      if (initialCount >= requiredFeeds && active) {
        setIsLoading(false);
      }
    };

    const unsubClients = firestoreService.subscribeClients(
      (data) => {
        if (active) {
          setClients(data);
          checkReady();
        }
      },
      (err) => {
        if (active) setFirestoreError(String(err));
      }
    );

    const unsubEditors = firestoreService.subscribeEditors(
      (data) => {
        if (active) {
          setEditors(data);
          checkReady();
        }
      },
      (err) => {
        if (active) setFirestoreError(String(err));
      }
    );

    const unsubProjects = firestoreService.subscribeProjects(
      (data) => {
        if (active) {
          setProjects(data);
          checkReady();
        }
      },
      (err) => {
        if (active) setFirestoreError(String(err));
      }
    );

    const unsubPayments = firestoreService.subscribePayments(
      (data) => {
        if (active) {
          setClientPayments(data.clientPayments);
          setEditorPayments(data.editorPayments);
          checkReady();
        }
      },
      (err) => {
        if (active) setFirestoreError(String(err));
      }
    );

    const unsubExpenses = firestoreService.subscribeExpenses(
      (data) => {
        if (active) {
          setExpenses(data);
          checkReady();
        }
      },
      (err) => {
        if (active) setFirestoreError(String(err));
      }
    );

    const unsubNotifications = firestoreService.subscribeNotifications(
      (data) => {
        if (active) {
          setNotifications(data);
          checkReady();
        }
      },
      (err) => {
        if (active) setFirestoreError(String(err));
      }
    );

    const unsubActivities = firestoreService.subscribeActivities(
      (data) => {
        if (active) {
          setActivities(data);
          checkReady();
        }
      },
      (err) => {
        if (active) setFirestoreError(String(err));
      }
    );

    const unsubSettings = firestoreService.subscribeSettings(
      (data) => {
        if (active) {
          if (data) {
            setSettings(data);
          } else {
            // First time setup: initialize business settings document in Firestore
            firestoreService.saveSettingsDoc(initialSettings).catch(() => {});
          }
          checkReady();
        }
      },
      (err) => {
        if (active) setFirestoreError(String(err));
      }
    );

    // Timeout safety fallback: don't block user interface indefinitely
    const timeout = setTimeout(() => {
      if (active && isLoading) {
        setIsLoading(false);
      }
    }, 2500);

    return () => {
      active = false;
      clearTimeout(timeout);
      unsubClients();
      unsubEditors();
      unsubProjects();
      unsubPayments();
      unsubExpenses();
      unsubNotifications();
      unsubActivities();
      unsubSettings();
    };
  }, []);

  // Helper to format date/time
  const getFormattedDateTime = () => {
    const d = new Date();
    const date = d.toISOString().split('T')[0];
    const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return { date, time, timestamp: d.getTime(), formatted: `${date} ${time}` };
  };

  // Helper to log activity
  const addActivity = useCallback((act: Omit<Activity, 'id' | 'timestamp' | 'when'>) => {
    const { formatted, timestamp } = getFormattedDateTime();
    const id = `act-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newAct: Activity = {
      ...act,
      id,
      when: formatted,
      timestamp,
    };
    // Optimistic update
    setActivities((prev) => [newAct, ...prev]);
    // Firestore write
    firestoreService.createActivityDoc(newAct).catch((err) => {
      console.error('Failed to write activity to Firestore:', err);
    });
  }, []);

  // Helper to add a single notification
  const addNotification = useCallback(
    (
      notif: Omit<NotificationItem, 'id' | 'date' | 'time' | 'timestamp' | 'read'> & { id?: string }
    ): NotificationItem => {
      const { date, time, timestamp } = getFormattedDateTime();
      const id = notif.id || `notif-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
      const recipientId =
        notif.recipientId ||
        (notif.targetRole === 'admin'
          ? 'admin'
          : notif.targetRole === 'client'
          ? notif.relatedClientId
          : notif.relatedEditorId || 'admin');
      const recipientRole = notif.recipientRole || notif.targetRole || 'admin';

      const newNotif: NotificationItem = {
        ...notif,
        id,
        recipientId,
        recipientRole,
        targetRole: notif.targetRole || recipientRole,
        date,
        time,
        timestamp,
        read: false,
      };

      setNotifications((prev) => {
        if (prev.some((n) => n.id === id)) return prev;
        return [newNotif, ...prev];
      });

      firestoreService.createNotificationDoc(newNotif).catch((err) => {
        console.error('Failed to write notification to Firestore:', err);
      });

      return newNotif;
    },
    []
  );

  // Helper to add multiple notifications atomically
  const addNotifications = useCallback(
    (items: (Omit<NotificationItem, 'id' | 'date' | 'time' | 'timestamp' | 'read'> & { id?: string })[]) => {
      if (!items || items.length === 0) return;
      const { date, time, timestamp } = getFormattedDateTime();

      const newItems: NotificationItem[] = items.map((notif, idx) => {
        const id = notif.id || `notif-${Date.now() + idx}-${Math.floor(Math.random() * 100000)}`;
        const recipientId =
          notif.recipientId ||
          (notif.targetRole === 'admin'
            ? 'admin'
            : notif.targetRole === 'client'
            ? notif.relatedClientId
            : notif.relatedEditorId || 'admin');
        const recipientRole = notif.recipientRole || notif.targetRole || 'admin';

        return {
          ...notif,
          id,
          recipientId,
          recipientRole,
          targetRole: notif.targetRole || recipientRole,
          date,
          time,
          timestamp: timestamp + idx,
          read: false,
        };
      });

      setNotifications((prev) => {
        const existingIds = new Set(prev.map((n) => n.id));
        const uniqueNew = newItems.filter((n) => !existingIds.has(n.id));
        if (uniqueNew.length === 0) return prev;
        return [...uniqueNew, ...prev];
      });

      newItems.forEach((n) => {
        firestoreService.createNotificationDoc(n).catch((err) => {
          console.error('Failed to write bulk notification to Firestore:', err);
        });
      });
    },
    []
  );

  // ==========================================
  // CLIENT OPERATIONS
  // ==========================================
  const addClient = (clientData: Omit<Client, 'id' | 'createdAt' | 'portalToken' | 'portalStatus'>): Client => {
    const id = `cli-${Date.now()}`;
    const token = `portal-client-${clientData.name.toLowerCase().replace(/[^a-z0-9]/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newClient: Client = {
      ...clientData,
      id,
      portalToken: token,
      portalStatus: 'Active',
      createdAt: new Date().toISOString(),
    };

    setClients((prev) => [newClient, ...prev]);
    firestoreService.createClientDoc(newClient).catch((err) => {
      console.error('Failed to create client in Firestore:', err);
    });

    addActivity({
      who: 'Admin',
      action: 'Client created',
      what: `Added client "${newClient.name}" (${newClient.clientType})`,
      entityType: 'client',
      entityId: id,
      clientId: id,
    });

    addNotification({
      type: 'work',
      message: `New client "${newClient.name}" was added`,
      relatedClientId: id,
    });

    return newClient;
  };

  const updateClient = (id: string, updates: Partial<Client>) => {
    setClients((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
    firestoreService.updateClientDoc(id, updates).catch((err) => {
      console.error('Failed to update client in Firestore:', err);
    });

    addActivity({
      who: 'Admin',
      action: 'Client edited',
      what: `Updated client details for "${updates.name || 'Client'}"`,
      entityType: 'client',
      entityId: id,
      clientId: id,
    });
  };

  const deleteClient = (id: string) => {
    const client = clients.find((c) => c.id === id);
    const clientName = client?.name || 'Client';

    setClients((prev) => prev.filter((c) => c.id !== id));
    if (selectedClientId === id) {
      setSelectedClientId(null);
    }
    firestoreService.deleteClientDoc(id).catch((err) => {
      console.error('Failed to delete client in Firestore:', err);
    });

    addActivity({
      who: 'Admin',
      action: 'Client deleted',
      what: `Client ${clientName} deleted by Admin.`,
      entityType: 'client',
      entityId: id,
    });

    addNotification({
      type: 'portal',
      message: `Client ${clientName} deleted by Admin.`,
      relatedClientId: id,
    });
  };

  const setClientPortalStatus = (id: string, status: PortalStatus) => {
    const client = clients.find((c) => c.id === id);
    if (!client) return;

    setClients((prev) => prev.map((c) => (c.id === id ? { ...c, portalStatus: status } : c)));
    firestoreService.updateClientDoc(id, { portalStatus: status }).catch((err) => {
      console.error('Failed to update client portal status in Firestore:', err);
    });

    const actionText =
      status === 'Deleted'
        ? 'Portal permanently deleted'
        : status === 'Inactive'
        ? 'Portal inactivated'
        : 'Portal activated';

    addActivity({
      who: 'Admin',
      action: actionText,
      what: `Client portal for "${client.name}" status: ${status}`,
      entityType: 'portal',
      entityId: id,
      clientId: id,
    });

    addNotification({
      type: 'portal',
      message: `Client portal for "${client.name}" status changed to ${status}`,
      relatedClientId: id,
    });
  };

  // ==========================================
  // EDITOR OPERATIONS
  // ==========================================
  const addEditor = (editorData: Omit<Editor, 'id' | 'createdAt' | 'portalToken' | 'portalStatus'>): Editor => {
    const id = `edt-${Date.now()}`;
    const token = `portal-editor-${editorData.name.toLowerCase().replace(/[^a-z0-9]/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newEditor: Editor = {
      ...editorData,
      id,
      portalToken: token,
      portalStatus: 'Active',
      createdAt: new Date().toISOString(),
    };

    setEditors((prev) => [newEditor, ...prev]);
    firestoreService.createEditorDoc(newEditor).catch((err) => {
      console.error('Failed to create editor in Firestore:', err);
    });

    addActivity({
      who: 'Admin',
      action: 'Editor created',
      what: `Added editor "${newEditor.name}" (Rate: ₹${newEditor.editorRate})`,
      entityType: 'editor',
      entityId: id,
      editorId: id,
    });

    addNotification({
      type: 'work',
      message: `New editor "${newEditor.name}" was registered`,
      relatedEditorId: id,
    });

    return newEditor;
  };

  const updateEditor = (id: string, updates: Partial<Editor>) => {
    setEditors((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates } : e)));
    firestoreService.updateEditorDoc(id, updates).catch((err) => {
      console.error('Failed to update editor in Firestore:', err);
    });

    addActivity({
      who: 'Admin',
      action: 'Editor edited',
      what: `Updated editor profile for "${updates.name || 'Editor'}"`,
      entityType: 'editor',
      entityId: id,
      editorId: id,
    });
  };

  const deleteEditor = (id: string) => {
    const editor = editors.find((e) => e.id === id);
    const editorName = editor?.name || 'Editor';

    setEditors((prev) => prev.filter((e) => e.id !== id));
    if (selectedEditorId === id) {
      setSelectedEditorId(null);
    }
    firestoreService.deleteEditorDoc(id).catch((err) => {
      console.error('Failed to delete editor in Firestore:', err);
    });

    // Unassign projects linked to this editor
    setProjects((prev) =>
      prev.map((p) => {
        if (p.assignedTo === id) {
          const updated = { ...p, assignedTo: null, workDoneBy: 'Me / Custom' as const };
          firestoreService.updateProjectDoc(p.id, { assignedTo: null, workDoneBy: 'Me / Custom' }).catch(() => {});
          return updated;
        }
        return p;
      })
    );

    addActivity({
      who: 'Admin',
      action: 'Editor deleted',
      what: `Editor ${editorName} deleted by Admin.`,
      entityType: 'editor',
      entityId: id,
    });

    addNotification({
      type: 'work',
      message: `Editor ${editorName} deleted by Admin.`,
      relatedEditorId: id,
    });
  };

  const setEditorPortalStatus = (id: string, status: PortalStatus) => {
    const editor = editors.find((e) => e.id === id);
    if (!editor) return;

    setEditors((prev) => prev.map((e) => (e.id === id ? { ...e, portalStatus: status } : e)));
    firestoreService.updateEditorDoc(id, { portalStatus: status }).catch((err) => {
      console.error('Failed to update editor portal status in Firestore:', err);
    });

    const actionText =
      status === 'Deleted'
        ? 'Portal permanently deleted'
        : status === 'Inactive'
        ? 'Portal inactivated'
        : 'Portal activated';

    addActivity({
      who: 'Admin',
      action: actionText,
      what: `Editor portal for "${editor.name}" status: ${status}`,
      entityType: 'portal',
      entityId: id,
      editorId: id,
    });

    addNotification({
      type: 'portal',
      message: `Editor portal for "${editor.name}" status changed to ${status}`,
      relatedEditorId: id,
    });
  };

  // ==========================================
  // PROJECT / WORK OPERATIONS
  // ==========================================
  const addProject = (
    projectData: Omit<
      WorkProject,
      | 'id'
      | 'createdAt'
      | 'timeline'
      | 'revisionCount'
      | 'revisionStatus'
      | 'editorDownloadConfirmed'
      | 'editorUploadConfirmed'
      | 'clientUploadConfirmed'
      | 'clientDownloadConfirmed'
    >
  ): WorkProject => {
    const id = `wrk-${Date.now()}`;
    const { date, time } = getFormattedDateTime();
    const client = clients.find((c) => c.id === projectData.clientId);
    const editor = editors.find((e) => e.id === projectData.assignedTo);

    const initialTimeline: TimelineEvent[] = [
      {
        id: `tm-${Date.now()}`,
        person: 'Admin',
        action: editor ? `Work created & assigned to ${editor.name}` : 'Work created',
        date,
        time,
        status: projectData.status,
      },
    ];

    const newProject: WorkProject = {
      ...projectData,
      id,
      clientUploadConfirmed: false,
      editorDownloadConfirmed: false,
      editorUploadConfirmed: false,
      clientDownloadConfirmed: false,
      revisionCount: 0,
      revisionStatus: 'No Revision',
      timeline: initialTimeline,
      createdAt: new Date().toISOString(),
    };

    setProjects((prev) => [newProject, ...prev]);
    firestoreService.createProjectDoc(newProject).catch((err) => {
      console.error('Failed to create project in Firestore:', err);
    });

    addActivity({
      who: 'Admin',
      action: 'Work created',
      what: `Created deliverable "${newProject.name}" for client "${client?.name || 'Client'}"`,
      entityType: 'work',
      entityId: id,
      clientId: projectData.clientId,
      editorId: projectData.assignedTo || undefined,
    });

    // Notify assigned editor
    if (projectData.assignedTo) {
      addNotification({
        type: 'work',
        message: `You were assigned a new project: "${newProject.name}"`,
        relatedWorkId: id,
        relatedClientId: projectData.clientId,
        relatedEditorId: projectData.assignedTo,
        recipientId: projectData.assignedTo,
        recipientRole: 'editor',
        targetRole: 'editor',
      });
    }

    return newProject;
  };

  const updateProject = (id: string, updates: Partial<WorkProject>) => {
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
    firestoreService.updateProjectDoc(id, updates).catch((err) => {
      console.error('Failed to update project in Firestore:', err);
    });
  };

  const deleteProject = (id: string) => {
    const project = projects.find((p) => p.id === id);
    const projectName = project?.name || 'Project';

    setProjects((prev) => prev.filter((p) => p.id !== id));
    if (selectedWorkId === id) {
      setSelectedWorkId(null);
    }
    firestoreService.deleteProjectDoc(id).catch((err) => {
      console.error('Failed to delete project in Firestore:', err);
    });

    addActivity({
      who: 'Admin',
      action: 'Work deleted',
      what: `Deliverable project "${projectName}" was deleted`,
      entityType: 'work',
      entityId: id,
      clientId: project?.clientId,
      editorId: project?.assignedTo || undefined,
    });
  };

  const updateWorkLinks = (
    workId: string,
    links: {
      userDownloadLink?: string;
      userUploadLink?: string;
      clientDownloadLink?: string;
      clientUploadLink?: string;
      rawFileLink?: string;
      finalFileLink?: string;
      clientFolderLink?: string;
      editorFolderLink?: string;
    }
  ) => {
    updateProject(workId, links);
  };

  const updateWorkStatus = (workId: string, newStatus: WorkStatus, updatedBy: string) => {
    const project = projects.find((p) => p.id === workId);
    if (!project) return;

    const { date, time } = getFormattedDateTime();
    const newTimelineItem: TimelineEvent = {
      id: `tm-${Date.now()}`,
      person: updatedBy,
      action: `Status changed to ${newStatus}`,
      date,
      time,
      status: newStatus,
    };

    const updates = {
      status: newStatus,
      timeline: [...project.timeline, newTimelineItem],
    };

    updateProject(workId, updates);

    addActivity({
      who: updatedBy,
      action: 'Status updated',
      what: `Updated status for "${project.name}" to "${newStatus}"`,
      entityType: 'work',
      entityId: workId,
      clientId: project.clientId,
      editorId: project.assignedTo || undefined,
    });
  };

  const confirmAction = (
    workId: string,
    actionType: 'editor_download' | 'editor_upload' | 'client_upload' | 'client_download',
    confirmedBy: string
  ) => {
    const project = projects.find((p) => p.id === workId);
    if (!project) return;

    const { date, time, formatted } = getFormattedDateTime();
    let actionLabel = '';
    const fieldUpdates: Partial<WorkProject> = {};

    if (actionType === 'editor_download') {
      fieldUpdates.editorDownloadConfirmed = true;
      fieldUpdates.editorDownloadConfirmedAt = formatted;
      actionLabel = 'Editor downloaded raw files';
    } else if (actionType === 'editor_upload') {
      fieldUpdates.editorUploadConfirmed = true;
      fieldUpdates.editorUploadConfirmedAt = formatted;
      actionLabel = 'Editor uploaded final files';
    } else if (actionType === 'client_upload') {
      fieldUpdates.clientUploadConfirmed = true;
      fieldUpdates.clientUploadConfirmedAt = formatted;
      actionLabel = 'Raw data uploaded by client';
    } else if (actionType === 'client_download') {
      fieldUpdates.clientDownloadConfirmed = true;
      fieldUpdates.clientDownloadConfirmedAt = formatted;
      actionLabel = 'Client downloaded deliverables';
    }

    const newTimelineItem: TimelineEvent = {
      id: `tm-${Date.now()}`,
      person: confirmedBy,
      action: actionLabel,
      date,
      time,
      status: project.status,
    };

    fieldUpdates.timeline = [...project.timeline, newTimelineItem];
    updateProject(workId, fieldUpdates);

    addActivity({
      who: confirmedBy,
      action: actionLabel,
      what: `${confirmedBy} confirmed: ${actionLabel} on "${project.name}"`,
      entityType: 'work',
      entityId: workId,
      clientId: project.clientId,
      editorId: project.assignedTo || undefined,
    });
  };

  const resetConfirmation = (
    workId: string,
    actionType: 'editor_download' | 'editor_upload' | 'client_upload' | 'client_download'
  ) => {
    const fieldUpdates: Partial<WorkProject> = {};
    if (actionType === 'editor_download') {
      fieldUpdates.editorDownloadConfirmed = false;
      fieldUpdates.editorDownloadConfirmedAt = undefined;
    } else if (actionType === 'editor_upload') {
      fieldUpdates.editorUploadConfirmed = false;
      fieldUpdates.editorUploadConfirmedAt = undefined;
    } else if (actionType === 'client_upload') {
      fieldUpdates.clientUploadConfirmed = false;
      fieldUpdates.clientUploadConfirmedAt = undefined;
    } else if (actionType === 'client_download') {
      fieldUpdates.clientDownloadConfirmed = false;
      fieldUpdates.clientDownloadConfirmedAt = undefined;
    }
    updateProject(workId, fieldUpdates);
  };

  const requestRevision = (workId: string, notes: string, requestedBy: string) => {
    submitClientRevision({ workId, notes, clientName: requestedBy });
  };

  const updateRevisionStatus = (workId: string, status: RevisionStatus, notes?: string) => {
    const project = projects.find((p) => p.id === workId);
    if (!project) return;

    const { date, time, formatted } = getFormattedDateTime();
    const newTimelineItem: TimelineEvent = {
      id: `tm-${Date.now()}`,
      person: 'System/Admin',
      action: `Revision status: ${status}`,
      date,
      time,
      status: status === 'Revision Completed' ? 'Completed' : project.status,
    };

    const updates: Partial<WorkProject> = {
      revisionStatus: status,
      revisionCompletedDate: status === 'Revision Completed' ? formatted : project.revisionCompletedDate,
      revisionUploadedDate: status === 'Revision Uploaded' ? formatted : project.revisionUploadedDate,
      revisionNotes: notes || project.revisionNotes,
      status: status === 'Revision Completed' ? 'Completed' : project.status,
      timeline: [...project.timeline, newTimelineItem],
    };

    updateProject(workId, updates);

    addActivity({
      who: 'Admin',
      action: 'Revision status updated',
      what: `Revision status on "${project.name}" updated to "${status}"`,
      entityType: 'revision',
      entityId: workId,
      clientId: project.clientId,
      editorId: project.assignedTo || undefined,
    });
  };

  // 1. Editor marks project complete -> Notify Admin, Client
  const submitEditorCompletion = (workId: string, editorId: string, editorName?: string): boolean => {
    const project = projects.find((p) => p.id === workId);
    if (!project) return false;

    const editorObj = editors.find((e) => e.id === editorId);
    const resolvedEditorName = editorName || editorObj?.name || 'Assigned Editor';
    const { date, time, formatted } = getFormattedDateTime();

    const newTimelineItem: TimelineEvent = {
      id: `tm-${Date.now()}`,
      person: resolvedEditorName,
      action: 'Work marked as complete & submitted for client review',
      date,
      time,
      status: 'Completed',
    };

    const updates: Partial<WorkProject> = {
      status: 'Completed',
      editorUploadConfirmed: true,
      editorUploadConfirmedAt: project.editorUploadConfirmedAt || formatted,
      reviewStatus: 'Awaiting Client Review',
      timeline: [...project.timeline, newTimelineItem],
    };

    updateProject(workId, updates);

    addActivity({
      who: resolvedEditorName,
      action: 'Work completed',
      what: `${resolvedEditorName} marked "${project.name}" as complete`,
      entityType: 'work',
      entityId: workId,
      clientId: project.clientId,
      editorId: project.assignedTo || editorId,
    });

    // Notify: Admin and Client
    const notifs: (Omit<NotificationItem, 'id' | 'date' | 'time' | 'timestamp' | 'read'> & { id?: string })[] = [
      {
        id: `notif-${Date.now()}-adm`,
        type: 'work',
        message: `${resolvedEditorName} marked "${project.name}" as complete.`,
        relatedWorkId: workId,
        relatedClientId: project.clientId,
        relatedEditorId: project.assignedTo || editorId,
        recipientId: 'admin',
        recipientRole: 'admin',
        targetRole: 'admin',
      },
      {
        id: `notif-${Date.now() + 1}-cli`,
        type: 'work',
        message: `${resolvedEditorName} submitted "${project.name}" for review.`,
        relatedWorkId: workId,
        relatedClientId: project.clientId,
        relatedEditorId: project.assignedTo || editorId,
        recipientId: project.clientId,
        recipientRole: 'client',
        targetRole: 'client',
      },
    ];

    addNotifications(notifs);
    return true;
  };

  // 2. Client approves a project -> Notify Admin, Assigned Editor
  const approveWork = (workId: string, clientName?: string): boolean => {
    const project = projects.find((p) => p.id === workId);
    if (!project) return false;
    if (project.status === 'Approved' || project.reviewStatus === 'Approved') return true;

    const clientObj = clients.find((c) => c.id === project.clientId);
    const resolvedClientName = clientName || clientObj?.name || 'Client';
    const { date, time, formatted } = getFormattedDateTime();

    const newTimelineItem: TimelineEvent = {
      id: `tm-${Date.now()}`,
      person: resolvedClientName,
      action: 'Deliverable approved by client',
      date,
      time,
      status: 'Approved',
    };

    const updates: Partial<WorkProject> = {
      status: 'Approved',
      reviewStatus: 'Approved',
      reviewNotes: 'Deliverable approved by client.',
      approvedAt: formatted,
      approvedBy: resolvedClientName,
      timeline: [...project.timeline, newTimelineItem],
    };

    updateProject(workId, updates);

    addActivity({
      who: resolvedClientName,
      action: 'Work approved',
      what: `${resolvedClientName} approved "${project.name}"`,
      entityType: 'work',
      entityId: workId,
      clientId: project.clientId,
      editorId: project.assignedTo || undefined,
    });

    // Notify: Admin and Assigned Editor
    const notifs: (Omit<NotificationItem, 'id' | 'date' | 'time' | 'timestamp' | 'read'> & { id?: string })[] = [
      {
        id: `notif-${Date.now()}-adm`,
        type: 'work',
        message: `${resolvedClientName} approved ${project.name}.`,
        relatedWorkId: workId,
        relatedClientId: project.clientId,
        relatedEditorId: project.assignedTo || undefined,
        recipientId: 'admin',
        recipientRole: 'admin',
        targetRole: 'admin',
      },
    ];

    if (project.assignedTo) {
      notifs.push({
        id: `notif-${Date.now() + 1}-edt`,
        type: 'work',
        message: `${resolvedClientName} approved ${project.name}.`,
        relatedWorkId: workId,
        relatedClientId: project.clientId,
        relatedEditorId: project.assignedTo,
        recipientId: project.assignedTo,
        recipientRole: 'editor',
        targetRole: 'editor',
      });
    }

    addNotifications(notifs);
    return true;
  };

  // 3. Client requests revision -> Notify Admin, Assigned Editor
  const submitClientRevision = (params: {
    workId: string;
    notes: string;
    timecode?: string;
    clientName?: string;
  }): boolean => {
    const { workId, notes, timecode, clientName } = params;
    const project = projects.find((p) => p.id === workId);
    if (!project) return false;

    const clientObj = clients.find((c) => c.id === project.clientId);
    const resolvedClientName = clientName || clientObj?.name || 'Client';
    const { date, time, formatted } = getFormattedDateTime();

    const formattedRevisionNotes =
      timecode && timecode.trim() ? `[${timecode.trim()}] ${notes.trim()}` : notes.trim();

    const newTimelineItem: TimelineEvent = {
      id: `tm-${Date.now()}`,
      person: resolvedClientName,
      action: `Revision requested${timecode ? ` at ${timecode}` : ''}: "${notes.trim()}"`,
      date,
      time,
      status: 'Revision Required',
    };

    const updates: Partial<WorkProject> = {
      status: 'Revision Required',
      revisionCount: (project.revisionCount || 0) + 1,
      revisionStatus: 'Revision Requested',
      revisionRequestedDate: formatted,
      revisionNotes: formattedRevisionNotes,
      revisionTimecode: timecode?.trim() || undefined,
      reviewStatus: 'Revision Required',
      reviewNotes: formattedRevisionNotes,
      editorUploadConfirmed: false,
      timeline: [...project.timeline, newTimelineItem],
    };

    updateProject(workId, updates);

    // Write to Firestore revisions collection
    firestoreService.createRevisionDoc({
      projectId: workId,
      workId,
      clientId: project.clientId,
      editorId: project.assignedTo || null,
      notes: formattedRevisionNotes,
      timecode: timecode?.trim() || null,
      status: 'Pending',
    }).catch(() => {});

    addActivity({
      who: resolvedClientName,
      action: 'Revision requested',
      what: `${resolvedClientName} requested a revision for "${project.name}"`,
      entityType: 'revision',
      entityId: workId,
      clientId: project.clientId,
      editorId: project.assignedTo || undefined,
    });

    // Notify: Admin and Assigned Editor
    const notifs: (Omit<NotificationItem, 'id' | 'date' | 'time' | 'timestamp' | 'read'> & { id?: string })[] = [
      {
        id: `notif-${Date.now()}-adm`,
        type: 'revision',
        message: `${resolvedClientName} requested a revision for ${project.name}.`,
        relatedWorkId: workId,
        relatedClientId: project.clientId,
        relatedEditorId: project.assignedTo || undefined,
        recipientId: 'admin',
        recipientRole: 'admin',
        targetRole: 'admin',
      },
    ];

    if (project.assignedTo) {
      notifs.push({
        id: `notif-${Date.now() + 1}-edt`,
        type: 'revision',
        message: `${resolvedClientName} requested a revision for ${project.name}.`,
        relatedWorkId: workId,
        relatedClientId: project.clientId,
        relatedEditorId: project.assignedTo,
        recipientId: project.assignedTo,
        recipientRole: 'editor',
        targetRole: 'editor',
      });
    }

    addNotifications(notifs);
    return true;
  };

  // 4. Client uploads data -> Notify Admin, Assigned Editor if one exists (if no editor: notify Admin only)
  const submitClientDataUpload = (params: {
    workId: string;
    clientName?: string;
    notes?: string;
  }): boolean => {
    const { workId, clientName, notes } = params;
    const project = projects.find((p) => p.id === workId);
    if (!project) return false;

    const clientObj = clients.find((c) => c.id === project.clientId);
    const resolvedClientName = clientName || clientObj?.name || 'Client';
    const { date, time, formatted } = getFormattedDateTime();

    const newTimelineItem: TimelineEvent = {
      id: `tm-${Date.now()}`,
      person: resolvedClientName,
      action: notes ? `Raw data uploaded: ${notes}` : 'Raw data uploaded by client',
      date,
      time,
      status: project.status,
    };

    const updates: Partial<WorkProject> = {
      clientUploadConfirmed: true,
      clientUploadConfirmedAt: formatted,
      timeline: [...project.timeline, newTimelineItem],
    };

    updateProject(workId, updates);

    addActivity({
      who: resolvedClientName,
      action: 'Data uploaded',
      what: `${resolvedClientName} uploaded data for "${project.name}"`,
      entityType: 'work',
      entityId: workId,
      clientId: project.clientId,
      editorId: project.assignedTo || undefined,
    });

    // Notify: Admin, and Assigned Editor if one exists
    const notifs: (Omit<NotificationItem, 'id' | 'date' | 'time' | 'timestamp' | 'read'> & { id?: string })[] = [
      {
        id: `notif-${Date.now()}-adm`,
        type: 'confirmation',
        message: `${resolvedClientName} uploaded data for ${project.name}.`,
        relatedWorkId: workId,
        relatedClientId: project.clientId,
        relatedEditorId: project.assignedTo || undefined,
        recipientId: 'admin',
        recipientRole: 'admin',
        targetRole: 'admin',
      },
    ];

    if (project.assignedTo) {
      notifs.push({
        id: `notif-${Date.now() + 1}-edt`,
        type: 'confirmation',
        message: `${resolvedClientName} uploaded data for ${project.name}.`,
        relatedWorkId: workId,
        relatedClientId: project.clientId,
        relatedEditorId: project.assignedTo,
        recipientId: project.assignedTo,
        recipientRole: 'editor',
        targetRole: 'editor',
      });
    }

    addNotifications(notifs);
    return true;
  };

  const updateProjectReview = (
    workId: string,
    reviewStatus: string,
    notes?: string,
    clientName?: string
  ) => {
    if (reviewStatus === 'Approved') {
      approveWork(workId, clientName);
    } else if (reviewStatus === 'Revision Requested' || reviewStatus === 'Revision Required') {
      submitClientRevision({
        workId,
        notes: notes || 'Revision requested by client',
        clientName,
      });
    } else {
      updateWorkStatus(workId, reviewStatus as WorkStatus, clientName || 'Client');
    }
  };

  // ==========================================
  // PAYMENT OPERATIONS
  // ==========================================
  const addClientPayment = (
    paymentData: Omit<ClientPayment, 'id' | 'receiptNumber' | 'createdAt'>
  ): ClientPayment => {
    const id = `pay-c-${Date.now()}`;
    const count = clientPayments.length + 1;
    const receiptNumber = `${settings.receiptPrefix}-${String(count).padStart(4, '0')}`;
    const newPayment: ClientPayment = {
      ...paymentData,
      id,
      receiptNumber,
      createdAt: new Date().toISOString(),
    };

    setClientPayments((prev) => [newPayment, ...prev]);
    firestoreService.createPaymentDoc({ ...newPayment, paymentCategory: 'client' }).catch((err) => {
      console.error('Failed to create client payment in Firestore:', err);
    });

    const client = clients.find((c) => c.id === paymentData.clientId);

    addActivity({
      who: 'Admin',
      action: 'Payment received',
      what: `Received ₹${paymentData.amount.toLocaleString()} from ${client?.name || 'Client'} (${paymentData.paymentType}, Receipt: ${receiptNumber})`,
      entityType: 'payment',
      entityId: id,
      clientId: paymentData.clientId,
    });

    addNotification({
      type: 'payment',
      message: `Client payment of ₹${paymentData.amount.toLocaleString()} received from ${client?.name || 'Client'}`,
      relatedClientId: paymentData.clientId,
      relatedPaymentId: id,
    });

    return newPayment;
  };

  const updateClientPayment = (
    id: string,
    updates: Partial<ClientPayment>
  ): ClientPayment | null => {
    const existing = clientPayments.find((p) => p.id === id);
    if (!existing) return null;

    const updatedPayment: ClientPayment = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    setClientPayments((prev) => prev.map((p) => (p.id === id ? updatedPayment : p)));
    firestoreService.updatePaymentDoc(id, updates).catch((err) => {
      console.error('Failed to update client payment in Firestore:', err);
    });

    const client = clients.find((c) => c.id === updatedPayment.clientId);

    addActivity({
      who: 'Admin',
      action: 'Payment edited',
      what: `Updated payment slip ${updatedPayment.receiptNumber} for ${client?.name || 'Client'}`,
      entityType: 'payment',
      entityId: id,
      clientId: updatedPayment.clientId,
    });

    return updatedPayment;
  };

  const deleteClientPayment = (id: string) => {
    const payment = clientPayments.find((p) => p.id === id);
    if (!payment) return;

    setClientPayments((prev) => prev.filter((p) => p.id !== id));
    firestoreService.deletePaymentDoc(id).catch((err) => {
      console.error('Failed to delete client payment in Firestore:', err);
    });

    addActivity({
      who: 'Admin',
      action: 'Payment deleted',
      what: `Deleted client payment slip ${payment.receiptNumber} (₹${payment.amount.toLocaleString()})`,
      entityType: 'payment',
      entityId: id,
      clientId: payment.clientId,
    });
  };

  const addEditorPayment = (
    paymentData: Omit<EditorPayment, 'id' | 'receiptNumber' | 'createdAt'>
  ): EditorPayment => {
    const id = `pay-e-${Date.now()}`;
    const count = editorPayments.length + 1;
    const receiptNumber = `VID-EDT-2026-${String(count).padStart(4, '0')}`;
    const newPayment: EditorPayment = {
      ...paymentData,
      id,
      receiptNumber,
      createdAt: new Date().toISOString(),
    };

    setEditorPayments((prev) => [newPayment, ...prev]);
    firestoreService.createPaymentDoc({ ...newPayment, paymentCategory: 'editor' }).catch((err) => {
      console.error('Failed to create editor payment in Firestore:', err);
    });

    const editor = editors.find((e) => e.id === paymentData.editorId);

    addActivity({
      who: 'Admin',
      action: 'Editor payment added',
      what: `Paid ₹${paymentData.amount.toLocaleString()} to editor ${editor?.name || 'Editor'} (${paymentData.paymentType}, Receipt: ${receiptNumber})`,
      entityType: 'payment',
      entityId: id,
      editorId: paymentData.editorId,
    });

    addNotification({
      type: 'payment',
      message: `Editor payout of ₹${paymentData.amount.toLocaleString()} recorded for ${editor?.name || 'Editor'}`,
      relatedEditorId: paymentData.editorId,
      relatedPaymentId: id,
    });

    return newPayment;
  };

  const updateEditorPayment = (
    id: string,
    updates: Partial<EditorPayment>
  ): EditorPayment | null => {
    const existing = editorPayments.find((p) => p.id === id);
    if (!existing) return null;

    const updatedPayment: EditorPayment = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    setEditorPayments((prev) => prev.map((p) => (p.id === id ? updatedPayment : p)));
    firestoreService.updatePaymentDoc(id, updates).catch((err) => {
      console.error('Failed to update editor payment in Firestore:', err);
    });

    const editor = editors.find((e) => e.id === updatedPayment.editorId);

    addActivity({
      who: 'Admin',
      action: 'Payment edited',
      what: `Updated editor payment ${updatedPayment.receiptNumber} for ${editor?.name || 'Editor'}`,
      entityType: 'payment',
      entityId: id,
      editorId: updatedPayment.editorId,
    });

    return updatedPayment;
  };

  const deleteEditorPayment = (id: string) => {
    const payment = editorPayments.find((p) => p.id === id);
    if (!payment) return;

    setEditorPayments((prev) => prev.filter((p) => p.id !== id));
    firestoreService.deletePaymentDoc(id).catch((err) => {
      console.error('Failed to delete editor payment in Firestore:', err);
    });

    addActivity({
      who: 'Admin',
      action: 'Payment deleted',
      what: `Deleted editor payment record ${payment.receiptNumber} (₹${payment.amount.toLocaleString()})`,
      entityType: 'payment',
      entityId: id,
      editorId: payment.editorId,
    });
  };

  // ==========================================
  // EXPENSE OPERATIONS
  // ==========================================
  const addExpense = (expenseData: Omit<Expense, 'id' | 'createdAt'>): Expense => {
    const id = `exp-${Date.now()}`;
    const newExpense: Expense = {
      ...expenseData,
      id,
      createdAt: new Date().toISOString(),
    };

    setExpenses((prev) => [newExpense, ...prev]);
    firestoreService.createExpenseDoc(newExpense).catch((err) => {
      console.error('Failed to create expense in Firestore:', err);
    });

    addActivity({
      who: 'Admin',
      action: 'Expense recorded',
      what: `Recorded expense "${expenseData.name || expenseData.title}" of ₹${expenseData.amount.toLocaleString()} (${expenseData.category})`,
      entityType: 'expense',
      entityId: id,
    });

    return newExpense;
  };

  const deleteExpense = (id: string) => {
    const expense = expenses.find((e) => e.id === id);
    if (!expense) return;

    setExpenses((prev) => prev.filter((e) => e.id !== id));
    firestoreService.deleteExpenseDoc(id).catch((err) => {
      console.error('Failed to delete expense in Firestore:', err);
    });

    const expenseTitle = expense.name || expense.title || 'Expense';
    addActivity({
      who: 'Admin',
      action: 'Expense deleted',
      what: `Deleted expense "${expenseTitle}" (₹${expense.amount.toLocaleString('en-IN')})`,
      entityType: 'expense',
      entityId: id,
    });
  };

  // ==========================================
  // NOTIFICATION MANAGEMENT
  // ==========================================
  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    firestoreService.updateNotificationDoc(id, { read: true }).catch((err) => {
      console.error('Failed to update notification in Firestore:', err);
    });
  };

  const markAllNotificationsAsRead = (filter?: { role?: 'admin' | 'client' | 'editor'; id?: string }) => {
    setNotifications((prev) =>
      prev.map((n) => {
        let shouldMark = false;
        if (!filter || !filter.role || filter.role === 'admin') {
          if (n.recipientId === 'admin' || n.targetRole === 'admin' || (!n.recipientId && !n.targetRole)) {
            shouldMark = true;
          }
        } else if (filter.role === 'editor' && filter.id) {
          if (
            n.recipientId === filter.id ||
            (n.relatedEditorId === filter.id && (n.targetRole === 'editor' || n.recipientRole === 'editor'))
          ) {
            shouldMark = true;
          }
        } else if (filter.role === 'client' && filter.id) {
          if (
            n.recipientId === filter.id ||
            (n.relatedClientId === filter.id && (n.targetRole === 'client' || n.recipientRole === 'client'))
          ) {
            shouldMark = true;
          }
        }

        if (shouldMark && !n.read) {
          firestoreService.updateNotificationDoc(n.id, { read: true }).catch(() => {});
          return { ...n, read: true };
        }
        return n;
      })
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    firestoreService.deleteNotificationDoc(id).catch((err) => {
      console.error('Failed to delete notification in Firestore:', err);
    });
  };

  const clearAllNotifications = (filter?: { role?: 'admin' | 'client' | 'editor'; id?: string }) => {
    setNotifications((prev) => {
      const remaining: NotificationItem[] = [];
      prev.forEach((n) => {
        let shouldRemove = false;
        if (!filter || !filter.role || filter.role === 'admin') {
          if (n.recipientId === 'admin' || n.targetRole === 'admin' || (!n.recipientId && !n.targetRole)) {
            shouldRemove = true;
          }
        } else if (filter.role === 'editor' && filter.id) {
          if (
            n.recipientId === filter.id ||
            (n.relatedEditorId === filter.id && (n.targetRole === 'editor' || n.recipientRole === 'editor'))
          ) {
            shouldRemove = true;
          }
        } else if (filter.role === 'client' && filter.id) {
          if (
            n.recipientId === filter.id ||
            (n.relatedClientId === filter.id && (n.targetRole === 'client' || n.recipientRole === 'client'))
          ) {
            shouldRemove = true;
          }
        }

        if (shouldRemove) {
          firestoreService.deleteNotificationDoc(n.id).catch(() => {});
        } else {
          remaining.push(n);
        }
      });
      return remaining;
    });
  };

  // ==========================================
  // SETTINGS MANAGEMENT
  // ==========================================
  const updateSettings = (newSettings: Partial<BusinessSettings>) => {
    setSettings((prev) => {
      const merged = { ...prev, ...newSettings };
      firestoreService.saveSettingsDoc(merged).catch((err) => {
        console.error('Failed to save settings to Firestore:', err);
      });
      return merged;
    });

    addActivity({
      who: 'Admin',
      action: 'Settings updated',
      what: 'Updated business CRM settings',
      entityType: 'client',
    });
  };

  // ==========================================
  // FINANCIAL CALCULATIONS (Calculated from Firestore Data)
  // ==========================================
  const getFinancialPulse = () => {
    const totalClientBilling = projects.reduce((acc, p) => acc + (p.totalBilling || 0), 0);
    const totalClientPaid = clientPayments.reduce((acc, p) => acc + (p.amount || 0), 0);
    const clientPendingPayments = Math.max(0, totalClientBilling - totalClientPaid);

    const totalEditorCost = projects.reduce((acc, p) => {
      if (p.workDoneBy === 'Assigned' && p.assignedTo) {
        return acc + (p.quantity * (p.editorRate || 0));
      }
      return acc;
    }, 0);

    const totalEditorPaid = editorPayments.reduce((acc, p) => acc + (p.amount || 0), 0);
    const editorPendingPayments = Math.max(0, totalEditorCost - totalEditorPaid);
    const otherExpenses = expenses.reduce((acc, e) => acc + (e.amount || 0), 0);

    const grossProfit = totalClientBilling - totalEditorCost;
    const netProfit = totalClientBilling - totalEditorCost - otherExpenses;
    const realizedProfit = totalClientPaid - totalEditorPaid - otherExpenses;

    return {
      totalRevenue: totalClientBilling,
      totalClientBilling,
      totalPaymentsReceived: totalClientPaid,
      totalClientPaid,
      pendingPayments: clientPendingPayments,
      clientPendingPayments,
      totalEditorCost,
      totalEditorPaid,
      editorPendingPayments,
      otherExpenses,
      totalExpenses: otherExpenses,
      grossProfit,
      netProfit,
      realizedProfit,
    };
  };

  const financialMetrics = useMemo(() => {
    return getFinancialPulse();
  }, [projects, clientPayments, editorPayments, expenses]);

  const getClientStats = (clientId: string) => {
    const clientProjects = projects.filter((p) => p.clientId === clientId);
    const totalWork = clientProjects.length;
    const completed = clientProjects.filter((p) => p.status === 'Completed' || p.status === 'Delivered').length;
    const pending = totalWork - completed;

    const totalBilling = clientProjects.reduce((acc, p) => acc + (p.totalBilling || 0), 0);
    const clientPays = clientPayments.filter((p) => p.clientId === clientId);
    const totalPaid = clientPays.reduce((acc, p) => acc + (p.amount || 0), 0);
    const remaining = Math.max(0, totalBilling - totalPaid);

    let paymentStatus: 'Paid' | 'Partial' | 'Pending' = 'Pending';
    if (totalPaid >= totalBilling && totalBilling > 0) {
      paymentStatus = 'Paid';
    } else if (totalPaid > 0) {
      paymentStatus = 'Partial';
    }

    return {
      totalWork,
      completed,
      pending,
      totalBilling,
      totalPaid,
      remaining,
      paymentStatus,
    };
  };

  const getEditorStats = (editorId: string) => {
    const editorProjects = projects.filter((p) => p.assignedTo === editorId && p.workDoneBy === 'Assigned');
    const assignedWork = editorProjects.length;
    const inProgress = editorProjects.filter((p) => p.status === 'In Progress' || p.status === 'Revision Required').length;
    const completed = editorProjects.filter((p) => p.status === 'Completed' || p.status === 'Delivered').length;
    const pending = assignedWork - completed;

    const totalCost = editorProjects.reduce((acc, p) => acc + (p.quantity * (p.editorRate || 0)), 0);
    const editorPays = editorPayments.filter((p) => p.editorId === editorId);
    const totalPaid = editorPays.reduce((acc, p) => acc + (p.amount || 0), 0);
    const remaining = Math.max(0, totalCost - totalPaid);

    let paymentStatus: 'Paid' | 'Partial' | 'Pending' = 'Pending';
    if (totalPaid >= totalCost && totalCost > 0) {
      paymentStatus = 'Paid';
    } else if (totalPaid > 0) {
      paymentStatus = 'Partial';
    }

    return {
      assignedWork,
      inProgress,
      completed,
      pending,
      totalCost,
      totalPaid,
      remaining,
      paymentStatus,
    };
  };

  // Safe reset to empty database (does NOT restore demo data!)
  const resetToDefaultData = () => {
    setClients([]);
    setEditors([]);
    setProjects([]);
    setClientPayments([]);
    setEditorPayments([]);
    setExpenses([]);
    setActivities([]);
    setNotifications([]);
    setSettings(initialSettings);
  };

  return (
    <CrmContext.Provider
      value={{
        clients,
        editors,
        projects,
        clientPayments,
        editorPayments,
        expenses,
        activities,
        notifications,
        settings,
        isLoading,
        firestoreError,
        activeTab,
        setActiveTab,
        searchQuery,
        setSearchQuery,
        selectedClientId,
        setSelectedClientId,
        selectedEditorId,
        setSelectedEditorId,
        selectedWorkId,
        setSelectedWorkId,
        activePortalUser,
        setActivePortalUser,
        addClient,
        updateClient,
        deleteClient,
        setClientPortalStatus,
        addEditor,
        updateEditor,
        deleteEditor,
        setEditorPortalStatus,
        addProject,
        updateProject,
        deleteProject,
        updateWorkLinks,
        updateWorkStatus,
        confirmAction,
        resetConfirmation,
        requestRevision,
        updateRevisionStatus,
        submitEditorCompletion,
        approveWork,
        submitClientRevision,
        submitClientDataUpload,
        updateProjectReview,
        addClientPayment,
        updateClientPayment,
        deleteClientPayment,
        addEditorPayment,
        updateEditorPayment,
        deleteEditorPayment,
        addExpense,
        deleteExpense,
        addNotification,
        addNotifications,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        deleteNotification,
        clearAllNotifications,
        addActivity,
        updateSettings,
        getFinancialPulse,
        financialMetrics,
        getClientStats,
        getEditorStats,
        resetToDefaultData,
        resetToDemoData: resetToDefaultData,
      }}
    >
      {children}
    </CrmContext.Provider>
  );
};

export const useCrm = () => {
  const context = useContext(CrmContext);
  if (!context) {
    throw new Error('useCrm must be used within a CrmProvider');
  }
  return context;
};
