import express from "express";
import http from "http";
import cors from "cors";
import { Server, Socket } from "socket.io";
import {
  createGame,
  setCoringa,
  getGame,
  deleteGame,
  eliminatePlayer,
  getNextActivePlayer,
  splitIntoChains,
  GameState,
} from "./game/gameState";
import { nanoid } from "nanoid";

const app = express();
app.use(cors());

const server = http.createServer(app);

const roomModes = new Map<string, string | null>();
const playerToGame = new Map<string, string>(); // socketId -> gameId
const roomTimeLimits = new Map<string, number | null>();

const gameTimers = new Map<
  string,
  { timeoutHandle: NodeJS.Timeout; startedAt: number }
>();

const customCharacters = new Map<
  string,
  { name: string; imageUrl: string } | null
>();

function isHost(roomId: string, socketId: string): boolean {
  const players = getPlayers(roomId);
  return players[0]?.id === socketId;
}

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (
        !origin ||
        origin === "http://localhost:5173" ||
        /^https:\/\/face-to-face-game.*\.vercel\.app$/.test(origin)
      ) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST"],
  },
});

interface Player {
  id: string;
  username: string;
}

interface ChatMessage {
  username: string;
  message: string;
  timestamp: number;
}

const rooms = new Map<string, Player[]>();

function getPlayers(roomId: string): Player[] {
  return rooms.get(roomId) ?? [];
}

function getGameForSocket(socketId: string): GameState | undefined {
  const gameId = playerToGame.get(socketId);
  if (!gameId) return undefined;
  return getGame(gameId);
}

function clearGameTimer(gameId: string) {
  const t = gameTimers.get(gameId);
  if (t) {
    clearTimeout(t.timeoutHandle);
    gameTimers.delete(gameId);
  }
}

function startGameTimer(game: GameState) {
  if (game.turnTimeRemaining == null || game.phase !== "playing") return;
  clearGameTimer(game.gameId);
  game.turnTimerPaused = false;

  const remainingMs = game.turnTimeRemaining * 1000;
  const startedAt = Date.now();
  const handle = setTimeout(() => handleTurnTimeout(game.gameId), remainingMs);
  gameTimers.set(game.gameId, { timeoutHandle: handle, startedAt });
}

function pauseGameTimer(game: GameState) {
  if (game.turnTimeRemaining == null || game.turnTimerPaused) return;
  const t = gameTimers.get(game.gameId);
  if (t) {
    clearTimeout(t.timeoutHandle);
    const elapsedMs = Date.now() - t.startedAt;
    game.turnTimeRemaining = Math.max(
      0,
      Math.round((game.turnTimeRemaining * 1000 - elapsedMs) / 1000),
    );
    gameTimers.delete(game.gameId);
  }
  game.turnTimerPaused = true;
}

function resumeGameTimer(game: GameState) {
  if (game.turnTimeRemaining == null || !game.turnTimerPaused) return;
  startGameTimer(game);
}

function resetGameTimerForNewTurn(game: GameState) {
  if (game.timeLimitSeconds == null || game.phase !== "playing") return;
  game.turnTimeRemaining = game.timeLimitSeconds;
  startGameTimer(game);
}

function handleTurnTimeout(gameId: string) {
  const game = getGame(gameId);
  if (!game || game.phase !== "playing") return;
  gameTimers.delete(gameId);

  game.currentTurn = getNextActivePlayer(game);
  game.extraQuestions = 0;
  game.pendingQuestion = null;
  game.pendingAnswer = null;
  resetGameTimerForNewTurn(game);
  broadcastGameUpdate(game);
}

function buildPlayerView(game: GameState, forPlayerId: string) {
  const target = game.targetOf[forPlayerId];
  const responder = game.responderOf[forPlayerId];
  const turnPlayerId = game.currentTurn;
  const turnResponder = game.responderOf[turnPlayerId];

  const winners = Object.keys(game.playerResults).filter(
    (id) => game.playerResults[id] === "won",
  );
  const losers = Object.keys(game.playerResults).filter(
    (id) => game.playerResults[id] === "lost",
  );

  const revealBoards =
    game.phase === "finished"
      ? game.players.map((id) => ({
          playerId: id,
          username: game.usernames[id],
          secretCharacterId: game.secretCharacterOf[id],
          eliminated: game.eliminatedBy[id] ?? [],
          selected: game.selectedBy[id] ?? [],
          result: game.playerResults[id] ?? null,
        }))
      : null;

  return {
    roomId: game.roomId,
    gameId: game.gameId,
    phase: game.phase,
    characters: game.characters,
    players: game.players.map((id) => ({
      id,
      username: game.usernames[id],
      active: game.activePlayers.includes(id),
    })),
    opponentSecretCharacterId: game.secretCharacterOf[target] ?? null,
    myCoringaId: game.coringaOf[forPlayerId] ?? null,
    myPoisonCharacterId: game.coringaOf[responder] ?? null,
    myEliminated: game.eliminatedBy[forPlayerId] ?? [],
    mySelected: game.selectedBy[forPlayerId] ?? [],
    turnPlayerEliminated: game.eliminatedBy[turnPlayerId] ?? [],
    turnPlayerSelected: game.selectedBy[turnPlayerId] ?? [],
    currentTurn: game.currentTurn,
    turnPlayerUsername: game.usernames[turnPlayerId],
    isMyTurn: forPlayerId === turnPlayerId,
    isResponder: forPlayerId === turnResponder,
    isActive: game.activePlayers.includes(forPlayerId),
    extraQuestions: game.extraQuestions,
    myResult: game.playerResults[forPlayerId] ?? null,
    winners: winners.map((id) => game.usernames[id]),
    losers: losers.map((id) => game.usernames[id]),
    isLastPlayerStanding:
      game.activePlayers.length === 1 && game.activePlayers[0] === forPlayerId,
    pendingQuestion: game.pendingQuestion,
    pendingAnswer: game.pendingAnswer,
    lastWrongAnswerAt: game.lastWrongAnswer,
    questionLog: game.questionLog,
    revealBoards,
    timeLimitSeconds: game.timeLimitSeconds,
    turnTimeRemaining: game.turnTimeRemaining,
    turnTimerPaused: game.turnTimerPaused,
  };
}

function broadcastGameUpdate(game: GameState) {
  game.players.forEach((id) => {
    io.to(id).emit("game-update", buildPlayerView(game, id));
  });
}

io.on("connection", (socket: Socket) => {
  console.log(`Cliente conectado: ${socket.id}`);

  socket.on("start-game", ({ roomId }: { roomId: string }) => {
    console.log("SERVIDOR recebeu start-game:", {
      socketId: socket.id,
      roomId,
    });
    const roomPlayers = getPlayers(roomId);
    console.log("Jogadores na sala:", roomPlayers);

    if (roomPlayers.length < 2) {
      console.log("BLOQUEADO start-game: menos de 2 jogadores");
      return;
    }
    if (!isHost(roomId, socket.id)) {
      console.log("BLOQUEADO start-game: não é host");
      return;
    }
    if (roomModes.get(roomId) !== "normal") {
      console.log(
        "BLOQUEADO start-game: modo não é normal, é",
        roomModes.get(roomId),
      );
      return;
    }

    const chains = splitIntoChains(roomPlayers);
    console.log(
      "Correntes formadas:",
      chains.map((c) => c.map((p) => p.username)),
    );

    chains.forEach((chainPlayers) => {
      const game = createGame(
        roomId,
        chainPlayers,
        customCharacters.get(roomId),
        roomTimeLimits.get(roomId),
      );
      resetGameTimerForNewTurn(game);
      chainPlayers.forEach((p) => {
        playerToGame.set(p.id, game.gameId);
        io.to(p.id).emit("game-update", buildPlayerView(game, p.id));
      });
    });
  });

  socket.on("back-to-lobby", ({ roomId }: { roomId: string }) => {
    console.log("SERVIDOR recebeu back-to-lobby:", {
      socketId: socket.id,
      roomId,
    });
    const game = getGameForSocket(socket.id);
    console.log("Jogo encontrado?", !!game, game?.gameId);

    if (game) {
      game.players.forEach((id) => {
        playerToGame.delete(id);
        io.to(id).emit("return-to-lobby", { roomId });
      });
      clearGameTimer(game.gameId);
      deleteGame(game.gameId);
      console.log("Notificou jogadores:", game.players);
    } else {
      console.log("BLOQUEADO: nenhum jogo encontrado pra esse socket");
    }
    roomModes.delete(roomId);
  });

  socket.on("choose-coringa", ({ characterId }: { characterId: string }) => {
    const game = getGameForSocket(socket.id);
    if (!game) return;
    const updated = setCoringa(game.gameId, socket.id, characterId);
    if (!updated) return;
    resetGameTimerForNewTurn(updated);
    broadcastGameUpdate(updated);
  });

  socket.on(
    "select-mode",
    ({ roomId, mode }: { roomId: string; mode: string }) => {
      console.log("SERVIDOR recebeu select-mode:", {
        socketId: socket.id,
        roomId,
        mode,
      });
      if (!isHost(roomId, socket.id)) {
        console.log("BLOQUEADO select-mode: não é host", {
          socketId: socket.id,
          players: getPlayers(roomId),
        });
        return;
      }
      roomModes.set(roomId, mode);
      io.to(roomId).emit("mode-update", mode);
      console.log("SERVIDOR aplicou modo:", roomModes.get(roomId));
    },
  );

  socket.on(
    "join-room",
    ({ roomId, username }: { roomId: string; username: string }) => {
      socket.join(roomId);
      socket.data.roomId = roomId;
      socket.data.username = username;

      const players = getPlayers(roomId);

      if (!players.find((p) => p.id === socket.id)) {
        players.push({ id: socket.id, username });
        rooms.set(roomId, players);
      }

      io.to(roomId).emit("players-update", players);
    },
  );

  socket.on(
    "chat-message",
    ({ roomId, message }: { roomId: string; message: string }) => {
      const username = (socket.data.username as string) ?? "Unknown";
      const chatMessage: ChatMessage = {
        username,
        message,
        timestamp: Date.now(),
      };
      io.to(roomId).emit("chat-message", chatMessage);
    },
  );

  socket.on("disconnect", () => {
    const roomId = socket.data.roomId as string | undefined;
    playerToGame.delete(socket.id);
    if (!roomId) return;

    const remaining = getPlayers(roomId).filter((p) => p.id !== socket.id);

    if (remaining.length === 0) {
      rooms.delete(roomId);
      roomModes.delete(roomId);
      customCharacters.delete(roomId);
    } else {
      rooms.set(roomId, remaining);
    }

    io.to(roomId).emit("players-update", remaining);
    console.log(`Cliente desconectado: ${socket.id}`);
  });

  socket.on("toggle-select", ({ characterId }: { characterId: string }) => {
    const game = getGameForSocket(socket.id);
    if (!game || game.phase !== "playing") return;
    if (socket.id !== game.currentTurn) return;

    const current = game.selectedBy[socket.id];

    if (current.includes(characterId)) {
      game.selectedBy[socket.id] = [];
    } else {
      game.selectedBy[socket.id] = [characterId];

      const discardList = game.eliminatedBy[socket.id];
      const idx = discardList.indexOf(characterId);
      if (idx >= 0) discardList.splice(idx, 1);
    }
    broadcastGameUpdate(game);
  });

  socket.on("toggle-discard", ({ characterId }: { characterId: string }) => {
    const game = getGameForSocket(socket.id);
    if (!game || game.phase !== "playing") return;
    if (socket.id !== game.currentTurn) return;

    const list = game.eliminatedBy[socket.id];
    const idx = list.indexOf(characterId);

    if (idx >= 0) {
      list.splice(idx, 1);
    } else {
      list.push(characterId);

      if (game.selectedBy[socket.id].includes(characterId)) {
        game.selectedBy[socket.id] = [];
      }
    }

    broadcastGameUpdate(game);
  });

  socket.on(
    "select-time-limit",
    ({ roomId, seconds }: { roomId: string; seconds: number | null }) => {
      if (!isHost(roomId, socket.id)) return;
      roomTimeLimits.set(roomId, seconds);
      io.to(roomId).emit("time-limit-update", seconds);
    },
  );

  socket.on("pass-turn", () => {
    const game = getGameForSocket(socket.id);
    if (!game || game.phase !== "playing") return;
    if (socket.id !== game.currentTurn) return;

    game.currentTurn = getNextActivePlayer(game);
    game.extraQuestions = 0;
    game.pendingQuestion = null;
    game.pendingAnswer = null;
    resetGameTimerForNewTurn(game);

    broadcastGameUpdate(game);
  });

  socket.on("submit-question", ({ question }: { question: string }) => {
    const game = getGameForSocket(socket.id);
    if (!game || game.phase !== "playing") return;
    if (socket.id !== game.currentTurn) return;
    if (game.responderOf[socket.id] === socket.id) return;
    if (!question.trim()) return;

    if (game.extraQuestions > 0) {
      game.extraQuestions -= 1;
    }

    game.questionLog.push({
      id: nanoid(8),
      playerId: socket.id,
      username: game.usernames[socket.id],
      question: question.trim(),
      answer: null,
    });

    game.pendingQuestion = question.trim();
    game.pendingAnswer = null;
    pauseGameTimer(game);
    broadcastGameUpdate(game);
  });

  socket.on("submit-answer", ({ answer }: { answer: string }) => {
    const game = getGameForSocket(socket.id);
    if (!game || game.phase !== "playing") return;
    if (socket.id !== game.responderOf[game.currentTurn]) return;
    if (!game.pendingQuestion || game.pendingAnswer) return;
    if (!answer.trim()) return;

    const lastEntry = game.questionLog[game.questionLog.length - 1];
    if (lastEntry) {
      lastEntry.answer = answer.trim();
    }
    game.pendingAnswer = answer.trim();
    resumeGameTimer(game);
    broadcastGameUpdate(game);
  });

  socket.on(
    "set-custom-character",
    ({
      roomId,
      name,
      imageUrl,
    }: {
      roomId: string;
      name: string;
      imageUrl: string;
    }) => {
      if (!isHost(roomId, socket.id)) return;
      customCharacters.set(roomId, { name, imageUrl });
      io.to(roomId).emit("custom-character-update", { name, imageUrl });
    },
  );

  socket.on("clear-custom-character", ({ roomId }: { roomId: string }) => {
    if (!isHost(roomId, socket.id)) return;
    customCharacters.delete(roomId);
    io.to(roomId).emit("custom-character-update", null);
  });

  socket.on("debug-get-secret", () => {
    const game = getGameForSocket(socket.id);
    if (!game) return;
    socket.emit("debug-secret", { secret: game.secretCharacterOf[socket.id] });
  });

  socket.on("final-answer", ({ characterId }: { characterId: string }) => {
    const game = getGameForSocket(socket.id);
    if (!game || game.phase !== "playing") return;
    if (socket.id !== game.currentTurn) return;

    const mySecret = game.secretCharacterOf[socket.id];
    const responderId = game.responderOf[socket.id];
    const myPoison =
      responderId !== socket.id ? game.coringaOf[responderId] : undefined;

    if (myPoison && characterId === myPoison) {
      const updated = eliminatePlayer(game.gameId, socket.id, "lost");
      if (updated) {
        resetGameTimerForNewTurn(updated);
        broadcastGameUpdate(updated);
      }
      return;
    }

    if (characterId === mySecret) {
      const updated = eliminatePlayer(game.gameId, socket.id, "won");
      if (updated) {
        resetGameTimerForNewTurn(updated);
        broadcastGameUpdate(updated);
      }
      return;
    }

    const nextPlayer = getNextActivePlayer(game);
    game.currentTurn = nextPlayer;
    resetGameTimerForNewTurn(game);
    game.extraQuestions = 2;
    game.pendingQuestion = null;
    game.pendingAnswer = null;
    game.lastWrongAnswer = Date.now();
    broadcastGameUpdate(game);
  });
});

const PORT = process.env.PORT ?? 3001;
server.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
