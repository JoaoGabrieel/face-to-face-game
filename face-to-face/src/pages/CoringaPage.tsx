import { useState } from "react";
import { socket } from "../socket";
import { userGame } from "../context/gameContext";

function CoringaPage() {
  const { gameView } = userGame();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (!gameView) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-b from-[#9c1e40] via-[#d94f2b] to-[#f2941a]">
        <p className="text-white font-bold text-lg">Carregando...</p>
      </div>
    );
  }

  const hasChosen = gameView.myCoringaId !== null;

  function handleConfirm() {
    if (!selectedId) return;
    socket.emit("choose-coringa", { characterId: selectedId });
  }

  if (hasChosen) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center gap-4 bg-gradient-to-b from-[#9c1e40] via-[#d94f2b] to-[#f2941a] p-6">
        <p className="text-white font-extrabold text-2xl text-center">
          Coringa escolhido!
        </p>
        <p className="text-white/80 font-semibold text-center">
          Aguardando os outros jogadores escolherem o deles...
        </p>
        <div className="w-10 h-10 border-4 border-white/40 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center gap-6 bg-gradient-to-b from-[#9c1e40] via-[#d94f2b] to-[#f2941a] p-6 sm:p-10">
      <div className="text-center">
        <h1 className="text-white font-extrabold text-2xl">
          Escolha seu Coringa
        </h1>
        <p className="text-white/80 font-semibold mt-1">
          Esse será o personagem-armadilha. Se apontarem ele como resposta
          final, quem apontou perde na hora.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4 w-full max-w-4xl">
        {gameView.characters.map((character) => {
          const isSelected = selectedId === character.id;
          return (
            <button
              key={character.id}
              onClick={() => setSelectedId(character.id)}
              className={`flex flex-col items-center gap-2 rounded-2xl p-3 transition ${
                isSelected
                  ? "bg-white/90 ring-4 ring-yellow-400 scale-[1.03]"
                  : "bg-white/25 hover:bg-white/35"
              }`}
            >
              <img
                src={character.imageUrl}
                alt={character.name}
                className="w-16 h-16 rounded-full bg-white"
              />
              <span
                className={`text-sm font-bold text-center ${
                  isSelected ? "text-neutral-800" : "text-white"
                }`}
              >
                {character.name}
              </span>
            </button>
          );
        })}
      </div>

      <button
        onClick={handleConfirm}
        disabled={!selectedId}
        className={`w-full max-w-xs h-14 rounded-2xl font-extrabold text-lg transition active:scale-[0.97] ${
          selectedId
            ? "bg-white/85 text-neutral-800 cursor-pointer hover:brightness-95"
            : "bg-white/30 text-white/60 cursor-not-allowed"
        }`}
      >
        CONFIRMAR CORINGA
      </button>
    </div>
  );
}

export default CoringaPage;
