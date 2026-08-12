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
    throw new Error(`Erro ao carregar pagamentos: ${error.message}`);
  }

  return { payments: payments as Payment[] };
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "validate-pin") {
    const pin = formData.get("pin");
    const level =
      pin === process.env.PIN_CODE
        ? "write"
        : pin === process.env.PIN_CODE_READONLY
          ? "read"
          : null;
    return { intent: "validate-pin", success: level !== null, level };
  }

  if (intent === "toggle-payment") {
    if (formData.get("pin") !== process.env.PIN_CODE) {
      return data(
        { intent: "toggle-payment", error: "Sem permissão para alterar pagamentos" },
        { status: 403 }
      );
    }

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

type PermissionLevel = "read" | "write";

type ActionData = {
  intent?: string;
  success?: boolean;
  paid?: boolean;
  error?: string;
  level?: PermissionLevel | null;
};

export default function Home() {
  const { payments } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<ActionData>();
  const revalidator = useRevalidator();
  const [permission, setPermission] = useState<PermissionLevel | null>(null);
  const [celebration, setCelebration] = useState<"payment" | "complete" | null>(null);
  const pinResolverRef = useRef<((value: boolean) => void) | null>(null);
  const submittedPinRef = useRef<string | null>(null);
  const validatedRef = useRef<{ pin: string; level: PermissionLevel } | null>(null);
  const pinRef = useRef<string | null>(null);
  const pendingCelebrationRef = useRef<{ isFinal: boolean } | null>(null);

  useEffect(() => {
    const pin = sessionStorage.getItem("pin");
    const level = sessionStorage.getItem("permission");
    if (pin && (level === "read" || level === "write")) {
      pinRef.current = pin;
      setPermission(level);
    }
  }, []);

  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data) {
      if (fetcher.data.intent === "validate-pin" && pinResolverRef.current) {
        const { success, level } = fetcher.data;
        if (success && level && submittedPinRef.current) {
          validatedRef.current = { pin: submittedPinRef.current, level };
        }
        pinResolverRef.current(success ?? false);
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
        submittedPinRef.current = pin;
        const formData = new FormData();
        formData.set("intent", "validate-pin");
        formData.set("pin", pin);
        fetcher.submit(formData, { method: "POST" });
      });
    },
    [fetcher]
  );

  const handlePinSuccess = useCallback(() => {
    const validated = validatedRef.current;
    if (!validated) return;
    sessionStorage.setItem("pin", validated.pin);
    sessionStorage.setItem("permission", validated.level);
    pinRef.current = validated.pin;
    setPermission(validated.level);
  }, []);

  const handleTogglePayment = useCallback(
    async (id: string, paid: boolean) => {
      const formData = new FormData();
      formData.set("intent", "toggle-payment");
      formData.set("id", id);
      formData.set("paid", String(paid));
      formData.set("pin", pinRef.current ?? "");
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

  if (!permission) {
    return <PinScreen onSuccess={handlePinSuccess} onValidate={handleValidatePin} />;
  }

  const paidCount = payments.filter((p) => p.paid).length;
  const unpaidCount = payments.length - paidCount;
  const readOnly = permission === "read";

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
          {readOnly && (
            <p className="text-slate-500 text-xs mt-1">👁️ Somente leitura</p>
          )}
        </header>

        <LoanSummary paidCount={paidCount} totalCount={payments.length} />

        <div className="mt-6 space-y-3">
          <h2 className="text-lg font-semibold text-white mb-3">Parcelas</h2>
          {payments.map((payment) => (
            <PaymentCard
              key={payment.id}
              payment={payment}
              onToggle={handleTogglePayment}
              onCelebrate={handleCelebrate}
              willComplete={unpaidCount === 1 && !payment.paid}
              readOnly={readOnly}
            />
          ))}
        </div>
      </div>

      <Celebration type={celebration} onComplete={handleCelebrationComplete} />
    </div>
  );
}
