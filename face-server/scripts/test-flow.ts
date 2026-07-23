import { io } from "socket.io-client";

const ROOM_ID = "test-room-" + Date.now();
const SERVER_URL = "http://localhost:3001";

const player1 = io(SERVER_URL);
const player2 = io(SERVER_URL);

function log(who: string, event: string, data: unknown) {
  console.log(`[${who}] ${event}:`, JSON.stringify(data));
}

let p1Secret = "";
let p2CoringaId = "";
let lastCharacters: { id: string }[] = [];
let round = 0;
let p2PassCount = 0;

function startRound(n: number) {
  round = n;
  p2PassCount = 0;
  console.log(`\n========== RODADA ${n} ==========\n`);
  player1.emit("start-game", { roomId: ROOM_ID });
}

player1.on("connect", () => {
  player1.emit("join-room", { roomId: ROOM_ID, username: "Jogador1" });
});

player2.on("connect", () => {
  player2.emit("join-room", { roomId: ROOM_ID, username: "Jogador2" });
  setTimeout(() => startRound(1), 500);
});

player1.on("debug-secret", ({ secret }: { secret: string }) => {
  p1Secret = secret;
  console.log("P1 secret recebido:", secret);
  tryFinalAnswer();
});

let p1Chose = false;
let p2Chose = false;

player1.on("game-update", (view) => {
  log("P1", "game-update", {
    phase: view.phase,
    currentTurn: view.currentTurn,
    myCoringaId: view.myCoringaId,
    winnerId: view.winnerId,
    extraQuestions: view.extraQuestions,
  });

  lastCharacters = view.characters;

  if (view.phase === "choosing-coringa" && !p1Chose) {
    p1Chose = true;
    player1.emit("choose-coringa", {
      roomId: ROOM_ID,
      characterId: view.characters[0].id,
    });
  }

  if (view.phase === "playing" && !p1Secret) {
    player1.emit("debug-get-secret", { roomId: ROOM_ID });
  }

  if (
    view.phase === "playing" &&
    view.currentTurn === player2.id &&
    round === 3 &&
    p2PassCount < 2
  ) {
    p2PassCount++;
    setTimeout(() => {
      console.log(`P2 passando a vez (${p2PassCount}/2)`);
      player2.emit("pass-turn", { roomId: ROOM_ID });
    }, 300);
  }

  if (view.phase === "finished") {
    console.log(
      `RESULTADO rodada ${round}: winnerId = ${view.winnerId}, extraQuestions = ${view.extraQuestions}`,
    );
    p1Secret = "";
    p1Chose = false;
    p2Chose = false;
    if (round < 3) setTimeout(() => startRound(round + 1), 500);
    else setTimeout(() => process.exit(0), 1500);
  }
});

player2.on("game-update", (view) => {
  log("P2", "game-update", {
    phase: view.phase,
    currentTurn: view.currentTurn,
    myCoringaId: view.myCoringaId,
    winnerId: view.winnerId,
    extraQuestions: view.extraQuestions,
  });

  if (view.phase === "choosing-coringa" && !p2Chose) {
    p2Chose = true;
    const characterId = view.characters[5].id;
    p2CoringaId = characterId;
    player2.emit("choose-coringa", { roomId: ROOM_ID, characterId });
  }

  if (view.phase === "playing" && view.currentTurn === player1.id) {
    player2.emit("debug-get-secret", { roomId: ROOM_ID });
  }
});

function tryFinalAnswer() {
  if (round === 1) {
    console.log("P1 respondendo CERTO (o próprio segredo)");
    player1.emit("final-answer", { roomId: ROOM_ID, characterId: p1Secret });
  } else if (round === 2) {
    console.log("P1 respondendo o CORINGA do adversário");
    player1.emit("final-answer", { roomId: ROOM_ID, characterId: p2CoringaId });
  } else if (round === 3) {
    const wrongOne = lastCharacters.find(
      (c) => c.id !== p1Secret && c.id !== p2CoringaId,
    );
    console.log("P1 respondendo ERRADO (comum):", wrongOne!.id);
    player1.emit("final-answer", {
      roomId: ROOM_ID,
      characterId: wrongOne!.id,
    });
  }
}
