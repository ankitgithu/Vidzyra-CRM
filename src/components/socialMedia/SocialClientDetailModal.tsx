import React, { useState, useMemo } from 'react';
import {
  X,
  Building,
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileDown,
  Plus,
  Trash2,
  Edit2,
  ExternalLink,
  DollarSign,
  Share2,
  FileText,
  List,
  CalendarDays,
  Sparkles,
  Link2,
  Check,
  ChevronRight,
  TrendingUp,
  Layers,
  Phone,
  MessageCircle,
  Mail,
  User,
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import {
  SocialMediaClient,
  SmmMonthlyCycle,
  MonthlyDeliverablePlan,
  MonthlyWorkEntry,
  ContentCalendarEntry,
  ExtraWorkItem,
  SmmPaymentItem,
  SocialAccountItem,
  SocialMediaPlatform,
  PREDEFINED_SMM_SERVICES,
} from '../../types';
import { generateSmmMonthlyReportPdf } from '../../utils/smmPdfGenerator';
import { SmmSharePortalModal } from './SmmSharePortalModal';

interface SocialClientDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string | null;
  onEditClient?: (client: SocialMediaClient) => void;
}

export const SocialClientDetailModal: React.FC<SocialClientDetailModalProps> = ({
  isOpen,
  onClose,
  clientId,
  onEditClient,
}) => {
  const { socialMediaClients, updateSocialMediaClient, editors, settings } = useCrm();

  const client = useMemo(() => {
    return socialMediaClients.find((c) => c.id === clientId) || null;
  }, [socialMediaClients, clientId]);

  // Tab State
  const [activeTab, setActiveTab] = useState<
    'deliverables' | 'calendar' | 'extrawork' | 'payments' | 'accounts' | 'guidelines'
  >('deliverables');

  // Active Month Cycle State
  const [selectedCycleId, setSelectedCycleId] = useState<string>('');

  // Calendar View mode (Calendar vs List)
  const [calendarViewMode, setCalendarViewMode] = useState<'calendar' | 'list'>('calendar');

  // Sub-Modals
  const [isAddDeliverableOpen, setIsAddDeliverableOpen] = useState(false);
  const [isAddWorkEntryOpen, setIsAddWorkEntryOpen] = useState(false);
  const [isAddCalendarPostOpen, setIsAddCalendarPostOpen] = useState(false);
  const [isAddExtraWorkOpen, setIsAddExtraWorkOpen] = useState(false);
  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false);
  const [isNewCycleOpen, setIsNewCycleOpen] = useState(false);
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [isSharePortalOpen, setIsSharePortalOpen] = useState(false);

  // Forms State for Sub-modals
  // 1. Deliverable Form
  const [delCategory, setDelCategory] = useState<'Video' | 'Design' | 'Social Media' | 'Custom'>('Video');
  const [delService, setDelService] = useState('Outdoor Shoot');
  const [delCustomService, setDelCustomService] = useState('');
  const [delPlanned, setDelPlanned] = useState<number | string>(5);

  // 2. Work Entry Form
  const [workDate, setWorkDate] = useState(new Date().toISOString().split('T')[0]);
  const [workServiceType, setWorkServiceType] = useState('Video Editing');
  const [workName, setWorkName] = useState('');
  const [workQty, setWorkQty] = useState<number | string>(1);
  const [workRate, setWorkRate] = useState<number | string>('');
  const [workAmount, setWorkAmount] = useState<number | string>(0);
  const [workAssignedEditor, setWorkAssignedEditor] = useState('');
  const [workStatus, setWorkStatus] = useState<MonthlyWorkEntry['status']>('Completed');
  const [workDriveLink, setWorkDriveLink] = useState('');
  const [workPostUrl, setWorkPostUrl] = useState('');
  const [workNotes, setWorkNotes] = useState('');

  // 3. Calendar Post Form
  const [calDate, setCalDate] = useState(new Date().toISOString().split('T')[0]);
  const [calPlannedContent, setCalPlannedContent] = useState('');
  const [calContentType, setCalContentType] = useState('Reel');
  const [calPlatform, setCalPlatform] = useState('Instagram');
  const [calStatus, setCalStatus] = useState<ContentCalendarEntry['status']>('Planned');
  const [calDriveLink, setCalDriveLink] = useState('');
  const [calPostUrl, setCalPostUrl] = useState('');
  const [calNotes, setCalNotes] = useState('');

  // 4. Extra Work Form
  const [extraDate, setExtraDate] = useState(new Date().toISOString().split('T')[0]);
  const [extraWorkName, setExtraWorkName] = useState('');
  const [extraServiceType, setExtraServiceType] = useState('Outdoor Shoot');
  const [extraQty, setExtraQty] = useState<number | string>(1);
  const [extraRate, setExtraRate] = useState<number | string>(1000);
  const [extraAmount, setExtraAmount] = useState<number | string>(1000);
  const [extraDriveLink, setExtraDriveLink] = useState('');
  const [extraNotes, setExtraNotes] = useState('');

  // 5. Payment Form
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [payAmount, setPayAmount] = useState<number | string>('');
  const [payMode, setPayMode] = useState<SmmPaymentItem['paymentMode']>('UPI');
  const [payReference, setPayReference] = useState('');
  const [payNotes, setPayNotes] = useState('');

  // 6. New Cycle Form
  const [newCycleMonth, setNewCycleMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [newCyclePrice, setNewCyclePrice] = useState<number | string>(8000);
  const [copyPreviousDeliverables, setCopyPreviousDeliverables] = useState(true);

  // 7. Account Form
  const [newAccountPlatform, setNewAccountPlatform] = useState<SocialMediaPlatform>('Instagram');
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountUrl, setNewAccountUrl] = useState('');

  // Editable Guidelines
  const [guidelines, setGuidelines] = useState({
    brandGuidelines: '',
    preferredContentStyle: '',
    preferredLanguage: '',
    postingPreferences: '',
    revisionRules: '',
    importantDates: '',
    festivalRequirements: '',
    specialInstructions: '',
  });
  const [guidelinesSavedToast, setGuidelinesSavedToast] = useState(false);

  // Initialize selected cycle
  const cycles = useMemo(() => client?.cycles || [], [client]);

  const activeCycle = useMemo(() => {
    if (!client || cycles.length === 0) return null;
    if (selectedCycleId) {
      const found = cycles.find((c) => c.id === selectedCycleId);
      if (found) return found;
    }
    return cycles[0];
  }, [client, cycles, selectedCycleId]);

  // Sync guidelines
  React.useEffect(() => {
    if (client) {
      setGuidelines({
        brandGuidelines: client.notes?.brandGuidelines || '',
        preferredContentStyle: client.notes?.preferredContentStyle || '',
        preferredLanguage: client.notes?.preferredLanguage || '',
        postingPreferences: client.notes?.postingPreferences || '',
        revisionRules: client.notes?.revisionRules || '',
        importantDates: client.notes?.importantDates || '',
        festivalRequirements: client.notes?.festivalRequirements || '',
        specialInstructions: client.notes?.specialInstructions || '',
      });
      if (cycles.length > 0 && !selectedCycleId) {
        setSelectedCycleId(cycles[0].id);
      }
    }
  }, [client]);

  if (!isOpen || !client) return null;

  // Renewal Alert calculations
  const renewalStatus = (() => {
    if (!client.packageRenewalDate) return { isDue: false, isExpired: false, daysLeft: 999 };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const renewal = new Date(client.packageRenewalDate);
    renewal.setHours(0, 0, 0, 0);
    const diffTime = renewal.getTime() - today.getTime();
    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return {
      isExpired: daysLeft < 0,
      isDue: daysLeft >= 0 && daysLeft <= 7,
      daysLeft,
    };
  })();

  // Financial calculations for active cycle
  const cycleMetrics = (() => {
    if (!activeCycle) {
      return {
        packagePrice: client.monthlyPackagePrice || 0,
        extraWorkTotal: 0,
        totalBilling: client.monthlyPackagePrice || 0,
        totalReceived: 0,
        remainingBalance: client.monthlyPackagePrice || 0,
        paymentStatus: 'Pending' as const,
        deliverablesTotalPlanned: 0,
        deliverablesCompleted: 0,
        deliverablesRemaining: 0,
      };
    }
    const packagePrice = Number(activeCycle.packagePrice) || Number(client.monthlyPackagePrice) || 0;
    const extraWorkTotal = (activeCycle.extraWork || []).reduce(
      (sum, item) => sum + (Number(item.amount) || 0),
      0
    );
    const totalBilling = packagePrice + extraWorkTotal;
    const totalReceived = (activeCycle.payments || []).reduce(
      (sum, p) => sum + (Number(p.amount) || 0),
      0
    );
    const remainingBalance = Math.max(0, totalBilling - totalReceived);

    let paymentStatus: 'Paid' | 'Partially Paid' | 'Pending' = 'Pending';
    if (totalReceived >= totalBilling && totalBilling > 0) {
      paymentStatus = 'Paid';
    } else if (totalReceived > 0) {
      paymentStatus = 'Partially Paid';
    }

    const deliverables = activeCycle.deliverables || [];
    const deliverablesTotalPlanned = deliverables.reduce((s, d) => s + (Number(d.planned) || 0), 0);
    const deliverablesCompleted = deliverables.reduce((s, d) => s + (Number(d.completed) || 0), 0);
    const deliverablesRemaining = Math.max(0, deliverablesTotalPlanned - deliverablesCompleted);

    return {
      packagePrice,
      extraWorkTotal,
      totalBilling,
      totalReceived,
      remainingBalance,
      paymentStatus,
      deliverablesTotalPlanned,
      deliverablesCompleted,
      deliverablesRemaining,
    };
  })();

  // Mutation Helper for Active Cycle
  const updateActiveCycle = async (updatedCycle: SmmMonthlyCycle) => {
    const updatedCycles = client.cycles.map((c) =>
      c.id === updatedCycle.id ? updatedCycle : c
    );
    await updateSocialMediaClient(client.id, { cycles: updatedCycles });
  };

  // 1. ADD DELIVERABLE
  const handleSaveDeliverable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCycle) return;
    const serviceName =
      delCategory === 'Custom'
        ? delCustomService.trim()
        : delService;
    if (!serviceName) return;

    const plannedNum = Number(delPlanned) || 1;
    const newDel: MonthlyDeliverablePlan = {
      id: `del_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      service: serviceName,
      category: delCategory,
      planned: plannedNum,
      completed: 0,
    };

    const updatedCycle: SmmMonthlyCycle = {
      ...activeCycle,
      deliverables: [...(activeCycle.deliverables || []), newDel],
    };
    await updateActiveCycle(updatedCycle);
    setIsAddDeliverableOpen(false);
    setDelCustomService('');
    setDelPlanned(5);
  };

  const handleUpdateDeliverableCompleted = async (delId: string, newCompleted: number) => {
    if (!activeCycle) return;
    const updatedDeliverables = (activeCycle.deliverables || []).map((d) =>
      d.id === delId ? { ...d, completed: Math.max(0, newCompleted) } : d
    );
    await updateActiveCycle({ ...activeCycle, deliverables: updatedDeliverables });
  };

  const handleDeleteDeliverable = async (delId: string) => {
    if (!activeCycle) return;
    const updatedDeliverables = (activeCycle.deliverables || []).filter((d) => d.id !== delId);
    await updateActiveCycle({ ...activeCycle, deliverables: updatedDeliverables });
  };

  // 2. ADD WORK ENTRY
  const handleSaveWorkEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCycle || !workName.trim()) return;

    const newWork: MonthlyWorkEntry = {
      id: `wentry_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      date: workDate,
      serviceType: workServiceType,
      name: workName.trim(),
      quantity: Number(workQty) || 1,
      rate: Number(workRate) || undefined,
      amount: Number(workAmount) || 0,
      assignedEditorId: workAssignedEditor || undefined,
      assignedEditorName: editors.find((ed) => ed.id === workAssignedEditor)?.name,
      status: workStatus,
      fileLink: workDriveLink.trim() || undefined,
      socialPostUrl: workPostUrl.trim() || undefined,
      notes: workNotes.trim() || undefined,
    };

    // If work status is completed, automatically increment matching deliverable completed count if available
    let updatedDeliverables = activeCycle.deliverables || [];
    if (workStatus === 'Completed') {
      const matchIndex = updatedDeliverables.findIndex(
        (d) => d.service.toLowerCase() === workServiceType.toLowerCase()
      );
      if (matchIndex !== -1) {
        updatedDeliverables = [...updatedDeliverables];
        updatedDeliverables[matchIndex] = {
          ...updatedDeliverables[matchIndex],
          completed: updatedDeliverables[matchIndex].completed + (Number(workQty) || 1),
        };
      }
    }

    const updatedCycle: SmmMonthlyCycle = {
      ...activeCycle,
      workEntries: [newWork, ...(activeCycle.workEntries || [])],
      deliverables: updatedDeliverables,
    };
    await updateActiveCycle(updatedCycle);
    setIsAddWorkEntryOpen(false);
    setWorkName('');
    setWorkNotes('');
    setWorkDriveLink('');
    setWorkPostUrl('');
  };

  const handleDeleteWorkEntry = async (entryId: string) => {
    if (!activeCycle) return;
    const updatedEntries = (activeCycle.workEntries || []).filter((w) => w.id !== entryId);
    await updateActiveCycle({ ...activeCycle, workEntries: updatedEntries });
  };

  // 3. CONTENT CALENDAR POST
  const handleSaveCalendarPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCycle || !calPlannedContent.trim()) return;

    const newPost: ContentCalendarEntry = {
      id: `cal_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      date: calDate,
      plannedContent: calPlannedContent.trim(),
      contentType: calContentType,
      platform: calPlatform,
      status: calStatus,
      notes: calNotes.trim() || undefined,
      driveLink: calDriveLink.trim() || undefined,
      postUrl: calPostUrl.trim() || undefined,
    };

    const updatedCycle: SmmMonthlyCycle = {
      ...activeCycle,
      contentCalendar: [...(activeCycle.contentCalendar || []), newPost],
    };
    await updateActiveCycle(updatedCycle);
    setIsAddCalendarPostOpen(false);
    setCalPlannedContent('');
    setCalNotes('');
    setCalDriveLink('');
    setCalPostUrl('');
  };

  const handleToggleCalendarPostStatus = async (postId: string) => {
    if (!activeCycle) return;
    const updatedPosts = (activeCycle.contentCalendar || []).map((p) => {
      if (p.id === postId) {
        const next: ContentCalendarEntry['status'] =
          p.status === 'Completed' ? 'Planned' : 'Completed';
        return { ...p, status: next };
      }
      return p;
    });
    await updateActiveCycle({ ...activeCycle, contentCalendar: updatedPosts });
  };

  const handleDeleteCalendarPost = async (postId: string) => {
    if (!activeCycle) return;
    const updatedPosts = (activeCycle.contentCalendar || []).filter((p) => p.id !== postId);
    await updateActiveCycle({ ...activeCycle, contentCalendar: updatedPosts });
  };

  // 4. EXTRA WORK (OUTSIDE PACKAGE)
  const handleSaveExtraWork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCycle || !extraWorkName.trim()) return;

    const amt = Number(extraAmount) || (Number(extraQty) || 1) * (Number(extraRate) || 0);

    const newExtra: ExtraWorkItem = {
      id: `extra_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      date: extraDate,
      workName: extraWorkName.trim(),
      serviceType: extraServiceType,
      quantity: Number(extraQty) || 1,
      rate: Number(extraRate) || 0,
      amount: amt,
      fileLink: extraDriveLink.trim() || undefined,
      notes: extraNotes.trim() || undefined,
    };

    const updatedCycle: SmmMonthlyCycle = {
      ...activeCycle,
      extraWork: [newExtra, ...(activeCycle.extraWork || [])],
    };
    await updateActiveCycle(updatedCycle);
    setIsAddExtraWorkOpen(false);
    setExtraWorkName('');
    setExtraNotes('');
    setExtraDriveLink('');
  };

  const handleDeleteExtraWork = async (extraId: string) => {
    if (!activeCycle) return;
    const updatedExtra = (activeCycle.extraWork || []).filter((e) => e.id !== extraId);
    await updateActiveCycle({ ...activeCycle, extraWork: updatedExtra });
  };

  // 5. PAYMENTS
  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCycle) return;
    const amt = Number(payAmount);
    if (isNaN(amt) || amt <= 0) return;

    const newPayment: SmmPaymentItem = {
      id: `smmpay_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      date: payDate,
      amount: amt,
      paymentMode: payMode,
      referenceNumber: payReference.trim() || undefined,
      notes: payNotes.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    const updatedCycle: SmmMonthlyCycle = {
      ...activeCycle,
      payments: [newPayment, ...(activeCycle.payments || [])],
    };
    await updateActiveCycle(updatedCycle);
    setIsAddPaymentOpen(false);
    setPayAmount('');
    setPayReference('');
    setPayNotes('');
  };

  const handleDeletePayment = async (payId: string) => {
    if (!activeCycle) return;
    const updatedPayments = (activeCycle.payments || []).filter((p) => p.id !== payId);
    await updateActiveCycle({ ...activeCycle, payments: updatedPayments });
  };

  // 6. CREATE NEW MONTH CYCLE
  const handleCreateNewCycle = async (e: React.FormEvent) => {
    e.preventDefault();
    const parts = newCycleMonth.split('-');
    const year = parts[0];
    const month = parseInt(parts[1], 10);
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const cycleLabel = `${monthNames[month - 1]} ${year}`;

    // Check if cycle already exists
    if (client.cycles.some((c) => c.yearMonth === newCycleMonth)) {
      alert(`A monthly cycle for ${cycleLabel} already exists!`);
      return;
    }

    let initialDeliverables: MonthlyDeliverablePlan[] = [];
    if (copyPreviousDeliverables && activeCycle) {
      initialDeliverables = (activeCycle.deliverables || []).map((d) => ({
        ...d,
        id: `del_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        completed: 0,
      }));
    } else {
      initialDeliverables = [
        { id: `del_${Date.now()}_1`, service: 'Outdoor Shoot', category: 'Video', planned: 2, completed: 0 },
        { id: `del_${Date.now()}_2`, service: 'Video Editing', category: 'Video', planned: 15, completed: 0 },
        { id: `del_${Date.now()}_3`, service: 'AI Video', category: 'Video', planned: 5, completed: 0 },
        { id: `del_${Date.now()}_4`, service: 'Festival Post', category: 'Design', planned: 4, completed: 0 },
        { id: `del_${Date.now()}_5`, service: 'Static Post', category: 'Design', planned: 5, completed: 0 },
      ];
    }

    const newCycle: SmmMonthlyCycle = {
      id: `cycle_${newCycleMonth}`,
      yearMonth: newCycleMonth,
      cycleLabel,
      packagePrice: Number(newCyclePrice) || Number(client.monthlyPackagePrice) || 8000,
      deliverables: initialDeliverables,
      workEntries: [],
      contentCalendar: [],
      extraWork: [],
      payments: [],
    };

    const updatedCycles = [newCycle, ...client.cycles];
    await updateSocialMediaClient(client.id, { cycles: updatedCycles });
    setSelectedCycleId(newCycle.id);
    setIsNewCycleOpen(false);
  };

  // 7. ADD SOCIAL ACCOUNT
  const handleSaveSocialAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccountName.trim() && !newAccountUrl.trim()) return;

    const newAcc: SocialAccountItem = {
      id: `acc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      platform: newAccountPlatform,
      profileName: newAccountName.trim(),
      profileUrl: newAccountUrl.trim(),
      accountStatus: 'Active',
    };

    const updatedAccounts = [...(client.accounts || []), newAcc];
    await updateSocialMediaClient(client.id, { accounts: updatedAccounts });
    setIsAddAccountOpen(false);
    setNewAccountName('');
    setNewAccountUrl('');
  };

  const handleDeleteSocialAccount = async (accId: string) => {
    const updatedAccounts = (client.accounts || []).filter((a) => a.id !== accId);
    await updateSocialMediaClient(client.id, { accounts: updatedAccounts });
  };

  // 8. SAVE GUIDELINES
  const handleSaveGuidelines = async () => {
    await updateSocialMediaClient(client.id, {
      notes: guidelines,
    });
    setGuidelinesSavedToast(true);
    setTimeout(() => setGuidelinesSavedToast(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-5xl w-full h-[95vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Top Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
              {client.name.substring(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-white truncate">{client.name}</h2>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                  {client.businessCategory || 'Social Media Client'}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    client.clientStatus === 'Active'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                  }`}
                >
                  {client.clientStatus}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 flex items-center gap-3 flex-wrap">
                <span>{client.packageName} (₹{(client.monthlyPackagePrice || 0).toLocaleString('en-IN')}/mo)</span>
                {client.packageRenewalDate && (
                  <span>Renewal Date: <strong>{client.packageRenewalDate}</strong></span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsSharePortalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-400/30 text-xs font-semibold rounded-lg shadow-xs transition cursor-pointer"
              title="Share Live Client Portal Link"
            >
              <Share2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Client Portal</span>
            </button>

            {activeCycle && (
              <button
                type="button"
                onClick={() =>
                  generateSmmMonthlyReportPdf({
                    client,
                    cycle: activeCycle,
                    settings,
                  })
                }
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-xs transition cursor-pointer"
                title="Download Monthly Report PDF"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>Download Monthly Report</span>
              </button>
            )}

            {onEditClient && (
              <button
                type="button"
                onClick={() => onEditClient(client)}
                className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer"
                title="Edit Client"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Renewal Alert Notification Banner */}
        {renewalStatus.isExpired ? (
          <div className="bg-rose-50 border-b border-rose-200 px-6 py-2 flex items-center justify-between text-xs text-rose-800 font-semibold animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Package Expired! Renewal was due on {client.packageRenewalDate}.</span>
            </div>
            <span className="text-[11px] bg-rose-200/70 text-rose-900 px-2 py-0.5 rounded font-bold">
              Package Expired
            </span>
          </div>
        ) : renewalStatus.isDue ? (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-2 flex items-center justify-between text-xs text-amber-800 font-semibold animate-in fade-in">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Renewal Due Soon! Package renews on {client.packageRenewalDate} ({renewalStatus.daysLeft} days remaining).</span>
            </div>
            <span className="text-[11px] bg-amber-200/70 text-amber-900 px-2 py-0.5 rounded font-bold">
              Renewal Due Soon
            </span>
          </div>
        ) : null}

        {/* Month Cycle Selector Bar */}
        <div className="px-6 py-2.5 bg-slate-100 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2">
            <CalendarIcon className="w-4 h-4 text-indigo-600" />
            <span className="font-bold text-slate-700">Monthly Cycle:</span>
            <select
              value={selectedCycleId}
              onChange={(e) => setSelectedCycleId(e.target.value)}
              className="px-3 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 shadow-2xs"
            >
              {cycles.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.cycleLabel} (₹{c.packagePrice.toLocaleString('en-IN')})
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => setIsNewCycleOpen(true)}
            className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-bold hover:underline cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Start New Monthly Cycle
          </button>
        </div>

        {/* KPI Summary Cards for Selected Month */}
        <div className="px-6 py-3.5 bg-slate-50 border-b border-slate-200 grid grid-cols-2 sm:grid-cols-6 gap-2 text-center text-xs">
          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Package Price</span>
            <span className="font-bold text-slate-900 text-sm">
              ₹{cycleMetrics.packagePrice.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Extra Work</span>
            <span className="font-bold text-purple-700 text-sm">
              ₹{cycleMetrics.extraWorkTotal.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-indigo-200 shadow-2xs bg-indigo-50/20">
            <span className="text-[10px] uppercase font-bold text-indigo-600 block">Total Billing</span>
            <span className="font-bold text-indigo-900 text-sm">
              ₹{cycleMetrics.totalBilling.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-emerald-200 shadow-2xs bg-emerald-50/20">
            <span className="text-[10px] uppercase font-bold text-emerald-600 block">Received</span>
            <span className="font-bold text-emerald-700 text-sm">
              ₹{cycleMetrics.totalReceived.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-amber-200 shadow-2xs">
            <span className="text-[10px] uppercase font-bold text-amber-600 block">Remaining</span>
            <span
              className={`font-bold text-sm ${
                cycleMetrics.remainingBalance > 0 ? 'text-rose-600' : 'text-emerald-600'
              }`}
            >
              ₹{cycleMetrics.remainingBalance.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Deliverables</span>
            <span className="font-bold text-slate-900 text-sm">
              {cycleMetrics.deliverablesCompleted} / {cycleMetrics.deliverablesTotalPlanned}
            </span>
            <span className="text-[10px] text-slate-500 block">
              {cycleMetrics.deliverablesRemaining} pending
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 border-b border-slate-200 flex items-center space-x-6 text-xs font-bold text-slate-500 bg-white overflow-x-auto">
          <button
            onClick={() => setActiveTab('deliverables')}
            className={`py-3 border-b-2 transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'deliverables'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent hover:text-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Monthly Deliverables ({activeCycle?.deliverables?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('calendar')}
            className={`py-3 border-b-2 transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'calendar'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent hover:text-slate-800'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Content Calendar ({activeCycle?.contentCalendar?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('extrawork')}
            className={`py-3 border-b-2 transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'extrawork'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent hover:text-slate-800'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Extra Work (₹{cycleMetrics.extraWorkTotal.toLocaleString('en-IN')})</span>
          </button>

          <button
            onClick={() => setActiveTab('payments')}
            className={`py-3 border-b-2 transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'payments'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent hover:text-slate-800'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Payments &amp; Ledger ({activeCycle?.payments?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('accounts')}
            className={`py-3 border-b-2 transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'accounts'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent hover:text-slate-800'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Accounts ({client.accounts?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('guidelines')}
            className={`py-3 border-b-2 transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'guidelines'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent hover:text-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Brand Guidelines &amp; Notes</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* TAB 1: DELIVERABLES & WORK TRACKING */}
          {activeTab === 'deliverables' && (
            <div className="space-y-6">
              {/* Deliverables Plan Table */}
              <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-indigo-600" />
                      Monthly Package Deliverables Plan
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Remaining count is automatically calculated as: Planned - Completed
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAddDeliverableOpen(true)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Planned Deliverable
                  </button>
                </div>

                {(!activeCycle?.deliverables || activeCycle.deliverables.length === 0) ? (
                  <p className="text-xs text-slate-400 italic py-4 text-center">
                    No deliverables defined yet for this month. Click &quot;Add Planned Deliverable&quot; above.
                  </p>
                ) : (
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="px-3 py-2.5">Service Type</th>
                          <th className="px-3 py-2.5 text-center">Planned</th>
                          <th className="px-3 py-2.5 text-center">Completed</th>
                          <th className="px-3 py-2.5 text-center">Remaining</th>
                          <th className="px-3 py-2.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {activeCycle.deliverables.map((del) => {
                          const remaining = Math.max(0, del.planned - del.completed);
                          return (
                            <tr key={del.id} className="hover:bg-slate-50/70">
                              <td className="px-3 py-2.5 font-bold text-slate-900">
                                {del.service}
                              </td>
                              <td className="px-3 py-2.5 text-center font-bold text-slate-800">
                                {del.planned}
                              </td>
                              <td className="px-3 py-2.5 text-center">
                                <div className="inline-flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateDeliverableCompleted(del.id, del.completed - 1)}
                                    disabled={del.completed <= 0}
                                    className="w-5 h-5 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded text-slate-600 font-bold disabled:opacity-30 cursor-pointer"
                                  >
                                    -
                                  </button>
                                  <span className="font-bold text-emerald-700 min-w-[20px] text-center">
                                    {del.completed}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateDeliverableCompleted(del.id, del.completed + 1)}
                                    className="w-5 h-5 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded text-slate-600 font-bold cursor-pointer"
                                  >
                                    +
                                  </button>
                                </div>
                              </td>
                              <td className="px-3 py-2.5 text-center">
                                {remaining === 0 ? (
                                  <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                    Fully Delivered
                                  </span>
                                ) : (
                                  <span className="bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                    {remaining} Remaining
                                  </span>
                                )}
                              </td>
                              <td className="px-3 py-2.5 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteDeliverable(del.id)}
                                  className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-slate-100 transition cursor-pointer"
                                  title="Delete Deliverable"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Individual Monthly Work Log */}
              <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Individual Work Entries Delivered This Month
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Logs every specific video, post, or shoot produced during {activeCycle?.cycleLabel}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAddWorkEntryOpen(true)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Record Work Done
                  </button>
                </div>

                {(!activeCycle?.workEntries || activeCycle.workEntries.length === 0) ? (
                  <p className="text-xs text-slate-400 italic py-4 text-center">
                    No individual work logs recorded yet for this month.
                  </p>
                ) : (
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="px-3 py-2.5">Date</th>
                          <th className="px-3 py-2.5">Work / Description</th>
                          <th className="px-3 py-2.5">Service Type</th>
                          <th className="px-3 py-2.5">Assigned To</th>
                          <th className="px-3 py-2.5 text-center">Status</th>
                          <th className="px-3 py-2.5 text-center">Links</th>
                          <th className="px-3 py-2.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {activeCycle.workEntries.map((w) => (
                          <tr key={w.id} className="hover:bg-slate-50/70">
                            <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">
                              {w.date}
                            </td>
                            <td className="px-3 py-2.5">
                              <span className="font-bold text-slate-900 block">{w.name}</span>
                              {w.notes && (
                                <span className="text-[10px] text-slate-400 block">{w.notes}</span>
                              )}
                            </td>
                            <td className="px-3 py-2.5">
                              <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[10px] font-semibold border border-indigo-200">
                                {w.serviceType}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 text-slate-700 font-medium">
                              {w.assignedEditorName || 'Self / In-house'}
                            </td>
                            <td className="px-3 py-2.5 text-center">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  w.status === 'Completed'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : w.status === 'In Progress'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {w.status}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 text-center whitespace-nowrap">
                              <div className="flex items-center justify-center gap-1.5">
                                {w.fileLink && (
                                  <a
                                    href={w.fileLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded text-[10px] font-semibold inline-flex items-center gap-0.5"
                                    title="Open Drive / Files"
                                  >
                                    <Link2 className="w-3 h-3" />
                                    Drive
                                  </a>
                                )}
                                {w.socialPostUrl && (
                                  <a
                                    href={w.socialPostUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1 bg-purple-50 text-purple-600 hover:bg-purple-100 rounded text-[10px] font-semibold inline-flex items-center gap-0.5"
                                    title="Open Live Post"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                    Post
                                  </a>
                                )}
                              </div>
                            </td>
                            <td className="px-3 py-2.5 text-right">
                              <button
                                type="button"
                                onClick={() => handleDeleteWorkEntry(w.id)}
                                className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-slate-100 transition cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: CONTENT CALENDAR */}
          {activeTab === 'calendar' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="bg-slate-100 p-0.5 rounded-lg border border-slate-200 flex">
                    <button
                      type="button"
                      onClick={() => setCalendarViewMode('calendar')}
                      className={`px-3 py-1 rounded-md text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                        calendarViewMode === 'calendar'
                          ? 'bg-white text-indigo-700 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <CalendarDays className="w-3.5 h-3.5" />
                      Calendar Grid
                    </button>
                    <button
                      type="button"
                      onClick={() => setCalendarViewMode('list')}
                      className={`px-3 py-1 rounded-md text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                        calendarViewMode === 'list'
                          ? 'bg-white text-indigo-700 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <List className="w-3.5 h-3.5" />
                      List Agenda
                    </button>
                  </div>
                  <span className="text-xs text-slate-500">
                    Content schedule for {activeCycle?.cycleLabel}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAddCalendarPostOpen(true)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Schedule Content
                </button>
              </div>

              {calendarViewMode === 'list' ? (
                // LIST VIEW
                <div className="border border-slate-200 rounded-xl bg-white overflow-hidden shadow-2xs">
                  {(!activeCycle?.contentCalendar || activeCycle.contentCalendar.length === 0) ? (
                    <p className="text-xs text-slate-400 italic py-6 text-center">
                      No content scheduled for this month yet.
                    </p>
                  ) : (
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="px-3 py-2.5">Date</th>
                          <th className="px-3 py-2.5">Planned Content</th>
                          <th className="px-3 py-2.5">Type</th>
                          <th className="px-3 py-2.5">Platform</th>
                          <th className="px-3 py-2.5 text-center">Status</th>
                          <th className="px-3 py-2.5 text-center">Links</th>
                          <th className="px-3 py-2.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {activeCycle.contentCalendar
                          .sort((a, b) => a.date.localeCompare(b.date))
                          .map((post) => (
                            <tr key={post.id} className="hover:bg-slate-50/70">
                              <td className="px-3 py-2.5 font-bold text-slate-800 whitespace-nowrap">
                                {post.date}
                              </td>
                              <td className="px-3 py-2.5">
                                <span className="font-semibold text-slate-900 block">
                                  {post.plannedContent}
                                </span>
                                {post.notes && (
                                  <span className="text-[10px] text-slate-400 block">{post.notes}</span>
                                )}
                              </td>
                              <td className="px-3 py-2.5">
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                                  {post.contentType}
                                </span>
                              </td>
                              <td className="px-3 py-2.5">
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                                  {post.platform}
                                </span>
                              </td>
                              <td className="px-3 py-2.5 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleToggleCalendarPostStatus(post.id)}
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition ${
                                    post.status === 'Completed'
                                      ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                      : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                                  }`}
                                  title="Click to toggle status"
                                >
                                  {post.status}
                                </button>
                              </td>
                              <td className="px-3 py-2.5 text-center whitespace-nowrap">
                                <div className="flex items-center justify-center gap-1">
                                  {post.driveLink && (
                                    <a
                                      href={post.driveLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="p-1 bg-indigo-50 text-indigo-600 rounded text-[10px] font-semibold"
                                      title="Open Assets"
                                    >
                                      Assets
                                    </a>
                                  )}
                                  {post.postUrl && (
                                    <a
                                      href={post.postUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="p-1 bg-purple-50 text-purple-600 rounded text-[10px] font-semibold"
                                      title="Open Post"
                                    >
                                      Post
                                    </a>
                                  )}
                                </div>
                              </td>
                              <td className="px-3 py-2.5 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCalendarPost(post.id)}
                                  className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-slate-100 transition cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  )}
                </div>
              ) : (
                // CALENDAR GRID VIEW
                <div className="border border-slate-200 rounded-xl bg-white p-4 shadow-2xs space-y-3">
                  <div className="grid grid-cols-7 gap-1 text-center font-bold text-slate-500 text-[11px] pb-2 border-b border-slate-200">
                    <div>Sun</div>
                    <div>Mon</div>
                    <div>Tue</div>
                    <div>Wed</div>
                    <div>Thu</div>
                    <div>Fri</div>
                    <div>Sat</div>
                  </div>

                  <div className="grid grid-cols-7 gap-1.5">
                    {(() => {
                      if (!activeCycle) return null;
                      const [year, month] = activeCycle.yearMonth.split('-').map(Number);
                      const daysInMonth = new Date(year, month, 0).getDate();
                      const firstDayIndex = new Date(year, month - 1, 1).getDay();

                      const cells = [];
                      // Empty leading cells
                      for (let i = 0; i < firstDayIndex; i++) {
                        cells.push(
                          <div
                            key={`empty-${i}`}
                            className="h-24 bg-slate-50/50 rounded-lg border border-dashed border-slate-100"
                          />
                        );
                      }

                      // Days of month
                      for (let day = 1; day <= daysInMonth; day++) {
                        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        const dayPosts = (activeCycle.contentCalendar || []).filter(
                          (p) => p.date === dateStr
                        );

                        cells.push(
                          <div
                            key={`day-${day}`}
                            className={`h-24 p-1.5 rounded-lg border flex flex-col justify-between transition overflow-hidden ${
                              dayPosts.length > 0
                                ? 'bg-indigo-50/40 border-indigo-200'
                                : 'bg-white border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-700 text-[11px]">{day}</span>
                              {dayPosts.length > 0 && (
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                              )}
                            </div>

                            <div className="space-y-1 overflow-y-auto max-h-16 pr-0.5">
                              {dayPosts.map((p) => (
                                <div
                                  key={p.id}
                                  onClick={() => handleToggleCalendarPostStatus(p.id)}
                                  className={`p-1 rounded text-[9px] font-semibold truncate cursor-pointer transition ${
                                    p.status === 'Completed'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-purple-100 text-purple-800'
                                  }`}
                                  title={`${p.platform}: ${p.plannedContent} (${p.status}) - Click to toggle status`}
                                >
                                  {p.platform.substring(0, 2)}: {p.plannedContent}
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      }

                      return cells;
                    })()}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: EXTRA WORK (OUTSIDE PACKAGE) */}
          {activeTab === 'extrawork' && (
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-purple-600" />
                    Extra Work (Outside Package)
                  </h3>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Work outside the monthly package is billed on top: Package (₹{cycleMetrics.packagePrice.toLocaleString('en-IN')}) + Extra Work (₹{cycleMetrics.extraWorkTotal.toLocaleString('en-IN')}) = Total Billing (₹{cycleMetrics.totalBilling.toLocaleString('en-IN')})
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddExtraWorkOpen(true)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Extra Work
                </button>
              </div>

              {(!activeCycle?.extraWork || activeCycle.extraWork.length === 0) ? (
                <div className="p-8 border border-dashed border-slate-200 rounded-xl bg-slate-50 text-center">
                  <p className="text-xs text-slate-400 italic">
                    No extra work recorded for this month. All deliverables are within the monthly package.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsAddExtraWorkOpen(true)}
                    className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-purple-600 hover:text-purple-700"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Record Extra Shoot / Extra Reel
                  </button>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl bg-white overflow-hidden shadow-2xs">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="px-3 py-2.5">Date</th>
                        <th className="px-3 py-2.5">Work / Description</th>
                        <th className="px-3 py-2.5">Service Type</th>
                        <th className="px-3 py-2.5 text-center">Qty</th>
                        <th className="px-3 py-2.5 text-right">Rate</th>
                        <th className="px-3 py-2.5 text-right">Amount</th>
                        <th className="px-3 py-2.5 text-center">Links</th>
                        <th className="px-3 py-2.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {activeCycle.extraWork.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/70">
                          <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">{item.date}</td>
                          <td className="px-3 py-2.5">
                            <span className="font-bold text-slate-900 block">{item.workName}</span>
                            {item.notes && <span className="text-[10px] text-slate-400 block">{item.notes}</span>}
                          </td>
                          <td className="px-3 py-2.5">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                              {item.serviceType}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-center font-bold text-slate-700">{item.quantity}</td>
                          <td className="px-3 py-2.5 text-right text-slate-600">₹{item.rate.toLocaleString('en-IN')}</td>
                          <td className="px-3 py-2.5 text-right font-bold text-purple-700">
                            ₹{item.amount.toLocaleString('en-IN')}
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            {item.fileLink ? (
                              <a
                                href={item.fileLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1 bg-indigo-50 text-indigo-600 rounded text-[10px] font-semibold"
                              >
                                Drive
                              </a>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            <button
                              type="button"
                              onClick={() => handleDeleteExtraWork(item.id)}
                              className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-slate-100 transition cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50 border-t border-slate-200 font-bold">
                      <tr>
                        <td colSpan={5} className="px-3 py-2.5 text-right text-slate-700">
                          Total Extra Work Billing:
                        </td>
                        <td className="px-3 py-2.5 text-right text-purple-700">
                          ₹{cycleMetrics.extraWorkTotal.toLocaleString('en-IN')}
                        </td>
                        <td colSpan={2} />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: PAYMENTS */}
          {activeTab === 'payments' && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    Monthly Financials &amp; Payments Ledger
                  </h3>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Total Billing: ₹{cycleMetrics.totalBilling.toLocaleString('en-IN')} • Received: ₹
                    {cycleMetrics.totalReceived.toLocaleString('en-IN')} • Remaining: ₹
                    {cycleMetrics.remainingBalance.toLocaleString('en-IN')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddPaymentOpen(true)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Payment
                </button>
              </div>

              {(!activeCycle?.payments || activeCycle.payments.length === 0) ? (
                <div className="p-8 border border-dashed border-slate-200 rounded-xl bg-slate-50 text-center">
                  <p className="text-xs text-slate-400 italic">No payments recorded for this monthly cycle yet.</p>
                  <button
                    type="button"
                    onClick={() => setIsAddPaymentOpen(true)}
                    className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Record First Payment
                  </button>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl bg-white overflow-hidden shadow-2xs">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="px-3 py-2.5">Date</th>
                        <th className="px-3 py-2.5">Payment Mode</th>
                        <th className="px-3 py-2.5">Reference ID</th>
                        <th className="px-3 py-2.5 text-right">Amount</th>
                        <th className="px-3 py-2.5">Notes</th>
                        <th className="px-3 py-2.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {activeCycle.payments.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/70">
                          <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">{p.date}</td>
                          <td className="px-3 py-2.5">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {p.paymentMode}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 font-mono text-[11px] font-bold text-indigo-600">
                            {p.referenceNumber || '-'}
                          </td>
                          <td className="px-3 py-2.5 text-right font-bold text-emerald-700">
                            ₹{(p.amount || 0).toLocaleString('en-IN')}
                          </td>
                          <td className="px-3 py-2.5 text-slate-500">{p.notes || '-'}</td>
                          <td className="px-3 py-2.5 text-right">
                            <button
                              type="button"
                              onClick={() => handleDeletePayment(p.id)}
                              className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-slate-100 transition cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50 border-t border-slate-200 font-bold">
                      <tr>
                        <td colSpan={3} className="px-3 py-2.5 text-right text-slate-700">
                          Total Payments Received:
                        </td>
                        <td className="px-3 py-2.5 text-right text-emerald-700">
                          ₹{cycleMetrics.totalReceived.toLocaleString('en-IN')}
                        </td>
                        <td colSpan={2} />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: ACCOUNTS */}
          {activeTab === 'accounts' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <Share2 className="w-4 h-4 text-indigo-600" />
                    Managed Social Media Accounts
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Click &quot;Open Profile&quot; to inspect any live client channel.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddAccountOpen(true)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Connect Account
                </button>
              </div>

              {(!client.accounts || client.accounts.length === 0) ? (
                <div className="p-8 border border-dashed border-slate-200 rounded-xl bg-slate-50 text-center">
                  <p className="text-xs text-slate-400 italic">No social media handles registered yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {client.accounts.map((acc) => (
                    <div
                      key={acc.id}
                      className="p-4 bg-white border border-slate-200 rounded-xl flex items-center justify-between shadow-2xs hover:border-indigo-300 transition"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm truncate">{acc.platform}</span>
                          <span
                            className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold ${
                              acc.accountStatus === 'Active'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {acc.accountStatus}
                          </span>
                        </div>
                        <span className="text-xs text-indigo-700 font-semibold block mt-0.5 truncate">
                          {acc.profileName || 'Main Handle'}
                        </span>
                        {acc.profileUrl && (
                          <span className="text-[10px] text-slate-400 truncate block mt-0.5">
                            {acc.profileUrl}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-1 shrink-0">
                        {acc.profileUrl && (
                          <a
                            href={acc.profileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold transition"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Open Profile
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteSocialAccount(acc.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 6: BRAND GUIDELINES & NOTES */}
          {activeTab === 'guidelines' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    Client Requirements &amp; Brand Guidelines
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Keep your team aligned on style, tone, revision limits, and dates.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSaveGuidelines}
                  className="flex items-center gap-1 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  Save Guidelines
                </button>
              </div>

              {guidelinesSavedToast && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Client guidelines saved successfully!</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Brand Guidelines</label>
                  <textarea
                    rows={3}
                    placeholder="Brand colors, official fonts, logo safety rules..."
                    value={guidelines.brandGuidelines}
                    onChange={(e) => setGuidelines({ ...guidelines, brandGuidelines: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs resize-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Preferred Content Style</label>
                  <textarea
                    rows={3}
                    placeholder="Talking head videos, trending audio, viral hooks, educational carousels..."
                    value={guidelines.preferredContentStyle}
                    onChange={(e) => setGuidelines({ ...guidelines, preferredContentStyle: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs resize-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Preferred Language / Tone</label>
                  <input
                    type="text"
                    placeholder="e.g. Professional English, Conversational Hindi"
                    value={guidelines.preferredLanguage}
                    onChange={(e) => setGuidelines({ ...guidelines, preferredLanguage: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Posting Schedule / Peak Times</label>
                  <input
                    type="text"
                    placeholder="e.g. Daily story, Reels at 7 PM IST"
                    value={guidelines.postingPreferences}
                    onChange={(e) => setGuidelines({ ...guidelines, postingPreferences: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Revision Rules</label>
                  <input
                    type="text"
                    placeholder="e.g. Max 2 revisions per reel before final approval"
                    value={guidelines.revisionRules}
                    onChange={(e) => setGuidelines({ ...guidelines, revisionRules: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Important Festival / Launch Dates</label>
                  <input
                    type="text"
                    placeholder="e.g. Diwali campaign Oct 28, Annual sale Nov 5"
                    value={guidelines.festivalRequirements}
                    onChange={(e) => setGuidelines({ ...guidelines, festivalRequirements: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Special Instructions &amp; Admin Notes</label>
                  <textarea
                    rows={2}
                    placeholder="Any specific instructions for editors or scriptwriters..."
                    value={guidelines.specialInstructions}
                    onChange={(e) => setGuidelines({ ...guidelines, specialInstructions: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs resize-none"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SUB-MODAL 1: Add Deliverable */}
        {isAddDeliverableOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-2xs">
            <div className="bg-white rounded-xl max-w-md w-full p-5 shadow-2xl border border-slate-200 text-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="font-bold text-slate-900 text-sm">Add Planned Deliverable</h4>
                <button onClick={() => setIsAddDeliverableOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveDeliverable} className="space-y-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Service Category</label>
                  <select
                    value={delCategory}
                    onChange={(e) => {
                      const cat = e.target.value as any;
                      setDelCategory(cat);
                      if (cat === 'Video') setDelService(PREDEFINED_SMM_SERVICES.VIDEO[0]);
                      else if (cat === 'Design') setDelService(PREDEFINED_SMM_SERVICES.DESIGN[0]);
                      else if (cat === 'Social Media') setDelService(PREDEFINED_SMM_SERVICES.SOCIAL_MEDIA[0]);
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="Video">Video Deliverable</option>
                    <option value="Design">Design &amp; Poster</option>
                    <option value="Social Media">Social Media Management &amp; Uploads</option>
                    <option value="Custom">Custom Service</option>
                  </select>
                </div>

                {delCategory !== 'Custom' ? (
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Select Service</label>
                    <select
                      value={delService}
                      onChange={(e) => setDelService(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    >
                      {delCategory === 'Video' &&
                        PREDEFINED_SMM_SERVICES.VIDEO.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      {delCategory === 'Design' &&
                        PREDEFINED_SMM_SERVICES.DESIGN.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      {delCategory === 'Social Media' &&
                        PREDEFINED_SMM_SERVICES.SOCIAL_MEDIA.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Custom Service Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Influencer Collaboration, Voiceover"
                      value={delCustomService}
                      onChange={(e) => setDelCustomService(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                )}

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Planned Quantity (Count) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={delPlanned}
                    onChange={(e) => setDelPlanned(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddDeliverableOpen(false)}
                    className="px-3 py-1.5 border border-slate-300 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold"
                  >
                    Add to Plan
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* SUB-MODAL 2: Record Work Done */}
        {isAddWorkEntryOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-2xs">
            <div className="bg-white rounded-xl max-w-lg w-full p-5 shadow-2xl border border-slate-200 text-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="font-bold text-slate-900 text-sm">Record Work Delivered</h4>
                <button onClick={() => setIsAddWorkEntryOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveWorkEntry} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Date Delivered *</label>
                    <input
                      type="date"
                      required
                      value={workDate}
                      onChange={(e) => setWorkDate(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Service Type *</label>
                    <select
                      value={workServiceType}
                      onChange={(e) => setWorkServiceType(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    >
                      {activeCycle?.deliverables && activeCycle.deliverables.length > 0
                        ? activeCycle.deliverables.map((d) => (
                            <option key={d.id} value={d.service}>
                              {d.service} (Planned: {d.planned})
                            </option>
                          ))
                        : PREDEFINED_SMM_SERVICES.VIDEO.map((v) => (
                            <option key={v} value={v}>
                              {v}
                            </option>
                          ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Work Description / Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sunday Brunch Promo Reel #3"
                    value={workName}
                    onChange={(e) => setWorkName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Assigned Editor / Person</label>
                    <select
                      value={workAssignedEditor}
                      onChange={(e) => setWorkAssignedEditor(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    >
                      <option value="">Self / In-house</option>
                      {editors.map((ed) => (
                        <option key={ed.id} value={ed.id}>
                          {ed.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Delivery Status</label>
                    <select
                      value={workStatus}
                      onChange={(e) => setWorkStatus(e.target.value as any)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    >
                      <option value="Completed">Completed</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Planned">Planned</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Drive / File Link</label>
                    <input
                      type="url"
                      placeholder="https://drive.google.com/..."
                      value={workDriveLink}
                      onChange={(e) => setWorkDriveLink(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Live Social Post URL</label>
                    <input
                      type="url"
                      placeholder="https://instagram.com/reel/..."
                      value={workPostUrl}
                      onChange={(e) => setWorkPostUrl(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddWorkEntryOpen(false)}
                    className="px-3 py-1.5 border border-slate-300 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold"
                  >
                    Save Work Record
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* SUB-MODAL 3: Schedule Calendar Post */}
        {isAddCalendarPostOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-2xs">
            <div className="bg-white rounded-xl max-w-md w-full p-5 shadow-2xl border border-slate-200 text-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="font-bold text-slate-900 text-sm">Schedule Content Post</h4>
                <button onClick={() => setIsAddCalendarPostOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveCalendarPost} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Scheduled Date *</label>
                    <input
                      type="date"
                      required
                      value={calDate}
                      onChange={(e) => setCalDate(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Target Platform</label>
                    <select
                      value={calPlatform}
                      onChange={(e) => setCalPlatform(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    >
                      <option value="Instagram">Instagram</option>
                      <option value="Facebook">Facebook</option>
                      <option value="YouTube">YouTube</option>
                      <option value="LinkedIn">LinkedIn</option>
                      <option value="Instagram + Facebook">Instagram + Facebook</option>
                      <option value="All Platforms">All Platforms</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Planned Content / Topic *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Festival Greeting Post or BTS Reel"
                    value={calPlannedContent}
                    onChange={(e) => setCalPlannedContent(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Content Type</label>
                    <select
                      value={calContentType}
                      onChange={(e) => setCalContentType(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    >
                      <option value="Reel">Reel / Short</option>
                      <option value="Static Post">Static Post</option>
                      <option value="Carousel">Carousel</option>
                      <option value="Story">Story</option>
                      <option value="Festival Greeting">Festival Greeting</option>
                      <option value="Promotional Video">Promotional Video</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Initial Status</label>
                    <select
                      value={calStatus}
                      onChange={(e) => setCalStatus(e.target.value as any)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    >
                      <option value="Planned">Planned</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddCalendarPostOpen(false)}
                    className="px-3 py-1.5 border border-slate-300 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold"
                  >
                    Schedule Post
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* SUB-MODAL 4: Add Extra Work */}
        {isAddExtraWorkOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-2xs">
            <div className="bg-white rounded-xl max-w-md w-full p-5 shadow-2xl border border-slate-200 text-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="font-bold text-slate-900 text-sm">Record Extra Work (Outside Package)</h4>
                <button onClick={() => setIsAddExtraWorkOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveExtraWork} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Date *</label>
                    <input
                      type="date"
                      required
                      value={extraDate}
                      onChange={(e) => setExtraDate(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Service Type</label>
                    <input
                      type="text"
                      placeholder="e.g. Extra Shoot"
                      value={extraServiceType}
                      onChange={(e) => setExtraServiceType(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Extra Work Title / Description *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Extra Outdoor Drone Shoot on Weekend"
                    value={extraWorkName}
                    onChange={(e) => setExtraWorkName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Qty</label>
                    <input
                      type="number"
                      min="1"
                      value={extraQty}
                      onChange={(e) => {
                        const q = e.target.value;
                        setExtraQty(q);
                        setExtraAmount((Number(q) || 1) * (Number(extraRate) || 0));
                      }}
                      className="w-full px-2 py-2 border border-slate-300 rounded-lg font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Rate (₹)</label>
                    <input
                      type="number"
                      value={extraRate}
                      onChange={(e) => {
                        const r = e.target.value;
                        setExtraRate(r);
                        setExtraAmount((Number(extraQty) || 1) * (Number(r) || 0));
                      }}
                      className="w-full px-2 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Total (₹) *</label>
                    <input
                      type="number"
                      required
                      value={extraAmount}
                      onChange={(e) => setExtraAmount(e.target.value)}
                      className="w-full px-2 py-2 border border-slate-300 rounded-lg font-bold text-purple-700"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddExtraWorkOpen(false)}
                    className="px-3 py-1.5 border border-slate-300 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold"
                  >
                    Add Extra Work
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* SUB-MODAL 5: Add Payment */}
        {isAddPaymentOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-2xs">
            <div className="bg-white rounded-xl max-w-md w-full p-5 shadow-2xl border border-slate-200 text-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="font-bold text-slate-900 text-sm">Add Client Payment</h4>
                <button onClick={() => setIsAddPaymentOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSavePayment} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Payment Date *</label>
                    <input
                      type="date"
                      required
                      value={payDate}
                      onChange={(e) => setPayDate(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Amount (₹) *</label>
                    <input
                      type="number"
                      min="1"
                      required
                      placeholder="e.g. 8000"
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold text-emerald-700 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Payment Mode</label>
                    <select
                      value={payMode}
                      onChange={(e) => setPayMode(e.target.value as any)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    >
                      <option value="UPI">UPI / GPay / PhonePe</option>
                      <option value="Bank Transfer">Bank Transfer (IMPS/NEFT)</option>
                      <option value="Cash">Cash</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Reference / UTR ID</label>
                    <input
                      type="text"
                      placeholder="e.g. UPI-123456"
                      value={payReference}
                      onChange={(e) => setPayReference(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Payment Notes</label>
                  <input
                    type="text"
                    placeholder="e.g. October advance payment"
                    value={payNotes}
                    onChange={(e) => setPayNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddPaymentOpen(false)}
                    className="px-3 py-1.5 border border-slate-300 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold"
                  >
                    Record Payment
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* SUB-MODAL 6: Create New Month Cycle */}
        {isNewCycleOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-2xs">
            <div className="bg-white rounded-xl max-w-md w-full p-5 shadow-2xl border border-slate-200 text-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="font-bold text-slate-900 text-sm">Start New Monthly Cycle</h4>
                <button onClick={() => setIsNewCycleOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateNewCycle} className="space-y-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Select Month (YYYY-MM) *</label>
                  <input
                    type="month"
                    required
                    value={newCycleMonth}
                    onChange={(e) => setNewCycleMonth(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Package Price for this Month (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newCyclePrice}
                    onChange={(e) => setNewCyclePrice(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="copyDeliverablesCheck"
                    checked={copyPreviousDeliverables}
                    onChange={(e) => setCopyPreviousDeliverables(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                  />
                  <label htmlFor="copyDeliverablesCheck" className="font-semibold text-slate-700 cursor-pointer">
                    Copy planned deliverables template from previous month
                  </label>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsNewCycleOpen(false)}
                    className="px-3 py-1.5 border border-slate-300 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold"
                  >
                    Initialize Month Cycle
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* SUB-MODAL 7: Add Social Account */}
        {isAddAccountOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-2xs">
            <div className="bg-white rounded-xl max-w-md w-full p-5 shadow-2xl border border-slate-200 text-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="font-bold text-slate-900 text-sm">Connect Social Account</h4>
                <button onClick={() => setIsAddAccountOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveSocialAccount} className="space-y-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Platform</label>
                  <select
                    value={newAccountPlatform}
                    onChange={(e) => setNewAccountPlatform(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="Instagram">Instagram</option>
                    <option value="Facebook">Facebook</option>
                    <option value="YouTube">YouTube</option>
                    <option value="LinkedIn">LinkedIn</option>
                    <option value="Google Business Profile">Google Business Profile</option>
                    <option value="Website">Website</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Profile Name / Handle *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. @royalcafe_official"
                    value={newAccountName}
                    onChange={(e) => setNewAccountName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Profile URL *</label>
                  <input
                    type="url"
                    required
                    placeholder="https://instagram.com/..."
                    value={newAccountUrl}
                    onChange={(e) => setNewAccountUrl(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddAccountOpen(false)}
                    className="px-3 py-1.5 border border-slate-300 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold"
                  >
                    Connect
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* SMM Client Share Portal Modal */}
        <SmmSharePortalModal
          isOpen={isSharePortalOpen}
          onClose={() => setIsSharePortalOpen(false)}
          client={client}
        />
      </div>
    </div>
  );
};
