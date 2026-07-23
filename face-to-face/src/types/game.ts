export interface Character {
  id: string;
  name: string;
  imageUrl: string;
}

export type GamePhase = "choosing-coringa" | "playing" | "finished";

export interface GameView {
  roomId: string;
  phase: GamePhase;
  characters: Character[];
  opponentSecretCharacterId: string;
  myCoringaId: string | null;
  myEliminated: string[];
  mySelected: string[];
  turnPlayerEliminated: string[];
  turnPlayerSelected: string[];
  currentTurn: string;
  eliminatedBy: Record<string, string[]>;
  extraQuestions: number;
  isPlayer1: boolean;
  turnIsPlayer1: boolean;
  winnerId: string | null;
  pendingQuestion: string | null;
  pendingAnswer: string | null;
}
