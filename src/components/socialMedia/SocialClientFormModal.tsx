import React, { useState, useEffect } from 'react';
import {
  X,
  Building,
  User,
  Phone,
  Mail,
  Calendar,
  Share2,
  Plus,
  Trash2,
  DollarSign,
  FileText,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import {
  SocialMediaClient,
  SocialAccountItem,
  SocialMediaPlatform,
  SocialClientStatus,
  PackageStatus,
  SMM_BUSINESS_CATEGORIES,
} from '../../types';

interface SocialClientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientToEdit?: SocialMediaClient | null;
  onSaved?: (client: SocialMediaClient) => void;
}

export const SocialClientFormModal: React.FC<SocialClientFormModalProps> = ({
  isOpen,
  onClose,
  clientToEdit,
  onSaved,
}) => {
  const { clients, addSocialMediaClient, updateSocialMediaClient } = useCrm();

  const isEditing = !!clientToEdit;

  // Form State
  const [selectedCrmClientId, setSelectedCrmClientId] = useState<string>('');
  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [businessCategory, setBusinessCategory] = useState<string>('Restaurant / Cafe / Food');
  const [customCategory, setCustomCategory] = useState('');
  const [address, setAddress] = useState('');
  const [managementStartDate, setManagementStartDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [packageStartDate, setPackageStartDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [packageRenewalDate, setPackageRenewalDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().split('T')[0];
  });
  const [clientStatus, setClientStatus] = useState<SocialClientStatus>('Active');

  // Package State
  const [packageName, setPackageName] = useState('Monthly Social Media Management');
  const [monthlyPackagePrice, setMonthlyPackagePrice] = useState<number | string>(8000);
  const [billingCycle, setBillingCycle] = useState<'Monthly' | 'Quarterly' | 'Annually'>('Monthly');
  const [packageStatus, setPackageStatus] = useState<PackageStatus>('Active');

  // Accounts State
  const [accounts, setAccounts] = useState<SocialAccountItem[]>([
    {
      id: `acc_init_1`,
      platform: 'Instagram',
      profileName: '',
      profileUrl: '',
      accountStatus: 'Active',
    },
  ]);

  // Notes
  const [brandGuidelines, setBrandGuidelines] = useState('');
  const [preferredContentStyle, setPreferredContentStyle] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState('');
  const [postingPreferences, setPostingPreferences] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (clientToEdit) {
      setSelectedCrmClientId(clientToEdit.crmClientId || '');
      setName(clientToEdit.name);
      setContactPerson(clientToEdit.contactPerson || '');
      setPhone(clientToEdit.phone || '');
      setWhatsapp(clientToEdit.whatsapp || '');
      setEmail(clientToEdit.email || '');
      if (SMM_BUSINESS_CATEGORIES.includes(clientToEdit.businessCategory as any)) {
        setBusinessCategory(clientToEdit.businessCategory);
        setCustomCategory('');
      } else {
        setBusinessCategory('Other Business');
        setCustomCategory(clientToEdit.businessCategory);
      }
      setAddress(clientToEdit.address || '');
      setManagementStartDate(clientToEdit.managementStartDate || new Date().toISOString().split('T')[0]);
      setPackageStartDate(clientToEdit.packageStartDate || new Date().toISOString().split('T')[0]);
      setPackageRenewalDate(clientToEdit.packageRenewalDate || '');
      setClientStatus(clientToEdit.clientStatus || 'Active');

      setPackageName(clientToEdit.packageName || 'Monthly Social Media Management');
      setMonthlyPackagePrice(clientToEdit.monthlyPackagePrice || 0);
      setBillingCycle(clientToEdit.billingCycle || 'Monthly');
      setPackageStatus(clientToEdit.packageStatus || 'Active');

      setAccounts(
        clientToEdit.accounts && clientToEdit.accounts.length > 0
          ? clientToEdit.accounts
          : [
              {
                id: `acc_init_1`,
                platform: 'Instagram',
                profileName: '',
                profileUrl: '',
                accountStatus: 'Active',
              },
            ]
      );

      setBrandGuidelines(clientToEdit.notes?.brandGuidelines || '');
      setPreferredContentStyle(clientToEdit.notes?.preferredContentStyle || '');
      setPreferredLanguage(clientToEdit.notes?.preferredLanguage || '');
      setPostingPreferences(clientToEdit.notes?.postingPreferences || '');
      setSpecialInstructions(clientToEdit.notes?.specialInstructions || '');
    } else {
      setSelectedCrmClientId('');
      setName('');
      setContactPerson('');
      setPhone('');
      setWhatsapp('');
      setEmail('');
      setBusinessCategory('Restaurant / Cafe / Food');
      setCustomCategory('');
      setAddress('');
      const today = new Date().toISOString().split('T')[0];
      setManagementStartDate(today);
      setPackageStartDate(today);
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      setPackageRenewalDate(nextMonth.toISOString().split('T')[0]);
      setClientStatus('Active');

      setPackageName('Monthly Social Media Management');
      setMonthlyPackagePrice(8000);
      setBillingCycle('Monthly');
      setPackageStatus('Active');

      setAccounts([
        {
          id: `acc_init_1`,
          platform: 'Instagram',
          profileName: '',
          profileUrl: '',
          accountStatus: 'Active',
        },
      ]);

      setBrandGuidelines('');
      setPreferredContentStyle('');
      setPreferredLanguage('');
      setPostingPreferences('');
      setSpecialInstructions('');
    }
    setError(null);
  }, [clientToEdit, isOpen]);

  // Handle auto-populating from existing CRM client
  const handleSelectCrmClient = (crmClientId: string) => {
    setSelectedCrmClientId(crmClientId);
    if (!crmClientId) return;

    const found = clients.find((c) => c.id === crmClientId);
    if (found) {
      if (!name) setName(found.name);
      if (!phone && found.phone) setPhone(found.phone);
      if (!whatsapp && found.whatsapp) setWhatsapp(found.whatsapp);
      if (!email && found.email) setEmail(found.email);
      if (!contactPerson && found.name) setContactPerson(found.name);
    }
  };

  const handleAddAccount = () => {
    setAccounts((prev) => [
      ...prev,
      {
        id: `acc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        platform: 'Instagram',
        profileName: '',
        profileUrl: '',
        accountStatus: 'Active',
      },
    ]);
  };

  const handleUpdateAccount = (idx: number, updates: Partial<SocialAccountItem>) => {
    setAccounts((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], ...updates };
      return copy;
    });
  };

  const handleRemoveAccount = (idx: number) => {
    setAccounts((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter the client / business name.');
      return;
    }

    const priceNum = Number(monthlyPackagePrice);
    if (isNaN(priceNum) || priceNum < 0) {
      setError('Please enter a valid monthly package price.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const finalCategory =
        businessCategory === 'Other Business' && customCategory.trim()
          ? customCategory.trim()
          : businessCategory;

      const validAccounts = accounts.filter(
        (a) => a.profileName.trim() || a.profileUrl.trim()
      );

      const notesPayload = {
        brandGuidelines: brandGuidelines.trim(),
        preferredContentStyle: preferredContentStyle.trim(),
        preferredLanguage: preferredLanguage.trim(),
        postingPreferences: postingPreferences.trim(),
        specialInstructions: specialInstructions.trim(),
      };

      if (isEditing && clientToEdit) {
        await updateSocialMediaClient(clientToEdit.id, {
          crmClientId: selectedCrmClientId || undefined,
          name: name.trim(),
          contactPerson: contactPerson.trim(),
          phone: phone.trim(),
          whatsapp: whatsapp.trim(),
          email: email.trim(),
          businessCategory: finalCategory,
          address: address.trim(),
          managementStartDate,
          packageStartDate,
          packageRenewalDate,
          clientStatus,
          packageName: packageName.trim() || 'Monthly Social Media Management',
          monthlyPackagePrice: priceNum,
          billingCycle,
          packageStatus,
          accounts: validAccounts,
          notes: notesPayload,
        });
        if (onSaved) {
          onSaved({
            ...clientToEdit,
            crmClientId: selectedCrmClientId || undefined,
            name: name.trim(),
            contactPerson: contactPerson.trim(),
            phone: phone.trim(),
            whatsapp: whatsapp.trim(),
            email: email.trim(),
            businessCategory: finalCategory,
            address: address.trim(),
            managementStartDate,
            packageStartDate,
            packageRenewalDate,
            clientStatus,
            packageName: packageName.trim() || 'Monthly Social Media Management',
            monthlyPackagePrice: priceNum,
            billingCycle,
            packageStatus,
            accounts: validAccounts,
            notes: notesPayload,
          });
        }
      } else {
        // Create initial monthly cycle (for the current month)
        const now = new Date();
        const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const monthNames = [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'
        ];
        const cycleLabel = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;

        const initialDeliverables = [
          { id: `del_${Date.now()}_1`, service: 'Outdoor Shoot', category: 'Video' as const, planned: 2, completed: 0 },
          { id: `del_${Date.now()}_2`, service: 'Video Editing', category: 'Video' as const, planned: 15, completed: 0 },
          { id: `del_${Date.now()}_3`, service: 'AI Video', category: 'Video' as const, planned: 5, completed: 0 },
          { id: `del_${Date.now()}_4`, service: 'Festival Post', category: 'Design' as const, planned: 4, completed: 0 },
          { id: `del_${Date.now()}_5`, service: 'Static Post', category: 'Design' as const, planned: 5, completed: 0 },
          { id: `del_${Date.now()}_6`, service: 'Story Design', category: 'Design' as const, planned: 20, completed: 0 },
        ];

        const initialCycle = {
          id: `cycle_${yearMonth}`,
          yearMonth,
          cycleLabel,
          packagePrice: priceNum,
          deliverables: initialDeliverables,
          workEntries: [],
          contentCalendar: [],
          extraWork: [],
          payments: [],
        };

        const created = await addSocialMediaClient({
          crmClientId: selectedCrmClientId || undefined,
          name: name.trim(),
          contactPerson: contactPerson.trim(),
          phone: phone.trim(),
          whatsapp: whatsapp.trim(),
          email: email.trim(),
          businessCategory: finalCategory,
          address: address.trim(),
          managementStartDate,
          packageStartDate,
          packageRenewalDate,
          clientStatus,
          packageName: packageName.trim() || 'Monthly Social Media Management',
          monthlyPackagePrice: priceNum,
          billingCycle,
          packageStatus,
          accounts: validAccounts,
          cycles: [initialCycle],
          notes: notesPayload,
        });

        if (onSaved) {
          onSaved(created);
        }
      }

      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save client. Please check details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 border border-indigo-400/30 rounded-xl text-indigo-300">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold leading-tight">
                {isEditing ? `Edit Social Media Client: ${clientToEdit.name}` : 'New Social Media Management Client'}
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Set up recurring monthly management, deliverables, accounts, and renewal terms.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1 text-xs text-slate-700">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 0: Link Existing CRM Client (Optional) */}
          <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                <User className="w-3.5 h-3.5 text-indigo-600" />
                Select Existing Client (Optional)
              </label>
              <span className="text-[11px] text-slate-500">Auto-fills contact info without modifying original records</span>
            </div>
            <select
              value={selectedCrmClientId}
              onChange={(e) => handleSelectCrmClient(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800"
            >
              <option value="">-- Start Fresh or Choose from Existing CRM Clients --</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.phone ? `(${c.phone})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Section 1: Business / Client Profile */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-indigo-600" />
              1. Business &amp; Contact Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Business / Brand Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Royal Cafe &amp; Restro"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Contact Person</label>
                <input
                  type="text"
                  placeholder="e.g. Rohan Sharma (Owner)"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">WhatsApp Number</label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="contact@royalcafe.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Business Category</label>
                <select
                  value={businessCategory}
                  onChange={(e) => setBusinessCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                >
                  {SMM_BUSINESS_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                {businessCategory === 'Other Business' && (
                  <input
                    type="text"
                    placeholder="Specify business niche..."
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    className="w-full mt-2 px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                  />
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Business Address / Location</label>
                <input
                  type="text"
                  placeholder="City, Commercial Area / Landmark"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Monthly Package & Renewal */}
          <div className="space-y-3 pt-2">
            <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
              2. Monthly Package &amp; Billing Cycle
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Package Name</label>
                <input
                  type="text"
                  placeholder="e.g. Standard Monthly Growth Package"
                  value={packageName}
                  onChange={(e) => setPackageName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Monthly Package Price (₹) *</label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  required
                  placeholder="8000"
                  value={monthlyPackagePrice}
                  onChange={(e) => setMonthlyPackagePrice(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Billing Cycle</label>
                <select
                  value={billingCycle}
                  onChange={(e) => setBillingCycle(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                >
                  <option value="Monthly">Monthly</option>
                  <option value="Quarterly">Quarterly</option>
                  <option value="Annually">Annually</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Package Start Date</label>
                <input
                  type="date"
                  value={packageStartDate}
                  onChange={(e) => setPackageStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Package Renewal Date</label>
                <input
                  type="date"
                  value={packageRenewalDate}
                  onChange={(e) => setPackageRenewalDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-indigo-700"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Client Status</label>
                <select
                  value={clientStatus}
                  onChange={(e) => setClientStatus(e.target.value as SocialClientStatus)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-medium"
                >
                  <option value="Active">Active</option>
                  <option value="On Hold">On Hold</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Package Status</label>
                <select
                  value={packageStatus}
                  onChange={(e) => setPackageStatus(e.target.value as PackageStatus)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-medium"
                >
                  <option value="Active">Active</option>
                  <option value="Pending Renewal">Pending Renewal</option>
                  <option value="Paused">Paused</option>
                  <option value="Expired">Expired</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Overall Management Start Date</label>
                <input
                  type="date"
                  value={managementStartDate}
                  onChange={(e) => setManagementStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Social Media Accounts */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
              <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5 text-indigo-600" />
                3. Social Media Accounts
              </h3>
              <button
                type="button"
                onClick={handleAddAccount}
                className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Account
              </button>
            </div>

            <p className="text-[11px] text-slate-500 italic">
              Note: Do not enter passwords or login credentials. Enter only public handles and profile links.
            </p>

            <div className="space-y-2.5">
              {accounts.map((acc, idx) => (
                <div
                  key={acc.id || idx}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-12 gap-2 items-center"
                >
                  <div className="sm:col-span-3">
                    <label className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Platform</label>
                    <select
                      value={acc.platform}
                      onChange={(e) => handleUpdateAccount(idx, { platform: e.target.value as SocialMediaPlatform })}
                      className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                    >
                      <option value="Instagram">Instagram</option>
                      <option value="Facebook">Facebook</option>
                      <option value="YouTube">YouTube</option>
                      <option value="LinkedIn">LinkedIn</option>
                      <option value="Google Business Profile">Google Business</option>
                      <option value="Website">Website</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="sm:col-span-3">
                    <label className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Profile / Handle</label>
                    <input
                      type="text"
                      placeholder="@handle or Page Name"
                      value={acc.profileName}
                      onChange={(e) => handleUpdateAccount(idx, { profileName: e.target.value })}
                      className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>

                  <div className="sm:col-span-5">
                    <label className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Profile URL</label>
                    <input
                      type="url"
                      placeholder="https://instagram.com/..."
                      value={acc.profileUrl}
                      onChange={(e) => handleUpdateAccount(idx, { profileUrl: e.target.value })}
                      className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>

                  <div className="sm:col-span-1 flex justify-end pt-3 sm:pt-0">
                    <button
                      type="button"
                      onClick={() => handleRemoveAccount(idx)}
                      disabled={accounts.length === 1}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-200 transition disabled:opacity-30 cursor-pointer"
                      title="Remove Account"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Brand Guidelines & Client Notes */}
          <div className="space-y-3 pt-2">
            <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-indigo-600" />
              4. Client Guidelines &amp; Preferences
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Brand Guidelines</label>
                <textarea
                  rows={2}
                  placeholder="Colors, font styles, logo placement rules..."
                  value={brandGuidelines}
                  onChange={(e) => setBrandGuidelines(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs resize-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Preferred Content Style</label>
                <textarea
                  rows={2}
                  placeholder="Minimalist, energetic, aesthetic, talking head reels..."
                  value={preferredContentStyle}
                  onChange={(e) => setPreferredContentStyle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs resize-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Preferred Language / Tone</label>
                <input
                  type="text"
                  placeholder="e.g. Hindi + English (Hinglish), Friendly and engaging"
                  value={preferredLanguage}
                  onChange={(e) => setPreferredLanguage(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Posting Preferences / Schedule</label>
                <input
                  type="text"
                  placeholder="e.g. 3 Reels/week, 6 PM - 8 PM peak hours"
                  value={postingPreferences}
                  onChange={(e) => setPostingPreferences(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Important Dates / Special Instructions</label>
                <textarea
                  rows={2}
                  placeholder="Founding anniversary, special promotions, festivals to cover..."
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs resize-none"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl font-semibold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving...' : isEditing ? 'Save Client Updates' : 'Enroll Social Media Client'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
