import React, { useState, useMemo } from 'react';
import {
  Share2,
  Plus,
  Search,
  Filter,
  Building,
  Calendar,
  ExternalLink,
  DollarSign,
  Layers,
  Clock,
  AlertCircle,
  CheckCircle2,
  Phone,
  MessageCircle,
  Mail,
  ChevronRight,
  TrendingUp,
  Trash2,
  Edit,
  Sparkles,
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { SocialMediaClient, SocialClientStatus, PackageStatus } from '../../types';
import { SocialClientFormModal } from './SocialClientFormModal';
import { SocialClientDetailModal } from './SocialClientDetailModal';
import { SmmSharePortalModal } from './SmmSharePortalModal';

export const SocialMediaMain: React.FC = () => {
  const { socialMediaClients, deleteSocialMediaClient } = useCrm();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | SocialClientStatus>('All');
  const [packageStatusFilter, setPackageStatusFilter] = useState<'All' | PackageStatus>('All');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<'All' | 'Paid' | 'Partially Paid' | 'Pending'>('All');

  // Modal State
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [portalClient, setPortalClient] = useState<SocialMediaClient | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<SocialMediaClient | null>(null);

  // Filtered Clients
  const filteredClients = useMemo(() => {
    return socialMediaClients.filter((c) => {
      // Search
      const q = searchQuery.toLowerCase().trim();
      if (q) {
        const matchesName = c.name.toLowerCase().includes(q);
        const matchesContact = c.contactPerson.toLowerCase().includes(q);
        const matchesPhone = c.phone.includes(q) || c.whatsapp.includes(q);
        const matchesCategory = c.businessCategory.toLowerCase().includes(q);
        const matchesHandles = (c.accounts || []).some(
          (a) => a.profileName.toLowerCase().includes(q) || a.profileUrl.toLowerCase().includes(q)
        );
        if (!matchesName && !matchesContact && !matchesPhone && !matchesCategory && !matchesHandles) {
          return false;
        }
      }

      // Status Filter
      if (statusFilter !== 'All' && c.clientStatus !== statusFilter) {
        return false;
      }

      // Package Status Filter
      if (packageStatusFilter !== 'All' && c.packageStatus !== packageStatusFilter) {
        return false;
      }

      // Payment Status Filter (computed on latest cycle)
      if (paymentStatusFilter !== 'All') {
        const latestCycle = (c.cycles || [])[0];
        if (!latestCycle) {
          if (paymentStatusFilter !== 'Pending') return false;
        } else {
          const pkg = Number(latestCycle.packagePrice) || Number(c.monthlyPackagePrice) || 0;
          const extra = (latestCycle.extraWork || []).reduce((s, e) => s + (Number(e.amount) || 0), 0);
          const totalBilling = pkg + extra;
          const received = (latestCycle.payments || []).reduce((s, p) => s + (Number(p.amount) || 0), 0);
          let currentStatus: 'Paid' | 'Partially Paid' | 'Pending' = 'Pending';
          if (received >= totalBilling && totalBilling > 0) {
            currentStatus = 'Paid';
          } else if (received > 0) {
            currentStatus = 'Partially Paid';
          }
          if (currentStatus !== paymentStatusFilter) return false;
        }
      }

      return true;
    });
  }, [socialMediaClients, searchQuery, statusFilter, packageStatusFilter, paymentStatusFilter]);

  // Overall KPIs
  const kpis = useMemo(() => {
    const totalClients = socialMediaClients.length;
    const activeClients = socialMediaClients.filter((c) => c.clientStatus === 'Active').length;
    const totalMonthlyRetainer = socialMediaClients
      .filter((c) => c.clientStatus === 'Active')
      .reduce((sum, c) => sum + (Number(c.monthlyPackagePrice) || 0), 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let renewalsDueCount = 0;
    let expiredCount = 0;

    socialMediaClients.forEach((c) => {
      if (c.packageRenewalDate) {
        const renewal = new Date(c.packageRenewalDate);
        renewal.setHours(0, 0, 0, 0);
        const diffDays = Math.ceil((renewal.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays < 0) expiredCount++;
        else if (diffDays <= 7) renewalsDueCount++;
      }
    });

    return {
      totalClients,
      activeClients,
      totalMonthlyRetainer,
      renewalsDueCount,
      expiredCount,
    };
  }, [socialMediaClients]);

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to remove social media management client "${name}"?`)) {
      await deleteSocialMediaClient(id);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-xs">
              <Share2 className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Social Media Management
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage recurring monthly social media clients, deliverables, content calendars, and billing cycles.
          </p>
        </div>

        <button
          id="btn-add-smm-client"
          type="button"
          onClick={() => {
            setClientToEdit(null);
            setIsFormOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Social Media Client</span>
        </button>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Managed Clients
          </span>
          <div className="text-2xl font-bold text-slate-900">{kpis.totalClients}</div>
          <span className="text-[11px] text-emerald-600 font-medium">
            {kpis.activeClients} actively on retainer
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-indigo-200 shadow-2xs space-y-1 bg-indigo-50/20">
          <span className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wider block">
            Monthly Retainer Revenue
          </span>
          <div className="text-2xl font-bold text-indigo-900">
            ₹{kpis.totalMonthlyRetainer.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-slate-500">From recurring monthly packages</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider block">
            Renewals Due Soon
          </span>
          <div className="text-2xl font-bold text-amber-700">{kpis.renewalsDueCount}</div>
          <span className="text-[11px] text-amber-600 font-medium">Due within 7 days</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-rose-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider block">
            Expired Packages
          </span>
          <div className="text-2xl font-bold text-rose-700">{kpis.expiredCount}</div>
          <span className="text-[11px] text-rose-600 font-medium">Require renewal confirmation</span>
        </div>
      </div>

      {/* Search & Filters Bar */}
      <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Search Input */}
          <div className="sm:col-span-4 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by client, handle, phone, category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* Client Status */}
          <div className="sm:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700"
            >
              <option value="All">All Client Statuses</option>
              <option value="Active">Active</option>
              <option value="On Hold">On Hold</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          {/* Package Status */}
          <div className="sm:col-span-3">
            <select
              value={packageStatusFilter}
              onChange={(e) => setPackageStatusFilter(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700"
            >
              <option value="All">All Package Statuses</option>
              <option value="Active">Package Active</option>
              <option value="Pending Renewal">Pending Renewal</option>
              <option value="Paused">Paused</option>
              <option value="Expired">Expired</option>
            </select>
          </div>

          {/* Payment Status */}
          <div className="sm:col-span-2">
            <select
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700"
            >
              <option value="All">All Payments</option>
              <option value="Paid">Paid</option>
              <option value="Partially Paid">Partially Paid</option>
              <option value="Pending">Pending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Client List / Cards */}
      {filteredClients.length === 0 ? (
        <div className="p-12 text-center bg-white border border-dashed border-slate-200 rounded-2xl space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <Share2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">No Social Media Clients Found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchQuery || statusFilter !== 'All' || packageStatusFilter !== 'All'
                ? 'Try adjusting your search criteria or filters.'
                : 'Enroll your first client for monthly social media management, deliverables, and calendar tracking.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setClientToEdit(null);
              setIsFormOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add First SMM Client
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map((c) => {
            const latestCycle = (c.cycles || [])[0];
            const pkg = Number(latestCycle?.packagePrice) || Number(c.monthlyPackagePrice) || 0;
            const extra = (latestCycle?.extraWork || []).reduce((s, e) => s + (Number(e.amount) || 0), 0);
            const totalBilling = pkg + extra;
            const totalReceived = (latestCycle?.payments || []).reduce((s, p) => s + (Number(p.amount) || 0), 0);
            const remainingBalance = Math.max(0, totalBilling - totalReceived);

            let paymentStatus: 'Paid' | 'Partially Paid' | 'Pending' = 'Pending';
            if (totalReceived >= totalBilling && totalBilling > 0) {
              paymentStatus = 'Paid';
            } else if (totalReceived > 0) {
              paymentStatus = 'Partially Paid';
            }

            // Deliverables counts
            const deliverables = latestCycle?.deliverables || [];
            const plannedCount = deliverables.reduce((s, d) => s + (Number(d.planned) || 0), 0);
            const completedCount = deliverables.reduce((s, d) => s + (Number(d.completed) || 0), 0);
            const progressPercent = plannedCount > 0 ? Math.min(100, Math.round((completedCount / plannedCount) * 100)) : 0;

            // Renewal check
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            let renewalAlert: 'expired' | 'due' | null = null;
            if (c.packageRenewalDate) {
              const ren = new Date(c.packageRenewalDate);
              ren.setHours(0, 0, 0, 0);
              const diff = Math.ceil((ren.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
              if (diff < 0) renewalAlert = 'expired';
              else if (diff <= 7) renewalAlert = 'due';
            }

            return (
              <div
                key={c.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs hover:shadow-md hover:border-indigo-300 transition flex flex-col justify-between space-y-4"
              >
                {/* Header */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900 text-sm truncate">{c.name}</h3>
                      </div>
                      <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full inline-block mt-0.5">
                        {c.businessCategory || 'Social Media'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          c.clientStatus === 'Active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {c.clientStatus}
                      </span>
                    </div>
                  </div>

                  {/* Renewal Warning if applicable */}
                  {renewalAlert === 'expired' ? (
                    <div className="p-1.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-[10px] font-bold flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>Package Expired! Renews: {c.packageRenewalDate}</span>
                    </div>
                  ) : renewalAlert === 'due' ? (
                    <div className="p-1.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-[10px] font-bold flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 shrink-0" />
                      <span>Renewal Due Soon: {c.packageRenewalDate}</span>
                    </div>
                  ) : null}

                  {/* Contact Info */}
                  <div className="text-xs text-slate-500 space-y-1 pt-1">
                    {c.contactPerson && (
                      <div className="flex items-center gap-1.5 truncate">
                        <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{c.contactPerson}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-3 flex-wrap">
                      {(c.phone || c.whatsapp) && (
                        <div className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{c.whatsapp || c.phone}</span>
                        </div>
                      )}
                      {c.whatsapp && (
                        <a
                          href={`https://wa.me/${c.whatsapp.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-600 hover:text-emerald-700 font-semibold inline-flex items-center gap-0.5 text-[11px]"
                          title="Open WhatsApp chat"
                        >
                          <MessageCircle className="w-3 h-3" />
                          WhatsApp
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Package & Connected Social Accounts */}
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-700 truncate">{c.packageName}</span>
                    <span className="font-bold text-indigo-700">₹{(c.monthlyPackagePrice || 0).toLocaleString('en-IN')}/mo</span>
                  </div>

                  {/* Connected Accounts badges */}
                  <div className="flex flex-wrap gap-1 pt-1">
                    {(!c.accounts || c.accounts.length === 0) ? (
                      <span className="text-[10px] text-slate-400 italic">No social accounts connected</span>
                    ) : (
                      c.accounts.map((acc) => (
                        <a
                          key={acc.id}
                          href={acc.profileUrl || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-0.5 bg-white border border-slate-200 hover:border-indigo-400 rounded-md text-[10px] font-semibold text-slate-700 inline-flex items-center gap-1 transition"
                          title={`Open ${acc.platform} Profile: ${acc.profileName}`}
                        >
                          <span>{acc.platform}</span>
                          <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                        </a>
                      ))
                    )}
                  </div>
                </div>

                {/* Current Month Cycle Progress & Financials */}
                <div className="space-y-2 pt-1 border-t border-slate-100 text-xs">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 font-medium">
                      {latestCycle ? latestCycle.cycleLabel : 'Current Month'} Deliverables:
                    </span>
                    <span className="font-bold text-slate-800">
                      {completedCount} / {plannedCount} Done ({progressPercent}%)
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>

                  {/* Payment snapshot */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-slate-500 text-[11px]">
                      Billing: <strong>₹{totalBilling.toLocaleString('en-IN')}</strong>
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        paymentStatus === 'Paid'
                          ? 'bg-emerald-100 text-emerald-800'
                          : paymentStatus === 'Partially Paid'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {paymentStatus}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1 flex-wrap">
                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={() => {
                        setClientToEdit(c);
                        setIsFormOpen(true);
                      }}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                      title="Edit Client Settings"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(c.id, c.name)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                      title="Delete Client"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPortalClient(c)}
                      className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                      title="Live Shareable Client Portal Link"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Client Portal</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedClientId(c.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-indigo-600 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
                  >
                    <span>Open Monthly Hub</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Form Modal (Add / Edit SMM Client) */}
      <SocialClientFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setClientToEdit(null);
        }}
        clientToEdit={clientToEdit}
      />

      {/* Detail / Monthly Hub Modal */}
      <SocialClientDetailModal
        isOpen={!!selectedClientId}
        onClose={() => setSelectedClientId(null)}
        clientId={selectedClientId}
        onEditClient={(client) => {
          setSelectedClientId(null);
          setClientToEdit(client);
          setIsFormOpen(true);
        }}
      />

      {/* SMM Client Share Portal Modal */}
      <SmmSharePortalModal
        isOpen={Boolean(portalClient)}
        onClose={() => setPortalClient(null)}
        client={portalClient}
      />
    </div>
  );
};
