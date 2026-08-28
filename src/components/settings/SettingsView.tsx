import React, { useState, useRef } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { CURRENCIES, DATE_FORMATS } from '../../data/initialData';
import {
  User,
  Globe,
  Moon,
  Sun,
  Laptop,
  Download,
  Upload,
  RefreshCw,
  Trash2,
  LogOut,
  FileSpreadsheet,
  FileCode,
  Check,
  AlertTriangle,
  Database,
} from 'lucide-react';
import { ConfirmDialog } from '../common/ConfirmDialog';

interface SettingsViewProps {
  onOpenAuthModal: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onOpenAuthModal }) => {
  const {
    preferences,
    updatePreferences,
    expenses,
    resetToSampleData,
    clearAllData,
    exportJSON,
    exportCSV,
    importJSON,
  } = useData();
  const { currentUser, logout, updateProfile } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();

  const [name, setName] = useState(currentUser?.name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [currency, setCurrency] = useState(preferences.currency);
  const [dateFormat, setDateFormat] = useState(preferences.dateFormat);
  const [theme, setTheme] = useState(preferences.theme);
  const [savingProfile, setSavingProfile] = useState(false);

  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toastError('Name cannot be empty');
      return;
    }

    setSavingProfile(true);
    await updateProfile({
      name: name.trim(),
      phone: phone.trim() || undefined,
    });
    setSavingProfile(false);
  };

  const handleCurrencyChange = (currCode: string) => {
    const selected = CURRENCIES.find((c) => c.code === currCode);
    if (selected) {
      setCurrency(selected.code);
      updatePreferences({
        currency: selected.code,
        currencySymbol: selected.symbol,
      });
      toastSuccess(`Default currency updated to ${selected.name} (${selected.symbol})`);
    }
  };

  const handleDateFormatChange = (fmt: any) => {
    setDateFormat(fmt);
    updatePreferences({ dateFormat: fmt });
    toastSuccess('Date format preference updated');
  };

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    updatePreferences({ theme: newTheme });
  };

  // Export Expenses CSV
  const handleExportExpensesCSV = () => {
    const headers = ['Expense ID', 'Amount', 'Category', 'Date', 'Payment Method', 'Description', 'Notes'];
    const rows = expenses.map((e) => {
      return [
        e.id,
        e.amount,
        `"${e.category}"`,
        e.expenseDate,
        `"${e.paymentMethod}"`,
        `"${e.description.replace(/"/g, '""')}"`,
        `"${(e.notes || '').replace(/"/g, '""')}"`,
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', encodeURI(csvContent));
    downloadAnchor.setAttribute('download', `expenses_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    toastSuccess('Expenses CSV exported');
  };

  // Import JSON Backup directly into Supabase
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], 'UTF-8');
      fileReader.onload = async (event) => {
        const content = event.target?.result as string;
        if (content) {
          await importJSON(content);
        }
      };
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
          Application Settings
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Manage your cloud-synced account profile, regional preferences, and database backups.
        </p>
      </div>

      {/* User Profile Card */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-7 border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                User Profile
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-zinc-400">
                  {currentUser?.email ? currentUser.email : 'Authenticated User'}
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold px-2 py-0.5 rounded-full">
                  <Database className="w-2.5 h-2.5" />
                  <span>Cloud Synced</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenAuthModal}
              className="px-3.5 py-1.5 text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-xl transition-colors cursor-pointer"
            >
              Switch Account
            </button>
            <button
              type="button"
              onClick={logout}
              className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5">
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={savingProfile}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-98 disabled:opacity-60 text-white rounded-xl text-xs font-semibold transition-all shadow-xs cursor-pointer"
            >
              {savingProfile ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
              <span>Update Profile</span>
            </button>
          </div>
        </form>
      </div>

      {/* Regional & Currency Preferences */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-7 border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Currency & Regional Formats
            </h2>
            <p className="text-xs text-zinc-400">
              Customize how currency symbols, numbers, and dates are displayed across all ledgers
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
          {/* Currency Dropdown */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5">
              Default Currency
            </label>
            <select
              value={currency}
              onChange={(e) => handleCurrencyChange(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 font-medium focus:outline-hidden"
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.symbol} — {c.name} ({c.code})
                </option>
              ))}
            </select>
          </div>

          {/* Date Format */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5">
              Date Format
            </label>
            <select
              value={dateFormat}
              onChange={(e) => handleDateFormatChange(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 font-medium focus:outline-hidden"
            >
              {DATE_FORMATS.map((f) => (
                <option key={f.code} value={f.code}>
                  {f.label} ({f.example})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Theme Preference */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-2">
            Appearance / Theme
          </label>
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => handleThemeChange('light')}
              className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                theme === 'light'
                  ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-400 text-amber-900 dark:text-amber-300 ring-2 ring-amber-400/20'
                  : 'bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100'
              }`}
            >
              <Sun className="w-4 h-4 text-amber-500" />
              <span>Light Mode</span>
            </button>

            <button
              type="button"
              onClick={() => handleThemeChange('dark')}
              className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                theme === 'dark'
                  ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-900 dark:text-indigo-300 ring-2 ring-indigo-500/20'
                  : 'bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100'
              }`}
            >
              <Moon className="w-4 h-4 text-indigo-500" />
              <span>Dark Mode</span>
            </button>

            <button
              type="button"
              onClick={() => handleThemeChange('system')}
              className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                theme === 'system'
                  ? 'bg-zinc-200 dark:bg-zinc-700 border-zinc-400 text-zinc-900 dark:text-zinc-100 ring-2 ring-zinc-400/20'
                  : 'bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100'
              }`}
            >
              <Laptop className="w-4 h-4 text-zinc-500" />
              <span>System Default</span>
            </button>
          </div>
        </div>
      </div>

      {/* Backup, Export & Import */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-7 border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Data Backup & Export
            </h2>
            <p className="text-xs text-zinc-400">
              Export your records to Excel CSV or download a complete JSON offline backup
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
          {/* Export JSON */}
          <button
            type="button"
            onClick={exportJSON}
            className="flex flex-col items-start p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/40 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors group text-left cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2">
              <FileCode className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
              Full JSON Backup
            </div>
            <div className="text-[11px] text-zinc-400 mt-0.5">
              Exports people, ledgers and expense data
            </div>
          </button>

          {/* Export Transactions CSV */}
          <button
            type="button"
            onClick={exportCSV}
            className="flex flex-col items-start p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/40 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors group text-left cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-2">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
              Transactions (CSV)
            </div>
            <div className="text-[11px] text-zinc-400 mt-0.5">
              Spreadsheet of loans given and repayments
            </div>
          </button>

          {/* Export Expenses CSV */}
          <button
            type="button"
            onClick={handleExportExpensesCSV}
            className="flex flex-col items-start p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/40 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors group text-left cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-2">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
              Expenses (CSV)
            </div>
            <div className="text-[11px] text-zinc-400 mt-0.5">
              Spreadsheet of out-of-pocket spending
            </div>
          </button>
        </div>

        {/* Restore Section */}
        <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
              Restore from JSON Backup
            </div>
            <div className="text-[11px] text-zinc-400">
              Upload a previously exported backup file to restore your ledgers into your Supabase database.
            </div>
          </div>

          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImportFile}
              accept=".json"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-xl transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Select Backup File</span>
            </button>
          </div>
        </div>
      </div>

      {/* Danger Zone & Reset */}
      <div className="bg-rose-50/50 dark:bg-rose-950/20 rounded-3xl p-6 sm:p-7 border border-rose-200/80 dark:border-rose-900/60 shadow-xs space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-rose-900 dark:text-rose-200">
              Data Management & Sample Dataset
            </h2>
            <p className="text-xs text-rose-700/80 dark:text-rose-400/80">
              Populate sample contacts or wipe all financial data from your account.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => setIsResetConfirmOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 rounded-xl transition-colors shadow-xs cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-indigo-500" />
            <span>Generate Sample Contacts</span>
          </button>

          <button
            type="button"
            onClick={() => setIsClearConfirmOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-colors shadow-xs cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Wipe All My Data</span>
          </button>
        </div>
      </div>

      {/* Reset Confirmation */}
      <ConfirmDialog
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={resetToSampleData}
        title="Populate Sample Contacts?"
        message="This will create sample contacts (Rahul, Amit, Priya) and sample ledger records in your private Supabase database. Are you sure?"
        confirmLabel="Generate Sample Contacts"
      />

      {/* Clear Confirmation */}
      <ConfirmDialog
        isOpen={isClearConfirmOpen}
        onClose={() => setIsClearConfirmOpen(false)}
        onConfirm={clearAllData}
        title="Clear All Ledger Data?"
        message="This action is irreversible and will delete all your people, transactions, expenses, and notes from the database."
        confirmLabel="Delete Everything"
        isDestructive
      />
    </div>
  );
};
