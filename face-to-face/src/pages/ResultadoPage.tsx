import { userGame } from "../context/gameContext";
import { useParams } from "react-router-dom";
import { socket } from "../socket";

function ResultadoPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const { gameView } = userGame();

  if (!gameView) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-b from-[#9c1e40] via-[#d94f2b] to-[#f2941a]">
        <p className="text-white font-bold text-lg">Carregando...</p>
      </div>
    );
  }

  const iWon = gameView.myResult === "won";

  function handleBackToLobby() {
    console.log("clicou em voltar ao lobby,rooomId", roomId);
    if (!roomId) {
      console.log("BLOQUEADO no front: roomId ausente");
      return;
    }

    socket.emit("back-to-lobby", { roomId });
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center gap-6 bg-gradient-to-b from-[#9c1e40] via-[#d94f2b] to-[#f2941a] p-6">
      <div className="text-7xl">{iWon ? "🏆" : "💀"}</div>

      <h1 className="text-white font-extrabold text-3xl text-center">
        {iWon ? "Parabéns! Você venceu!" : "Você não conseguiu dessa vez!"}
      </h1>

      <div className="bg-white/90 rounded-2xl p-5 w-full max-w-sm">
        {gameView.winners.length > 0 && (
          <p className="text-neutral-800 font-bold text-center mb-2">
            🏆 Venceram: {gameView.winners.join(", ")}
          </p>
        )}
        {gameView.losers.length > 0 && (
          <p className="text-neutral-500 font-semibold text-center">
            💀 Perderam: {gameView.losers.join(", ")}
          </p>
        )}
      </div>
      {gameView.revealBoard && (
        <div className="w-full max-w-3xl flex flex-col gap-4">
          {gameView.revealBoard.map((board) => {
            const secretChar = gameView.characters.find(
              (c) => c.id === board.secretCharacterId,
            );
            return (
              <div key={board.playerId} className="bg-white/90 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-extrabold text-neutral-800">
                    {board.username} {board.result === "won" ? "🏆" : "💀"}
                  </p>
                  {secretChar && (
                    <p className="text-sm text-neutral-600 font-semibold">
                      Segredo: {secretChar.name}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-5 sm:grid-cols-8 gap-2">
                  {gameView.characters.map((character) => {
                    const discarded = board.eliminated.includes(character.id);
                    const selected = board.selected.includes(character.id);
                    return (
                      <div
                        key={character.id}
                        className={`aspect-square rounded-lg overflow-hidden ${
                          discarded ? "opacity-25" : ""
                        } ${selected ? "ring-2 ring-yellow-400" : ""}`}
                      >
                        <img
                          src={character.imageUrl}
                          alt={character.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <button
        onClick={handleBackToLobby}
        className="mt-4 h-14 px-8 rounded-2xl font-extrabold text-lg bg-white text-neutral-800 cursor-pointer hover:brightness-95 active:scale-[0.97]"
      >
        Voltar ao Lobby
      </button>
    </div>
  );
}

export default ResultadoPage;
