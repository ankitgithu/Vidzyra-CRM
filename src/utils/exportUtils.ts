import {
  Client,
  Editor,
  WorkProject,
  ClientPayment,
  EditorPayment,
  Expense,
  Activity,
  NotificationItem,
} from '../types';

export function isDateInRange(dateStr: string, startDate?: string, endDate?: string): boolean {
  if (!startDate && !endDate) return true;
  const target = new Date(dateStr).getTime();
  if (isNaN(target)) return true;

  if (startDate) {
    const start = new Date(startDate).getTime();
    if (target < start) return false;
  }
  if (endDate) {
    // include the whole end day
    const end = new Date(endDate).getTime() + 24 * 60 * 60 * 1000 - 1;
    if (target > end) return false;
  }
  return true;
}

export function downloadCsv(filename: string, rows: (string | number)[][]) {
  const csvContent =
    'data:text/csv;charset=utf-8,' +
    rows
      .map((row) =>
        row
          .map((item) => {
            const str = String(item ?? '');
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
              return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
          })
          .join(',')
      )
      .join('\n');

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportCrmDataCenter({
  startDate,
  endDate,
  clients,
  editors,
  projects,
  clientPayments,
  editorPayments,
  expenses,
  activities,
  notifications,
}: {
  startDate: string;
  endDate: string;
  clients: Client[];
  editors: Editor[];
  projects: WorkProject[];
  clientPayments: ClientPayment[];
  editorPayments: EditorPayment[];
  expenses: Expense[];
  activities: Activity[];
  notifications: NotificationItem[];
}) {
  const filteredProjects = projects.filter((p) =>
    isDateInRange(p.dueDate || p.createdAt, startDate, endDate)
  );
  const filteredClientPayments = clientPayments.filter((p) =>
    isDateInRange(p.date, startDate, endDate)
  );
  const filteredEditorPayments = editorPayments.filter((p) =>
    isDateInRange(p.date, startDate, endDate)
  );
  const filteredExpenses = expenses.filter((e) =>
    isDateInRange(e.date, startDate, endDate)
  );
  const filteredActivities = activities.filter((a) =>
    isDateInRange(a.when, startDate, endDate)
  );

  const clientMap = new Map(clients.map((c) => [c.id, c.name]));
  const editorMap = new Map(editors.map((e) => [e.id, e.name]));

  // Projects CSV
  const projectHeaders = [
    'Work ID',
    'Project Name',
    'Client',
    'Work Type',
    'Quantity',
    'Client Rate',
    'Total Billing',
    'Work Done By',
    'Assigned Editor',
    'Editor Rate',
    'Editor Cost',
    'Status',
    'Due Date',
    'User Download Link',
    'User Upload Link',
    'Client Download Link',
    'Client Upload Link',
    'Revision Count',
    'Revision Status',
  ];

  const projectRows = filteredProjects.map((p) => [
    p.id,
    p.name,
    clientMap.get(p.clientId) || p.clientId,
    p.workType,
    p.quantity,
    p.clientRate,
    p.totalBilling,
    p.workDoneBy,
    p.assignedTo ? (editorMap.get(p.assignedTo) || p.assignedTo) : 'None',
    p.editorRate,
    p.assignedTo ? p.quantity * p.editorRate : 0,
    p.status,
    p.dueDate,
    p.userDownloadLink || 'Not configured',
    p.userUploadLink || 'Not configured',
    p.clientDownloadLink || 'Not configured',
    p.clientUploadLink || 'Not configured',
    p.revisionCount,
    p.revisionStatus,
  ]);

  downloadCsv(
    `Vidzyra-Projects-Export-${startDate || 'all'}-to-${endDate || 'now'}.csv`,
    [projectHeaders, ...projectRows]
  );

  // Payments CSV
  const paymentHeaders = [
    'Receipt Number',
    'Party Type',
    'Party Name',
    'Date',
    'Amount',
    'Payment Type',
    'Payment Method',
    'Reference Number',
    'Notes',
  ];

  const paymentRows = [
    ...filteredClientPayments.map((cp) => [
      cp.receiptNumber,
      'Client',
      clientMap.get(cp.clientId) || cp.clientId,
      cp.date,
      cp.amount,
      cp.paymentType,
      cp.paymentMethod,
      cp.referenceNumber,
      cp.notes,
    ]),
    ...filteredEditorPayments.map((ep) => [
      ep.receiptNumber,
      'Editor',
      editorMap.get(ep.editorId) || ep.editorId,
      ep.date,
      ep.amount,
      ep.paymentType,
      ep.paymentMethod,
      ep.referenceNumber,
      ep.notes,
    ]),
  ];

  setTimeout(() => {
    downloadCsv(
      `Vidzyra-Payments-Export-${startDate || 'all'}-to-${endDate || 'now'}.csv`,
      [paymentHeaders, ...paymentRows]
    );
  }, 400);
}

export function exportPaymentsToCsv(
  clientPayments: ClientPayment[],
  editorPayments: EditorPayment[],
  clients: Client[],
  editors: Editor[]
) {
  const clientMap = new Map(clients.map((c) => [c.id, c.name]));
  const editorMap = new Map(editors.map((e) => [e.id, e.name]));

  const headers = [
    'Receipt Number',
    'Category',
    'Beneficiary / Client',
    'Date',
    'Amount (INR)',
    'Payment Stage',
    'Payment Method',
    'Reference / UTR',
    'Notes',
  ];

  const rows = [
    ...clientPayments.map((cp) => [
      cp.receiptNumber,
      'Client Inflow',
      clientMap.get(cp.clientId) || cp.clientId,
      cp.date,
      cp.amount,
      cp.paymentType,
      cp.paymentMethod,
      cp.referenceNumber,
      cp.notes,
    ]),
    ...editorPayments.map((ep) => [
      ep.receiptNumber,
      'Editor Payout',
      editorMap.get(ep.editorId) || ep.editorId,
      ep.date,
      ep.amount,
      ep.paymentType,
      ep.paymentMethod,
      ep.referenceNumber,
      ep.notes,
    ]),
  ];

  downloadCsv(`Vidzyra-Transactions-Ledger-${new Date().toISOString().split('T')[0]}.csv`, [
    headers,
    ...rows,
  ]);
}

export function exportExpensesToCsv(expenses: Expense[]) {
  const headers = ['ID', 'Expense Item', 'Category', 'Date', 'Amount (INR)', 'Notes'];
  const rows = expenses.map((e) => [e.id, e.name, e.category, e.date, e.amount, e.notes]);

  downloadCsv(`Vidzyra-Agency-Expenses-${new Date().toISOString().split('T')[0]}.csv`, [
    headers,
    ...rows,
  ]);
}

export function exportAllDataToCsv({
  clients,
  editors,
  projects,
  clientPayments,
  editorPayments,
  expenses,
}: {
  clients: Client[];
  editors: Editor[];
  projects: WorkProject[];
  clientPayments: ClientPayment[];
  editorPayments: EditorPayment[];
  expenses: Expense[];
}) {
  exportPaymentsToCsv(clientPayments, editorPayments, clients, editors);
  setTimeout(() => {
    exportExpensesToCsv(expenses);
  }, 400);
}

