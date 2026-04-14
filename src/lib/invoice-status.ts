import type { InvoiceStatus } from "@/lib/types";

const STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  paid: "Paid",
  partially_paid: "Partially Paid",
  overdue: "Overdue",
  cancelled: "Cancelled",
};

export function formatInvoiceStatus(status?: InvoiceStatus | null) {
  if (!status) return "Draft";
  return STATUS_LABELS[status] || "Draft";
}

function isPastDueDate(dueDate?: string | null) {
  if (!dueDate) return false;

  const today = new Date();
  const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const dueDateOnly = new Date(`${dueDate}T00:00:00`);

  return dueDateOnly < todayDateOnly;
}

export function getEffectiveInvoiceStatus(
  status?: InvoiceStatus | null,
  dueDate?: string | null,
  receivedAmount = 0,
  totalAmount = 0
) {
  const normalizedStatus = status || "draft";

  if (normalizedStatus === "cancelled" || normalizedStatus === "draft") {
    return normalizedStatus;
  }

  if (totalAmount > 0 && receivedAmount >= totalAmount) {
    return "paid" as InvoiceStatus;
  }

  if (receivedAmount > 0 && receivedAmount < totalAmount) {
    return isPastDueDate(dueDate) ? ("overdue" as InvoiceStatus) : ("partially_paid" as InvoiceStatus);
  }

  if (
    isPastDueDate(dueDate) &&
    (normalizedStatus === "sent" || normalizedStatus === "partially_paid" || normalizedStatus === "overdue")
  ) {
    return "overdue" as InvoiceStatus;
  }

  if (normalizedStatus === "overdue") {
    return "sent" as InvoiceStatus;
  }

  return normalizedStatus;
}
