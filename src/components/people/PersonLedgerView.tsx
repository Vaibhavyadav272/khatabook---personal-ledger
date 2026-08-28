import React, { useState } from 'react';
import { Person, Transaction } from '../../types';
import { useData } from '../../context/DataContext';
import { formatCurrency, formatDate, getInitials } from '../../utils/formatters';
import {
  ArrowLeft,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  HandCoins,
  Phone,
  Mail,
  Edit2,
  Trash2,
  Share2,
  Calendar,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Filter,
} from 'lucide-react';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { EmptyState } from '../common/EmptyState';
import { useToast } from '../../context/ToastContext';

interface PersonLedgerViewProps {
  personId: string;
  onBack: () => void;
  onOpenAddTransaction: (defaultType?: 'gave' | 'received', personId?: string) => void;
  onOpenSettleUp: (personId: string) => void;
  onEditPerson: (person: Person) => void;
  onEditTransaction: (transaction: Transaction) => void;
}

export const PersonLedgerView: React.FC<PersonLedgerViewProps> = ({
  personId,
  onBack,
  onOpenAddTransaction,
  onOpenSettleUp,
  onEditPerson,
  onEditTransaction,
}) => {
  const { people, transactions, deletePerson, deleteTransaction, getPersonSummary, preferences } = useData();
  const { success } = useToast();

  const person = people.find((p) => p.id === personId);
  const summary = person ? getPersonSummary(person.id) : null;

  const [confirmDeletePerson, setConfirmDeletePerson] = useState(false);
  const [txToDelete, setTxToDelete] = useState<Transaction | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'gave' | 'received'>('all');

  if (!person || !summary) {
    return (
      <div className="p-8 text-center">
        <p className="text-zinc-500">Person not found.</p>
        <button
          type="button"
          onClick={onBack}
          className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm"
        >
          Return to People
        </button>
      </div>
    );
  }

  const personTransactions = transactions
    .filter((t) => t.personId === person.id)
    .filter((t) => (filterType === 'all' ? true : t.type === filterType))
    .sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime());

  const isOwesYou = summary.status === 'owes_you';
  const isYouOwe = summary.status === 'you_owe';
  const isSettled = summary.status === 'settled';

  const handleShareReminder = () => {
    let text = '';
    if (isOwesYou) {
      text = `Hi ${person.name}, just a friendly reminder regarding our pending balance of ${formatCurrency(
        summary.netBalance,
        preferences.currency
      )}. You can send it via UPI/bank when convenient. Thanks!`;
    } else if (isYouOwe) {
      text = `Hi ${person.name}, I wanted to confirm I have a pending payment of ${formatCurrency(
        Math.abs(summary.netBalance),
        preferences.currency
      )} to you. Let me know your preferred payment details. Thanks!`;
    } else {
      text = `Hi ${person.name}, our ledger is completely settled at ${formatCurrency(0, preferences.currency)}. All clear!`;
    }

    navigator.clipboard?.writeText(text);
    success('Reminder text copied to clipboard!');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Bar Navigation & Controls */}
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to People</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleShareReminder}
            title="Copy payment reminder"
            className="p-2 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
          >
            <Share2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onEditPerson(person)}
            title="Edit person details"
            className="p-2 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setConfirmDeletePerson(true)}
            title="Delete person"
            className="p-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Person Profile & Net Balance Card */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 border border-zinc-200/80 dark:border-zinc-800 shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          {/* Person Info */}
          <div className="flex items-start gap-4">
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-xl shadow-xs shrink-0 ${
                person.avatarColor || 'bg-emerald-600 text-white'
              }`}
            >
              {getInitials(person.name)}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                  {person.name}
                </h1>
                <div
                  className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
                    isOwesYou
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                      : isYouOwe
                      ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700'
                  }`}
                >
                  {isOwesYou && <TrendingUp className="w-3.5 h-3.5" />}
                  {isYouOwe && <TrendingDown className="w-3.5 h-3.5" />}
                  {isSettled && <CheckCircle2 className="w-3.5 h-3.5 text-zinc-400" />}
                  <span>{summary.statusText}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
                {person.phone && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{person.phone}</span>
                  </div>
                )}
                {person.email && (
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{person.email}</span>
                  </div>
                )}
                {person.notes && (
                  <div className="text-zinc-400 italic">
                    "{person.notes}"
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            {!isSettled && (
              <button
                type="button"
                onClick={() => onOpenSettleUp(person.id)}
                className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 rounded-xl font-medium text-sm transition-all shadow-xs active:scale-98"
              >
                <HandCoins className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
                <span>Settle Up</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => onOpenAddTransaction('gave', person.id)}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium text-sm transition-all shadow-xs active:scale-98"
            >
              <Plus className="w-4 h-4" />
              <span>Add Transaction</span>
            </button>
          </div>
        </div>

        {/* 3-Column Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800">
          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1">
              <ArrowUpRight className="w-4 h-4" />
              <span>You Gave {person.name.split(' ')[0]}</span>
            </div>
            <div className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              {formatCurrency(summary.totalGiven, preferences.currency)}
            </div>
            <div className="text-[11px] text-zinc-400 mt-0.5">Total money you provided</div>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400 mb-1">
              <ArrowDownLeft className="w-4 h-4" />
              <span>{person.name.split(' ')[0]} Gave You</span>
            </div>
            <div className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              {formatCurrency(summary.totalReceived, preferences.currency)}
            </div>
            <div className="text-[11px] text-zinc-400 mt-0.5">Total money received back</div>
          </div>

          <div
            className={`p-4 rounded-2xl border ${
              isOwesYou
                ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800'
                : isYouOwe
                ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800'
                : 'bg-zinc-50 dark:bg-zinc-800/40 border-zinc-100 dark:border-zinc-800'
            }`}
          >
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
              <span>Current Net Balance</span>
            </div>
            <div
              className={`text-xl font-bold ${
                isOwesYou
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : isYouOwe
                  ? 'text-rose-700 dark:text-rose-400'
                  : 'text-zinc-700 dark:text-zinc-300'
              }`}
            >
              {formatCurrency(summary.netBalance, preferences.currency)}
            </div>
            <div className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mt-0.5">
              {summary.statusText}
            </div>
          </div>
        </div>
      </div>

      {/* Transaction History Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              Transaction History
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Showing newest entries first. Balances recalculate automatically.
            </p>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200/60 dark:border-zinc-700 text-xs">
            <Filter className="w-3.5 h-3.5 text-zinc-400 ml-2 mr-1" />
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                filterType === 'all'
                  ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              All ({transactions.filter((t) => t.personId === person.id).length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('gave')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                filterType === 'gave'
                  ? 'bg-white dark:bg-zinc-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              You Gave
            </button>
            <button
              type="button"
              onClick={() => setFilterType('received')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                filterType === 'received'
                  ? 'bg-white dark:bg-zinc-700 text-rose-600 dark:text-rose-400 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              Received
            </button>
          </div>
        </div>

        {/* Transaction Rows */}
        {personTransactions.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No transactions yet"
            description={`Start tracking money with ${person.name} by adding your first transaction.`}
            actionLabel="Add Transaction"
            onAction={() => onOpenAddTransaction('gave', person.id)}
          />
        ) : (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800/80 shadow-xs overflow-hidden">
            {personTransactions.map((tx) => {
              const isGave = tx.type === 'gave';
              return (
                <div
                  key={tx.id}
                  className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-zinc-50/60 dark:hover:bg-zinc-800/30 transition-colors group"
                >
                  {/* Left: Icon, Description, Category & Date */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        tx.isSettlement
                          ? 'bg-purple-100 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400'
                          : isGave
                          ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400'
                          : 'bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {tx.isSettlement ? (
                        <HandCoins className="w-5 h-5" />
                      ) : isGave ? (
                        <ArrowUpRight className="w-5 h-5" />
                      ) : (
                        <ArrowDownLeft className="w-5 h-5" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm sm:text-base truncate">
                          {tx.description}
                        </span>
                        {tx.isSettlement && (
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
                            Settlement
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                          {tx.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-zinc-400 mt-1">
                        <span>{formatDate(tx.transactionDate, preferences.dateFormat)}</span>
                        <span>•</span>
                        <span className="font-medium text-zinc-500 dark:text-zinc-400">
                          {isGave ? 'You gave' : 'Received'}
                        </span>
                        {tx.notes && <span>• {tx.notes}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Right: Amount & Actions */}
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

                    {/* Edit/Delete row actions */}
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
      </div>

      {/* Confirmation Dialog for Deleting Person */}
      <ConfirmDialog
        isOpen={confirmDeletePerson}
        onClose={() => setConfirmDeletePerson(false)}
        onConfirm={() => {
          deletePerson(person.id);
          onBack();
        }}
        title={`Delete ${person.name}?`}
        message={`Are you sure you want to delete ${person.name}? All ${personTransactions.length} related transactions and ledger records will be permanently removed.`}
        confirmLabel="Delete Person & Ledger"
        isDestructive
      />

      {/* Confirmation Dialog for Deleting Transaction */}
      <ConfirmDialog
        isOpen={!!txToDelete}
        onClose={() => setTxToDelete(null)}
        onConfirm={() => {
          if (txToDelete) deleteTransaction(txToDelete.id);
        }}
        title="Delete Transaction?"
        message={`Are you sure you want to delete "${txToDelete?.description}" of ${
          txToDelete ? formatCurrency(txToDelete.amount, preferences.currency) : ''
        }? The ledger balance will recalculate automatically.`}
        confirmLabel="Delete Transaction"
        isDestructive
      />
    </div>
  );
};
