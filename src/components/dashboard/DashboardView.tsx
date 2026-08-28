import React from 'react';
import { useData } from '../../context/DataContext';
import { formatCurrency, formatDate, getInitials } from '../../utils/formatters';
import {
  TrendingUp,
  TrendingDown,
  Scale,
  Receipt,
  UserPlus,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRight,
  Sparkles,
  Calendar,
  Layers,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { ActiveTab, Transaction } from '../../types';

interface DashboardViewProps {
  onNavigate: (tab: ActiveTab) => void;
  onSelectPerson: (personId: string) => void;
  onOpenAddPerson: () => void;
  onOpenAddTransaction: (defaultType?: 'gave' | 'received', personId?: string) => void;
  onOpenAddExpense: () => void;
  onOpenSplitExpense: () => void;
  onOpenSettleUp: (personId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onSelectPerson,
  onOpenAddPerson,
  onOpenAddTransaction,
  onOpenAddExpense,
  onOpenSplitExpense,
  onOpenSettleUp,
}) => {
  const { dashboardMetrics, transactions, expenses, people, preferences } = useData();

  const isNetPositive = dashboardMetrics.netBalance > 0;
  const isNetNegative = dashboardMetrics.netBalance < 0;

  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime())
    .slice(0, 5);

  const recentExpenses = [...expenses]
    .sort((a, b) => new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime())
    .slice(0, 4);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Financial Dashboard
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Real-time overview of who owes you, what you owe, and your expenses.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onOpenAddPerson}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-medium bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-xl transition-colors active:scale-98"
          >
            <UserPlus className="w-4 h-4 text-indigo-500" />
            <span>Add Person</span>
          </button>

          <button
            type="button"
            onClick={onOpenAddExpense}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-medium bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-xl transition-colors active:scale-98"
          >
            <Receipt className="w-4 h-4 text-amber-500" />
            <span>Add Expense</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenAddTransaction('gave')}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all shadow-xs active:scale-98"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Add Transaction</span>
          </button>
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: Total to Receive */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-emerald-200/80 dark:border-emerald-950/60 shadow-xs relative overflow-hidden group hover:border-emerald-400 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Total to Receive
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-3 tracking-tight">
            {formatCurrency(dashboardMetrics.totalToReceive, preferences.currency)}
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 flex items-center gap-1">
            <span>Money other people owe you</span>
          </p>
        </div>

        {/* Card 2: Total to Pay */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-rose-200/80 dark:border-rose-950/60 shadow-xs relative overflow-hidden group hover:border-rose-400 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-700 dark:text-rose-400">
              Total to Pay
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/80 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-rose-600 dark:text-rose-400 mt-3 tracking-tight">
            {formatCurrency(dashboardMetrics.totalToPay, preferences.currency)}
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 flex items-center gap-1">
            <span>Money you owe other people</span>
          </p>
        </div>

        {/* Card 3: Net Balance */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-zinc-200/80 dark:border-zinc-800 shadow-xs relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
              Net Balance
            </span>
            <div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-300">
              <Scale className="w-5 h-5" />
            </div>
          </div>
          <div
            className={`text-2xl sm:text-3xl font-bold mt-3 tracking-tight ${
              isNetPositive
                ? 'text-emerald-600 dark:text-emerald-400'
                : isNetNegative
                ? 'text-rose-600 dark:text-rose-400'
                : 'text-zinc-800 dark:text-zinc-200'
            }`}
          >
            {formatCurrency(dashboardMetrics.netBalance, preferences.currency)}
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 truncate">
            {isNetPositive
              ? 'You are in positive credit'
              : isNetNegative
              ? 'You have net outstanding debt'
              : 'All person ledgers balanced'}
          </p>
        </div>

        {/* Card 4: Total Expenses */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-amber-200/80 dark:border-amber-950/60 shadow-xs relative overflow-hidden group hover:border-amber-400 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              Monthly Expenses
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/80 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-amber-600 dark:text-amber-400 mt-3 tracking-tight">
            {formatCurrency(dashboardMetrics.thisMonthExpenses, preferences.currency)}
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Total recorded: {formatCurrency(dashboardMetrics.totalExpenses, preferences.currency)}
          </p>
        </div>
      </div>

      {/* Two Column Layout: People Who Owe You vs People You Owe */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* People Who Owe User */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-200/80 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-base">
                  People Who Owe You
                </h3>
                <span className="text-xs text-zinc-400">
                  {dashboardMetrics.peopleWhoOweYou.length} contacts with pending credit
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('people')}
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {dashboardMetrics.peopleWhoOweYou.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-dashed border-zinc-200 dark:border-zinc-800 text-xs text-zinc-400">
              <CheckCircle2 className="w-6 h-6 mx-auto mb-2 text-emerald-500" />
              <span>Nobody currently owes you money.</span>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
              {dashboardMetrics.peopleWhoOweYou.slice(0, 4).map((item) => (
                <div
                  key={item.personId}
                  onClick={() => onSelectPerson(item.personId)}
                  className="py-3.5 flex items-center justify-between gap-3 hover:bg-zinc-50/60 dark:hover:bg-zinc-800/30 rounded-xl px-2 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                        item.person.avatarColor || 'bg-emerald-600 text-white'
                      }`}
                    >
                      {getInitials(item.person.name)}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                        {item.person.name}
                      </h4>
                      <p className="text-xs text-zinc-400">
                        {item.person.phone || 'No phone'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(item.netBalance, preferences.currency)}
                      </div>
                      <div className="text-[10px] text-zinc-400">Owes you</div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenSettleUp(item.personId);
                      }}
                      className="px-2.5 py-1 text-xs font-medium bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-400 rounded-lg transition-colors"
                    >
                      Settle
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* People You Owe */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-200/80 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center text-rose-600 dark:text-rose-400">
                <TrendingDown className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-base">
                  People You Owe
                </h3>
                <span className="text-xs text-zinc-400">
                  {dashboardMetrics.peopleYouOwe.length} contacts with pending repayments
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('people')}
              className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {dashboardMetrics.peopleYouOwe.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-dashed border-zinc-200 dark:border-zinc-800 text-xs text-zinc-400">
              <CheckCircle2 className="w-6 h-6 mx-auto mb-2 text-emerald-500" />
              <span>You don't owe anyone money right now.</span>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
              {dashboardMetrics.peopleYouOwe.slice(0, 4).map((item) => (
                <div
                  key={item.personId}
                  onClick={() => onSelectPerson(item.personId)}
                  className="py-3.5 flex items-center justify-between gap-3 hover:bg-zinc-50/60 dark:hover:bg-zinc-800/30 rounded-xl px-2 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                        item.person.avatarColor || 'bg-rose-600 text-white'
                      }`}
                    >
                      {getInitials(item.person.name)}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                        {item.person.name}
                      </h4>
                      <p className="text-xs text-zinc-400">
                        {item.person.phone || 'No phone'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className="text-sm font-bold text-rose-600 dark:text-rose-400">
                        {formatCurrency(Math.abs(item.netBalance), preferences.currency)}
                      </div>
                      <div className="text-[10px] text-zinc-400">You owe</div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenSettleUp(item.personId);
                      }}
                      className="px-2.5 py-1 text-xs font-medium bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-400 rounded-lg transition-colors"
                    >
                      Pay & Settle
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Two Column Layout: Recent Transactions vs Recent Expenses & Quick Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions (2 cols on lg) */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-200/80 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-base">
                Recent Ledger Activity
              </h3>
              <p className="text-xs text-zinc-400">Latest loan, debt and settlement records</p>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('transactions')}
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              <span>Full History</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentTransactions.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-dashed border-zinc-200 dark:border-zinc-800 text-xs text-zinc-400">
              No transactions recorded yet.
            </div>
          ) : (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
              {recentTransactions.map((tx) => {
                const person = people.find((p) => p.id === tx.personId);
                const isGave = tx.type === 'gave';

                return (
                  <div
                    key={tx.id}
                    className="py-3.5 flex items-center justify-between gap-3 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 rounded-xl px-2 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          tx.isSettlement
                            ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400'
                            : isGave
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                            : 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {isGave ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm truncate">
                            {person?.name || 'Unknown'}
                          </span>
                          <span className="text-[11px] px-2 py-0.2 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                            {tx.category}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400 truncate">{tx.description}</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div
                        className={`text-sm font-bold ${
                          isGave
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {isGave ? '+' : '-'}
                        {formatCurrency(tx.amount, preferences.currency)}
                      </div>
                      <div className="text-[11px] text-zinc-400">
                        {formatDate(tx.transactionDate, preferences.dateFormat)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side: Split Bill Quick Promo & Recent Expenses */}
        <div className="space-y-6">
          {/* Split Bill Feature Banner */}
          <div className="p-5 rounded-3xl bg-linear-to-br from-indigo-900 to-zinc-900 text-white shadow-md relative overflow-hidden">
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-300 uppercase tracking-wider mb-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Split Shared Expenses</span>
            </div>
            <h4 className="text-lg font-bold leading-snug">
              Paid for dinner, travel or groceries?
            </h4>
            <p className="text-xs text-indigo-200 mt-1.5 leading-relaxed">
              Instantly split bills equally or with custom amounts and auto-record what everyone owes you.
            </p>
            <button
              type="button"
              onClick={onOpenSplitExpense}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl text-xs font-semibold transition-colors active:scale-98 shadow-xs"
            >
              <span>Split a New Bill</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Recent Expenses List */}
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-200/80 dark:border-zinc-800 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                  Recent Out-of-Pocket Expenses
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('expenses')}
                className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline"
              >
                View
              </button>
            </div>

            {recentExpenses.length === 0 ? (
              <div className="p-4 text-center text-xs text-zinc-400">No expenses recorded yet.</div>
            ) : (
              <div className="space-y-3">
                {recentExpenses.map((exp) => (
                  <div
                    key={exp.id}
                    className="flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                        {exp.description}
                      </div>
                      <div className="text-zinc-400 text-[11px]">{exp.category} • {exp.paymentMethod}</div>
                    </div>
                    <div className="font-bold text-zinc-900 dark:text-zinc-100 shrink-0">
                      {formatCurrency(exp.amount, preferences.currency)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
