import { FinanceStoreData } from '../types/finance';
import { validateBackupPayload } from './finance';
import { buildInitialSeedData } from './seedData';

export const STORAGE_KEY = 'fluxo_despesas_v1';

export function loadFinanceStore(): FinanceStoreData {
  if (typeof window === 'undefined' || !window.localStorage) {
    return buildInitialSeedData();
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeded = buildInitialSeedData();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }

    const parsed = JSON.parse(raw);
    const validated = validateBackupPayload(parsed);
    if (validated.ok) {
      return {
        ...validated.data,
        seeded: Boolean((parsed as { seeded?: boolean }).seeded),
      };
    }
  } catch {
    // Corrupted JSON falls back cleanly to seed data
  }

  const fallback = buildInitialSeedData();
  saveFinanceStore(fallback);
  return fallback;
}

export function saveFinanceStore(data: FinanceStoreData): boolean {
  if (typeof window === 'undefined' || !window.localStorage) return false;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export function getStorageByteSize(): number {
  if (typeof window === 'undefined' || !window.localStorage) return 0;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY) ?? '';
    return new Blob([raw]).size;
  } catch {
    return 0;
  }
}

export function readLegacyLocalStore(): FinanceStoreData | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const validated = validateBackupPayload(parsed);
    if (!validated.ok) return null;
    const isSeeded = Boolean((parsed as { seeded?: boolean }).seeded);
    if (isSeeded || validated.data.expenses.length === 0) return null;
    return {
      ...validated.data,
      seeded: false,
    };
  } catch {
    return null;
  }
}

export function generateExpenseId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `exp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
