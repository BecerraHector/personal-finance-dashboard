export type TransactionType = "INCOME" | "EXPENSE";

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  color: string;
}

export interface Transaction {
  id: string;
  amount: string;
  description: string;
  date: string;
  categoryId: string;
  category: Category;
  recurringId: string | null;
}

export interface RecurringRule {
  id: string;
  amount: string;
  description: string;
  dayOfMonth: number;
  active: boolean;
  startDate: string;
  categoryId: string;
  category: Category;
}

export interface Budget {
  id: string;
  categoryId: string;
  year: number;
  month: number;
  limitAmount: string;
  category: Category;
}

export type GoalStatus = "COMPLETED" | "ON_TRACK" | "BEHIND" | "OVERDUE";

export interface GoalContribution {
  id: string;
  amount: number;
  note: string;
  date: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  targetYear: number;
  targetMonth: number;
  createdAt: string;
  contributions: GoalContribution[];
  saved: number;
  remaining: number;
  pct: number;
  monthsLeft: number;
  suggestedMonthly: number;
  status: GoalStatus;
}

export interface Summary {
  year: number;
  month: number;
  income: number;
  expense: number;
  balance: number;
  byCategory: {
    categoryId: string;
    name: string;
    color: string;
    type: TransactionType;
    total: number;
  }[];
  budgets: {
    id: string;
    categoryId: string;
    name: string;
    color: string;
    limit: number;
    spent: number;
  }[];
  history: { year: number; month: number; income: number; expense: number }[];
}
