export type Profile = {
  id: string;
  full_name: string | null;
  username: string | null;
  city: string | null;
  avatar_url: string | null;
  language: "en" | "ru" | "kk";
  theme: "light" | "dark" | "system";
  is_pro: boolean;
  created_at: string;
  updated_at: string;
};

export type GameRow = {
  id: string;
  user_id: string;
  puzzle: number[][];
  solution: number[][];
  entries: number[][];
  notes: Record<string, number[]>;
  difficulty: "easy" | "medium" | "hard" | "expert";
  elapsed_seconds: number;
  mistakes: number;
  accuracy: number;
  completed_at: string | null;
  created_at: string;
};
