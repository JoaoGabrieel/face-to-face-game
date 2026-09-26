import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useUser } from "../context/userContext";
import { socket } from "../socket";
import Chat from "../components/Chat";
import RulesButton from "../components/RulesButton";
import DotGrid from "../components/DotGrid";
import CharacterCreator from "../components/CharacterCreator";

interface Player {
  id: string;
  username: string;
}

const MAX_PLAYERS = 8;

function LobbyPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const { username } = useUser();
  const navigate = useNavigate();
  const [players, setPlayers] = useState<Player[]>([]);
  const [copied, setCopied] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const hasJoined = useRef(false);
  const [selectedMode, setSelectedMode] = useState<string | null>(null);
  const [timeLimit, setTimeLimit] = useState<number | null>(null);
  const [assignmentMode, setAssignmentMode] = useState<
    "coringa" | "secreto" | "ambos"
  >("coringa");
  const [customCharacter, setCustomCharacter] = useState<{
    name: string;
    imageUrl: string;
  } | null>(null);
  const [creatorOpen, setCreatorOpen] = useState(false);

  const isHost = players[0]?.id === socket.id;
  const canStart = isHost && selectedMode === "normal" && players.length >= 2;

  useEffect(() => {
    if (!username) {
      navigate(`/?room=${roomId}`);
      return;
    }

    if (!hasJoined.current) {
      socket.connect();
      socket.emit("join-room", { roomId, username });
      hasJoined.current = true;
    }

    function onPlayersUpdate(updatedPlayers: Player[]) {
      setPlayers(updatedPlayers);
    }

    function onModeUpdate(mode: string) {
      setSelectedMode(mode);
    }

    function onCustomCharacterUpdate(
      data: { name: string; imageUrl: string } | null,
    ) {
      setCustomCharacter(data);
    }

    function onTimeLimitUpdate(seconds: number | null) {
      setTimeLimit(seconds);
    }

    function onAssignmentModeUpdate(mode: "coringa" | "secreto" | "ambos") {
      setAssignmentMode(mode);
    }

    socket.on("assignment-mode-update", onAssignmentModeUpdate);

    socket.on("time-limit-update", onTimeLimitUpdate);
    socket.on("custom-character-update", onCustomCharacterUpdate);

    socket.on("players-update", onPlayersUpdate);
    socket.on("mode-update", onModeUpdate);

    return () => {
      socket.off("players-update", onPlayersUpdate);
      socket.off("mode-update", onModeUpdate);
      socket.off("custom-character-update", onCustomCharacterUpdate);
      socket.off("assignment-mode-update", onAssignmentModeUpdate);
    };
  }, [roomId, username, navigate]);

  function handleSelecteMode(mode: string) {
    if (!isHost || !roomId) return;
    socket.emit("select-mode", { roomId, mode });
  }

  function handleStartGame() {
    if (!roomId) return;
    socket.emit("start-game", { roomId });
  }

  function handleInvite() {
    const link = `${window.location.origin}/?room=${roomId}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  function handleOpenCreator() {
    if (!isHost) return;
    setCreatorOpen(true);
  }

  function handleSaveCharacter(char: { name: string; imageUrl: string }) {
    if (!roomId) return;
    socket.emit("set-custom-character", {
      roomId,
      name: char.name,
      imageUrl: char.imageUrl,
    });
    setCreatorOpen(false);
  }

  function handleSelectTimeLimit(seconds: number | null) {
    if (!isHost || !roomId) return;
    socket.emit("select-time-limit", { roomId, seconds });
  }

  function handleSelectAssignmentMode(mode: "coringa" | "secreto" | "ambos") {
    if (!isHost || !roomId) return;
    socket.emit("select-assignment-mode", { roomId, mode });
  }

  const emptySlots = Math.max(0, MAX_PLAYERS - 1 - players.length);

  return (
    <div className={`min-h-screen w-full`}>
      <RulesButton />

      <div className="min-h-screen w-full flex flex-col md:flex-row flex-wrap gap-8 items-center justify-center p-6 sm:p-10 bg-gradient-to-b from-[#9c1e40] via-[#d94f2b] to-[#f2941a] relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 pointer pointer-events-none">
          <DotGrid
            dotSize={4}
            gap={28}
            baseColor="#ffffff"
            activeColor="#fde68a"
            proximity={0}
            shockRadius={0}
            shockStrength={3}
          />
        </div>

        {copied && (
          <div className="fixed top-5 left-1/2 -translate-x-1/2 bg-neutral-900 text-white px-6 py-3 rounded-xl font-bold z-[100]">
            Link copied!
          </div>
        )}
        <div className="relative z-10 w-full max-w-[560px] md:w-[320px] md:max-w-none bg-[#781e2d] rounded-2xl p-5 flex flex-col gap-3">
          <div className="bg-white/15 text-white font-extrabold text-center py-3 rounded-2xl text-lg">
            {String(players.length).padStart(2, "0")}/{MAX_PLAYERS} Players
          </div>
          <div className="flex flex-col gap-2.5">
            {players.map((player) => (
              <div
                key={player.id}
                className="flex items-center gap-3 bg-white/25 rounded-2xl px-4 py-3 min-h-[24px]"
              >
                <img
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(player.username)}`}
                  alt={player.username}
                  className="w-[28px] h-[28px] rounded-full bg-white shrink-0"
                />
                <span className="text-white font-bold text-base truncate">
                  {player.username}
                </span>
              </div>
            ))}

            {Array.from({ length: emptySlots }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="bg-white/10 rounded-2xl px-4 py-3 min-h-[24px]"
              />
            ))}
          </div>
        </div>

        <div className="w-full max-w-[720px] md:w-[620px] md:max-w-none flex flex-col gap-6">
          <div className="relative z-10 flex flex-col sm:flex-row gap-6 bg-[#781e2d] rounded-2xl p-6 min-h-[520px]">
            <button
              onClick={() => handleSelecteMode("normal")}
              disabled={!isHost}
              className={`flex-1 rounded-2xl font-extrabold text-xl flex items-end justify-center p-6 min-h-[180px] sm:min-h-full transition-all border-b-4 ${
                selectedMode === "normal"
                  ? "bg-white border-neutral-300 ring-4 ring-yellow-400"
                  : "bg-[#fbdad7] border-[#e8a89f]"
              } ${
                isHost
                  ? "cursor-pointer hover:brightness-95 active:border-b-0 active:translate-y-1"
                  : "opacity-60 cursor-not-allowed"
              }`}
            >
              MODO NORMAL
            </button>
            <div className="flex-1 flex flex-col gap-5">
              <button
                onClick={handleOpenCreator}
                disabled={!isHost}
                className={`flex-1 rounded-2xl bg-[#fbdad7] border-b-4 border-[#e8a89f] text-neutral-800 font-extrabold text-xl flex flex-col items-center justify-end p-6 transition-all min-h-[100px] ${
                  isHost
                    ? "cursor-pointer hover:brightness-95 active:border-b-0 active:translate-y-1"
                    : "opacity-60 cursor-not-allowed"
                }`}
              >
                {customCharacter && (
                  <img
                    src={customCharacter.imageUrl}
                    alt={customCharacter.name}
                    className="w-10 h-10 rounded-full bg-white mb-1"
                  />
                )}
                CUSTOM
                {customCharacter && (
                  <span className="text-xs font-semibold mt-1">
                    {customCharacter.name} definido
                  </span>
                )}
              </button>
              <button className="flex-1 rounded-2xl bg-[#fbdad7] border-b-4 border-[#e8a89f] text-neutral-800 font-extrabold text-xl cursor-pointer flex items-end justify-center p-6 transition-all hover:brightness-95 active:border-b-0 active:translate-y-1 min-h-[100px]">
                Novidades em Breve...
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-6">
            <button
              onClick={handleInvite}
              className="flex-1 h-16 rounded-2xl font-extrabold text-lg cursor-pointer bg-white/90 text-neutral-800 border-b-4 border-neutral-300 transition-all hover:brightness-95 active:border-b-0 active:translate-y-1"
            >
              CONVIDAR
            </button>
            <button
              onClick={handleStartGame}
              disabled={!canStart}
              className={`flex-1 h-16 rounded-2xl font-extrabold text-lg bg-white/90 text-neutral-800 border-b-4 transition-all ${
                canStart
                  ? "border-neutral-300 cursor-pointer hover:brightness-95 active:border-b-0 active:translate-y-1"
                  : "border-neutral-200 opacity-50 cursor-not-allowed"
              }`}
            >
              INICIAR
            </button>
          </div>
        </div>
        <Chat
          roomId={roomId!}
          open={chatOpen}
          onToggle={() => setChatOpen((o) => !o)}
        />
      </div>
      {creatorOpen && (
        <CharacterCreator
          onCancel={() => setCreatorOpen(false)}
          onSave={handleSaveCharacter}
          timeLimit={timeLimit}
          onSelectTimeLimit={handleSelectTimeLimit}
          assignmentMode={assignmentMode}
          onSelectAssignmentMode={handleSelectAssignmentMode}
        />
      )}
    </div>
  );
}

export default LobbyPage;
