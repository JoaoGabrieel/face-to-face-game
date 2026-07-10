import { nanoid } from "nanoid";

export interface Character {
  id: string;
  name: string;
  imageUrl: string;
}

const DICEBEAR_STYLES = "avataaars";

const namePool = [
  "Bianca",
  "Rafael",
  "Camila",
  "Thiago",
  "Luana",
  "Bruno",
  "Sofia",
  "Diego",
  "Helena",
  "Gustavo",
  "Isabela",
  "Felipe",
  "Marina",
  "Lucas",
  "Valentina",
  "Pedro",
  "Clara",
  "Enzo",
  "Beatriz",
  "Matheus",
  "Alice",
  "Gabriel",
  "Julia",
  "Rodrigo",
  "Fernanda",
  "Vitor",
  "Larissa",
  "Daniel",
  "Manuela",
  "Caio",
];

function shuffle<T>(array: T[]): T[] {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function generateRandomCharacter(count: number): Character[] {
  const names = shuffle(namePool).slice(0, count);

  return names.map((name) => {
    const seed = nanoid(8);
    return {
      id: seed,
      name,
      imageUrl: `https://api.dicebear.com/6.x/${DICEBEAR_STYLES}/svg?seed=${seed}`,
    };
  });
}
