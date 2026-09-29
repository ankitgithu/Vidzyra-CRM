import React, { useState, useMemo } from 'react';
import {
  Wallet,
  Plus,
  Search,
  Filter,
  Calendar,
  CreditCard,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  X,
  TrendingDown,
  Layers,
  ArrowUpDown,
  Tag,
  Receipt,
  PieChart,
  CalendarDays,
  FileText,
  RotateCcw,
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import {
  PersonalExpense,
  PersonalExpenseCategory,
  PersonalExpensePaymentMode,
} from '../../types';
import { formatINR } from '../../utils/currencyUtils';

const CATEGORIES: PersonalExpenseCategory[] = [
  'Food',
  'Travel',
  'Shopping',
  'Home',
  'Bills',
  'Work/Business',
  'Entertainment',
  'Health',
  'Recharge',
  'Other',
];

const PAYMENT_MODES: PersonalExpensePaymentMode[] = [
  'Cash',
  'UPI',
  'Card',
  'Bank',
  'Other',
];

const CATEGORY_COLORS: Record<PersonalExpenseCategory, { bg: string; text: string; border: string }> = {
  Food: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  Travel: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  Shopping: { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200' },
  Home: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  Bills: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  'Work/Business': { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  Entertainment: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  Health: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
  Recharge: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  Other: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' },
};

type QuickTimeFilter = 'all' | 'today' | 'this-week' | 'this-month' | 'last-month' | 'custom';

export const PersonalExpenseView: React.FC = () => {
  const {
    personalExpenses,
    addPersonalExpense,
    updatePersonalExpense,
    deletePersonalExpense,
  } = useCrm();

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [timeFilter, setTimeFilter] = useState<QuickTimeFilter>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPaymentMode, setSelectedPaymentMode] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<PersonalExpense | null>(null);
  const [deleteConfirmExpense, setDeleteConfirmExpense] = useState<PersonalExpense | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form inputs
  const todayIso = new Date().toISOString().split('T')[0];
  const [formName, setFormName] = useState('');
  const [formAmount, setFormAmount] = useState<number | ''>('');
  const [formCategory, setFormCategory] = useState<PersonalExpenseCategory>('Food');
  const [formDate, setFormDate] = useState(todayIso);
  const [formPaymentMode, setFormPaymentMode] = useState<PersonalExpensePaymentMode>('UPI');
  const [formNote, setFormNote] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2800);
  };

  // Open Form for Add
  const handleOpenAdd = () => {
    setEditingExpense(null);
    setFormName('');
    setFormAmount('');
    setFormCategory('Food');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormPaymentMode('UPI');
    setFormNote('');
    setFormError(null);
    setIsFormOpen(true);
  };

  // Open Form for Edit
  const handleOpenEdit = (expense: PersonalExpense) => {
    setEditingExpense(expense);
    setFormName(expense.name);
    setFormAmount(expense.amount);
    setFormCategory(expense.category);
    setFormDate(expense.date || todayIso);
    setFormPaymentMode(expense.paymentMode || 'UPI');
    setFormNote(expense.note || '');
    setFormError(null);
    setIsFormOpen(true);
  };

  // Save (Add or Update)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('Please enter an expense name or description.');
      return;
    }
    const numAmount = Number(formAmount);
    if (!formAmount || isNaN(numAmount) || numAmount <= 0) {
      setFormError('Please enter a valid amount greater than ₹0.');
      return;
    }
    if (!formDate) {
      setFormError('Please select a date.');
      return;
    }

    try {
      if (editingExpense) {
        await updatePersonalExpense(editingExpense.id, {
          name: formName.trim(),
          amount: numAmount,
          category: formCategory,
          date: formDate,
          paymentMode: formPaymentMode,
          note: formNote.trim() || undefined,
        });
        showToast('Expense updated successfully.');
      } else {
        await addPersonalExpense({
          name: formName.trim(),
          amount: numAmount,
          category: formCategory,
          date: formDate,
          paymentMode: formPaymentMode,
          note: formNote.trim() || undefined,
        });
        showToast('Expense added successfully.');
      }
      setIsFormOpen(false);
    } catch (err) {
      setFormError('Failed to save expense. Please try again.');
    }
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deleteConfirmExpense) return;
    try {
      await deletePersonalExpense(deleteConfirmExpense.id);
      showToast('Expense deleted successfully.');
      setDeleteConfirmExpense(null);
    } catch {
      showToast('Failed to delete expense.');
    }
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSearch('');
    setTimeFilter('all');
    setCustomStartDate('');
    setCustomEndDate('');
    setSelectedMonth('all');
    setSelectedCategory('all');
    setSelectedPaymentMode('all');
  };

  // Generate Month list for Month-wise Filter & Monthly Summary
  const availableMonths = useMemo(() => {
    const monthSet = new Set<string>();
    personalExpenses.forEach((exp) => {
      if (exp.date && exp.date.length >= 7) {
        monthSet.add(exp.date.slice(0, 7)); // YYYY-MM
      }
    });
    // Ensure current month is included
    const currentMonth = todayIso.slice(0, 7);
    monthSet.add(currentMonth);

    return Array.from(monthSet).sort((a, b) => b.localeCompare(a));
  }, [personalExpenses, todayIso]);

  // Format YYYY-MM into "Month Year" (e.g. "March 2026")
  const formatMonthYear = (ym: string) => {
    try {
      const [year, month] = ym.split('-').map(Number);
      const d = new Date(year, month - 1, 1);
      return d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    } catch {
      return ym;
    }
  };

  // Date range calculation helpers
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonthIdx = today.getMonth();

  // Start of this week (Monday)
  const dayOfWeek = today.getDay();
  const diffToMonday = today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1);
  const thisWeekStart = new Date(today.setDate(diffToMonday)).toISOString().split('T')[0];
  // reset today
  const todayDateObj = new Date();
  const thisMonthPrefix = todayDateObj.toISOString().slice(0, 7);

  // Last month prefix
  const lastMonthDate = new Date(currentYear, currentMonthIdx - 1, 1);
  const lastMonthPrefix = lastMonthDate.toISOString().slice(0, 7);

  // Filter and Sort Expenses
  const filteredExpenses = useMemo(() => {
    return personalExpenses.filter((item) => {
      const itemDate = item.date || '';

      // 1. Search filter
      if (search.trim()) {
        const q = search.toLowerCase();
        const matches =
          item.name.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          (item.paymentMode && item.paymentMode.toLowerCase().includes(q)) ||
          (item.note && item.note.toLowerCase().includes(q));
        if (!matches) return false;
      }

      // 2. Quick Time Filter
      if (timeFilter === 'today') {
        if (itemDate !== todayIso) return false;
      } else if (timeFilter === 'this-week') {
        if (itemDate < thisWeekStart || itemDate > todayIso) return false;
      } else if (timeFilter === 'this-month') {
        if (!itemDate.startsWith(thisMonthPrefix)) return false;
      } else if (timeFilter === 'last-month') {
        if (!itemDate.startsWith(lastMonthPrefix)) return false;
      } else if (timeFilter === 'custom') {
        if (customStartDate && itemDate < customStartDate) return false;
        if (customEndDate && itemDate > customEndDate) return false;
      }

      // 3. Month-wise Filter
      if (selectedMonth !== 'all') {
        if (!itemDate.startsWith(selectedMonth)) return false;
      }

      // 4. Category-wise Filter
      if (selectedCategory !== 'all') {
        if (item.category !== selectedCategory) return false;
      }

      // 5. Payment Mode-wise Filter
      if (selectedPaymentMode !== 'all') {
        if (item.paymentMode !== selectedPaymentMode) return false;
      }

      return true;
    }).sort((a, b) => {
      const dateA = a.date || a.createdAt;
      const dateB = b.date || b.createdAt;
      return sortOrder === 'desc' ? dateB.localeCompare(dateA) : dateA.localeCompare(dateB);
    });
  }, [
    personalExpenses,
    search,
    timeFilter,
    customStartDate,
    customEndDate,
    selectedMonth,
    selectedCategory,
    selectedPaymentMode,
    sortOrder,
    todayIso,
    thisWeekStart,
    thisMonthPrefix,
    lastMonthPrefix,
  ]);

  // Aggregate Metrics for currently filtered expenses
  const totalFilteredAmount = useMemo(() => {
    return filteredExpenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }, [filteredExpenses]);

  const numberOfFilteredExpenses = filteredExpenses.length;
  const averageFilteredExpense =
    numberOfFilteredExpenses > 0 ? Math.round(totalFilteredAmount / numberOfFilteredExpenses) : 0;

  // Monthly Summary (All personal expenses grouped month-wise)
  const monthlySummary = useMemo(() => {
    const summaryMap: Record<string, { total: number; count: number }> = {};
    personalExpenses.forEach((exp) => {
      const ym = exp.date ? exp.date.slice(0, 7) : 'Unknown';
      if (!summaryMap[ym]) {
        summaryMap[ym] = { total: 0, count: 0 };
      }
      summaryMap[ym].total += Number(exp.amount) || 0;
      summaryMap[ym].count += 1;
    });

    return Object.entries(summaryMap)
      .map(([ym, data]) => ({
        monthKey: ym,
        monthLabel: formatMonthYear(ym),
        total: data.total,
        count: data.count,
      }))
      .sort((a, b) => b.monthKey.localeCompare(a.monthKey));
  }, [personalExpenses]);

  // Category Summary (Category breakdown for the filtered period)
  const categorySummary = useMemo(() => {
    const catMap: Record<string, number> = {};
    filteredExpenses.forEach((exp) => {
      catMap[exp.category] = (catMap[exp.category] || 0) + (Number(exp.amount) || 0);
    });

    return Object.entries(catMap)
      .map(([cat, total]) => ({
        category: cat as PersonalExpenseCategory,
        total,
        percentage: totalFilteredAmount > 0 ? Math.round((total / totalFilteredAmount) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [filteredExpenses, totalFilteredAmount]);

  const hasActiveFilters =
    search !== '' ||
    timeFilter !== 'all' ||
    selectedMonth !== 'all' ||
    selectedCategory !== 'all' ||
    selectedPaymentMode !== 'all';

  return (
    <div className="space-y-6 p-6 lg:p-8 max-w-7xl mx-auto relative animate-in fade-in duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-60 bg-emerald-700 text-white text-xs font-semibold py-2.5 px-4 rounded-xl shadow-lg flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            {toastMessage}
          </span>
          <button onClick={() => setToastMessage(null)} className="text-white/80 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Personal Expense</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Track personal budgets, daily spends, payment modes &amp; monthly summaries.
              </p>
            </div>
          </div>
        </div>

        <button
          id="btn-add-personal-expense"
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Expense
        </button>
      </div>

      {/* Top Total & Aggregates Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Expenses */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Total Expenses
            </span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mt-2 tracking-tight">
            {formatINR(totalFilteredAmount)}
          </h2>
          <p className="text-[11px] text-slate-500 mt-1">
            {hasActiveFilters ? 'For currently filtered period' : 'Overall lifetime personal expenses'}
          </p>
        </div>

        {/* Number of Expenses */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Number of Expenses
            </span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mt-2 tracking-tight">
            {numberOfFilteredExpenses}{' '}
            <span className="text-sm font-semibold text-slate-500">
              {numberOfFilteredExpenses === 1 ? 'record' : 'records'}
            </span>
          </h2>
          <p className="text-[11px] text-slate-500 mt-1">Transactions recorded</p>
        </div>

        {/* Average Expense */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Average Expense
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mt-2 tracking-tight">
            {formatINR(averageFilteredExpense)}
          </h2>
          <p className="text-[11px] text-slate-500 mt-1">Per transaction average</p>
        </div>
      </div>

      {/* Two Summaries: Monthly Summary & Category Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Summary */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-indigo-600" />
              <h3 className="font-bold text-slate-900 text-sm">Monthly Summary</h3>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">Month-wise breakdown</span>
          </div>

          <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
            {monthlySummary.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4 text-center">No expenses recorded yet.</p>
            ) : (
              monthlySummary.map((item) => {
                const isSelected = selectedMonth === item.monthKey;
                return (
                  <div
                    key={item.monthKey}
                    onClick={() => setSelectedMonth(isSelected ? 'all' : item.monthKey)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                      isSelected
                        ? 'bg-indigo-50 border-indigo-300 ring-1 ring-indigo-500/20'
                        : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div>
                      <span className="font-semibold text-slate-800">{item.monthLabel}</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {item.count} {item.count === 1 ? 'expense' : 'expenses'}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-slate-900 block">{formatINR(item.total)}</span>
                      <span className="text-[10px] text-indigo-600 font-semibold hover:underline">
                        {isSelected ? 'Filter Applied ✓' : 'Click to filter'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Category Summary */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
            <div className="flex items-center gap-2">
              <PieChart className="w-4 h-4 text-emerald-600" />
              <h3 className="font-bold text-slate-900 text-sm">Category Summary</h3>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">Selected period</span>
          </div>

          <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
            {categorySummary.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4 text-center">No expenses matching criteria.</p>
            ) : (
              categorySummary.map((item) => {
                const isSelected = selectedCategory === item.category;
                const colors = CATEGORY_COLORS[item.category] || CATEGORY_COLORS.Other;
                return (
                  <div
                    key={item.category}
                    onClick={() => setSelectedCategory(isSelected ? 'all' : item.category)}
                    className={`p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                      isSelected
                        ? 'bg-indigo-50 border-indigo-300 ring-1 ring-indigo-500/20'
                        : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${colors.bg} ${colors.text} border ${colors.border}`}>
                        {item.category}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 font-medium">{item.percentage}%</span>
                        <span className="font-bold text-slate-900">{formatINR(item.total)}</span>
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, item.percentage)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        {/* Row 1: Search & Quick Time Buttons */}
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              id="input-search-personal-expenses"
              placeholder="Search expenses by name, category, payment mode, or note..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Time Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 text-xs shrink-0">
            {(
              [
                { id: 'all', label: 'All Time' },
                { id: 'today', label: 'Today' },
                { id: 'this-week', label: 'This Week' },
                { id: 'this-month', label: 'This Month' },
                { id: 'last-month', label: 'Last Month' },
                { id: 'custom', label: 'Custom' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setTimeFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition whitespace-nowrap cursor-pointer ${
                  timeFilter === tab.id
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Date Pickers (if Custom is active) */}
        {timeFilter === 'custom' && (
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
            <span className="font-semibold text-slate-700">Custom Range:</span>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 text-[11px]">From:</span>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 text-[11px]">To:</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Row 2: Specific Dropdowns (Month-wise, Category-wise, Payment Mode-wise) */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Month-wise filter */}
            <div className="flex items-center gap-1">
              <span className="text-slate-400 text-[11px]">Month:</span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-xs font-medium focus:outline-none"
              >
                <option value="all">All Months</option>
                {availableMonths.map((ym) => (
                  <option key={ym} value={ym}>
                    {formatMonthYear(ym)}
                  </option>
                ))}
              </select>
            </div>

            {/* Category filter */}
            <div className="flex items-center gap-1">
              <span className="text-slate-400 text-[11px]">Category:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-xs font-medium focus:outline-none"
              >
                <option value="all">All Categories</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Payment Mode filter */}
            <div className="flex items-center gap-1">
              <span className="text-slate-400 text-[11px]">Payment Mode:</span>
              <select
                value={selectedPaymentMode}
                onChange={(e) => setSelectedPaymentMode(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-xs font-medium focus:outline-none"
              >
                <option value="all">All Payment Modes</option>
                {PAYMENT_MODES.map((mode) => (
                  <option key={mode} value={mode}>
                    {mode}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Reset Filters & Sort */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-medium text-xs transition"
              title="Toggle Sort Order"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>{sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}</span>
            </button>

            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition"
              >
                <RotateCcw className="w-3 h-3" />
                Reset Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Expense List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Expense Name</th>
                <th className="px-3 py-3">Category</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-3 py-3 text-center">Payment Mode</th>
                <th className="px-4 py-3">Note</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400 italic">
                    No expenses found matching the selected search and filter criteria.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((expense) => {
                  const colors = CATEGORY_COLORS[expense.category] || CATEGORY_COLORS.Other;
                  return (
                    <tr key={expense.id} className="hover:bg-slate-50/80 transition group">
                      {/* Date */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-slate-600 font-medium">
                        {expense.date || '—'}
                      </td>

                      {/* Expense Name */}
                      <td className="px-4 py-3.5 font-bold text-slate-900">
                        {expense.name}
                      </td>

                      {/* Category */}
                      <td className="px-3 py-3.5 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${colors.bg} ${colors.text} ${colors.border}`}
                        >
                          {expense.category}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="px-4 py-3.5 text-right font-bold text-slate-900 whitespace-nowrap">
                        {formatINR(expense.amount)}
                      </td>

                      {/* Payment Mode */}
                      <td className="px-3 py-3.5 text-center whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {expense.paymentMode || 'Cash'}
                        </span>
                      </td>

                      {/* Note */}
                      <td className="px-4 py-3.5 max-w-xs truncate text-slate-500" title={expense.note}>
                        {expense.note || <span className="text-slate-300 italic">—</span>}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right whitespace-nowrap space-x-1">
                        {/* Edit Button */}
                        <button
                          id={`btn-edit-expense-${expense.id}`}
                          onClick={() => handleOpenEdit(expense)}
                          className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition cursor-pointer"
                          title="Edit Expense"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Button */}
                        <button
                          id={`btn-delete-expense-${expense.id}`}
                          onClick={() => setDeleteConfirmExpense(expense)}
                          className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded transition cursor-pointer"
                          title="Delete Expense"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Expense Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 bg-linear-to-r from-slate-50 to-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <Wallet className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingExpense ? 'Edit Personal Expense' : 'Add Personal Expense'}
                </h3>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Expense Name / Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Expense Name / Description <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  id="input-expense-name"
                  required
                  placeholder="e.g. Grocery store, Petrol, Internet Bill"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {/* Amount & Date Grid */}
              <div className="grid grid-cols-2 gap-3">
                {/* Amount */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Amount (₹) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="input-expense-amount"
                    required
                    min="1"
                    step="any"
                    placeholder="e.g. 500"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold"
                  />
                </div>

                {/* Date */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="input-expense-date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              {/* Category & Payment Mode Grid */}
              <div className="grid grid-cols-2 gap-3">
                {/* Category */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="select-expense-category"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as PersonalExpenseCategory)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Payment Mode */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Payment Mode <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="select-expense-payment-mode"
                    value={formPaymentMode}
                    onChange={(e) => setFormPaymentMode(e.target.value as PersonalExpensePaymentMode)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
                  >
                    {PAYMENT_MODES.map((mode) => (
                      <option key={mode} value={mode}>
                        {mode}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Note (optional) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Note <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <textarea
                  id="textarea-expense-note"
                  rows={2}
                  placeholder="Additional context, receipt info or remarks..."
                  value={formNote}
                  onChange={(e) => setFormNote(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="btn-submit-personal-expense"
                  className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-xs cursor-pointer"
                >
                  {editingExpense ? 'Update Expense' : 'Add Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirmExpense && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-100">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Expense?</h3>
                <p className="text-xs text-slate-500 truncate max-w-[200px]">
                  {deleteConfirmExpense.name} ({formatINR(deleteConfirmExpense.amount)})
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-6 font-medium">
              Are you sure you want to delete this expense?
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteConfirmExpense(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                id="btn-confirm-delete-personal-expense"
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition shadow-xs cursor-pointer"
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
