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
  ChatMessage,
  ChatMessageStatus,
  ChatSenderRole,
  Rating,
  Invoice,
  Receipt,
  PaymentStatus,
  EditorAvailability,
  CalendarTask,
} from '../types';
import { initialSettings } from '../mockData';
import * as firestoreService from '../services/firestoreService';
import { evaluateMessageModeration } from '../utils/chatModeration';
import { processDueReminders } from '../utils/reminders';

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
  chatMessages: ChatMessage[];
  ratings: Rating[];
  invoices: Invoice[];
  receipts: Receipt[];

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
      driveFolderUrl?: string;
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
  updateProjectDriveFolder: (workId: string, driveFolderUrl: string) => void;
  updateWorkStatus: (workId: string, newStatus: WorkStatus, updatedBy?: string) => void;

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
  submitEditorFileUpload: (params: {
    workId: string;
    editorId: string;
    editorName?: string;
    uploadType: 'Edited Video' | 'Revision' | 'Final Deliverable';
    notes?: string;
  }) => boolean;
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

  // Project Live Chat (Admin Moderated)
  sendChatMessage: (params: {
    projectId: string;
    senderId: string;
    senderRole: ChatSenderRole;
    senderName: string;
    message: string;
    recipientRole?: 'client' | 'editor' | 'all';
  }) => { success: boolean; error?: string; isRestricted?: boolean; pending?: boolean; messageId?: string };
  approveChatMessage: (messageId: string) => Promise<boolean>;
  rejectChatMessage: (messageId: string, reason?: string) => Promise<boolean>;
  deleteChatMessage: (messageId: string) => Promise<boolean>;
  toggleProjectChat: (workId: string, enabled: boolean) => void;
  clearProjectChat: (workId: string) => Promise<void>;

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

  // Ratings
  addRating: (ratingData: Omit<Rating, 'id' | 'createdAt'>) => Promise<Rating>;

  // Invoices & Receipts
  createInvoice: (invoiceData: Omit<Invoice, 'id' | 'createdAt'> | Invoice) => Promise<Invoice>;
  addInvoice: (invoiceData: Omit<Invoice, 'id' | 'createdAt'> | Invoice) => Promise<Invoice>;
  updateInvoice: (id: string, updates: Partial<Invoice>) => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;
  addReceipt: (receiptData: Omit<Receipt, 'id' | 'createdAt'>) => Promise<Receipt>;
  deleteReceipt: (id: string) => Promise<void>;

  // Editor Availability
  updateEditorAvailability: (editorId: string, availability: EditorAvailability, note?: string) => Promise<void>;

  // Calendar Admin Tasks
  calendarTasks: CalendarTask[];
  addCalendarTask: (taskData: Omit<CalendarTask, 'id' | 'createdAt'>) => Promise<CalendarTask>;
  updateCalendarTask: (id: string, updates: Partial<CalendarTask>) => Promise<void>;
  deleteCalendarTask: (id: string) => Promise<void>;
  toggleCalendarTaskStatus: (id: string) => Promise<void>;

  // Automated Due Reminders
  runDueRemindersCheck: () => Promise<number>;

  resetToDefaultData: () => void;
  resetToDemoData: () => void;
  restoreDatabase: (backupData: any) => Promise<{ success: boolean; count?: number; error?: string }>;
}

export const CrmContext = createContext<CrmContextType | undefined>(undefined);

export const ROUTE_TO_TAB: Record<string, string> = {
  '/': 'dashboard',
  '/dashboard': 'dashboard',
  '/clients': 'clients',
  '/editors': 'editors',
  '/work': 'work',
  '/projects': 'work',
  '/payments': 'payments',
  '/reports': 'reports',
  '/calendar': 'calendar',
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
  calendar: '/calendar',
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
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [calendarTasks, setCalendarTasks] = useState<CalendarTask[]>([]);

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
    const requiredFeeds = 12;

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

    const unsubChatMessages = firestoreService.subscribeChatMessages(
      (data) => {
        if (active) {
          setChatMessages(data);
          checkReady();
        }
      },
      (err) => {
        if (active) setFirestoreError(String(err));
      }
    );

    const unsubRatings = firestoreService.subscribeRatings(
      (data) => {
        if (active) {
          setRatings(data);
          checkReady();
        }
      },
      (err) => {
        if (active) setFirestoreError(String(err));
      }
    );

    const unsubInvoices = firestoreService.subscribeInvoices(
      (data) => {
        if (active) {
          setInvoices(data);
          checkReady();
        }
      },
      (err) => {
        if (active) setFirestoreError(String(err));
      }
    );

    const unsubReceipts = firestoreService.subscribeReceipts(
      (data) => {
        if (active) {
          setReceipts(data);
          checkReady();
        }
      },
      (err) => {
        if (active) setFirestoreError(String(err));
      }
    );

    const unsubCalendarTasks = firestoreService.subscribeCalendarTasks(
      (data) => {
        if (active) {
          setCalendarTasks(data);
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
      unsubChatMessages();
      unsubRatings();
      unsubInvoices();
      unsubReceipts();
      unsubCalendarTasks();
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
    const resolvedEditorId =
      projectData.assignedTo ||
      (projectData as any).editorId ||
      (projectData as any).assignedEditorId ||
      null;
    const editor = editors.find((e) => e.id === resolvedEditorId);

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

    const quantity = Number(projectData.quantity) || 1;
    const clientRate = Number(projectData.clientRate) || 0;
    const editorRate = Number(projectData.editorRate) || 0;
    const totalBilling =
      typeof projectData.totalBilling === 'number' && !isNaN(projectData.totalBilling)
        ? projectData.totalBilling
        : quantity * clientRate;
    const editorCost =
      (projectData.workDoneBy === 'Assigned' && resolvedEditorId)
        ? quantity * editorRate
        : 0;
    const profit = totalBilling - editorCost;

    const newProject: WorkProject = {
      ...projectData,
      id,
      quantity,
      clientRate,
      editorRate,
      totalBilling,
      editorCost,
      profit,
      clientId: projectData.clientId,
      assignedTo: resolvedEditorId || null,
      editorId: resolvedEditorId || undefined,
      assignedEditorId: resolvedEditorId || undefined,
      workDoneBy: resolvedEditorId ? 'Assigned' : (projectData.workDoneBy || 'Me / Custom'),
      dueDate: projectData.dueDate || '',
      notes: projectData.notes || '',
      driveFolderUrl: projectData.driveFolderUrl || '',
      clientDownloadLink: projectData.clientDownloadLink || '',
      clientUploadLink: projectData.clientUploadLink || '',
      userDownloadLink: projectData.userDownloadLink || '',
      userUploadLink: projectData.userUploadLink || '',
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
      editorId: resolvedEditorId || undefined,
    });

    // Notify assigned editor
    if (resolvedEditorId) {
      addNotification({
        type: 'work',
        message: `You were assigned a new project: "${newProject.name}"`,
        relatedWorkId: id,
        relatedClientId: projectData.clientId,
        relatedEditorId: resolvedEditorId,
        recipientId: resolvedEditorId,
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
      driveFolderUrl?: string;
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

  const updateProjectDriveFolder = (workId: string, driveFolderUrl: string) => {
    const trimmed = driveFolderUrl.trim();
    updateProject(workId, { driveFolderUrl: trimmed });
    const project = projects.find((p) => p.id === workId);
    if (project) {
      addActivity({
        who: 'Admin',
        action: 'Drive folder updated',
        what: `Updated Google Drive folder for "${project.name}"`,
        entityType: 'work',
        entityId: workId,
        clientId: project.clientId,
        editorId: project.assignedTo || undefined,
      });
    }
  };

  const updateWorkStatus = (workId: string, newStatus: WorkStatus, updatedBy: string = 'Admin') => {
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

  // ==========================================
  // PROJECT LIVE CHAT OPERATIONS (ADMIN MODERATED)
  // ==========================================

  const toggleProjectChat = (workId: string, enabled: boolean) => {
    const project = projects.find((p) => p.id === workId);
    if (!project) return;
    updateProject(workId, { chatEnabled: enabled });
    addActivity({
      who: 'Admin',
      action: enabled ? 'Project chat enabled' : 'Project chat disabled',
      what: `Admin ${enabled ? 'enabled' : 'disabled'} live chat for "${project.name}"`,
      entityType: 'chat',
      entityId: workId,
      clientId: project.clientId,
      editorId: project.assignedTo || undefined,
      workId,
    });
  };

  const clearProjectChat = async (workId: string): Promise<void> => {
    setChatMessages((prev) => prev.filter((m) => m.projectId !== workId && m.workId !== workId));
    await firestoreService.clearProjectChatMessages(workId, chatMessages);
  };

  const sendChatMessage = (params: {
    projectId: string;
    senderId: string;
    senderRole: ChatSenderRole;
    senderName: string;
    message: string;
    recipientRole?: 'client' | 'editor' | 'all';
  }): { success: boolean; error?: string; isRestricted?: boolean; pending?: boolean; messageId?: string } => {
    const { projectId, senderId, senderRole, senderName, message, recipientRole } = params;

    const project = projects.find((p) => p.id === projectId);
    if (!project) {
      return { success: false, error: 'Project not found.' };
    }

    // LEVEL 1: Automatic restriction filter
    const moderation = evaluateMessageModeration(message);
    if (moderation.isRestricted) {
      return {
        success: false,
        isRestricted: true,
        error:
          moderation.reason ||
          'Prohibited content detected. External contacts, payment talks, and personal conversations are not allowed in project chat.',
      };
    }

    const messageId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();

    // SENDER IS ADMIN (Direct send, no approval required)
    if (senderRole === 'admin') {
      const adminMsg: ChatMessage = {
        id: messageId,
        projectId: project.id,
        workId: project.id,
        clientId: project.clientId,
        editorId: project.assignedTo || '',
        senderId: 'admin',
        senderRole: 'admin',
        senderName: senderName || settings.businessName || 'Admin',
        recipientId: recipientRole === 'client' ? project.clientId : (project.assignedTo || 'all'),
        recipientRole: recipientRole || 'all',
        message: message.trim(),
        status: 'APPROVED',
        createdAt: nowIso,
        reviewedAt: nowIso,
        reviewedByAdminId: 'admin',
      };

      setChatMessages((prev) => [...prev, adminMsg]);
      firestoreService.createChatMessageDoc(adminMsg).catch((err) => {
        console.error('Failed to create admin chat message:', err);
      });

      // Real-time recipient notifications
      const notifs: (Omit<NotificationItem, 'id' | 'date' | 'time' | 'timestamp' | 'read'> & { id?: string })[] = [];

      if (recipientRole === 'client' || recipientRole === 'all') {
        notifs.push({
          id: `notif-${Date.now()}-adm-cli`,
          type: 'chat',
          message: `Admin sent a message for project "${project.name}": "${message.slice(0, 60)}${message.length > 60 ? '...' : ''}"`,
          relatedWorkId: project.id,
          relatedClientId: project.clientId,
          recipientId: project.clientId,
          recipientRole: 'client',
          targetRole: 'client',
        });
      }

      if ((recipientRole === 'editor' || recipientRole === 'all') && project.assignedTo) {
        notifs.push({
          id: `notif-${Date.now() + 1}-adm-edt`,
          type: 'chat',
          message: `Admin sent a message for project "${project.name}": "${message.slice(0, 60)}${message.length > 60 ? '...' : ''}"`,
          relatedWorkId: project.id,
          relatedEditorId: project.assignedTo,
          recipientId: project.assignedTo,
          recipientRole: 'editor',
          targetRole: 'editor',
        });
      }

      if (notifs.length > 0) {
        addNotifications(notifs);
      }

      return { success: true, pending: false, messageId };
    }

    // SENDER IS CLIENT OR EDITOR:
    if (!project.assignedTo) {
      return {
        success: false,
        error: 'Chat will become available after an Editor is assigned to this project.',
      };
    }

    if (project.chatEnabled === false || project.status === 'Approved') {
      return {
        success: false,
        error: 'Chat is currently disabled for this project.',
      };
    }

    // LEVEL 2: Message created as PENDING_ADMIN_REVIEW
    const targetRecipientId = senderRole === 'client' ? project.assignedTo : project.clientId;
    const targetRecipientRole = senderRole === 'client' ? 'editor' : 'client';

    const pendingMsg: ChatMessage = {
      id: messageId,
      projectId: project.id,
      workId: project.id,
      clientId: project.clientId,
      editorId: project.assignedTo,
      senderId,
      senderRole,
      senderName,
      recipientId: targetRecipientId,
      recipientRole: targetRecipientRole,
      message: message.trim(),
      status: 'PENDING_ADMIN_REVIEW',
      createdAt: nowIso,
    };

    setChatMessages((prev) => [...prev, pendingMsg]);
    firestoreService.createChatMessageDoc(pendingMsg).catch((err) => {
      console.error('Failed to create pending chat message:', err);
    });

    // Notify Admin in real-time
    const clientObj = clients.find((c) => c.id === project.clientId);
    const clientName = clientObj?.name || 'Client';
    const roleLabel = senderRole === 'client' ? 'Client' : 'Editor';

    addNotification({
      id: `notif-${Date.now()}-chat-pending`,
      type: 'chat',
      message: `New ${roleLabel} message awaiting approval from ${senderName} for "${project.name}" (Client: ${clientName}, Project ID: ${project.id}): "${message.slice(0, 60)}${message.length > 60 ? '...' : ''}"`,
      recipientId: 'admin',
      recipientRole: 'admin',
      targetRole: 'admin',
      relatedWorkId: project.id,
      relatedClientId: project.clientId,
      relatedEditorId: project.assignedTo,
    });

    addActivity({
      who: senderName,
      action: 'Chat message submitted for review',
      what: `Message from ${senderName} on "${project.name}" awaiting Admin approval`,
      entityType: 'chat',
      entityId: messageId,
      clientId: project.clientId,
      editorId: project.assignedTo,
      workId: project.id,
    });

    return { success: true, pending: true, messageId };
  };

  const approveChatMessage = async (messageId: string): Promise<boolean> => {
    const msg = chatMessages.find((m) => m.id === messageId);
    if (!msg) return false;

    const project = projects.find((p) => p.id === msg.projectId || p.id === msg.workId);
    const nowIso = new Date().toISOString();

    const updates: Partial<ChatMessage> = {
      status: 'APPROVED',
      reviewedAt: nowIso,
      reviewedByAdminId: 'admin',
    };

    setChatMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, ...updates } : m))
    );
    await firestoreService.updateChatMessageDoc(messageId, updates);

    // Deliver to recipient in real-time & notify
    addNotification({
      id: `notif-${Date.now()}-approved-msg`,
      type: 'chat',
      message: `New message from ${msg.senderName} on "${project?.name || 'Project'}": "${msg.message.slice(0, 60)}${msg.message.length > 60 ? '...' : ''}"`,
      recipientId: msg.recipientId,
      recipientRole: msg.recipientRole === 'all' ? 'admin' : msg.recipientRole,
      targetRole: msg.recipientRole === 'all' ? 'admin' : msg.recipientRole,
      relatedWorkId: msg.projectId,
      relatedClientId: msg.clientId,
      relatedEditorId: msg.editorId,
    });

    addActivity({
      who: 'Admin',
      action: 'Chat message approved',
      what: `Admin approved message from ${msg.senderName} to ${msg.recipientRole} for "${project?.name || 'Project'}"`,
      entityType: 'chat',
      entityId: messageId,
      clientId: msg.clientId,
      editorId: msg.editorId,
      workId: msg.projectId,
    });

    return true;
  };

  const rejectChatMessage = async (messageId: string, reason?: string): Promise<boolean> => {
    const msg = chatMessages.find((m) => m.id === messageId);
    if (!msg) return false;

    const project = projects.find((p) => p.id === msg.projectId || p.id === msg.workId);
    const nowIso = new Date().toISOString();

    const updates: Partial<ChatMessage> = {
      status: 'REJECTED',
      reviewedAt: nowIso,
      reviewedByAdminId: 'admin',
      rejectionReason: reason || 'Your message was not approved by Admin.',
    };

    setChatMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, ...updates } : m))
    );
    await firestoreService.updateChatMessageDoc(messageId, updates);

    // Notify sender that message was not approved (do NOT notify recipient)
    addNotification({
      id: `notif-${Date.now()}-rejected-msg`,
      type: 'chat',
      message: `Your message was not approved by Admin for "${project?.name || 'Project'}".`,
      recipientId: msg.senderId,
      recipientRole: msg.senderRole === 'client' ? 'client' : 'editor',
      targetRole: msg.senderRole === 'client' ? 'client' : 'editor',
      relatedWorkId: msg.projectId,
      relatedClientId: msg.clientId,
      relatedEditorId: msg.editorId,
    });

    addActivity({
      who: 'Admin',
      action: 'Chat message rejected',
      what: `Admin rejected message from ${msg.senderName} for "${project?.name || 'Project'}"`,
      entityType: 'chat',
      entityId: messageId,
      clientId: msg.clientId,
      editorId: msg.editorId,
      workId: msg.projectId,
    });

    return true;
  };

  const deleteChatMessage = async (messageId: string): Promise<boolean> => {
    setChatMessages((prev) => prev.filter((m) => m.id !== messageId));
    await firestoreService.deleteChatMessageDoc(messageId);
    return true;
  };

  // 2. Client approves a project -> Notify Admin, Assigned Editor, disable & clear chat
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
      chatEnabled: false, // Immediately disable chat upon client approval
      timeline: [...project.timeline, newTimelineItem],
    };

    updateProject(workId, updates);

    // Automatically clear/delete ALL chat messages belonging ONLY to that project
    clearProjectChat(workId);

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
      what: `${resolvedClientName} uploaded data for "${project.name}" (ID: ${project.id})`,
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
        message: `${resolvedClientName} uploaded project data for "${project.name}" (ID: ${project.id})${notes ? `: ${notes}` : ''}.`,
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
        message: `${resolvedClientName} uploaded project data for "${project.name}" (ID: ${project.id})${notes ? `: ${notes}` : ''}.`,
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

  // Editor uploads file (Edited Video / Revision / Final Deliverable) to shared Google Drive folder -> Notify Admin & Client
  const submitEditorFileUpload = (params: {
    workId: string;
    editorId: string;
    editorName?: string;
    uploadType: 'Edited Video' | 'Revision' | 'Final Deliverable';
    notes?: string;
  }): boolean => {
    const { workId, editorId, editorName, uploadType, notes } = params;
    const project = projects.find((p) => p.id === workId);
    if (!project) return false;

    const editorObj = editors.find((e) => e.id === editorId);
    const resolvedEditorName = editorName || editorObj?.name || 'Assigned Editor';
    const { date, time, formatted } = getFormattedDateTime();

    const actionText = notes
      ? `${uploadType} uploaded to Drive: ${notes}`
      : `${uploadType} uploaded to Google Drive by ${resolvedEditorName}`;

    const newTimelineItem: TimelineEvent = {
      id: `tm-${Date.now()}`,
      person: resolvedEditorName,
      action: actionText,
      date,
      time,
      status: uploadType === 'Final Deliverable' ? 'Completed' : project.status,
    };

    const updates: Partial<WorkProject> = {
      editorUploadConfirmed: true,
      editorUploadConfirmedAt: formatted,
      timeline: [...project.timeline, newTimelineItem],
    };

    if (uploadType === 'Final Deliverable') {
      updates.status = 'Completed';
      updates.reviewStatus = 'Awaiting Client Review';
    } else if (uploadType === 'Revision') {
      updates.revisionStatus = 'Revision Uploaded';
      updates.revisionUploadedDate = formatted;
      if (notes) {
        updates.revisionNotes = notes;
      }
    }

    updateProject(workId, updates);

    addActivity({
      who: resolvedEditorName,
      action: 'File uploaded',
      what: `${resolvedEditorName} uploaded ${uploadType} for "${project.name}" (ID: ${project.id})`,
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
        message: `${resolvedEditorName} uploaded ${uploadType} for "${project.name}" (ID: ${project.id})${notes ? `: ${notes}` : ''}.`,
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
        message: `${resolvedEditorName} uploaded ${uploadType} for "${project.name}" (ID: ${project.id})${notes ? `: ${notes}` : ''}.`,
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
      what: `Received ₹${(paymentData.amount || 0).toLocaleString()} from ${client?.name || 'Client'} (${paymentData.paymentType}, Receipt: ${receiptNumber})`,
      entityType: 'payment',
      entityId: id,
      clientId: paymentData.clientId,
    });

    addNotification({
      type: 'payment',
      message: `Client payment of ₹${(paymentData.amount || 0).toLocaleString()} received from ${client?.name || 'Client'}`,
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
      what: `Deleted client payment slip ${payment.receiptNumber} (₹${(payment.amount || 0).toLocaleString()})`,
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
      what: `Paid ₹${(paymentData.amount || 0).toLocaleString()} to editor ${editor?.name || 'Editor'} (${paymentData.paymentType}, Receipt: ${receiptNumber})`,
      entityType: 'payment',
      entityId: id,
      editorId: paymentData.editorId,
    });

    addNotification({
      type: 'payment',
      message: `Editor payout of ₹${(paymentData.amount || 0).toLocaleString()} recorded for ${editor?.name || 'Editor'}`,
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
      what: `Deleted editor payment record ${payment.receiptNumber} (₹${(payment.amount || 0).toLocaleString()})`,
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
      what: `Recorded expense "${expenseData.name || expenseData.title}" of ₹${(expenseData.amount || 0).toLocaleString()} (${expenseData.category})`,
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
      what: `Deleted expense "${expenseTitle}" (₹${(expense.amount || 0).toLocaleString('en-IN')})`,
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
    const clientProjects = projects.filter((p) => {
      const pClientId = p.clientId || (p as any).client_id || (p as any).client?.id;
      return Boolean(pClientId && pClientId === clientId);
    });
    const totalWork = clientProjects.length;
    const completed = clientProjects.filter((p) => p.status === 'Completed' || p.status === 'Delivered' || p.status === 'Approved').length;
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
    const editorProjects = projects.filter((p) => {
      const assignedEditorId = p.assignedTo || (p as any).editorId || (p as any).assignedEditorId;
      return Boolean(assignedEditorId && assignedEditorId === editorId);
    });
    const assignedWork = editorProjects.length;
    const inProgress = editorProjects.filter((p) => p.status === 'In Progress' || p.status === 'Revision Required').length;
    const completed = editorProjects.filter((p) => p.status === 'Completed' || p.status === 'Delivered' || p.status === 'Approved').length;
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

  // ------------------------------------------
  // Feature: Ratings System
  // ------------------------------------------
  const addRating = async (ratingData: Omit<Rating, 'id' | 'createdAt'>): Promise<Rating> => {
    const id = `rat-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const createdAt = new Date().toISOString();
    const newRating: Rating = { ...ratingData, id, createdAt };
    setRatings((prev) => [newRating, ...prev]);
    await firestoreService.createRatingDoc(newRating);

    addActivity({
      who: ratingData.raterName || 'User',
      action: 'submitted',
      what: `${ratingData.rating}-star review for project "${ratingData.projectName}"`,
      entityType: 'rating',
      entityId: id,
      clientId: ratingData.clientId,
      editorId: ratingData.editorId,
      workId: ratingData.projectId,
    });

    addNotification({
      type: 'rating',
      message: `${ratingData.raterName} submitted a ${ratingData.rating}★ rating for "${ratingData.projectName}"`,
      recipientRole: 'admin',
      targetRole: 'admin',
      relatedWorkId: ratingData.projectId,
      relatedClientId: ratingData.clientId,
      relatedEditorId: ratingData.editorId,
    });

    return newRating;
  };

  // ------------------------------------------
  // Feature: Invoices System
  // ------------------------------------------
  const createInvoice = async (
    invoiceData: Omit<Invoice, 'id' | 'createdAt'> | Invoice
  ): Promise<Invoice> => {
    const id =
      'id' in invoiceData && invoiceData.id
        ? invoiceData.id
        : `inv-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const createdAt =
      'createdAt' in invoiceData && invoiceData.createdAt
        ? invoiceData.createdAt
        : new Date().toISOString();

    const subtotal = Number(invoiceData.subtotal) || 0;
    const tax = Number(invoiceData.tax) || 0;
    const total = Number(invoiceData.total) || subtotal + tax;
    const paidAmount = Math.max(0, Number(invoiceData.paidAmount) || 0);
    const dueAmount = Math.max(0, total - paidAmount);

    // Calculate mathematically consistent payment status
    const computedStatus: PaymentStatus =
      dueAmount <= 0 && total > 0
        ? 'Paid'
        : paidAmount > 0
        ? 'Partial'
        : 'Pending';

    const newInvoice: Invoice = {
      ...invoiceData,
      id,
      createdAt,
      subtotal,
      tax,
      total,
      paidAmount,
      dueAmount,
      paymentStatus: invoiceData.paymentStatus || computedStatus,
    };

    setInvoices((prev) => {
      const exists = prev.some((inv) => inv.id === id);
      if (exists) {
        return prev.map((inv) => (inv.id === id ? newInvoice : inv));
      }
      return [newInvoice, ...prev];
    });

    await firestoreService.createInvoiceDoc(newInvoice);

    addActivity({
      who: settings.adminName || 'Admin',
      action: 'generated invoice',
      what: `Invoice #${newInvoice.invoiceNumber} for ${newInvoice.clientName} (${settings.currencySymbol || '₹'}${newInvoice.total})`,
      entityType: 'invoice',
      entityId: id,
      clientId: newInvoice.clientId,
      workId: newInvoice.workId,
    });

    addNotification({
      type: 'invoice',
      message: `Invoice #${newInvoice.invoiceNumber} generated for ${newInvoice.clientName} (${settings.currencySymbol || '₹'}${newInvoice.total})`,
      recipientRole: 'admin',
      targetRole: 'admin',
      relatedClientId: newInvoice.clientId,
      relatedWorkId: newInvoice.workId,
    });

    return newInvoice;
  };

  const addInvoice = createInvoice;

  const updateInvoice = async (id: string, updates: Partial<Invoice>): Promise<void> => {
    setInvoices((prev) => prev.map((inv) => (inv.id === id ? { ...inv, ...updates } : inv)));
    await firestoreService.updateInvoiceDoc(id, updates);
  };

  const deleteInvoice = async (id: string): Promise<void> => {
    setInvoices((prev) => prev.filter((inv) => inv.id !== id));
    await firestoreService.deleteInvoiceDoc(id);
  };

  // ------------------------------------------
  // Feature: Receipts System
  // ------------------------------------------
  const addReceipt = async (receiptData: Omit<Receipt, 'id' | 'createdAt'>): Promise<Receipt> => {
    const id = `rec-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const createdAt = new Date().toISOString();
    const newReceipt: Receipt = { ...receiptData, id, createdAt };
    setReceipts((prev) => [newReceipt, ...prev]);
    await firestoreService.createReceiptDoc(newReceipt);

    addActivity({
      who: settings.adminName || 'Admin',
      action: 'issued receipt',
      what: `Receipt #${newReceipt.receiptNumber} for ${newReceipt.clientName} (${settings.currencySymbol || '₹'}${newReceipt.amountReceived})`,
      entityType: 'receipt',
      entityId: id,
      clientId: newReceipt.clientId,
      workId: newReceipt.workId,
    });

    return newReceipt;
  };

  const deleteReceipt = async (id: string): Promise<void> => {
    setReceipts((prev) => prev.filter((r) => r.id !== id));
    await firestoreService.deleteReceiptDoc(id);
  };

  // ------------------------------------------
  // Feature: Calendar Admin Tasks
  // ------------------------------------------
  const addCalendarTask = async (taskData: Omit<CalendarTask, 'id' | 'createdAt'>): Promise<CalendarTask> => {
    const id = `task_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const createdAt = new Date().toISOString();
    const newTask: CalendarTask = {
      ...taskData,
      id,
      createdAt,
      createdBy: taskData.createdBy || settings.adminName || 'Admin',
    };
    setCalendarTasks((prev) => [newTask, ...prev]);
    await firestoreService.createCalendarTaskDoc(newTask);

    addActivity({
      who: settings.adminName || 'Admin',
      action: 'created task',
      what: `Created calendar task "${newTask.title}" for ${newTask.date}`,
      entityType: 'task',
      entityId: id,
    });

    return newTask;
  };

  const updateCalendarTask = async (id: string, updates: Partial<CalendarTask>): Promise<void> => {
    const current = calendarTasks.find((t) => t.id === id);
    const updated = {
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    setCalendarTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...updated } : t)));
    await firestoreService.updateCalendarTaskDoc(id, updated);

    if (current) {
      addActivity({
        who: settings.adminName || 'Admin',
        action: 'updated task',
        what: `Updated calendar task "${current.title}"`,
        entityType: 'task',
        entityId: id,
      });
    }
  };

  const deleteCalendarTask = async (id: string): Promise<void> => {
    const taskToDelete = calendarTasks.find((t) => t.id === id);
    setCalendarTasks((prev) => prev.filter((t) => t.id !== id));
    await firestoreService.deleteCalendarTaskDoc(id);

    if (taskToDelete) {
      addActivity({
        who: settings.adminName || 'Admin',
        action: 'deleted task',
        what: `Deleted calendar task "${taskToDelete.title}"`,
        entityType: 'task',
        entityId: id,
      });
    }
  };

  const toggleCalendarTaskStatus = async (id: string): Promise<void> => {
    const task = calendarTasks.find((t) => t.id === id);
    if (!task) return;
    const newStatus: CalendarTask['status'] = task.status === 'Completed' ? 'Pending' : 'Completed';
    await updateCalendarTask(id, { status: newStatus });
  };

  // ------------------------------------------
  // Feature: Editor Availability Status
  // ------------------------------------------
  const updateEditorAvailability = async (
    editorId: string,
    availability: EditorAvailability,
    note?: string
  ): Promise<void> => {
    setEditors((prev) =>
      prev.map((ed) =>
        ed.id === editorId
          ? { ...ed, availability, availabilityNote: note !== undefined ? note : ed.availabilityNote }
          : ed
      )
    );
    await firestoreService.updateEditorDoc(editorId, {
      availability,
      availabilityNote: note !== undefined ? note : undefined,
    });

    const editorObj = editors.find((e) => e.id === editorId);
    addActivity({
      who: editorObj?.name || 'Editor',
      action: 'updated status',
      what: `Availability status set to ${availability}`,
      entityType: 'editor',
      entityId: editorId,
      editorId,
    });
  };

  // ------------------------------------------
  // Feature: Automated Due Reminders
  // ------------------------------------------
  const runDueRemindersCheck = useCallback(async (): Promise<number> => {
    if (projects.length === 0) return 0;
    return await processDueReminders(projects, clients, editors, notifications, (newNotif) => {
      setNotifications((prev) => [newNotif, ...prev]);
    });
  }, [projects, clients, editors, notifications]);

  // Periodic and on-mount automated due reminders check
  useEffect(() => {
    if (!isLoading && projects.length > 0) {
      const timer = setTimeout(() => {
        runDueRemindersCheck().catch(() => {});
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [isLoading, projects.length]);

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

  // Full Database Replacement & Restore from Backup
  const restoreDatabase = async (backupData: any): Promise<{ success: boolean; count?: number; error?: string }> => {
    try {
      // 1. Process and normalize restored datasets
      const restoredClients: Client[] = Array.isArray(backupData.clients) ? backupData.clients : [];
      const restoredEditors: Editor[] = Array.isArray(backupData.editors) ? backupData.editors : [];
      const restoredProjects: WorkProject[] = Array.isArray(backupData.projects) ? backupData.projects : [];

      let restoredClientPayments: ClientPayment[] = [];
      let restoredEditorPayments: EditorPayment[] = [];

      if (Array.isArray(backupData.clientPayments) && backupData.clientPayments.length > 0) {
        restoredClientPayments = backupData.clientPayments;
      }
      if (Array.isArray(backupData.editorPayments) && backupData.editorPayments.length > 0) {
        restoredEditorPayments = backupData.editorPayments;
      }
      if (Array.isArray(backupData.payments) && restoredClientPayments.length === 0 && restoredEditorPayments.length === 0) {
        for (const p of backupData.payments) {
          if (p.paymentCategory === 'editor' || (!p.paymentCategory && p.editorId && !p.clientId)) {
            restoredEditorPayments.push(p);
          } else {
            restoredClientPayments.push(p);
          }
        }
      }

      const restoredExpenses: Expense[] = Array.isArray(backupData.expenses) ? backupData.expenses : [];
      const restoredActivities: Activity[] = Array.isArray(backupData.activities) ? backupData.activities : [];
      const restoredNotifications: NotificationItem[] = Array.isArray(backupData.notifications) ? backupData.notifications : [];
      const restoredChatMessages: ChatMessage[] = Array.isArray(backupData.chatMessages) ? backupData.chatMessages : [];
      const restoredRatings: Rating[] = Array.isArray(backupData.ratings) ? backupData.ratings : [];
      const restoredInvoices: Invoice[] = Array.isArray(backupData.invoices) ? backupData.invoices : [];
      const restoredReceipts: Receipt[] = Array.isArray(backupData.receipts) ? backupData.receipts : [];
      const restoredSettings: BusinessSettings = backupData.settings && typeof backupData.settings === 'object'
        ? { ...initialSettings, ...backupData.settings }
        : settings;

      // 2. Perform Firestore atomic replacement
      await firestoreService.restoreDatabaseToFirestore({
        clients: restoredClients,
        editors: restoredEditors,
        projects: restoredProjects,
        clientPayments: restoredClientPayments,
        editorPayments: restoredEditorPayments,
        expenses: restoredExpenses,
        notifications: restoredNotifications,
        activities: restoredActivities,
        revisions: Array.isArray(backupData.revisions) ? backupData.revisions : [],
        sharedLinks: Array.isArray(backupData.sharedLinks) ? backupData.sharedLinks : [],
        chatMessages: restoredChatMessages,
        ratings: restoredRatings,
        invoices: restoredInvoices,
        receipts: restoredReceipts,
        adminUsers: Array.isArray(backupData.adminUsers) ? backupData.adminUsers : [],
        settings: restoredSettings,
      });

      // 3. Immediately update in-memory React state for instantaneous UI sync across all views
      setClients(restoredClients);
      setEditors(restoredEditors);
      setProjects(restoredProjects);
      setClientPayments(restoredClientPayments);
      setEditorPayments(restoredEditorPayments);
      setExpenses(restoredExpenses);
      setActivities(restoredActivities);
      setNotifications(restoredNotifications);
      setChatMessages(restoredChatMessages);
      setRatings(restoredRatings);
      setInvoices(restoredInvoices);
      setReceipts(restoredReceipts);
      setSettings(restoredSettings);

      // 4. Log the restore activity
      const totalCount =
        restoredClients.length +
        restoredEditors.length +
        restoredProjects.length +
        restoredClientPayments.length +
        restoredEditorPayments.length;

      addActivity({
        who: restoredSettings.adminName || 'Admin',
        action: 'Database Restored',
        what: `Restored database from backup (${restoredClients.length} clients, ${restoredProjects.length} projects, ${restoredEditors.length} editors, ${restoredClientPayments.length + restoredEditorPayments.length} payments)`,
        entityType: 'settings',
      });

      return { success: true, count: totalCount };
    } catch (err: any) {
      console.error('Failed to restore database:', err);
      return { success: false, error: err?.message || 'Failed to restore database to Firestore' };
    }
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
        chatMessages,
        ratings,
        invoices,
        receipts,
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
        updateProjectDriveFolder,
        updateWorkStatus,
        confirmAction,
        resetConfirmation,
        requestRevision,
        updateRevisionStatus,
        submitEditorCompletion,
        submitEditorFileUpload,
        approveWork,
        submitClientRevision,
        submitClientDataUpload,
        updateProjectReview,
        sendChatMessage,
        approveChatMessage,
        rejectChatMessage,
        deleteChatMessage,
        toggleProjectChat,
        clearProjectChat,
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
        addRating,
        createInvoice,
        addInvoice,
        updateInvoice,
        deleteInvoice,
        addReceipt,
        deleteReceipt,
        updateEditorAvailability,
        calendarTasks,
        addCalendarTask,
        updateCalendarTask,
        deleteCalendarTask,
        toggleCalendarTaskStatus,
        runDueRemindersCheck,
        resetToDefaultData,
        resetToDemoData: resetToDefaultData,
        restoreDatabase,
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
