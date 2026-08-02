import express from "express";
import http, { get } from "http";
import cors from "cors";
import { Server, Socket } from "socket.io";
import { createGame, setCoringa, getGame, GameState } from "./game/gameState";
import { strict } from "assert";

const app = express();
app.use(cors());

const server = http.createServer(app);

const roomModes = new Map<string, string | null>();

function isHost(roomId: string, socketId: string): boolean {
  const players = getPlayers(roomId);
  return players[0]?.id === socketId;
}

const io = new Server(server, {
  cors: {
    origin: "*",
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

function buildPlayerView(game: GameState, forPlayerId: string) {
  const opponentId =
    forPlayerId === game.player1Id ? game.player2Id : game.player1Id;
  const turnPlayerId = game.currentTurn;

  const winnerUsername =
    game.winnerId === game.player1Id
      ? game.player1Username
      : game.winnerId === game.player2Id
        ? game.player2Username
        : null;

  return {
    roomId: game.roomId,
    phase: game.phase,
    characters: game.characters,
    opponentSecretCharacterId: game.secretCharacterOf[opponentId],
    oppenentUsername:
      forPlayerId === game.player1Id
        ? game.player2Username
        : game.player1Username,
    mySecretCharacterId: game.secretCharacterOf[forPlayerId],
    opponentCoringaId: game.coringaOf[opponentId] ?? null,
    myCoringaId: game.coringaOf[forPlayerId] ?? null,
    myEliminated: game.eliminatedBy[forPlayerId] ?? [],
    mySelected: game.selectedBy[forPlayerId] ?? [],
    turnPlayerEliminated: game.eliminatedBy[turnPlayerId] ?? [],
    turnPlayerSelected: game.selectedBy[turnPlayerId] ?? [],
    currentTurn: game.currentTurn,
    eliminatedBy: game.eliminatedBy,
    extraQuestions: game.extraQuestions,
    isPlayer1: forPlayerId === game.player1Id,
    turnIsPlayer1: turnPlayerId === game.player1Id,
    winnerId: game.winnerId,
    winnerUsername,
    pendingQuestion: game.pendingQuestion,
    pendingAnswer: game.pendingAnswer,
    lastWrongAnswer: game.lastWrongAnswer,
  };
}

function broadcastGameUpdate(game: GameState) {
  io.to(game.player1Id).emit(
    "game-update",
    buildPlayerView(game, game.player1Id),
  );
  io.to(game.player2Id).emit(
    "game-update",
    buildPlayerView(game, game.player2Id),
  );
}

io.on("connection", (socket: Socket) => {
  console.log(`Cliente conectado: ${socket.id}`);

  socket.on("start-game", ({ roomId }: { roomId: string }) => {
    const roomPlayers = getPlayers(roomId);
    if (roomPlayers.length !== 2) return;
    if (!isHost(roomId, socket.id)) return;
    if (roomModes.get(roomId) !== "normal") return;

    const [player1, player2] = roomPlayers;
    const game = createGame(
      roomId,
      player1.id,
      player2.id,
      player1.username,
      player2.username,
    );

    io.to(player1.id).emit("game-update", buildPlayerView(game, player1.id));
    io.to(player2.id).emit("game-update", buildPlayerView(game, player2.id));
  });

  socket.on(
    "choose-coringa",
    ({ roomId, characterId }: { roomId: string; characterId: string }) => {
      const game = setCoringa(roomId, socket.id, characterId);
      if (!game) return;

      io.to(game.player1Id).emit(
        "game-update",
        buildPlayerView(game, game.player1Id),
      );
      io.to(game.player2Id).emit(
        "game-update",
        buildPlayerView(game, game.player2Id),
      );
    },
  );

  socket.on(
    "select-mode",
    ({ roomId, mode }: { roomId: string; mode: string }) => {
      if (!isHost(roomId, socket.id)) return;
      roomModes.set(roomId, mode);
      io.to(roomId).emit("mode-update", mode);
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
    if (!roomId) return;

    const remaining = getPlayers(roomId).filter((p) => p.id !== socket.id);

    if (remaining.length === 0) {
      rooms.delete(roomId);
      roomModes.delete(roomId);
    } else {
      rooms.set(roomId, remaining);
    }

    io.to(roomId).emit("players-update", remaining);
    console.log(`Cliente desconectado: ${socket.id}`);
  });

  socket.on(
    "toggle-select",
    ({ roomId, characterId }: { roomId: string; characterId: string }) => {
      const game = getGame(roomId);
      if (!game || game.phase !== "playing") return;
      if (socket.id !== game.currentTurn) return;

      const list = game.selectedBy[socket.id];
      const idx = list.indexOf(characterId);
      if (idx >= 0) list.splice(idx, 1);
      else list.push(characterId);

      broadcastGameUpdate(game);
    },
  );

  socket.on(
    "toggle-discard",
    ({ roomId, characterId }: { roomId: string; characterId: string }) => {
      const game = getGame(roomId);
      if (!game || game.phase !== "playing") return;
      if (socket.id !== game.currentTurn) return;

      const list = game.eliminatedBy[socket.id];
      const idx = list.indexOf(characterId);
      if (idx >= 0) list.splice(idx, 1);
      else list.push(characterId);

      broadcastGameUpdate(game);
    },
  );

  socket.on("pass-turn", ({ roomId }: { roomId: string }) => {
    const game = getGame(roomId);
    if (!game || game.phase !== "playing") return;
    if (socket.id !== game.currentTurn) return;

    const opponentId =
      socket.id === game.player1Id ? game.player2Id : game.player1Id;

    if (game.extraQuestions > 0) {
      game.extraQuestions -= 1;
      if (game.extraQuestions === 0) {
        game.currentTurn = opponentId;
        game.pendingQuestion = null;
        game.pendingAnswer = null;
      }
    } else {
      game.currentTurn = opponentId;
      game.extraQuestions = 2;
      game.pendingQuestion = null;
      game.pendingAnswer = null;
    }
    broadcastGameUpdate(game);
  });

  // socket.on("debug-get-secret", ({ roomId }: { roomId: string }) => {
  //   const game = getGame(roomId);
  //   if (!game) return;
  //   socket.emit("debug-secret", { secret: game.secretCharacterOf[socket.id] });
  // });

  socket.on(
    "submit-question",
    ({ roomId, question }: { roomId: string; question: string }) => {
      const game = getGame(roomId);
      if (!game || game.phase !== "playing") return;
      if (socket.id !== game.currentTurn) return;
      if (!question.trim()) return;

      game.pendingQuestion = question.trim();
      game.pendingAnswer = null;
      broadcastGameUpdate(game);
    },
  );

  socket.on(
    "submit-answer",
    ({ roomId, answer }: { roomId: string; answer: string }) => {
      const game = getGame(roomId);
      if (!game || game.phase !== "playing") return;
      if (socket.id === game.currentTurn) return;
      if (!game.pendingQuestion || game.pendingAnswer) return;
      if (!answer.trim()) return;

      game.pendingAnswer = answer.trim();
      broadcastGameUpdate(game);
    },
  );

  socket.on(
    "final-answer",
    ({ roomId, characterId }: { roomId: string; characterId: string }) => {
      const game = getGame(roomId);
      if (!game || game.phase !== "playing") return;
      if (socket.id !== game.currentTurn) return;

      const opponentId =
        socket.id === game.player1Id ? game.player2Id : game.player1Id;
      const mySecret = game.secretCharacterOf[socket.id];
      const opponentTrap = game.coringaOf[opponentId];

      if (characterId === opponentTrap) {
        game.winnerId = opponentId;
        game.phase = "finished";
      } else if (characterId === mySecret) {
        game.winnerId = socket.id;
        game.phase = "finished";
      } else {
        game.currentTurn = opponentId;
        game.extraQuestions = 2;
        game.pendingQuestion = null;
        game.pendingAnswer = null;
        game.lastWrongAnswer = Date.now();
      }
      broadcastGameUpdate(game);
    },
  );
});

const PORT = process.env.PORT ?? 3001;
server.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
