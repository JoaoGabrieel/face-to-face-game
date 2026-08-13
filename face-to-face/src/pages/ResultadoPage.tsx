import { useNavigate } from "react-router-dom";
import { userGame } from "../context/gameContext";
import { socket } from "../socket";
import { useParams } from "react-router-dom";

function ResultadoPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const { gameView, resetGame } = userGame();
  const navigate = useNavigate();

  if (!gameView) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-b from-[#9c1e40] via-[#d94f2b] to-[#f2941a]">
        <p className="text-white font-bold text-lg">Carregando...</p>
      </div>
    );
  }

  const iWon = gameView.winnerId === socket.id;

  function handleBackToLobby() {
    if (!roomId) {
      console.log("BLOQUEADO no front: roomId ausente");
      return;
    }
    console.log("Emitindo back-to-lobby:", roomId);
    socket.emit("back-to-lobby", { roomId });
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center gap-6 bg-gradient-to-b from-[#9c1e40] via-[#d94f2b] to-[#f2941a] p-6">
      <div className="text-7xl">{iWon ? "🏆" : "💀"}</div>

      <h1 className="text-white font-extrabold text-3xl text-center">
        {iWon
          ? `Parabéns! Você venceu o jogo!`
          : `Que pena! ${gameView.winnerUsername} venceu o jogo!`}
      </h1>

      <p className="text-white/80 font-semibold text-lg text-center">
        Vencedor: {gameView.winnerUsername}
      </p>

      <button
        className="mt-4 h-14 px-8 rounded-2xl font-extrabold text-lg bg-white text-neutral-800 cursor-pointer hover:brightness-95 active:scale-[0.97]"
        onClick={() => {
          resetGame();
          handleBackToLobby();
        }}
      >
        Voltar ao Lobby
      </button>
    </div>
  );
}

export default ResultadoPage;
