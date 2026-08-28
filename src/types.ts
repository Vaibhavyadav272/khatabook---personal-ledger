export type TransactionType = 'gave' | 'received'; // 'gave' = user gave money (person owes user), 'received' = user received money (reduces debt or user owes person)

export type ExpenseCategory = 
  | 'Food'
  | 'Travel'
  | 'Shopping'
  | 'Bills'
  | 'Education'
  | 'Healthcare'
  | 'Entertainment'
  | 'Rent'
  | 'Groceries'
  | 'Loan'
  | 'Other';

export type PaymentMethod = 
  | 'Cash'
  | 'UPI'
  | 'Debit Card'
  | 'Credit Card'
  | 'Bank Transfer'
  | 'Other';

export type BalanceStatus = 'owes_you' | 'you_owe' | 'settled';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  createdAt: string;
}

export interface Profile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Person {
  id: string;
  userId: string;
  name: string;
  phone?: string;
  email?: string;
  notes?: string;
  avatarColor?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  personId: string;
  type: TransactionType; // 'gave' or 'received'
  amount: number;
  category: string;
  description: string;
  transactionDate: string; // YYYY-MM-DD
  isSettlement?: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseSplit {
  id?: string;
  expenseId?: string;
  personId: string; // or 'user' for current user
  personName?: string;
  amount: number;
  createdAt?: string;
}

export interface Expense {
  id: string;
  userId: string;
  amount: number;
  category: ExpenseCategory;
  paymentMethod: PaymentMethod;
  description: string;
  expenseDate: string; // YYYY-MM-DD
  personId?: string; // nullable, if associated with a person
  notes?: string;
  splits?: ExpenseSplit[];
  createdAt: string;
  updatedAt: string;
}

export interface PersonBalanceSummary {
  personId: string;
  totalGiven: number;
  totalReceived: number;
  netBalance: number; // totalGiven - totalReceived
  status: BalanceStatus;
  statusText: string; // "Rahul owes you", "You owe Amit", "Settled"
  lastTransactionDate?: string;
  transactionCount: number;
}

export interface UserPreferences {
  currency: 'INR' | 'USD' | 'EUR' | 'GBP' | 'AED';
  currencySymbol: string;
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
  theme: 'light' | 'dark' | 'system';
}

export type ActiveTab = 'dashboard' | 'people' | 'transactions' | 'expenses' | 'analytics' | 'settings';
