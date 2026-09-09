export type ClientType = 'Regular' | 'Work';

export type PortalStatus = 'Active' | 'Inactive' | 'Deleted';

export type WorkDoneBy = 'Me / Custom' | 'Assigned' | 'Self';

export type WorkType =
  | 'Video Editing'
  | 'Designing'
  | 'Vertical Videos'
  | 'Reels'
  | 'YouTube Shorts'
  | 'Poster'
  | 'Social Media Post'
  | 'Website Design'
  | 'Social Media Marketing'
  | 'Digital Marketing'
  | 'Custom';

export type WorkStatus =
  | 'Pending'
  | 'Assigned'
  | 'In Progress'
  | 'Completed'
  | 'Delivered'
  | 'Cancelled'
  | 'Revision Required'
  | 'Approved';

export type ProjectPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export type EditorAvailability = 'Available' | 'Busy' | 'Away' | 'Offline';

export type ProjectStatus = WorkStatus;

export type ExpenseCategory =
  | 'Software & AI Subscriptions'
  | 'Assets & Music'
  | 'Gear & Hardware'
  | 'Marketing & Ads'
  | 'Team Perks'
  | 'Other';

export type EditorPortalWorkStatus =
  | 'Assigned'
  | 'Downloaded'
  | 'In Progress'
  | 'Edited'
  | 'Uploaded'
  | 'Completed'
  | 'Revision Required';

export type ClientPortalWorkStatus =
  | 'Pending'
  | 'Raw Data Uploaded'
  | 'Reviewing'
  | 'Downloaded'
  | 'Approved'
  | 'Revision Required'
  | 'Completed';

export type RevisionStatus =
  | 'No Revision'
  | 'Revision Requested'
  | 'Revision In Progress'
  | 'Revision Uploaded'
  | 'Revision Completed';

export type PaymentType = 'Advance' | 'Partial' | 'Final';
export type PaymentStatus = 'Paid' | 'Partial' | 'Pending';

export type PaymentMethod =
  | 'UPI'
  | 'Bank Transfer'
  | 'Cash'
  | 'Credit/Debit Card'
  | 'PayPal'
  | 'Cheque'
  | 'Other';

export interface TimelineEvent {
  id: string;
  person: string;
  action: string;
  date: string;
  time: string;
  status: string;
}

export interface WorkProject {
  id: string;
  clientId: string;
  name: string;
  workType: WorkType;
  quantity: number;
  clientRate: number;
  totalBilling: number; // quantity * clientRate
  workDoneBy: WorkDoneBy;
  assignedTo: string | null; // Editor ID or null
  editorId?: string; // Optional alias for editor ID
  assignedEditorId?: string; // Optional alias for editor ID
  editorRate: number;
  editorCost?: number;
  profit?: number;
  dueDate: string; // YYYY-MM-DD
  priority?: ProjectPriority; // 'Low' | 'Medium' | 'High' | 'Urgent'
  completedAt?: string;
  lastReminderState?: string;
  lastReminderSentAt?: string;
  notes: string;
  status: WorkStatus;
  createdAt: string;
  updatedAt?: string;

  // Canonical Single Shared Google Drive Folder per project
  driveFolderUrl?: string;

  // Legacy Drive Link Fields (preserved for backwards compatibility with existing projects, not required for new projects)
  userDownloadLink?: string; // Legacy: Editor Download Raw Data
  userUploadLink?: string;   // Legacy: Editor Upload Edited Data
  clientDownloadLink?: string; // Legacy: Client Download Edited Data
  clientUploadLink?: string;   // Legacy: Client Upload Raw Data

  // Manual Confirmations
  editorDownloadConfirmed: boolean;
  editorDownloadConfirmedAt?: string;
  editorUploadConfirmed: boolean;
  editorUploadConfirmedAt?: string;
  clientUploadConfirmed: boolean;
  clientUploadConfirmedAt?: string;
  clientDownloadConfirmed: boolean;
  clientDownloadConfirmedAt?: string;

  // Revision Workflow
  revisionCount: number;
  revisionStatus: RevisionStatus;
  revisionRequestedDate?: string;
  revisionNotes?: string;
  revisionTimecode?: string;
  revisionUploadedDate?: string;
  revisionCompletedDate?: string;

  // Review & Approval Workflow
  reviewStatus?: string;
  reviewNotes?: string;
  approvedAt?: string;
  approvedBy?: string;

  // Project-Level Live Chat Control (Admin moderated)
  chatEnabled?: boolean; // Defaults to true if editor assigned, false if disabled by admin or upon client approval

  // Timeline
  timeline: TimelineEvent[];
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  whatsapp: string;
  clientType: ClientType;
  defaultClientRate: number;
  notes: string;
  portalToken: string;
  portalStatus: PortalStatus;
  createdAt: string;
}

export interface Editor {
  id: string;
  name: string;
  email: string;
  contact: string;
  editorRate: number;
  notes: string;
  portalToken: string;
  portalStatus: PortalStatus;
  availability?: EditorAvailability;
  availabilityNote?: string;
  createdAt: string;
}

export interface ClientPayment {
  id: string;
  receiptNumber: string;
  clientId: string;
  workId?: string;
  amount: number;
  date: string;
  paymentDate?: string;
  paymentMethod: PaymentMethod;
  referenceNumber: string;
  paymentType: PaymentType;
  notes: string;
  createdAt: string;
  updatedAt?: string;
}

export interface EditorPayment {
  id: string;
  receiptNumber: string;
  editorId: string;
  workId?: string;
  amount: number;
  date: string;
  paymentDate?: string;
  paymentMethod: PaymentMethod;
  referenceNumber: string;
  paymentType: PaymentType;
  notes: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Expense {
  id: string;
  name: string;
  title?: string;
  category: string;
  amount: number;
  date: string;
  paymentMethod?: string;
  notes: string;
  createdAt: string;
}

export type ActivityEntityType =
  | 'client'
  | 'editor'
  | 'work'
  | 'payment'
  | 'portal'
  | 'file'
  | 'revision'
  | 'expense'
  | 'confirmation'
  | 'chat'
  | 'rating'
  | 'invoice'
  | 'receipt'
  | 'reminder'
  | 'task'
  | 'settings';

export interface Activity {
  id: string;
  who: string;
  action: string;
  what: string;
  when: string;
  timestamp: number;
  entityType: ActivityEntityType;
  entityId?: string;
  clientId?: string;
  editorId?: string;
  workId?: string;
}

export type NotificationType =
  | 'work'
  | 'file'
  | 'confirmation'
  | 'payment'
  | 'portal'
  | 'revision'
  | 'chat'
  | 'rating'
  | 'invoice'
  | 'receipt'
  | 'reminder'
  | 'deadline';

export type ChatMessageStatus = 'PENDING_ADMIN_REVIEW' | 'APPROVED' | 'REJECTED';
export type ChatSenderRole = 'client' | 'editor' | 'admin';

export interface ChatMessage {
  id: string;
  projectId: string; // Equivalent to workId
  workId: string;
  clientId: string;
  editorId: string;
  senderId: string;
  senderRole: ChatSenderRole;
  senderName: string;
  recipientId: string; // Specific ID or 'admin' / 'all'
  recipientRole: 'client' | 'editor' | 'admin' | 'all';
  message: string;
  status: ChatMessageStatus;
  moderationCategory?: string;
  createdAt: string;
  reviewedAt?: string;
  reviewedByAdminId?: string;
  rejectionReason?: string;
}

export interface NotificationItem {
  id: string;
  type: NotificationType;
  message: string;
  recipientId?: string; // Specific user or admin ID for strict routing
  recipientRole?: 'admin' | 'client' | 'editor' | 'all';
  relatedClientId?: string;
  relatedEditorId?: string;
  relatedWorkId?: string;
  relatedPaymentId?: string;
  targetRole?: 'admin' | 'client' | 'editor' | 'all';
  date: string;
  time: string;
  timestamp: number;
  read: boolean;
}

export interface BusinessSettings {
  businessName: string;
  tagline: string;
  contactEmail: string;
  contactPhone: string;
  whatsappNumber: string;
  currency: string;
  receiptPrefix: string;
  cloudFolderRoot: string;
  portalWelcomeText: string;
  logo?: string;
  phone?: string;
  email?: string;
  whatsapp?: string;
  upiId?: string;
  bankDetails?: {
    bankName: string;
    accountName: string;
    accountNumber: string;
    ifsc: string;
  };
  defaultClientRate?: number;
  defaultEditorRate?: number;
  currencySymbol?: string;
  paymentMethods?: string[];
  workTypes?: string[];
  receiptNotes?: string;
  // Notification settings
  emailNotifications?: boolean;
  whatsappNotifications?: boolean;
  inAppAlerts?: boolean;
  // Portal settings
  enableClientPortal?: boolean;
  enableEditorPortal?: boolean;
  autoApproveRevisions?: boolean;
  // Cloud / Drive link settings
  googleDriveRootUrl?: string;
  dropboxRootUrl?: string;
  autoFolderCreation?: boolean;
  // Admin / User settings
  adminName?: string;
  adminEmail?: string;
  adminRole?: string;
  address?: string;
  country?: string;
  invoicePrefix?: string;
  defaultPaymentTerms?: string;
  defaultRevisionLimit?: number;
  notifyNewWorkAlerts?: boolean;
  notifyPaymentReminders?: boolean;
  fourLinksGuidelinesNote?: string;
  folderNamingConvention?: string;
  autoGenerateLinksFormat?: string;
  sessionTimeoutMinutes?: number;
  twoFactorEnabled?: boolean;
  dashboardWidgets?: DashboardWidgetConfig[];
}

export interface DashboardWidgetConfig {
  id: string;
  title: string;
  enabled: boolean;
  order: number;
}

export interface Rating {
  id?: string;
  projectId?: string;
  projectName?: string;
  clientId?: string;
  clientName?: string;
  editorId?: string;
  editorName?: string;
  ratedBy?: 'client' | 'editor' | 'admin';
  raterId?: string;
  raterName?: string;
  targetRole?: 'client' | 'editor' | 'admin';
  targetType?: 'client' | 'editor' | 'project';
  targetId: string;
  targetName?: string;
  authorRole?: 'admin' | 'client' | 'editor';
  authorId?: string;
  authorName?: string;
  category?: string;
  rating?: number; // 1 to 5
  score?: number; // 1 to 5
  feedback?: string;
  createdAt: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  workId?: string;
  projectName?: string;
  date: string;
  dueDate?: string;
  items: InvoiceItem[];
  subtotal: number;
  tax?: number;
  total: number;
  paidAmount: number;
  dueAmount: number;
  paymentStatus: PaymentStatus;
  notes?: string;
  createdAt: string;
}

export interface Receipt {
  id: string;
  receiptNumber: string;
  clientId: string;
  clientName: string;
  paymentId?: string;
  workId?: string;
  projectName?: string;
  amountReceived: number;
  paymentMethod: PaymentMethod;
  paymentDate: string;
  remainingBalance: number;
  notes?: string;
  createdAt: string;
}

export interface BackupHistoryRecord {
  id: string;
  timestamp: string;
  date: string;
  time: string;
  type: 'Full JSON Backup' | 'Pre-Restore Safety Backup' | 'System Snapshot' | 'PDF Snapshot' | string;
  backupType?: string;
  fileName: string;
  jsonFileName?: string;
  pdfFileName?: string;
  jsonStoragePath?: string;
  pdfStoragePath?: string;
  fileSizeBytes?: number;
  fileSizeFormatted?: string;
  jsonSize?: number;
  jsonSizeFormatted?: string;
  pdfSize?: number;
  pdfSizeFormatted?: string;
  status?: 'Ready' | 'Available' | 'Failed';
  createdBy?: string;
  counts: {
    clients: number;
    editors: number;
    projects: number;
    payments: number;
    expenses: number;
    invoices: number;
    receipts?: number;
    revisions?: number;
    notifications?: number;
    activities?: number;
    chatMessages?: number;
    sharedLinks?: number;
    calendarTasks?: number;
  };
  createdAt: string;
}

export type CalendarTaskPriority = 'Low' | 'Medium' | 'High';

export type CalendarTaskType =
  | 'To-Do'
  | 'Reminder'
  | 'Follow-up'
  | 'Meeting'
  | 'Personal/Admin Task';

export type CalendarTaskStatus = 'Pending' | 'Completed';

export interface CalendarTask {
  id: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm or empty
  priority: CalendarTaskPriority;
  type: CalendarTaskType;
  status: CalendarTaskStatus;
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
}


