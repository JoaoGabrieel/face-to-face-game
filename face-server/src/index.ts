import express from "express";
import http from "http";
import cors from "cors";
import { Server, Socket } from "socket.io";
import { createGame, setCoringa, getGame, GameState } from "./game/gameState";

const app = express();
app.use(cors());

const server = http.createServer(app);

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

  return {
    roomId: game.roomId,
    phase: game.phase,
    characters: game.characters,
    opponentSecretCharacterId: game.secretCharacterOf[opponentId],
    myCoringaId: game.coringaOf[forPlayerId] ?? null,
    currentTurn: game.currentTurn,
    eliminatedBy: game.eliminatedBy,
    extraQuestions: game.extraQuestions,
    isPlayer1: forPlayerId === game.player1Id,
  };
}

io.on("connection", (socket: Socket) => {
  console.log(`Cliente conectado: ${socket.id}`);

  socket.on("start-game", ({ roomId }: { roomId: string }) => {
    const roomPlayers = getPlayers(roomId);
    if (roomPlayers.length !== 2) return;

    const [player1, player2] = roomPlayers;
    const game = createGame(roomId, player1.id, player2.id);

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
    } else {
      rooms.set(roomId, remaining);
    }

    io.to(roomId).emit("players-update", remaining);
    console.log(`Cliente desconectado: ${socket.id}`);
  });
});

const PORT = process.env.PORT ?? 3001;
server.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
