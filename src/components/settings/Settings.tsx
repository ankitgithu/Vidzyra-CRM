import React, { useState, useEffect } from 'react';
import {
  Building,
  CreditCard,
  Briefcase,
  Bell,
  Globe,
  Cloud,
  UserCheck,
  Save,
  CheckCircle2,
  Plus,
  X,
  RefreshCw,
  Shield,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { BusinessSettings } from '../../types';

type SettingsTab =
  | 'business'
  | 'payment'
  | 'work'
  | 'notifications'
  | 'portal'
  | 'cloud'
  | 'admin';

export const Settings: React.FC = () => {
  const { settings, updateSettings } = useCrm();

  const [activeTab, setActiveTab] = useState<SettingsTab>('business');
  const [saved, setSaved] = useState(false);

  // 1. Business
  const [businessName, setBusinessName] = useState(settings.businessName || 'Vidzyra');
  const [tagline, setTagline] = useState(settings.tagline || 'Your Social Media Partner');
  const [logo, setLogo] = useState(settings.logo || '');
  const [contactEmail, setContactEmail] = useState(settings.email || settings.contactEmail || '');
  const [phone, setPhone] = useState(settings.phone || settings.contactPhone || '');
  const [whatsapp, setWhatsapp] = useState(settings.whatsapp || settings.whatsappNumber || '');
  const [address, setAddress] = useState(settings.address || 'DLF Cyber City, Tower B, Gurugram, India');
  const [country, setCountry] = useState(settings.country || 'India');
  const [currencySymbol, setCurrencySymbol] = useState(settings.currencySymbol || '₹');

  // 2. Payment
  const [bankName, setBankName] = useState(settings.bankDetails?.bankName || '');
  const [accountName, setAccountName] = useState(settings.bankDetails?.accountName || '');
  const [accountNumber, setAccountNumber] = useState(settings.bankDetails?.accountNumber || '');
  const [ifsc, setIfsc] = useState(settings.bankDetails?.ifsc || '');
  const [upiId, setUpiId] = useState(settings.upiId || '');
  const [invoicePrefix, setInvoicePrefix] = useState(settings.receiptPrefix || settings.invoicePrefix || 'VID-REC-2026');
  const [defaultPaymentTerms, setDefaultPaymentTerms] = useState(
    settings.defaultPaymentTerms || settings.receiptNotes || 'Payment due within 7 days of invoice issue date.'
  );

  // 3. Work
  const [workTypes, setWorkTypes] = useState<string[]>(
    settings.workTypes && settings.workTypes.length > 0
      ? settings.workTypes
      : [
          'Video Editing',
          'Designing',
          'Vertical Videos',
          'Reels',
          'YouTube Shorts',
          'Poster',
          'Social Media Post',
          'Website Design',
          'Social Media Marketing',
          'Digital Marketing',
        ]
  );
  const [newWorkTypeInput, setNewWorkTypeInput] = useState('');
  const [defaultClientRate, setDefaultClientRate] = useState(settings.defaultClientRate || 2000);
  const [defaultEditorRate, setDefaultEditorRate] = useState(settings.defaultEditorRate || 900);
  const [defaultRevisionLimit, setDefaultRevisionLimit] = useState(settings.defaultRevisionLimit || 2);

  // 4. Notifications
  const [emailNotifications, setEmailNotifications] = useState(settings.emailNotifications ?? true);
  const [whatsappNotifications, setWhatsappNotifications] = useState(settings.whatsappNotifications ?? true);
  const [inAppAlerts, setInAppAlerts] = useState(settings.inAppAlerts ?? true);
  const [notifyNewWorkAlerts, setNotifyNewWorkAlerts] = useState(settings.notifyNewWorkAlerts ?? true);
  const [notifyPaymentReminders, setNotifyPaymentReminders] = useState(settings.notifyPaymentReminders ?? true);

  // 5. Portal
  const [enableClientPortal, setEnableClientPortal] = useState(settings.enableClientPortal ?? true);
  const [enableEditorPortal, setEnableEditorPortal] = useState(settings.enableEditorPortal ?? true);
  const [portalWelcomeText, setPortalWelcomeText] = useState(
    settings.portalWelcomeText ||
      'Welcome to your private Vidzyra portal. Manage files, review progress, and submit queries in one place.'
  );
  const [fourLinksGuidelinesNote, setFourLinksGuidelinesNote] = useState(
    settings.fourLinksGuidelinesNote ||
      'Ensure Google Drive links have viewer/editor permissions granted before confirming deliverable uploads.'
  );
  const [autoApproveRevisions, setAutoApproveRevisions] = useState(settings.autoApproveRevisions ?? false);

  // 6. Cloud / Drive
  const [googleDriveRootUrl, setGoogleDriveRootUrl] = useState(
    settings.googleDriveRootUrl || settings.cloudFolderRoot || 'https://drive.google.com/drive/u/0/folders/vidzyra-master'
  );
  const [dropboxRootUrl, setDropboxRootUrl] = useState(settings.dropboxRootUrl || 'https://www.dropbox.com/home/vidzyra');
  const [folderNamingConvention, setFolderNamingConvention] = useState(
    settings.folderNamingConvention || '[Client]_[Project]_[YYYYMMDD]'
  );
  const [autoGenerateLinksFormat, setAutoGenerateLinksFormat] = useState(
    settings.autoGenerateLinksFormat || 'drive.google.com/folder/{client_id}/{work_id}'
  );
  const [autoFolderCreation, setAutoFolderCreation] = useState(settings.autoFolderCreation ?? true);

  // 7. Admin / User
  const [adminName, setAdminName] = useState(settings.adminName || 'Studio Director');
  const [adminEmail, setAdminEmail] = useState(settings.adminEmail || 'admin@vidzyra.com');
  const [adminRole, setAdminRole] = useState(settings.adminRole || 'Super Admin');
  const [sessionTimeoutMinutes, setSessionTimeoutMinutes] = useState(settings.sessionTimeoutMinutes || 60);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(settings.twoFactorEnabled ?? false);

  // Keep state synced with context if updated elsewhere
  useEffect(() => {
    setBusinessName(settings.businessName || 'Vidzyra');
    setTagline(settings.tagline || 'Your Social Media Partner');
    setLogo(settings.logo || '');
    setContactEmail(settings.email || settings.contactEmail || '');
    setPhone(settings.phone || settings.contactPhone || '');
    setWhatsapp(settings.whatsapp || settings.whatsappNumber || '');
    setBankName(settings.bankDetails?.bankName || '');
    setAccountName(settings.bankDetails?.accountName || '');
    setAccountNumber(settings.bankDetails?.accountNumber || '');
    setIfsc(settings.bankDetails?.ifsc || '');
    setUpiId(settings.upiId || '');
    setDefaultClientRate(settings.defaultClientRate || 2000);
    setDefaultEditorRate(settings.defaultEditorRate || 900);
  }, [settings]);

  const handleAddWorkType = () => {
    if (!newWorkTypeInput.trim()) return;
    const trimmed = newWorkTypeInput.trim();
    if (!workTypes.includes(trimmed)) {
      setWorkTypes([...workTypes, trimmed]);
    }
    setNewWorkTypeInput('');
  };

  const handleRemoveWorkType = (typeToRemove: string) => {
    setWorkTypes(workTypes.filter((t) => t !== typeToRemove));
  };

  const handleSaveAll = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const updated: Partial<BusinessSettings> = {
      // 1. Business
      businessName,
      tagline,
      logo,
      contactEmail,
      email: contactEmail,
      contactPhone: phone,
      phone,
      whatsappNumber: whatsapp,
      whatsapp,
      address,
      country,
      currency: currencySymbol,
      currencySymbol,

      // 2. Payment
      bankDetails: {
        bankName,
        accountName,
        accountNumber,
        ifsc,
      },
      upiId,
      receiptPrefix: invoicePrefix,
      invoicePrefix,
      receiptNotes: defaultPaymentTerms,
      defaultPaymentTerms,

      // 3. Work
      workTypes,
      defaultClientRate: Number(defaultClientRate) || 2000,
      defaultEditorRate: Number(defaultEditorRate) || 900,
      defaultRevisionLimit: Number(defaultRevisionLimit) || 2,

      // 4. Notifications
      emailNotifications,
      whatsappNotifications,
      inAppAlerts,
      notifyNewWorkAlerts,
      notifyPaymentReminders,

      // 5. Portal
      enableClientPortal,
      enableEditorPortal,
      portalWelcomeText,
      fourLinksGuidelinesNote,
      autoApproveRevisions,

      // 6. Cloud / Drive
      googleDriveRootUrl,
      cloudFolderRoot: googleDriveRootUrl,
      dropboxRootUrl,
      folderNamingConvention,
      autoGenerateLinksFormat,
      autoFolderCreation,

      // 7. Admin / User
      adminName,
      adminEmail,
      adminRole,
      sessionTimeoutMinutes: Number(sessionTimeoutMinutes) || 60,
      twoFactorEnabled,
    };

    updateSettings(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 3500);
  };

  return (
    <div className="space-y-6 p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Agency &amp; System Settings</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Configure business identity, banking, deliverable pricing defaults, portals, and cloud integrations.
          </p>
        </div>
        <button
          id="btn-save-settings-header"
          type="button"
          onClick={() => handleSaveAll()}
          className="flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition self-start sm:self-auto cursor-pointer"
        >
          <Save className="w-4 h-4" />
          Save All Settings
        </button>
      </div>

      {/* Success Notification Banner */}
      {saved && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2.5 shadow-2xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <div>
            <p className="font-bold">Settings saved successfully!</p>
            <p className="text-[11px] text-emerald-700 font-normal">
              All modifications have been persisted to database storage and will survive browser reloads.
            </p>
          </div>
        </div>
      )}

      {/* 7 Settings Navigation Tabs */}
      <div className="flex items-center space-x-1 p-1 bg-slate-100 rounded-xl text-xs font-semibold overflow-x-auto">
        {[
          { id: 'business', label: '1. Business / Agency', icon: Building },
          { id: 'payment', label: '2. Payment & Bank', icon: CreditCard },
          { id: 'work', label: '3. Work & Pricing', icon: Briefcase },
          { id: 'notifications', label: '4. Notifications', icon: Bell },
          { id: 'portal', label: '5. Portals', icon: Globe },
          { id: 'cloud', label: '6. Cloud & Drive', icon: Cloud },
          { id: 'admin', label: '7. Admin / User', icon: UserCheck },
        ].map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              id={`settings-tab-${t.id}`}
              onClick={() => setActiveTab(t.id as SettingsTab)}
              className={`flex-1 py-2.5 px-3 rounded-lg transition flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
                isActive ? 'bg-white text-indigo-700 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Form Content */}
      <form onSubmit={handleSaveAll} className="space-y-6 text-xs">
        {/* ========================================================= */}
        {/* 1. BUSINESS / AGENCY SETTINGS */}
        {/* ========================================================= */}
        {activeTab === 'business' && (
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
              <Building className="w-5 h-5 text-indigo-600" />
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Business Identity &amp; Contact Info</h3>
                <p className="text-[11px] text-slate-500">
                  Displayed on client payment receipts, invoices, and the top sidebar branding.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Business / Agency Name *</label>
                <input
                  id="settings-business-name"
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tagline / Motto</label>
                <input
                  id="settings-tagline"
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Official Support Email</label>
                <input
                  id="settings-email"
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Contact Phone</label>
                <input
                  id="settings-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">WhatsApp Business Number</label>
                <input
                  id="settings-whatsapp"
                  type="tel"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Used for one-click chat triggers across the CRM.</span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Currency Symbol</label>
                <select
                  id="settings-currency"
                  value={currencySymbol}
                  onChange={(e) => setCurrencySymbol(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold text-slate-900 cursor-pointer"
                >
                  <option value="₹">₹ (INR - Indian Rupee)</option>
                  <option value="$">$ (USD - US Dollar)</option>
                  <option value="€">€ (EUR - Euro)</option>
                  <option value="£">£ (GBP - British Pound)</option>
                  <option value="AED">AED (UAE Dirham)</option>
                  <option value="CAD">CAD (Canadian Dollar)</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Logo / Branding Image URL</label>
                <input
                  id="settings-logo"
                  type="url"
                  placeholder="https://..."
                  value={logo}
                  onChange={(e) => setLogo(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Registered Agency Address</label>
                <textarea
                  id="settings-address"
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 2. PAYMENT & BANKING SETTINGS */}
        {/* ========================================================= */}
        {activeTab === 'payment' && (
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-600" />
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Banking &amp; Invoicing Details</h3>
                <p className="text-[11px] text-slate-500">
                  Printed automatically on official Vidzyra payment receipts and billing statements.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Official UPI ID</label>
                <input
                  id="settings-upi"
                  type="text"
                  placeholder="name@okbank"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-slate-900 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Bank Name</label>
                <input
                  id="settings-bank-name"
                  type="text"
                  placeholder="e.g. HDFC Bank"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Account Holder Name</label>
                <input
                  id="settings-account-name"
                  type="text"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Account Number</label>
                <input
                  id="settings-account-number"
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-slate-900 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">IFSC / Routing Code</label>
                <input
                  id="settings-ifsc"
                  type="text"
                  placeholder="HDFC0001234"
                  value={ifsc}
                  onChange={(e) => setIfsc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-slate-900 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Invoice / Receipt Prefix</label>
                <input
                  id="settings-receipt-prefix"
                  type="text"
                  placeholder="VID-REC-2026"
                  value={invoicePrefix}
                  onChange={(e) => setInvoicePrefix(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-slate-900 focus:bg-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Default Terms &amp; Conditions / Receipt Note</label>
                <textarea
                  id="settings-receipt-notes"
                  rows={2}
                  value={defaultPaymentTerms}
                  onChange={(e) => setDefaultPaymentTerms(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 3. WORK & PRICING DEFAULTS */}
        {/* ========================================================= */}
        {activeTab === 'work' && (
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-indigo-600" />
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Deliverable Formats &amp; Pricing Defaults</h3>
                <p className="text-[11px] text-slate-500">
                  Manage agency service types, default unit billing rates, and editor payout margins.
                </p>
              </div>
            </div>

            {/* Pricing Defaults */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Default Client Rate (₹ / unit)</label>
                <input
                  id="settings-default-client-rate"
                  type="number"
                  value={defaultClientRate}
                  onChange={(e) => setDefaultClientRate(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-900 focus:bg-white"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Auto-fills when creating new client projects.</span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Default Editor Rate (₹ / unit)</label>
                <input
                  id="settings-default-editor-rate"
                  type="number"
                  value={defaultEditorRate}
                  onChange={(e) => setDefaultEditorRate(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-900 focus:bg-white"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Auto-fills when assigning projects to editors.</span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Included Revision Limit</label>
                <input
                  id="settings-default-revision-limit"
                  type="number"
                  value={defaultRevisionLimit}
                  onChange={(e) => setDefaultRevisionLimit(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-900 focus:bg-white"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Free rounds before billable add-ons.</span>
              </div>
            </div>

            {/* Work Types Management */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <label className="block font-semibold text-slate-700">Agency Deliverable Formats / Work Types</label>
              <div className="flex flex-wrap gap-2">
                {workTypes.map((type) => (
                  <span
                    key={type}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg font-semibold text-xs"
                  >
                    {type}
                    <button
                      type="button"
                      onClick={() => handleRemoveWorkType(type)}
                      className="text-indigo-400 hover:text-indigo-800 transition cursor-pointer"
                      title="Remove work type"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-2 pt-2 max-w-md">
                <input
                  type="text"
                  placeholder="Add new deliverable type (e.g. Podcast Editing)..."
                  value={newWorkTypeInput}
                  onChange={(e) => setNewWorkTypeInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddWorkType();
                    }
                  }}
                  className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
                <button
                  type="button"
                  onClick={handleAddWorkType}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-xs flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 4. NOTIFICATION SETTINGS */}
        {/* ========================================================= */}
        {activeTab === 'notifications' && (
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
              <Bell className="w-5 h-5 text-amber-500" />
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Alert &amp; Dispatch Preferences</h3>
                <p className="text-[11px] text-slate-500">
                  Configure automated dispatch channels for assignments, revisions, and payment alerts.
                </p>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              <div className="py-3.5 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-900">Email Notifications</div>
                  <div className="text-[11px] text-slate-500">Send status alerts to client &amp; editor emails</div>
                </div>
                <input
                  id="settings-toggle-email"
                  type="checkbox"
                  checked={emailNotifications}
                  onChange={(e) => setEmailNotifications(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                />
              </div>

              <div className="py-3.5 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-900">WhatsApp Dispatch Triggers</div>
                  <div className="text-[11px] text-slate-500">Enable one-click pre-composed WhatsApp messages</div>
                </div>
                <input
                  id="settings-toggle-whatsapp"
                  type="checkbox"
                  checked={whatsappNotifications}
                  onChange={(e) => setWhatsappNotifications(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                />
              </div>

              <div className="py-3.5 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-900">In-App Notification Bell Alerts</div>
                  <div className="text-[11px] text-slate-500">Show red badge counters for updates in the header</div>
                </div>
                <input
                  id="settings-toggle-inapp"
                  type="checkbox"
                  checked={inAppAlerts}
                  onChange={(e) => setInAppAlerts(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                />
              </div>

              <div className="py-3.5 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-900">New Work &amp; Assignment Alerts</div>
                  <div className="text-[11px] text-slate-500">Notify editors immediately when new projects are assigned</div>
                </div>
                <input
                  id="settings-toggle-new-work"
                  type="checkbox"
                  checked={notifyNewWorkAlerts}
                  onChange={(e) => setNotifyNewWorkAlerts(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                />
              </div>

              <div className="py-3.5 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-900">Automated Payment Reminders</div>
                  <div className="text-[11px] text-slate-500">Highlight pending client invoice balances overdue by 7+ days</div>
                </div>
                <input
                  id="settings-toggle-payment-reminders"
                  type="checkbox"
                  checked={notifyPaymentReminders}
                  onChange={(e) => setNotifyPaymentReminders(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 5. PORTAL SETTINGS */}
        {/* ========================================================= */}
        {activeTab === 'portal' && (
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
              <Globe className="w-5 h-5 text-indigo-600" />
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Client &amp; Editor Self-Service Portals</h3>
                <p className="text-[11px] text-slate-500">
                  Control external access privileges, welcome banners, and deliverable review policies.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900 block">Enable Client Portals</span>
                    <span className="text-[11px] text-slate-500">Clients can log in to view deliveries &amp; invoices</span>
                  </div>
                  <input
                    id="settings-toggle-client-portal"
                    type="checkbox"
                    checked={enableClientPortal}
                    onChange={(e) => setEnableClientPortal(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                  />
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900 block">Enable Editor Portals</span>
                    <span className="text-[11px] text-slate-500">Editors can submit deliverables &amp; view payouts</span>
                  </div>
                  <input
                    id="settings-toggle-editor-portal"
                    type="checkbox"
                    checked={enableEditorPortal}
                    onChange={(e) => setEnableEditorPortal(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Portal Welcome Banner Greeting</label>
                <textarea
                  id="settings-portal-welcome"
                  rows={2}
                  value={portalWelcomeText}
                  onChange={(e) => setPortalWelcomeText(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Four-Link Upload Guidelines Note</label>
                <textarea
                  id="settings-four-links-note"
                  rows={2}
                  value={fourLinksGuidelinesNote}
                  onChange={(e) => setFourLinksGuidelinesNote(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white"
                />
              </div>

              <div className="pt-2 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-900 block">Auto-Approve Revision Submissions</span>
                  <span className="text-[11px] text-slate-500">
                    Immediately set status to "Revision Required" when client submits revision notes.
                  </span>
                </div>
                <input
                  id="settings-toggle-auto-revisions"
                  type="checkbox"
                  checked={autoApproveRevisions}
                  onChange={(e) => setAutoApproveRevisions(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 6. CLOUD & DRIVE SETTINGS */}
        {/* ========================================================= */}
        {activeTab === 'cloud' && (
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
              <Cloud className="w-5 h-5 text-indigo-600" />
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Cloud Storage &amp; Four-Link Pipeline Architecture</h3>
                <p className="text-[11px] text-slate-500">
                  Configure root directories for Google Drive, Dropbox, and automated folder path formatting.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Primary Google Drive Master Root URL</label>
                <input
                  id="settings-drive-url"
                  type="url"
                  value={googleDriveRootUrl}
                  onChange={(e) => setGoogleDriveRootUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-slate-900 focus:bg-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Secondary / Backup Dropbox Root URL</label>
                <input
                  id="settings-dropbox-url"
                  type="url"
                  value={dropboxRootUrl}
                  onChange={(e) => setDropboxRootUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-slate-900 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Cloud Folder Naming Convention</label>
                <input
                  id="settings-folder-naming"
                  type="text"
                  value={folderNamingConvention}
                  onChange={(e) => setFolderNamingConvention(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-slate-900 focus:bg-white"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Supported tokens: [Client], [Project], [YYYYMMDD]</span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Auto-Generate Link Format</label>
                <input
                  id="settings-link-format"
                  type="text"
                  value={autoGenerateLinksFormat}
                  onChange={(e) => setAutoGenerateLinksFormat(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-slate-900 focus:bg-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 7. ADMIN / USER SETTINGS */}
        {/* ========================================================= */}
        {activeTab === 'admin' && (
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-indigo-600" />
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Producer &amp; Admin Profile Credentials</h3>
                <p className="text-[11px] text-slate-500">
                  Manage agency executive access, security settings, and session expiration timeout.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Administrator Display Name</label>
                <input
                  id="settings-admin-name"
                  type="text"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold text-slate-900 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Admin Email Address</label>
                <input
                  id="settings-admin-email"
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">System Role</label>
                <input
                  id="settings-admin-role"
                  type="text"
                  value={adminRole}
                  onChange={(e) => setAdminRole(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Session Inactivity Timeout (Minutes)</label>
                <input
                  id="settings-session-timeout"
                  type="number"
                  value={sessionTimeoutMinutes}
                  onChange={(e) => setSessionTimeoutMinutes(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white"
                />
              </div>

              <div className="sm:col-span-2 pt-2 flex items-center justify-between border-t border-slate-100">
                <div>
                  <span className="font-semibold text-slate-900 block">Enforce Two-Factor Authentication (2FA)</span>
                  <span className="text-[11px] text-slate-500">Require OTP code for administrative settings access</span>
                </div>
                <input
                  id="settings-toggle-2fa"
                  type="checkbox"
                  checked={twoFactorEnabled}
                  onChange={(e) => setTwoFactorEnabled(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* Form Footer Save CTA */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
          <span className="text-[11px] text-slate-400">
            Vidzyra CRM • Changes apply immediately across all modules
          </span>
          <button
            id="btn-save-settings-bottom"
            type="submit"
            className="flex items-center gap-1.5 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <Save className="w-4 h-4" />
            Save Agency Settings
          </button>
        </div>
      </form>
    </div>
  );
};
