import React from 'react';
import { LayoutDashboard, Users, ArrowLeftRight, ReceiptText, BarChart3, Settings } from 'lucide-react';
import { ActiveTab } from '../../types';

interface BottomNavProps {
  activeTab: ActiveTab;
  onNavigate?: (tab: ActiveTab) => void;
  onSelectTab?: (tab: ActiveTab) => void;
  onOpenAddTransaction?: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onNavigate,
  onSelectTab,
  onOpenAddTransaction,
}) => {
  const handleSelectTab = (tab: ActiveTab) => {
    if (onNavigate) {
      onNavigate(tab);
    } else if (onSelectTab) {
      onSelectTab(tab);
    }
  };

  const items = [
    { id: 'dashboard' as ActiveTab, label: 'Home', icon: LayoutDashboard },
    { id: 'people' as ActiveTab, label: 'People', icon: Users },
    { id: 'transactions' as ActiveTab, label: 'History', icon: ArrowLeftRight },
    { id: 'expenses' as ActiveTab, label: 'Expenses', icon: ReceiptText },
    { id: 'analytics' as ActiveTab, label: 'Stats', icon: BarChart3 },
    { id: 'settings' as ActiveTab, label: 'Settings', icon: Settings },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800 pb-safe">
      <div className="grid grid-cols-6 h-16">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelectTab(item.id)}
              className={`flex flex-col items-center justify-center gap-1 transition-colors relative ${
                isActive
                  ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] leading-tight truncate">{item.label}</span>
              {isActive && (
                <div className="absolute top-0 w-8 h-0.5 bg-emerald-600 dark:bg-emerald-400 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
