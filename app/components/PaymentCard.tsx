import { useState } from "react";
import {
  type Payment,
  getPaymentStatus,
  formatCurrency,
  formatDate,
} from "~/lib/types";

type PaymentCardProps = {
  payment: Payment;
  onToggle: (id: string, paid: boolean) => Promise<void>;
  onCelebrate: (isFinal: boolean) => void;
  isLast: boolean;
  allPaidBefore: boolean;
  allUnpaidAfter: boolean;
};

const INSTALLMENT_AMOUNT = 570;

export function PaymentCard({
  payment,
  onToggle,
  onCelebrate,
  isLast,
  allPaidBefore,
  allUnpaidAfter,
}: PaymentCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const status = getPaymentStatus(payment);

  const canPay = !payment.paid && allPaidBefore;
  const canUnpay = payment.paid && allUnpaidAfter;
  const isDisabled = isLoading || (!canPay && !canUnpay);

  const handleClick = async () => {
    if (isDisabled) return;
    setIsLoading(true);

    const newPaidState = !payment.paid;
    await onToggle(payment.id, newPaidState);

    if (newPaidState) {
      const isFinalPayment = isLast && allPaidBefore;
      onCelebrate(isFinalPayment);
    }

    setIsLoading(false);
  };

  return (
    <button
      onClick={handleClick}
      disabled={isDisabled}
      className={`w-full p-4 rounded-2xl transition-all duration-300 text-left relative overflow-hidden
        ${
          status === "paid"
            ? "bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 border-2 border-emerald-500/50"
            : status === "overdue"
              ? "bg-gradient-to-r from-red-500/20 to-orange-500/20 border-2 border-red-500/50"
              : "bg-slate-800/50 border-2 border-slate-700"
        }
        ${isDisabled ? "opacity-50 cursor-not-allowed" : "hover:border-slate-500 active:scale-[0.98]"}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold
            ${
              status === "paid"
                ? "bg-emerald-500 text-white"
                : status === "overdue"
                  ? "bg-red-500 text-white"
                  : "bg-slate-700 text-slate-300"
            }`}
          >
            {status === "paid" ? "✓" : payment.installment_number}
          </div>
          <div>
            <p className="text-white font-semibold">
              Parcela {payment.installment_number}/10
            </p>
            <p className="text-slate-400 text-sm">
              Vence {formatDate(payment.due_date)}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-white font-bold">
            {formatCurrency(INSTALLMENT_AMOUNT)}
          </p>
          <p
            className={`text-xs font-medium ${
              status === "paid"
                ? "text-emerald-400"
                : status === "overdue"
                  ? "text-red-400"
                  : "text-slate-500"
            }`}
          >
            {status === "paid"
              ? "Pago"
              : status === "overdue"
                ? "Atrasado"
                : "Pendente"}
          </p>
        </div>
      </div>

      {isLoading && (
        <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      )}
    </button>
  );
}
