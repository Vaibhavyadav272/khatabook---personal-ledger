import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import { Expense, ExpenseCategory, PaymentMethod } from '../../types';
import { EXPENSE_CATEGORIES, PAYMENT_METHODS } from '../../data/initialData';
import { Receipt, Calendar, CreditCard, Tag, User, FileText, Check } from 'lucide-react';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenseToEdit?: Expense | null;
}

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  isOpen,
  onClose,
  expenseToEdit,
}) => {
  const { people, addExpense, updateExpense, preferences } = useData();
  const { error: toastError } = useToast();

  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Food & Dining');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [description, setDescription] = useState('');
  const [personId, setPersonId] = useState<string>('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (expenseToEdit) {
      setAmount(expenseToEdit.amount.toString());
      setCategory(expenseToEdit.category);
      setExpenseDate(expenseToEdit.expenseDate);
      setPaymentMethod(expenseToEdit.paymentMethod);
      setDescription(expenseToEdit.description);
      setPersonId(expenseToEdit.personId || '');
      setNotes(expenseToEdit.notes || '');
    } else {
      setAmount('');
      setCategory('Food & Dining');
      setExpenseDate(new Date().toISOString().split('T')[0]);
      setPaymentMethod('UPI');
      setDescription('');
      setPersonId('');
      setNotes('');
    }
  }, [expenseToEdit, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toastError('Please enter a valid expense amount');
      return;
    }

    if (!description.trim()) {
      toastError('Please enter a description for the expense');
      return;
    }

    if (expenseToEdit) {
      updateExpense(expenseToEdit.id, {
        amount: numAmount,
        category,
        expenseDate,
        paymentMethod,
        description: description.trim(),
        personId: personId || undefined,
        notes: notes.trim() || undefined,
      });
    } else {
      addExpense({
        amount: numAmount,
        category,
        expenseDate,
        paymentMethod,
        description: description.trim(),
        personId: personId || undefined,
        notes: notes.trim() || undefined,
      });
    }

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={expenseToEdit ? 'Edit Expense' : 'Add Personal Expense'}
      subtitle="Track your daily out-of-pocket spending"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Amount Input */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5">
            Expense Amount ({preferences.currencySymbol}) <span className="text-rose-500">*</span>
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
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full pl-9 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-base font-bold text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5">
            Description / Item <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <Receipt className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Swiggy Lunch, Uber to office, Metro recharge"
              className="w-full pl-10 pr-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
          </div>
        </div>

        {/* Category & Payment Method in Two Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Category */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5">
              Category <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Tag className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3 pointer-events-none" />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                className="w-full pl-10 pr-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              >
                {EXPENSE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5">
              Payment Method <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <CreditCard className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3 pointer-events-none" />
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full pl-10 pr-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              >
                {PAYMENT_METHODS.map((pm) => (
                  <option key={pm} value={pm}>
                    {pm}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Date & Optional Related Person */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Expense Date */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5">
              Date <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3 pointer-events-none" />
              <input
                type="date"
                required
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
            </div>
          </div>

          {/* Related Person (Optional) */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5">
              With / For Person <span className="text-zinc-400 font-normal">(Optional)</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3 pointer-events-none" />
              <select
                value={personId}
                onChange={(e) => setPersonId(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              >
                <option value="">None (Personal)</option>
                {people.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5">
            Notes / Receipt Tag <span className="text-zinc-400 font-normal">(Optional)</span>
          </label>
          <div className="relative">
            <FileText className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Tax deductible, office reimbursement"
              className="w-full pl-10 pr-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
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
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 active:scale-98 rounded-xl transition-all shadow-xs"
          >
            <Check className="w-4 h-4" />
            <span>{expenseToEdit ? 'Save Changes' : 'Record Expense'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
