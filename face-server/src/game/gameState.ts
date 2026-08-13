import { Character, generateRandomCharacter } from "./characters";

export type GamePhase = "choosing-coringa" | "playing" | "finished";

export interface GameState {
  roomId: string;
  player1Id: string;
  player2Id: string;
  player1Username?: string;
  player2Username?: string;
  characters: Character[];
  secretCharacterOf: Record<string, string>;
  coringaOf: Record<string, string>;
  eliminatedBy: Record<string, string[]>;
  selectedBy: Record<string, string[]>;
  currentTurn: string;
  extraQuestions: number;
  phase: GamePhase;
  winnerId: string | null;
  pendingQuestion: string | null;
  pendingAnswer: string | null;
  lastWrongAnswer: number | null;
}

const games = new Map<string, GameState>();

function pickRandom<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}
export function deleteGame(roomId: string): void {
  games.delete(roomId);
}

export function createGame(
  roomId: string,
  player1Id: string,
  player2Id: string,
  player1Username: string,
  player2Username: string,
): GameState {
  const characters = generateRandomCharacter(20);

  const secretCharacterOf: Record<string, string> = {
    [player1Id]: pickRandom(characters).id,
    [player2Id]: pickRandom(characters).id,
  };

  console.log("DEBUG secretCharacterOf:", secretCharacterOf);

  const coringaOf: Record<string, string> = {
    [player1Id]: pickRandom(characters).id,
    [player2Id]: pickRandom(characters).id,
  };

  const game: GameState = {
    roomId,
    player1Id,
    player2Id,
    player1Username,
    player2Username,
    characters,
    secretCharacterOf,
    coringaOf: {},
    eliminatedBy: {
      [player1Id]: [],
      [player2Id]: [],
    },
    selectedBy: {
      [player1Id]: [],
      [player2Id]: [],
    },
    currentTurn: player1Id,
    extraQuestions: 0,
    phase: "choosing-coringa",
    winnerId: null,
    pendingQuestion: null,
    pendingAnswer: null,
    lastWrongAnswer: null,
  };

  games.set(roomId, game);
  return game;
}

export function setCoringa(
  roomId: string,
  playerId: string,
  characterId: string,
): GameState | undefined {
  const game = games.get(roomId);
  if (!game) return undefined;
  if (game.phase !== "choosing-coringa") return game;

  game.coringaOf[playerId] = characterId;

  const bothChose =
    !!game.coringaOf[game.player1Id] && !!game.coringaOf[game.player2Id];

  if (Object.keys(game.coringaOf).length === 2) {
    game.phase = "playing";
  }

  return game;
}

export function getGame(roomId: string): GameState | undefined {
  return games.get(roomId);
}
