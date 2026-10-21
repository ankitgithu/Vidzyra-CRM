export type SocialMediaPlatform =
  | 'Instagram'
  | 'Facebook'
  | 'YouTube'
  | 'LinkedIn'
  | 'Google Business Profile'
  | 'Website'
  | 'Other';

export type SocialClientStatus = 'Active' | 'On Hold' | 'Completed' | 'Cancelled';

export type PackageStatus = 'Active' | 'Pending Renewal' | 'Paused' | 'Expired';

export type SmmServiceCategory = 'Video' | 'Design' | 'Social Media' | 'Custom';

export interface SocialAccountItem {
  id: string;
  platform: SocialMediaPlatform;
  profileName: string;
  profileUrl: string;
  accountStatus: 'Active' | 'Needs Attention' | 'Inactive';
  notes?: string;
}

export interface MonthlyDeliverablePlan {
  id: string;
  service: string;
  category?: SmmServiceCategory;
  planned: number;
  completed: number;
  notes?: string;
}

export interface MonthlyWorkEntry {
  id: string;
  date: string; // YYYY-MM-DD
  serviceType: string;
  name: string; // Work Name / Description
  quantity: number;
  rate?: number;
  amount: number;
  assignedEditorId?: string; // Optional editor id
  assignedEditorName?: string;
  status: 'Planned' | 'In Progress' | 'Completed' | 'Cancelled';
  notes?: string;
  fileLink?: string; // Google Drive / file link
  socialPostUrl?: string; // Live post URL
}

export interface ContentCalendarEntry {
  id: string;
  date: string; // YYYY-MM-DD
  plannedContent: string;
  contentType: string; // Reel, Static Post, Carousel, Story, Video, etc.
  platform: string; // Instagram, Facebook, etc.
  status: 'Planned' | 'In Progress' | 'Completed' | 'Cancelled';
  notes?: string;
  driveLink?: string;
  postUrl?: string;
}

export interface ExtraWorkItem {
  id: string;
  date: string; // YYYY-MM-DD
  workName: string;
  serviceType: string;
  quantity: number;
  rate: number;
  amount: number;
  notes?: string;
  fileLink?: string;
}

export interface SmmPaymentItem {
  id: string;
  date: string; // YYYY-MM-DD
  amount: number;
  paymentMode: 'UPI' | 'Bank Transfer' | 'Cash' | 'Other';
  referenceNumber?: string;
  notes?: string;
  createdAt?: string;
}

export interface SmmMonthlyCycle {
  id: string; // e.g. "cycle_2026-10" or uuid
  yearMonth: string; // "2026-10"
  cycleLabel: string; // "October 2026"
  packagePrice: number; // Package amount for this month (e.g. ₹8,000)
  deliverables: MonthlyDeliverablePlan[];
  workEntries: MonthlyWorkEntry[];
  contentCalendar: ContentCalendarEntry[];
  extraWork: ExtraWorkItem[];
  payments: SmmPaymentItem[];
  notes?: string;
}

export interface SocialClientNotes {
  brandGuidelines?: string;
  preferredContentStyle?: string;
  preferredLanguage?: string;
  postingPreferences?: string;
  revisionRules?: string;
  importantDates?: string;
  festivalRequirements?: string;
  specialInstructions?: string;
  general?: string;
}

export interface SocialMediaClient {
  id: string;
  crmClientId?: string; // Optional reference to existing CRM client
  name: string; // Client / Business Name
  contactPerson: string;
  phone: string;
  whatsapp: string;
  email: string;
  businessCategory: string;
  address: string;
  managementStartDate: string; // YYYY-MM-DD
  packageStartDate: string; // YYYY-MM-DD
  packageRenewalDate: string; // YYYY-MM-DD
  clientStatus: SocialClientStatus;

  // Client Portal Access
  portalToken?: string;
  portalStatus?: 'Active' | 'Disabled';

  // Package Info
  packageName: string;
  monthlyPackagePrice: number;
  billingCycle: 'Monthly' | 'Quarterly' | 'Annually';
  packageStatus: PackageStatus;

  // Accounts
  accounts: SocialAccountItem[];

  // Monthly cycles
  cycles: SmmMonthlyCycle[];

  // Client notes & requirements
  notes: SocialClientNotes;

  createdAt: string;
  updatedAt?: string;
}

export type SmmPortalStatus = 'Active' | 'Disabled';

export function generateSmmPortalToken(clientName?: string): string {
  const cleanName = (clientName || 'client')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 10);
  const randomSuffix = Math.random().toString(36).substring(2, 9) + Math.random().toString(36).substring(2, 7);
  return `smm_${cleanName ? `${cleanName}_` : ''}${randomSuffix}`;
}

export const PREDEFINED_SMM_SERVICES = {
  VIDEO: [
    'Outdoor Shoot',
    'Indoor / Office Shoot',
    'Video Editing',
    'AI Video',
    'AI Reel',
    'Promotional Video',
    'Long Video',
    'Short Reel',
  ],
  DESIGN: [
    'Festival Post',
    'Static Post',
    'Carousel',
    'Reel Cover',
    'Story Design',
    'Offer Post',
    'Event Post',
  ],
  SOCIAL_MEDIA: [
    'Instagram Upload',
    'Facebook Upload',
    'YouTube Upload',
    'Caption',
    'Hashtags',
    'Content Planning',
    'Scheduling',
  ],
} as const;

export const SMM_BUSINESS_CATEGORIES = [
  'Restaurant / Cafe / Food',
  'Real Estate & Builders',
  'E-Commerce & D2C Brands',
  'Healthcare, Doctors & Clinics',
  'Fashion & Retail Store',
  'Fitness, Gym & Sports',
  'Education & Coaching Institute',
  'Tech, Software & IT',
  'Hospitality & Travel',
  'Event & Wedding Planner',
  'Beauty, Salon & Spa',
  'Jewellery & Luxury',
  'Automobile & Motors',
  'Professional / Financial Services',
  'Personal Branding / Creator',
  'Other Business',
] as const;
