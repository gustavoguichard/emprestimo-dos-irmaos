import { useState, useCallback, useEffect, useRef } from "react";
import { data, useFetcher, useLoaderData, useRevalidator } from "react-router";
import type { Route } from "./+types/home";
import { supabase } from "~/lib/supabase.server";
import type { Payment } from "~/lib/types";
import { PinScreen } from "~/components/PinScreen";
import { PaymentCard } from "~/components/PaymentCard";
import { LoanSummary } from "~/components/LoanSummary";
import { Celebration } from "~/components/Celebration";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Empréstimo dos Irmãos" },
    {
      name: "description",
      content: "Controle de empréstimo entre Guga e Gigio",
    },
  ];
}

export async function loader({}: Route.LoaderArgs) {
  const { data: payments, error } = await supabase
    .from("irmaos_payments")
    .select("*")
    .order("installment_number", { ascending: true });

  if (error) {
    throw new Error("Erro ao carregar pagamentos");
  }

  return { payments: payments as Payment[] };
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "validate-pin") {
    const pin = formData.get("pin");
    const isValid = pin === process.env.PIN_CODE;
    return { intent: "validate-pin", success: isValid };
  }

  if (intent === "toggle-payment") {
    const id = formData.get("id") as string;
    const paid = formData.get("paid") === "true";

    const { error } = await supabase
      .from("irmaos_payments")
      .update({
        paid,
        paid_at: paid ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      return data({ intent: "toggle-payment", error: "Erro ao atualizar pagamento" }, { status: 500 });
    }

    return { intent: "toggle-payment", success: true, paid };
  }

  return { error: "Ação inválida" };
}

type ActionData = {
  intent?: string;
  success?: boolean;
  paid?: boolean;
  error?: string;
};

export default function Home() {
  const { payments } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<ActionData>();
  const revalidator = useRevalidator();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [celebration, setCelebration] = useState<"payment" | "complete" | null>(null);
  const pinResolverRef = useRef<((value: boolean) => void) | null>(null);
  const pendingCelebrationRef = useRef<{ isFinal: boolean } | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("authenticated");
    if (stored === "true") {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data) {
      if (fetcher.data.intent === "validate-pin" && pinResolverRef.current) {
        pinResolverRef.current(fetcher.data.success ?? false);
        pinResolverRef.current = null;
      }
      if (fetcher.data.intent === "toggle-payment" && fetcher.data.success) {
        revalidator.revalidate();
        if (fetcher.data.paid && pendingCelebrationRef.current) {
          setCelebration(pendingCelebrationRef.current.isFinal ? "complete" : "payment");
          pendingCelebrationRef.current = null;
        }
      }
    }
  }, [fetcher.state, fetcher.data, revalidator]);

  const handleValidatePin = useCallback(
    (pin: string): Promise<boolean> => {
      return new Promise((resolve) => {
        pinResolverRef.current = resolve;
        const formData = new FormData();
        formData.set("intent", "validate-pin");
        formData.set("pin", pin);
        fetcher.submit(formData, { method: "POST" });
      });
    },
    [fetcher]
  );

  const handlePinSuccess = useCallback(() => {
    sessionStorage.setItem("authenticated", "true");
    setIsAuthenticated(true);
  }, []);

  const handleTogglePayment = useCallback(
    async (id: string, paid: boolean) => {
      const formData = new FormData();
      formData.set("intent", "toggle-payment");
      formData.set("id", id);
      formData.set("paid", String(paid));
      fetcher.submit(formData, { method: "POST" });
    },
    [fetcher]
  );

  const handleCelebrate = useCallback((isFinal: boolean) => {
    pendingCelebrationRef.current = { isFinal };
  }, []);

  const handleCelebrationComplete = useCallback(() => {
    setCelebration(null);
  }, []);

  if (!isAuthenticated) {
    return <PinScreen onSuccess={handlePinSuccess} onValidate={handleValidatePin} />;
  }

  const paidCount = payments.filter((p) => p.paid).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 pb-8">
      <div className="max-w-md mx-auto">
        <header className="text-center py-6">
          <h1 className="text-2xl font-bold text-white mb-1">
            💸 Empréstimo dos Irmãos
          </h1>
          <p className="text-slate-400 text-sm">
            Gigio pagando o Guga em 10x
          </p>
        </header>

        <LoanSummary paidCount={paidCount} totalCount={payments.length} />

        <div className="mt-6 space-y-3">
          <h2 className="text-lg font-semibold text-white mb-3">Parcelas</h2>
          {payments.map((payment, index) => {
            const allPreviousPaid = payments
              .slice(0, index)
              .every((p) => p.paid);
            const allNextUnpaid = payments
              .slice(index + 1)
              .every((p) => !p.paid);
            return (
              <PaymentCard
                key={payment.id}
                payment={payment}
                onToggle={handleTogglePayment}
                onCelebrate={handleCelebrate}
                isLast={index === payments.length - 1}
                allPaidBefore={allPreviousPaid}
                allUnpaidAfter={allNextUnpaid}
              />
            );
          })}
        </div>
      </div>

      <Celebration type={celebration} onComplete={handleCelebrationComplete} />
    </div>
  );
}
