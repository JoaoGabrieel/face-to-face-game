export interface Character {
  id: string;
  name: string;
  imageUrl: string;
}

export type GamePhase = "choosing-coringa" | "playing" | "finished";
export type AssignmentMode = "coringa" | "secreto" | "ambos";

export interface PlayerInfo {
  id: string;
  username: string;
  active: boolean;
}

export interface QuestionLogEntry {
  id: string;
  playerId: string;
  username: string;
  question: string;
  answer: string | null;
}

export interface RevealedBoard {
  playerId: string;
  username: string;
  secretCharacterId: string;
  eliminated: string[];
  selected: string[];
  result: "won" | "lost" | null;
}

export interface GameView {
  roomId: string;
  gameId: string;
  phase: GamePhase;
  characters: Character[];
  players: PlayerInfo[];
  opponentSecretCharacterId: string | null;
  myCoringaId: string | null;
  myPoisonCharacterId: string | null;
  myEliminated: string[];
  mySelected: string[];
  turnPlayerEliminated: string[];
  turnPlayerSelected: string[];
  currentTurn: string;
  turnPlayerUsername: string;
  isMyTurn: boolean;
  isResponder: boolean;
  isActive: boolean;
  extraQuestions: number;
  myResult: "won" | "lost" | null;
  winners: string[];
  losers: string[];
  isLastPlayerStanding: boolean;
  pendingQuestion: string | null;
  pendingAnswer: string | null;
  lastWrongAnswerAt: number | null;
  questionLog: QuestionLogEntry[];
  revealBoard: RevealedBoard[] | null;
  timeLimitSeconds: number | null;
  turnTimeRemaining: number | null;
  turnTimerPaused: boolean;
  assignmentMode: AssignmentMode;
  myCoringaChosen: boolean;
  mySecretChosen: boolean;
}
