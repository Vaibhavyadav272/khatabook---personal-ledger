import React, { useState, useMemo } from 'react';
import { Person } from '../../types';
import { useData } from '../../context/DataContext';
import { PersonCard } from './PersonCard';
import { EmptyState } from '../common/EmptyState';
import { Users, UserPlus, Search, TrendingUp, TrendingDown, CheckCircle2 } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

interface PeopleViewProps {
  onSelectPerson: (personId: string) => void;
  onOpenAddPerson: () => void;
  onOpenAddTransaction: (defaultType?: 'gave' | 'received', personId?: string) => void;
  onOpenSettleUp: (personId: string) => void;
}

export const PeopleView: React.FC<PeopleViewProps> = ({
  onSelectPerson,
  onOpenAddPerson,
  onOpenAddTransaction,
  onOpenSettleUp,
}) => {
  const { people, getPersonSummary, preferences, dashboardMetrics } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'owes_you' | 'you_owe' | 'settled'>('all');

  const peopleWithSummaries = useMemo(() => {
    return people.map((person) => {
      const summary = getPersonSummary(person.id)!;
      return { person, summary };
    });
  }, [people, getPersonSummary]);

  const filteredPeople = useMemo(() => {
    return peopleWithSummaries.filter(({ person, summary }) => {
      // Search check
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        person.name.toLowerCase().includes(q) ||
        (person.phone && person.phone.toLowerCase().includes(q)) ||
        (person.email && person.email.toLowerCase().includes(q)) ||
        (person.notes && person.notes.toLowerCase().includes(q));

      // Status check
      let matchesStatus = true;
      if (statusFilter === 'owes_you') matchesStatus = summary.status === 'owes_you';
      if (statusFilter === 'you_owe') matchesStatus = summary.status === 'you_owe';
      if (statusFilter === 'settled') matchesStatus = summary.status === 'settled';

      return matchesSearch && matchesStatus;
    });
  }, [peopleWithSummaries, searchQuery, statusFilter]);

  const owesYouCount = peopleWithSummaries.filter((p) => p.summary.status === 'owes_you').length;
  const youOweCount = peopleWithSummaries.filter((p) => p.summary.status === 'you_owe').length;
  const settledCount = peopleWithSummaries.filter((p) => p.summary.status === 'settled').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
            People & Ledgers
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Maintain independent money records for each contact with real-time balance calculations.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenAddPerson}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl font-medium text-sm transition-all shadow-xs shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New Person</span>
        </button>
      </div>

      {/* Mini Quick Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/80 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
              Total to Receive ({owesYouCount} people)
            </div>
            <div className="text-xl font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">
              {formatCurrency(dashboardMetrics.totalToReceive, preferences.currency)}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-800/80 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-rose-800 dark:text-rose-300">
              Total to Pay ({youOweCount} people)
            </div>
            <div className="text-xl font-bold text-rose-700 dark:text-rose-400 mt-0.5">
              {formatCurrency(dashboardMetrics.totalToPay, preferences.currency)}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center text-rose-600 dark:text-rose-400">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/80 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
              Settled Ledgers
            </div>
            <div className="text-xl font-bold text-zinc-800 dark:text-zinc-200 mt-0.5">
              {settledCount} {settledCount === 1 ? 'person' : 'people'}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-zinc-200 dark:bg-zinc-700/50 flex items-center justify-center text-zinc-600 dark:text-zinc-300">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pt-2">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, phone or note..."
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-xs"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200/60 dark:border-zinc-700 overflow-x-auto text-xs font-medium">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
              statusFilter === 'all'
                ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-xs'
                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            All ({people.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('owes_you')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
              statusFilter === 'owes_you'
                ? 'bg-white dark:bg-zinc-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            Owes You ({owesYouCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('you_owe')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
              statusFilter === 'you_owe'
                ? 'bg-white dark:bg-zinc-700 text-rose-600 dark:text-rose-400 shadow-xs'
                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            You Owe ({youOweCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('settled')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
              statusFilter === 'settled'
                ? 'bg-white dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 shadow-xs'
                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            Settled ({settledCount})
          </button>
        </div>
      </div>

      {/* Grid of Person Cards */}
      {people.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No people added yet"
          description="Add people to start tracking money, recording loans, repayments, and shared bills."
          actionLabel="Add Person"
          onAction={onOpenAddPerson}
        />
      ) : filteredPeople.length === 0 ? (
        <div className="p-12 text-center text-zinc-500 dark:text-zinc-400 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
          <p className="font-medium">No people match your search or filter.</p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('all');
            }}
            className="mt-3 text-xs text-emerald-600 hover:underline"
          >
            Reset filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
          {filteredPeople.map(({ person, summary }) => (
            <PersonCard
              key={person.id}
              person={person}
              summary={summary}
              onClick={() => onSelectPerson(person.id)}
              onSettleUp={(e) => {
                e.stopPropagation();
                onOpenSettleUp(person.id);
              }}
              onAddTransaction={(e) => {
                e.stopPropagation();
                onOpenAddTransaction('gave', person.id);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};
