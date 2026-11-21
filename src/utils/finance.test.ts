import test from 'node:test';
import assert from 'node:assert/strict';
import {
  cloneFixedExpensesToMonth,
  formatBRL,
  formatMonthLabel,
  formatMonthShort,
  getCategoryBreakdown,
  getHistoricalStats,
  getMonthComparison,
  getMonthSummary,
  getTimelineSeries,
  parseBRLInput,
  shiftMonth,
  validateBackupPayload,
} from './finance';
import { Expense } from '../types/finance';

const sampleExpenses: Expense[] = [
  {
    id: '1',
    name: 'Aluguel',
    amount: 1500,
    category: 'moradia',
    type: 'fixa',
    month: '2026-10',
    day: 5,
    createdAt: '2026-10-05T00:00:00Z',
  },
  {
    id: '2',
    name: 'Mercado',
    amount: 500,
    category: 'alimentacao',
    type: 'variavel',
    month: '2026-10',
    day: 12,
    createdAt: '2026-10-12T00:00:00Z',
  },
  {
    id: '3',
    name: 'Aluguel',
    amount: 1500,
    category: 'moradia',
    type: 'fixa',
    month: '2026-11',
    day: 5,
    createdAt: '2026-11-05T00:00:00Z',
  },
  {
    id: '4',
    name: 'Mercado',
    amount: 300,
    category: 'alimentacao',
    type: 'variavel',
    month: '2026-11',
    day: 10,
    createdAt: '2026-11-10T00:00:00Z',
  },
];

test('parseBRLInput handles Brazilian and decimal formats and rejects invalid values', () => {
  assert.equal(parseBRLInput('150,50'), 150.5);
  assert.equal(parseBRLInput('1.250,00'), 1250);
  assert.equal(parseBRLInput('R$ 89,90'), 89.9);
  assert.equal(parseBRLInput('249.95'), 249.95);
  assert.equal(parseBRLInput('300'), 300);
  assert.equal(parseBRLInput('0'), null);
  assert.equal(parseBRLInput('-50'), null);
  assert.equal(parseBRLInput('abc'), null);
  assert.equal(parseBRLInput(''), null);
});

test('formatBRL formats values in Brazilian Reais', () => {
  assert.equal(formatBRL(1250.5), 'R$ 1.250,50');
  assert.equal(formatBRL(0), 'R$ 0,00');
});

test('shiftMonth navigates safely across year boundaries', () => {
  assert.equal(shiftMonth('2026-01', -1), '2025-12');
  assert.equal(shiftMonth('2026-12', 1), '2027-01');
  assert.equal(shiftMonth('2026-11', -3), '2026-08');
  assert.equal(formatMonthLabel('2026-11'), 'Novembro 2026');
  assert.equal(formatMonthShort('2026-11'), 'Nov/26');
});

test('getMonthSummary calculates total, fixed/variable split, and top category', () => {
  const summary = getMonthSummary(sampleExpenses, '2026-11');
  assert.equal(summary.total, 1800);
  assert.equal(summary.count, 2);
  assert.equal(summary.fixedTotal, 1500);
  assert.equal(summary.variableTotal, 300);
  assert.equal(summary.topCategory?.category, 'moradia');
  assert.equal(summary.topCategory?.share, 83.3);
});

test('getMonthComparison detects savings vs previous month accurately', () => {
  const comp = getMonthComparison(sampleExpenses, '2026-11');
  assert.equal(comp.status, 'saving');
  assert.equal(comp.previousTotal, 2000);
  assert.equal(comp.currentTotal, 1800);
  assert.equal(comp.difference, -200);
  assert.equal(comp.percentChange, -10);
});

test('getMonthComparison returns no_baseline when previous month is empty', () => {
  const comp = getMonthComparison(sampleExpenses, '2026-10');
  assert.equal(comp.status, 'no_baseline');
  assert.equal(comp.percentChange, null);
});

test('getHistoricalStats computes average across months with expenses', () => {
  const stats = getHistoricalStats(sampleExpenses);
  assert.equal(stats.monthsCount, 2);
  assert.equal(stats.grandTotal, 3800);
  assert.equal(stats.average, 1900);
  assert.equal(stats.highestMonth?.month, '2026-10');
  assert.equal(stats.lowestMonth?.month, '2026-11');
});

test('getCategoryBreakdown sums and sorts categories descending', () => {
  const breakdown = getCategoryBreakdown(sampleExpenses.filter((e) => e.month === '2026-11'));
  assert.equal(breakdown.length, 2);
  assert.equal(breakdown[0].category, 'moradia');
  assert.equal(breakdown[0].total, 1500);
  assert.equal(breakdown[1].category, 'alimentacao');
  assert.equal(breakdown[1].total, 300);
});

test('cloneFixedExpensesToMonth copies only fixed expenses and avoids duplicates', () => {
  let seq = 1;
  const cloned = cloneFixedExpensesToMonth(
    sampleExpenses,
    '2026-11',
    '2026-12',
    () => `new-${seq++}`
  );
  assert.equal(cloned.length, 1);
  assert.equal(cloned[0].name, 'Aluguel');
  assert.equal(cloned[0].month, '2026-12');
  assert.equal(cloned[0].id, 'new-1');

  // Second clone should skip already-existing fixed expense
  const combined = [...sampleExpenses, ...cloned];
  const clonedAgain = cloneFixedExpensesToMonth(
    combined,
    '2026-11',
    '2026-12',
    () => `new-${seq++}`
  );
  assert.equal(clonedAgain.length, 0);
});

test('getTimelineSeries generates chronological window including selected month', () => {
  const series = getTimelineSeries(sampleExpenses, '2026-11', 6);
  assert.equal(series.length, 2);
  assert.equal(series[0].month, '2026-10');
  assert.equal(series[1].month, '2026-11');
  assert.equal(series[1].total, 1800);
  assert.equal(series[1].isSelected, true);
});

test('validateBackupPayload accepts valid backup and rejects malformed data', () => {
  const valid = validateBackupPayload({
    version: 1,
    expenses: sampleExpenses,
    monthlyGoal: 3500,
  });
  assert.equal(valid.ok, true);
  if (valid.ok) {
    assert.equal(valid.data.expenses.length, 4);
    assert.equal(valid.data.monthlyGoal, 3500);
  }

  const invalid = validateBackupPayload({ version: 1, expenses: [{ name: '', amount: -10 }] });
  assert.equal(invalid.ok, false);
});
