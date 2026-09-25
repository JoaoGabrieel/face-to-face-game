import { useEffect, useRef, useState } from "react";

interface Props {
  currentTurn: string;
  turnPlayerUsername: string;
  isMyTurn: boolean;
}

function TurnAnnouncer({ currentTurn, turnPlayerUsername, isMyTurn }: Props) {
  const [visible, setVisible] = useState(false);
  const previousTurn = useRef<string | null>(null);

  useEffect(() => {
    if (previousTurn.current === null) {
      previousTurn.current = currentTurn;
      return;
    }
    if (previousTurn.current === currentTurn) return;

    previousTurn.current = currentTurn;
    setVisible(true);

    // som curto gerado via Web Audio API (sem precisar de arquivo)
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(isMyTurn ? 660 : 440, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch {
      // navegador pode bloquear áudio antes de interação do usuário
    }

    const timer = setTimeout(() => setVisible(false), 2000);
    return () => clearTimeout(timer);
  }, [currentTurn, isMyTurn]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[90] pointer-events-none">
      <div
        className={`px-10 py-6 rounded-3xl shadow-2xl animate-bounce ${
          isMyTurn ? "bg-yellow-400" : "bg-white/95"
        }`}
      >
        <p className="text-3xl font-extrabold text-neutral-800 text-center">
          {isMyTurn ? "SUA VEZ!" : `Vez de ${turnPlayerUsername}`}
        </p>
      </div>
    </div>
  );
}

export default TurnAnnouncer;
