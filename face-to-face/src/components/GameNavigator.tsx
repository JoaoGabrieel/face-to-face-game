import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { userGame } from "../context/gameContext";

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

  return null;
}
export default GameNavigator;
