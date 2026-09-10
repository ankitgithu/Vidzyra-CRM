import { CrmContextType } from '../context/CrmContext';

export interface CrmContextSnapshot {
  business: {
    name: string;
    tagline: string;
    currency: string;
    email: string;
    phone: string;
  };
  financialPulse: {
    totalRevenue: number;
    totalPaymentsReceived: number;
    pendingClientPayments: number;
    totalEditorCost: number;
    totalEditorPaid: number;
    editorPendingPayments: number;
    totalExpenses: number;
    grossProfit: number;
    netProfit: number;
    realizedProfit: number;
  };
  clients: Array<{
    id: string;
    name: string;
    email: string;
    phone: string;
    whatsapp: string;
    clientType: string;
    portalStatus: string;
    totalBilling: number;
    totalPaid: number;
    remainingDue: number;
    totalWork: number;
    completedWork: number;
    pendingWork: number;
  }>;
  editors: Array<{
    id: string;
    name: string;
    email: string;
    contact: string;
    editorRate: number;
    availability: string;
    portalStatus: string;
    assignedWork: number;
    inProgress: number;
    completed: number;
    pending: number;
    totalCost: number;
    totalPaid: number;
    remainingPayout: number;
  }>;
  projects: Array<{
    id: string;
    name: string;
    clientName: string;
    assignedEditorName: string;
    status: string;
    workType: string;
    quantity: number;
    clientRate: number;
    totalBilling: number;
    editorRate: number;
    dueDate: string;
    deadline: string;
    workGivenDate: string;
    priority: string;
    revisionCount: number;
    revisionStatus: string;
    revisionNotes: string;
    driveFolderUrl: string;
  }>;
  deadlines: {
    overdue: Array<{ name: string; client: string; dueDate: string }>;
    dueToday: Array<{ name: string; client: string }>;
    dueTomorrow: Array<{ name: string; client: string }>;
    upcoming: Array<{ name: string; client: string; dueDate: string }>;
  };
  recentPayments: {
    clientPayments: Array<{
      date: string;
      client: string;
      amount: number;
      method: string;
      receiptNumber: string;
      type: string;
    }>;
    editorPayouts: Array<{
      date: string;
      editor: string;
      amount: number;
      method: string;
      receiptNumber: string;
      type: string;
    }>;
    expenses: Array<{ date: string; name: string; category: string; amount: number; notes: string }>;
  };
  recentActivities: Array<{ who: string; action: string; what: string; when: string }>;
  notifications: Array<{ message: string; date: string; time: string; type: string }>;
}

export function buildCrmContextSnapshot(crm: CrmContextType): CrmContextSnapshot {
  const {
    settings,
    clients,
    editors,
    projects,
    clientPayments,
    editorPayments,
    expenses,
    activities,
    notifications,
    getFinancialPulse,
    getClientStats,
    getEditorStats,
  } = crm;

  const pulse = getFinancialPulse();

  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowObj = new Date();
  tomorrowObj.setDate(tomorrowObj.getDate() + 1);
  const tomorrowStr = tomorrowObj.toISOString().split('T')[0];

  // Deadlines
  const overdue = projects
    .filter((p) => {
      const d = p.deadline || p.dueDate;
      return (
        p.status !== 'Completed' &&
        p.status !== 'Delivered' &&
        p.status !== 'Approved' &&
        d &&
        d < todayStr
      );
    })
    .map((p) => {
      const c = clients.find((cl) => cl.id === p.clientId);
      return {
        name: p.name,
        client: c ? c.name : 'Unknown Client',
        dueDate: p.deadline || p.dueDate,
      };
    });

  const dueToday = projects
    .filter((p) => {
      const d = p.deadline || p.dueDate;
      return (
        p.status !== 'Completed' &&
        p.status !== 'Delivered' &&
        p.status !== 'Approved' &&
        d === todayStr
      );
    })
    .map((p) => {
      const c = clients.find((cl) => cl.id === p.clientId);
      return {
        name: p.name,
        client: c ? c.name : 'Unknown Client',
      };
    });

  const dueTomorrow = projects
    .filter((p) => {
      const d = p.deadline || p.dueDate;
      return (
        p.status !== 'Completed' &&
        p.status !== 'Delivered' &&
        p.status !== 'Approved' &&
        d === tomorrowStr
      );
    })
    .map((p) => {
      const c = clients.find((cl) => cl.id === p.clientId);
      return {
        name: p.name,
        client: c ? c.name : 'Unknown Client',
      };
    });

  const upcoming = projects
    .filter((p) => {
      const d = p.deadline || p.dueDate;
      return (
        p.status !== 'Completed' &&
        p.status !== 'Delivered' &&
        p.status !== 'Approved' &&
        d &&
        d > tomorrowStr
      );
    })
    .slice(0, 10)
    .map((p) => {
      const c = clients.find((cl) => cl.id === p.clientId);
      return {
        name: p.name,
        client: c ? c.name : 'Unknown Client',
        dueDate: p.deadline || p.dueDate,
      };
    });

  // Client summaries
  const clientSummaries = clients.map((c) => {
    const stats = getClientStats(c.id);
    return {
      id: c.id,
      name: c.name,
      email: c.email || '',
      phone: c.phone || '',
      whatsapp: c.whatsapp || '',
      clientType: c.clientType,
      portalStatus: c.portalStatus,
      totalBilling: stats.totalBilling,
      totalPaid: stats.totalPaid,
      remainingDue: stats.remaining,
      totalWork: stats.totalWork,
      completedWork: stats.completed,
      pendingWork: stats.pending,
    };
  });

  // Editor summaries
  const editorSummaries = editors.map((e) => {
    const stats = getEditorStats(e.id);
    return {
      id: e.id,
      name: e.name,
      email: e.email || '',
      contact: e.contact || '',
      editorRate: e.editorRate || 0,
      availability: e.availability || 'Available',
      portalStatus: e.portalStatus,
      assignedWork: stats.assignedWork,
      inProgress: stats.inProgress,
      completed: stats.completed,
      pending: stats.pending,
      totalCost: stats.totalCost,
      totalPaid: stats.totalPaid,
      remainingPayout: stats.remaining,
    };
  });

  // Project summaries
  const projectSummaries = projects.map((p) => {
    const client = clients.find((c) => c.id === p.clientId);
    const editor = editors.find((e) => e.id === p.assignedTo);
    return {
      id: p.id,
      name: p.name,
      clientName: client ? client.name : 'Unassigned',
      assignedEditorName: editor ? editor.name : 'Unassigned',
      status: p.status,
      workType: p.workType || 'Video Editing',
      quantity: Number(p.quantity) || 1,
      clientRate: Number(p.clientRate) || 0,
      totalBilling: Number(p.totalBilling) || 0,
      editorRate: Number(p.editorRate) || 0,
      dueDate: p.deadline || p.dueDate || 'No date set',
      deadline: p.deadline || p.dueDate || 'No date set',
      workGivenDate: p.workGivenDate || 'Not specified',
      priority: p.priority || 'Medium',
      revisionCount: Number(p.revisionCount) || 0,
      revisionStatus: p.revisionStatus || 'No Revision',
      revisionNotes: p.revisionNotes || '',
      driveFolderUrl: p.driveFolderUrl || '',
    };
  });

  return {
    business: {
      name: settings.businessName || 'Vidzyra Studio',
      tagline: settings.tagline || 'Video Editing Partner',
      currency: settings.currency || 'USD',
      email: settings.contactEmail || '',
      phone: settings.contactPhone || '',
    },
    financialPulse: {
      totalRevenue: pulse.totalRevenue,
      totalPaymentsReceived: pulse.totalPaymentsReceived,
      pendingClientPayments: pulse.pendingPayments,
      totalEditorCost: pulse.totalEditorCost,
      totalEditorPaid: pulse.totalEditorPaid,
      editorPendingPayments: pulse.editorPendingPayments,
      totalExpenses: pulse.totalExpenses,
      grossProfit: pulse.grossProfit,
      netProfit: pulse.netProfit,
      realizedProfit: pulse.realizedProfit,
    },
    clients: clientSummaries,
    editors: editorSummaries,
    projects: projectSummaries,
    deadlines: {
      overdue,
      dueToday,
      dueTomorrow,
      upcoming,
    },
    recentPayments: {
      clientPayments: clientPayments.slice(0, 15).map((cp) => {
        const c = clients.find((cl) => cl.id === cp.clientId);
        return {
          date: cp.date,
          client: c ? c.name : 'Client',
          amount: Number(cp.amount) || 0,
          method: cp.paymentMethod,
          receiptNumber: cp.receiptNumber || '',
          type: cp.paymentType,
        };
      }),
      editorPayouts: editorPayments.slice(0, 15).map((ep) => {
        const ed = editors.find((e) => e.id === ep.editorId);
        return {
          date: ep.date,
          editor: ed ? ed.name : 'Editor',
          amount: Number(ep.amount) || 0,
          method: ep.paymentMethod,
          receiptNumber: ep.receiptNumber || '',
          type: ep.paymentType,
        };
      }),
      expenses: expenses.slice(0, 15).map((ex) => ({
        date: ex.date,
        name: ex.name,
        category: ex.category,
        amount: Number(ex.amount) || 0,
        notes: ex.notes || '',
      })),
    },
    recentActivities: activities.slice(0, 20).map((a) => ({
      who: a.who,
      action: a.action,
      what: a.what,
      when: a.when,
    })),
    notifications: notifications.slice(0, 10).map((n) => ({
      message: n.message,
      date: n.date,
      time: n.time,
      type: n.type,
    })),
  };
}
