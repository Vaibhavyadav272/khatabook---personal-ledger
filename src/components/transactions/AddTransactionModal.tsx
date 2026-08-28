import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Person, Transaction, TransactionType } from '../../types';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import { ArrowUpRight, ArrowDownLeft, Calendar, Tag, FileText, Check } from 'lucide-react';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: TransactionType;
  defaultPersonId?: string;
  transactionToEdit?: Transaction | null;
}

const CATEGORIES = [
  'Loan',
  'Food',
  'Travel',
  'Shopping',
  'Bills',
  'Education',
  'Entertainment',
  'Repayment',
  'Other',
];

const PRESET_DESCRIPTIONS = [
  'Loan',
  'Dinner',
  'Lunch',
  'Travel',
  'Shopping',
  'Borrowed money',
  'Repayment',
  'Shared bill',
  'Emergency cash',
];

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  onClose,
  defaultType = 'gave',
  defaultPersonId,
  transactionToEdit,
}) => {
  const { people, addTransaction, updateTransaction, preferences } = useData();
  const { error: toastError } = useToast();

  const [personId, setPersonId] = useState<string>('');
  const [type, setType] = useState<TransactionType>(defaultType);
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<string>('Loan');
  const [description, setDescription] = useState<string>('');
  const [transactionDate, setTransactionDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (transactionToEdit) {
      setPersonId(transactionToEdit.personId);
      setType(transactionToEdit.type);
      setAmount(transactionToEdit.amount.toString());
      setCategory(transactionToEdit.category || 'Loan');
      setDescription(transactionToEdit.description || '');
      setTransactionDate(transactionToEdit.transactionDate || new Date().toISOString().split('T')[0]);
      setNotes(transactionToEdit.notes || '');
    } else {
      setPersonId(defaultPersonId || (people.length > 0 ? people[0].id : ''));
      setType(defaultType);
      setAmount('');
      setCategory(defaultType === 'gave' ? 'Loan' : 'Repayment');
      setDescription('');
      setTransactionDate(new Date().toISOString().split('T')[0]);
      setNotes('');
    }
  }, [transactionToEdit, defaultType, defaultPersonId, people, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!personId) {
      toastError('Please select a person');
      return;
    }
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toastError('Please enter a valid positive amount');
      return;
    }
    if (!description.trim()) {
      toastError('Please enter a description');
      return;
    }

    if (transactionToEdit) {
      updateTransaction(transactionToEdit.id, {
        personId,
        type,
        amount: numAmount,
        category,
        description: description.trim(),
        transactionDate,
        notes: notes.trim() || undefined,
      });
    } else {
      addTransaction({
        personId,
        type,
        amount: numAmount,
        category,
        description: description.trim(),
        transactionDate,
        notes: notes.trim() || undefined,
      });
    }

    onClose();
  };

  const selectedPerson = people.find((p) => p.id === personId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={transactionToEdit ? 'Edit Transaction' : 'Record Money Transaction'}
      subtitle={
        type === 'gave'
          ? `You are recording money you gave to ${selectedPerson?.name || 'a person'}`
          : `You are recording money you received from ${selectedPerson?.name || 'a person'}`
      }
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Transaction Type Switcher */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-2">
            Transaction Type <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => {
                setType('gave');
                if (category === 'Repayment') setCategory('Loan');
              }}
              className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl border text-sm font-semibold transition-all ${
                type === 'gave'
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                  : 'bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              <ArrowUpRight className="w-4 h-4 text-emerald-600" />
              <span>I Gave Money</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setType('received');
                if (category === 'Loan') setCategory('Repayment');
              }}
              className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl border text-sm font-semibold transition-all ${
                type === 'received'
                  ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-500 text-rose-700 dark:text-rose-300 ring-2 ring-rose-500/20'
                  : 'bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              <ArrowDownLeft className="w-4 h-4 text-rose-600" />
              <span>I Received Money</span>
            </button>
          </div>
          <div className="text-[11px] text-zinc-400 mt-1.5 px-1">
            {type === 'gave'
              ? 'Increases what they owe you (or reduces what you owe them)'
              : 'Reduces what they owe you (or increases what you owe them)'}
          </div>
        </div>

        {/* Person Selector */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5">
            Person <span className="text-rose-500">*</span>
          </label>
          <select
            required
            value={personId}
            onChange={(e) => setPersonId(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          >
            {people.length === 0 && <option value="">No people available — please add one</option>}
            {people.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} {p.phone ? `(${p.phone})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Amount Input */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5">
            Amount ({preferences.currencySymbol}) <span className="text-rose-500">*</span>
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
              autoFocus={!transactionToEdit}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full pl-9 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-base font-bold text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Date */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5">
            Date <span className="text-rose-500">*</span>
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

        {/* Description & Presets */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5">
            Description <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Lunch bill share, borrowed cash, loan"
            className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
          {/* Quick preset description pills */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {PRESET_DESCRIPTIONS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setDescription(preset)}
                className="px-2 py-0.5 text-xs bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-md transition-colors"
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5">
            Category <span className="text-zinc-400 font-normal">(Optional)</span>
          </label>
          <div className="relative">
            <Tag className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full pl-10 pr-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Optional Notes */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5">
            Notes <span className="text-zinc-400 font-normal">(Optional)</span>
          </label>
          <div className="relative">
            <FileText className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Paid via UPI, will return next week"
              className="w-full pl-10 pr-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Submit */}
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
            <Check className="w-4 h-4" />
            <span>{transactionToEdit ? 'Save Changes' : 'Record Transaction'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
