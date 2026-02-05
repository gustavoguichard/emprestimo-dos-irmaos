import { useState, useRef, useEffect } from "react";

type PinScreenProps = {
  onSuccess: () => void;
  onValidate: (pin: string) => Promise<boolean>;
};

export function PinScreen({ onSuccess, onValidate }: PinScreenProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isValidating) return;

    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setError(false);
    setPin(value);

    if (value.length === 6) {
      setIsValidating(true);
      const isValid = await onValidate(value);
      if (isValid) {
        onSuccess();
      } else {
        setError(true);
        setPin("");
        inputRef.current?.focus();
      }
      setIsValidating(false);
    }
  };

  const handleDigitClick = (digit: string) => {
    if (isValidating || pin.length >= 6) return;
    const newPin = pin + digit;
    setPin(newPin);
    setError(false);

    if (newPin.length === 6) {
      handleSubmit(newPin);
    }
  };

  const handleDelete = () => {
    setPin((p) => p.slice(0, -1));
    setError(false);
  };

  const handleSubmit = async (value: string) => {
    setIsValidating(true);
    const isValid = await onValidate(value);
    if (isValid) {
      onSuccess();
    } else {
      setError(true);
      setPin("");
      inputRef.current?.focus();
    }
    setIsValidating(false);
  };

  const digits = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"];

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center p-6"
      onClick={() => inputRef.current?.focus()}
    >
      <input
        ref={inputRef}
        type="text"
        inputMode="none"
        pattern="[0-9]*"
        autoComplete="one-time-code"
        value={pin}
        onChange={handleChange}
        className="sr-only"
        autoFocus
      />

      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">🔐 Área Restrita</h1>
        <p className="text-slate-400 text-sm">Digite o PIN para acessar</p>
      </div>

      <div className="flex gap-3 mb-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full transition-all duration-200 ${
              error
                ? "bg-red-500 animate-pulse"
                : pin.length > i
                  ? "bg-emerald-400 scale-110"
                  : "bg-slate-600"
            }`}
          />
        ))}
      </div>

      {error && (
        <p className="text-red-400 text-sm mb-4 animate-pulse">
          PIN incorreto. Tente novamente.
        </p>
      )}

      <div className="grid grid-cols-3 gap-4 max-w-xs">
        {digits.map((digit, i) => (
          <button
            key={i}
            type="button"
            onClick={() => {
              if (digit === "⌫") handleDelete();
              else if (digit !== "") handleDigitClick(digit);
              inputRef.current?.focus();
            }}
            disabled={digit === "" || isValidating}
            className={`w-20 h-20 rounded-2xl text-2xl font-semibold transition-all duration-150
              ${
                digit === ""
                  ? "invisible"
                  : digit === "⌫"
                    ? "bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 active:scale-95"
                    : "bg-slate-700/80 text-white hover:bg-slate-600 active:scale-95 active:bg-slate-500"
              }
              disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {digit}
          </button>
        ))}
      </div>
    </div>
  );
}
