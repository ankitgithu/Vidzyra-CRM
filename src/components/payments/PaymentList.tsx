import React, { useState, useMemo } from 'react';
import {
  CreditCard,
  Plus,
  Search,
  Download,
  FileSpreadsheet,
  ArrowDownRight,
  ArrowUpRight,
  DollarSign,
  Calendar,
  Eye,
  Edit3,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Filter,
  X,
  Building,
  User,
  RotateCcw,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { ReceiptData } from '../../utils/receiptGenerator';
import { exportPaymentsToCsv, exportExpensesToCsv } from '../../utils/exportUtils';
import { PaymentReceiptModal } from './PaymentReceiptModal';
import { PaymentFormModal } from './PaymentFormModal';
import { PaymentDetailModal } from './PaymentDetailModal';
import {
  ClientPayment,
  EditorPayment,
  PaymentType,
  PaymentMethod,
  PaymentStatus,
} from '../../types';

interface PaymentListProps {
  onOpenNewPayment?: (category?: 'Client' | 'Editor' | 'Expense', recipientId?: string) => void;
}

export const PaymentList: React.FC<PaymentListProps> = ({ onOpenNewPayment }) => {
  const {
    clientPayments,
    editorPayments,
    expenses,
    clients,
    editors,
    projects,
    financialMetrics,
    settings,
    getClientStats,
    getEditorStats,
    deleteClientPayment,
    deleteEditorPayment,
  } = useCrm();

  // Active tab: 'clients' | 'editors' | 'expenses'
  const [activeTab, setActiveTab] = useState<'clients' | 'editors' | 'expenses'>('clients');

  // Search and Filter States
  const [search, setSearch] = useState('');
  const [filterClientId, setFilterClientId] = useState('');
  const [filterEditorId, setFilterEditorId] = useState('');
  const [filterType, setFilterType] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterMethod, setFilterMethod] = useState<string>('All');
  const [filterDateRange, setFilterDateRange] = useState<string>('All');

  // Modals state
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptData | null>(null);

  // Delete Payment Confirmation State
  const [paymentToDelete, setPaymentToDelete] = useState<{
    id: string;
    category: 'Client' | 'Editor';
    receiptNumber?: string;
    amount: number;
  } | null>(null);

  const [deleteSuccessMessage, setDeleteSuccessMessage] = useState<string | null>(null);

  const handleConfirmDeletePayment = () => {
    if (!paymentToDelete) return;
    if (paymentToDelete.category === 'Client') {
      deleteClientPayment(paymentToDelete.id);
    } else {
      deleteEditorPayment(paymentToDelete.id);
    }
    setPaymentToDelete(null);
    setDeleteSuccessMessage('Payment deleted successfully.');
    setTimeout(() => {
      setDeleteSuccessMessage(null);
    }, 4000);
  };

  // Detail Modal state
  const [detailModalState, setDetailModalState] = useState<{
    isOpen: boolean;
    paymentId: string | null;
    category: 'Client' | 'Editor';
  }>({
    isOpen: false,
    paymentId: null,
    category: 'Client',
  });

  // Edit / Form Modal state
  const [formModalState, setFormModalState] = useState<{
    isOpen: boolean;
    category: 'Client' | 'Editor' | 'Expense';
    paymentToEdit: ClientPayment | EditorPayment | null;
  }>({
    isOpen: false,
    category: 'Client',
    paymentToEdit: null,
  });

  // Calculate project or entity payment status
  const calculateClientPaymentStatus = (p: ClientPayment): PaymentStatus => {
    if (p.workId) {
      const proj = projects.find((pr) => pr.id === p.workId);
      if (proj) {
        const pays = clientPayments.filter((cp) => cp.workId === proj.id);
        const totalPaid = pays.reduce((sum, cp) => sum + cp.amount, 0);
        if (totalPaid >= proj.totalBilling && proj.totalBilling > 0) return 'Paid';
        if (totalPaid > 0) return 'Partial';
        return 'Pending';
      }
    }
    const stats = getClientStats(p.clientId);
    return stats.paymentStatus;
  };

  const calculateEditorPaymentStatus = (p: EditorPayment): PaymentStatus => {
    if (p.workId) {
      const proj = projects.find((pr) => pr.id === p.workId);
      if (proj) {
        const cost = proj.quantity * (proj.editorRate || 0);
        const pays = editorPayments.filter((ep) => ep.workId === proj.id);
        const totalPaid = pays.reduce((sum, ep) => sum + ep.amount, 0);
        if (totalPaid >= cost && cost > 0) return 'Paid';
        if (totalPaid > 0) return 'Partial';
        return 'Pending';
      }
    }
    const stats = getEditorStats(p.editorId);
    return stats.paymentStatus;
  };

  // Enriched Client Rows
  const clientRows = useMemo(() => {
    return clientPayments.map((p) => {
      const client = clients.find((c) => c.id === p.clientId);
      const project = projects.find((proj) => proj.id === p.workId);
      const status = calculateClientPaymentStatus(p);
      return {
        ...p,
        clientName: client?.name || 'Unknown Client',
        projectName: project?.name || 'All Deliverables / General',
        status,
        dateFormatted: p.date || p.paymentDate || 'N/A',
      };
    });
  }, [clientPayments, clients, projects]);

  // Enriched Editor Rows
  const editorRows = useMemo(() => {
    return editorPayments.map((p) => {
      const editor = editors.find((e) => e.id === p.editorId);
      const project = projects.find((proj) => proj.id === p.workId);
      const status = calculateEditorPaymentStatus(p);
      return {
        ...p,
        editorName: editor?.name || 'Unknown Editor',
        projectName: project?.name || 'Batch Payout / General',
        status,
        dateFormatted: p.date || p.paymentDate || 'N/A',
      };
    });
  }, [editorPayments, editors, projects]);

  // Date filter helper
  const isDateInRange = (dateStr?: string) => {
    if (!dateStr || filterDateRange === 'All') return true;
    const paymentDate = new Date(dateStr);
    const now = new Date();

    if (filterDateRange === 'Today') {
      return paymentDate.toDateString() === now.toDateString();
    }
    if (filterDateRange === 'This Week') {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      return paymentDate >= startOfWeek;
    }
    if (filterDateRange === 'This Month') {
      return (
        paymentDate.getMonth() === now.getMonth() &&
        paymentDate.getFullYear() === now.getFullYear()
      );
    }
    if (filterDateRange === 'This Year') {
      return paymentDate.getFullYear() === now.getFullYear();
    }
    return true;
  };

  // Filtered Client Rows
  const filteredClientRows = useMemo(() => {
    return clientRows.filter((r) => {
      // Search
      if (search) {
        const q = search.toLowerCase();
        const match =
          r.clientName.toLowerCase().includes(q) ||
          r.receiptNumber.toLowerCase().includes(q) ||
          r.projectName.toLowerCase().includes(q) ||
          r.paymentMethod.toLowerCase().includes(q) ||
          (r.referenceNumber && r.referenceNumber.toLowerCase().includes(q)) ||
          (r.notes && r.notes.toLowerCase().includes(q));
        if (!match) return false;
      }

      // Client filter
      if (filterClientId && r.clientId !== filterClientId) return false;

      // Type filter
      if (filterType !== 'All' && r.paymentType !== filterType) return false;

      // Status filter
      if (filterStatus !== 'All' && r.status !== filterStatus) return false;

      // Method filter
      if (filterMethod !== 'All' && r.paymentMethod !== filterMethod) return false;

      // Date Range
      if (!isDateInRange(r.date || r.paymentDate)) return false;

      return true;
    });
  }, [clientRows, search, filterClientId, filterType, filterStatus, filterMethod, filterDateRange]);

  // Filtered Editor Rows
  const filteredEditorRows = useMemo(() => {
    return editorRows.filter((r) => {
      // Search
      if (search) {
        const q = search.toLowerCase();
        const match =
          r.editorName.toLowerCase().includes(q) ||
          r.receiptNumber.toLowerCase().includes(q) ||
          r.projectName.toLowerCase().includes(q) ||
          r.paymentMethod.toLowerCase().includes(q) ||
          (r.referenceNumber && r.referenceNumber.toLowerCase().includes(q)) ||
          (r.notes && r.notes.toLowerCase().includes(q));
        if (!match) return false;
      }

      // Editor filter
      if (filterEditorId && r.editorId !== filterEditorId) return false;

      // Type filter
      if (filterType !== 'All' && r.paymentType !== filterType) return false;

      // Status filter
      if (filterStatus !== 'All' && r.status !== filterStatus) return false;

      // Method filter
      if (filterMethod !== 'All' && r.paymentMethod !== filterMethod) return false;

      // Date Range
      if (!isDateInRange(r.date || r.paymentDate)) return false;

      return true;
    });
  }, [editorRows, search, filterEditorId, filterType, filterStatus, filterMethod, filterDateRange]);

  // Filtered Expenses
  const filteredExpenses = useMemo(() => {
    if (!search) return expenses;
    const q = search.toLowerCase();
    return expenses.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q) ||
        e.paymentMethod.toLowerCase().includes(q)
    );
  }, [expenses, search]);

  const hasActiveFilters =
    Boolean(search) ||
    Boolean(filterClientId) ||
    Boolean(filterEditorId) ||
    filterType !== 'All' ||
    filterStatus !== 'All' ||
    filterMethod !== 'All' ||
    filterDateRange !== 'All';

  const resetFilters = () => {
    setSearch('');
    setFilterClientId('');
    setFilterEditorId('');
    setFilterType('All');
    setFilterStatus('All');
    setFilterMethod('All');
    setFilterDateRange('All');
  };

  // Receipt Opening Handlers
  const handleOpenClientReceipt = (payment: ClientPayment) => {
    const client = clients.find((c) => c.id === payment.clientId);
    const project = payment.workId ? projects.find((p) => p.id === payment.workId) : null;

    let totalAmount = 0;
    let totalPaid = 0;
    let remaining = 0;
    let status: PaymentStatus = 'Pending';

    if (project) {
      totalAmount = project.totalBilling;
      const pays = clientPayments.filter((p) => p.workId === project.id);
      totalPaid = pays.reduce((s, p) => s + p.amount, 0);
      remaining = Math.max(0, totalAmount - totalPaid);
      status = totalPaid >= totalAmount && totalAmount > 0 ? 'Paid' : totalPaid > 0 ? 'Partial' : 'Pending';
    } else if (client) {
      const stats = getClientStats(client.id);
      totalAmount = stats.totalBilling;
      totalPaid = stats.totalPaid;
      remaining = stats.remaining;
      status = stats.paymentStatus;
    }

    const receipt: ReceiptData = {
      receiptNumber: payment.receiptNumber,
      recipientType: 'Client',
      recipientName: client?.name || 'Valued Client',
      payerName: client?.name || 'Valued Client',
      payeeName: settings.businessName || 'Vidzyra Video Agency',
      amount: payment.amount,
      date: payment.date || payment.paymentDate || new Date().toISOString().split('T')[0],
      paymentType: payment.paymentType,
      paymentMethod: payment.paymentMethod,
      referenceNumber: payment.referenceNumber || '',
      projectName: project?.name || 'All Associated Deliverables',
      totalAmount,
      totalPaid,
      remainingAmount: remaining,
      paymentStatus: status,
      notes: payment.notes,
      businessName: settings.businessName,
      tagline: settings.tagline,
      authorizedSignatory: 'Vidzyra Finance Team',
    };
    setSelectedReceipt(receipt);
  };

  const handleOpenEditorReceipt = (payment: EditorPayment) => {
    const editor = editors.find((e) => e.id === payment.editorId);
    const project = payment.workId ? projects.find((p) => p.id === payment.workId) : null;

    let totalAmount = 0;
    let totalPaid = 0;
    let remaining = 0;
    let status: PaymentStatus = 'Pending';

    if (project) {
      totalAmount = project.quantity * (project.editorRate || 0);
      const pays = editorPayments.filter((p) => p.workId === project.id);
      totalPaid = pays.reduce((s, p) => s + p.amount, 0);
      remaining = Math.max(0, totalAmount - totalPaid);
      status = totalPaid >= totalAmount && totalAmount > 0 ? 'Paid' : totalPaid > 0 ? 'Partial' : 'Pending';
    } else if (editor) {
      const stats = getEditorStats(editor.id);
      totalAmount = stats.totalCost;
      totalPaid = stats.totalPaid;
      remaining = stats.remaining;
      status = stats.paymentStatus;
    }

    const receipt: ReceiptData = {
      receiptNumber: payment.receiptNumber,
      recipientType: 'Editor',
      recipientName: editor?.name || 'Team Editor',
      payerName: settings.businessName || 'Vidzyra Video Agency',
      payeeName: editor?.name || 'Team Editor',
      amount: payment.amount,
      date: payment.date || payment.paymentDate || new Date().toISOString().split('T')[0],
      paymentType: payment.paymentType,
      paymentMethod: payment.paymentMethod,
      referenceNumber: payment.referenceNumber || '',
      projectName: project?.name || 'All Assigned Deliverables',
      totalAmount,
      totalPaid,
      remainingAmount: remaining,
      paymentStatus: status,
      notes: payment.notes,
      businessName: settings.businessName,
      tagline: settings.tagline,
      authorizedSignatory: 'Vidzyra Accounts Lead',
    };
    setSelectedReceipt(receipt);
  };

  // Action handlers
  const handleViewPayment = (id: string, category: 'Client' | 'Editor') => {
    setDetailModalState({
      isOpen: true,
      paymentId: id,
      category,
    });
  };

  const handleEditPayment = (payment: ClientPayment | EditorPayment, category: 'Client' | 'Editor') => {
    setFormModalState({
      isOpen: true,
      category,
      paymentToEdit: payment,
    });
  };

  const handleOpenAddClient = () => {
    setFormModalState({
      isOpen: true,
      category: 'Client',
      paymentToEdit: null,
    });
  };

  const handleOpenAddEditor = () => {
    setFormModalState({
      isOpen: true,
      category: 'Editor',
      paymentToEdit: null,
    });
  };

  return (
    <div className="space-y-6 p-6 lg:p-8 max-w-7xl mx-auto">
      {/* 1. Page Header with Working Add Payment Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Payments &amp; Financial Ledger</h1>
            <span className="text-[11px] font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200">
              Live Real-Time
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            Monitor client billings, incoming receipts, editor payouts, audit trail &amp; export official slips.
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => exportPaymentsToCsv(clientPayments, editorPayments, clients, editors)}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-2xs transition"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            Export CSV
          </button>

          <button
            id="btn-add-client-payment"
            onClick={handleOpenAddClient}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            Add Client Payment
          </button>

          <button
            id="btn-add-editor-payment"
            onClick={handleOpenAddEditor}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            Add Editor Payment
          </button>
        </div>
      </div>

      {/* 2. Top Summary Cards (All 7 Metrics Required) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        {/* Card 1: Total Client Billing */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              1. Total Client Billing
            </span>
            <Building className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="mt-2">
            <div className="text-lg font-bold text-slate-900 tracking-tight">
              ₹{financialMetrics.totalClientBilling.toLocaleString('en-IN')}
            </div>
            <span className="text-[10px] text-slate-500 block mt-0.5 truncate">
              Invoiced client work
            </span>
          </div>
        </div>

        {/* Card 2: Total Client Payments Received */}
        <div className="bg-white p-3.5 rounded-xl border border-emerald-200 shadow-2xs bg-emerald-50/20 flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-700">
            <span className="text-[10px] font-bold uppercase tracking-wider">
              2. Client Payments Received
            </span>
            <ArrowDownRight className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="mt-2">
            <div className="text-lg font-bold text-emerald-700 tracking-tight">
              ₹{financialMetrics.totalClientPaid.toLocaleString('en-IN')}
            </div>
            <span className="text-[10px] text-emerald-600 block mt-0.5 truncate">
              {clientPayments.length} receipts collected
            </span>
          </div>
        </div>

        {/* Card 3: Client Pending Payments */}
        <div className="bg-white p-3.5 rounded-xl border border-amber-200 shadow-2xs bg-amber-50/20 flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-700">
            <span className="text-[10px] font-bold uppercase tracking-wider">
              3. Client Pending Payments
            </span>
            <Clock className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="mt-2">
            <div className="text-lg font-bold text-amber-700 tracking-tight">
              ₹{financialMetrics.clientPendingPayments.toLocaleString('en-IN')}
            </div>
            <span className="text-[10px] text-amber-600 block mt-0.5 truncate">
              Due receivables
            </span>
          </div>
        </div>

        {/* Card 4: Total Editor Cost */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              4. Total Editor Cost
            </span>
            <User className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="mt-2">
            <div className="text-lg font-bold text-slate-900 tracking-tight">
              ₹{financialMetrics.totalEditorCost.toLocaleString('en-IN')}
            </div>
            <span className="text-[10px] text-slate-500 block mt-0.5 truncate">
              Assigned project liability
            </span>
          </div>
        </div>

        {/* Card 5: Total Editor Payments Paid */}
        <div className="bg-white p-3.5 rounded-xl border border-purple-200 shadow-2xs bg-purple-50/20 flex flex-col justify-between">
          <div className="flex items-center justify-between text-purple-700">
            <span className="text-[10px] font-bold uppercase tracking-wider">
              5. Editor Payments Paid
            </span>
            <ArrowUpRight className="w-3.5 h-3.5 text-purple-600" />
          </div>
          <div className="mt-2">
            <div className="text-lg font-bold text-purple-700 tracking-tight">
              ₹{financialMetrics.totalEditorPaid.toLocaleString('en-IN')}
            </div>
            <span className="text-[10px] text-purple-600 block mt-0.5 truncate">
              {editorPayments.length} payouts completed
            </span>
          </div>
        </div>

        {/* Card 6: Editor Pending Payments */}
        <div className="bg-white p-3.5 rounded-xl border border-orange-200 shadow-2xs bg-orange-50/20 flex flex-col justify-between">
          <div className="flex items-center justify-between text-orange-700">
            <span className="text-[10px] font-bold uppercase tracking-wider">
              6. Editor Pending Payments
            </span>
            <AlertCircle className="w-3.5 h-3.5 text-orange-600" />
          </div>
          <div className="mt-2">
            <div className="text-lg font-bold text-orange-700 tracking-tight">
              ₹{financialMetrics.editorPendingPayments.toLocaleString('en-IN')}
            </div>
            <span className="text-[10px] text-orange-600 block mt-0.5 truncate">
              Outstanding to editors
            </span>
          </div>
        </div>

        {/* Card 7: Total Profit */}
        <div className="bg-white p-3.5 rounded-xl border border-indigo-200 shadow-2xs bg-indigo-50/20 flex flex-col justify-between col-span-2 sm:col-span-3 lg:col-span-1">
          <div className="flex items-center justify-between text-indigo-700">
            <span className="text-[10px] font-bold uppercase tracking-wider">
              7. Total Profit
            </span>
            <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
          </div>
          <div className="mt-2">
            <div className="text-lg font-bold text-indigo-900 tracking-tight">
              ₹{financialMetrics.netProfit.toLocaleString('en-IN')}
            </div>
            <span className="text-[10px] text-indigo-600 block mt-0.5 truncate font-semibold">
              Cash: ₹{financialMetrics.realizedProfit.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Section Tabs & Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Main Payment Section Tabs */}
          <div className="flex items-center space-x-1 p-1 bg-slate-100 rounded-xl text-xs font-semibold w-full md:w-auto">
            <button
              id="tab-client-payments"
              onClick={() => setActiveTab('clients')}
              className={`px-4 py-2 rounded-lg transition flex items-center gap-1.5 ${
                activeTab === 'clients'
                  ? 'bg-white text-emerald-800 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowDownRight className="w-3.5 h-3.5 text-emerald-600" />
              CLIENT PAYMENTS ({clientPayments.length})
            </button>

            <button
              id="tab-editor-payments"
              onClick={() => setActiveTab('editors')}
              className={`px-4 py-2 rounded-lg transition flex items-center gap-1.5 ${
                activeTab === 'editors'
                  ? 'bg-white text-purple-800 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5 text-purple-600" />
              EDITOR PAYMENTS ({editorPayments.length})
            </button>

            <button
              id="tab-agency-expenses"
              onClick={() => setActiveTab('expenses')}
              className={`px-3.5 py-2 rounded-lg transition flex items-center gap-1.5 ${
                activeTab === 'expenses'
                  ? 'bg-white text-rose-800 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5 text-rose-600" />
              AGENCY EXPENSES ({expenses.length})
            </button>
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search receipt #, name, project, UTR..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>

        {/* Filters Row (Client, Editor, Type, Status, Method, Date Range) */}
        {activeTab !== 'expenses' && (
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-400 font-semibold flex items-center gap-1 text-[11px] mr-1">
              <Filter className="w-3 h-3" /> Filters:
            </span>

            {/* Entity Filter (Client or Editor) */}
            {activeTab === 'clients' ? (
              <select
                value={filterClientId}
                onChange={(e) => setFilterClientId(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-xs font-medium"
              >
                <option value="">All Clients</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            ) : (
              <select
                value={filterEditorId}
                onChange={(e) => setFilterEditorId(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-xs font-medium"
              >
                <option value="">All Editors</option>
                {editors.map((ed) => (
                  <option key={ed.id} value={ed.id}>
                    {ed.name}
                  </option>
                ))}
              </select>
            )}

            {/* Payment Type Filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-xs font-medium"
            >
              <option value="All">All Types</option>
              <option value="Advance">Advance</option>
              <option value="Partial">Partial</option>
              <option value="Final">Final</option>
            </select>

            {/* Payment Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-xs font-medium"
            >
              <option value="All">All Statuses</option>
              <option value="Paid">Paid</option>
              <option value="Partial">Partial</option>
              <option value="Pending">Pending</option>
            </select>

            {/* Payment Method Filter */}
            <select
              value={filterMethod}
              onChange={(e) => setFilterMethod(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-xs font-medium"
            >
              <option value="All">All Methods</option>
              <option value="UPI">UPI</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Cash">Cash</option>
              <option value="Credit/Debit Card">Card</option>
              <option value="PayPal">PayPal</option>
              <option value="Cheque">Cheque</option>
              <option value="Other">Other</option>
            </select>

            {/* Date Range Filter */}
            <select
              value={filterDateRange}
              onChange={(e) => setFilterDateRange(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-xs font-medium"
            >
              <option value="All">All Dates</option>
              <option value="Today">Today</option>
              <option value="This Week">This Week</option>
              <option value="This Month">This Month</option>
              <option value="This Year">This Year</option>
            </select>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="flex items-center gap-1 px-2.5 py-1.5 text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs transition"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
            )}
          </div>
        )}
      </div>

      {/* Delete Success Banner */}
      {deleteSuccessMessage && (
        <div
          id="payment-delete-success-banner"
          className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs font-semibold text-emerald-800 shadow-xs animate-in fade-in"
        >
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{deleteSuccessMessage}</span>
          </div>
          <button
            onClick={() => setDeleteSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 p-1"
            title="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 4. Tab 1: CLIENT PAYMENTS TABLE */}
      {activeTab === 'clients' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <span className="font-bold text-slate-800 text-xs tracking-tight">
              Client Payment History ({filteredClientRows.length} transactions)
            </span>
            <button
              onClick={handleOpenAddClient}
              className="flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
            >
              <Plus className="w-3.5 h-3.5" />
              New Client Receipt
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Receipt #</th>
                  <th className="px-3 py-3">Payment Date</th>
                  <th className="px-3 py-3">Client Name</th>
                  <th className="px-3 py-3">Work / Project</th>
                  <th className="px-3 py-3 text-right">Amount Paid</th>
                  <th className="px-3 py-3">Payment Type</th>
                  <th className="px-3 py-3">Payment Method</th>
                  <th className="px-3 py-3">Reference / UTR</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredClientRows.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-12 text-center text-slate-400 italic">
                      No client payments matching current filters.
                    </td>
                  </tr>
                ) : (
                  filteredClientRows.map((row) => (
                    <tr
                      key={row.id}
                      className="hover:bg-slate-50/80 transition cursor-pointer"
                      onClick={() => handleViewPayment(row.id, 'Client')}
                    >
                      <td className="px-4 py-3.5 font-mono font-bold text-indigo-600">
                        {row.receiptNumber}
                      </td>
                      <td className="px-3 py-3.5 text-slate-600 whitespace-nowrap">
                        {row.dateFormatted}
                      </td>
                      <td className="px-3 py-3.5 font-bold text-slate-900 whitespace-nowrap">
                        {row.clientName}
                      </td>
                      <td className="px-3 py-3.5 text-slate-600 truncate max-w-xs">
                        {row.projectName}
                      </td>
                      <td className="px-3 py-3.5 text-right font-bold text-emerald-600 whitespace-nowrap">
                        ₹{row.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="px-3 py-3.5 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {row.paymentType}
                        </span>
                      </td>
                      <td className="px-3 py-3.5 whitespace-nowrap text-slate-600">
                        {row.paymentMethod}
                      </td>
                      <td className="px-3 py-3.5 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                        {row.referenceNumber || '—'}
                      </td>
                      <td className="px-3 py-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            row.status === 'Paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : row.status === 'Partial'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {row.status === 'Paid' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                          {row.status === 'Partial' && <Clock className="w-3 h-3 text-amber-600" />}
                          {row.status === 'Pending' && <AlertCircle className="w-3 h-3 text-rose-600" />}
                          {row.status}
                        </span>
                      </td>
                      <td
                        className="px-4 py-3.5 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="inline-flex items-center gap-1">
                          <button
                            id={`view-client-payment-${row.id}`}
                            title="View Payment Details"
                            onClick={() => handleViewPayment(row.id, 'Client')}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-md hover:bg-slate-100 transition"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            id={`delete-client-payment-${row.id}`}
                            title="Delete Payment"
                            onClick={() =>
                              setPaymentToDelete({
                                id: row.id,
                                category: 'Client',
                                receiptNumber: row.receiptNumber,
                                amount: row.amount,
                              })
                            }
                            className="p-1.5 text-slate-500 hover:text-rose-600 rounded-md hover:bg-rose-50 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-500 hover:text-rose-600" />
                          </button>
                          <button
                            id={`edit-client-payment-${row.id}`}
                            title="Edit Payment"
                            onClick={() => handleEditPayment(row, 'Client')}
                            className="p-1.5 text-slate-500 hover:text-amber-600 rounded-md hover:bg-slate-100 transition"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            id={`slip-client-payment-${row.id}`}
                            title="Download Payment Slip (JPG)"
                            onClick={() => handleOpenClientReceipt(row)}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-indigo-700 rounded-md font-semibold text-[11px] shadow-2xs transition ml-1"
                          >
                            <Download className="w-3 h-3" />
                            Receipt Slip
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Tab 2: EDITOR PAYMENTS TABLE */}
      {activeTab === 'editors' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <span className="font-bold text-slate-800 text-xs tracking-tight">
              Editor Disbursement Ledger ({filteredEditorRows.length} payouts)
            </span>
            <button
              onClick={handleOpenAddEditor}
              className="flex items-center gap-1 text-xs font-semibold text-purple-700 hover:text-purple-800 hover:underline"
            >
              <Plus className="w-3.5 h-3.5" />
              New Editor Payout
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Receipt #</th>
                  <th className="px-3 py-3">Payment Date</th>
                  <th className="px-3 py-3">Editor Name</th>
                  <th className="px-3 py-3">Work / Project</th>
                  <th className="px-3 py-3 text-right">Amount Paid</th>
                  <th className="px-3 py-3">Payment Type</th>
                  <th className="px-3 py-3">Payment Method</th>
                  <th className="px-3 py-3">Reference / UTR</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredEditorRows.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-12 text-center text-slate-400 italic">
                      No editor disbursements matching current filters.
                    </td>
                  </tr>
                ) : (
                  filteredEditorRows.map((row) => (
                    <tr
                      key={row.id}
                      className="hover:bg-slate-50/80 transition cursor-pointer"
                      onClick={() => handleViewPayment(row.id, 'Editor')}
                    >
                      <td className="px-4 py-3.5 font-mono font-bold text-purple-600">
                        {row.receiptNumber}
                      </td>
                      <td className="px-3 py-3.5 text-slate-600 whitespace-nowrap">
                        {row.dateFormatted}
                      </td>
                      <td className="px-3 py-3.5 font-bold text-slate-900 whitespace-nowrap">
                        {row.editorName}
                      </td>
                      <td className="px-3 py-3.5 text-slate-600 truncate max-w-xs">
                        {row.projectName}
                      </td>
                      <td className="px-3 py-3.5 text-right font-bold text-purple-700 whitespace-nowrap">
                        ₹{row.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="px-3 py-3.5 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                          {row.paymentType}
                        </span>
                      </td>
                      <td className="px-3 py-3.5 whitespace-nowrap text-slate-600">
                        {row.paymentMethod}
                      </td>
                      <td className="px-3 py-3.5 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                        {row.referenceNumber || '—'}
                      </td>
                      <td className="px-3 py-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            row.status === 'Paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : row.status === 'Partial'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {row.status === 'Paid' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                          {row.status === 'Partial' && <Clock className="w-3 h-3 text-amber-600" />}
                          {row.status === 'Pending' && <AlertCircle className="w-3 h-3 text-rose-600" />}
                          {row.status}
                        </span>
                      </td>
                      <td
                        className="px-4 py-3.5 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="inline-flex items-center gap-1">
                          <button
                            id={`view-editor-payment-${row.id}`}
                            title="View Payment Details"
                            onClick={() => handleViewPayment(row.id, 'Editor')}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-md hover:bg-slate-100 transition"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            id={`delete-editor-payment-${row.id}`}
                            title="Delete Payment"
                            onClick={() =>
                              setPaymentToDelete({
                                id: row.id,
                                category: 'Editor',
                                receiptNumber: row.receiptNumber,
                                amount: row.amount,
                              })
                            }
                            className="p-1.5 text-slate-500 hover:text-rose-600 rounded-md hover:bg-rose-50 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-500 hover:text-rose-600" />
                          </button>
                          <button
                            id={`edit-editor-payment-${row.id}`}
                            title="Edit Payment"
                            onClick={() => handleEditPayment(row, 'Editor')}
                            className="p-1.5 text-slate-500 hover:text-amber-600 rounded-md hover:bg-slate-100 transition"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            id={`slip-editor-payment-${row.id}`}
                            title="Download Payment Slip (JPG)"
                            onClick={() => handleOpenEditorReceipt(row)}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-purple-700 rounded-md font-semibold text-[11px] shadow-2xs transition ml-1"
                          >
                            <Download className="w-3 h-3" />
                            Receipt Slip
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. Tab 3: AGENCY EXPENSES TABLE (Preserved feature) */}
      {activeTab === 'expenses' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              Agency Software, Hardware, Assets &amp; Operational Overhead
            </span>
            <button
              onClick={() => exportExpensesToCsv(expenses)}
              className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-2xs transition"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              Export Expenses CSV
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Expense Item</th>
                    <th className="px-3 py-3">Date</th>
                    <th className="px-3 py-3">Category</th>
                    <th className="px-3 py-3">Method</th>
                    <th className="px-3 py-3 text-right">Amount</th>
                    <th className="px-4 py-3">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-slate-400 italic">
                        No expenses logged.
                      </td>
                    </tr>
                  ) : (
                    filteredExpenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-slate-50/80 transition">
                        <td className="px-4 py-3.5 font-bold text-slate-900">{exp.title}</td>
                        <td className="px-3 py-3.5 text-slate-600 whitespace-nowrap">{exp.date}</td>
                        <td className="px-3 py-3.5 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            {exp.category}
                          </span>
                        </td>
                        <td className="px-3 py-3.5 text-slate-600">{exp.paymentMethod}</td>
                        <td className="px-3 py-3.5 text-right font-bold text-rose-700 whitespace-nowrap">
                          ₹{exp.amount.toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-3.5 text-slate-500 italic max-w-xs truncate">
                          {exp.notes || '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 7. Dedicated Modals: Form Modal, Detail Modal, Receipt Modal */}
      {/* Payment Form Modal (Create & Edit) */}
      <PaymentFormModal
        isOpen={formModalState.isOpen}
        onClose={() => setFormModalState((prev) => ({ ...prev, isOpen: false, paymentToEdit: null }))}
        defaultRecipientType={formModalState.category}
        paymentToEdit={formModalState.paymentToEdit}
        editCategory={formModalState.category === 'Expense' ? null : formModalState.category}
        onPaymentSaved={(savedPayment, category) => {
          if (category === 'Client') {
            handleOpenClientReceipt(savedPayment as ClientPayment);
          } else if (category === 'Editor') {
            handleOpenEditorReceipt(savedPayment as EditorPayment);
          }
        }}
      />

      {/* Payment Detail Modal */}
      <PaymentDetailModal
        isOpen={detailModalState.isOpen}
        onClose={() => setDetailModalState((prev) => ({ ...prev, isOpen: false, paymentId: null }))}
        paymentId={detailModalState.paymentId}
        paymentCategory={detailModalState.category}
        onEditPayment={(pay, cat) => {
          setDetailModalState((prev) => ({ ...prev, isOpen: false }));
          handleEditPayment(pay, cat);
        }}
        onOpenReceipt={(pay, cat) => {
          if (cat === 'Client') {
            handleOpenClientReceipt(pay as ClientPayment);
          } else {
            handleOpenEditorReceipt(pay as EditorPayment);
          }
        }}
        onDeletePayment={(pay, cat) => {
          setPaymentToDelete({
            id: pay.id,
            category: cat,
            receiptNumber: pay.receiptNumber,
            amount: pay.amount,
          });
        }}
      />

      {/* Official Payment Receipt Modal (Preview & JPG Download) */}
      <PaymentReceiptModal
        isOpen={!!selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
        receiptData={selectedReceipt}
      />

      {/* Delete Payment Confirmation Modal */}
      {paymentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div
            id="delete-payment-modal"
            className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Payment?</h3>
                <p className="text-xs text-slate-500">
                  {paymentToDelete.category} Payment • ₹{paymentToDelete.amount.toLocaleString('en-IN')}
                  {paymentToDelete.receiptNumber ? ` • ${paymentToDelete.receiptNumber}` : ''}
                </p>
              </div>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed">
              Are you sure you want to delete this payment? This action cannot be undone.
            </p>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                id="cancel-delete-payment-btn"
                type="button"
                onClick={() => setPaymentToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                id="confirm-delete-payment-btn"
                type="button"
                onClick={handleConfirmDeletePayment}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition shadow-xs"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
