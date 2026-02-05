export type Payment = {
  id: string;
  installment_number: number;
  due_date: string;
  paid: boolean;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
};

export type PaymentStatus = "paid" | "pending" | "overdue";

export function getPaymentStatus(payment: Payment): PaymentStatus {
  if (payment.paid) return "paid";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(payment.due_date + "T00:00:00");
  return dueDate < today ? "overdue" : "pending";
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString + "T00:00:00");
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
  }).format(date);
}
