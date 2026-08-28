import React, { useState } from 'react';
import {
  Search,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Receipt,
  UserPlus,
  LogOut,
  User as UserIcon,
  Sparkles,
  Layers,
} from 'lucide-react';
import { ActiveTab } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { getInitials } from '../../utils/formatters';

interface NavbarProps {
  activeTab?: ActiveTab;
  onOpenSearch: () => void;
  onOpenAddTransaction: (defaultType?: 'gave' | 'received') => void;
  onOpenAddPerson: () => void;
  onOpenAddExpense: () => void;
  onOpenSplitExpense: () => void;
  onNavigate?: (tab: ActiveTab) => void;
  onOpenAuth?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onOpenSearch,
  onOpenAddTransaction,
  onOpenAddPerson,
  onOpenAddExpense,
  onOpenSplitExpense,
  onNavigate,
  onOpenAuth,
}) => {
  const { user, logout, openAuthModal } = useAuth();
  const { preferences, dashboardMetrics } = useData();
  const [menuOpen, setMenuOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md px-4 sm:px-6">
      {/* Brand & Search */}
      <div className="flex items-center gap-4 lg:gap-8 flex-1 max-w-xl">
        <div className="flex items-center gap-2.5 lg:hidden">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-xs">
            <Layers className="w-5 h-5" />
          </div>
          <span className="font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">Khatabook</span>
        </div>

        {/* Global Search Bar */}
        <button
          type="button"
          onClick={onOpenSearch}
          className="flex items-center gap-3 w-full max-w-sm px-3.5 py-2 text-sm text-zinc-400 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-800/80 hover:bg-zinc-200/70 dark:hover:bg-zinc-800 rounded-xl border border-transparent hover:border-zinc-300 dark:hover:border-zinc-700 transition-all text-left group"
        >
          <Search className="w-4 h-4 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors" />
          <span className="flex-1 truncate">Search people, notes, or bills...</span>
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[11px] font-medium text-zinc-400 bg-white dark:bg-zinc-900 rounded border border-zinc-200 dark:border-zinc-700">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Quick Summary Pill (Desktop) */}
        <div className="hidden xl:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-800 text-xs">
          <span className="text-zinc-500">Net:</span>
          <span
            className={`font-semibold ${
              dashboardMetrics.netBalance > 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : dashboardMetrics.netBalance < 0
                ? 'text-rose-600 dark:text-rose-400'
                : 'text-zinc-600 dark:text-zinc-300'
            }`}
          >
            {preferences.currencySymbol}
            {Math.abs(dashboardMetrics.netBalance).toLocaleString()}
          </span>
        </div>

        {/* Quick Add Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setQuickAddOpen(!quickAddOpen)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-xs active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Entry</span>
          </button>

          {quickAddOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setQuickAddOpen(false)} />
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 py-1.5 z-50 text-sm animate-in fade-in zoom-in-95 duration-100">
                <button
                  type="button"
                  onClick={() => {
                    setQuickAddOpen(false);
                    onOpenAddTransaction('gave');
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left text-zinc-700 dark:text-zinc-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
                >
                  <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                  <div>
                    <div className="font-medium">You Gave Money</div>
                    <div className="text-xs text-zinc-400">Record loan / money given</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setQuickAddOpen(false);
                    onOpenAddTransaction('received');
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left text-zinc-700 dark:text-zinc-200 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-700 dark:hover:text-rose-400 transition-colors"
                >
                  <ArrowDownLeft className="w-4 h-4 text-rose-600" />
                  <div>
                    <div className="font-medium">You Received Money</div>
                    <div className="text-xs text-zinc-400">Record repayment / payment</div>
                  </div>
                </button>

                <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-1" />

                <button
                  type="button"
                  onClick={() => {
                    setQuickAddOpen(false);
                    onOpenAddPerson();
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-left text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <UserPlus className="w-4 h-4 text-indigo-500" />
                  <span>Add New Person</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setQuickAddOpen(false);
                    onOpenAddExpense();
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-left text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <Receipt className="w-4 h-4 text-amber-500" />
                  <span>Add Expense</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setQuickAddOpen(false);
                    onOpenSplitExpense();
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-left text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  <span>Split Bill with Group</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* User Account Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <div className="w-8 h-8 rounded-xl bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900 flex items-center justify-center text-xs font-bold shadow-xs">
              {user ? getInitials(user.name) : '?'}
            </div>
            <div className="hidden md:block text-left">
              <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 leading-tight truncate max-w-[120px]">
                {user ? user.name : 'Guest User'}
              </div>
              <div className="text-[11px] text-zinc-400 truncate max-w-[120px]">
                {user ? user.email : 'Sign In'}
              </div>
            </div>
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 py-1.5 z-50 text-sm animate-in fade-in zoom-in-95 duration-100">
                {user ? (
                  <>
                    <div className="px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
                      <div className="font-semibold text-zinc-900 dark:text-zinc-100">{user.name}</div>
                      <div className="text-xs text-zinc-400 truncate">{user.email}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onNavigate?.('settings');
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-left text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                      <UserIcon className="w-4 h-4 text-zinc-400" />
                      <span>Account Settings</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-left text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      if (onOpenAuth) {
                        onOpenAuth();
                      } else {
                        openAuthModal('login');
                      }
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left text-emerald-600 font-medium hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                  >
                    <UserIcon className="w-4 h-4" />
                    <span>Sign In / Register</span>
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
