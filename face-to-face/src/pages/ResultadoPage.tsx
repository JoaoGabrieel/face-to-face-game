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
    <div className="min-h-screen w-full flex flex-col items-center justify-center gap-6 bg-gradient-to-b from-[#9c1e40] via-[#d94f2b] to-[#f2941a] p-6 py-10">
      <div className="text-7xl">{iWon ? "🏆" : "💀"}</div>

      <h1 className="text-white font-extrabold text-3xl text-center">
        {iWon ? "Parabéns! Você venceu!" : "Você não conseguiu dessa vez!"}
      </h1>

      <div className="bg-white rounded-2xl p-5 w-full max-w-sm">
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

      {gameView.revealBoards && (
        <div className="w-full max-w-3xl flex flex-col gap-4">
          {gameView.revealBoards.map((board) => {
            const secretChar = gameView.characters.find(
              (c) => c.id === board.secretCharacterId,
            );
            const coringaChar = gameView.characters.find(
              (c) => c.id === board.coringaId,
            );

            return (
              <div key={board.playerId} className="bg-white rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-extrabold text-neutral-800">
                    {board.username} {board.result === "won" ? "🏆" : "💀"}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="rounded-xl bg-orange-500 p-2 flex items-center gap-2">
                    {secretChar && (
                      <img
                        src={secretChar.imageUrl}
                        alt={secretChar.name}
                        className="w-10 h-10 rounded-full bg-white shrink-0"
                      />
                    )}
                    <div className="text-white text-xs font-bold leading-tight">
                      🎯 Segredo
                      <br />
                      {secretChar?.name}
                    </div>
                  </div>

                  <div className="rounded-xl bg-neutral-900 p-2 flex items-center gap-2">
                    {coringaChar && (
                      <img
                        src={coringaChar.imageUrl}
                        alt={coringaChar.name}
                        className="w-10 h-10 rounded-full bg-white shrink-0"
                      />
                    )}
                    <div className="text-white text-xs font-bold leading-tight">
                      ☠️ Coringa p/ {board.coringaTargetUsername}
                      <br />
                      {coringaChar?.name ?? "—"}
                    </div>
                  </div>
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
        className="mt-2 h-14 px-8 rounded-2xl font-extrabold text-lg bg-white text-neutral-800 cursor-pointer border-b-4 border-neutral-300 transition-all hover:brightness-95 active:border-b-0 active:translate-y-1"
      >
        Voltar ao Lobby
      </button>
    </div>
  );
}

export default ResultadoPage;
