export type Difficulty = "easy" | "medium" | "hard" | "expert" | "insane";
export type Board = number[][];

export type Puzzle = {
  puzzle: Board;
  solution: Board;
  difficulty: Difficulty;
  seed: string;
};

const removals: Record<Difficulty, number> = {
  easy: 38,
  medium: 46,
  hard: 52,
  expert: 58,
  insane: 62
};

export function emptyBoard(): Board {
  return Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => 0));
}

export function cloneBoard(board: Board): Board {
  return board.map((row) => [...row]);
}

function hashSeed(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rng(seed: string) {
  let value = hashSeed(seed);
  return () => {
    value += 0x6d2b79f5;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(items: T[], random: () => number) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function isValidMove(board: Board, row: number, col: number, digit: number) {
  if (digit < 1 || digit > 9) return false;

  for (let index = 0; index < 9; index += 1) {
    if (index !== col && board[row][index] === digit) return false;
    if (index !== row && board[index][col] === digit) return false;
  }

  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  for (let r = boxRow; r < boxRow + 3; r += 1) {
    for (let c = boxCol; c < boxCol + 3; c += 1) {
      if ((r !== row || c !== col) && board[r][c] === digit) return false;
    }
  }

  return true;
}

function solve(board: Board, random: () => number): boolean {
  let bestRow = -1;
  let bestCol = -1;
  let bestCandidates: number[] = [];

  for (let row = 0; row < 9; row += 1) {
    for (let col = 0; col < 9; col += 1) {
      if (board[row][col] !== 0) continue;
      const candidates = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9], random).filter((digit) =>
        isValidMove(board, row, col, digit)
      );
      if (candidates.length === 0) return false;
      if (bestRow === -1 || candidates.length < bestCandidates.length) {
        bestRow = row;
        bestCol = col;
        bestCandidates = candidates;
      }
    }
  }

  if (bestRow === -1) return true;

  for (const digit of bestCandidates) {
    board[bestRow][bestCol] = digit;
    if (solve(board, random)) return true;
    board[bestRow][bestCol] = 0;
  }

  return false;
}

function fillSolvedBoard(seed: string) {
  const board = emptyBoard();
  solve(board, rng(seed));
  return board;
}

export function generateSudoku(difficulty: Difficulty = "medium", seed = `${difficulty}-${Date.now()}`): Puzzle {
  const random = rng(seed);
  const solution = fillSolvedBoard(seed);
  const puzzle = cloneBoard(solution);
  const cells = shuffle(
    Array.from({ length: 81 }, (_, index) => [Math.floor(index / 9), index % 9] as const),
    random
  );

  for (const [row, col] of cells.slice(0, removals[difficulty])) {
    puzzle[row][col] = 0;
  }

  return { puzzle, solution, difficulty, seed };
}

export function dailySeed(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function getCandidates(board: Board, row: number, col: number) {
  if (board[row][col] !== 0) return [];
  return [1, 2, 3, 4, 5, 6, 7, 8, 9].filter((digit) => isValidMove(board, row, col, digit));
}

export function boardComplete(entries: Board, solution: Board) {
  return entries.every((row, rowIndex) =>
    row.every((value, colIndex) => value !== 0 && value === solution[rowIndex][colIndex])
  );
}

export function relatedCell(a: [number, number], b: [number, number]) {
  const [ar, ac] = a;
  const [br, bc] = b;
  return ar === br || ac === bc || (Math.floor(ar / 3) === Math.floor(br / 3) && Math.floor(ac / 3) === Math.floor(bc / 3));
}

export function makeShareCard(args: {
  date: string;
  difficulty: Difficulty;
  elapsed: number;
  mistakes: number;
  solved: boolean;
}) {
  const minutes = Math.floor(args.elapsed / 60);
  const seconds = `${args.elapsed % 60}`.padStart(2, "0");
  const result = args.solved ? "Solved" : "Played";
  return `SudokuMind ${args.date}\n${result} ${args.difficulty} in ${minutes}:${seconds}\nMistakes: ${args.mistakes}/3\n□ □ ■\n□ ■ □\n■ □ □`;
}
