import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Expense,
  ExpenseCategory,
  ExpenseSplit,
  PaymentMethod,
  Person,
  PersonBalanceSummary,
  Transaction,
  TransactionType,
  UserPreferences,
} from '../types';
import { calculateDashboardMetrics, calculatePersonBalance } from '../utils/calculations';
import { getAvatarColor } from '../utils/formatters';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { supabase } from '../lib/supabase';

interface DataContextType {
  people: Person[];
  transactions: Transaction[];
  expenses: Expense[];
  preferences: UserPreferences;
  isLoadingData: boolean;
  updatePreferences: (updates: Partial<UserPreferences>) => void;
  refreshData: () => Promise<void>;

  // Person CRUD
  addPerson: (data: { name: string; phone?: string; email?: string; notes?: string }) => Promise<Person | null>;
  updatePerson: (id: string, data: { name: string; phone?: string; email?: string; notes?: string }) => Promise<boolean>;
  deletePerson: (id: string) => Promise<boolean>;
  getPerson: (id: string) => Person | undefined;

  // Transaction CRUD
  addTransaction: (data: {
    personId: string;
    type: TransactionType;
    amount: number;
    category: string;
    description: string;
    transactionDate: string;
    notes?: string;
    isSettlement?: boolean;
  }) => Promise<Transaction | null>;
  updateTransaction: (id: string, data: Partial<Transaction>) => Promise<boolean>;
  deleteTransaction: (id: string) => Promise<boolean>;

  // Settle Up
  recordSettlement: (personId: string, amount: number, transactionDate: string, notes?: string) => Promise<void>;

  // Expense CRUD
  addExpense: (
    data: {
      amount: number;
      category: ExpenseCategory;
      paymentMethod: PaymentMethod;
      description: string;
      expenseDate: string;
      personId?: string;
      notes?: string;
    },
    splits?: ExpenseSplit[]
  ) => Promise<Expense | null>;
  updateExpense: (id: string, data: Partial<Expense>) => Promise<boolean>;
  deleteExpense: (id: string) => Promise<boolean>;

  // Summaries & Calculations
  getPersonSummary: (personId: string) => PersonBalanceSummary | null;
  dashboardMetrics: ReturnType<typeof calculateDashboardMetrics>;

  // Data Actions
  resetToSampleData: () => Promise<void>;
  resetToDemoData: () => Promise<void>; // Alias for backward compatibility
  clearAllData: () => Promise<void>;
  exportJSON: () => void;
  exportCSV: () => void;
  importJSON: (jsonString: string) => Promise<boolean>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Harmless local UI preferences only
const PREFS_KEY = 'khatabook_ui_preferences';

const DEFAULT_PREFERENCES: UserPreferences = {
  currency: 'INR',
  currencySymbol: '₹',
  dateFormat: 'DD/MM/YYYY',
  theme: 'light',
};

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();

  const [people, setPeople] = useState<Person[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);

  // Local non-sensitive UI settings
  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    try {
      const saved = localStorage.getItem(PREFS_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Could not read UI preferences from localStorage', e);
    }
    return DEFAULT_PREFERENCES;
  });

  const updatePreferences = useCallback((updates: Partial<UserPreferences>) => {
    setPreferences((prev) => {
      const next = { ...prev, ...updates };
      try {
        localStorage.setItem(PREFS_KEY, JSON.stringify(next));
      } catch (e) {
        console.warn('Could not save UI preferences to localStorage', e);
      }
      return next;
    });
  }, []);

  // Fetch all user records from Supabase
  const fetchData = useCallback(async (userId: string) => {
    setIsLoadingData(true);
    try {
      // 1. Fetch People
      const { data: peopleData, error: peopleErr } = await supabase
        .from('people')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (peopleErr) {
        console.warn('Error fetching people:', peopleErr.message);
      }

      const formattedPeople: Person[] = (peopleData || []).map((p: any) => ({
        id: p.id,
        userId: p.user_id,
        name: p.name,
        phone: p.phone || undefined,
        email: p.email || undefined,
        notes: p.notes || undefined,
        avatarColor: p.avatar_color || getAvatarColor(p.name),
        createdAt: p.created_at,
        updatedAt: p.updated_at,
      }));

      // 2. Fetch Transactions
      const { data: txData, error: txErr } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('transaction_date', { ascending: false });

      if (txErr) {
        console.warn('Error fetching transactions:', txErr.message);
      }

      const formattedTransactions: Transaction[] = (txData || []).map((t: any) => ({
        id: t.id,
        userId: t.user_id,
        personId: t.person_id,
        type: t.type as TransactionType,
        amount: Number(t.amount),
        category: t.category,
        description: t.description || '',
        transactionDate: t.transaction_date,
        isSettlement: Boolean(t.is_settlement),
        notes: t.notes || undefined,
        createdAt: t.created_at,
        updatedAt: t.updated_at,
      }));

      // 3. Fetch Expenses and Splits
      const { data: expData, error: expErr } = await supabase
        .from('expenses')
        .select(`
          *,
          expense_splits (
            id,
            person_id,
            amount,
            created_at
          )
        `)
        .eq('user_id', userId)
        .order('expense_date', { ascending: false });

      if (expErr) {
        console.warn('Error fetching expenses:', expErr.message);
      }

      const formattedExpenses: Expense[] = (expData || []).map((e: any) => {
        const splits: ExpenseSplit[] = (e.expense_splits || []).map((s: any) => {
          const matchedPerson = formattedPeople.find((p) => p.id === s.person_id);
          return {
            id: s.id,
            expenseId: e.id,
            personId: s.person_id,
            personName: matchedPerson?.name || 'Participant',
            amount: Number(s.amount),
            createdAt: s.created_at,
          };
        });

        return {
          id: e.id,
          userId: e.user_id,
          amount: Number(e.amount),
          category: e.category as ExpenseCategory,
          paymentMethod: e.payment_method as PaymentMethod,
          description: e.description || '',
          expenseDate: e.expense_date,
          personId: e.person_id || undefined,
          notes: e.notes || undefined,
          splits: splits.length > 0 ? splits : undefined,
          createdAt: e.created_at,
          updatedAt: e.updated_at,
        };
      });

      setPeople(formattedPeople);
      setTransactions(formattedTransactions);
      setExpenses(formattedExpenses);
    } catch (err: any) {
      console.error('Error in fetchData:', err);
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  // Synchronize when user logs in or out
  useEffect(() => {
    if (user?.id && isAuthenticated) {
      fetchData(user.id);
    } else {
      // Clear data immediately upon logout or when no user
      setPeople([]);
      setTransactions([]);
      setExpenses([]);
      setIsLoadingData(false);
    }
  }, [user?.id, isAuthenticated, fetchData]);

  // Realtime Subscriptions for multi-device live synchronization
  const isSubscribedRef = useRef(false);
  useEffect(() => {
    if (!user?.id || isSubscribedRef.current) return;

    const channel = supabase
      .channel(`user-sync-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'people', filter: `user_id=eq.${user.id}` },
        () => {
          fetchData(user.id);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions', filter: `user_id=eq.${user.id}` },
        () => {
          fetchData(user.id);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'expenses', filter: `user_id=eq.${user.id}` },
        () => {
          fetchData(user.id);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          isSubscribedRef.current = true;
        }
      });

    return () => {
      isSubscribedRef.current = false;
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchData]);

  const refreshData = useCallback(async () => {
    if (user?.id) {
      await fetchData(user.id);
      toastSuccess('Data refreshed from cloud');
    }
  }, [user?.id, fetchData, toastSuccess]);

  // ---------------------------------------------------------------------------
  // PERSON CRUD
  // ---------------------------------------------------------------------------
  const addPerson = useCallback(
    async (data: { name: string; phone?: string; email?: string; notes?: string }): Promise<Person | null> => {
      if (!user?.id) {
        toastError('Please sign in to add contacts');
        return null;
      }

      const trimmedName = data.name.trim();
      if (!trimmedName) {
        toastError('Person name is required');
        return null;
      }

      const avatarColor = getAvatarColor(trimmedName);

      try {
        const { data: inserted, error } = await supabase
          .from('people')
          .insert({
            user_id: user.id,
            name: trimmedName,
            phone: data.phone?.trim() || null,
            email: data.email?.trim() || null,
            notes: data.notes?.trim() || null,
            avatar_color: avatarColor,
          })
          .select()
          .single();

        if (error || !inserted) {
          toastError(error?.message || 'Failed to add person to database');
          return null;
        }

        const newPerson: Person = {
          id: inserted.id,
          userId: inserted.user_id,
          name: inserted.name,
          phone: inserted.phone || undefined,
          email: inserted.email || undefined,
          notes: inserted.notes || undefined,
          avatarColor: inserted.avatar_color || avatarColor,
          createdAt: inserted.created_at,
          updatedAt: inserted.updated_at,
        };

        setPeople((prev) => [newPerson, ...prev]);
        toastSuccess(`Added ${newPerson.name} to people`);
        return newPerson;
      } catch (err: any) {
        toastError(err?.message || 'Network error while adding person');
        return null;
      }
    },
    [user?.id, toastSuccess, toastError]
  );

  const updatePerson = useCallback(
    async (id: string, data: { name: string; phone?: string; email?: string; notes?: string }): Promise<boolean> => {
      if (!user?.id) return false;

      const trimmedName = data.name.trim();
      if (!trimmedName) {
        toastError('Name cannot be empty');
        return false;
      }

      try {
        const now = new Date().toISOString();
        const { error } = await supabase
          .from('people')
          .update({
            name: trimmedName,
            phone: data.phone?.trim() || null,
            email: data.email?.trim() || null,
            notes: data.notes?.trim() || null,
            updated_at: now,
          })
          .eq('id', id)
          .eq('user_id', user.id);

        if (error) {
          toastError(error.message || 'Failed to update person in database');
          return false;
        }

        setPeople((prev) =>
          prev.map((p) =>
            p.id === id
              ? {
                  ...p,
                  name: trimmedName,
                  phone: data.phone?.trim() || undefined,
                  email: data.email?.trim() || undefined,
                  notes: data.notes?.trim() || undefined,
                  updatedAt: now,
                }
              : p
          )
        );

        toastSuccess('Person updated successfully');
        return true;
      } catch (err: any) {
        toastError(err?.message || 'Error updating person');
        return false;
      }
    },
    [user?.id, toastSuccess, toastError]
  );

  const deletePerson = useCallback(
    async (id: string): Promise<boolean> => {
      if (!user?.id) return false;

      const p = people.find((item) => item.id === id);

      try {
        const { error } = await supabase
          .from('people')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);

        if (error) {
          toastError(error.message || 'Failed to delete person from database');
          return false;
        }

        setPeople((prev) => prev.filter((item) => item.id !== id));
        setTransactions((prev) => prev.filter((t) => t.personId !== id));
        toastSuccess(`Deleted ${p?.name || 'person'} and related records`);
        return true;
      } catch (err: any) {
        toastError(err?.message || 'Error deleting person');
        return false;
      }
    },
    [user?.id, people, toastSuccess, toastError]
  );

  const getPerson = useCallback(
    (id: string) => {
      return people.find((p) => p.id === id);
    },
    [people]
  );

  // ---------------------------------------------------------------------------
  // TRANSACTION CRUD
  // ---------------------------------------------------------------------------
  const addTransaction = useCallback(
    async (data: {
      personId: string;
      type: TransactionType;
      amount: number;
      category: string;
      description: string;
      transactionDate: string;
      notes?: string;
      isSettlement?: boolean;
    }): Promise<Transaction | null> => {
      if (!user?.id) {
        toastError('Please sign in to record transactions');
        return null;
      }

      const numAmount = Number(data.amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        toastError('Please enter a valid amount greater than 0');
        return null;
      }

      try {
        const { data: inserted, error } = await supabase
          .from('transactions')
          .insert({
            user_id: user.id,
            person_id: data.personId,
            type: data.type,
            amount: numAmount,
            category: data.category || 'General',
            description: data.description.trim() || (data.type === 'gave' ? 'Money Given' : 'Money Received'),
            transaction_date: data.transactionDate || new Date().toISOString().split('T')[0],
            is_settlement: Boolean(data.isSettlement),
            notes: data.notes?.trim() || null,
          })
          .select()
          .single();

        if (error || !inserted) {
          toastError(error?.message || 'Failed to save transaction');
          return null;
        }

        const newTx: Transaction = {
          id: inserted.id,
          userId: inserted.user_id,
          personId: inserted.person_id,
          type: inserted.type as TransactionType,
          amount: Number(inserted.amount),
          category: inserted.category,
          description: inserted.description,
          transactionDate: inserted.transaction_date,
          isSettlement: Boolean(inserted.is_settlement),
          notes: inserted.notes || undefined,
          createdAt: inserted.created_at,
          updatedAt: inserted.updated_at,
        };

        setTransactions((prev) => [newTx, ...prev]);

        const person = people.find((p) => p.id === data.personId);
        if (data.isSettlement) {
          toastSuccess(`Settlement of ₹${numAmount} recorded for ${person?.name || 'contact'}`);
        } else {
          toastSuccess(`Transaction of ₹${numAmount} saved`);
        }

        return newTx;
      } catch (err: any) {
        toastError(err?.message || 'Network error saving transaction');
        return null;
      }
    },
    [user?.id, people, toastSuccess, toastError]
  );

  const updateTransaction = useCallback(
    async (id: string, data: Partial<Transaction>): Promise<boolean> => {
      if (!user?.id) return false;

      try {
        const now = new Date().toISOString();
        const updatePayload: any = { updated_at: now };
        if (data.amount !== undefined) updatePayload.amount = Number(data.amount);
        if (data.type !== undefined) updatePayload.type = data.type;
        if (data.category !== undefined) updatePayload.category = data.category;
        if (data.description !== undefined) updatePayload.description = data.description;
        if (data.transactionDate !== undefined) updatePayload.transaction_date = data.transactionDate;
        if (data.notes !== undefined) updatePayload.notes = data.notes;
        if (data.isSettlement !== undefined) updatePayload.is_settlement = data.isSettlement;

        const { error } = await supabase
          .from('transactions')
          .update(updatePayload)
          .eq('id', id)
          .eq('user_id', user.id);

        if (error) {
          toastError(error.message || 'Failed to update transaction');
          return false;
        }

        setTransactions((prev) =>
          prev.map((t) =>
            t.id === id
              ? {
                  ...t,
                  ...data,
                  amount: data.amount !== undefined ? Number(data.amount) : t.amount,
                  updatedAt: now,
                }
              : t
          )
        );

        toastSuccess('Transaction updated');
        return true;
      } catch (err: any) {
        toastError(err?.message || 'Error updating transaction');
        return false;
      }
    },
    [user?.id, toastSuccess, toastError]
  );

  const deleteTransaction = useCallback(
    async (id: string): Promise<boolean> => {
      if (!user?.id) return false;

      try {
        const { error } = await supabase
          .from('transactions')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);

        if (error) {
          toastError(error.message || 'Failed to delete transaction');
          return false;
        }

        setTransactions((prev) => prev.filter((t) => t.id !== id));
        toastSuccess('Transaction deleted');
        return true;
      } catch (err: any) {
        toastError(err?.message || 'Error deleting transaction');
        return false;
      }
    },
    [user?.id, toastSuccess, toastError]
  );

  // ---------------------------------------------------------------------------
  // SETTLE UP LOGIC
  // ---------------------------------------------------------------------------
  const recordSettlement = useCallback(
    async (personId: string, amount: number, transactionDate: string, notes?: string) => {
      const person = people.find((p) => p.id === personId);
      if (!person) return;

      const summary = calculatePersonBalance(personId, person.name, transactions);

      // Determine direction of settlement:
      // If summary.netBalance > 0 (they owe user), user receives money -> type is 'received'
      // If summary.netBalance < 0 (user owes them), user gives money -> type is 'gave'
      let settlementType: TransactionType = 'received';
      let desc = `Settlement payment received from ${person.name}`;

      if (summary.netBalance < 0) {
        settlementType = 'gave';
        desc = `Settlement payment given to ${person.name}`;
      } else {
        settlementType = 'received';
        desc = `Settlement received from ${person.name}`;
      }

      await addTransaction({
        personId,
        type: settlementType,
        amount,
        category: 'Settlement',
        description: desc,
        transactionDate,
        notes: notes || 'Settlement recorded',
        isSettlement: true,
      });
    },
    [people, transactions, addTransaction]
  );

  // ---------------------------------------------------------------------------
  // EXPENSE CRUD
  // ---------------------------------------------------------------------------
  const addExpense = useCallback(
    async (
      data: {
        amount: number;
        category: ExpenseCategory;
        paymentMethod: PaymentMethod;
        description: string;
        expenseDate: string;
        personId?: string;
        notes?: string;
      },
      splits?: ExpenseSplit[]
    ): Promise<Expense | null> => {
      if (!user?.id) {
        toastError('Please sign in to record expenses');
        return null;
      }

      const numAmount = Number(data.amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        toastError('Please enter a valid expense amount');
        return null;
      }

      try {
        // 1. Insert main expense
        const { data: insertedExp, error: expErr } = await supabase
          .from('expenses')
          .insert({
            user_id: user.id,
            amount: numAmount,
            category: data.category,
            payment_method: data.paymentMethod,
            description: data.description.trim(),
            expense_date: data.expenseDate || new Date().toISOString().split('T')[0],
            person_id: data.personId || null,
            notes: data.notes?.trim() || null,
          })
          .select()
          .single();

        if (expErr || !insertedExp) {
          toastError(expErr?.message || 'Failed to save expense');
          return null;
        }

        const formattedSplits: ExpenseSplit[] = [];

        // 2. If splits exist, insert into expense_splits and create corresponding ledger transactions
        if (splits && splits.length > 0) {
          for (const split of splits) {
            if (split.personId !== 'user' && split.amount > 0) {
              const { data: insertedSplit, error: splitErr } = await supabase
                .from('expense_splits')
                .insert({
                  expense_id: insertedExp.id,
                  person_id: split.personId,
                  amount: Number(split.amount),
                })
                .select()
                .single();

              if (!splitErr && insertedSplit) {
                formattedSplits.push({
                  id: insertedSplit.id,
                  expenseId: insertedExp.id,
                  personId: split.personId,
                  personName: split.personName,
                  amount: Number(split.amount),
                });
              }

              // Create auto transaction: user gave money on their behalf
              await addTransaction({
                personId: split.personId,
                type: 'gave',
                amount: Number(split.amount),
                category: data.category,
                description: `Shared expense: ${data.description.trim()}`,
                transactionDate: data.expenseDate,
                notes: 'Auto-split from expense bill',
              });
            }
          }
        }

        const newExpense: Expense = {
          id: insertedExp.id,
          userId: insertedExp.user_id,
          amount: Number(insertedExp.amount),
          category: insertedExp.category as ExpenseCategory,
          paymentMethod: insertedExp.payment_method as PaymentMethod,
          description: insertedExp.description,
          expenseDate: insertedExp.expense_date,
          personId: insertedExp.person_id || undefined,
          notes: insertedExp.notes || undefined,
          splits: formattedSplits.length > 0 ? formattedSplits : undefined,
          createdAt: insertedExp.created_at,
          updatedAt: insertedExp.updated_at,
        };

        setExpenses((prev) => [newExpense, ...prev]);

        if (splits && splits.length > 0) {
          toastSuccess(`Expense of ₹${numAmount} saved and split with participants`);
        } else {
          toastSuccess(`Expense of ₹${numAmount} recorded`);
        }

        return newExpense;
      } catch (err: any) {
        toastError(err?.message || 'Error saving expense');
        return null;
      }
    },
    [user?.id, addTransaction, toastSuccess, toastError]
  );

  const updateExpense = useCallback(
    async (id: string, data: Partial<Expense>): Promise<boolean> => {
      if (!user?.id) return false;

      try {
        const now = new Date().toISOString();
        const updatePayload: any = { updated_at: now };
        if (data.amount !== undefined) updatePayload.amount = Number(data.amount);
        if (data.category !== undefined) updatePayload.category = data.category;
        if (data.paymentMethod !== undefined) updatePayload.payment_method = data.paymentMethod;
        if (data.description !== undefined) updatePayload.description = data.description;
        if (data.expenseDate !== undefined) updatePayload.expense_date = data.expenseDate;
        if (data.notes !== undefined) updatePayload.notes = data.notes;
        if (data.personId !== undefined) updatePayload.person_id = data.personId || null;

        const { error } = await supabase
          .from('expenses')
          .update(updatePayload)
          .eq('id', id)
          .eq('user_id', user.id);

        if (error) {
          toastError(error.message || 'Failed to update expense');
          return false;
        }

        setExpenses((prev) =>
          prev.map((e) =>
            e.id === id
              ? {
                  ...e,
                  ...data,
                  amount: data.amount !== undefined ? Number(data.amount) : e.amount,
                  updatedAt: now,
                }
              : e
          )
        );

        toastSuccess('Expense updated');
        return true;
      } catch (err: any) {
        toastError(err?.message || 'Error updating expense');
        return false;
      }
    },
    [user?.id, toastSuccess, toastError]
  );

  const deleteExpense = useCallback(
    async (id: string): Promise<boolean> => {
      if (!user?.id) return false;

      try {
        const { error } = await supabase
          .from('expenses')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);

        if (error) {
          toastError(error.message || 'Failed to delete expense');
          return false;
        }

        setExpenses((prev) => prev.filter((e) => e.id !== id));
        toastSuccess('Expense deleted');
        return true;
      } catch (err: any) {
        toastError(err?.message || 'Error deleting expense');
        return false;
      }
    },
    [user?.id, toastSuccess, toastError]
  );

  // ---------------------------------------------------------------------------
  // SUMMARIES & CALCULATIONS
  // ---------------------------------------------------------------------------
  const getPersonSummary = useCallback(
    (personId: string) => {
      const p = people.find((item) => item.id === personId);
      if (!p) return null;
      return calculatePersonBalance(personId, p.name, transactions);
    },
    [people, transactions]
  );

  const dashboardMetrics = useMemo(() => {
    return calculateDashboardMetrics(people, transactions, expenses);
  }, [people, transactions, expenses]);

  // ---------------------------------------------------------------------------
  // SAMPLE DATA & RESET (Isolated per user account)
  // ---------------------------------------------------------------------------
  const resetToSampleData = useCallback(async () => {
    if (!user?.id) return;
    try {
      setIsLoadingData(true);
      // Clean existing records first
      await supabase.from('expenses').delete().eq('user_id', user.id);
      await supabase.from('transactions').delete().eq('user_id', user.id);
      await supabase.from('people').delete().eq('user_id', user.id);

      // Insert sample contacts
      const sampleContacts = [
        { name: 'Rahul Sharma', phone: '+91 98765 43210', notes: 'College roommate' },
        { name: 'Amit Verma', phone: '+91 98111 22334', notes: 'Office team lead' },
        { name: 'Priya Patel', phone: '+91 98222 33445', notes: 'Flatmate' },
      ];

      for (const sc of sampleContacts) {
        const { data: p } = await supabase
          .from('people')
          .insert({
            user_id: user.id,
            name: sc.name,
            phone: sc.phone,
            notes: sc.notes,
            avatar_color: getAvatarColor(sc.name),
          })
          .select()
          .single();

        if (p) {
          // Add sample transaction: Rahul owes user 5,000
          if (sc.name === 'Rahul Sharma') {
            await supabase.from('transactions').insert({
              user_id: user.id,
              person_id: p.id,
              type: 'gave',
              amount: 5000,
              category: 'Loan',
              description: 'Trip hotel advance payment',
              transaction_date: new Date().toISOString().split('T')[0],
            });
          } else if (sc.name === 'Amit Verma') {
            // User owes Amit 2,000 (Amit gave user 2000)
            await supabase.from('transactions').insert({
              user_id: user.id,
              person_id: p.id,
              type: 'received',
              amount: 2000,
              category: 'Dinner',
              description: 'Team dinner bill paid by Amit',
              transaction_date: new Date().toISOString().split('T')[0],
            });
          }
        }
      }

      await fetchData(user.id);
      toastSuccess('Sample dataset generated in your private account');
    } catch (err: any) {
      toastError(err?.message || 'Failed to populate sample data');
    } finally {
      setIsLoadingData(false);
    }
  }, [user?.id, fetchData, toastSuccess, toastError]);

  const clearAllData = useCallback(async () => {
    if (!user?.id) return;
    try {
      setIsLoadingData(true);
      await supabase.from('expenses').delete().eq('user_id', user.id);
      await supabase.from('transactions').delete().eq('user_id', user.id);
      await supabase.from('people').delete().eq('user_id', user.id);

      setPeople([]);
      setTransactions([]);
      setExpenses([]);
      toastSuccess('All ledger records deleted from database');
    } catch (err: any) {
      toastError(err?.message || 'Failed to clear data');
    } finally {
      setIsLoadingData(false);
    }
  }, [user?.id, toastSuccess, toastError]);

  // ---------------------------------------------------------------------------
  // EXPORT & IMPORT BACKUPS
  // ---------------------------------------------------------------------------
  const exportJSON = useCallback(() => {
    try {
      const data = {
        exportedAt: new Date().toISOString(),
        version: '2.0-supabase',
        user: { id: user?.id, email: user?.email, name: user?.name },
        people,
        transactions,
        expenses,
        preferences,
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `khatabook_cloud_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toastSuccess('Data backup exported successfully');
    } catch (e) {
      toastError('Failed to export JSON backup');
    }
  }, [people, transactions, expenses, preferences, user, toastSuccess, toastError]);

  const exportCSV = useCallback(() => {
    try {
      const headers = [
        'Transaction ID',
        'Person Name',
        'Type',
        'Amount',
        'Category',
        'Description',
        'Date',
        'Is Settlement',
        'Notes',
      ];
      const rows = transactions.map((tx) => {
        const p = people.find((person) => person.id === tx.personId);
        return [
          tx.id,
          `"${(p?.name || 'Unknown').replace(/"/g, '""')}"`,
          tx.type === 'gave' ? 'Gave (You gave)' : 'Received (You received)',
          tx.amount,
          `"${tx.category || ''}"`,
          `"${(tx.description || '').replace(/"/g, '""')}"`,
          tx.transactionDate,
          tx.isSettlement ? 'Yes' : 'No',
          `"${(tx.notes || '').replace(/"/g, '""')}"`,
        ];
      });

      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `khatabook_ledger_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toastSuccess('Transactions exported to CSV');
    } catch (e) {
      toastError('Failed to export CSV');
    }
  }, [transactions, people, toastSuccess, toastError]);

  const importJSON = useCallback(
    async (jsonString: string): Promise<boolean> => {
      if (!user?.id) {
        toastError('Please sign in first');
        return false;
      }

      try {
        const parsed = JSON.parse(jsonString);
        if (!Array.isArray(parsed.people)) {
          toastError('Invalid backup file format');
          return false;
        }

        setIsLoadingData(true);

        // Map of old person IDs to newly inserted IDs
        const personIdMap: Record<string, string> = {};

        for (const p of parsed.people) {
          const { data: inserted } = await supabase
            .from('people')
            .insert({
              user_id: user.id,
              name: p.name,
              phone: p.phone || null,
              email: p.email || null,
              notes: p.notes || null,
              avatar_color: p.avatarColor || getAvatarColor(p.name),
            })
            .select()
            .single();

          if (inserted && p.id) {
            personIdMap[p.id] = inserted.id;
          }
        }

        if (Array.isArray(parsed.transactions)) {
          for (const tx of parsed.transactions) {
            const mappedPersonId = personIdMap[tx.personId] || tx.personId;
            await supabase.from('transactions').insert({
              user_id: user.id,
              person_id: mappedPersonId,
              type: tx.type,
              amount: Number(tx.amount),
              category: tx.category || 'General',
              description: tx.description || '',
              transaction_date: tx.transactionDate || new Date().toISOString().split('T')[0],
              is_settlement: Boolean(tx.isSettlement),
              notes: tx.notes || null,
            });
          }
        }

        if (Array.isArray(parsed.expenses)) {
          for (const exp of parsed.expenses) {
            const mappedPersonId = exp.personId ? (personIdMap[exp.personId] || exp.personId) : null;
            await supabase.from('expenses').insert({
              user_id: user.id,
              amount: Number(exp.amount),
              category: exp.category || 'Other',
              payment_method: exp.paymentMethod || 'Cash',
              description: exp.description || '',
              expense_date: exp.expenseDate || new Date().toISOString().split('T')[0],
              person_id: mappedPersonId,
              notes: exp.notes || null,
            });
          }
        }

        await fetchData(user.id);
        toastSuccess('Backup imported successfully into your account');
        return true;
      } catch (err: any) {
        toastError(err?.message || 'Failed to import JSON data');
        return false;
      } finally {
        setIsLoadingData(false);
      }
    },
    [user?.id, fetchData, toastSuccess, toastError]
  );

  return (
    <DataContext.Provider
      value={{
        people,
        transactions,
        expenses,
        preferences,
        isLoadingData,
        updatePreferences,
        refreshData,
        addPerson,
        updatePerson,
        deletePerson,
        getPerson,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        recordSettlement,
        addExpense,
        updateExpense,
        deleteExpense,
        getPersonSummary,
        dashboardMetrics,
        resetToSampleData,
        resetToDemoData: resetToSampleData,
        clearAllData,
        exportJSON,
        exportCSV,
        importJSON,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
