import { io } from "socket.io-client";

const ROOM_ID = "test-room-" + Date.now();
const SERVER_URL = "http://localhost:3001";

const p1 = io(SERVER_URL);
const p2 = io(SERVER_URL);
const p3 = io(SERVER_URL);

function log(who: string, data: unknown) {
  console.log(`[${who}]`, JSON.stringify(data));
}

const chosenCoringa: Record<string, boolean> = {};
const secrets: Record<string, string> = {};
let charactersList: any[] = [];
let started = false;

function joinAll() {
  p1.emit("join-room", { roomId: ROOM_ID, username: "P1" });
  setTimeout(
    () => p2.emit("join-room", { roomId: ROOM_ID, username: "P2" }),
    100,
  );
  setTimeout(
    () => p3.emit("join-room", { roomId: ROOM_ID, username: "P3" }),
    200,
  );
}

p1.on("connect", () => console.log("P1 conectado:", p1.id));
p2.on("connect", () => console.log("P2 conectado:", p2.id));
p3.on("connect", () => {
  console.log("P3 conectado:", p3.id);
  joinAll();
  setTimeout(() => {
    console.log("\n--- select-mode + start-game ---\n");
    p1.emit("select-mode", { roomId: ROOM_ID, mode: "normal" });
    setTimeout(() => p1.emit("start-game", { roomId: ROOM_ID }), 300);
  }, 500);
});

function handleUpdate(who: string, socket: typeof p1, view: any) {
  if (view.characters) {
    charactersList = view.characters;
  }

  log(who, {
    phase: view.phase,
    currentTurn: view.currentTurn,
    isMyTurn: view.isMyTurn,
    isResponder: view.isResponder,
    isActive: view.isActive,
    myResult: view.myResult,
    extraQuestions: view.extraQuestions,
    winners: view.winners,
    losers: view.losers,
  });

  if (view.phase === "choosing-coringa" && !chosenCoringa[who]) {
    chosenCoringa[who] = true;
    const idx = who === "P1" ? 0 : who === "P2" ? 5 : 10;
    socket.emit("choose-coringa", { characterId: view.characters[idx].id });
  }

  if (view.phase === "playing" && !secrets[who]) {
    socket.emit("debug-get-secret");
  }
}

p1.on("game-update", (v) => handleUpdate("P1", p1, v));
p2.on("game-update", (v) => handleUpdate("P2", p2, v));
p3.on("game-update", (v) => handleUpdate("P3", p3, v));

p1.on("debug-secret", ({ secret }) => {
  secrets.P1 = secret;
  console.log("P1 secret:", secret);
  runStep1();
});
p2.on("debug-secret", ({ secret }) => {
  secrets.P2 = secret;
  console.log("P2 secret:", secret);
});
p3.on("debug-secret", ({ secret }) => {
  secrets.P3 = secret;
  console.log("P3 secret:", secret);
});

let step1Done = false;
function runStep1() {
  if (step1Done || !secrets.P1 || charactersList.length === 0) return;
  step1Done = true;

  setTimeout(() => {
    console.log("\n--- PASSO 1: P1 responde ERRADO ---\n");
    const wrong = charactersList.find((c) => c.id !== secrets.P1);
    p1.emit("final-answer", { characterId: wrong.id });
  }, 800);
}

// Passo 2: quando o turno chegar em P2, ele acerta a própria resposta (vence)
p2.on("game-update", (view) => {
  if (
    view.phase === "playing" &&
    view.isMyTurn &&
    secrets.P2 &&
    view.myResult === null &&
    !(p2 as any)._step2Done
  ) {
    (p2 as any)._step2Done = true;
    setTimeout(() => {
      console.log("\n--- PASSO 2: P2 responde CERTO (deve vencer) ---\n");
      p2.emit("final-answer", { characterId: secrets.P2 });
    }, 800);
  }
});

// Passo 2.5: quando o turno chegar em P3, ele também acerta (vence)
p3.on("game-update", (view) => {
  if (
    view.phase === "playing" &&
    view.isMyTurn &&
    secrets.P3 &&
    view.myResult === null &&
    !(p3 as any)._step25Done
  ) {
    (p3 as any)._step25Done = true;
    setTimeout(() => {
      console.log("\n--- PASSO 2.5: P3 responde CERTO (deve vencer) ---\n");
      p3.emit("final-answer", { characterId: secrets.P3 });
    }, 800);
  }
});

// Passo 3: o último jogador ativo restante também dá a resposta certa
function watchLastStanding(who: string, socket: typeof p1) {
  socket.on("game-update", (view) => {
    if (
      view.phase === "playing" &&
      view.isLastPlayerStanding &&
      secrets[who] &&
      !(socket as any)._step3Done
    ) {
      (socket as any)._step3Done = true;
      setTimeout(() => {
        console.log(`\n--- PASSO 3: ${who} é o último, responde CERTO ---\n`);
        socket.emit("final-answer", { characterId: secrets[who] });
      }, 800);
    }
  });
}
watchLastStanding("P1", p1);
watchLastStanding("P3", p3);

setTimeout(() => {
  console.log("\nEncerrando teste.");
  process.exit(0);
}, 10000);
