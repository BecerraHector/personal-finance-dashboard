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
}

export interface Budget {
  id: string;
  categoryId: string;
  year: number;
  month: number;
  limitAmount: string;
  category: Category;
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
