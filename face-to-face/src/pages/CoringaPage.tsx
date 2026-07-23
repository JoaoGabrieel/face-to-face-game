import { useState } from "react";
import { useParams } from "react-router-dom";
import { socket } from "../socket";
import { userGame } from "../context/gameContext";

function CoringaPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const { gameView } = userGame();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (!gameView) {
    return (
      <div className=" min-h-screen w-full flex items-center justify-center bg-gradient-to-b from-[#9c1e40] via-[#d94f2b] to-[#f2941a]">
        <p className="text-white font-bold text-lg">Carregando...</p>
      </div>
    );
  }

  const hasChosen = gameView.myCoringaId !== null;

  const bgClass = gameView.isPlayer1
    ? "bg-gradient-to-b from-[#9c1e40] via-[#d94f2b] to-[#f2941a]" // quente
    : "bg-gradient-to-b from-[#1e3c72] via-[#2a5298] to-[#4facfe]"; // fria

  function handleConfirm() {
    if (!roomId || !selectedId) return;
    socket.emit("choose-coringa", { roomId, characterId: selectedId });
  }

  if (hasChosen) {
    return (
      <div
        className={`min-h-screen w-full flex flex-col items-center justify-center gap-4 ${bgClass} p-6`}
      >
        <p className="text-white font-extrabold text-2xl text-center">
          Coringa Escolhido
        </p>
        <p className="text-white/80 font-semibold text-center">
          Aguardando o adversario escolher o dele
        </p>
        <div className="w-10 h-10 border-4 border-white/40 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen w-full flex flex-col items-center gap-6 ${bgClass} p-6 sm:p-10 `}
    >
      <div className="w-full max-w-4xl flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center shrink-0 shadow-md">
          <span className="text-2xl">coringa</span>
        </div>
        <div className="flex-1 bg-white rounded-full px-6 py-3 shadow-md">
          <p className="text-neutral-700 font-bold text-center text-sm sm:text-base">
            Escolha o personagem Coringa (armadilha)
          </p>
        </div>
      </div>

      <div className="w-full max-w-4xl bg-black/10 rounded-3xl p-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
          {gameView.characters.map((character) => {
            const isSelected = selectedId === character.id;
            return (
              <button
                key={character.id}
                onClick={() => setSelectedId(character.id)}
                className={`flex flex-col items-center rounded-2xl overflow-hidden transition ${
                  isSelected
                    ? "ring-4 ring-yellow-400 scale-[1.03]"
                    : "hover:brightness-95"
                }`}
              >
                <div className="w-full aspect-square bg-neutral-200 flex items-center justify-center">
                  <img
                    src={character.imageUrl}
                    alt={character.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="w-full bg-white py-1.5">
                  <span className="text-xs font-bold text-neutral-700 block text-center truncate px-1">
                    {character.name}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <button
        onClick={handleConfirm}
        disabled={!selectedId}
        className={`w-full max-w-xs h-14 rounded-2xl font-extrabold text-lg transition active:scale-[0.97] ${
          selectedId
            ? "bg-white text-neutral-800 cursor-pointer hover:brightness-95 shadow-md"
            : "bg-white/30 text-white/60 cursor-not-allowed"
        }`}
      >
        Confirmar o Coringa
      </button>
    </div>
  );
}

export default CoringaPage;
