import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { socket } from "../socket";
import type { GameView } from "../types/game";

interface GameContextType {
  gameView: GameView | null;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const [gameView, setGameView] = useState<GameView | null>(null);

  useEffect(() => {
    function onGameUpdate(view: GameView) {
      setGameView(view);
    }

    socket.on("game-update", onGameUpdate);
    return () => {
      socket.off("game-update", onGameUpdate);
    };
  }, []);
  return (
    <GameContext.Provider value={{ gameView }}>{children}</GameContext.Provider>
  );
}

export function userGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGame deve ser usado no GameProvider");
  }
  return context;
}
