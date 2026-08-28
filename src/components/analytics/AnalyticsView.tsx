import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { formatCurrency, getInitials } from '../../utils/formatters';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
  CartesianGrid,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Scale,
  Users,
  Receipt,
  Tag,
  CreditCard,
  Calendar,
  Sparkles,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
} from 'lucide-react';

interface AnalyticsViewProps {
  onSelectPerson: (personId: string) => void;
}

const CATEGORY_COLORS = [
  '#10b981', // emerald
  '#f59e0b', // amber
  '#6366f1', // indigo
  '#ec4899', // pink
  '#8b5cf6', // purple
  '#06b6d4', // cyan
  '#f97316', // orange
  '#3b82f6', // blue
  '#64748b', // slate
  '#14b8a6', // teal
];

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ onSelectPerson }) => {
  const { people, transactions, expenses, dashboardMetrics, preferences } = useData();

  const [activeTab, setActiveTab] = useState<'overview' | 'expenses' | 'people'>('overview');
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());

  // Available Years
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    expenses.forEach((e) => years.add(e.expenseDate.split('-')[0]));
    transactions.forEach((t) => years.add(t.transactionDate.split('-')[0]));
    years.add(new Date().getFullYear().toString());
    return Array.from(years).sort().reverse();
  }, [expenses, transactions]);

  // Monthly breakdown for selected year (12 months)
  const monthlyData = useMemo(() => {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];

    return months.map((monthName, idx) => {
      const monthNumStr = String(idx + 1).padStart(2, '0');
      const yearMonth = `${selectedYear}-${monthNumStr}`;

      const monthExpenses = expenses
        .filter((e) => e.expenseDate.startsWith(yearMonth))
        .reduce((sum, e) => sum + Number(e.amount), 0);

      const moneyGiven = transactions
        .filter((t) => t.transactionDate.startsWith(yearMonth) && t.type === 'gave')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const moneyReceived = transactions
        .filter((t) => t.transactionDate.startsWith(yearMonth) && t.type === 'received')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      return {
        month: monthName,
        expenses: monthExpenses,
        moneyGiven: moneyGiven,
        moneyReceived: moneyReceived,
      };
    });
  }, [expenses, transactions, selectedYear]);

  // Category Distribution for Expenses
  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach((e) => {
      if (!selectedYear || e.expenseDate.startsWith(selectedYear)) {
        map[e.category] = (map[e.category] || 0) + Number(e.amount);
      }
    });

    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [expenses, selectedYear]);

  // Payment Method Distribution
  const paymentMethodData = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach((e) => {
      if (!selectedYear || e.expenseDate.startsWith(selectedYear)) {
        map[e.paymentMethod] = (map[e.paymentMethod] || 0) + Number(e.amount);
      }
    });

    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [expenses, selectedYear]);

  // People Ledger Rankings
  const topPeopleWhoOwe = useMemo(() => {
    return [...dashboardMetrics.peopleWhoOweYou].sort((a, b) => b.netBalance - a.netBalance);
  }, [dashboardMetrics.peopleWhoOweYou]);

  const topPeopleYouOwe = useMemo(() => {
    return [...dashboardMetrics.peopleYouOwe].sort((a, b) => a.netBalance - b.netBalance);
  }, [dashboardMetrics.peopleYouOwe]);

  const totalYearExpenses = useMemo(() => {
    return expenses
      .filter((e) => e.expenseDate.startsWith(selectedYear))
      .reduce((sum, e) => sum + Number(e.amount), 0);
  }, [expenses, selectedYear]);

  const topCategoryName = categoryData[0]?.name || 'N/A';
  const topCategoryAmount = categoryData[0]?.value || 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Financial Analytics & Insights
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Visual trends of your spending, money lent, repayments, and contact balances.
          </p>
        </div>

        {/* Year Selector */}
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-zinc-400" />
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-3 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-semibold text-zinc-800 dark:text-zinc-200 focus:outline-hidden"
          >
            {availableYears.map((yr) => (
              <option key={yr} value={yr}>
                Year {yr}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Analytics Tabs */}
      <div className="flex items-center gap-2 p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-2xl w-fit text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl transition-colors ${
            activeTab === 'overview'
              ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-xs'
              : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
        >
          Overall Health
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('expenses')}
          className={`px-4 py-2 rounded-xl transition-colors ${
            activeTab === 'expenses'
              ? 'bg-white dark:bg-zinc-700 text-amber-600 dark:text-amber-400 shadow-xs'
              : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
        >
          Spending & Categories
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('people')}
          className={`px-4 py-2 rounded-xl transition-colors ${
            activeTab === 'people'
              ? 'bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
              : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
        >
          People & Debts
        </button>
      </div>

      {/* KPI Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-zinc-200/80 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            <span>{selectedYear} Expenses</span>
            <Receipt className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-2">
            {formatCurrency(totalYearExpenses, preferences.currency)}
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Top: {topCategoryName} ({formatCurrency(topCategoryAmount, preferences.currency)})
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-zinc-200/80 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            <span>Credit to Collect</span>
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
            {formatCurrency(dashboardMetrics.totalToReceive, preferences.currency)}
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            From {dashboardMetrics.peopleWhoOweYou.length} people
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-zinc-200/80 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400">
            <span>Debts to Pay</span>
            <TrendingDown className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-2">
            {formatCurrency(dashboardMetrics.totalToPay, preferences.currency)}
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            To {dashboardMetrics.peopleYouOwe.length} people
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-zinc-200/80 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            <span>Settled Contacts</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-2">
            {dashboardMetrics.settledPeople.length}
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Zero pending balance
          </p>
        </div>
      </div>

      {/* Main Charts Section */}
      {(activeTab === 'overview' || activeTab === 'expenses') && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Monthly Spending & Cashflow Trend */}
          <div className="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-200/80 dark:border-zinc-800 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-base">
                  Monthly Expenses & Money Given ({selectedYear})
                </h3>
                <p className="text-xs text-zinc-400">Comparing direct spending vs loans given</p>
              </div>
            </div>

            <div className="h-72 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(value: any) => [
                      formatCurrency(Number(value) || 0, preferences.currency),
                      '',
                    ]}
                    contentStyle={{
                      backgroundColor: '#18181b',
                      color: '#fff',
                      borderRadius: '12px',
                      border: 'none',
                      fontSize: '12px',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="expenses" name="Personal Expenses" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="moneyGiven" name="Money Lent / Given" fill="#10b981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Expense Category Breakdown (Donut Chart) */}
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-200/80 dark:border-zinc-800 shadow-xs">
            <div className="mb-2">
              <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-base">
                Category Breakdown
              </h3>
              <p className="text-xs text-zinc-400">Share of expenses by category</p>
            </div>

            {categoryData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-xs text-zinc-400">
                No expense data for {selectedYear}
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                    >
                      {categoryData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any) => [
                        formatCurrency(Number(value) || 0, preferences.currency),
                        '',
                      ]}
                      contentStyle={{
                        backgroundColor: '#18181b',
                        color: '#fff',
                        borderRadius: '12px',
                        border: 'none',
                        fontSize: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Category Legend List */}
            <div className="space-y-1.5 mt-2 max-h-32 overflow-y-auto pr-1 text-xs">
              {categoryData.slice(0, 5).map((cat, i) => (
                <div key={cat.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }}
                    />
                    <span className="text-zinc-700 dark:text-zinc-300 truncate">{cat.name}</span>
                  </div>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {formatCurrency(cat.value, preferences.currency)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* People & Debt Analytics Section */}
      {(activeTab === 'overview' || activeTab === 'people') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Ranked: People Who Owe You */}
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-200/80 dark:border-zinc-800 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-base">
                    Top Receivables (People Who Owe You)
                  </h3>
                  <span className="text-xs text-zinc-400">Ranked by highest pending credit</span>
                </div>
              </div>
            </div>

            {topPeopleWhoOwe.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-400">
                No outstanding credit pending from anyone.
              </div>
            ) : (
              <div className="space-y-3">
                {topPeopleWhoOwe.map((item, index) => {
                  const maxVal = topPeopleWhoOwe[0]?.netBalance || 1;
                  const percent = Math.min(100, Math.round((item.netBalance / maxVal) * 100));

                  return (
                    <div
                      key={item.personId}
                      onClick={() => onSelectPerson(item.personId)}
                      className="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl hover:bg-zinc-100/80 dark:hover:bg-zinc-800/70 transition-colors cursor-pointer space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="text-xs font-bold text-zinc-400 w-4">#{index + 1}</span>
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                              item.person.avatarColor || 'bg-emerald-600 text-white'
                            }`}
                          >
                            {getInitials(item.person.name)}
                          </div>
                          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                            {item.person.name}
                          </span>
                        </div>
                        <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(item.netBalance, preferences.currency)}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-zinc-200 dark:bg-zinc-700 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Top Ranked: People You Owe */}
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-200/80 dark:border-zinc-800 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
                  <TrendingDown className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-base">
                    Top Payables (People You Owe)
                  </h3>
                  <span className="text-xs text-zinc-400">Ranked by highest amount owed</span>
                </div>
              </div>
            </div>

            {topPeopleYouOwe.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-400">
                You have no outstanding debts to pay.
              </div>
            ) : (
              <div className="space-y-3">
                {topPeopleYouOwe.map((item, index) => {
                  const absVal = Math.abs(item.netBalance);
                  const maxVal = Math.abs(topPeopleYouOwe[0]?.netBalance || 1);
                  const percent = Math.min(100, Math.round((absVal / maxVal) * 100));

                  return (
                    <div
                      key={item.personId}
                      onClick={() => onSelectPerson(item.personId)}
                      className="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl hover:bg-zinc-100/80 dark:hover:bg-zinc-800/70 transition-colors cursor-pointer space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="text-xs font-bold text-zinc-400 w-4">#{index + 1}</span>
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                              item.person.avatarColor || 'bg-rose-600 text-white'
                            }`}
                          >
                            {getInitials(item.person.name)}
                          </div>
                          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                            {item.person.name}
                          </span>
                        </div>
                        <span className="text-sm font-bold text-rose-600 dark:text-rose-400">
                          {formatCurrency(absVal, preferences.currency)}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-zinc-200 dark:bg-zinc-700 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-rose-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
