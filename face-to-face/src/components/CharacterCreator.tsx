import { useState } from "react";

const TOP_OPTIONS = [
  "hat",
  "hijab",
  "turban",
  "winterHat1",
  "winterHat02",
  "winterHat03",
  "winterHat04",
  "bob",
  "bun",
  "curly",
  "curvy",
  "dreads",
  "frida",
  "fro",
  "froBand",
  "longButNotTooLong",
  "miaWallace",
  "shavedSides",
  "straight02",
  "straight01",
  "straightAndStrand",
  "dreads01",
  "dreads02",
  "frizzle",
  "shaggy",
  "shaggyMullet",
  "shortCurly",
  "shortFlat",
  "shortRound",
  "shortWaved",
  "sides",
  "theCaesar",
  "theCaesarAndSidePart",
  "bigHair",
];

const EYES_OPTIONS = [
  "closed",
  "cry",
  "default",
  "eyeRoll",
  "happy",
  "hearts",
  "side",
  "squint",
  "surprised",
  "winkWacky",
  "wink",
  "xDizzy",
];

const SKIN_OPTIONS = [
  "614335",
  "d08b5b",
  "ae5d29",
  "edb98a",
  "ffdbb4",
  "fd9841",
  "f8d25c",
];

const ACCESSORIES_OPTIONS = [
  "none",
  "kurt",
  "prescription01",
  "prescription02",
  "round",
  "sunglasses",
  "wayfarers",
  "eyepatch",
];

function cycle(index: number, length: number, dir: 1 | -1) {
  return (index + dir + length) % length;
}

interface CharacterCreatorProps {
  onSave: (character: { name: string; imageUrl: string }) => void;
  onCancel: () => void;
  timeLimit: number | null;
  onSelectTimeLimit: (seconds: number | null) => void;
  assignmentMode: "coringa" | "secreto" | "ambos";
  onSelectAssignmentMode: (mode: "coringa" | "secreto" | "ambos") => void;
}

function Selector({
  label,
  value,
  onPrev,
  onNext,
}: {
  label: string;
  value: string;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-white/80 font-bold text-sm uppercase tracking-wide">
        {label}
      </span>
      <div className="flex items-center gap-3">
        <button
          onClick={onPrev}
          className="w-9 h-9 rounded-full bg-white text-neutral-800 font-extrabold border-b-4 border-neutral-300 active:border-b-0 active:translate-y-1 transition-all"
        >
          ‹
        </button>
        <span className="text-white font-semibold text-sm w-28 text-center truncate">
          {value}
        </span>
        <button
          onClick={onNext}
          className="w-9 h-9 rounded-full bg-white text-neutral-800 font-extrabold border-b-4 border-neutral-300 active:border-b-0 active:translate-y-1 transition-all"
        >
          ›
        </button>
      </div>
    </div>
  );
}

function CharacterCreator({
  onSave,
  onCancel,
  timeLimit,
  onSelectTimeLimit,
  assignmentMode,
  onSelectAssignmentMode,
}: CharacterCreatorProps) {
  const [name, setName] = useState("");
  const [topIdx, setTopIdx] = useState(0);
  const [eyesIdx, setEyesIdx] = useState(0);
  const [skinIdx, setSkinIdx] = useState(0);
  const [accIdx, setAccIdx] = useState(0);
  const [seed] = useState(() => Math.random().toString(36).slice(2, 10));

  const top = TOP_OPTIONS[topIdx];
  const eyes = EYES_OPTIONS[eyesIdx];
  const skinColor = SKIN_OPTIONS[skinIdx];
  const accessory = ACCESSORIES_OPTIONS[accIdx];

  function buildUrl() {
    const params = new URLSearchParams();
    params.set("seed", seed);
    params.set("top", top);
    params.set("topProbability", "100");
    params.set("eyes", eyes);
    params.set("skinColor", skinColor);
    if (accessory === "none") {
      params.set("accessoriesProbability", "0");
    } else {
      params.set("accessories", accessory);
      params.set("accessoriesProbability", "100");
    }
    return `https://api.dicebear.com/7.x/avataaars/svg?${params.toString()}`;
  }

  const previewUrl = buildUrl();

  function handleSave() {
    if (!name.trim()) return;
    onSave({ name: name.trim(), imageUrl: previewUrl });
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 overflow-y-auto">
      <div className="bg-[#781e2d] rounded-3xl max-w-lg w-full p-6 flex flex-col items-center gap-6 shadow-2xl my-8">
        <h2 className="text-white font-extrabold text-xl uppercase tracking-wide">
          Modo Custom
        </h2>

        {/* ↓ ISSO JÁ EXISTE — preview do personagem, sem mudança */}
        <div className="w-40 h-40 rounded-full bg-white overflow-hidden shadow-lg">
          <img
            src={previewUrl}
            alt="Preview"
            className="w-full h-full object-cover"
          />
        </div>

        {/* ↓ ISSO JÁ EXISTE — input de nome, sem mudança */}
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nome do personagem"
          maxLength={20}
          className="w-full rounded-full px-5 py-3 font-semibold text-neutral-800 placeholder-neutral-400 bg-white outline-none focus:ring-4 focus:ring-yellow-400"
        />

        {/* ↓ ISSO JÁ EXISTE — grid com os 4 Selectors (Cabelo/Olhos/Pele/Acessório), sem mudança */}
        <div className="grid grid-cols-2 gap-5 w-full">
          <Selector
            label="Cabelo"
            value={top}
            onPrev={() => setTopIdx((i) => cycle(i, TOP_OPTIONS.length, -1))}
            onNext={() => setTopIdx((i) => cycle(i, TOP_OPTIONS.length, 1))}
          />
          <Selector
            label="Olhos"
            value={eyes}
            onPrev={() => setEyesIdx((i) => cycle(i, EYES_OPTIONS.length, -1))}
            onNext={() => setEyesIdx((i) => cycle(i, EYES_OPTIONS.length, 1))}
          />
          <Selector
            label="Pele"
            value={`#${skinColor}`}
            onPrev={() => setSkinIdx((i) => cycle(i, SKIN_OPTIONS.length, -1))}
            onNext={() => setSkinIdx((i) => cycle(i, SKIN_OPTIONS.length, 1))}
          />
          <Selector
            label="Acessório"
            value={accessory}
            onPrev={() =>
              setAccIdx((i) => cycle(i, ACCESSORIES_OPTIONS.length, -1))
            }
            onNext={() =>
              setAccIdx((i) => cycle(i, ACCESSORIES_OPTIONS.length, 1))
            }
          />
        </div>

        <div className="w-full h-px bg-white/20" />

        <div className="w-full flex flex-col gap-3">
          <p className="text-white font-extrabold text-sm uppercase tracking-wide text-center">
            Limite de tempo por turno
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            {[
              { label: "Desativado", value: null },
              { label: "30s", value: 30 },
              { label: "1 min", value: 60 },
              { label: "2 min", value: 120 },
            ].map((opt) => (
              <button
                key={opt.label}
                onClick={() => onSelectTimeLimit(opt.value)}
                className={`px-5 py-2 rounded-full font-bold text-sm border-b-4 transition-all ${
                  timeLimit === opt.value
                    ? "bg-yellow-400 text-neutral-800 border-yellow-600"
                    : "bg-white/80 text-neutral-800 border-neutral-300"
                } cursor-pointer hover:brightness-95 active:border-b-0 active:translate-y-1`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="w-full h-px bg-white/20" />

        <div className="w-full flex flex-col gap-3">
          <p className="text-white font-extrabold text-sm uppercase tracking-wide text-center">
            Quem escolhe o quê
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            {[
              { label: "Só Coringa", value: "coringa" as const },
              { label: "Só Segredo", value: "secreto" as const },
              { label: "Ambos", value: "ambos" as const },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => onSelectAssignmentMode(opt.value)}
                className={`px-5 py-2 rounded-full font-bold text-sm border-b-4 transition-all ${
                  assignmentMode === opt.value
                    ? "bg-yellow-400 text-neutral-800 border-yellow-600"
                    : "bg-white/80 text-neutral-800 border-neutral-300"
                } cursor-pointer hover:brightness-95 active:border-b-0 active:translate-y-1`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <p className="text-white/60 text-xs text-center">
            Define se quem responde por você escolhe sua armadilha, seu segredo,
            ou os dois.
          </p>
        </div>

        <div className="flex gap-4 w-full">
          <button
            onClick={onCancel}
            className="flex-1 h-14 rounded-2xl font-extrabold bg-white/50 text-neutral-800 border-b-4 border-white/30 active:border-b-0 active:translate-y-1 transition-all"
          >
            Fechar
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className={`flex-1 h-14 rounded-2xl font-extrabold border-b-4 transition-all ${
              name.trim()
                ? "bg-yellow-400 text-neutral-800 border-yellow-600 active:border-b-0 active:translate-y-1"
                : "bg-white/30 text-white/40 border-white/20 cursor-not-allowed"
            }`}
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}

export default CharacterCreator;
