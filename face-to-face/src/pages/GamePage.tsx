import { useParams } from "react-router-dom";
import { socket } from "../socket";
import { userGame } from "../context/gameContext";
import type React from "react";
import { useState } from "react";

function GamePage() {
  const { roomId } = useParams<{ roomId: string }>();
  const { gameView } = userGame();
  const [finalAnswerMode, setFinalAnswerMode] = useState(false);
  const [pendingFinalId, setPendingFinalId] = useState<string | null>(null);

  if (!gameView) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-b from-[#9c1e40] via-[#d94f2b] to-[#f2941a]">
        <p className="text-white font-bold text-lg">Carregando...</p>
      </div>
    );
  }

  const isMyTurn = gameView.currentTurn === socket.id;
  const bgClass = gameView.turnIsPlayer1
    ? "bg-gradient-to-b from-[#9c1e40] via-[#d94f2b] to-[#f2941a]"
    : "bg-gradient-to-b from-[#1e3c72] via-[#2a5298] to-[#4facfe]";

  function handlePassTurn() {
    if (!roomId) return;
    socket.emit("pass-turn", { roomId });
  }

  function confirmFinalAnswer() {
    if (!roomId) return;
    socket.emit("final-answer", { roomId, characterId: pendingFinalId });
    setFinalAnswerMode(false);
    setPendingFinalId(null);
  }

  function cancelFinalAnswer() {
    setFinalAnswerMode(false);
    setPendingFinalId(null);
  }

  function handleLeftClick(characterId: string) {
    if (!roomId) return;

    if (finalAnswerMode) {
      setPendingFinalId(characterId);
      return;
    }

    if (!isMyTurn) return;
    socket.emit("toggle-select", { roomId, characterId });
  }

  function handleRightClick(e: React.MouseEvent, characterId: string) {
    e.preventDefault();
    if (!isMyTurn || !roomId) return;
    socket.emit("toggle-discard", { roomId, characterId });
  }

  function isDiscarded(characterId: string) {
    return isMyTurn
      ? gameView!.myEliminated.includes(characterId)
      : gameView!.turnPlayerEliminated.includes(characterId);
  }

  function isSelected(characterId: string) {
    return isMyTurn
      ? gameView!.mySelected.includes(characterId)
      : gameView!.turnPlayerSelected.includes(characterId);
  }

  function isTargetHint(characterId: string) {
    return !isMyTurn && characterId === gameView!.opponentSecretCharacterId;
  }

  function isTrapHint(characterId: string) {
    return !isMyTurn && characterId === gameView!.myCoringaId;
  }

  return (
    <div
      className={`min-h-screen w-full flex flex-col items-center gap-6 ${bgClass} p-6 sm:p-10`}
    >
      <div className="w-full max-w-4xl flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center shrink-0 shadow-md">
          <span className="text-2xl">🎯</span>
        </div>
        <div className="flex-1 bg-white rounded-full px-6 py-3 shadow-md">
          <p className="text-neutral-700 font-bold text-center text-sm sm:text-base">
            {isMyTurn
              ? "Sua vez — faça uma pergunta"
              : "Aguardando pergunta do adversário"}
          </p>
        </div>
      </div>

      <div className="w-full max-w-4xl bg-black/10 rounded-3xl p-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
          {gameView.characters.map((character) => {
            const discarded = isDiscarded(character.id);
            const selected = isSelected(character.id);
            const isTarget = isTargetHint(character.id);
            const isTrap = isTrapHint(character.id);
            const isPending = pendingFinalId === character.id;

            return (
              <button
                key={character.id}
                onClick={() => handleLeftClick(character.id)}
                onContextMenu={(e) => handleRightClick(e, character.id)}
                disabled={!isMyTurn && !finalAnswerMode}
                className={`flex flex-col items-center rounded-2xl overflow-hidden transition ${
                  discarded ? "opacity-30" : ""
                } ${selected ? "ring-4 ring-yellow-400" : ""} ${
                  isTarget ? "ring-4 ring-orange-500" : ""
                } ${isTrap ? "ring-4 ring-black" : ""} ${
                  isPending ? "ring-4 ring-red-500 scale-[1.03]" : ""
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
      {isMyTurn && !finalAnswerMode && (
        <div className="flex gap-4 w-full max-w-md">
          <button
            onClick={handlePassTurn}
            className=" flex-1 h-14 rounded-2xl font-extrabold bg-white/85 text-neutral-800"
          >
            Passar A Vez
          </button>
          <button
            onClick={() => setFinalAnswerMode(true)}
            className="flex-1 h-14 rounded-2xl font-extrabold bg-white text-neutral-800"
          >
            Resposta Final
          </button>
        </div>
      )}

      {isMyTurn && finalAnswerMode && (
        <div className="flex flex-col items-center gap-3 w-full max-w-md">
          {pendingFinalId && (
            <p className="text-white font-bold text-center">
              Confirmar "
              {gameView.characters.find((c) => c.id === pendingFinalId)?.name}"
              como resposta final?
            </p>
          )}
          <div className="flex gap-4 w-full">
            <button
              onClick={cancelFinalAnswer}
              className="flex-1 h-14 rounded-2xl font-extrabold bg-white/50 text-neutral-800 cursor-pointer hover:brightness-95 active:scale-[0.97]"
            >
              Cancelar
            </button>
            <button
              onClick={confirmFinalAnswer}
              disabled={!pendingFinalId}
              className={`flex-1 h-14 rounded-2xl font-extrabold transition active:scale-[0.97] ${
                pendingFinalId
                  ? "bg-white text-neutral-800 cursor-pointer hover:brightness-95"
                  : "bg-white/30 text-white/60 cursor-not-allowed"
              }`}
            >
              Confirmar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
export default GamePage;
