import React, { useState, useMemo } from 'react';
import { Modal } from '../common/Modal';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import { ExpenseCategory, PaymentMethod } from '../../types';
import { EXPENSE_CATEGORIES, PAYMENT_METHODS } from '../../data/initialData';
import { formatCurrency, getInitials } from '../../utils/formatters';
import {
  Split,
  Receipt,
  Calendar,
  CreditCard,
  Tag,
  Users,
  Check,
  Percent,
  Plus,
  Trash2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface SplitExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SplitShare {
  personId: string;
  amount: number;
}

export const SplitExpenseModal: React.FC<SplitExpenseModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { people, addExpense, addTransaction, preferences } = useData();
  const { success: toastSuccess, error: toastError } = useToast();

  const [description, setDescription] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Food & Dining');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);

  // Selected participants (IDs of people who share the expense)
  const [selectedPersonIds, setSelectedPersonIds] = useState<string[]>([]);
  const [includeYourself, setIncludeYourself] = useState(true);
  const [splitMethod, setSplitMethod] = useState<'equal' | 'custom'>('equal');
  const [customShares, setCustomShares] = useState<Record<string, string>>({});

  const totalNum = parseFloat(totalAmount) || 0;

  const togglePerson = (id: string) => {
    if (selectedPersonIds.includes(id)) {
      setSelectedPersonIds(selectedPersonIds.filter((pId) => pId !== id));
      const nextCustom = { ...customShares };
      delete nextCustom[id];
      setCustomShares(nextCustom);
    } else {
      setSelectedPersonIds([...selectedPersonIds, id]);
    }
  };

  const totalParticipantsCount = selectedPersonIds.length + (includeYourself ? 1 : 0);

  // Calculate shares based on mode
  const calculatedShares = useMemo<{ yourShare: number; personShares: Record<string, number> }>(() => {
    if (splitMethod === 'equal') {
      if (totalParticipantsCount === 0 || totalNum <= 0) return { yourShare: 0, personShares: {} };
      const sharePerPerson = Number((totalNum / totalParticipantsCount).toFixed(2));
      const personShares: Record<string, number> = {};
      selectedPersonIds.forEach((id) => {
        personShares[id] = sharePerPerson;
      });
      const yourShare = includeYourself ? sharePerPerson : 0;
      return { yourShare, personShares };
    } else {
      // Custom
      const personShares: Record<string, number> = {};
      let totalAssigned = 0;
      selectedPersonIds.forEach((id) => {
        const val = parseFloat(customShares[id] || '0') || 0;
        personShares[id] = val;
        totalAssigned += val;
      });
      const yourShare = Math.max(0, totalNum - totalAssigned);
      return { yourShare, personShares };
    }
  }, [splitMethod, totalNum, totalParticipantsCount, selectedPersonIds, includeYourself, customShares]);

  const handleCustomShareChange = (personId: string, val: string) => {
    setCustomShares((prev) => ({
      ...prev,
      [personId]: val,
    }));
  };

  const handleSelectAllPeople = () => {
    if (selectedPersonIds.length === people.length) {
      setSelectedPersonIds([]);
    } else {
      setSelectedPersonIds(people.map((p) => p.id));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (totalNum <= 0) {
      toastError('Please enter a valid bill amount');
      return;
    }

    if (!description.trim()) {
      toastError('Please enter a bill description (e.g. Dinner, Trip Hotel)');
      return;
    }

    if (selectedPersonIds.length === 0) {
      toastError('Please select at least one other person to split with');
      return;
    }

    // Check sum if custom
    if (splitMethod === 'custom') {
      const assignedSum = selectedPersonIds.reduce(
        (sum, id) => sum + (calculatedShares.personShares[id] || 0),
        0
      );
      if (assignedSum > totalNum) {
        toastError(
          `Assigned shares (${formatCurrency(assignedSum, preferences.currency)}) exceed the total bill (${formatCurrency(totalNum, preferences.currency)})`
        );
        return;
      }
    }

    // 1. Record the full out-of-pocket Expense in user's expense tracker
    addExpense({
      amount: totalNum,
      category,
      expenseDate,
      paymentMethod,
      description: `${description.trim()} (Group Bill)`,
      notes: `Split among ${totalParticipantsCount} people (${selectedPersonIds
        .map((id) => people.find((p) => p.id === id)?.name)
        .filter(Boolean)
        .join(', ')})`,
    });

    // 2. Automatically record a "gave" transaction in each participant's ledger
    selectedPersonIds.forEach((pId) => {
      const shareAmount = calculatedShares.personShares[pId] || 0;
      if (shareAmount > 0) {
        addTransaction({
          personId: pId,
          type: 'gave',
          amount: shareAmount,
          transactionDate: expenseDate,
          description: `${description.trim()} (Split share)`,
          category: category,
          notes: `Split from ${formatCurrency(totalNum, preferences.currency)} total bill`,
        });
      }
    });

    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch (err) {
      console.error(err);
    }

    toastSuccess(`Bill split recorded! ${selectedPersonIds.length} person ledgers updated automatically.`);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Split Group Expense"
      subtitle="Record a bill paid by you and auto-split shares into each person's ledger"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Bill Overview Card */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-700/60">
          {/* Total Bill Amount */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5">
              Total Bill Amount ({preferences.currencySymbol}) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-base font-bold text-zinc-400">
                {preferences.currencySymbol}
              </span>
              <input
                type="number"
                min="0.01"
                step="any"
                required
                autoFocus
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-base font-bold text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5">
              Bill Name / Event <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Receipt className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Dinner at Olive Bistro, Goa Airbnb"
                className="w-full pl-10 pr-3.5 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
              className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5">
              Date
            </label>
            <input
              type="date"
              required
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Split Configuration */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
              Select People to Split With <span className="text-rose-500">*</span>
            </label>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAllPeople}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
              >
                {selectedPersonIds.length === people.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
          </div>

          {/* Split Mode Selector (Equally vs Custom) */}
          <div className="flex items-center gap-2 p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-xl text-xs font-medium">
            <button
              type="button"
              onClick={() => setSplitMethod('equal')}
              className={`flex-1 py-2 rounded-lg transition-all ${
                splitMethod === 'equal'
                  ? 'bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-400 font-bold shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
              }`}
            >
              Split Equally (÷ {totalParticipantsCount || 1})
            </button>
            <button
              type="button"
              onClick={() => setSplitMethod('custom')}
              className={`flex-1 py-2 rounded-lg transition-all ${
                splitMethod === 'custom'
                  ? 'bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-400 font-bold shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
              }`}
            >
              Custom Shares (Exact ₹)
            </button>
          </div>

          {/* Include Yourself Toggle */}
          <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-200/80 dark:border-zinc-700/60">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
                You
              </div>
              <div>
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  Include yourself in the split
                </span>
                <p className="text-[11px] text-zinc-400">
                  Your personal share:{' '}
                  <strong className="text-zinc-700 dark:text-zinc-300">
                    {formatCurrency(calculatedShares.yourShare, preferences.currency)}
                  </strong>
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={includeYourself}
                onChange={(e) => setIncludeYourself(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-zinc-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          {/* People Grid Selection */}
          {people.length === 0 ? (
            <div className="p-4 text-center text-xs text-zinc-400 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800">
              No people added yet. Add people to your contacts first to split bills.
            </div>
          ) : (
            <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
              {people.map((person) => {
                const isSelected = selectedPersonIds.includes(person.id);
                const share = calculatedShares.personShares[person.id] || 0;

                return (
                  <div
                    key={person.id}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800'
                        : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300'
                    }`}
                  >
                    <div
                      onClick={() => togglePerson(person.id)}
                      className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0"
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                          person.avatarColor || 'bg-indigo-600 text-white'
                        }`}
                      >
                        {getInitials(person.name)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                          {person.name}
                        </div>
                        <div className="text-[10px] text-zinc-400 truncate">
                          {person.phone || 'Contact'}
                        </div>
                      </div>
                    </div>

                    {/* Share Amount Input or Pill */}
                    {isSelected ? (
                      splitMethod === 'custom' ? (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-xs font-semibold text-zinc-400">
                            {preferences.currencySymbol}
                          </span>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={customShares[person.id] || ''}
                            onChange={(e) => handleCustomShareChange(person.id, e.target.value)}
                            placeholder="0"
                            className="w-20 px-2 py-1 bg-white dark:bg-zinc-800 border border-indigo-300 dark:border-indigo-700 rounded-lg text-xs font-bold text-zinc-900 dark:text-zinc-100 focus:outline-hidden"
                          />
                        </div>
                      ) : (
                        <div className="text-right shrink-0">
                          <div className="text-xs font-bold text-indigo-700 dark:text-indigo-400">
                            {formatCurrency(share, preferences.currency)}
                          </div>
                          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                            + Will owe you
                          </div>
                        </div>
                      )
                    ) : (
                      <button
                        type="button"
                        onClick={() => togglePerson(person.id)}
                        className="px-2.5 py-1 text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-lg hover:bg-indigo-100 hover:text-indigo-700 transition-colors shrink-0"
                      >
                        + Add to Split
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Real-time Split Summary Banner */}
        {selectedPersonIds.length > 0 && totalNum > 0 && (
          <div className="p-3.5 bg-indigo-50/80 dark:bg-indigo-950/60 rounded-2xl border border-indigo-200 dark:border-indigo-800 text-xs space-y-1.5">
            <div className="font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>Automatic Ledger Update Preview</span>
            </div>
            <div className="text-zinc-600 dark:text-zinc-300">
              Saving this split will create{' '}
              <strong>{selectedPersonIds.length} money-given ledger entries</strong> totaling{' '}
              <strong>
                {formatCurrency(
                  selectedPersonIds.reduce(
                    (sum, id) => sum + (calculatedShares.personShares[id] || 0),
                    0
                  ),
                  preferences.currency
                )}
              </strong>{' '}
              owed back to you.
            </div>
          </div>
        )}

        {/* Modal Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 active:scale-98 rounded-xl transition-all shadow-xs"
          >
            <Split className="w-4 h-4" />
            <span>Split & Record Ledgers</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
