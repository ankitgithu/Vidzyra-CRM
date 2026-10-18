# Implementation Plan — Universal Payment Allocation & Display System

## 1. Problem Statement & Objectives
Currently, when a client makes a single combined payment (e.g., ₹500 for multiple deliverables), the client's overall billing and payment totals update, but individual work/project deliverables still reflect `Paid: ₹0`, `Remaining: Full Amount`, and `Status: Pending`. Furthermore, the downloaded Client Work Statement PDF exhibits the same discrepancy: the bottom summary shows received payments while the line items report every work as pending.

This plan establishes a **single source of truth** payment allocation engine across the entire CRM, enables multi-work selection with oldest-to-newest settlement and live preview in the payment form, and ensures all views (Work List, Work Details, Client Details, Dashboard, and Statement PDFs) reflect identical, reconciled figures.

---

## 2. Core Architectural Principles & Data Safety Guarantee
- **Zero Data Loss / Zero Schema Destruction**: Existing database records (`clients`, `projects`, `payments`) remain completely intact. No record deletion, table restructuring, or ID modification.
- **Additive Compatibility**: Add optional `allocatedWorkIds?: string[]` and `allocations?: { workId: string; amount: number }[]` to `ClientPayment` in `src/types.ts`.
- **Single Payment Transaction**: A combined payment remains **ONE** single transaction record in Firestore/localStorage with its true total amount. It is never split into fragmented fake sub-payments.
- **Deterministic Settlement Order**: When multiple works are selected, payments allocate from **Oldest Selected Work First** to **Newest Selected Work Last** based on project date.
- **Legacy Payment Handling**: Existing payments in the database without explicit work selection will automatically allocate across that client's unpaid works from oldest to newest, instantly fixing existing client records.
- **Excess & Advance Handling**: If a payment exceeds the total remaining amount of selected works, the excess is transparently tracked as **Client Advance Credit**.

---

## 3. Detailed Component & Implementation Plan

### A. Centralized Allocation Engine (`src/utils/paymentAllocation.ts`)
Create a single pure calculation utility that computes allocations for any client:
1. `calculateClientPaymentAllocations(clientProjects: WorkProject[], clientPayments: ClientPayment[])`:
   - Sorts projects chronologically (oldest `workGivenDate || createdAt || dueDate` first).
   - Iterates through payments in chronological order.
   - For payments with explicit `allocatedWorkIds`: allocates amount across those selected works oldest-first.
   - For legacy single-work payments (`workId` set): allocates directly to that work.
   - For unallocated/legacy payments: auto-allocates across the client's pending works oldest-first.
   - Computes:
     - Per-work `allocatedAmount`, `remainingAmount`, and `paymentStatus` (`Paid` | `Partially Paid` | `Pending`).
     - Client-level `totalBilling`, `totalPaid`, `totalAllocated`, `remaining`, and `advanceCredit`.
     - Reconciles `SUM(Work Allocated) + Client Advance = Total Paid`.
2. `computeLivePaymentAllocationPreview(selectedProjects: WorkProject[], enteredAmount: number, existingAllocationsMap)`:
   - Powers the live preview in the payment creation form before the user clicks save.

### B. Update `CrmContext.tsx`
1. Enhance `getWorkPaymentStats(workId: string)`:
   - Uses the centralized allocation engine to return exact `totalAmount`, `paymentReceived` (allocated), `remainingAmount`, and `paymentStatus`.
2. Enhance `getClientStats(clientId: string)`:
   - Returns reconciled `totalBilling`, `totalPaid`, `remaining`, and `advanceCredit`.
3. Support `allocatedWorkIds` and `allocations` in `addClientPayment` and `updateClientPayment`.
4. Add audit trail/activity log tracking for payment allocations.

### C. Client Payment Form Modal (`src/components/payments/PaymentFormModal.tsx`)
1. When `paymentCategory === 'Client'` and a `clientId` is chosen:
   - Fetch all deliverables for this client.
   - Render a dedicated **"Select Work(s) to Settle"** section with clean checkboxes.
   - Each row displays:
     - Checkbox
     - Work Name & Work Type
     - Date
     - Total Billing
     - Already Paid
     - Remaining Amount
     - Current Status (`Paid` / `Partially Paid` / `Pending`)
   - Manual checkbox selection by user (with quick "Select All Unpaid" & "Clear Selection" shortcuts).
2. **Live Allocation Preview Box**:
   - Immediately calculates and displays in real time as the user types the payment amount:
     - Total Selected Works Remaining: `₹X,XXX`
     - Entered Amount: `₹X,XXX`
     - Breakdown per selected work (e.g. `Work A — ₹300 → Fully Paid`, `Work B — ₹100 → ₹100 Remaining`).
     - If payment exceeds selected total: `₹XXX → Client Advance Credit`.

### D. Work / Project Section Updates
1. `src/components/work/WorkList.tsx`:
   - Project cards & rows render `Paid: ₹X` and `Remaining: ₹X` using `getWorkPaymentStats(p.id)`.
   - Add clear status indicators: `Paid` (emerald), `Partially Paid` (amber), `Pending` (slate/rose).
2. `src/components/work/WorkDetailModal.tsx` & `ClientWorkDetailModal.tsx`:
   - Display allocated payments list, settled date, and remaining balance.
3. `src/components/clients/ClientDetailModal.tsx`:
   - Shows both individual work payment statuses and overall client balance with advance credit indicator.

### E. Client Work Statement PDF (`src/utils/pdfGenerator.ts` & `ClientWorkPdfModal.tsx`)
1. Ensure table column `Payment` in `generateClientWorkStatementPdf` uses the exact allocated amount:
   - Fully settled: `₹300 — Received` (emerald)
   - Partially settled: `₹150 — Partially Received` (amber)
   - Unsettled: `₹300 — Pending` (rose)
2. Bottom Payment Summary:
   - `Total Payment: ₹XX,XXX`
   - `Received: ₹XX,XXX`
   - `Remaining: ₹XX,XXX`
   - `Advance Credit: ₹XX,XXX` (if applicable)
   - Strictly enforces mathematical reconciliation: `Total Payment = Received + Remaining` (or `Received = Total Payment + Advance`).

---

## 4. Verification & Testing Plan
1. **Compilation & Type Check**: Run `compile_applet` and `lint_applet` to verify zero TypeScript errors.
2. **Scenario 1 - Full Settlement**:
   - Client with Work 1 (₹300) and Work 2 (₹200). Record single payment of ₹500 with both selected.
   - Verify both show `Paid: ₹300` and `Paid: ₹200` (`Status: Paid`) in WorkList, Work Detail, and PDF.
3. **Scenario 2 - Partial Settlement**:
   - Payment of ₹400 for Work 1 (₹300) and Work 2 (₹200).
   - Verify Work 1 is `Paid: ₹300`, Work 2 is `Paid: ₹100 / Remaining: ₹100` (`Partially Paid`).
4. **Scenario 3 - Excess / Advance**:
   - Payment of ₹600 for Work 1 (₹300) and Work 2 (₹200).
   - Verify both works are `Paid`, client has `₹100 Advance Credit`.
5. **Scenario 4 - Selective Settlement**:
   - Only Work 2 selected for ₹200 payment. Work 1 remains untouched with `Paid: ₹0` (`Pending`).
6. **Scenario 5 - Legacy Payment Safety**:
   - Verify existing payments in the database automatically allocate to deliverables chronologically without data alteration.
