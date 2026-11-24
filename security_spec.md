# Orby Firestore Security Specification

## Data Invariants
1. **Strict Account Isolation**: A user (`request.auth.uid`) can ONLY read, create, update, or delete their own `/users/{userId}` document and `/users/{userId}/expenses/{expenseId}` subcollection documents. No cross-user reads or writes are permitted.
2. **Master Gate Parent Integrity**: No expense document may be created, updated, or deleted under `/users/{userId}/expenses/{expenseId}` unless `/users/{userId}` exists in Firestore.
3. **Immutable Ownership & Timestamps**: `userId` and `createdAt` are immutable after document creation. `createdAt` and `updatedAt` must strictly equal `request.time`.
4. **Blueprint Volumetric & Schema Limits**: Every string enforces exact min/max length bounds matching `firebase-blueprint.json`, every enum (`category`, `type`, `paymentMethod`) is allowlisted, `month` matches `^\d{4}-(0[1-9]|1[0-2])$`, `amount > 0 && amount <= 100000000`, and installment metadata (`installmentGroupId`, `installmentCurrent`, `installmentTotal`) must be either completely absent or mutually consistent (`1 <= current <= total <= 60`, `total >= 2`).
5. **No Shadow Fields or Unbounded List Scraping**: All creates enforce `hasAll` + `hasOnly`, all updates enforce `affectedKeys().hasOnly(...)` combined with full `isValid*` validation, and `allow list` verifies `resource.data.userId == request.auth.uid` without `get()`/`exists()` lookups.

## The "Dirty Dozen" Adversarial Payloads (All Must Return PERMISSION_DENIED)
1. **Cross-User Read (`get` / `list`)**: Authenticated user `uid_B` attempts to read `/users/uid_A` or list `/users/uid_A/expenses`.
2. **Identity Spoofing on Create**: User `uid_A` writes `/users/uid_A/expenses/exp1` with `{ userId: "uid_B", ... }`.
3. **Shadow Field Injection on Profile**: User `uid_A` creates `/users/uid_A` with extra ghost field `{ isAdmin: true }`.
4. **Shadow Field Injection on Expense**: User `uid_A` creates `/users/uid_A/expenses/exp1` with `{ verified: true }`.
5. **Orphaned Expense Write**: User `uid_A` tries to create `/users/uid_A/expenses/exp1` before `/users/uid_A` profile exists.
6. **ID Poisoning Attack**: User `uid_A` tries to write `/users/uid_A/expenses/${'x'.repeat(200)}` or an ID with invalid characters (`../bad`).
7. **Timestamp Forgery**: User `uid_A` creates an expense with a client-forged `createdAt` timestamp instead of `request.time`.
8. **Immortal Field Mutation**: User `uid_A` updates an expense attempting to change `userId` or `createdAt`.
9. **Value Poisoning on Update**: User `uid_A` updates `amount` to `-500` or `name` to a 500-character string.
10. **Invalid Enum Injection**: User `uid_A` creates an expense with `paymentMethod: "crypto"` or `category: "invalid"`.
11. **Malformed Installment State**: User `uid_A` creates an expense with `installmentCurrent: 15, installmentTotal: 12` or `installmentTotal: 12` without `installmentGroupId`.
12. **Unauthenticated Access**: Unauthenticated client attempts any read or write on `/users/{userId}` or `/users/{userId}/expenses/{expenseId}`.
