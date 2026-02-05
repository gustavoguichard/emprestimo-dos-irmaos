import { useEffect, useState } from "react";
import confetti from "canvas-confetti";

type CelebrationProps = {
  type: "payment" | "complete" | null;
  onComplete: () => void;
};

export function Celebration({ type, onComplete }: CelebrationProps) {
  const [emoji, setEmoji] = useState<string | null>(null);

  useEffect(() => {
    if (!type) return;

    if (type === "complete") {
      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.8 },
          colors: ["#10b981", "#059669", "#34d399", "#6ee7b7"],
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.8 },
          colors: ["#10b981", "#059669", "#34d399", "#6ee7b7"],
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        } else {
          setTimeout(onComplete, 500);
        }
      };
      frame();
    } else {
      setEmoji("🎉");
      setTimeout(() => {
        setEmoji(null);
        onComplete();
      }, 1500);
    }
  }, [type, onComplete]);

  if (type === "payment" && emoji) {
    return (
      <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-50">
        <span className="text-8xl animate-bounce">{emoji}</span>
      </div>
    );
  }

  if (type === "complete") {
    return (
      <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-50">
        <div className="text-center animate-pulse">
          <p className="text-6xl mb-4">🎊</p>
          <p className="text-2xl font-bold text-white">Quitado!</p>
          <p className="text-emerald-400">Parabéns, Gigio!</p>
        </div>
      </div>
    );
  }

  return null;
}
