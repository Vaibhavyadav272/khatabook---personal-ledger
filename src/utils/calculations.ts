import { Expense, Person, PersonBalanceSummary, Transaction } from '../types';

/**
 * Calculates a person's balance summary directly from their transactions.
 * Balance is NEVER stored as a mutable static field; it is computed dynamically.
 */
export function calculatePersonBalance(
  personId: string,
  personName: string,
  transactions: Transaction[]
): PersonBalanceSummary {
  const personTxs = transactions.filter((t) => t.personId === personId);

  let totalGiven = 0;
  let totalReceived = 0;
  let lastDate: string | undefined = undefined;

  // Sort by date ascending to process timeline, but track newest date
  const sorted = [...personTxs].sort(
    (a, b) => new Date(a.transactionDate).getTime() - new Date(b.transactionDate).getTime()
  );

  sorted.forEach((tx) => {
    if (tx.type === 'gave') {
      totalGiven += Number(tx.amount);
    } else if (tx.type === 'received') {
      totalReceived += Number(tx.amount);
    }
  });

  if (sorted.length > 0) {
    lastDate = sorted[sorted.length - 1].transactionDate;
  }

  // Net Balance = Total Given - Total Received
  const netBalance = totalGiven - totalReceived;

  let status: PersonBalanceSummary['status'] = 'settled';
  let statusText = 'Settled';

  if (netBalance > 0.001) {
    status = 'owes_you';
    statusText = `${personName} owes you`;
  } else if (netBalance < -0.001) {
    status = 'you_owe';
    statusText = `You owe ${personName}`;
  } else {
    status = 'settled';
    statusText = 'Settled';
  }

  return {
    personId,
    totalGiven,
    totalReceived,
    netBalance,
    status,
    statusText,
    lastTransactionDate: lastDate,
    transactionCount: personTxs.length,
  };
}

/**
 * Computes dashboard financial totals
 */
export function calculateDashboardMetrics(
  people: Person[],
  transactions: Transaction[],
  expenses: Expense[]
) {
  let totalToReceive = 0; // Money other people owe the user
  let totalToPay = 0; // Money the user owes other people

  const summaries = people.map((p) => calculatePersonBalance(p.id, p.name, transactions));

  summaries.forEach((sum) => {
    if (sum.netBalance > 0) {
      totalToReceive += sum.netBalance;
    } else if (sum.netBalance < 0) {
      totalToPay += Math.abs(sum.netBalance);
    }
  });

  const netBalance = totalToReceive - totalToPay;

  // Total expenses
  const totalExpenses = expenses.reduce((acc, exp) => acc + Number(exp.amount), 0);

  // This month expenses
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed

  const thisMonthExpenses = expenses
    .filter((exp) => {
      const d = new Date(exp.expenseDate);
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    })
    .reduce((acc, exp) => acc + Number(exp.amount), 0);

  const thisYearExpenses = expenses
    .filter((exp) => {
      const d = new Date(exp.expenseDate);
      return d.getFullYear() === currentYear;
    })
    .reduce((acc, exp) => acc + Number(exp.amount), 0);

  // Categorize people
  const peopleWhoOweYou = summaries
    .filter((s) => s.status === 'owes_you')
    .sort((a, b) => b.netBalance - a.netBalance)
    .map((s) => ({
      ...s,
      person: people.find((p) => p.id === s.personId)!,
    }));

  const peopleYouOwe = summaries
    .filter((s) => s.status === 'you_owe')
    .sort((a, b) => a.netBalance - b.netBalance) // largest negative first
    .map((s) => ({
      ...s,
      person: people.find((p) => p.id === s.personId)!,
    }));

  const settledPeople = summaries
    .filter((s) => s.status === 'settled')
    .map((s) => ({
      ...s,
      person: people.find((p) => p.id === s.personId)!,
    }));

  return {
    totalToReceive,
    totalToPay,
    netBalance,
    totalExpenses,
    thisMonthExpenses,
    thisYearExpenses,
    peopleWhoOweYou,
    peopleYouOwe,
    settledPeople,
    summaries,
  };
}
