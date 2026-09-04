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
} from './types';

export const initialSettings: BusinessSettings = {
  businessName: 'Vidzyra',
  tagline: 'Your Social Media Partner',
  contactEmail: 'contact@vidzyra.com',
  contactPhone: '+91 98765 43210',
  whatsappNumber: '+919876543210',
  phone: '+91 98765 43210',
  email: 'contact@vidzyra.com',
  whatsapp: '+919876543210',
  currency: '₹',
  currencySymbol: '₹',
  receiptPrefix: 'VID-REC-2026',
  cloudFolderRoot: 'https://drive.google.com/drive/u/0/folders/vidzyra-master',
  portalWelcomeText: 'Welcome to your private Vidzyra portal. Manage files, review progress, and submit queries in one place.',
  logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80',
  upiId: 'vidzyra@icici',
  bankDetails: {
    bankName: 'HDFC Bank',
    accountName: 'Vidzyra Media Agency LLP',
    accountNumber: '50200084920192',
    ifsc: 'HDFC0001234',
  },
  defaultClientRate: 2000,
  defaultEditorRate: 900,
  paymentMethods: ['UPI', 'Bank Transfer', 'Cash', 'Credit/Debit Card', 'PayPal', 'Cheque'],
  workTypes: ['Video Editing', 'Designing', 'Vertical Videos', 'Reels', 'YouTube Shorts', 'Poster', 'Website Design'],
  receiptNotes: 'Thank you for partnering with Vidzyra. All deliverables are subject to the master service agreement.',
  emailNotifications: true,
  whatsappNotifications: true,
  inAppAlerts: true,
  enableClientPortal: true,
  enableEditorPortal: true,
  autoApproveRevisions: false,
  googleDriveRootUrl: 'https://drive.google.com/drive/folders/vidzyra-root',
  dropboxRootUrl: 'https://www.dropbox.com/home/vidzyra',
  autoFolderCreation: true,
  adminName: 'Studio Director',
  adminEmail: 'admin@vidzyra.com',
  adminRole: 'Super Admin',
};

// Default empty database collections (No mock or demo data)
export const initialClients: Client[] = [];
export const initialEditors: Editor[] = [];
export const initialProjects: WorkProject[] = [];
export const initialClientPayments: ClientPayment[] = [];
export const initialEditorPayments: EditorPayment[] = [];
export const initialExpenses: Expense[] = [];
export const initialActivities: Activity[] = [];
export const initialNotifications: NotificationItem[] = [];
