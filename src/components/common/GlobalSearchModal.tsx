import React, { useState, useMemo, useEffect } from 'react';
import { Modal } from './Modal';
import { useData } from '../../context/DataContext';
import { formatCurrency, formatDate, getInitials } from '../../utils/formatters';
import {
  Search,
  Users,
  ArrowLeftRight,
  Receipt,
  UserPlus,
  ArrowUpRight,
  Split,
  HandCoins,
  ArrowRight,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { ActiveTab, Transaction, Expense, Person } from '../../types';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: ActiveTab) => void;
  onSelectPerson: (personId: string) => void;
  onOpenAddPerson: () => void;
  onOpenAddTransaction: (defaultType?: 'gave' | 'received') => void;
  onOpenAddExpense: () => void;
  onOpenSplitExpense: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onSelectPerson,
  onOpenAddPerson,
  onOpenAddTransaction,
  onOpenAddExpense,
  onOpenSplitExpense,
}) => {
  const { people, transactions, expenses, getPersonSummary, preferences } = useData();
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (isOpen) {
      setQuery('');
    }
  }, [isOpen]);

  const q = query.toLowerCase().trim();

  const matchedPeople = useMemo(() => {
    if (!q) return [];
    return people.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.phone && p.phone.toLowerCase().includes(q)) ||
        (p.email && p.email.toLowerCase().includes(q)) ||
        (p.notes && p.notes.toLowerCase().includes(q))
    );
  }, [people, q]);

  const matchedTransactions = useMemo(() => {
    if (!q) return [];
    return transactions
      .filter((t) => {
        const p = people.find((person) => person.id === t.personId);
        return (
          t.description.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q) ||
          (p && p.name.toLowerCase().includes(q)) ||
          (t.notes && t.notes.toLowerCase().includes(q))
        );
      })
      .slice(0, 5);
  }, [transactions, people, q]);

  const matchedExpenses = useMemo(() => {
    if (!q) return [];
    return expenses
      .filter(
        (e) =>
          e.description.toLowerCase().includes(q) ||
          e.category.toLowerCase().includes(q) ||
          (e.notes && e.notes.toLowerCase().includes(q))
      )
      .slice(0, 5);
  }, [expenses, q]);

  const handleSelectPerson = (id: string) => {
    onSelectPerson(id);
    onClose();
  };

  const handleOpenTransaction = () => {
    onNavigate('transactions');
    onClose();
  };

  const handleOpenExpenses = () => {
    onNavigate('expenses');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Global Search" maxWidth="lg">
      <div className="space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-5 h-5 text-zinc-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search contacts, transactions, notes, expenses (e.g. Rahul, Dinner, Goa)..."
            className="w-full pl-11 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-sm sm:text-base text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>

        {/* If Query Empty: Quick Action Shortcuts */}
        {!q ? (
          <div className="space-y-4 py-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Quick Shortcuts
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  onOpenAddPerson();
                  onClose();
                }}
                className="p-3 bg-zinc-50 dark:bg-zinc-800/60 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-2xl border border-zinc-200/80 dark:border-zinc-700/80 flex flex-col items-center text-center gap-1.5 transition-colors group"
              >
                <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                  Add Person
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onOpenAddTransaction('gave');
                  onClose();
                }}
                className="p-3 bg-zinc-50 dark:bg-zinc-800/60 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-2xl border border-zinc-200/80 dark:border-zinc-700/80 flex flex-col items-center text-center gap-1.5 transition-colors group"
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                  Add Transaction
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onOpenSplitExpense();
                  onClose();
                }}
                className="p-3 bg-zinc-50 dark:bg-zinc-800/60 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-2xl border border-zinc-200/80 dark:border-zinc-700/80 flex flex-col items-center text-center gap-1.5 transition-colors group"
              >
                <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <Split className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                  Split Bill
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onOpenAddExpense();
                  onClose();
                }}
                className="p-3 bg-zinc-50 dark:bg-zinc-800/60 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-2xl border border-zinc-200/80 dark:border-zinc-700/80 flex flex-col items-center text-center gap-1.5 transition-colors group"
              >
                <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Receipt className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                  Log Expense
                </span>
              </button>
            </div>
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto space-y-4 pr-1">
            {/* Contacts Section */}
            {matchedPeople.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400 px-1">
                  People ({matchedPeople.length})
                </div>
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80 bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl border border-zinc-200/80 dark:border-zinc-700/80 overflow-hidden">
                  {matchedPeople.map((person) => {
                    const summary = getPersonSummary(person.id);
                    const isOwesYou = summary.status === 'owes_you';
                    const isYouOwe = summary.status === 'you_owe';

                    return (
                      <div
                        key={person.id}
                        onClick={() => handleSelectPerson(person.id)}
                        className="p-3 flex items-center justify-between gap-3 hover:bg-zinc-100/80 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                              person.avatarColor || 'bg-emerald-600 text-white'
                            }`}
                          >
                            {getInitials(person.name)}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                              {person.name}
                            </div>
                            <div className="text-[11px] text-zinc-400 truncate">
                              {person.phone || person.email || 'Contact'}
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div
                            className={`text-xs font-bold ${
                              isOwesYou
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : isYouOwe
                                ? 'text-rose-600 dark:text-rose-400'
                                : 'text-zinc-500'
                            }`}
                          >
                            {summary.status === 'settled'
                              ? '✓ Settled'
                              : formatCurrency(Math.abs(summary.netBalance), preferences.currency)}
                          </div>
                          <div className="text-[10px] text-zinc-400">
                            {isOwesYou ? 'Owes you' : isYouOwe ? 'You owe' : '₹0'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Transactions Section */}
            {matchedTransactions.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400 px-1">
                  Transactions ({matchedTransactions.length})
                </div>
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80 bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl border border-zinc-200/80 dark:border-zinc-700/80 overflow-hidden">
                  {matchedTransactions.map((tx) => {
                    const p = people.find((person) => person.id === tx.personId);
                    return (
                      <div
                        key={tx.id}
                        onClick={handleOpenTransaction}
                        className="p-3 flex items-center justify-between gap-3 hover:bg-zinc-100/80 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                            {tx.description}
                          </div>
                          <div className="text-[11px] text-zinc-400">
                            {p?.name || 'Contact'} • {tx.category} • {formatDate(tx.transactionDate, preferences.dateFormat)}
                          </div>
                        </div>
                        <div
                          className={`text-xs font-bold shrink-0 ${
                            tx.type === 'gave'
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {tx.type === 'gave' ? '+' : '-'}
                          {formatCurrency(tx.amount, preferences.currency)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Expenses Section */}
            {matchedExpenses.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400 px-1">
                  Expenses ({matchedExpenses.length})
                </div>
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80 bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl border border-zinc-200/80 dark:border-zinc-700/80 overflow-hidden">
                  {matchedExpenses.map((exp) => (
                    <div
                      key={exp.id}
                      onClick={handleOpenExpenses}
                      className="p-3 flex items-center justify-between gap-3 hover:bg-zinc-100/80 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                          {exp.description}
                        </div>
                        <div className="text-[11px] text-zinc-400">
                          {exp.category} • {exp.paymentMethod} • {formatDate(exp.expenseDate, preferences.dateFormat)}
                        </div>
                      </div>
                      <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 shrink-0">
                        {formatCurrency(exp.amount, preferences.currency)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {matchedPeople.length === 0 && matchedTransactions.length === 0 && matchedExpenses.length === 0 && (
              <div className="p-8 text-center text-xs text-zinc-400">
                No matching contacts, transactions or expenses found for "{query}".
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
