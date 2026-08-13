import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { userGame } from "../context/gameContext";
import { socket } from "../socket";

function GameNavigator() {
  const { gameView } = userGame();
  const navigate = useNavigate();

  useEffect(() => {
    if (!gameView) return;

    const { phase, roomId } = gameView;

    if (phase === "choosing-coringa") {
      navigate(`/coringa/${roomId}`);
    } else if (phase === "playing") {
      navigate(`/game/${roomId}`);
    } else if (phase === "finished") {
      navigate(`/resultado/${roomId}`);
    }
  }, [gameView, navigate]);

  useEffect(() => {
    function onReturnToLobby({ roomId }: { roomId: string }) {
      console.log(
        "GameNavigator recebeu return-to-lobby, navegando pra lobby:",
        roomId,
      );
      navigate(`/lobby/${roomId}`);
    }

    socket.on("return-to-lobby", onReturnToLobby);

    return () => {
      socket.off("return-to-lobby", onReturnToLobby);
    };
  }, [navigate]);

  return null;
}
export default GameNavigator;
