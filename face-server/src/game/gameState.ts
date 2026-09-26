import { Character, generateRandomCharacter } from "./characters";
import { nanoid } from "nanoid";

export type GamePhase = "choosing-coringa" | "playing" | "finished";
export type AssignmentMode = "coringa" | "secreto" | "ambos";

export interface QuestionLogEntry {
  id: string;
  playerId: string;
  username: string;
  question: string;
  answer: string | null;
}

export interface GameState {
  roomId: string;
  gameId: string;
  players: string[];
  usernames: Record<string, string>;
  activePlayers: string[];
  characters: Character[];
  secretCharacterOf: Record<string, string>;
  coringaOf: Record<string, string>;
  targetOf: Record<string, string>;
  responderOf: Record<string, string>;
  eliminatedBy: Record<string, string[]>;
  selectedBy: Record<string, string[]>;
  currentTurn: string;
  extraQuestions: number;
  phase: GamePhase;
  playerResults: Record<string, "won" | "lost">;
  pendingQuestion: string | null;
  pendingAnswer: string | null;
  lastWrongAnswer: number | null;
  questionLog: QuestionLogEntry[];
  timeLimitSeconds: number | null;
  turnTimeRemaining: number | null;
  turnTimerPaused: boolean;
  assignmentMode: AssignmentMode;
}

const games = new Map<string, GameState>();

function pickRandom<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function characterCountFor(playerCount: number): number {
  return Math.min(20 + (playerCount - 2) * 5, 40);
}

function isPhaseComplete(game: GameState): boolean {
  const coringaDone = game.players.every(
    (id) => game.coringaOf[id] !== undefined,
  );
  const secretDone = game.players.every(
    (id) => game.secretCharacterOf[id] !== undefined,
  );

  if (game.assignmentMode === "coringa") return coringaDone;
  if (game.assignmentMode === "secreto") return secretDone;
  return coringaDone && secretDone;
}

export function setCoringa(
  gameId: string,
  playerId: string,
  characterId: string,
): GameState | undefined {
  const game = games.get(gameId);
  if (!game) return undefined;
  if (game.phase !== "choosing-coringa") return game;
  if (game.assignmentMode === "secreto") return game;

  game.coringaOf[playerId] = characterId;
  if (isPhaseComplete(game)) game.phase = "playing";
  return game;
}

export function setSecret(
  gameId: string,
  playerId: string,
  characterId: string,
): GameState | undefined {
  const game = games.get(gameId);
  if (!game) return undefined;
  if (game.phase !== "choosing-coringa") return game;
  if (game.assignmentMode === "coringa") return game; // não usa segredo manual nesse modo

  const target = game.targetOf[playerId];
  game.secretCharacterOf[target] = characterId;
  if (isPhaseComplete(game)) game.phase = "playing";
  return game;
}

export function splitIntoChains<T extends { id: string; username: string }>(
  players: T[],
): T[][] {
  return [players];
}

export function createGame(
  roomId: string,
  chainPlayers: { id: string; username: string }[],
  customCharacter?: { name: string; imageUrl: string } | null,
  timeLimitSeconds?: number | null,
  assignmentMode: AssignmentMode = "coringa",
): GameState {
  const n = chainPlayers.length;
  const gameId = nanoid(10);
  const characters = generateRandomCharacter(characterCountFor(n));

  if (customCharacter) {
    const idx = Math.floor(Math.random() * characters.length);
    characters[idx] = {
      id: nanoid(8),
      name: customCharacter.name,
      imageUrl: customCharacter.imageUrl,
    };
  }

  const playerIds = chainPlayers.map((p) => p.id);
  const secretCharacterOf: Record<string, string> = {};
  const coringaOf: Record<string, string> = {};
  const targetOf: Record<string, string> = {};
  const responderOf: Record<string, string> = {};
  const usernames: Record<string, string> = {};
  const eliminatedBy: Record<string, string[]> = {};
  const selectedBy: Record<string, string[]> = {};

  chainPlayers.forEach((p, i) => {
    usernames[p.id] = p.username;
    eliminatedBy[p.id] = [];
    selectedBy[p.id] = [];
    targetOf[p.id] = playerIds[(i + 1) % n];
    responderOf[p.id] = playerIds[(i - 1 + n) % n];
  });

  if (assignmentMode == "coringa") {
    playerIds.forEach((id) => {
      secretCharacterOf[id] = pickRandom(characters).id;
    });
  } else if (assignmentMode === "secreto") {
    playerIds.forEach((id) => {
      coringaOf[id] = pickRandom(characters).id;
    });
  }

  const game: GameState = {
    roomId,
    gameId,
    players: playerIds,
    usernames,
    activePlayers: [...playerIds],
    characters,
    secretCharacterOf,
    coringaOf,
    targetOf,
    responderOf,
    eliminatedBy,
    selectedBy,
    currentTurn: playerIds[0],
    extraQuestions: 0,
    phase: "choosing-coringa",
    playerResults: {},
    pendingQuestion: null,
    pendingAnswer: null,
    lastWrongAnswer: null,
    questionLog: [],
    timeLimitSeconds: timeLimitSeconds ?? null,
    turnTimeRemaining: timeLimitSeconds ?? null,
    turnTimerPaused: false,
    assignmentMode,
  };

  games.set(gameId, game);
  return game;
}

function advanceTurnFrom(game: GameState, fromPlayerId: string): string {
  const idx = game.players.indexOf(fromPlayerId);
  const rotated = [
    ...game.players.slice(idx + 1),
    ...game.players.slice(0, idx + 1),
  ];
  return (
    rotated.find(
      (id) => game.activePlayers.includes(id) && id !== fromPlayerId,
    ) ?? fromPlayerId
  );
}

export function getNextActivePlayer(game: GameState): string {
  return advanceTurnFrom(game, game.currentTurn);
}

export function eliminatePlayer(
  gameId: string,
  playerId: string,
  result: "won" | "lost",
): GameState | undefined {
  const game = games.get(gameId);
  if (!game) return undefined;

  game.playerResults[playerId] = result;
  game.activePlayers = game.activePlayers.filter((id) => id !== playerId);

  if (game.activePlayers.length === 1) {
    const lastPlayer = game.activePlayers[0];
    game.playerResults[lastPlayer] = "lost";
    game.activePlayers = [];
    game.phase = "finished";
    return game;
  }

  if (game.activePlayers.length === 0) {
    game.phase = "finished";
    return game;
  }

  const predecessor = game.responderOf[playerId];
  const successor = game.targetOf[playerId];
  game.targetOf[predecessor] = successor;
  game.responderOf[successor] = predecessor;

  if (game.currentTurn === playerId) {
    game.currentTurn = advanceTurnFrom(game, playerId);
    game.extraQuestions = 0;
    game.pendingQuestion = null;
    game.pendingAnswer = null;
  }

  return game;
}

export function getGame(gameId: string): GameState | undefined {
  return games.get(gameId);
}

export function deleteGame(gameId: string): void {
  games.delete(gameId);
}
