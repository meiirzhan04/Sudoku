"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Bot, Clock3, Lightbulb, Pause, Pencil, Play, RotateCcw, RotateCw, ShieldAlert, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { useLanguage } from "@/components/providers/language-provider";
import { useToast } from "@/components/ui/toast";
import {
  Board,
  Difficulty,
  boardComplete,
  cloneBoard,
  dailySeed,
  generateSudoku,
  getCandidates,
  makeShareCard,
  relatedCell
} from "@/lib/sudoku";
import { completeDailyChallenge, recordCompletedGame } from "@/lib/streak";
import { formatSeconds } from "@/lib/utils";

type HistoryItem = {
  entries: Board;
  notes: Record<string, number[]>;
  mistakes: number;
};

type BackendGameSession = {
  id: string;
  puzzle: Board;
  solution: Board;
  currentBoard: Board;
  mistakes: number;
  hintsUsed: number;
  elapsedSeconds: number;
};

const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const difficultyLabels: Record<Difficulty, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
  expert: "Expert",
  insane: "Insane"
};

function backendUrl() {
  return "";
}

export function SudokuGame({ daily = false, dailyChallengeId }: { daily?: boolean; dailyChallengeId?: string }) {
  const { t, locale } = useLanguage();
  const { toast } = useToast();
  const [difficulty, setDifficulty] = useState<Difficulty>(daily ? "medium" : "easy");
  const [seed, setSeed] = useState(daily ? dailySeed() : `game-${Date.now()}`);
  const generatedPuzzle = useMemo(() => generateSudoku(difficulty, daily ? dailySeed() : seed), [difficulty, seed, daily]);
  const [serverGame, setServerGame] = useState<BackendGameSession | null>(null);
  const activePuzzle = useMemo(
    () => (!daily && serverGame ? { puzzle: serverGame.puzzle, solution: serverGame.solution } : generatedPuzzle),
    [daily, generatedPuzzle, serverGame]
  );
  const [entries, setEntries] = useState<Board>(() => cloneBoard(activePuzzle.puzzle));
  const [notes, setNotes] = useState<Record<string, number[]>>({});
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [noteMode, setNoteMode] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hardcore, setHardcore] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [coach, setCoach] = useState(t("game.selectCell"));
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [future, setFuture] = useState<HistoryItem[]>([]);
  const [guest, setGuest] = useState(true);
  const [savedDailyChallengeId, setSavedDailyChallengeId] = useState<string>();
  const [completedServerGameId, setCompletedServerGameId] = useState<string>();
  const [winToastKey, setWinToastKey] = useState<string>();

  const given = useMemo(() => activePuzzle.puzzle.map((row) => row.map((value) => value !== 0)), [activePuzzle.puzzle]);
  const solved = boardComplete(entries, activePuzzle.solution);

  useEffect(() => {
    const token = window.localStorage.getItem("sudokumind-access-token");
    setGuest(!token);

    if (!token || daily) {
      setServerGame(null);
      return;
    }

    const controller = new AbortController();
    fetch(`${backendUrl()}/api/games`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ difficulty: difficulty.toUpperCase() }),
      signal: controller.signal
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((game: BackendGameSession | null) => {
        if (game) setServerGame(game);
      })
      .catch(() => undefined);

    return () => controller.abort();
  }, [daily, difficulty, seed]);

  useEffect(() => {
    setEntries(cloneBoard(!daily && serverGame ? serverGame.currentBoard : activePuzzle.puzzle));
    setNotes({});
    setSelected(null);
    setMistakes(!daily && serverGame ? serverGame.mistakes : 0);
    setElapsed(!daily && serverGame ? serverGame.elapsedSeconds : 0);
    setPaused(false);
    setHintsUsed(!daily && serverGame ? serverGame.hintsUsed : 0);
    setCoach(t("game.selectCell"));
    setHistory([]);
    setFuture([]);
    setSavedDailyChallengeId(undefined);
    setCompletedServerGameId(undefined);
    setWinToastKey(undefined);
  }, [activePuzzle.puzzle, daily, serverGame, t]);

  useEffect(() => {
    if (paused || solved) return;
    const timer = window.setInterval(() => setElapsed((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [paused, solved]);

  const autosave = useCallback(() => {
    const payload = {
      puzzle: activePuzzle.puzzle,
      solution: activePuzzle.solution,
      entries,
      notes,
      difficulty,
      elapsed_seconds: elapsed,
      mistakes,
      accuracy: accuracy(entries, mistakes),
      completed: solved
    };
    window.localStorage.setItem("sudokumind-current-game", JSON.stringify(payload));
    if (guest) return;

    const token = window.localStorage.getItem("sudokumind-access-token");
    if (!token) return;

    if (!daily && serverGame) {
      fetch(`${backendUrl()}/api/games/${serverGame.id}/save`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          currentBoard: entries,
          mistakes,
          elapsedSeconds: elapsed,
          hintsUsed
        })
      }).catch(() => undefined);

      if (solved && completedServerGameId !== serverGame.id) {
        setCompletedServerGameId(serverGame.id);
        fetch(`${backendUrl()}/api/games/${serverGame.id}/complete`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => undefined);
      }
    }

    if (daily && solved && dailyChallengeId && savedDailyChallengeId !== dailyChallengeId) {
      setSavedDailyChallengeId(dailyChallengeId);
      fetch(`${backendUrl()}/api/daily/${dailyChallengeId}/submit`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          timeSeconds: elapsed,
          mistakes,
          accuracy: accuracy(entries, mistakes)
        })
      }).catch(() => undefined);
    }
  }, [
    activePuzzle.puzzle,
    activePuzzle.solution,
    completedServerGameId,
    daily,
    dailyChallengeId,
    difficulty,
    elapsed,
    entries,
    guest,
    hintsUsed,
    mistakes,
    notes,
    savedDailyChallengeId,
    serverGame,
    solved
  ]);

  useEffect(() => {
    const saver = window.setInterval(autosave, 10000);
    return () => window.clearInterval(saver);
  }, [autosave]);

  useEffect(() => {
    if (!solved) return;
    const key = daily ? `daily-${dailySeed()}` : serverGame?.id ?? seed;
    if (winToastKey === key) return;
    setWinToastKey(key);
    if (daily) {
      completeDailyChallenge({
        timeSeconds: elapsed,
        mistakes,
        accuracy: accuracy(entries, mistakes)
      });
    } else {
      recordCompletedGame({
        elapsedSeconds: elapsed,
        mistakes,
        accuracy: accuracy(entries, mistakes),
        difficulty
      });
    }
    autosave();
    toast({ title: t("game.win"), variant: "success" });
  }, [autosave, daily, difficulty, elapsed, entries, mistakes, seed, serverGame?.id, solved, t, toast, winToastKey]);

  const snapshot = useCallback(() => {
    setHistory((items) => [...items, { entries: cloneBoard(entries), notes: { ...notes }, mistakes }].slice(-60));
    setFuture([]);
  }, [entries, mistakes, notes]);

  const setCell = useCallback((row: number, col: number, digit: number) => {
    if (given[row][col] || paused || solved) return;
    snapshot();

    if (noteMode) {
      const key = `${row}-${col}`;
      setNotes((current) => {
        const existing = current[key] ?? [];
        const next = existing.includes(digit)
          ? existing.filter((item) => item !== digit)
          : [...existing, digit].sort();
        return { ...current, [key]: next };
      });
      return;
    }

    setEntries((current) => {
      const next = cloneBoard(current);
      next[row][col] = digit;
      return next;
    });
    setNotes((current) => {
      const copy = { ...current };
      delete copy[`${row}-${col}`];
      return copy;
    });

    if (activePuzzle.solution[row][col] !== digit) {
      setMistakes((value) => value + 1);
      toast({ title: t("game.wrong"), variant: "error" });
    }
  }, [activePuzzle.solution, given, noteMode, paused, snapshot, solved, t, toast]);

  const clearCell = useCallback(() => {
    if (!selected) return;
    const [row, col] = selected;
    if (given[row][col]) return;
    snapshot();
    setEntries((current) => {
      const next = cloneBoard(current);
      next[row][col] = 0;
      return next;
    });
  }, [given, selected, snapshot]);

  const undo = useCallback(() => {
    setHistory((items) => {
      const previous = items.at(-1);
      if (!previous) return items;
      setFuture((futureItems) => [{ entries: cloneBoard(entries), notes: { ...notes }, mistakes }, ...futureItems]);
      setEntries(cloneBoard(previous.entries));
      setNotes(previous.notes);
      setMistakes(previous.mistakes);
      return items.slice(0, -1);
    });
  }, [entries, mistakes, notes]);

  const redo = useCallback(() => {
    setFuture((items) => {
      const next = items[0];
      if (!next) return items;
      setHistory((historyItems) => [...historyItems, { entries: cloneBoard(entries), notes: { ...notes }, mistakes }]);
      setEntries(cloneBoard(next.entries));
      setNotes(next.notes);
      setMistakes(next.mistakes);
      return items.slice(1);
    });
  }, [entries, mistakes, notes]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (!selected) return;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z" && event.shiftKey) {
        event.preventDefault();
        redo();
        return;
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        undo();
        return;
      }

      const [row, col] = selected;
      if (event.key === "ArrowUp") setSelected([Math.max(0, row - 1), col]);
      if (event.key === "ArrowDown") setSelected([Math.min(8, row + 1), col]);
      if (event.key === "ArrowLeft") setSelected([row, Math.max(0, col - 1)]);
      if (event.key === "ArrowRight") setSelected([row, Math.min(8, col + 1)]);
      if (/^[1-9]$/.test(event.key)) setCell(row, col, Number(event.key));
      if (event.key === "Backspace" || event.key === "Delete" || event.key === "0") clearCell();
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [clearCell, redo, selected, setCell, undo]);

  async function explain() {
    if (!selected) {
      setCoach(t("game.selectCell"));
      return;
    }
    if (hintsUsed >= 5) {
      toast({ title: t("game.limit"), variant: "error" });
      return;
    }
    const [row, col] = selected;
    const digit = activePuzzle.solution[row][col];
    setHintsUsed((value) => value + 1);
    const response = await fetch("/api/ai/hint", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        locale,
        row,
        col,
        digit,
        puzzle: activePuzzle.puzzle,
        entries,
        candidates: getCandidates(entries, row, col)
      })
    }).then((res) => res.json());
    setCoach(response.message ?? t("ai.fallback", { digit }));
  }

  function newGame() {
    setSeed(`game-${Date.now()}`);
  }

  function share() {
    const text = makeShareCard({
      date: dailySeed(),
      difficulty,
      elapsed,
      mistakes,
      solved
    });
    navigator.clipboard?.writeText(text);
    toast({ title: t("daily.anonymous"), variant: "success" });
  }

  const selectedValue = selected ? entries[selected[0]][selected[1]] : 0;

  return (
    <div className={daily ? "grid gap-6" : "grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]"}>
      <section className="space-y-4">
        {guest && !daily ? (
          <div className="rounded-lg border bg-card/80 p-3 text-sm text-muted-foreground shadow-sm backdrop-blur">{t("game.banner")}</div>
        ) : null}

        <div className="surface mx-auto w-full max-w-[min(94vw,700px)] overflow-hidden rounded-2xl">
          <div className="flex flex-col gap-4 border-b bg-muted/25 p-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="h-4 w-4 text-primary" />
                {daily ? t("daily.title") : t("nav.play")}
              </div>
              <div className="mt-1 text-2xl font-semibold tracking-tight">
                {!daily ? difficultyLabels[difficulty] : t("game.medium")}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:min-w-[320px]">
              <GameMetric icon={Clock3} label={t("common.time")} value={formatSeconds(elapsed)} />
              <GameMetric icon={ShieldAlert} label={t("common.mistakes")} value={`${mistakes}${hardcore ? "/3" : ""}`} danger={hardcore && mistakes >= 3} />
              <GameMetric icon={Lightbulb} label={t("game.hintsLeft")} value={String(Math.max(0, 5 - hintsUsed))} />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 border-b p-3">
            {!daily ? (
              <Select value={difficulty} onValueChange={(value) => setDifficulty(value as Difficulty)}>
                <SelectTrigger className="w-[140px] bg-background/70">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">{t("game.easy")}</SelectItem>
                  <SelectItem value="medium">{t("game.medium")}</SelectItem>
                  <SelectItem value="hard">{t("game.hard")}</SelectItem>
                  <SelectItem value="expert">{t("game.expert")}</SelectItem>
                  <SelectItem value="insane">Insane</SelectItem>
                </SelectContent>
              </Select>
            ) : null}
            <Button variant="outline" onClick={daily ? share : newGame}>
              {daily ? t("daily.share") : t("game.newGame")}
            </Button>
            <Button variant={noteMode ? "default" : "outline"} onClick={() => setNoteMode((value) => !value)}>
              <Pencil className="h-4 w-4" />
              {t("game.notes")}
            </Button>
            <Button variant="outline" size="icon" onClick={undo} aria-label={t("game.undo")}>
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={redo} aria-label={t("game.redo")}>
              <RotateCw className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={() => setPaused((value) => !value)}>
              {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              {paused ? t("game.resume") : t("game.pause")}
            </Button>
            <label className="ms-auto flex items-center gap-2 rounded-md border bg-background/70 px-3 py-2 text-sm">
              <input type="checkbox" checked={hardcore} onChange={(event) => setHardcore(event.target.checked)} />
              {t("game.hardcore")}
            </label>
          </div>

        <div className="relative mx-auto grid w-full max-w-[min(92vw,620px)] touch-manipulation grid-cols-9 overflow-hidden p-2 sm:p-3">
          {solved ? <Confetti /> : null}
          {entries.map((row, rowIndex) =>
            row.map((value, colIndex) => {
              const isSelected = selected?.[0] === rowIndex && selected?.[1] === colIndex;
              const isRelated = selected ? relatedCell(selected, [rowIndex, colIndex]) : false;
              const sameValue = selectedValue && value === selectedValue;
              const isWrong = value !== 0 && value !== activePuzzle.solution[rowIndex][colIndex];
              return (
                <motion.button
                  key={`${rowIndex}-${colIndex}`}
                  whileTap={{ scale: 0.96 }}
                  animate={isSelected ? { scale: 1.03 } : { scale: 1 }}
                  onClick={() => setSelected([rowIndex, colIndex])}
                  className={[
                    "relative aspect-square border bg-background/85 text-base font-semibold shadow-[inset_0_1px_0_hsl(var(--foreground)/0.03)] transition-colors min-[380px]:text-xl sm:text-2xl",
                    given[rowIndex][colIndex] ? "text-foreground" : "text-primary",
                    isRelated ? "bg-accent/70" : "",
                    sameValue ? "bg-primary/10 text-primary" : "",
                    isSelected ? "z-10 bg-primary text-primary-foreground shadow-lg shadow-primary/20 ring-2 ring-primary ring-offset-2 ring-offset-card" : "",
                    isWrong ? "animate-shake text-destructive" : ""
                  ].join(" ")}
                  style={{
                    borderRightWidth: colIndex === 2 || colIndex === 5 ? 2 : 1,
                    borderBottomWidth: rowIndex === 2 || rowIndex === 5 ? 2 : 1
                  }}
                >
                  {paused ? "" : value || <Notes values={notes[`${rowIndex}-${colIndex}`] ?? []} />}
                </motion.button>
              );
            })
          )}
        </div>
        </div>

        <div className="mx-auto grid w-full max-w-[min(92vw,620px)] grid-cols-9 gap-2">
          {digits.map((digit) => (
            <Button
              key={digit}
              variant="secondary"
              className="aspect-square h-auto px-0 text-lg"
              onClick={() => selected && setCell(selected[0], selected[1], digit)}
            >
              {digit}
            </Button>
          ))}
        </div>
      </section>

      <aside className="space-y-4">
        <Card className="overflow-hidden shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              {t("game.aiCoach")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border bg-muted/45 p-3 text-sm leading-6">{coach}</div>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{t("game.hintsLeft")}</span>
              <span>{Math.max(0, 5 - hintsUsed)}</span>
            </div>
            <Button className="w-full" onClick={explain}>
              <Lightbulb className="h-4 w-4" />
              {t("game.explain")}
            </Button>
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}

function GameMetric({
  icon: Icon,
  label,
  value,
  danger
}: {
  icon: typeof Clock3;
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <div className={["rounded-lg border bg-background/70 p-3", danger ? "border-destructive/45 text-destructive" : ""].join(" ")}>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="mt-1 font-mono text-lg font-semibold">{value}</div>
    </div>
  );
}

function Confetti() {
  const colors = ["bg-primary", "bg-emerald-400", "bg-sky-400", "bg-amber-400", "bg-rose-400"];
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-center gap-4">
      {Array.from({ length: 22 }).map((_, index) => (
        <span
          key={index}
          className={[
            "confetti-piece block h-2 w-1 rounded-sm",
            colors[index % colors.length]
          ].join(" ")}
          style={{
            animationDelay: `${index * 34}ms`,
            transform: `translateX(${(index - 11) * 7}px)`
          }}
        />
      ))}
    </div>
  );
}

function Notes({ values }: { values: number[] }) {
  return (
    <span className="grid h-full w-full grid-cols-3 grid-rows-3 p-1 text-[10px] font-medium text-muted-foreground sm:text-xs">
      {digits.map((digit) => (
        <span key={digit} className="flex items-center justify-center">
          {values.includes(digit) ? digit : ""}
        </span>
      ))}
    </span>
  );
}

function accuracy(entries: Board, mistakes: number) {
  const filled = entries.flat().filter(Boolean).length;
  if (!filled) return 100;
  return Math.max(0, Math.round(((filled - mistakes) / filled) * 100));
}
