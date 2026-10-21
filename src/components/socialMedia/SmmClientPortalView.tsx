import React, { useState, useEffect, useMemo } from 'react';
import {
  Share2,
  ExternalLink,
  CheckCircle2,
  Clock,
  Calendar,
  AlertCircle,
  ShieldCheck,
  Building,
  Phone,
  MessageCircle,
  CreditCard,
  Sparkles,
  Layers,
  ChevronDown,
  Instagram,
  Facebook,
  Youtube,
  Linkedin,
  Globe,
  FileText,
  Filter,
  Search,
  Check,
  TrendingUp,
  Receipt,
  LogOut,
  FolderOpen,
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import * as firestoreService from '../../services/firestoreService';
import {
  SocialMediaClient,
  SmmMonthlyCycle,
  MonthlyWorkEntry,
  SocialMediaPlatform,
} from '../../types/socialMedia';

interface SmmClientPortalViewProps {
  clientId?: string;
  portalToken?: string;
  onExit?: () => void;
  isSharedPortal?: boolean;
}

export const SmmClientPortalView: React.FC<SmmClientPortalViewProps> = ({
  clientId,
  portalToken,
  onExit,
  isSharedPortal = false,
}) => {
  const { socialMediaClients, settings, isLoading: isCrmLoading } = useCrm();

  const searchTarget = (portalToken || clientId || '').trim();

  const [directClient, setDirectClient] = useState<SocialMediaClient | null>(null);
  const [isDirectLoading, setIsDirectLoading] = useState(false);
  const [lookupAttempted, setLookupAttempted] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // 1. In-memory resolution (exact match and case-insensitive)
  const inMemoryClient = useMemo(() => {
    if (!searchTarget) return null;
    return (
      socialMediaClients.find((c) => c.portalToken === searchTarget || c.id === searchTarget) ||
      socialMediaClients.find(
        (c) => c.portalToken && c.portalToken.toLowerCase() === searchTarget.toLowerCase()
      )
    );
  }, [socialMediaClients, searchTarget]);

  // 2. Direct Firestore lookup fallback
  useEffect(() => {
    let active = true;

    if (!searchTarget) {
      setLookupAttempted(true);
      return;
    }

    // If client is already in memory, no need for network fetch
    if (inMemoryClient) {
      setLookupAttempted(true);
      return;
    }

    setIsDirectLoading(true);
    setFetchError(null);

    firestoreService
      .fetchSocialMediaClientByToken(searchTarget)
      .then((found) => {
        if (active) {
          if (found) {
            setDirectClient(found);
          }
          setLookupAttempted(true);
        }
      })
      .catch((err) => {
        console.warn('[Portal] Direct client fetch error:', err);
        if (active) {
          setFetchError(err?.message || 'Database connection error');
          setLookupAttempted(true);
        }
      })
      .finally(() => {
        if (active) setIsDirectLoading(false);
      });

    return () => {
      active = false;
    };
  }, [inMemoryClient, searchTarget]);

  const client = inMemoryClient || directClient;
  const cycles = client?.cycles || [];

  // Selected monthly cycle (defaults to first/latest)
  const [selectedCycleId, setSelectedCycleId] = useState<string>('');
  const [workFilter, setWorkFilter] = useState<'ALL' | 'Completed' | 'In Progress' | 'Planned'>('ALL');
  const [workSearchQuery, setWorkSearchQuery] = useState('');

  // Active cycle resolution
  const activeCycle: SmmMonthlyCycle | null = useMemo(() => {
    if (!client || cycles.length === 0) return null;
    if (selectedCycleId) {
      const found = cycles.find((c) => c.id === selectedCycleId);
      if (found) return found;
    }
    return cycles[0];
  }, [client, cycles, selectedCycleId]);

  // 1. Loading state: only show when lookup is genuinely in progress
  const isResolving = !client && (isCrmLoading || isDirectLoading || (!inMemoryClient && !lookupAttempted));
  if (isResolving) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-center font-sans">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl max-w-sm w-full shadow-2xl space-y-4 text-white">
          <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <div className="space-y-1">
            <h2 className="text-base font-bold text-white tracking-tight">Vidzyra Client Portal</h2>
            <p className="text-xs text-slate-400">Loading Client Portal...</p>
          </div>
        </div>
      </div>
    );
  }

  // 2. Database/API failure state
  if (fetchError && !client) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-center font-sans">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl max-w-md w-full shadow-2xl space-y-4 text-white">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Connection Issue</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Unable to load client information. Please try again.
          </p>
          <button
            onClick={() => {
              setLookupAttempted(false);
              setFetchError(null);
            }}
            className="mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold cursor-pointer transition shadow-md"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  // 3. Invalid token state (lookup completed, but no matching client found)
  if (!client) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-center font-sans">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl max-w-md w-full shadow-2xl space-y-4 text-white">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Invalid Portal Link</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            This portal link is invalid. Please verify the link or contact your account manager at Vidzyra to get your live portal link.
          </p>
          {!isSharedPortal && onExit && (
            <button
              onClick={onExit}
              className="mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold cursor-pointer transition shadow-md"
            >
              Return to Admin Dashboard
            </button>
          )}
        </div>
      </div>
    );
  }

  // 4. Disabled portal state
  if (client.portalStatus === 'Disabled') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-center font-sans">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl max-w-md w-full shadow-2xl space-y-5 text-white">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-xl font-bold text-white tracking-tight">Portal Disabled</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              This client portal is currently disabled. Please contact your account manager at Vidzyra to reactivate your live dashboard.
            </p>
          </div>

          {(client.whatsapp || client.phone) && (
            <a
              href={`https://wa.me/${(client.whatsapp || client.phone).replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition shadow-md"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Contact via WhatsApp</span>
            </a>
          )}

          {!isSharedPortal && onExit && (
            <button
              onClick={onExit}
              className="w-full px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              Exit In-App Preview
            </button>
          )}
        </div>
      </div>
    );
  }

  // Financial calculations for active cycle
  const packagePrice = Number(activeCycle?.packagePrice) || Number(client.monthlyPackagePrice) || 0;
  const extraWorkList = activeCycle?.extraWork || [];
  const extraWorkTotal = extraWorkList.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const totalBilling = packagePrice + extraWorkTotal;

  const paymentsList = activeCycle?.payments || [];
  const totalReceived = paymentsList.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const remainingBalance = Math.max(0, totalBilling - totalReceived);

  let paymentStatus: 'Paid' | 'Partially Paid' | 'Unpaid' = 'Unpaid';
  if (totalReceived >= totalBilling && totalBilling > 0) {
    paymentStatus = 'Paid';
  } else if (totalReceived > 0) {
    paymentStatus = 'Partially Paid';
  }

  // Deliverables calculations
  const deliverables = activeCycle?.deliverables || [];
  const totalPlanned = deliverables.reduce((s, d) => s + (Number(d.planned) || 0), 0);
  const totalCompleted = deliverables.reduce((s, d) => s + (Number(d.completed) || 0), 0);
  const totalRemaining = Math.max(0, totalPlanned - totalCompleted);
  const overallProgressPercent = totalPlanned > 0 ? Math.min(100, Math.round((totalCompleted / totalPlanned) * 100)) : 0;

  // Filtered work entries (from activeCycle.workEntries)
  const workEntries: MonthlyWorkEntry[] = activeCycle?.workEntries || [];
  const filteredWork = workEntries.filter((work) => {
    if (workFilter !== 'ALL' && work.status !== workFilter) return false;
    if (workSearchQuery.trim()) {
      const q = workSearchQuery.toLowerCase();
      const matchName = (work.name || '').toLowerCase().includes(q);
      const matchService = (work.serviceType || '').toLowerCase().includes(q);
      if (!matchName && !matchService) return false;
    }
    return true;
  });

  // Social account icon resolver
  const getPlatformIcon = (platform: SocialMediaPlatform) => {
    switch (platform) {
      case 'Instagram':
        return <Instagram className="w-4 h-4 text-pink-500" />;
      case 'Facebook':
        return <Facebook className="w-4 h-4 text-blue-600" />;
      case 'YouTube':
        return <Youtube className="w-4 h-4 text-red-500" />;
      case 'LinkedIn':
        return <Linkedin className="w-4 h-4 text-sky-600" />;
      default:
        return <Globe className="w-4 h-4 text-emerald-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Banner for Admin Simulation */}
      {!isSharedPortal && (
        <div className="bg-indigo-600 text-white px-4 py-2 text-xs font-semibold flex items-center justify-between sticky top-0 z-50 shadow-md">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Simulated Client View (Admin Preview Mode)</span>
          </div>
          {onExit && (
            <button
              onClick={onExit}
              className="flex items-center space-x-1.5 px-3 py-1 bg-indigo-700 hover:bg-indigo-800 rounded-lg text-xs font-bold transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Exit Preview</span>
            </button>
          )}
        </div>
      )}

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8">
        {/* ========================================================= */}
        {/* 1. CLIENT HEADER */}
        {/* ========================================================= */}
        <header className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 rounded-full text-xs font-bold uppercase tracking-wider">
                  Social Media Client Portal
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                    client.packageStatus === 'Active'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : client.packageStatus === 'Pending Renewal'
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  {client.packageStatus} Package
                </span>
                <span className="px-2.5 py-0.5 bg-slate-800/80 border border-slate-700/60 rounded-full text-[11px] text-slate-400 font-medium">
                  {client.businessCategory}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {client.name}
              </h1>

              <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap pt-1">
                {client.contactPerson && (
                  <div className="flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-slate-500" />
                    <span>Contact: <strong className="text-slate-200">{client.contactPerson}</strong></span>
                  </div>
                )}
                {(client.whatsapp || client.phone) && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    <span>{client.whatsapp || client.phone}</span>
                  </div>
                )}
                {client.whatsapp && (
                  <a
                    href={`https://wa.me/${client.whatsapp.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-semibold"
                  >
                    <MessageCircle className="w-3 h-3" />
                    <span>WhatsApp</span>
                  </a>
                )}
              </div>
            </div>

            {/* Cycle Selector & Current Month Info */}
            <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between space-y-3 min-w-[240px]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                  Active Billing Cycle
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              </div>

              {cycles.length > 1 ? (
                <div className="relative">
                  <select
                    value={activeCycle?.id || ''}
                    onChange={(e) => setSelectedCycleId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-white text-xs font-bold rounded-xl px-3 py-2 pr-8 appearance-none focus:outline-hidden focus:border-indigo-500 cursor-pointer"
                  >
                    {cycles.map((cyc) => (
                      <option key={cyc.id} value={cyc.id}>
                        {cyc.cycleLabel} ({cyc.yearMonth})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
                </div>
              ) : (
                <div className="text-sm font-bold text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-400" />
                  <span>{activeCycle?.cycleLabel || 'Current Month'}</span>
                </div>
              )}

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span>Package:</span>
                <strong className="text-slate-200">{client.packageName}</strong>
              </div>
            </div>
          </div>
        </header>

        {/* ========================================================= */}
        {/* 2. SOCIAL MEDIA ACCOUNTS */}
        {/* ========================================================= */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Share2 className="w-4 h-4 text-indigo-400" />
              <span>Connected Social Media Accounts</span>
            </h2>
            <span className="text-xs text-slate-500">
              {client.accounts?.length || 0} Connected
            </span>
          </div>

          {(!client.accounts || client.accounts.length === 0) ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-center text-xs text-slate-500 italic">
              No social media accounts connected yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {client.accounts.map((acc) => (
                <div
                  key={acc.id}
                  className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 transition shadow-xs flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <div className="p-2 bg-slate-950 border border-slate-800 rounded-xl shrink-0">
                        {getPlatformIcon(acc.platform)}
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-white block truncate">
                          {acc.platform}
                        </span>
                        <span className="text-[11px] text-slate-400 block truncate">
                          {acc.profileName || 'Active Page'}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        acc.accountStatus === 'Active'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {acc.accountStatus}
                    </span>
                  </div>

                  {acc.notes && (
                    <p className="text-[11px] text-slate-400 line-clamp-1 italic">
                      "{acc.notes}"
                    </p>
                  )}

                  {acc.profileUrl ? (
                    <a
                      href={acc.profileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full px-3 py-2 bg-slate-950 hover:bg-indigo-600 hover:text-white border border-slate-800 hover:border-indigo-500 text-slate-300 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>OPEN PROFILE</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  ) : (
                    <span className="text-[11px] text-slate-600 italic text-center py-1">
                      No profile link provided
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ========================================================= */}
        {/* 3. MONTHLY PACKAGE & KEY INFO */}
        {/* ========================================================= */}
        <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Monthly Package Details</span>
            </h2>
            <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full">
              {client.billingCycle || 'Monthly'} Cycle
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-xs">
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
              <span className="text-slate-400 block text-[11px]">Package Name</span>
              <strong className="text-white text-sm block truncate">{client.packageName}</strong>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
              <span className="text-slate-400 block text-[11px]">Monthly Package Price</span>
              <strong className="text-indigo-400 text-sm block font-mono">
                ₹{(packagePrice || 0).toLocaleString('en-IN')}
              </strong>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
              <span className="text-slate-400 block text-[11px]">Billing Cycle</span>
              <strong className="text-slate-200 text-sm block">{client.billingCycle || 'Monthly'}</strong>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
              <span className="text-slate-400 block text-[11px]">Start Date</span>
              <strong className="text-slate-200 text-sm block font-mono">
                {client.packageStartDate || '—'}
              </strong>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
              <span className="text-slate-400 block text-[11px]">Renewal Date</span>
              <strong className="text-amber-400 text-sm block font-mono">
                {client.packageRenewalDate || '—'}
              </strong>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
              <span className="text-slate-400 block text-[11px]">Package Status</span>
              <strong className="text-emerald-400 text-sm block">{client.packageStatus}</strong>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 4. MONTHLY DELIVERABLES PROGRESS */}
        {/* ========================================================= */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                <span>Monthly Deliverables Progress • {activeCycle?.cycleLabel || 'Current Cycle'}</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Visual progress of committed deliverables planned vs completed for this billing cycle.
              </p>
            </div>

            {/* Overall stats pill */}
            <div className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-2xl flex items-center space-x-3 text-xs shrink-0">
              <span className="text-slate-400">Overall:</span>
              <strong className="text-white font-mono">
                {totalCompleted} / {totalPlanned} Completed
              </strong>
              <span className="px-2 py-0.5 rounded-full font-bold text-[11px] bg-indigo-500/20 text-indigo-300">
                {overallProgressPercent}%
              </span>
            </div>
          </div>

          {/* Deliverables Cards Grid */}
          {deliverables.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center text-xs text-slate-400 italic">
              No deliverables configured for this monthly cycle yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {deliverables.map((item) => {
                const planned = Number(item.planned) || 0;
                const completed = Number(item.completed) || 0;
                const remaining = Math.max(0, planned - completed);
                const percent = planned > 0 ? Math.min(100, Math.round((completed / planned) * 100)) : 0;
                const isFinished = completed >= planned && planned > 0;

                return (
                  <div
                    key={item.id}
                    className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-xs transition space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-white text-sm">{item.service}</h3>
                        {item.category && (
                          <span className="text-[10px] text-indigo-400 uppercase tracking-wider font-semibold">
                            {item.category}
                          </span>
                        )}
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                          isFinished
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : completed > 0
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {isFinished ? (
                          <>
                            <Check className="w-3 h-3" />
                            Completed
                          </>
                        ) : (
                          `${percent}% Done`
                        )}
                      </span>
                    </div>

                    {/* Numerical breakdown: Planned, Completed, Remaining */}
                    <div className="grid grid-cols-3 gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 text-center text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Planned</span>
                        <strong className="text-white font-mono text-sm">{planned}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-emerald-400 block">Completed</span>
                        <strong className="text-emerald-400 font-mono text-sm">{completed}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-amber-400 block">Remaining</span>
                        <strong className="text-amber-400 font-mono text-sm">{remaining}</strong>
                      </div>
                    </div>

                    {/* Visual Progress Bar */}
                    <div className="space-y-1">
                      <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isFinished
                              ? 'bg-emerald-500'
                              : percent > 50
                              ? 'bg-indigo-500'
                              : 'bg-indigo-600'
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-500">
                        <span>0%</span>
                        <span>{completed} of {planned} delivered</span>
                        <span>100%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ========================================================= */}
        {/* 5. WORK / CONTENT UPDATES */}
        {/* ========================================================= */}
        <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-400" />
                <span>Work / Content Updates</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Detailed work entries and published posts for this month.
              </p>
            </div>

            {/* Filter Tabs & Search */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center bg-slate-950 border border-slate-800 p-1 rounded-xl">
                {(['ALL', 'Completed', 'In Progress', 'Planned'] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setWorkFilter(tab)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      workFilter === tab
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search work..."
                  value={workSearchQuery}
                  onChange={(e) => setWorkSearchQuery(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-white text-xs rounded-xl pl-8 pr-3 py-1.5 focus:outline-hidden focus:border-indigo-500 w-40 sm:w-48"
                />
              </div>
            </div>
          </div>

          {filteredWork.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 italic bg-slate-950/50 rounded-2xl border border-slate-800/80">
              No work items match the current filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 text-[11px] uppercase tracking-wider font-bold border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Work Name</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Links</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredWork.map((entry) => (
                    <tr key={entry.id} className="hover:bg-slate-800/40 transition">
                      <td className="px-4 py-3 font-mono text-slate-400 whitespace-nowrap">
                        {entry.date || '—'}
                      </td>
                      <td className="px-4 py-3 font-semibold text-white">
                        <div>
                          <span>{entry.name}</span>
                          {entry.notes && (
                            <p className="text-[11px] text-slate-400 italic font-normal mt-0.5">
                              {entry.notes}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2.5 py-0.5 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded-md text-[10px] font-semibold whitespace-nowrap">
                          {entry.serviceType}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                            entry.status === 'Completed'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : entry.status === 'In Progress'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : entry.status === 'Planned'
                              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {entry.status === 'Completed' && <CheckCircle2 className="w-3 h-3" />}
                          {entry.status === 'In Progress' && <Clock className="w-3 h-3" />}
                          <span>{entry.status}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-2">
                          {entry.fileLink && (
                            <a
                              href={entry.fileLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 text-indigo-400 border border-slate-700 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 transition"
                              title="View Files / Drive"
                            >
                              <FolderOpen className="w-3 h-3" />
                              <span>Files</span>
                            </a>
                          )}
                          {entry.socialPostUrl && (
                            <a
                              href={entry.socialPostUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[11px] font-bold inline-flex items-center gap-1 transition"
                              title="View Published Post"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>Live Post</span>
                            </a>
                          )}
                          {!entry.fileLink && !entry.socialPostUrl && (
                            <span className="text-[11px] text-slate-600">—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ========================================================= */}
        {/* 6. EXTRA WORK (OUT OF PACKAGE) */}
        {/* ========================================================= */}
        <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-400" />
                <span>Extra Work (Out of Package)</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Additional services and custom assignments requested outside the monthly package.
              </p>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Total Extra Work</span>
              <strong className="text-amber-400 text-base font-mono">
                ₹{extraWorkTotal.toLocaleString('en-IN')}
              </strong>
            </div>
          </div>

          {extraWorkList.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500 italic bg-slate-950/40 rounded-2xl border border-slate-800">
              No extra out-of-package work for this month.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 text-[11px] uppercase tracking-wider font-bold border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-2.5">Date</th>
                    <th className="px-4 py-2.5">Work / Service</th>
                    <th className="px-4 py-2.5">Qty</th>
                    <th className="px-4 py-2.5 text-right">Rate</th>
                    <th className="px-4 py-2.5 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {extraWorkList.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-800/40 transition">
                      <td className="px-4 py-3 font-mono text-slate-400 whitespace-nowrap">
                        {item.date || '—'}
                      </td>
                      <td className="px-4 py-3 font-semibold text-white">
                        <span>{item.workName}</span>
                        <span className="text-slate-400 block text-[11px] font-normal">
                          {item.serviceType}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-300">
                        {item.quantity || 1}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-400 text-right">
                        ₹{(Number(item.rate) || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-amber-400 text-right whitespace-nowrap">
                        ₹{(Number(item.amount) || 0).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ========================================================= */}
        {/* 7. PAYMENT SUMMARY & RECEIPTS */}
        {/* ========================================================= */}
        <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-400" />
                <span>Payment & Billing Summary</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Official billing statement and verified payment records for {activeCycle?.cycleLabel || 'this cycle'}.
              </p>
            </div>

            <span
              className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5 self-start sm:self-auto ${
                paymentStatus === 'Paid'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : paymentStatus === 'Partially Paid'
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              Status: {paymentStatus}
            </span>
          </div>

          {/* Client Financial Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 text-xs">
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-slate-400 block text-[11px]">Monthly Package</span>
              <strong className="text-white text-base block font-mono">
                ₹{packagePrice.toLocaleString('en-IN')}
              </strong>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-slate-400 block text-[11px]">Extra Work Total</span>
              <strong className="text-amber-400 text-base block font-mono">
                ₹{extraWorkTotal.toLocaleString('en-IN')}
              </strong>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-slate-400 block text-[11px]">Total Billing</span>
              <strong className="text-white text-base block font-mono">
                ₹{totalBilling.toLocaleString('en-IN')}
              </strong>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-slate-400 block text-[11px]">Total Received</span>
              <strong className="text-emerald-400 text-base block font-mono">
                ₹{totalReceived.toLocaleString('en-IN')}
              </strong>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1 col-span-2 sm:col-span-1">
              <span className="text-slate-400 block text-[11px]">Remaining Balance</span>
              <strong
                className={`text-base block font-mono ${
                  remainingBalance === 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                ₹{remainingBalance.toLocaleString('en-IN')}
              </strong>
            </div>
          </div>

          {/* Verified Transactions / Payments List */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Receipt className="w-3.5 h-3.5 text-slate-500" />
              <span>Verified Payment Transactions</span>
            </h3>

            {paymentsList.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500 italic bg-slate-950/50 rounded-xl border border-slate-800">
                No payment transactions recorded for this cycle yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-800/80 bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden">
                {paymentsList.map((p) => (
                  <div
                    key={p.id}
                    className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-900/50 transition flex-wrap gap-2"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-white block">
                          ₹{Number(p.amount || 0).toLocaleString('en-IN')}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {p.paymentMode || 'Payment'} • Ref: {p.referenceNumber || 'N/A'}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-slate-400 font-mono text-[11px] block">{p.date}</span>
                      <span className="text-[10px] text-emerald-400 font-bold">Verified</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ========================================================= */}
        {/* 8. CLIENT GUIDELINES & NOTES (IF AVAILABLE) */}
        {/* ========================================================= */}
        {client.notes && (client.notes.brandGuidelines || client.notes.preferredContentStyle || client.notes.revisionRules) && (
          <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 border-b border-slate-800 pb-3">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span>Client Guidelines & Preferences</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              {client.notes.brandGuidelines && (
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-slate-400 block font-bold text-[11px]">Brand Guidelines</span>
                  <p className="text-slate-300 leading-relaxed whitespace-pre-line">
                    {client.notes.brandGuidelines}
                  </p>
                </div>
              )}

              {client.notes.preferredContentStyle && (
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-slate-400 block font-bold text-[11px]">Preferred Content Style</span>
                  <p className="text-slate-300 leading-relaxed whitespace-pre-line">
                    {client.notes.preferredContentStyle}
                  </p>
                </div>
              )}

              {client.notes.revisionRules && (
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-slate-400 block font-bold text-[11px]">Revision Policy</span>
                  <p className="text-slate-300 leading-relaxed whitespace-pre-line">
                    {client.notes.revisionRules}
                  </p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className="pt-6 pb-12 border-t border-slate-800/80 text-center text-xs text-slate-500 space-y-1">
          <p>
            {settings.businessName || 'Vidzyra Studio'} • Social Media Management Client Portal
          </p>
          <p className="text-[11px] text-slate-600">
            Real-time live synchronization active • All updates reflect automatically
          </p>
        </footer>
      </div>
    </div>
  );
};
