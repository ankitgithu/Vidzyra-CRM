import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
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
  PaymentMethod,
  PaymentType,
} from '../types';
import {
  initialClients,
  initialEditors,
  initialProjects,
  initialClientPayments,
  initialEditorPayments,
  initialExpenses,
  initialActivities,
  initialNotifications,
  initialSettings,
} from '../mockData';

interface CrmContextType {
  clients: Client[];
  editors: Editor[];
  projects: WorkProject[];
  clientPayments: ClientPayment[];
  editorPayments: EditorPayment[];
  expenses: Expense[];
  activities: Activity[];
  notifications: NotificationItem[];
  settings: BusinessSettings;

  // Active view & navigation
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedClientId: string | null;
  setSelectedClientId: (id: string | null) => void;
  selectedEditorId: string | null;
  setSelectedEditorId: (id: string | null) => void;
  selectedWorkId: string | null;
  setSelectedWorkId: (id: string | null) => void;

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
  addProject: (projectData: Omit<WorkProject, 'id' | 'createdAt' | 'timeline' | 'revisionCount' | 'revisionStatus' | 'editorDownloadConfirmed' | 'editorUploadConfirmed' | 'clientUploadConfirmed' | 'clientDownloadConfirmed'>) => WorkProject;
  updateProject: (id: string, updates: Partial<WorkProject>) => void;
  deleteProject: (id: string) => void;
  updateWorkLinks: (
    workId: string,
    links: {
      userDownloadLink?: string;
      userUploadLink?: string;
      clientDownloadLink?: string;
      clientUploadLink?: string;
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
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAllNotifications: () => void;
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

const LOCAL_STORAGE_KEY = 'vidzyra_crm_database_v1';

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
  if (
    hash &&
    ['dashboard', 'clients', 'editors', 'work', 'projects', 'payments', 'reports', 'datacenter', 'data', 'settings'].includes(
      hash
    )
  ) {
    if (hash === 'projects') return 'work';
    if (hash === 'data') return 'datacenter';
    return hash;
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
  // Check localStorage for persisted active tab across page refreshes
  try {
    const savedTab = localStorage.getItem(LOCAL_STORAGE_KEY + '_active_tab');
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
  // Try loading from localStorage
  const [clients, setClients] = useState<Client[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY + '_clients');
    return saved ? JSON.parse(saved) : initialClients;
  });

  const [editors, setEditors] = useState<Editor[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY + '_editors');
    return saved ? JSON.parse(saved) : initialEditors;
  });

  const [projects, setProjects] = useState<WorkProject[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY + '_projects');
    return saved ? JSON.parse(saved) : initialProjects;
  });

  const [clientPayments, setClientPayments] = useState<ClientPayment[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY + '_cpayments');
    return saved ? JSON.parse(saved) : initialClientPayments;
  });

  const [editorPayments, setEditorPayments] = useState<EditorPayment[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY + '_epayments');
    return saved ? JSON.parse(saved) : initialEditorPayments;
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY + '_expenses');
    return saved ? JSON.parse(saved) : initialExpenses;
  });

  const [activities, setActivities] = useState<Activity[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY + '_activities');
    return saved ? JSON.parse(saved) : initialActivities;
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY + '_notifications');
    return saved ? JSON.parse(saved) : initialNotifications;
  });

  const [settings, setSettings] = useState<BusinessSettings>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY + '_settings');
    return saved ? JSON.parse(saved) : initialSettings;
  });

  // Navigation State with Browser History & Hash & LocalStorage Sync
  const [activeTab, setActiveTabState] = useState<string>(() => getInitialTab());
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedEditorId, setSelectedEditorId] = useState<string | null>(null);
  const [selectedWorkId, setSelectedWorkIdState] = useState<string | null>(() => getInitialWorkId());

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
          // Fallback for strict sandboxed iframe
        }
        try {
          window.location.hash = `work/${workId}`;
        } catch {
          // ignore
        }
      } else {
        const targetRoute = TAB_TO_ROUTE[activeTab] || `/${activeTab}`;
        try {
          if (window.location.pathname.startsWith('/work/') || window.location.pathname.startsWith('/projects/')) {
            window.history.pushState({ tab: activeTab, workId: null }, '', targetRoute);
          }
        } catch {
          // Fallback
        }
        try {
          if (window.location.hash.startsWith('#work/') || window.location.hash.startsWith('work/')) {
            window.location.hash = activeTab;
          }
        } catch {
          // ignore
        }
      }
    }
  };

  const setActiveTab = (tab: string) => {
    setActiveTabState(tab);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY + '_active_tab', tab);
    } catch {
      // ignore
    }
    if (typeof window !== 'undefined') {
      const targetRoute = TAB_TO_ROUTE[tab] || `/${tab}`;
      try {
        if (window.location.pathname !== targetRoute) {
          window.history.pushState({ tab, workId: null }, '', targetRoute);
        }
      } catch {
        // Fallback for strict sandboxed iframe
      }
      try {
        if (window.location.hash.replace(/^#\/?/, '') !== tab) {
          window.location.hash = tab;
        }
      } catch {
        // ignore
      }
    }
  };

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
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY + '_active_tab', tab);
      } catch {
        // ignore
      }
    };
    window.addEventListener('popstate', handleRouteSync);
    window.addEventListener('hashchange', handleRouteSync);
    return () => {
      window.removeEventListener('popstate', handleRouteSync);
      window.removeEventListener('hashchange', handleRouteSync);
    };
  }, [activeTab]);

  // Portal simulation state (allows testing client/editor view directly or via URL params)
  const [activePortalUser, setActivePortalUser] = useState<{
    type: 'admin' | 'client' | 'editor';
    id: string;
  } | null>(null);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY + '_clients', JSON.stringify(clients));
  }, [clients]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY + '_editors', JSON.stringify(editors));
  }, [editors]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY + '_projects', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY + '_cpayments', JSON.stringify(clientPayments));
  }, [clientPayments]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY + '_epayments', JSON.stringify(editorPayments));
  }, [editorPayments]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY + '_expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY + '_activities', JSON.stringify(activities));
  }, [activities]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY + '_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY + '_settings', JSON.stringify(settings));
  }, [settings]);

  // Helper to format date/time
  const getFormattedDateTime = () => {
    const d = new Date();
    const date = d.toISOString().split('T')[0];
    const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return { date, time, timestamp: d.getTime(), formatted: `${date} ${time}` };
  };

  // Helper to log activity
  const addActivity = (act: Omit<Activity, 'id' | 'timestamp' | 'when'>) => {
    const { formatted, timestamp } = getFormattedDateTime();
    const newAct: Activity = {
      ...act,
      id: 'act-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      when: formatted,
      timestamp,
    };
    setActivities((prev) => [newAct, ...prev]);
  };

  // Helper to add notification
  const addNotification = (notif: Omit<NotificationItem, 'id' | 'date' | 'time' | 'timestamp' | 'read'>) => {
    const { date, time, timestamp } = getFormattedDateTime();
    const newNotif: NotificationItem = {
      ...notif,
      id: 'notif-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      date,
      time,
      timestamp,
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  // CLIENT CRUD
  const addClient = (clientData: Omit<Client, 'id' | 'createdAt' | 'portalToken' | 'portalStatus'>): Client => {
    const id = 'cli-' + Date.now();
    const token = 'portal-client-' + clientData.name.toLowerCase().replace(/[^a-z0-9]/g, '') + '-' + Math.floor(1000 + Math.random() * 9000);
    const newClient: Client = {
      ...clientData,
      id,
      portalToken: token,
      portalStatus: 'Active',
      createdAt: new Date().toISOString(),
    };
    setClients((prev) => [newClient, ...prev]);

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
    setClients((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
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

    setClients((prev) =>
      prev.map((c) => (c.id === id ? { ...c, portalStatus: status } : c))
    );

    if (status === 'Deleted') {
      addActivity({
        who: 'Admin',
        action: 'Portal permanently deleted',
        what: `Client portal for "${client.name}" was permanently deleted`,
        entityType: 'portal',
        entityId: id,
        clientId: id,
      });
      addNotification({
        type: 'portal',
        message: `Portal permanently deleted for client "${client.name}"`,
        relatedClientId: id,
      });
    } else if (status === 'Inactive') {
      addActivity({
        who: 'Admin',
        action: 'Portal inactivated',
        what: `Client portal for "${client.name}" was set to Inactive`,
        entityType: 'portal',
        entityId: id,
        clientId: id,
      });
      addNotification({
        type: 'portal',
        message: `Portal inactivated for client "${client.name}"`,
        relatedClientId: id,
      });
    } else {
      addActivity({
        who: 'Admin',
        action: 'Portal activated',
        what: `Client portal for "${client.name}" was Activated`,
        entityType: 'portal',
        entityId: id,
        clientId: id,
      });
      addNotification({
        type: 'portal',
        message: `Portal activated for client "${client.name}"`,
        relatedClientId: id,
      });
    }
  };

  // EDITOR CRUD
  const addEditor = (editorData: Omit<Editor, 'id' | 'createdAt' | 'portalToken' | 'portalStatus'>): Editor => {
    const id = 'edt-' + Date.now();
    const token = 'portal-editor-' + editorData.name.toLowerCase().replace(/[^a-z0-9]/g, '') + '-' + Math.floor(1000 + Math.random() * 9000);
    const newEditor: Editor = {
      ...editorData,
      id,
      portalToken: token,
      portalStatus: 'Active',
      createdAt: new Date().toISOString(),
    };
    setEditors((prev) => [newEditor, ...prev]);

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
    setEditors((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...updates } : e))
    );
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
    // Safely update projects that had this editor assigned
    setProjects((prev) =>
      prev.map((p) => {
        if (p.assignedTo === id) {
          return {
            ...p,
            assignedTo: null,
            workDoneBy: 'Me / Custom',
          };
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

    setEditors((prev) =>
      prev.map((e) => (e.id === id ? { ...e, portalStatus: status } : e))
    );

    if (status === 'Deleted') {
      addActivity({
        who: 'Admin',
        action: 'Portal permanently deleted',
        what: `Editor portal for "${editor.name}" was permanently deleted`,
        entityType: 'portal',
        entityId: id,
        editorId: id,
      });
      addNotification({
        type: 'portal',
        message: `Portal permanently deleted for editor "${editor.name}"`,
        relatedEditorId: id,
      });
    } else if (status === 'Inactive') {
      addActivity({
        who: 'Admin',
        action: 'Portal inactivated',
        what: `Editor portal for "${editor.name}" was set to Inactive`,
        entityType: 'portal',
        entityId: id,
        editorId: id,
      });
    } else {
      addActivity({
        who: 'Admin',
        action: 'Portal activated',
        what: `Editor portal for "${editor.name}" was Activated`,
        entityType: 'portal',
        entityId: id,
        editorId: id,
      });
    }
  };

  // WORK / PROJECT CRUD
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
    const id = 'wrk-' + Date.now();
    const { date, time } = getFormattedDateTime();
    const client = clients.find((c) => c.id === projectData.clientId);
    const editor = editors.find((e) => e.id === projectData.assignedTo);

    const initialTimeline = [
      {
        id: 'tm-' + Date.now(),
        person: 'Admin',
        action: `Work Created (${projectData.name})`,
        date,
        time,
        status: projectData.status,
      },
    ];

    if (projectData.workDoneBy === 'Assigned' && editor) {
      initialTimeline.push({
        id: 'tm-' + (Date.now() + 1),
        person: 'Admin',
        action: `Assigned to ${editor.name}`,
        date,
        time,
        status: 'Assigned',
      });
    }

    const finalQuantity = Number(projectData.quantity) || 1;
    const finalClientRate = Number(projectData.clientRate) || 0;
    const finalWorkDoneBy = projectData.workDoneBy || 'Me / Custom';
    const finalEditorRate = Number(projectData.editorRate) || 0;
    const finalAssignedTo = projectData.assignedTo;

    const totalBilling = projectData.totalBilling !== undefined 
      ? projectData.totalBilling 
      : finalQuantity * finalClientRate;

    const editorCost = projectData.editorCost !== undefined
      ? projectData.editorCost
      : (finalWorkDoneBy === 'Assigned' && finalAssignedTo ? finalQuantity * finalEditorRate : 0);

    const profit = totalBilling - editorCost;

    const newProject: WorkProject = {
      ...projectData,
      id,
      quantity: finalQuantity,
      clientRate: finalClientRate,
      workDoneBy: finalWorkDoneBy,
      editorRate: finalEditorRate,
      assignedTo: finalAssignedTo,
      totalBilling,
      editorCost,
      profit,
      createdAt: new Date().toISOString(),
      timeline: initialTimeline,
      revisionCount: 0,
      revisionStatus: 'No Revision',
      editorDownloadConfirmed: false,
      editorUploadConfirmed: false,
      clientUploadConfirmed: false,
      clientDownloadConfirmed: false,
    };

    setProjects((prev) => [newProject, ...prev]);

    addActivity({
      who: 'Admin',
      action: 'Work created',
      what: `Created work "${newProject.name}" for client "${client?.name || 'Client'}" (₹${newProject.totalBilling})`,
      entityType: 'work',
      entityId: id,
      clientId: newProject.clientId,
      editorId: newProject.assignedTo || undefined,
    });

    addNotification({
      type: 'work',
      message: `Work created: "${newProject.name}" for ${client?.name || 'Client'}`,
      relatedClientId: newProject.clientId,
      relatedEditorId: newProject.assignedTo || undefined,
      relatedWorkId: id,
    });

    if (newProject.workDoneBy === 'Assigned' && editor) {
      addNotification({
        type: 'work',
        message: `Work "${newProject.name}" assigned to editor ${editor.name}`,
        relatedClientId: newProject.clientId,
        relatedEditorId: editor.id,
        relatedWorkId: id,
      });
    }

    return newProject;
  };

  const updateProject = (id: string, updates: Partial<WorkProject>) => {
    const project = projects.find((p) => p.id === id);
    if (!project) return;

    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const finalQuantity = updates.quantity !== undefined ? updates.quantity : p.quantity;
        const finalClientRate = updates.clientRate !== undefined ? updates.clientRate : p.clientRate;
        const finalWorkDoneBy = updates.workDoneBy !== undefined ? updates.workDoneBy : p.workDoneBy;
        const finalEditorRate = updates.editorRate !== undefined ? updates.editorRate : (p.editorRate || 0);
        const finalAssignedTo = updates.assignedTo !== undefined ? updates.assignedTo : p.assignedTo;

        const newTotalBilling = updates.totalBilling !== undefined 
          ? updates.totalBilling 
          : finalQuantity * finalClientRate;

        const newEditorCost = updates.editorCost !== undefined
          ? updates.editorCost
          : (finalWorkDoneBy === 'Assigned' && finalAssignedTo ? finalQuantity * finalEditorRate : 0);

        const newProfit = newTotalBilling - newEditorCost;

        return {
          ...p,
          ...updates,
          quantity: finalQuantity,
          clientRate: finalClientRate,
          workDoneBy: finalWorkDoneBy,
          editorRate: finalEditorRate,
          assignedTo: finalAssignedTo,
          totalBilling: newTotalBilling,
          editorCost: newEditorCost,
          profit: newProfit,
        };
      })
    );

    addActivity({
      who: 'Admin',
      action: 'Work edited',
      what: `Updated details for project "${updates.name || project.name}"`,
      entityType: 'work',
      entityId: id,
      clientId: project.clientId,
      editorId: project.assignedTo || undefined,
    });
  };

  const deleteProject = (id: string) => {
    const project = projects.find((p) => p.id === id);
    if (!project) return;
    setProjects((prev) => {
      const remaining = prev.filter((p) => p.id !== id);
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY + '_projects', JSON.stringify(remaining));
      } catch (err) {
        console.error('Failed to sync projects to localStorage', err);
      }
      return remaining;
    });

    if (selectedWorkId === id) {
      setSelectedWorkId(null);
    }

    addActivity({
      who: 'Admin',
      action: 'Work deleted',
      what: `Deleted project "${project.name || id}"`,
      entityType: 'work',
      entityId: id,
      clientId: project.clientId,
      editorId: project.assignedTo || undefined,
    });
  };

  // The Exact 4 Links System: Update links anytime
  const updateWorkLinks = (
    workId: string,
    links: {
      userDownloadLink?: string;
      userUploadLink?: string;
      clientDownloadLink?: string;
      clientUploadLink?: string;
    }
  ) => {
    const project = projects.find((p) => p.id === workId);
    if (!project) return;

    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== workId) return p;
        return {
          ...p,
          userDownloadLink: links.userDownloadLink !== undefined ? links.userDownloadLink : p.userDownloadLink,
          userUploadLink: links.userUploadLink !== undefined ? links.userUploadLink : p.userUploadLink,
          clientDownloadLink: links.clientDownloadLink !== undefined ? links.clientDownloadLink : p.clientDownloadLink,
          clientUploadLink: links.clientUploadLink !== undefined ? links.clientUploadLink : p.clientUploadLink,
        };
      })
    );

    addActivity({
      who: 'Admin',
      action: 'Link editing',
      what: `Updated portal cloud storage links for "${project.name}"`,
      entityType: 'portal',
      entityId: workId,
      clientId: project.clientId,
      editorId: project.assignedTo || undefined,
    });

    addNotification({
      type: 'portal',
      message: `Portal links updated for "${project.name}"`,
      relatedClientId: project.clientId,
      relatedEditorId: project.assignedTo || undefined,
      relatedWorkId: workId,
    });
  };

  // Status changes from Admin or Portals
  const updateWorkStatus = (workId: string, newStatus: WorkStatus, updatedBy: string) => {
    const project = projects.find((p) => p.id === workId);
    if (!project) return;

    const { date, time } = getFormattedDateTime();
    const newTimelineItem = {
      id: 'tm-' + Date.now(),
      person: updatedBy,
      action: `Status changed to: ${newStatus}`,
      date,
      time,
      status: newStatus,
    };

    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== workId) return p;
        return {
          ...p,
          status: newStatus,
          timeline: [...p.timeline, newTimelineItem],
        };
      })
    );

    addActivity({
      who: updatedBy,
      action: 'Work status changed',
      what: `Status changed to "${newStatus}" on "${project.name}"`,
      entityType: 'work',
      entityId: workId,
      clientId: project.clientId,
      editorId: project.assignedTo || undefined,
    });

    addNotification({
      type: 'work',
      message: `Work status for "${project.name}" changed to "${newStatus}" by ${updatedBy}`,
      relatedClientId: project.clientId,
      relatedEditorId: project.assignedTo || undefined,
      relatedWorkId: workId,
    });
  };

  // Manual Upload / Download Confirmations
  const confirmAction = (
    workId: string,
    actionType: 'editor_download' | 'editor_upload' | 'client_upload' | 'client_download',
    confirmedBy: string
  ) => {
    const project = projects.find((p) => p.id === workId);
    if (!project) return;

    const { date, time, formatted } = getFormattedDateTime();
    let actionLabel = '';
    let notifMsg = '';
    let statusUpdate: WorkStatus | undefined = undefined;

    const updates: Partial<WorkProject> = {};

    if (actionType === 'editor_download') {
      updates.editorDownloadConfirmed = true;
      updates.editorDownloadConfirmedAt = formatted;
      actionLabel = 'Raw Data Download Confirmed';
      notifMsg = `Editor confirmed raw data downloaded for "${project.name}"`;
      if (project.status === 'Assigned' || project.status === 'Pending') {
        statusUpdate = 'In Progress';
      }
    } else if (actionType === 'editor_upload') {
      updates.editorUploadConfirmed = true;
      updates.editorUploadConfirmedAt = formatted;
      actionLabel = 'Edited Data Upload Confirmed';
      notifMsg = `Editor confirmed edited data uploaded for "${project.name}"`;
      if (project.status === 'In Progress') {
        statusUpdate = 'Completed';
      }
    } else if (actionType === 'client_upload') {
      updates.clientUploadConfirmed = true;
      updates.clientUploadConfirmedAt = formatted;
      actionLabel = 'Client Raw Data Upload Confirmed';
      notifMsg = `Client confirmed raw data uploaded for "${project.name}"`;
    } else if (actionType === 'client_download') {
      updates.clientDownloadConfirmed = true;
      updates.clientDownloadConfirmedAt = formatted;
      actionLabel = 'Client Download Confirmed';
      notifMsg = `Client confirmed edited data downloaded for "${project.name}"`;
    }

    const newTimelineItem = {
      id: 'tm-' + Date.now(),
      person: confirmedBy,
      action: actionLabel,
      date,
      time,
      status: statusUpdate || project.status,
    };

    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== workId) return p;
        return {
          ...p,
          ...updates,
          status: statusUpdate || p.status,
          timeline: [...p.timeline, newTimelineItem],
        };
      })
    );

    addActivity({
      who: confirmedBy,
      action: actionLabel,
      what: notifMsg,
      entityType: 'confirmation',
      entityId: workId,
      clientId: project.clientId,
      editorId: project.assignedTo || undefined,
    });

    addNotification({
      type: 'confirmation',
      message: notifMsg,
      relatedClientId: project.clientId,
      relatedEditorId: project.assignedTo || undefined,
      relatedWorkId: workId,
    });
  };

  const resetConfirmation = (
    workId: string,
    actionType: 'editor_download' | 'editor_upload' | 'client_upload' | 'client_download'
  ) => {
    const project = projects.find((p) => p.id === workId);
    if (!project) return;

    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== workId) return p;
        if (actionType === 'editor_download') {
          return { ...p, editorDownloadConfirmed: false, editorDownloadConfirmedAt: undefined };
        }
        if (actionType === 'editor_upload') {
          return { ...p, editorUploadConfirmed: false, editorUploadConfirmedAt: undefined };
        }
        if (actionType === 'client_upload') {
          return { ...p, clientUploadConfirmed: false, clientUploadConfirmedAt: undefined };
        }
        if (actionType === 'client_download') {
          return { ...p, clientDownloadConfirmed: false, clientDownloadConfirmedAt: undefined };
        }
        return p;
      })
    );

    addActivity({
      who: 'Admin',
      action: 'Confirmation reset',
      what: `Reset ${actionType} confirmation on project "${project.name}"`,
      entityType: 'confirmation',
      entityId: workId,
    });
  };

  // Revision Workflow
  const requestRevision = (workId: string, notes: string, requestedBy: string) => {
    const project = projects.find((p) => p.id === workId);
    if (!project) return;

    const { date, time, formatted } = getFormattedDateTime();
    const newTimelineItem = {
      id: 'tm-' + Date.now(),
      person: requestedBy,
      action: `Revision Requested: "${notes}"`,
      date,
      time,
      status: 'Revision Required',
    };

    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== workId) return p;
        return {
          ...p,
          status: 'Revision Required',
          revisionCount: p.revisionCount + 1,
          revisionStatus: 'Revision Requested',
          revisionRequestedDate: formatted,
          revisionNotes: notes,
          // Reset editor upload confirmation so they can re-upload
          editorUploadConfirmed: false,
          timeline: [...p.timeline, newTimelineItem],
        };
      })
    );

    addActivity({
      who: requestedBy,
      action: 'Revision requested',
      what: `Requested revision on "${project.name}": ${notes}`,
      entityType: 'revision',
      entityId: workId,
      clientId: project.clientId,
      editorId: project.assignedTo || undefined,
    });

    addNotification({
      type: 'revision',
      message: `Revision requested on "${project.name}" by ${requestedBy}: ${notes}`,
      relatedClientId: project.clientId,
      relatedEditorId: project.assignedTo || undefined,
      relatedWorkId: workId,
    });
  };

  const updateRevisionStatus = (workId: string, status: RevisionStatus, notes?: string) => {
    const project = projects.find((p) => p.id === workId);
    if (!project) return;

    const { date, time, formatted } = getFormattedDateTime();
    const newTimelineItem = {
      id: 'tm-' + Date.now(),
      person: 'System/Admin',
      action: `Revision status: ${status}`,
      date,
      time,
      status: status === 'Revision Completed' ? 'Completed' : project.status,
    };

    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== workId) return p;
        return {
          ...p,
          revisionStatus: status,
          revisionCompletedDate: status === 'Revision Completed' ? formatted : p.revisionCompletedDate,
          revisionUploadedDate: status === 'Revision Uploaded' ? formatted : p.revisionUploadedDate,
          revisionNotes: notes || p.revisionNotes,
          status: status === 'Revision Completed' ? 'Completed' : p.status,
          timeline: [...p.timeline, newTimelineItem],
        };
      })
    );

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

  // CLIENT PAYMENTS
  const addClientPayment = (
    paymentData: Omit<ClientPayment, 'id' | 'receiptNumber' | 'createdAt'>
  ): ClientPayment => {
    const id = 'pay-c-' + Date.now();
    const count = clientPayments.length + 1;
    const receiptNumber = `${settings.receiptPrefix}-${String(count).padStart(4, '0')}`;
    const newPayment: ClientPayment = {
      ...paymentData,
      id,
      receiptNumber,
      createdAt: new Date().toISOString(),
    };

    const client = clients.find((c) => c.id === paymentData.clientId);

    setClientPayments((prev) => [newPayment, ...prev]);

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

    setClientPayments((prev) =>
      prev.map((p) => (p.id === id ? updatedPayment : p))
    );

    const client = clients.find((c) => c.id === updatedPayment.clientId);

    addActivity({
      who: 'Admin',
      action: 'Payment edited',
      what: `Updated payment slip ${updatedPayment.receiptNumber} for ${client?.name || 'Client'} (Amount: ₹${updatedPayment.amount.toLocaleString()}, Type: ${updatedPayment.paymentType})`,
      entityType: 'payment',
      entityId: id,
      clientId: updatedPayment.clientId,
    });

    addNotification({
      type: 'payment',
      message: `Client payment ${updatedPayment.receiptNumber} modified (₹${updatedPayment.amount.toLocaleString()})`,
      relatedClientId: updatedPayment.clientId,
      relatedPaymentId: id,
    });

    return updatedPayment;
  };

  const deleteClientPayment = (id: string) => {
    const payment = clientPayments.find((p) => p.id === id);
    if (!payment) return;
    setClientPayments((prev) => prev.filter((p) => p.id !== id));
    addActivity({
      who: 'Admin',
      action: 'Payment deleted',
      what: `Deleted client payment slip ${payment.receiptNumber} (₹${payment.amount.toLocaleString()})`,
      entityType: 'payment',
      entityId: id,
      clientId: payment.clientId,
    });
  };

  // EDITOR PAYMENTS
  const addEditorPayment = (
    paymentData: Omit<EditorPayment, 'id' | 'receiptNumber' | 'createdAt'>
  ): EditorPayment => {
    const id = 'pay-e-' + Date.now();
    const count = editorPayments.length + 1;
    const receiptNumber = `VID-EDT-2026-${String(count).padStart(4, '0')}`;
    const newPayment: EditorPayment = {
      ...paymentData,
      id,
      receiptNumber,
      createdAt: new Date().toISOString(),
    };

    const editor = editors.find((e) => e.id === paymentData.editorId);

    setEditorPayments((prev) => [newPayment, ...prev]);

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
      message: `Editor payment of ₹${paymentData.amount.toLocaleString()} recorded for ${editor?.name || 'Editor'}`,
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

    setEditorPayments((prev) =>
      prev.map((p) => (p.id === id ? updatedPayment : p))
    );

    const editor = editors.find((e) => e.id === updatedPayment.editorId);

    addActivity({
      who: 'Admin',
      action: 'Payment edited',
      what: `Updated editor payment ${updatedPayment.receiptNumber} for ${editor?.name || 'Editor'} (Amount: ₹${updatedPayment.amount.toLocaleString()}, Type: ${updatedPayment.paymentType})`,
      entityType: 'payment',
      entityId: id,
      editorId: updatedPayment.editorId,
    });

    addNotification({
      type: 'payment',
      message: `Editor payout ${updatedPayment.receiptNumber} updated (₹${updatedPayment.amount.toLocaleString()})`,
      relatedEditorId: updatedPayment.editorId,
      relatedPaymentId: id,
    });

    return updatedPayment;
  };

  const deleteEditorPayment = (id: string) => {
    const payment = editorPayments.find((p) => p.id === id);
    if (!payment) return;
    setEditorPayments((prev) => prev.filter((p) => p.id !== id));
    addActivity({
      who: 'Admin',
      action: 'Payment deleted',
      what: `Deleted editor payment record ${payment.receiptNumber} (₹${payment.amount.toLocaleString()})`,
      entityType: 'payment',
      entityId: id,
      editorId: payment.editorId,
    });
  };

  // EXPENSES
  const addExpense = (expenseData: Omit<Expense, 'id' | 'createdAt'>): Expense => {
    const id = 'exp-' + Date.now();
    const newExpense: Expense = {
      ...expenseData,
      id,
      createdAt: new Date().toISOString(),
    };
    setExpenses((prev) => [newExpense, ...prev]);

    addActivity({
      who: 'Admin',
      action: 'Expense recorded',
      what: `Recorded expense "${expenseData.name}" of ₹${expenseData.amount.toLocaleString()} (${expenseData.category})`,
      entityType: 'expense',
      entityId: id,
    });

    return newExpense;
  };

  const deleteExpense = (id: string) => {
    const expense = expenses.find((e) => e.id === id);
    if (!expense) return;
    setExpenses((prev) => {
      const remaining = prev.filter((e) => e.id !== id);
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY + '_expenses', JSON.stringify(remaining));
      } catch (err) {
        console.error('Failed to update localStorage for expenses', err);
      }
      return remaining;
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

  // NOTIFICATIONS
  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // SETTINGS
  const updateSettings = (newSettings: Partial<BusinessSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
    addActivity({
      who: 'Admin',
      action: 'Settings updated',
      what: 'Updated business CRM settings',
      entityType: 'client',
    });
  };

  // FINANCIAL & STAT CALCULATIONS
  const getFinancialPulse = () => {
    // Total Revenue = Sum of all client projects totalBilling
    const totalClientBilling = projects.reduce((acc, p) => acc + (p.totalBilling || 0), 0);

    // Total Payments Received from clients
    const totalClientPaid = clientPayments.reduce((acc, p) => acc + (p.amount || 0), 0);

    // Pending Payments = Total Revenue - Total Payments Received
    const clientPendingPayments = Math.max(0, totalClientBilling - totalClientPaid);

    // Total Editor Cost = Sum of editor cost for assigned projects
    const totalEditorCost = projects.reduce((acc, p) => {
      if (p.workDoneBy === 'Assigned' && p.assignedTo) {
        return acc + (p.quantity * (p.editorRate || 0));
      }
      return acc;
    }, 0);

    // Total Editor Payments Paid
    const totalEditorPaid = editorPayments.reduce((acc, p) => acc + (p.amount || 0), 0);

    // Editor Pending Payments
    const editorPendingPayments = Math.max(0, totalEditorCost - totalEditorPaid);

    // Other Expenses
    const otherExpenses = expenses.reduce((acc, e) => acc + (e.amount || 0), 0);

    // Gross Profit = Total Revenue - Total Editor Cost
    const grossProfit = totalClientBilling - totalEditorCost;

    // Net Profit = Total Revenue - Total Editor Cost - Other Expenses
    const netProfit = totalClientBilling - totalEditorCost - otherExpenses;

    // Realized Profit = Total Client Received - Total Editor Paid - Other Expenses
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

  const resetToDefaultData = () => {
    setClients(initialClients);
    setEditors(initialEditors);
    setProjects(initialProjects);
    setClientPayments(initialClientPayments);
    setEditorPayments(initialEditorPayments);
    setExpenses(initialExpenses);
    setActivities(initialActivities);
    setNotifications(initialNotifications);
    setSettings(initialSettings);
    localStorage.clear();
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
        activeTab,
        setActiveTab,
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
        addClientPayment,
        updateClientPayment,
        deleteClientPayment,
        addEditorPayment,
        updateEditorPayment,
        deleteEditorPayment,
        addExpense,
        deleteExpense,
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
