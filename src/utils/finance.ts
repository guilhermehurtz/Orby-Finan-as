import {
  CategoryBreakdownItem,
  CategoryMeta,
  Expense,
  ExpenseCategory,
  ExpenseType,
  FinanceStoreData,
  MonthComparison,
  MonthSummary,
} from '../types/finance';

export const CATEGORIES: CategoryMeta[] = [
  { id: 'moradia', label: 'Moradia', color: '#10B981' },
  { id: 'alimentacao', label: 'Alimentação', color: '#38BDF8' },
  { id: 'contas', label: 'Contas', color: '#F59E0B' },
  { id: 'transporte', label: 'Transporte', color: '#818CF8' },
  { id: 'saude', label: 'Saúde', color: '#FB7185' },
  { id: 'assinaturas', label: 'Assinaturas', color: '#2DD4BF' },
  { id: 'lazer', label: 'Lazer', color: '#A78BFA' },
  { id: 'outros', label: 'Outros', color: '#94A3B8' },
];

export const CATEGORY_MAP: Record<ExpenseCategory, CategoryMeta> = CATEGORIES.reduce(
  (acc, item) => {
    acc[item.id] = item;
    return acc;
  },
  {} as Record<ExpenseCategory, CategoryMeta>
);

const VALID_CATEGORIES = new Set<string>(CATEGORIES.map((c) => c.id));
const VALID_TYPES = new Set<string>(['fixa', 'variavel']);

const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

const MONTH_SHORT = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
];

const brlFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatBRL(value: number): string {
  const safe = Number.isFinite(value) ? value : 0;
  // Normalize non-breaking space from Intl to standard space for clean rendering & assertions
  return brlFormatter.format(safe).replace(/\u00A0/g, ' ');
}

export function formatCompactBRL(value: number): string {
  if (!Number.isFinite(value)) return 'R$ 0';
  if (Math.abs(value) >= 1000) {
    const k = value / 1000;
    return `R$ ${k.toFixed(k % 1 === 0 ? 0 : 1).replace('.', ',')}k`;
  }
  return `R$ ${Math.round(value)}`;
}

export function parseBRLInput(raw: string): number | null {
  if (typeof raw !== 'string') return null;
  const cleaned = raw.replace(/R\$/gi, '').replace(/\s+/g, '').trim();
  if (!cleaned) return null;

  // Reject characters other than digits, comma, and dot
  if (!/^[0-9.,]+$/.test(cleaned)) return null;

  let normalized = cleaned;
  const hasComma = cleaned.includes(',');
  const hasDot = cleaned.includes('.');

  if (hasComma && hasDot) {
    // Brazilian format: 1.250,50 -> dots are thousands, comma is decimal
    if (cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.')) {
      normalized = cleaned.replace(/\./g, '').replace(',', '.');
    } else {
      // US format fallback: 1,250.50
      normalized = cleaned.replace(/,/g, '');
    }
  } else if (hasComma) {
    // Only commas: treat last comma as decimal separator
    const parts = cleaned.split(',');
    if (parts.length > 2) return null;
    normalized = `${parts[0]}.${parts[1]}`;
  } else if (hasDot) {
    // Only dots: if 1.250 (3 digits after dot and single dot with leading digits), could be thousands or decimal.
    // Standard input like 89.90 has 1-2 decimals; multiple dots like 1.200.000 are thousands.
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      normalized = cleaned.replace(/\./g, '');
    } else {
      normalized = cleaned;
    }
  }

  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;

  return Math.round(parsed * 100) / 100;
}

export function getCurrentMonthKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function isValidMonthKey(monthKey: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(monthKey);
}

export function shiftMonth(monthKey: string, delta: number): string {
  const [yearStr, monthStr] = monthKey.split('-');
  const year = Number(yearStr);
  const monthIndex = Number(monthStr) - 1; // 0..11
  const totalMonths = year * 12 + monthIndex + delta;
  const nextYear = Math.floor(totalMonths / 12);
  const nextMonth = ((totalMonths % 12) + 12) % 12;
  return `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}`;
}

export function formatMonthLabel(monthKey: string): string {
  if (!isValidMonthKey(monthKey)) return monthKey;
  const [yearStr, monthStr] = monthKey.split('-');
  const idx = Number(monthStr) - 1;
  return `${MONTH_NAMES[idx]} ${yearStr}`;
}

export function formatMonthShort(monthKey: string): string {
  if (!isValidMonthKey(monthKey)) return monthKey;
  const [yearStr, monthStr] = monthKey.split('-');
  const idx = Number(monthStr) - 1;
  return `${MONTH_SHORT[idx]}/${yearStr.slice(2)}`;
}

export function formatMonthNameLower(monthKey: string): string {
  if (!isValidMonthKey(monthKey)) return monthKey;
  const [, monthStr] = monthKey.split('-');
  const idx = Number(monthStr) - 1;
  return MONTH_NAMES[idx].toLowerCase();
}

export function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

export function getMonthExpenses(expenses: Expense[], monthKey: string): Expense[] {
  return expenses.filter((e) => e.month === monthKey);
}

export function getCategoryBreakdown(monthExpenses: Expense[]): CategoryBreakdownItem[] {
  const totalAll = roundCurrency(monthExpenses.reduce((sum, e) => sum + e.amount, 0));
  const grouped = new Map<ExpenseCategory, { total: number; count: number }>();

  for (const exp of monthExpenses) {
    const current = grouped.get(exp.category) ?? { total: 0, count: 0 };
    grouped.set(exp.category, {
      total: roundCurrency(current.total + exp.amount),
      count: current.count + 1,
    });
  }

  const items: CategoryBreakdownItem[] = [];
  for (const [category, stats] of grouped.entries()) {
    const meta = CATEGORY_MAP[category] ?? CATEGORY_MAP.outros;
    items.push({
      category,
      label: meta.label,
      color: meta.color,
      total: stats.total,
      count: stats.count,
      share: totalAll > 0 ? Math.round((stats.total / totalAll) * 1000) / 10 : 0,
    });
  }

  return items.sort((a, b) => b.total - a.total);
}

export function getMonthSummary(expenses: Expense[], monthKey: string): MonthSummary {
  const monthExpenses = getMonthExpenses(expenses, monthKey);
  let total = 0;
  let fixedTotal = 0;
  let variableTotal = 0;

  for (const exp of monthExpenses) {
    total += exp.amount;
    if (exp.type === 'fixa') {
      fixedTotal += exp.amount;
    } else {
      variableTotal += exp.amount;
    }
  }

  const breakdown = getCategoryBreakdown(monthExpenses);
  const top = breakdown[0] ?? null;

  return {
    month: monthKey,
    total: roundCurrency(total),
    count: monthExpenses.length,
    fixedTotal: roundCurrency(fixedTotal),
    variableTotal: roundCurrency(variableTotal),
    topCategory: top
      ? {
          category: top.category,
          label: top.label,
          total: top.total,
          share: top.share,
        }
      : null,
  };
}

export function getMonthComparison(
  expenses: Expense[],
  currentMonthKey: string
): MonthComparison {
  const previousMonthKey = shiftMonth(currentMonthKey, -1);
  const currentSummary = getMonthSummary(expenses, currentMonthKey);
  const previousSummary = getMonthSummary(expenses, previousMonthKey);

  if (previousSummary.count === 0 || previousSummary.total === 0) {
    return {
      currentMonth: currentMonthKey,
      previousMonth: previousMonthKey,
      currentTotal: currentSummary.total,
      previousTotal: 0,
      difference: currentSummary.total,
      percentChange: null,
      status: 'no_baseline',
    };
  }

  const diff = roundCurrency(currentSummary.total - previousSummary.total);
  const pct = Math.round((diff / previousSummary.total) * 1000) / 10;

  let status: MonthComparison['status'] = 'same';
  if (diff < 0) status = 'saving';
  else if (diff > 0) status = 'increase';

  return {
    currentMonth: currentMonthKey,
    previousMonth: previousMonthKey,
    currentTotal: currentSummary.total,
    previousTotal: previousSummary.total,
    difference: diff,
    percentChange: pct,
    status,
  };
}

export interface HistoricalStats {
  average: number;
  monthsCount: number;
  grandTotal: number;
  highestMonth: { month: string; total: number } | null;
  lowestMonth: { month: string; total: number } | null;
}

export function getHistoricalStats(expenses: Expense[]): HistoricalStats {
  const totalsByMonth = new Map<string, number>();

  for (const exp of expenses) {
    const prev = totalsByMonth.get(exp.month) ?? 0;
    totalsByMonth.set(exp.month, roundCurrency(prev + exp.amount));
  }

  const entries = Array.from(totalsByMonth.entries());
  if (entries.length === 0) {
    return {
      average: 0,
      monthsCount: 0,
      grandTotal: 0,
      highestMonth: null,
      lowestMonth: null,
    };
  }

  let grandTotal = 0;
  let highest = { month: entries[0][0], total: entries[0][1] };
  let lowest = { month: entries[0][0], total: entries[0][1] };

  for (const [month, total] of entries) {
    grandTotal += total;
    if (total > highest.total) highest = { month, total };
    if (total < lowest.total) lowest = { month, total };
  }

  return {
    average: roundCurrency(grandTotal / entries.length),
    monthsCount: entries.length,
    grandTotal: roundCurrency(grandTotal),
    highestMonth: highest,
    lowestMonth: lowest,
  };
}

export interface TimelinePoint {
  month: string;
  shortLabel: string;
  fullLabel: string;
  total: number;
  fixedTotal: number;
  variableTotal: number;
  count: number;
  isSelected: boolean;
}

export function getTimelineSeries(
  expenses: Expense[],
  selectedMonthKey: string,
  windowSize = 6
): TimelinePoint[] {
  const recordedMonths = Array.from(new Set(expenses.map((e) => e.month))).sort();
  const monthSet = new Set<string>(recordedMonths);
  monthSet.add(selectedMonthKey);

  // Sort chronologically and keep up to windowSize months centered/anchored around latest or selected
  let months = Array.from(monthSet).sort();

  // If fewer than 2 months exist, include previous month so user sees comparative context
  if (months.length === 1) {
    months = [shiftMonth(selectedMonthKey, -1), selectedMonthKey];
  }

  if (months.length > windowSize) {
    const selectedIdx = months.indexOf(selectedMonthKey);
    let end = Math.max(windowSize, selectedIdx + 1);
    end = Math.min(months.length, end);
    const start = Math.max(0, end - windowSize);
    months = months.slice(start, end);
  }

  return months.map((m) => {
    const summary = getMonthSummary(expenses, m);
    return {
      month: m,
      shortLabel: formatMonthShort(m),
      fullLabel: formatMonthLabel(m),
      total: summary.total,
      fixedTotal: summary.fixedTotal,
      variableTotal: summary.variableTotal,
      count: summary.count,
      isSelected: m === selectedMonthKey,
    };
  });
}

export interface RecordedMonthRow {
  summary: MonthSummary;
  comparison: MonthComparison;
}

export function getAllRecordedMonths(expenses: Expense[]): RecordedMonthRow[] {
  const uniqueMonths = Array.from(new Set(expenses.map((e) => e.month)))
    .sort()
    .reverse();

  return uniqueMonths.map((month) => ({
    summary: getMonthSummary(expenses, month),
    comparison: getMonthComparison(expenses, month),
  }));
}

export function cloneFixedExpensesToMonth(
  expenses: Expense[],
  sourceMonth: string,
  targetMonth: string,
  idFactory: () => string
): Expense[] {
  const sourceFixed = expenses.filter(
    (e) => e.month === sourceMonth && e.type === 'fixa'
  );
  const existingInTarget = expenses.filter((e) => e.month === targetMonth);

  const existingKeys = new Set(
    existingInTarget.map((e) => `${e.name.trim().toLowerCase()}::${e.amount}`)
  );

  const nowIso = new Date().toISOString();
  const created: Expense[] = [];

  for (const item of sourceFixed) {
    const signature = `${item.name.trim().toLowerCase()}::${item.amount}`;
    if (existingKeys.has(signature)) continue;
    existingKeys.add(signature);
    created.push({
      id: idFactory(),
      name: item.name,
      amount: item.amount,
      category: item.category,
      type: 'fixa',
      month: targetMonth,
      day: item.day,
      note: item.note,
      createdAt: nowIso,
    });
  }

  return created;
}

export function validateBackupPayload(
  raw: unknown
): { ok: true; data: FinanceStoreData } | { ok: false; error: string } {
  if (!raw || typeof raw !== 'object') {
    return { ok: false, error: 'O arquivo não contém um objeto JSON válido.' };
  }

  const candidate = raw as Record<string, unknown>;
  if (!Array.isArray(candidate.expenses)) {
    return { ok: false, error: 'Lista de despesas ("expenses") ausente no arquivo.' };
  }

  const sanitized: Expense[] = [];
  for (let i = 0; i < candidate.expenses.length; i++) {
    const item = candidate.expenses[i] as Record<string, unknown>;
    if (!item || typeof item !== 'object') {
      return { ok: false, error: `Item #${i + 1} inválido no backup.` };
    }

    const name = typeof item.name === 'string' ? item.name.trim() : '';
    const amount = typeof item.amount === 'number' ? roundCurrency(item.amount) : NaN;
    const month = typeof item.month === 'string' ? item.month.trim() : '';

    if (!name || !Number.isFinite(amount) || amount <= 0 || !isValidMonthKey(month)) {
      return {
        ok: false,
        error: `Despesa #${i + 1} possui nome, valor ou mês inválido.`,
      };
    }

    const category: ExpenseCategory =
      typeof item.category === 'string' && VALID_CATEGORIES.has(item.category)
        ? (item.category as ExpenseCategory)
        : 'outros';

    const type: ExpenseType =
      typeof item.type === 'string' && VALID_TYPES.has(item.type)
        ? (item.type as ExpenseType)
        : 'variavel';

    const rawDay = typeof item.day === 'number' ? Math.round(item.day) : 1;
    const day = Math.min(31, Math.max(1, Number.isFinite(rawDay) ? rawDay : 1));

    sanitized.push({
      id:
        typeof item.id === 'string' && item.id.trim()
          ? item.id.trim()
          : `imp-${Date.now()}-${i}`,
      name,
      amount,
      category,
      type,
      month,
      day,
      note: typeof item.note === 'string' ? item.note.trim() || undefined : undefined,
      createdAt:
        typeof item.createdAt === 'string' ? item.createdAt : new Date().toISOString(),
    });
  }

  const monthlyGoal =
    typeof candidate.monthlyGoal === 'number' &&
    Number.isFinite(candidate.monthlyGoal) &&
    candidate.monthlyGoal > 0
      ? roundCurrency(candidate.monthlyGoal)
      : null;

  return {
    ok: true,
    data: {
      version: 1,
      expenses: sanitized,
      monthlyGoal,
      seeded: false,
    },
  };
}
