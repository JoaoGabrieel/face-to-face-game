import { useEffect, useState } from "react";
import type React from "react";
import { socket } from "../socket";
import { userGame } from "../context/gameContext";
import TurnAnnouncer from "../components/TurnAnnouncer";
import DotGrid from "../components/DotGrid";

function GamePage() {
  const { gameView } = userGame();
  const [finalAnswerMode, setFinalAnswerMode] = useState(false);
  const [pendingFinalId, setPendingFinalId] = useState<string | null>(null);
  const [questionText, setQuestionText] = useState("");
  const [answerText, setAnswerText] = useState("");
  const [showWrongToast, setShowWrongToast] = useState(false);
  const [displaySeconds, setDisplaySeconds] = useState<number | null>(null);

  useEffect(() => {
    if (!gameView) return;
    setDisplaySeconds(gameView.turnTimeRemaining);
  }, [gameView?.turnTimeRemaining, gameView?.turnTimerPaused]);

  useEffect(() => {
    if (
      !gameView ||
      gameView.turnTimeRemaining == null ||
      gameView.turnTimerPaused
    )
      return;
    const interval = setInterval(() => {
      setDisplaySeconds((s) => (s !== null && s > 0 ? s - 1 : s));
    }, 1000);
    return () => clearInterval(interval);
  }, [gameView?.turnTimeRemaining, gameView?.turnTimerPaused]);

  if (!gameView) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-b from-[#9c1e40] via-[#d94f2b] to-[#f2941a]">
        <p className="text-white font-bold text-lg">Carregando...</p>
      </div>
    );
  }

  const { isMyTurn, isResponder, isActive } = gameView;

  function handlePassTurn() {
    socket.emit("pass-turn", {});
  }

  function confirmFinalAnswer() {
    if (!pendingFinalId) return;
    socket.emit("final-answer", { characterId: pendingFinalId });
    setFinalAnswerMode(false);
    setPendingFinalId(null);
  }

  function cancelFinalAnswer() {
    setFinalAnswerMode(false);
    setPendingFinalId(null);
  }

  function handleLeftClick(characterId: string) {
    if (finalAnswerMode) {
      setPendingFinalId(characterId);
      return;
    }
    if (!isMyTurn) return;
    socket.emit("toggle-select", { characterId });
  }

  function handleRightClick(e: React.MouseEvent, characterId: string) {
    e.preventDefault();
    if (!isMyTurn) return;
    socket.emit("toggle-discard", { characterId });
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
    return isResponder && characterId === gameView!.opponentSecretCharacterId;
  }

  function isTrapHint(characterId: string) {
    return isResponder && characterId === gameView!.myPoisonCharacterId;
  }

  function handleSubmitQuestion() {
    if (!questionText.trim()) return;
    socket.emit("submit-question", { question: questionText.trim() });
    setQuestionText("");
  }

  function handleSubmitAnswer() {
    if (!answerText.trim()) return;
    socket.emit("submit-answer", { answer: answerText.trim() });
    setAnswerText("");
  }

  const pendingCharacter = gameView.characters.find(
    (c) => c.id === pendingFinalId,
  );

  if (!isActive) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center gap-6 bg-gradient-to-b from-[#3a3a3a] to-[#1a1a1a] p-6 sm:p-10">
        <div className="w-full max-w-4xl text-center">
          <p
            className={`font-extrabold text-2xl mb-2 ${
              gameView.myResult === "won" ? "text-green-400" : "text-red-400"
            }`}
          >
            {gameView.myResult === "won"
              ? "Você venceu! 🏆"
              : "Você caiu na armadilha 💀"}
          </p>
          <p className="text-white/70 text-sm">
            Assistindo o restante da partida — vez de{" "}
            {gameView.turnPlayerUsername}
          </p>
        </div>

        <div className="w-full max-w-4xl bg-black/30 rounded-3xl p-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
            {gameView.characters.map((character) => {
              const discarded = gameView.turnPlayerEliminated.includes(
                character.id,
              );
              const selected = gameView.turnPlayerSelected.includes(
                character.id,
              );
              return (
                <div
                  key={character.id}
                  className={`flex flex-col items-center rounded-2xl overflow-hidden opacity-90 ${
                    discarded ? "opacity-30" : ""
                  } ${selected ? "ring-4 ring-yellow-400" : ""}`}
                >
                  <div className="w-full aspect-square bg-neutral-700 flex items-center justify-center">
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
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row items-center lg:items-start justify-center gap-6 bg-gradient-to-b from-[#9c1e40] via-[#d94f2b] to-[#f2941a] p-6 sm:p-10 relative overflow-hidden">
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
      <TurnAnnouncer
        currentTurn={gameView.currentTurn}
        turnPlayerUsername={gameView.turnPlayerUsername}
        isMyTurn={gameView.isMyTurn}
      />
      {showWrongToast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 bg-red-600 text-white font-extrabold px-6 py-3 rounded-xl z-[100] shadow-lg animate-pulse">
          ❌ Resposta errada! {isMyTurn ? "Você ganhou" : "Alguém ganhou"} 2
          perguntas extras!
        </div>
      )}

      <div className="w-full max-w-4xl flex flex-col items-center gap-6">
        <div className="w-full flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center shrink-0 shadow-md">
            <span className="text-2xl">🎯</span>
          </div>
          <div className="flex-1 bg-white rounded-full px-6 py-3 shadow-md">
            <p className="text-neutral-700 font-bold text-center text-sm sm:text-base">
              {gameView.pendingQuestion
                ? gameView.pendingQuestion
                : isMyTurn
                  ? "Sua vez — faça uma pergunta"
                  : `Vez de ${gameView.turnPlayerUsername}`}
            </p>
          </div>
        </div>

        {gameView.timeLimitSeconds !== null && displaySeconds !== null && (
          <div
            className={`w-full rounded-xl py-2 text-center font-extrabold text-sm ${
              displaySeconds <= 10
                ? "bg-red-500 text-white animate-pulse"
                : "bg-white/90 text-neutral-800"
            }`}
          >
            ⏱ {Math.floor(displaySeconds / 60)}:
            {String(displaySeconds % 60).padStart(2, "0")}
            {gameView.turnTimerPaused && " (pausado)"}
          </div>
        )}
        {gameView.extraQuestions > 0 && (
          <div className="w-full bg-yellow-300/90 text-neutral-800 font-bold text-center rounded-xl py-2 text-sm">
            {isMyTurn
              ? `Você tem ${gameView.extraQuestions} pergunta(s) extra`
              : `${gameView.turnPlayerUsername} tem ${gameView.extraQuestions} pergunta(s) extra`}
          </div>
        )}

        {isMyTurn &&
          (!gameView.pendingQuestion ||
            (gameView.pendingAnswer && gameView.extraQuestions > 0)) && (
            <div className="w-full flex gap-2">
              <input
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSubmitQuestion();
                }}
                placeholder="digite sua pergunta"
                className="flex-1 rounded-full px-5 py-3 font-semibold text-neutral-800 placeholder-neutral-400 bg-white shadow-md outline-none focus:ring-4 focus:ring-yellow-400"
              />
              <button
                onClick={handleSubmitQuestion}
                disabled={!questionText.trim()}
                className={`rounded-full px-6 font-extrabold shadow-md transition ${
                  questionText.trim()
                    ? "bg-white text-neutral-800 cursor-pointer hover:brightness-95"
                    : "bg-white/50 text-neutral-500 cursor-not-allowed"
                }`}
              >
                Enviar
              </button>
            </div>
          )}

        {isResponder && gameView.pendingQuestion && !gameView.pendingAnswer && (
          <div className="w-full flex gap-2">
            <input
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmitAnswer();
              }}
              placeholder="Digite uma dica"
              className="flex-1 rounded-full px-5 py-3 font-semibold text-neutral-800 placeholder-neutral-400 bg-white shadow-md outline-none focus:ring-4 focus:ring-yellow-400"
            />
            <button
              onClick={handleSubmitAnswer}
              disabled={!answerText.trim()}
              className={`rounded-full px-6 font-extrabold shadow-md transition ${
                answerText.trim()
                  ? "bg-white text-neutral-800 cursor-pointer hover:brightness-95"
                  : "bg-white/50 text-neutral-500 cursor-not-allowed"
              }`}
            >
              Enviar
            </button>
          </div>
        )}

        {isMyTurn && gameView.pendingQuestion && !gameView.pendingAnswer && (
          <p className="text-white/80 font-semibold text-sm">
            Aguardando resposta...
          </p>
        )}

        {isMyTurn && gameView.pendingAnswer && (
          <div className="relative z-10 w-full bg-white rounded-2xl px-5 py-3">
            <p className="text-neutral-700 font-bold text-center">
              Resposta: {gameView.pendingAnswer}
            </p>
          </div>
        )}

        <div className="relative z-10 w-full bg-[#6e1830] rounded-3xl p-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
            {gameView.characters.map((character) => {
              const discarded = isDiscarded(character.id);
              const selected = isSelected(character.id);
              const isTarget = isTargetHint(character.id);
              const isTrap = isTrapHint(character.id);
              const isPending = pendingFinalId === character.id;

              const avatarBg = isTarget
                ? "bg-orange-500"
                : isTrap
                  ? "bg-neutral-900"
                  : isPending
                    ? "bg-red-500"
                    : selected && !finalAnswerMode
                      ? "bg-yellow-400"
                      : "bg-neutral-200";

              return (
                <button
                  key={character.id}
                  onClick={() => handleLeftClick(character.id)}
                  onContextMenu={(e) => handleRightClick(e, character.id)}
                  disabled={!isMyTurn && !finalAnswerMode}
                  className={`flex flex-col items-center rounded-2xl overflow-hidden transition ${
                    discarded ? "opacity-30" : ""
                  }`}
                >
                  <div
                    className={`w-full aspect-square flex items-center justify-center transition ${avatarBg}`}
                  >
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
              className="flex-1 h-14 rounded-2xl font-extrabold bg-white/85 text-neutral-800 cursor-pointer hover:brightness-95"
            >
              Passar A Vez
            </button>
            <button
              onClick={() => setFinalAnswerMode(true)}
              className="flex-1 h-14 rounded-2xl font-extrabold bg-white text-neutral-800 cursor-pointer hover:brightness-95"
            >
              Resposta Final
            </button>
          </div>
        )}

        {isMyTurn && finalAnswerMode && (
          <div className="flex flex-col items-center gap-3 w-full max-w-md">
            {pendingCharacter && (
              <p className="text-white font-bold text-center">
                Confirmar "{pendingCharacter.name}" como resposta final?
              </p>
            )}
            <div className="flex gap-4 w-full">
              <button
                onClick={cancelFinalAnswer}
                className="flex-1 h-14 rounded-2xl font-extrabold bg-white/50 text-neutral-800"
              >
                Cancelar
              </button>
              <button
                onClick={confirmFinalAnswer}
                disabled={!pendingFinalId}
                className={`flex-1 h-14 rounded-2xl font-extrabold transition ${
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

      {/* Painel lateral: jogadores + histórico */}
      <div className="w-full lg:w-72 flex flex-col gap-4 shrink-0">
        <div className="relative z-10 bg-white rounded-2xl p-4 shadow-lg">
          <h3 className="font-extrabold text-neutral-700 text-sm mb-2">
            Jogadores
          </h3>
          <div className="flex flex-col gap-1.5">
            {gameView.players.map((p) => (
              <div
                key={p.id}
                className={`text-sm font-semibold px-2 py-1 rounded-lg flex items-center gap-2 ${
                  p.active
                    ? "bg-neutral-100 text-neutral-800"
                    : "bg-neutral-50 text-neutral-400 line-through"
                }`}
              >
                <img
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(p.username)}`}
                  alt={p.username}
                  className="w-6 h-6 rounded-full bg-white shrink-0"
                />
                <span className="flex-1">{p.username}</span>
                {gameView.winners.includes(p.username) && <span>🏆</span>}
                {gameView.losers.includes(p.username) && <span>💀</span>}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/95 rounded-2xl p-4 max-h-[400px] overflow-y-auto shadow-lg">
          <h3 className="font-extrabold text-neutral-700 text-center mb-3 text-sm">
            Histórico
          </h3>
          <div className="flex flex-col gap-2">
            {gameView.questionLog.length === 0 && (
              <p className="text-neutral-400 text-xs text-center">
                Nenhuma pergunta ainda
              </p>
            )}
            {gameView.questionLog.map((entry) => (
              <div
                key={entry.id}
                className={`rounded-xl px-3 py-2 border-l-4 ${
                  entry.playerId === socket.id
                    ? "bg-orange-50 border-orange-500"
                    : "bg-neutral-50 border-neutral-300"
                }`}
              >
                <p className="text-xs font-bold text-neutral-600">
                  {entry.username}
                </p>
                <p className="text-sm text-neutral-800 font-semibold">
                  {entry.question}
                </p>
                {entry.answer && (
                  <p className="text-xs text-neutral-500 mt-1">
                    → {entry.answer}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default GamePage;
