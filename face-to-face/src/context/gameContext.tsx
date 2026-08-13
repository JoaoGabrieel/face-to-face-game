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
  resetGame: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const [gameView, setGameView] = useState<GameView | null>(null);

  useEffect(() => {
    function onGameUpdate(view: GameView) {
      setGameView(view);
    }
    function onReturnToLobby() {
      console.log("GameContext recebeu return-to-lobby, limpando gameView");
      setGameView(null);
    }

    socket.on("game-update", onGameUpdate);
    socket.on("game-return-to-lobby", onReturnToLobby);
    return () => {
      socket.off("game-update", onGameUpdate);
      socket.off("game-return-to-lobby", onReturnToLobby);
    };
  }, []);
  return (
    <GameContext.Provider
      value={{ gameView, resetGame: () => setGameView(null) }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function userGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGame deve ser usado no GameProvider");
  }
  return context;
}
