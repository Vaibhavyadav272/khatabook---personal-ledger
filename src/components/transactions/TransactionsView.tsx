import React, { useState, useMemo } from 'react';
import { Transaction } from '../../types';
import { useData } from '../../context/DataContext';
import { formatCurrency, formatDate, getInitials } from '../../utils/formatters';
import {
  ArrowLeftRight,
  ArrowUpRight,
  ArrowDownLeft,
  HandCoins,
  Search,
  Filter,
  Calendar,
  Edit2,
  Trash2,
  Plus,
  X,
} from 'lucide-react';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { EmptyState } from '../common/EmptyState';

interface TransactionsViewProps {
  onOpenAddTransaction: (defaultType?: 'gave' | 'received') => void;
  onEditTransaction: (tx: Transaction) => void;
  onSelectPerson: (personId: string) => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  onOpenAddTransaction,
  onEditTransaction,
  onSelectPerson,
}) => {
  const { transactions, people, deleteTransaction, preferences } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'gave' | 'received' | 'settlement'>('all');
  const [personFilter, setPersonFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [txToDelete, setTxToDelete] = useState<Transaction | null>(null);

  const categories = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach((t) => {
      if (t.category) set.add(t.category);
    });
    return Array.from(set);
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((tx) => {
        // Search
        const q = searchQuery.toLowerCase().trim();
        const p = people.find((person) => person.id === tx.personId);
        const personName = p ? p.name.toLowerCase() : '';
        const matchesSearch =
          !q ||
          tx.description.toLowerCase().includes(q) ||
          personName.includes(q) ||
          tx.category.toLowerCase().includes(q) ||
          (tx.notes && tx.notes.toLowerCase().includes(q));

        // Type
        let matchesType = true;
        if (typeFilter === 'gave') matchesType = tx.type === 'gave' && !tx.isSettlement;
        if (typeFilter === 'received') matchesType = tx.type === 'received' && !tx.isSettlement;
        if (typeFilter === 'settlement') matchesType = !!tx.isSettlement;

        // Person
        const matchesPerson = personFilter === 'all' || tx.personId === personFilter;

        // Category
        const matchesCategory = categoryFilter === 'all' || tx.category === categoryFilter;

        // Date range
        let matchesDate = true;
        if (startDate && tx.transactionDate < startDate) matchesDate = false;
        if (endDate && tx.transactionDate > endDate) matchesDate = false;

        return matchesSearch && matchesType && matchesPerson && matchesCategory && matchesDate;
      })
      .sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime());
  }, [transactions, people, searchQuery, typeFilter, personFilter, categoryFilter, startDate, endDate]);

  const totalGaveFiltered = filteredTransactions
    .filter((t) => t.type === 'gave')
    .reduce((acc, t) => acc + Number(t.amount), 0);

  const totalReceivedFiltered = filteredTransactions
    .filter((t) => t.type === 'received')
    .reduce((acc, t) => acc + Number(t.amount), 0);

  const clearFilters = () => {
    setSearchQuery('');
    setTypeFilter('all');
    setPersonFilter('all');
    setCategoryFilter('all');
    setStartDate('');
    setEndDate('');
  };

  const hasActiveFilters =
    searchQuery ||
    typeFilter !== 'all' ||
    personFilter !== 'all' ||
    categoryFilter !== 'all' ||
    startDate ||
    endDate;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Transaction History
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Complete record of money given, received, and settled across all people.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onOpenAddTransaction('gave')}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl font-medium text-sm transition-all shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Transaction</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-zinc-900 p-4 sm:p-5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-3.5">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search description, person or notes..."
              className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Type Filter Chips */}
          <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-xl text-xs font-medium overflow-x-auto">
            <button
              type="button"
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                typeFilter === 'all'
                  ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('gave')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                typeFilter === 'gave'
                  ? 'bg-white dark:bg-zinc-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              You Gave
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('received')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                typeFilter === 'received'
                  ? 'bg-white dark:bg-zinc-700 text-rose-600 dark:text-rose-400 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              Received
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('settlement')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                typeFilter === 'settlement'
                  ? 'bg-white dark:bg-zinc-700 text-purple-600 dark:text-purple-400 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              Settlements
            </button>
          </div>
        </div>

        {/* Secondary Row Filters: Person, Category, Date Range */}
        <div className="flex flex-wrap items-center gap-2.5 pt-1 text-xs">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-zinc-400" />
            <span className="font-semibold text-zinc-500 dark:text-zinc-400">Filters:</span>
          </div>

          {/* Person Dropdown */}
          <select
            value={personFilter}
            onChange={(e) => setPersonFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200"
          >
            <option value="all">All People</option>
            {people.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          {/* Category Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Date Range */}
          <div className="flex items-center gap-1.5 bg-zinc-50 dark:bg-zinc-800 px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700">
            <Calendar className="w-3.5 h-3.5 text-zinc-400" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent text-xs text-zinc-800 dark:text-zinc-200 focus:outline-hidden"
              title="Start Date"
            />
            <span className="text-zinc-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent text-xs text-zinc-800 dark:text-zinc-200 focus:outline-hidden"
              title="End Date"
            />
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors font-medium ml-auto"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Filtered Volume Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1 text-xs text-zinc-500 dark:text-zinc-400">
        <div>
          Showing <span className="font-semibold text-zinc-800 dark:text-zinc-200">{filteredTransactions.length}</span>{' '}
          of {transactions.length} total entries
        </div>
        <div className="flex items-center gap-4">
          <span>
            Total Given:{' '}
            <strong className="text-emerald-600 dark:text-emerald-400">
              {formatCurrency(totalGaveFiltered, preferences.currency)}
            </strong>
          </span>
          <span>
            Total Received:{' '}
            <strong className="text-rose-600 dark:text-rose-400">
              {formatCurrency(totalReceivedFiltered, preferences.currency)}
            </strong>
          </span>
        </div>
      </div>

      {/* Transaction List */}
      {transactions.length === 0 ? (
        <EmptyState
          icon={ArrowLeftRight}
          title="No transactions recorded yet"
          description="Record your first money transaction to begin tracking loans, debts, and payments."
          actionLabel="Add Transaction"
          onAction={() => onOpenAddTransaction('gave')}
        />
      ) : filteredTransactions.length === 0 ? (
        <div className="p-12 text-center text-zinc-500 dark:text-zinc-400 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
          <p className="font-medium">No transactions match your current search filters.</p>
          <button
            type="button"
            onClick={clearFilters}
            className="mt-3 text-xs text-emerald-600 hover:underline"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs divide-y divide-zinc-100 dark:divide-zinc-800/80 overflow-hidden">
          {filteredTransactions.map((tx) => {
            const person = people.find((p) => p.id === tx.personId);
            const isGave = tx.type === 'gave';

            return (
              <div
                key={tx.id}
                className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors group"
              >
                {/* Left Side: Avatar, Person, Description & Category */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    onClick={() => person && onSelectPerson(person.id)}
                    className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-xs shadow-xs cursor-pointer shrink-0 ${
                      person?.avatarColor || 'bg-emerald-600 text-white'
                    }`}
                    title={`Open ${person?.name || 'person'}'s ledger`}
                  >
                    {person ? getInitials(person.name) : '?'}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => person && onSelectPerson(person.id)}
                        className="font-semibold text-zinc-900 dark:text-zinc-100 hover:text-emerald-600 dark:hover:text-emerald-400 text-sm sm:text-base text-left transition-colors"
                      >
                        {person?.name || 'Unknown Person'}
                      </button>
                      {tx.isSettlement ? (
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
                          Settlement
                        </span>
                      ) : (
                        <span
                          className={`px-2 py-0.5 rounded-md text-[11px] font-medium ${
                            isGave
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                              : 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400'
                          }`}
                        >
                          {isGave ? 'You Gave' : 'Received'}
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-md text-[11px] bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                        {tx.category}
                      </span>
                    </div>

                    <div className="text-xs text-zinc-600 dark:text-zinc-300 mt-1 truncate">
                      {tx.description}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-zinc-400 mt-1">
                      <span>{formatDate(tx.transactionDate, preferences.dateFormat)}</span>
                      {tx.notes && <span>• Note: {tx.notes}</span>}
                    </div>
                  </div>
                </div>

                {/* Right Side: Amount & Row Actions */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <div
                      className={`text-base sm:text-lg font-bold ${
                        isGave
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {isGave ? '+' : '-'}
                      {formatCurrency(tx.amount, preferences.currency)}
                    </div>
                    <div className="text-[11px] text-zinc-400">
                      {isGave ? 'Added to debt' : 'Reduced debt'}
                    </div>
                  </div>

                  <div className="opacity-80 sm:opacity-0 sm:group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                    <button
                      type="button"
                      onClick={() => onEditTransaction(tx)}
                      className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                      title="Edit transaction"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setTxToDelete(tx)}
                      className="p-1.5 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                      title="Delete transaction"
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

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={!!txToDelete}
        onClose={() => setTxToDelete(null)}
        onConfirm={() => {
          if (txToDelete) deleteTransaction(txToDelete.id);
        }}
        title="Delete Transaction?"
        message={`Are you sure you want to delete this ${
          txToDelete ? formatCurrency(txToDelete.amount, preferences.currency) : ''
        } transaction? Related person ledger balances will update automatically.`}
        confirmLabel="Delete Transaction"
        isDestructive
      />
    </div>
  );
};
