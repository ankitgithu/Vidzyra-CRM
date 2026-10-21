import {
  WorkProject,
  ClientPayment,
  WorkPaymentStats,
  PaymentAllocationItem,
} from '../types';

/**
 * Returns the canonical chronological date string (YYYY-MM-DD) for a work project.
 */
export function getWorkEffectiveDate(work: WorkProject): string {
  if (work.workGivenDate) return work.workGivenDate;
  if (work.createdAt) return work.createdAt.split('T')[0];
  if (work.dueDate) return work.dueDate;
  return '';
}

/**
 * Sorts works chronologically from oldest to newest.
 */
export function sortWorksOldestFirst(works: WorkProject[]): WorkProject[] {
  return [...works].sort((a, b) => {
    const dateA = getWorkEffectiveDate(a);
    const dateB = getWorkEffectiveDate(b);
    if (dateA !== dateB) {
      return dateA.localeCompare(dateB);
    }
    const createdA = a.createdAt || '';
    const createdB = b.createdAt || '';
    if (createdA !== createdB) {
      return createdA.localeCompare(createdB);
    }
    return a.id.localeCompare(b.id);
  });
}

/**
 * Returns the effective date string for a client payment.
 */
export function getPaymentEffectiveDate(payment: ClientPayment): string {
  if (payment.date) return payment.date;
  if (payment.paymentDate) return payment.paymentDate;
  if (payment.createdAt) return payment.createdAt.split('T')[0];
  return '';
}

/**
 * Sorts payments chronologically from oldest to newest.
 */
export function sortPaymentsOldestFirst(payments: ClientPayment[]): ClientPayment[] {
  return [...payments].sort((a, b) => {
    const dateA = getPaymentEffectiveDate(a);
    const dateB = getPaymentEffectiveDate(b);
    if (dateA !== dateB) {
      return dateA.localeCompare(dateB);
    }
    const createdA = a.createdAt || '';
    const createdB = b.createdAt || '';
    if (createdA !== createdB) {
      return createdA.localeCompare(createdB);
    }
    return a.id.localeCompare(b.id);
  });
}

export interface ClientAllocationResult {
  clientId: string;
  totalBilling: number;
  totalPaid: number;
  totalAllocated: number;
  remaining: number;
  advanceCredit: number;
  paymentStatus: 'Paid' | 'Partial' | 'Pending';
  workStatsMap: Record<string, WorkPaymentStats>;
  paymentAllocationsMap: Record<string, PaymentAllocationItem[]>;
}

/**
 * Computes exact deterministic payment allocations for all deliverables of a client.
 *
 * Rules:
 * 1. Works and payments are processed chronologically (oldest first).
 * 2. If a payment has explicit `allocatedWorkIds`, it settles only those selected works (oldest first).
 * 3. If a payment has single legacy `workId`, it settles that specific work.
 * 4. If a payment is general / legacy without selected works, it automatically settles the client's
 *    unpaid works from oldest to newest (ensuring legacy data displays accurately).
 * 5. Excess payment beyond settled works is preserved as Client Advance credit.
 */
export function computeClientWorkAllocations(
  clientId: string,
  allProjects: WorkProject[],
  allPayments: ClientPayment[]
): ClientAllocationResult {
  // 1. Filter works for this client
  const clientWorks = allProjects.filter((p) => {
    const pClientId = p.clientId || (p as any).client_id || (p as any).client?.id;
    return Boolean(pClientId && pClientId === clientId);
  });

  const sortedWorks = sortWorksOldestFirst(clientWorks);

  // Initialize work stats
  const workStatsMap: Record<string, WorkPaymentStats> = {};
  sortedWorks.forEach((w) => {
    const totalAmount =
      w.totalBilling ?? ((w.quantity || 1) * (w.clientRate || 0));
    workStatsMap[w.id] = {
      totalAmount,
      paymentReceived: 0,
      remainingAmount: totalAmount,
      status: 'Pending',
      payments: [],
    };
  });

  // 2. Filter payments for this client
  const clientPayments = allPayments.filter((p) => {
    const pClientId = p.clientId || (p as any).client_id;
    return Boolean(pClientId && pClientId === clientId);
  });

  const sortedPayments = sortPaymentsOldestFirst(clientPayments);

  const paymentAllocationsMap: Record<string, PaymentAllocationItem[]> = {};

  // 3. Process each payment in chronological order
  sortedPayments.forEach((payment) => {
    let unallocatedPayment = Number(payment.amount) || 0;
    const thisPaymentAllocations: PaymentAllocationItem[] = [];

    // Determine target works for this payment
    let targetWorks: WorkProject[] = [];

    if (
      payment.allocatedWorkIds &&
      Array.isArray(payment.allocatedWorkIds) &&
      payment.allocatedWorkIds.length > 0
    ) {
      // Explicitly selected works (oldest to newest)
      const selectedSet = new Set(payment.allocatedWorkIds);
      targetWorks = sortedWorks.filter((w) => selectedSet.has(w.id));
    } else if (payment.allocations && Array.isArray(payment.allocations) && payment.allocations.length > 0) {
      const selectedSet = new Set(payment.allocations.map((a) => a.workId));
      targetWorks = sortedWorks.filter((w) => selectedSet.has(w.id));
    } else if (payment.workId || (payment as any).work_id || (payment as any).projectId) {
      // Reliable single work reference
      const singleId = (payment.workId || (payment as any).work_id || (payment as any).projectId) as string;
      targetWorks = sortedWorks.filter((w) => w.id === singleId);
    } else {
      // General / account-level payment: automatically settles client deliverables from oldest to newest
      targetWorks = sortedWorks;
    }

    // Allocate from oldest target work to newest
    targetWorks.forEach((work) => {
      if (unallocatedPayment <= 0) return;

      const stats = workStatsMap[work.id];
      if (!stats) return;

      const needed = stats.remainingAmount;
      if (needed <= 0) return; // already fully paid

      const allocated = Math.min(needed, unallocatedPayment);
      if (allocated > 0) {
        stats.paymentReceived += allocated;
        stats.remainingAmount = Math.max(0, stats.totalAmount - stats.paymentReceived);
        stats.payments.push({
          ...payment,
          allocatedAmount: allocated,
        });

        thisPaymentAllocations.push({
          workId: work.id,
          amount: allocated,
          workName: work.name,
        });

        unallocatedPayment -= allocated;
      }
    });

    paymentAllocationsMap[payment.id] = thisPaymentAllocations;
  });

  // 4. Update final status for each work
  let totalAllocated = 0;
  sortedWorks.forEach((w) => {
    const stats = workStatsMap[w.id];
    if (!stats) return;

    totalAllocated += stats.paymentReceived;

    if (stats.paymentReceived >= stats.totalAmount && stats.totalAmount > 0) {
      stats.status = 'Paid';
    } else if (stats.paymentReceived > 0) {
      stats.status = 'Partially Paid';
    } else {
      stats.status = 'Pending';
    }
  });

  // 5. Compute client aggregate numbers
  const totalBilling = sortedWorks.reduce(
    (sum, w) => sum + (workStatsMap[w.id]?.totalAmount || 0),
    0
  );
  const totalPaid = clientPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const remaining = Math.max(0, totalBilling - totalPaid);
  const advanceCredit = Math.max(0, totalPaid - totalBilling);

  let paymentStatus: 'Paid' | 'Partial' | 'Pending' = 'Pending';
  if (totalPaid >= totalBilling && totalBilling > 0) {
    paymentStatus = 'Paid';
  } else if (totalPaid > 0) {
    paymentStatus = 'Partial';
  }

  return {
    clientId,
    totalBilling,
    totalPaid,
    totalAllocated,
    remaining,
    advanceCredit,
    paymentStatus,
    workStatsMap,
    paymentAllocationsMap,
  };
}

export interface PaymentPreviewItem {
  workId: string;
  workName: string;
  workDate?: string;
  totalAmount: number;
  alreadyPaidBefore: number;
  remainingBefore: number;
  allocatedFromThisPayment: number;
  newTotalPaid: number;
  newRemaining: number;
  newStatus: 'Paid' | 'Partially Paid' | 'Pending';
}

export interface PaymentPreviewResult {
  totalSelectedAmount: number;
  totalSelectedRemainingBefore: number;
  totalAllocatedFromPayment: number;
  excessAdvanceAmount: number;
  items: PaymentPreviewItem[];
}

export interface ComputePaymentPreviewParams {
  clientId: string;
  clientWorks: WorkProject[];
  clientPayments: ClientPayment[];
  selectedWorkIds: string[];
  enteredAmount: number;
  paymentIdBeingEdited?: string;
}

/**
 * Computes a live preview of how an entered payment will be allocated to selected works
 * before the payment is saved.
 */
export function computePaymentPreview({
  clientId,
  clientWorks,
  clientPayments,
  selectedWorkIds,
  enteredAmount,
  paymentIdBeingEdited,
}: ComputePaymentPreviewParams): PaymentPreviewResult {
  // 1. Exclude the payment being edited to calculate base status
  const basePayments = paymentIdBeingEdited
    ? clientPayments.filter((p) => p.id !== paymentIdBeingEdited)
    : clientPayments;

  const baseAllocation = computeClientWorkAllocations(clientId, clientWorks, basePayments);

  // 2. Filter and sort selected works oldest first
  const selectedWorks = sortWorksOldestFirst(
    clientWorks.filter((w) => selectedWorkIds.includes(w.id))
  );

  let availablePayment = Math.max(0, enteredAmount);
  let totalSelectedAmount = 0;
  let totalSelectedRemainingBefore = 0;
  let totalAllocatedFromPayment = 0;

  const items: PaymentPreviewItem[] = selectedWorks.map((work) => {
    const baseStats = baseAllocation.workStatsMap[work.id];
    const totalAmount = baseStats
      ? baseStats.totalAmount
      : work.totalBilling ?? ((work.quantity || 1) * (work.clientRate || 0));
    const alreadyPaidBefore = baseStats ? baseStats.paymentReceived : 0;
    const remainingBefore = baseStats ? baseStats.remainingAmount : totalAmount;

    totalSelectedAmount += totalAmount;
    totalSelectedRemainingBefore += remainingBefore;

    const allocated = Math.min(remainingBefore, availablePayment);
    availablePayment -= allocated;
    totalAllocatedFromPayment += allocated;

    const newTotalPaid = alreadyPaidBefore + allocated;
    const newRemaining = Math.max(0, totalAmount - newTotalPaid);

    let newStatus: 'Paid' | 'Partially Paid' | 'Pending' = 'Pending';
    if (newTotalPaid >= totalAmount && totalAmount > 0) {
      newStatus = 'Paid';
    } else if (newTotalPaid > 0) {
      newStatus = 'Partially Paid';
    }

    return {
      workId: work.id,
      workName: work.name,
      workDate: getWorkEffectiveDate(work),
      totalAmount,
      alreadyPaidBefore,
      remainingBefore,
      allocatedFromThisPayment: allocated,
      newTotalPaid,
      newRemaining,
      newStatus,
    };
  });

  const excessAdvanceAmount = Math.max(0, availablePayment);

  return {
    totalSelectedAmount,
    totalSelectedRemainingBefore,
    totalAllocatedFromPayment,
    excessAdvanceAmount,
    items,
  };
}
