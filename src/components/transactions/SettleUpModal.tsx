import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../utils/formatters';
import { HandCoins, Check, Calendar, FileText } from 'lucide-react';
import confetti from 'canvas-confetti';

interface SettleUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  personId: string | null;
}

export const SettleUpModal: React.FC<SettleUpModalProps> = ({ isOpen, onClose, personId }) => {
  const { people, getPersonSummary, recordSettlement, preferences } = useData();
  const { error: toastError } = useToast();

  const person = people.find((p) => p.id === personId);
  const summary = person ? getPersonSummary(person.id) : null;

  const [settleAmount, setSettleAmount] = useState('');
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  const absBalance = summary ? Math.abs(summary.netBalance) : 0;
  const isOwesYou = summary?.status === 'owes_you';
  const isYouOwe = summary?.status === 'you_owe';

  useEffect(() => {
    if (summary) {
      setSettleAmount(Math.abs(summary.netBalance).toString());
      setTransactionDate(new Date().toISOString().split('T')[0]);
      setNotes('Settlement completed');
    }
  }, [summary, isOpen]);

  if (!person || !summary) return null;

  const handleFullSettle = () => {
    setSettleAmount(absBalance.toString());
  };

  const handleHalfSettle = () => {
    setSettleAmount((absBalance / 2).toFixed(2));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(settleAmount);
    if (isNaN(amount) || amount <= 0) {
      toastError('Please enter a valid settlement amount');
      return;
    }

    recordSettlement(person.id, amount, transactionDate, notes.trim() || undefined);

    // If fully settled, trigger confetti celebration
    if (Math.abs(amount - absBalance) < 0.01) {
      try {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
        });
      } catch (err) {
        console.error(err);
      }
    }

    onClose();
  };

  const enteredAmount = parseFloat(settleAmount) || 0;
  const projectedRemaining = Math.max(0, absBalance - enteredAmount);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Settle with ${person.name}`}
      subtitle="Record a full or partial debt repayment"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Outstanding Balance Banner */}
        <div
          className={`p-4 rounded-2xl border ${
            isOwesYou
              ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
              : isYouOwe
              ? 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800'
              : 'bg-zinc-50 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-700'
          }`}
        >
          <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
            {isOwesYou
              ? `${person.name} currently owes you:`
              : isYouOwe
              ? `You currently owe ${person.name}:`
              : 'Ledger status:'}
          </div>
          <div
            className={`text-2xl font-bold mt-1 ${
              isOwesYou
                ? 'text-emerald-700 dark:text-emerald-400'
                : isYouOwe
                ? 'text-rose-700 dark:text-rose-400'
                : 'text-zinc-700 dark:text-zinc-300'
            }`}
          >
            {formatCurrency(absBalance, preferences.currency)}
          </div>
        </div>

        {/* Amount to Settle */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
              Amount to Settle ({preferences.currencySymbol}) <span className="text-rose-500">*</span>
            </label>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleHalfSettle}
                className="text-xs px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              >
                50% Partial
              </button>
              <button
                type="button"
                onClick={handleFullSettle}
                className="text-xs px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold hover:bg-emerald-200 transition-colors"
              >
                Full (100%)
              </button>
            </div>
          </div>

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
              value={settleAmount}
              onChange={(e) => setSettleAmount(e.target.value)}
              placeholder="0.00"
              className="w-full pl-9 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-base font-bold text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Dynamic Preview of New Balance */}
          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 mt-2 px-1">
            <span>Remaining balance after settlement:</span>
            <span
              className={`font-semibold ${
                projectedRemaining === 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-zinc-900 dark:text-zinc-100'
              }`}
            >
              {projectedRemaining === 0
                ? '✓ All Settled (₹0)'
                : formatCurrency(projectedRemaining, preferences.currency)}
            </span>
          </div>
        </div>

        {/* Settlement Date */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5">
            Settlement Date <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <Calendar className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
            <input
              type="date"
              required
              value={transactionDate}
              onChange={(e) => setTransactionDate(e.target.value)}
              className="w-full pl-10 pr-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Note / Payment Mode */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5">
            Note / Payment Mode <span className="text-zinc-400 font-normal">(Optional)</span>
          </label>
          <div className="relative">
            <FileText className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Paid via Google Pay UPI / Cash"
              className="w-full pl-10 pr-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 active:scale-98 rounded-xl transition-all shadow-xs"
          >
            <HandCoins className="w-4 h-4" />
            <span>Record Settlement</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
