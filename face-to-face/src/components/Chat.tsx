import { use, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { socket } from "../socket";

interface ChatMessage {
  username: string;
  message: string;
  timestamp: number;
}

interface ChatProps {
  roomId: string;
  open: boolean;
  onToggle: () => void;
}

function Chat({ roomId, open, onToggle }: ChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onChatMessage(msg: ChatMessage) {
      setMessages((prev) => [...prev, msg]);
    }

    socket.on("chat-message", onChatMessage);
    return () => {
      socket.off("chat-message", onChatMessage);
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  function sendMessage() {
    const trimmed = input.trim();
    if (!trimmed) return;
    socket.emit("chat-message", { roomId, message: trimmed });
    setInput("");
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      sendMessage();
    }
  }
  if (!open) {
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-6 w-[280px] max-w-[calc(100%-48px)] h-11 rounded-full bg-white/30 backdrop-blur-sm text-white/85 font-semibold text-left px-5 cursor-pointer transition hover:bg-white/40 z-50"
      >
        Digite no chat
      </button>
    );
  }
  return (
    <div className="fixed bottom-6 right-6 w-80 max-w[calc(100%-48px)] h-[420px] max-h-[calc(100vh-48px)] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden z-50">
      <div className="bg-[#9c1e40] text-white font-extrabold px-4 py-3 flex items-center justify-between">
        <span>Chat</span>
        <button
          onClick={onToggle}
          aria-label="Fechar chat"
          className="bg-transparent border-none text-white cursor-pointer"
        >
          ×
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2">
        {messages.length === 0 && (
          <div className="text-neutral-400 text-sm text-center mt-5">
            Nenhuma mensagem enviada ainda.
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className="text-sm text-neutral-800 break-words">
            <strong className="text-[#9c1e40]">{m.username}:</strong>{" "}
            {m.message}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2 p-3 border-t border-neutral-200">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Digite sua mensagem..."
          className="flex-1 h-[38px] rounded-full border border-neutral-300 px-3.5 outline-none text-sm focus:border-[#d94f2b] transition"
        />
        <button
          onClick={sendMessage}
          className="h-[38px] px-4 rounded-full bg-[#d94f2b] text-white font-bold cursor-pointer hover:brightness-95 transition"
        >
          Enviar
        </button>
      </div>
    </div>
  );
}

export default Chat;
