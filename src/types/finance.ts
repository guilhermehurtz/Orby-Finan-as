export type ExpenseCategory =
  | 'moradia'
  | 'alimentacao'
  | 'transporte'
  | 'contas'
  | 'saude'
  | 'lazer'
  | 'assinaturas'
  | 'outros';

export type ExpenseType = 'fixa' | 'variavel';

export interface Expense {
  id: string;
  name: string;
  amount: number; // Positive BRL value
  category: ExpenseCategory;
  type: ExpenseType;
  month: string; // Format: YYYY-MM
  day: number; // 1..31
  note?: string;
  createdAt: string;
}

export interface FinanceStoreData {
  version: 1;
  expenses: Expense[];
  monthlyGoal?: number | null;
  seeded?: boolean;
}

export interface CategoryMeta {
  id: ExpenseCategory;
  label: string;
  color: string;
}

export interface MonthSummary {
  month: string;
  total: number;
  count: number;
  fixedTotal: number;
  variableTotal: number;
  topCategory: {
    category: ExpenseCategory;
    label: string;
    total: number;
    share: number;
  } | null;
}

export interface MonthComparison {
  currentMonth: string;
  previousMonth: string;
  currentTotal: number;
  previousTotal: number;
  difference: number; // current - previous (negative = savings)
  percentChange: number | null;
  status: 'saving' | 'increase' | 'same' | 'no_baseline';
}

export interface CategoryBreakdownItem {
  category: ExpenseCategory;
  label: string;
  color: string;
  total: number;
  count: number;
  share: number; // 0..100
}

export type ActiveTab = 'overview' | 'history' | 'data';
