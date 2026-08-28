import React from 'react';
import { Person, PersonBalanceSummary } from '../../types';
import { useData } from '../../context/DataContext';
import { formatCurrency, formatShortDate, getInitials } from '../../utils/formatters';
import { Phone, Calendar, ArrowRight, CheckCircle2, TrendingUp, TrendingDown } from 'lucide-react';

interface PersonCardProps {
  person: Person;
  summary: PersonBalanceSummary;
  onClick: () => void;
  onSettleUp: (e: React.MouseEvent) => void;
  onAddTransaction: (e: React.MouseEvent) => void;
}

export const PersonCard: React.FC<PersonCardProps> = ({
  person,
  summary,
  onClick,
  onSettleUp,
  onAddTransaction,
}) => {
  const { preferences } = useData();

  const isOwesYou = summary.status === 'owes_you';
  const isYouOwe = summary.status === 'you_owe';
  const isSettled = summary.status === 'settled';

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className="group text-left bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-zinc-200/80 dark:border-zinc-800 hover:border-emerald-500/50 dark:hover:border-emerald-500/50 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden"
    >
      {/* Top Row: Avatar, Name & Phone */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-sm shadow-xs ${
                person.avatarColor || 'bg-emerald-600 text-white'
              }`}
            >
              {getInitials(person.name)}
            </div>
            <div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors text-base">
                {person.name}
              </h3>
              {person.phone ? (
                <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  <Phone className="w-3 h-3" />
                  <span>{person.phone}</span>
                </div>
              ) : (
                <span className="text-xs text-zinc-400">No phone added</span>
              )}
            </div>
          </div>

          {/* Status Badge */}
          <div
            className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 shrink-0 ${
              isOwesYou
                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                : isYouOwe
                ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700'
            }`}
          >
            {isOwesYou && <TrendingUp className="w-3 h-3" />}
            {isYouOwe && <TrendingDown className="w-3 h-3" />}
            {isSettled && <CheckCircle2 className="w-3 h-3 text-zinc-400" />}
            <span>
              {isOwesYou ? 'Owes you' : isYouOwe ? 'You owe' : 'Settled'}
            </span>
          </div>
        </div>

        {/* Balance Display */}
        <div className="my-3 p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800/80">
          <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mb-1">
            Current Balance
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <span
              className={`text-xl sm:text-2xl font-bold tracking-tight ${
                isOwesYou
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : isYouOwe
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-zinc-700 dark:text-zinc-300'
              }`}
            >
              {formatCurrency(summary.netBalance, preferences.currency)}
            </span>
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 truncate text-right">
              {summary.statusText}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Row: Last Transaction & Quick Actions */}
      <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-2 mt-2">
        <div className="flex items-center gap-1.5 text-xs text-zinc-400">
          <Calendar className="w-3.5 h-3.5" />
          <span>{summary.lastTransactionDate ? formatShortDate(summary.lastTransactionDate) : 'No transactions'}</span>
        </div>

        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          {!isSettled && (
            <button
              type="button"
              onClick={onSettleUp}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 transition-colors"
            >
              Settle
            </button>
          )}
          <button
            type="button"
            onClick={onAddTransaction}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-400 transition-colors"
          >
            + Entry
          </button>
          <div className="p-1 text-zinc-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
};
