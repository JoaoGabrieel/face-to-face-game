import { useState } from "react";
import { socket } from "../socket";
import { userGame } from "../context/gameContext";
import DotGrid from "../components/DotGrid";

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

  const { assignmentMode, myCoringaChosen, mySecretChosen } = gameView;

  // Decide qual etapa mostrar agora
  const currentStep: "coringa" | "secreto" | "done" =
    assignmentMode === "coringa"
      ? myCoringaChosen
        ? "done"
        : "coringa"
      : assignmentMode === "secreto"
        ? mySecretChosen
          ? "done"
          : "secreto"
        : !myCoringaChosen
          ? "coringa"
          : !mySecretChosen
            ? "secreto"
            : "done";

  function handleConfirm() {
    if (!selectedId) return;
    if (currentStep === "coringa") {
      socket.emit("choose-coringa", { characterId: selectedId });
    } else if (currentStep === "secreto") {
      socket.emit("choose-secret", { characterId: selectedId });
    }
    setSelectedId(null);
  }

  if (currentStep === "done") {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center gap-4 bg-gradient-to-b from-[#9c1e40] via-[#d94f2b] to-[#f2941a] p-6">
        <p className="text-white font-extrabold text-2xl text-center">
          Escolha concluída!
        </p>
        <p className="text-white/80 font-semibold text-center">
          Aguardando os outros jogadores...
        </p>
        <div className="w-10 h-10 border-4 border-white/40 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  const isCoringaStep = currentStep === "coringa";

  return (
    <div className="min-h-screen w-full flex flex-col items-center gap-6 bg-gradient-to-b from-[#9c1e40] via-[#d94f2b] to-[#f2941a] p-6 sm:p-10 relative overflow-hidden">
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <DotGrid
          dotSize={4}
          gap={28}
          baseColor="#ffffff"
          activeColor="#ffffff"
          proximity={120}
          shockRadius={0}
          shockStrength={0}
          speedTrigger={999999}
        />
      </div>

      <div className="text-center">
        <h1 className="text-white font-extrabold text-2xl">
          {isCoringaStep
            ? "Escolha seu Coringa"
            : "Escolha o Segredo do Adversário"}
        </h1>
        <p className="text-white/80 font-semibold mt-1">
          {isCoringaStep
            ? "Esse será o personagem-armadilha. Se apontarem ele como resposta final, quem apontou perde na hora."
            : "Você está escolhendo qual será o personagem secreto que a próxima pessoa da corrente vai tentar adivinhar."}
        </p>
        {assignmentMode === "ambos" && (
          <p className="text-yellow-300 font-bold text-sm mt-2">
            Etapa {isCoringaStep ? "1" : "2"} de 2
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4 w-full max-w-4xl">
        {gameView.characters.map((character) => {
          const isSelected = selectedId === character.id;
          return (
            <button
              key={character.id}
              onClick={() => setSelectedId(character.id)}
              className={`relative z-10 flex flex-col items-center gap-2 rounded-2xl p-3 transition ${
                isSelected
                  ? "bg-white ring-4 ring-yellow-400 scale-[1.03]"
                  : "bg-[#a13a4a] hover:bg-[#b04555]"
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
        {isCoringaStep ? "CONFIRMAR CORINGA" : "CONFIRMAR SEGREDO"}
      </button>
    </div>
  );
}

export default CoringaPage;
