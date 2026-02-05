import { formatCurrency } from "~/lib/types";

type LoanSummaryProps = {
  paidCount: number;
  totalCount: number;
};

const PRINCIPAL = 5000;
const INTEREST = 700;
const TOTAL = 5700;
const INSTALLMENT = 570;

export function LoanSummary({ paidCount, totalCount }: LoanSummaryProps) {
  const paidAmount = paidCount * INSTALLMENT;
  const remainingAmount = (totalCount - paidCount) * INSTALLMENT;
  const progress = (paidCount / totalCount) * 100;

  return (
    <div className="bg-slate-800/50 rounded-3xl p-6 border border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-slate-400 text-sm">Empréstimo</p>
          <p className="text-white text-2xl font-bold">
            Gigio → Guga
          </p>
        </div>
        <div className="text-4xl">🤝</div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6 text-center">
        <div>
          <p className="text-slate-500 text-xs uppercase tracking-wide">
            Principal
          </p>
          <p className="text-white font-semibold">{formatCurrency(PRINCIPAL)}</p>
        </div>
        <div>
          <p className="text-slate-500 text-xs uppercase tracking-wide">
            Juros
          </p>
          <p className="text-amber-400 font-semibold">{formatCurrency(INTEREST)}</p>
        </div>
        <div>
          <p className="text-slate-500 text-xs uppercase tracking-wide">Total</p>
          <p className="text-emerald-400 font-semibold">{formatCurrency(TOTAL)}</p>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-slate-400">Progresso</span>
          <span className="text-white font-medium">
            {paidCount}/{totalCount} parcelas
          </span>
        </div>
        <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex justify-between text-sm">
        <div>
          <p className="text-slate-500">Pago</p>
          <p className="text-emerald-400 font-bold">{formatCurrency(paidAmount)}</p>
        </div>
        <div className="text-right">
          <p className="text-slate-500">Restante</p>
          <p className="text-white font-bold">{formatCurrency(remainingAmount)}</p>
        </div>
      </div>
    </div>
  );
}
