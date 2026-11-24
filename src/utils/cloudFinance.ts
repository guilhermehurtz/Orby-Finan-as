import {
  Timestamp,
  collection,
  deleteField,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import {
  Expense,
  ExpenseCategory,
  ExpenseType,
  PaymentMethod,
} from '../types/finance';
import { OperationType, db, handleFirestoreError } from '../firebase';
import { roundCurrency } from './finance';

// Volumetric constraints synchronized verbatim with firebase-blueprint.json
const MAX_USERNAME_LEN = 40;
const MIN_USERNAME_LEN = 3;
const MAX_NAME_LEN = 120;
const MAX_NOTE_LEN = 300;
const MAX_AMOUNT = 100000000;
const BATCH_CHUNK_SIZE = 400;

export interface CloudUserProfile {
  userId: string;
  username: string;
  monthlyGoal: number | null;
}

function sanitizeUsername(raw: string): string {
  const cleaned = raw.trim().slice(0, MAX_USERNAME_LEN);
  if (cleaned.length >= MIN_USERNAME_LEN) return cleaned;
  return 'usuario';
}

function sanitizeExpenseName(raw: string): string {
  const cleaned = raw.trim().slice(0, MAX_NAME_LEN);
  return cleaned || 'Despesa';
}

function sanitizeNote(raw?: string): string | undefined {
  if (!raw) return undefined;
  const cleaned = raw.trim().slice(0, MAX_NOTE_LEN);
  return cleaned || undefined;
}

function sanitizeAmount(amount: number): number {
  const rounded = roundCurrency(amount);
  return Math.min(MAX_AMOUNT, Math.max(0.01, rounded));
}

function sanitizeDay(day: number): number {
  return Math.min(31, Math.max(1, Math.round(day)));
}

function toIsoDate(value: unknown): string {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }
  if (typeof value === 'string') return value;
  return new Date().toISOString();
}

export async function ensureUserProfile(
  userId: string,
  preferredUsername: string
): Promise<CloudUserProfile> {
  const path = `users/${userId}`;
  const userRef = doc(db, 'users', userId);

  try {
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const data = snap.data();
      return {
        userId,
        username:
          typeof data.username === 'string' && data.username.trim().length >= 3
            ? data.username
            : sanitizeUsername(preferredUsername),
        monthlyGoal:
          typeof data.monthlyGoal === 'number' && data.monthlyGoal > 0
            ? roundCurrency(data.monthlyGoal)
            : null,
      };
    }

    const safeUsername = sanitizeUsername(preferredUsername);
    await setDoc(userRef, {
      userId,
      username: safeUsername,
      monthlyGoal: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return {
      userId,
      username: safeUsername,
      monthlyGoal: null,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function subscribeUserProfile(
  userId: string,
  onData: (profile: CloudUserProfile | null) => void,
  onError?: (error: Error) => void
): () => void {
  const path = `users/${userId}`;
  const userRef = doc(db, 'users', userId);

  return onSnapshot(
    userRef,
    (snap) => {
      if (!snap.exists()) {
        onData(null);
        return;
      }
      const data = snap.data();
      onData({
        userId,
        username:
          typeof data.username === 'string' ? data.username : 'usuario',
        monthlyGoal:
          typeof data.monthlyGoal === 'number' && data.monthlyGoal > 0
            ? roundCurrency(data.monthlyGoal)
            : null,
      });
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, path);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) {
          onError(wrapped);
        } else {
          throw wrapped;
        }
      }
    }
  );
}

export function subscribeUserExpenses(
  userId: string,
  onData: (expenses: Expense[]) => void,
  onError?: (error: Error) => void
): () => void {
  const path = `users/${userId}/expenses`;
  // Strictly enforce where('userId', '==', userId) to match Firestore allow list rule
  const q = query(
    collection(db, 'users', userId, 'expenses'),
    where('userId', '==', userId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const items: Expense[] = snapshot.docs.map((docSnap) => {
        const d = docSnap.data();
        const hasInstallment =
          typeof d.installmentGroupId === 'string' &&
          typeof d.installmentCurrent === 'number' &&
          typeof d.installmentTotal === 'number';

        return {
          id: docSnap.id,
          name: typeof d.name === 'string' ? d.name : 'Despesa',
          amount: typeof d.amount === 'number' ? roundCurrency(d.amount) : 0,
          category: (d.category as ExpenseCategory) ?? 'outros',
          type: (d.type as ExpenseType) ?? 'variavel',
          paymentMethod: (d.paymentMethod as PaymentMethod) ?? 'pix',
          month: typeof d.month === 'string' ? d.month : '2026-01',
          day: typeof d.day === 'number' ? d.day : 1,
          note: typeof d.note === 'string' ? d.note : undefined,
          ...(hasInstallment
            ? {
                installmentGroupId: d.installmentGroupId as string,
                installmentCurrent: d.installmentCurrent as number,
                installmentTotal: d.installmentTotal as number,
              }
            : {}),
          createdAt: toIsoDate(d.createdAt),
        };
      });

      items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      onData(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) {
          onError(wrapped);
        } else {
          throw wrapped;
        }
      }
    }
  );
}

function buildExpenseDocPayload(userId: string, expense: Expense) {
  const safeNote = sanitizeNote(expense.note);
  const hasInstallment =
    Boolean(expense.installmentGroupId) &&
    typeof expense.installmentCurrent === 'number' &&
    typeof expense.installmentTotal === 'number' &&
    expense.installmentTotal >= 2;

  return {
    userId,
    name: sanitizeExpenseName(expense.name),
    amount: sanitizeAmount(expense.amount),
    category: expense.category,
    type: expense.type,
    paymentMethod: expense.paymentMethod,
    month: expense.month,
    day: sanitizeDay(expense.day),
    ...(safeNote ? { note: safeNote } : {}),
    ...(hasInstallment
      ? {
          installmentGroupId: expense.installmentGroupId!.slice(0, 128),
          installmentCurrent: Math.round(expense.installmentCurrent!),
          installmentTotal: Math.round(expense.installmentTotal!),
        }
      : {}),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

export async function createCloudExpenses(
  userId: string,
  expenses: Expense[]
): Promise<void> {
  if (expenses.length === 0) return;
  const path = `users/${userId}/expenses`;

  try {
    for (let i = 0; i < expenses.length; i += BATCH_CHUNK_SIZE) {
      const chunk = expenses.slice(i, i + BATCH_CHUNK_SIZE);
      const batch = writeBatch(db);
      for (const exp of chunk) {
        const ref = doc(db, 'users', userId, 'expenses', exp.id);
        batch.set(ref, buildExpenseDocPayload(userId, exp));
      }
      await batch.commit();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export interface ExpenseUpdatePatch {
  name: string;
  amount: number;
  category: ExpenseCategory;
  type: ExpenseType;
  paymentMethod: PaymentMethod;
  month: string;
  day: number;
  note?: string;
}

export async function updateCloudExpensesBatch(
  userId: string,
  updates: Array<{ id: string; patch: ExpenseUpdatePatch }>
): Promise<void> {
  if (updates.length === 0) return;
  const path = `users/${userId}/expenses`;

  try {
    for (let i = 0; i < updates.length; i += BATCH_CHUNK_SIZE) {
      const chunk = updates.slice(i, i + BATCH_CHUNK_SIZE);
      const batch = writeBatch(db);
      for (const { id, patch } of chunk) {
        const ref = doc(db, 'users', userId, 'expenses', id);
        const safeNote = sanitizeNote(patch.note);
        batch.update(ref, {
          name: sanitizeExpenseName(patch.name),
          amount: sanitizeAmount(patch.amount),
          category: patch.category,
          type: patch.type,
          paymentMethod: patch.paymentMethod,
          month: patch.month,
          day: sanitizeDay(patch.day),
          note: safeNote ? safeNote : deleteField(),
          updatedAt: serverTimestamp(),
        });
      }
      await batch.commit();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteCloudExpenses(
  userId: string,
  expenseIds: string[]
): Promise<void> {
  if (expenseIds.length === 0) return;
  const path = `users/${userId}/expenses`;

  try {
    for (let i = 0; i < expenseIds.length; i += BATCH_CHUNK_SIZE) {
      const chunk = expenseIds.slice(i, i + BATCH_CHUNK_SIZE);
      const batch = writeBatch(db);
      for (const id of chunk) {
        batch.delete(doc(db, 'users', userId, 'expenses', id));
      }
      await batch.commit();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function updateCloudMonthlyGoal(
  userId: string,
  monthlyGoal: number | null
): Promise<void> {
  const path = `users/${userId}`;
  try {
    const safeGoal =
      monthlyGoal !== null && Number.isFinite(monthlyGoal) && monthlyGoal > 0
        ? Math.min(MAX_AMOUNT, roundCurrency(monthlyGoal))
        : null;
    await updateDoc(doc(db, 'users', userId), {
      monthlyGoal: safeGoal,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function replaceAllCloudData(
  userId: string,
  existingIds: string[],
  nextExpenses: Expense[],
  nextGoal: number | null
): Promise<void> {
  await deleteCloudExpenses(userId, existingIds);
  await createCloudExpenses(userId, nextExpenses);
  await updateCloudMonthlyGoal(userId, nextGoal);
}
