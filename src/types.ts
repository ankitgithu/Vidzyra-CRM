export type ClientType = 'Regular' | 'Work';

export type PortalStatus = 'Active' | 'Inactive' | 'Deleted';

export type WorkDoneBy = 'Me / Custom' | 'Assigned';

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
  editorRate: number;
  editorCost?: number;
  profit?: number;
  dueDate: string; // YYYY-MM-DD
  notes: string;
  status: WorkStatus;
  createdAt: string;

  // The Exact 4-Link System:
  // Editor Links:
  userDownloadLink: string; // Editor: Download Raw Data
  userUploadLink: string;   // Editor: Upload Edited Data
  // Client Links:
  clientDownloadLink: string; // Client: Download Edited Data
  clientUploadLink: string;   // Client: Upload Raw Data

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
  | 'confirmation';

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
}

export type NotificationType =
  | 'work'
  | 'file'
  | 'confirmation'
  | 'payment'
  | 'portal'
  | 'revision';

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
}
