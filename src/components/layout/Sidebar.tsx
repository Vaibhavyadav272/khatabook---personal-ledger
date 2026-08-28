import React from 'react';
import {
  LayoutDashboard,
  Users,
  ArrowLeftRight,
  ReceiptText,
  BarChart3,
  Settings,
  Layers,
  Sparkles,
} from 'lucide-react';
import { ActiveTab } from '../../types';
import { useData } from '../../context/DataContext';

interface SidebarProps {
  activeTab: ActiveTab;
  onNavigate?: (tab: ActiveTab) => void;
  onSelectTab?: (tab: ActiveTab) => void;
  onOpenAddPerson?: () => void;
  onOpenAddTransaction?: () => void;
  onOpenSplitExpense?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onNavigate,
  onSelectTab,
  onOpenAddPerson,
  onOpenAddTransaction,
  onOpenSplitExpense,
}) => {
  const { people, transactions } = useData();

  const handleSelectTab = (tab: ActiveTab) => {
    if (onNavigate) {
      onNavigate(tab);
    } else if (onSelectTab) {
      onSelectTab(tab);
    }
  };

  const navItems = [
    {
      id: 'dashboard' as ActiveTab,
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'people' as ActiveTab,
      label: 'People',
      icon: Users,
      badge: people.length > 0 ? people.length : null,
      highlight: true,
    },
    {
      id: 'transactions' as ActiveTab,
      label: 'Transactions',
      icon: ArrowLeftRight,
      badge: transactions.length > 0 ? transactions.length : null,
    },
    {
      id: 'expenses' as ActiveTab,
      label: 'Expenses',
      icon: ReceiptText,
      badge: null,
    },
    {
      id: 'analytics' as ActiveTab,
      label: 'Analytics',
      icon: BarChart3,
      badge: null,
    },
    {
      id: 'settings' as ActiveTab,
      label: 'Settings',
      icon: Settings,
      badge: null,
    },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/70 shrink-0 h-screen sticky top-0">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-6 h-16 border-b border-zinc-200/80 dark:border-zinc-800/80">
        <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/20">
          <Layers className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-bold text-zinc-900 dark:text-zinc-100 text-base leading-tight tracking-tight">
            Khatabook
          </h1>
          <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> People Ledger
          </span>
        </div>
      </div>

      {/* Navigation List */}
      <div className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
        <div className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          Main Menu
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-zinc-500 dark:text-zinc-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== null && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="p-4 m-3 rounded-2xl bg-zinc-100 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 text-xs text-zinc-500 dark:text-zinc-400">
        <p className="font-medium text-zinc-800 dark:text-zinc-200 mb-0.5">Person-by-Person Ledger</p>
        <p className="text-[11px] leading-relaxed">
          Track loans, debts, repayments & split expenses securely.
        </p>
      </div>
    </aside>
  );
};
