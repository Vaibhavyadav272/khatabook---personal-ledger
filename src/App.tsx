import React, { useState, useEffect } from 'react';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider, useData } from './context/DataContext';
import { ActiveTab, Person, Transaction, Expense } from './types';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { BottomNav } from './components/layout/BottomNav';
import { DashboardView } from './components/dashboard/DashboardView';
import { PeopleView } from './components/people/PeopleView';
import { PersonLedgerView } from './components/people/PersonLedgerView';
import { TransactionsView } from './components/transactions/TransactionsView';
import { AddTransactionModal } from './components/transactions/AddTransactionModal';
import { SettleUpModal } from './components/transactions/SettleUpModal';
import { ExpensesView } from './components/expenses/ExpensesView';
import { AddExpenseModal } from './components/expenses/AddExpenseModal';
import { SplitExpenseModal } from './components/expenses/SplitExpenseModal';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { SettingsView } from './components/settings/SettingsView';
import { AddPersonModal } from './components/people/AddPersonModal';
import { GlobalSearchModal } from './components/common/GlobalSearchModal';
import { AuthModal } from './components/auth/AuthModal';
import { AuthPage } from './components/auth/AuthPage';
import { Database } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { people, addPerson, updatePerson } = useData();

  // Navigation State
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);

  // Modals state
  const [isAddPersonOpen, setIsAddPersonOpen] = useState(false);
  const [personToEdit, setPersonToEdit] = useState<Person | null>(null);

  const [isAddTxOpen, setIsAddTxOpen] = useState(false);
  const [defaultTxType, setDefaultTxType] = useState<'gave' | 'received'>('gave');
  const [defaultTxPersonId, setDefaultTxPersonId] = useState<string | undefined>(undefined);
  const [txToEdit, setTxToEdit] = useState<Transaction | null>(null);

  const [isSettleUpOpen, setIsSettleUpOpen] = useState(false);
  const [settlePersonId, setSettlePersonId] = useState<string | null>(null);

  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);

  const [isSplitExpenseOpen, setIsSplitExpenseOpen] = useState(false);
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Global Keyboard shortcuts: Cmd+K / Ctrl+K for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsGlobalSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handlers
  const handleSelectPerson = (personId: string) => {
    setSelectedPersonId(personId);
    setActiveTab('people');
  };

  const handleBackToPeopleList = () => {
    setSelectedPersonId(null);
  };

  const handleOpenAddTransaction = (
    defaultType: 'gave' | 'received' = 'gave',
    personId?: string
  ) => {
    setTxToEdit(null);
    setDefaultTxType(defaultType);
    setDefaultTxPersonId(personId);
    setIsAddTxOpen(true);
  };

  const handleEditTransaction = (tx: Transaction) => {
    setTxToEdit(tx);
    setIsAddTxOpen(true);
  };

  const handleOpenSettleUp = (personId: string) => {
    setSettlePersonId(personId);
    setIsSettleUpOpen(true);
  };

  const handleOpenAddPerson = () => {
    setPersonToEdit(null);
    setIsAddPersonOpen(true);
  };

  const handleEditPerson = (person: Person) => {
    setPersonToEdit(person);
    setIsAddPersonOpen(true);
  };

  const handleOpenAddExpense = () => {
    setExpenseToEdit(null);
    setIsAddExpenseOpen(true);
  };

  const handleEditExpense = (expense: Expense) => {
    setExpenseToEdit(expense);
    setIsAddExpenseOpen(true);
  };

  const selectedPerson = selectedPersonId
    ? people.find((p) => p.id === selectedPersonId) || null
    : null;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans transition-colors duration-200">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        onNavigate={(tab) => {
          setActiveTab(tab);
          if (tab !== "people") setSelectedPersonId(null);
        }}
        onOpenSearch={() => setIsGlobalSearchOpen(true)}
        onOpenAddPerson={handleOpenAddPerson}
        onOpenAddTransaction={() => handleOpenAddTransaction("gave")}
        onOpenAddExpense={handleOpenAddExpense}
        onOpenSplitExpense={() => setIsSplitExpenseOpen(true)}
        onOpenAuth={() => setIsAuthModalOpen(true)}
      />

      {/* Main Content Area with Sidebar */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 gap-8">
        {/* Desktop Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onNavigate={(tab) => {
            setActiveTab(tab);
            if (tab !== "people") setSelectedPersonId(null);
          }}
          onOpenAddPerson={handleOpenAddPerson}
          onOpenAddTransaction={() => handleOpenAddTransaction("gave")}
          onOpenSplitExpense={() => setIsSplitExpenseOpen(true)}
        />

        {/* Dynamic Protected Views */}
        <main className="flex-1 min-w-0 pb-20 md:pb-8">
          {activeTab === "dashboard" && (
            <DashboardView
              onNavigate={(tab) => {
                setActiveTab(tab);
                if (tab !== "people") setSelectedPersonId(null);
              }}
              onSelectPerson={handleSelectPerson}
              onOpenAddPerson={handleOpenAddPerson}
              onOpenAddTransaction={handleOpenAddTransaction}
              onOpenAddExpense={handleOpenAddExpense}
              onOpenSplitExpense={() => setIsSplitExpenseOpen(true)}
              onOpenSettleUp={handleOpenSettleUp}
            />
          )}

          {activeTab === "people" && (
            <>
              {selectedPerson ? (
                <PersonLedgerView
                  personId={selectedPerson.id}
                  onBack={handleBackToPeopleList}
                  onOpenAddTransaction={handleOpenAddTransaction}
                  onOpenSettleUp={handleOpenSettleUp}
                  onEditTransaction={handleEditTransaction}
                  onEditPerson={handleEditPerson}
                />
              ) : (
                <PeopleView
                  onSelectPerson={handleSelectPerson}
                  onOpenAddPerson={handleOpenAddPerson}
                  onOpenAddTransaction={handleOpenAddTransaction}
                  onOpenSettleUp={handleOpenSettleUp}
                  onEditPerson={handleEditPerson}
                />
              )}
            </>
          )}

          {activeTab === "transactions" && (
            <TransactionsView
              onOpenAddTransaction={() => handleOpenAddTransaction("gave")}
              onEditTransaction={handleEditTransaction}
              onSelectPerson={handleSelectPerson}
            />
          )}

          {activeTab === "expenses" && (
            <ExpensesView
              onOpenAddExpense={handleOpenAddExpense}
              onOpenSplitExpense={() => setIsSplitExpenseOpen(true)}
              onEditExpense={handleEditExpense}
              onSelectPerson={handleSelectPerson}
            />
          )}

          {activeTab === "analytics" && (
            <AnalyticsView onSelectPerson={handleSelectPerson} />
          )}

          {activeTab === "settings" && (
            <SettingsView onOpenAuthModal={() => setIsAuthModalOpen(true)} />
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        onNavigate={(tab) => {
          setActiveTab(tab);
          if (tab !== "people") setSelectedPersonId(null);
        }}
        onOpenAddTransaction={() => handleOpenAddTransaction("gave")}
      />

      {/* Modals */}
      <AddPersonModal
        isOpen={isAddPersonOpen}
        onClose={() => {
          setIsAddPersonOpen(false);
          setPersonToEdit(null);
        }}
        personToEdit={personToEdit}
        onSubmit={async (data) => {
          if (personToEdit) {
            return await updatePerson(personToEdit.id, data);
          }

          const created = await addPerson(data);
          return created !== null;
        }}
      />
      <AddTransactionModal
        isOpen={isAddTxOpen}
        onClose={() => setIsAddTxOpen(false)}
        defaultType={defaultTxType}
        defaultPersonId={defaultTxPersonId}
        transactionToEdit={txToEdit}
        onOpenAddPerson={handleOpenAddPerson}
      />

      <SettleUpModal
        isOpen={isSettleUpOpen}
        onClose={() => setIsSettleUpOpen(false)}
        personId={settlePersonId}
      />

      <AddExpenseModal
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
        expenseToEdit={expenseToEdit}
      />

      <SplitExpenseModal
        isOpen={isSplitExpenseOpen}
        onClose={() => setIsSplitExpenseOpen(false)}
      />

      <GlobalSearchModal
        isOpen={isGlobalSearchOpen}
        onClose={() => setIsGlobalSearchOpen(false)}
        onNavigate={(tab) => {
          setActiveTab(tab);
          if (tab !== "people") setSelectedPersonId(null);
        }}
        onSelectPerson={handleSelectPerson}
        onOpenAddPerson={handleOpenAddPerson}
        onOpenAddTransaction={() => handleOpenAddTransaction("gave")}
        onOpenAddExpense={handleOpenAddExpense}
        onOpenSplitExpense={() => setIsSplitExpenseOpen(true)}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
};

const AuthGate: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30 animate-pulse">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Restoring Secure Session
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Connecting to PostgreSQL database...
            </p>
          </div>
          <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mt-2" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  return (
    <DataProvider>
      <MainAppContent />
    </DataProvider>
  );
};

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AuthGate />
      </AuthProvider>
    </ToastProvider>
  );
}
