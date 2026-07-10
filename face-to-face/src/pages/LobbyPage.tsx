import { use, useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useUser } from "../context/userContext";
import { socket } from "../socket";
import Chat from "../components/Chat";

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

    socket.on("players-update", onPlayersUpdate);

    return () => {
      socket.off("players-update", onPlayersUpdate);
    };
  }, [roomId, username, navigate]);

  function handleInvite() {
    const link = `${window.location.origin}/?room=${roomId}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  const emptySlots = Math.max(0, MAX_PLAYERS - 1 - players.length);

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row flex-wrap gap-8 items-center justify-center p-6 sm:p-10 bg-gradient-to-b from-[#9c1e40] via-[#d94f2b] to-[#f2941a] relative">
      {copied && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 bg-neutral-900 text-white px-6 py-3 rounded-xl font-bold z-[100]">
          Link copied!
        </div>
      )}
      <div className="w-full max-w-[560px] md:w-[320px] md:max-w-none bg-[#781e2d]/60 rounded-2xl p-5 flex flex-col gap-3">
        <div className="bg-white/15 text-white font-extrabold text-center py-3 rounded-2xl text-lg">
          {String(players.length).padStart(2, "0")}/{MAX_PLAYERS} Players
        </div>
        <div className="flex flex-col gap-2.5">
          {players.map((player) => (
            <div
              key={player.id}
              className="flex items-center gap-3 bg-white/25 rounded-2xl px-4 py-3 min-h-[24px]"
            >
              <span className="w-[28px] h-[28px] rounded-full bg-white shrink-0" />
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

      <div className="w-full max-w-[560px] md:w-[620px] md:max-w-none flex flex-col gap-5">
        <div className="flex flex-col sm:flex-row gap-5 bg-[#781e2d]/50 rounded-2xl p-5 min-h-[420px]">
          <button className="flex-1 rounded-2xl bg-[#fbdad7] text-neutral-800 font-extrabold text-xl cursor-pointer flex items-end justify-center p-6 transition hover:brightness-95 hover:-translate-y-0.5 min-h-[180px] sm:min-h-full">
            MODO NORMAL
          </button>
          <div className="flex-1 flex flex-col gap-5">
            <button className="flex-1 rounded-2xl bg-[#fbdad7] text-neutral-800 font-extrabold text-xl cursor-pointer flex items-end justify-center p-6 transition hover:brightness-95 hover:-translate-y-0.5 min-h-[100px]">
              CUSTOM
            </button>
            <button className="flex-1 rounded-2xl bg-[#fbdad7] text-neutral-800 font-extrabold text-xl cursor-pointer flex items-end justify-center p-6 transition hover:brightness-95 hover:-translate-y-0.5 min-h-[100px]">
              MODO ESPECIAL
            </button>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-5">
          <button
            onClick={handleInvite}
            className="flex-1 h-16 rounded-2xl font-extrabold text-lg cursor-pointer bg-white/85 text-neutral-800 transition hover:brightness-95 active:scale-[0.97]"
          >
            CONVIDAR
          </button>
          <button className="flex-1 h-16 rounded-2xl font-extrabold text-lg cursor-pointer bg-white/85 text-neutral-800 transition hover:brightness-95 active:scale-[0.97]">
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
  );
}

export default LobbyPage;
