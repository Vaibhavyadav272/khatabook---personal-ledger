import React, { useState, useMemo } from 'react';
import { Expense, ExpenseCategory, PaymentMethod } from '../../types';
import { useData } from '../../context/DataContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { EXPENSE_CATEGORIES, PAYMENT_METHODS } from '../../data/initialData';
import {
  Receipt,
  Plus,
  Split,
  Search,
  Filter,
  Calendar,
  CreditCard,
  Tag,
  Edit2,
  Trash2,
  X,
  TrendingUp,
  Wallet,
  ShoppingBag,
} from 'lucide-react';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { EmptyState } from '../common/EmptyState';

interface ExpensesViewProps {
  onOpenAddExpense: () => void;
  onOpenSplitExpense: () => void;
  onEditExpense: (expense: Expense) => void;
  onSelectPerson: (personId: string) => void;
}

export const ExpensesView: React.FC<ExpensesViewProps> = ({
  onOpenAddExpense,
  onOpenSplitExpense,
  onEditExpense,
  onSelectPerson,
}) => {
  const { expenses, people, deleteExpense, preferences } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);

  const filteredExpenses = useMemo(() => {
    return expenses
      .filter((exp) => {
        const q = searchQuery.toLowerCase().trim();
        const matchesSearch =
          !q ||
          exp.description.toLowerCase().includes(q) ||
          (exp.notes && exp.notes.toLowerCase().includes(q)) ||
          exp.category.toLowerCase().includes(q);

        const matchesCategory = categoryFilter === 'all' || exp.category === categoryFilter;
        const matchesPayment = paymentMethodFilter === 'all' || exp.paymentMethod === paymentMethodFilter;

        let matchesDate = true;
        if (startDate && exp.expenseDate < startDate) matchesDate = false;
        if (endDate && exp.expenseDate > endDate) matchesDate = false;

        return matchesSearch && matchesCategory && matchesPayment && matchesDate;
      })
      .sort((a, b) => new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime());
  }, [expenses, searchQuery, categoryFilter, paymentMethodFilter, startDate, endDate]);

  const now = new Date();
  const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const todayStr = now.toISOString().split('T')[0];

  const thisMonthTotal = useMemo(() => {
    return expenses
      .filter((e) => e.expenseDate.startsWith(currentYearMonth))
      .reduce((acc, e) => acc + Number(e.amount), 0);
  }, [expenses, currentYearMonth]);

  const todayTotal = useMemo(() => {
    return expenses
      .filter((e) => e.expenseDate === todayStr)
      .reduce((acc, e) => acc + Number(e.amount), 0);
  }, [expenses, todayStr]);

  const totalFilteredAmount = useMemo(() => {
    return filteredExpenses.reduce((acc, e) => acc + Number(e.amount), 0);
  }, [filteredExpenses]);

  const topCategory = useMemo(() => {
    const counts: Record<string, number> = {};
    expenses.forEach((e) => {
      counts[e.category] = (counts[e.category] || 0) + Number(e.amount);
    });
    let top = 'None';
    let max = 0;
    Object.entries(counts).forEach(([cat, val]) => {
      if (val > max) {
        max = val;
        top = cat;
      }
    });
    return { name: top, amount: max };
  }, [expenses]);

  const clearFilters = () => {
    setSearchQuery('');
    setCategoryFilter('all');
    setPaymentMethodFilter('all');
    setStartDate('');
    setEndDate('');
  };

  const hasActiveFilters =
    searchQuery ||
    categoryFilter !== 'all' ||
    paymentMethodFilter !== 'all' ||
    startDate ||
    endDate;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Expense Tracker
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Log your daily expenses, food, bills, travel and split shared costs.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onOpenSplitExpense}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 rounded-xl font-semibold text-xs sm:text-sm transition-colors border border-indigo-200 dark:border-indigo-800"
          >
            <Split className="w-4 h-4" />
            <span>Split Group Bill</span>
          </button>

          <button
            type="button"
            onClick={onOpenAddExpense}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 active:scale-98 text-white rounded-xl font-medium text-xs sm:text-sm transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-zinc-200/80 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider">
            <span>This Month</span>
            <Calendar className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-2">
            {formatCurrency(thisMonthTotal, preferences.currency)}
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Today's spending: {formatCurrency(todayTotal, preferences.currency)}
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-zinc-200/80 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider">
            <span>Top Category</span>
            <Tag className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-2 truncate">
            {topCategory.name}
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            {topCategory.amount > 0 ? formatCurrency(topCategory.amount, preferences.currency) : 'No expenses'}
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-zinc-200/80 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider">
            <span>Total Recorded</span>
            <Receipt className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-2">
            {formatCurrency(totalFilteredAmount, preferences.currency)}
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Across {filteredExpenses.length} entries shown
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search expenses, notes or items..."
              className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Category Dropdown */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-800 dark:text-zinc-200 focus:outline-hidden"
            >
              <option value="all">All Categories</option>
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {/* Payment Method Dropdown */}
            <select
              value={paymentMethodFilter}
              onChange={(e) => setPaymentMethodFilter(e.target.value)}
              className="px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-800 dark:text-zinc-200 focus:outline-hidden"
            >
              <option value="all">All Payment Methods</option>
              {PAYMENT_METHODS.map((pm) => (
                <option key={pm} value={pm}>
                  {pm}
                </option>
              ))}
            </select>

            {/* Date Range */}
            <div className="flex items-center gap-1.5 bg-zinc-50 dark:bg-zinc-800 px-2 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700">
              <Calendar className="w-3.5 h-3.5 text-zinc-400" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent text-xs text-zinc-800 dark:text-zinc-200 focus:outline-hidden"
              />
              <span className="text-zinc-400">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent text-xs text-zinc-800 dark:text-zinc-200 focus:outline-hidden"
              />
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors font-medium"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Expenses Table/List */}
      {expenses.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No expenses logged yet"
          description="Start tracking your daily out-of-pocket spending, bills, groceries and shopping."
          actionLabel="Add First Expense"
          onAction={onOpenAddExpense}
        />
      ) : filteredExpenses.length === 0 ? (
        <div className="p-12 text-center text-zinc-500 dark:text-zinc-400 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
          <p className="font-medium">No expenses match your search filters.</p>
          <button
            type="button"
            onClick={clearFilters}
            className="mt-3 text-xs text-amber-600 hover:underline"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs divide-y divide-zinc-100 dark:divide-zinc-800/80 overflow-hidden">
          {filteredExpenses.map((exp) => {
            const person = exp.personId ? people.find((p) => p.id === exp.personId) : null;

            return (
              <div
                key={exp.id}
                className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-sm shrink-0">
                    <Receipt className="w-5 h-5" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-zinc-900 dark:text-zinc-100 text-sm sm:text-base">
                        {exp.description}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                        {exp.category}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[11px] bg-zinc-50 dark:bg-zinc-800/60 text-zinc-500 border border-zinc-200 dark:border-zinc-700">
                        {exp.paymentMethod}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1">
                      <span>{formatDate(exp.expenseDate, preferences.dateFormat)}</span>
                      {person && (
                        <button
                          type="button"
                          onClick={() => onSelectPerson(person.id)}
                          className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                        >
                          <span>With {person.name}</span>
                        </button>
                      )}
                      {exp.notes && <span>• {exp.notes}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <div className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100">
                      {formatCurrency(exp.amount, preferences.currency)}
                    </div>
                  </div>

                  <div className="opacity-80 sm:opacity-0 sm:group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                    <button
                      type="button"
                      onClick={() => onEditExpense(exp)}
                      className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                      title="Edit expense"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setExpenseToDelete(exp)}
                      className="p-1.5 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                      title="Delete expense"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!expenseToDelete}
        onClose={() => setExpenseToDelete(null)}
        onConfirm={() => {
          if (expenseToDelete) deleteExpense(expenseToDelete.id);
        }}
        title="Delete Expense Entry?"
        message={`Are you sure you want to delete this ${
          expenseToDelete ? formatCurrency(expenseToDelete.amount, preferences.currency) : ''
        } expense?`}
        confirmLabel="Delete Expense"
        isDestructive
      />
    </div>
  );
};
