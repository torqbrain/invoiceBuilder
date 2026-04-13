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
