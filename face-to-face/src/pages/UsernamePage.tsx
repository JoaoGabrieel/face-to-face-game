import { useState, type KeyboardEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { nanoid } from "nanoid/non-secure";
import { useUser } from "../context/userContext";

function UsernamePage() {
  const [name, setName] = useState("");
  const navigate = useNavigate();
  const { setUsername } = useUser();
  const [searchParams] = useSearchParams();

  function handleSubmit() {
    const trimmed = name.trim();
    if (!trimmed) return;

    setUsername(trimmed);

    const redirectRooom = searchParams.get("room");
    const roomId = redirectRooom ?? nanoid(6);

    navigate(`/lobby/${roomId}`);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      handleSubmit();
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-gradient-to-b from-[#9c1e40] via-[#d94f2b] to-[#f2941a]">
      <div className="flex flex-col sm:flex-row w-full max-w-[700px] min-h-[420px] rounded-3xl overflow-hidden shadow-2xl">
        <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-[#c9633f] to-[#f2941a] py-10 sm:py-0">
          <div className="w-24 h-24 sm:w-[45%] sm:h-auto sm:aspect-square rounded-full bg-[#d9d9d9] shadow-inner" />
        </div>
        <div className="flex-1 bg-white flex flex-col items-center justify-center gap-7 p-8">
          <h1 className="text-xl sm:text-2xl font-extrabold text-neutral-900 text-center m-0">
            Digite seu nome
          </h1>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={20}
            autoFocus
            className="w-full max-w-[280px] h-11 rounded-full bg-[#d9d9d9] text-black px-5 text-base outline-none focus:ring-2 focus:ring-[#d94f2b] transition"
          />
          <button
            onClick={handleSubmit}
            disabled={!name.trim()}
            className="w-full max-w-[220px] h-12 rounded-full bg-neutral-500 text-white font-extrabold text-lg cursor-pointer transition hover:bg-neutral-600 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-neutral-500"
          >
            Pronto
          </button>
        </div>
      </div>
    </div>
  );
}

export default UsernamePage;
