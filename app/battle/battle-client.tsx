"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  BadgeCheck,
  Clipboard,
  Crown,
  Flame,
  Medal,
  Play,
  Plus,
  RefreshCcw,
  Send,
  Share2,
  ShieldCheck,
  Swords,
  Trophy,
  Users,
  Wifi,
  WifiOff
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import {
  Board,
  Difficulty,
  boardComplete,
  cloneBoard,
  generateSudoku,
  isValidMove,
  relatedCell
} from "@/lib/sudoku";
import { formatSeconds, initials } from "@/lib/utils";

type BattleMode = "1v1 Race" | "Group Race" | "No Mistakes Challenge" | "Fastest Time Wins";
type BattleStage = "setup" | "lobby" | "countdown" | "playing" | "results";
type PlayerStatus = "online" | "ready" | "playing" | "paused" | "finished" | "disconnected";

type BattlePlayer = {
  id: string;
  username: string;
  avatarUrl?: string;
  city: string;
  isHost: boolean;
  isReady: boolean;
  progress: number;
  mistakes: number;
  hintsUsed: number;
  finishTime?: number;
  accuracy: number;
  status: PlayerStatus;
  xp: number;
};

type BattleMove = {
  id: string;
  playerId: string;
  cellIndex: number;
  value: number;
  isCorrect: boolean;
  createdAt: string;
};

type BattleRoom = {
  id: string;
  roomCode: string;
  hostId: string;
  difficulty: Difficulty;
  mode: BattleMode;
  status: "waiting" | "playing" | "finished";
  puzzle: Board;
  solution: Board;
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
  players: BattlePlayer[];
  moves: BattleMove[];
};

type Friend = {
  username: string;
  city: string;
  online: boolean;
  rank: string;
  wins: number;
};

const difficulties: Difficulty[] = ["easy", "medium", "hard", "expert", "insane"];
const modes: BattleMode[] = ["1v1 Race", "Group Race", "No Mistakes Challenge", "Fastest Time Wins"];
const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const storageKey = "sudokumind-battle-room";
const historyKey = "sudokumind-battle-history";

const mockFriends: Friend[] = [
  { username: "Aruzhan", city: "Almaty", online: true, rank: "Gold II", wins: 18 },
  { username: "Dias", city: "Astana", online: true, rank: "Silver I", wins: 9 },
  { username: "Miras", city: "Aktobe", online: false, rank: "Bronze III", wins: 4 }
];

function roomCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function makePlayer(isHost = false): BattlePlayer {
  return {
    id: "you",
    username: window.localStorage.getItem("sudokumind-username") ?? "You",
    city: window.localStorage.getItem("sudokumind-city") ?? "Almaty",
    isHost,
    isReady: false,
    progress: 0,
    mistakes: 0,
    hintsUsed: 0,
    accuracy: 100,
    status: "online",
    xp: 0
  };
}

function makeOpponent(index = 1): BattlePlayer {
  const names = ["Nfactorial", "BrainDash", "GridMaster"];
  const cities = ["Almaty", "Astana", "Aktobe"];
  return {
    id: `opponent-${index}`,
    username: names[index - 1] ?? `Player ${index + 1}`,
    city: cities[index - 1] ?? "Global",
    isHost: false,
    isReady: true,
    progress: index === 1 ? 8 : 3,
    mistakes: 0,
    hintsUsed: 0,
    accuracy: 100,
    status: "ready",
    xp: 0
  };
}

function progressFor(board: Board) {
  const filled = board.flat().filter(Boolean).length;
  return Math.round((filled / 81) * 100);
}

function accuracyFor(board: Board, mistakes: number) {
  const filled = board.flat().filter(Boolean).length;
  if (!filled) return 100;
  return Math.max(0, Math.round(((filled - mistakes) / filled) * 100));
}

function rankPlayers(players: BattlePlayer[]) {
  return [...players].sort((a, b) => {
    if (a.finishTime && b.finishTime && Math.abs(a.finishTime - b.finishTime) <= 2) {
      if (a.mistakes !== b.mistakes) return a.mistakes - b.mistakes;
      return a.hintsUsed - b.hintsUsed;
    }
    if (a.finishTime && !b.finishTime) return -1;
    if (!a.finishTime && b.finishTime) return 1;
    return (a.finishTime ?? Number.MAX_SAFE_INTEGER) - (b.finishTime ?? Number.MAX_SAFE_INTEGER);
  });
}

export function BattleClient() {
  const { toast } = useToast();
  const [stage, setStage] = useState<BattleStage>("setup");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [mode, setMode] = useState<BattleMode>("1v1 Race");
  const [joinCode, setJoinCode] = useState("");
  const [room, setRoom] = useState<BattleRoom | null>(null);
  const [entries, setEntries] = useState<Board>(() => generateSudoku("medium", "battle").puzzle);
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [countdown, setCountdown] = useState(3);
  const [friendName, setFriendName] = useState("");
  const [friends, setFriends] = useState<Friend[]>(mockFriends);
  const [battleHistory, setBattleHistory] = useState<BattlePlayer[][]>([]);

  const given = useMemo(() => (room ? room.puzzle.map((row) => row.map((value) => value !== 0)) : []), [room]);
  const solved = room ? boardComplete(entries, room.solution) : false;
  const me = room?.players.find((player) => player.id === "you");
  const ranked = room ? rankPlayers(room.players) : [];
  const winner = ranked[0];
  const inviteLink = room ? `${window.location.origin}/battle?room=${room.roomCode}` : "";

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey);
    const savedHistory = window.localStorage.getItem(historyKey);
    if (savedHistory) {
      try {
        setBattleHistory(JSON.parse(savedHistory) as BattlePlayer[][]);
      } catch {
        setBattleHistory([]);
      }
    }
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved) as BattleRoom & { entries?: Board; elapsed?: number; stage?: BattleStage };
      setRoom(parsed);
      setEntries(cloneBoard(parsed.entries ?? parsed.puzzle));
      setElapsed(parsed.elapsed ?? 0);
      setStage(parsed.stage === "playing" ? "playing" : "lobby");
    } catch {
      window.localStorage.removeItem(storageKey);
    }
  }, []);

  useEffect(() => {
    if (!room) return;
    window.localStorage.setItem(storageKey, JSON.stringify({ ...room, entries, elapsed, stage }));
  }, [elapsed, entries, room, stage]);

  useEffect(() => {
    if (stage !== "countdown") return;
    setCountdown(3);
    const timer = window.setInterval(() => {
      setCountdown((value) => {
        if (value <= 1) {
          window.clearInterval(timer);
          setStage("playing");
          setRoom((current) =>
            current
              ? {
                  ...current,
                  status: "playing",
                  startedAt: new Date().toISOString(),
                  players: current.players.map((player) => ({
                    ...player,
                    status: "playing",
                    isReady: true
                  }))
                }
              : current
          );
          return 0;
        }
        return value - 1;
      });
    }, 900);
    return () => window.clearInterval(timer);
  }, [stage]);

  useEffect(() => {
    if (stage !== "playing" || solved) return;
    const timer = window.setInterval(() => setElapsed((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [solved, stage]);

  useEffect(() => {
    if (stage !== "playing" || !room) return;
    const timer = window.setInterval(() => {
      setRoom((current) => {
        if (!current || current.status !== "playing") return current;
        return {
          ...current,
          players: current.players.map((player) => {
            if (player.id === "you" || player.status === "finished") return player;
            const nextProgress = Math.min(100, player.progress + 2 + Math.floor(Math.random() * 5));
            const finished = nextProgress >= 100;
            return {
              ...player,
              progress: nextProgress,
              mistakes: player.mistakes + (Math.random() > 0.88 ? 1 : 0),
              hintsUsed: player.hintsUsed + (Math.random() > 0.94 ? 1 : 0),
              status: finished ? "finished" : Math.random() > 0.96 ? "paused" : "playing",
              finishTime: finished ? elapsed + 20 + Math.floor(Math.random() * 60) : player.finishTime,
              xp: finished ? 55 : player.xp
            };
          })
        };
      });
    }, 1600);
    return () => window.clearInterval(timer);
  }, [elapsed, room, stage]);

  useEffect(() => {
    if (!room || stage !== "playing") return;
    const active = room.players.some((player) => player.status !== "finished");
    if (!active || solved) finishBattle();
    // finishBattle depends on live room snapshots and is intentionally evaluated from this interval-driven state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room, solved, stage]);

  const createRoom = useCallback(() => {
    const puzzle = generateSudoku(difficulty, `battle-${difficulty}-${Date.now()}`);
    const player = makePlayer(true);
    const nextRoom: BattleRoom = {
      id: crypto.randomUUID(),
      roomCode: roomCode(),
      hostId: player.id,
      difficulty,
      mode,
      status: "waiting",
      puzzle: puzzle.puzzle,
      solution: puzzle.solution,
      createdAt: new Date().toISOString(),
      players: [player, makeOpponent(1)],
      moves: []
    };
    setRoom(nextRoom);
    setEntries(cloneBoard(puzzle.puzzle));
    setElapsed(0);
    setStage("lobby");
  }, [difficulty, mode]);

  function joinRoom() {
    const puzzle = generateSudoku(difficulty, `battle-${joinCode || "friend"}`);
    const player = makePlayer(false);
    const nextRoom: BattleRoom = {
      id: crypto.randomUUID(),
      roomCode: (joinCode || roomCode()).toUpperCase(),
      hostId: "opponent-1",
      difficulty,
      mode,
      status: "waiting",
      puzzle: puzzle.puzzle,
      solution: puzzle.solution,
      createdAt: new Date().toISOString(),
      players: [{ ...makeOpponent(1), isHost: true }, player],
      moves: []
    };
    setRoom(nextRoom);
    setEntries(cloneBoard(puzzle.puzzle));
    setElapsed(0);
    setStage("lobby");
  }

  function copyInvite() {
    navigator.clipboard?.writeText(inviteLink);
    toast({ title: "Invite link copied", variant: "success" });
  }

  function markReady() {
    setRoom((current) =>
      current
        ? {
            ...current,
            players: current.players.map((player) =>
              player.id === "you" ? { ...player, isReady: !player.isReady, status: player.isReady ? "online" : "ready" } : player
            )
          }
        : current
    );
  }

  function startGame() {
    if (!room) return;
    if (room.players.some((player) => !player.isReady && !player.isHost)) {
      toast({ title: "All players must be ready", variant: "error" });
      return;
    }
    setStage("countdown");
  }

  function setCell(row: number, col: number, digit: number) {
    if (!room || stage !== "playing" || given[row][col] || solved) return;
    const cellIndex = row * 9 + col;
    const isCorrect = room.solution[row][col] === digit;
    setEntries((current) => {
      const next = cloneBoard(current);
      next[row][col] = digit;
      return next;
    });
    setRoom((current) => {
      if (!current) return current;
      const nextBoard = cloneBoard(entries);
      nextBoard[row][col] = digit;
      const nextProgress = progressFor(nextBoard);
      const nextMistakes = (me?.mistakes ?? 0) + (isCorrect ? 0 : 1);
      return {
        ...current,
        moves: [
          ...current.moves,
          {
            id: crypto.randomUUID(),
            playerId: "you",
            cellIndex,
            value: digit,
            isCorrect,
            createdAt: new Date().toISOString()
          }
        ],
        players: current.players.map((player) =>
          player.id === "you"
            ? {
                ...player,
                progress: nextProgress,
                mistakes: nextMistakes,
                accuracy: accuracyFor(nextBoard, nextMistakes),
                status: "playing"
              }
            : player
        )
      };
    });
    if (!isCorrect) toast({ title: "Wrong cell. Mistake counted.", variant: "error" });
  }

  function useHint() {
    if (!room || !selected || stage !== "playing") return;
    const [row, col] = selected;
    if (given[row][col]) return;
    setRoom((current) =>
      current
        ? {
            ...current,
            players: current.players.map((player) =>
              player.id === "you" ? { ...player, hintsUsed: player.hintsUsed + 1 } : player
            )
          }
        : current
    );
    toast({ title: `Try ${room.solution[row][col]} after checking row, column and box.`, variant: "success" });
  }

  function finishBattle() {
    if (!room) return;
    const correct = boardComplete(entries, room.solution);
    if (!correct && solved) return;
    const finalRoom = {
      ...room,
      status: "finished" as const,
      finishedAt: new Date().toISOString(),
      players: room.players.map((player) =>
        player.id === "you" && correct
          ? {
              ...player,
              progress: 100,
              status: "finished" as const,
              finishTime: elapsed,
              accuracy: accuracyFor(entries, player.mistakes),
              xp: Math.max(35, 120 - player.mistakes * 10 - player.hintsUsed * 8)
            }
          : player.status === "finished"
            ? player
            : { ...player, status: "disconnected" as const }
      )
    };
    const finalRanking = rankPlayers(finalRoom.players);
    setRoom(finalRoom);
    setBattleHistory((current) => {
      const next = [finalRanking, ...current].slice(0, 6);
      window.localStorage.setItem(historyKey, JSON.stringify(next));
      return next;
    });
    setStage("results");
  }

  function rematch() {
    if (!room) return;
    const puzzle = generateSudoku(room.difficulty, `rematch-${Date.now()}`);
    setRoom({
      ...room,
      id: crypto.randomUUID(),
      status: "waiting",
      puzzle: puzzle.puzzle,
      solution: puzzle.solution,
      createdAt: new Date().toISOString(),
      startedAt: undefined,
      finishedAt: undefined,
      players: room.players.map((player) => ({
        ...player,
        isReady: player.isHost,
        progress: 0,
        mistakes: 0,
        hintsUsed: 0,
        finishTime: undefined,
        accuracy: 100,
        status: player.isHost ? "ready" : "online",
        xp: 0
      })),
      moves: []
    });
    setEntries(cloneBoard(puzzle.puzzle));
    setElapsed(0);
    setStage("lobby");
  }

  function leaveRoom() {
    window.localStorage.removeItem(storageKey);
    setRoom(null);
    setStage("setup");
    setElapsed(0);
  }

  function addFriend() {
    if (!friendName.trim()) return;
    setFriends((current) => [
      { username: friendName.trim(), city: "Global", online: true, rank: "New", wins: 0 },
      ...current
    ]);
    setFriendName("");
  }

  return (
    <div className="relative overflow-hidden">
      <div className="premium-grid pointer-events-none absolute inset-x-0 top-0 h-[460px]" />
      <div className="page-shell relative space-y-6">
        <section className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div className="space-y-3">
            <Badge variant="outline" className="w-fit gap-2">
              <Swords className="h-3.5 w-3.5 text-primary" />
              Sudoku Battle
            </Badge>
            <div>
              <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">Play Sudoku with Friends</h1>
              <p className="mt-3 max-w-2xl text-muted-foreground">
                Challenge your friends in realtime-style Sudoku races. Same puzzle, same timer, one winner.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/leaderboard">
                <Trophy className="h-4 w-4" />
                Leaderboard
              </Link>
            </Button>
            <Button onClick={createRoom}>
              <Plus className="h-4 w-4" />
              Create Room
            </Button>
          </div>
        </section>

        {stage === "setup" ? (
          <SetupPanel
            difficulty={difficulty}
            mode={mode}
            joinCode={joinCode}
            setDifficulty={setDifficulty}
            setMode={setMode}
            setJoinCode={setJoinCode}
            createRoom={createRoom}
            joinRoom={joinRoom}
          />
        ) : null}

        {room && stage === "lobby" ? (
          <LobbyPanel
            room={room}
            inviteLink={inviteLink}
            copyInvite={copyInvite}
            markReady={markReady}
            startGame={startGame}
            leaveRoom={leaveRoom}
          />
        ) : null}

        {room && stage === "countdown" ? (
          <div className="flex min-h-[420px] items-center justify-center rounded-xl border bg-card/80 shadow-soft backdrop-blur">
            <motion.div
              key={countdown}
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center"
            >
              <div className="text-7xl font-semibold text-primary">{countdown || "Go"}</div>
              <p className="mt-3 text-muted-foreground">Same grid. Clean solve wins.</p>
            </motion.div>
          </div>
        ) : null}

        {room && stage === "playing" ? (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <BattleBoard
              room={room}
              entries={entries}
              selected={selected}
              elapsed={elapsed}
              given={given}
              solved={solved}
              setSelected={setSelected}
              setCell={setCell}
              useHint={useHint}
              finishBattle={finishBattle}
            />
            <CompetitorPanel players={room.players} elapsed={elapsed} />
          </div>
        ) : null}

        {room && stage === "results" ? (
          <ResultPanel room={room} ranking={ranked} winner={winner} rematch={rematch} leaveRoom={leaveRoom} />
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <FriendsPanel friends={friends} friendName={friendName} setFriendName={setFriendName} addFriend={addFriend} />
          <BattleStatsPanel history={battleHistory} />
        </div>
      </div>
    </div>
  );
}

function SetupPanel({
  difficulty,
  mode,
  joinCode,
  setDifficulty,
  setMode,
  setJoinCode,
  createRoom,
  joinRoom
}: {
  difficulty: Difficulty;
  mode: BattleMode;
  joinCode: string;
  setDifficulty: (value: Difficulty) => void;
  setMode: (value: BattleMode) => void;
  setJoinCode: (value: string) => void;
  createRoom: () => void;
  joinRoom: () => void;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
      <Card className="overflow-hidden bg-card/88 shadow-soft backdrop-blur">
        <CardHeader>
          <CardTitle>Create private room</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Difficulty</Label>
            <Select value={difficulty} onValueChange={(value) => setDifficulty(value as Difficulty)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {difficulties.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item[0].toUpperCase() + item.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Mode</Label>
            <Select value={mode} onValueChange={(value) => setMode(value as BattleMode)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {modes.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2">
            <Button className="w-full" size="lg" onClick={createRoom}>
              <Swords className="h-4 w-4" />
              Create Room
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/88 shadow-soft backdrop-blur">
        <CardHeader>
          <CardTitle>Join by code</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            placeholder="Enter Room Code"
            value={joinCode}
            onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
          />
          <Button variant="outline" className="w-full" onClick={joinRoom}>
            <Users className="h-4 w-4" />
            Join Room
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function LobbyPanel({
  room,
  inviteLink,
  copyInvite,
  markReady,
  startGame,
  leaveRoom
}: {
  room: BattleRoom;
  inviteLink: string;
  copyInvite: () => void;
  markReady: () => void;
  startGame: () => void;
  leaveRoom: () => void;
}) {
  const host = room.players.find((player) => player.id === "you")?.isHost;
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
      <Card className="overflow-hidden bg-card/88 shadow-soft backdrop-blur">
        <CardHeader className="border-b">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Lobby</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                {room.difficulty.toUpperCase()} / {room.mode}
              </p>
            </div>
            <Badge className="font-mono text-base">{room.roomCode}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 p-4">
          {room.players.map((player) => (
            <PlayerRow key={player.id} player={player} />
          ))}
        </CardContent>
      </Card>
      <Card className="bg-card/88 shadow-soft backdrop-blur">
        <CardHeader>
          <CardTitle>Invite friend</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input value={inviteLink} readOnly />
          <Button variant="outline" className="w-full" onClick={copyInvite}>
            <Clipboard className="h-4 w-4" />
            Copy Invite Link
          </Button>
          <Button className="w-full" onClick={markReady}>
            <BadgeCheck className="h-4 w-4" />
            Ready
          </Button>
          <Button className="w-full" variant={host ? "default" : "secondary"} disabled={!host} onClick={startGame}>
            <Play className="h-4 w-4" />
            Start Game
          </Button>
          <Button className="w-full" variant="ghost" onClick={leaveRoom}>
            Leave Room
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function PlayerRow({ player }: { player: BattlePlayer }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border bg-background/60 p-3">
      <div className="flex min-w-0 items-center gap-3">
        <Avatar>
          <AvatarImage src={player.avatarUrl} />
          <AvatarFallback>{initials(player.username)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <div className="flex items-center gap-2 font-medium">
            <span className="truncate">{player.username}</span>
            {player.isHost ? <Crown className="h-4 w-4 text-amber-400" /> : null}
          </div>
          <div className="text-sm text-muted-foreground">{player.city}</div>
        </div>
      </div>
      <Badge variant={player.isReady ? "default" : "outline"}>{player.isReady ? "Ready" : "Waiting"}</Badge>
    </div>
  );
}

function BattleBoard({
  room,
  entries,
  selected,
  elapsed,
  given,
  solved,
  setSelected,
  setCell,
  useHint,
  finishBattle
}: {
  room: BattleRoom;
  entries: Board;
  selected: [number, number] | null;
  elapsed: number;
  given: boolean[][];
  solved: boolean;
  setSelected: (value: [number, number]) => void;
  setCell: (row: number, col: number, digit: number) => void;
  useHint: () => void;
  finishBattle: () => void;
}) {
  const me = room.players.find((player) => player.id === "you");
  const selectedValue = selected ? entries[selected[0]][selected[1]] : 0;
  return (
    <section className="space-y-4">
      <Card className="overflow-hidden bg-card/88 shadow-soft backdrop-blur">
        <CardHeader className="border-b">
          <div className="grid gap-3 sm:grid-cols-4">
            <Metric label="Timer" value={formatSeconds(elapsed)} />
            <Metric label="Mistakes" value={`${me?.mistakes ?? 0}`} />
            <Metric label="Hints" value={`${me?.hintsUsed ?? 0}`} />
            <Metric label="Progress" value={`${me?.progress ?? progressFor(entries)}%`} />
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-5">
          <div className="relative mx-auto grid w-full max-w-[min(92vw,620px)] touch-manipulation grid-cols-9 overflow-hidden">
            {solved ? <WinnerConfetti /> : null}
            {entries.map((row, rowIndex) =>
              row.map((value, colIndex) => {
                const isSelected = selected?.[0] === rowIndex && selected?.[1] === colIndex;
                const isRelated = selected ? relatedCell(selected, [rowIndex, colIndex]) : false;
                const sameValue = selectedValue && value === selectedValue;
                const isWrong = value !== 0 && value !== room.solution[rowIndex][colIndex];
                return (
                  <motion.button
                    key={`${rowIndex}-${colIndex}`}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => setSelected([rowIndex, colIndex])}
                    className={[
                      "relative aspect-square border bg-background/85 text-base font-semibold transition-colors min-[380px]:text-xl sm:text-2xl",
                      given[rowIndex][colIndex] ? "text-foreground" : "text-primary",
                      isRelated ? "bg-accent/70" : "",
                      sameValue ? "bg-primary/10 text-primary" : "",
                      isSelected ? "z-10 bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2 ring-offset-card" : "",
                      isWrong ? "animate-shake text-destructive" : ""
                    ].join(" ")}
                    style={{
                      borderRightWidth: colIndex === 2 || colIndex === 5 ? 2 : 1,
                      borderBottomWidth: rowIndex === 2 || rowIndex === 5 ? 2 : 1
                    }}
                  >
                    {value || ""}
                  </motion.button>
                );
              })
            )}
          </div>
          <div className="mx-auto mt-4 grid w-full max-w-[min(92vw,620px)] grid-cols-9 gap-2">
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
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="outline" onClick={useHint}>
              <ShieldCheck className="h-4 w-4" />
              Hint
            </Button>
            <Button onClick={finishBattle} disabled={!solved}>
              <Trophy className="h-4 w-4" />
              Finish
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

function CompetitorPanel({ players, elapsed }: { players: BattlePlayer[]; elapsed: number }) {
  return (
    <aside className="space-y-4">
      <Card className="bg-card/88 shadow-soft backdrop-blur">
        <CardHeader>
          <CardTitle>Live race</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {players.map((player) => (
            <div key={player.id} className="rounded-lg border bg-background/60 p-3">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{initials(player.username)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{player.username}</div>
                    <div className="text-xs text-muted-foreground">{player.city}</div>
                  </div>
                </div>
                <StatusBadge status={player.status} />
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${player.progress}%` }} />
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                <span>{player.progress}%</span>
                <span>{formatSeconds(player.finishTime ?? elapsed)}</span>
                <span>{player.mistakes} mistakes</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </aside>
  );
}

function ResultPanel({
  room,
  ranking,
  winner,
  rematch,
  leaveRoom
}: {
  room: BattleRoom;
  ranking: BattlePlayer[];
  winner?: BattlePlayer;
  rematch: () => void;
  leaveRoom: () => void;
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
      <Card className="overflow-hidden bg-card/88 shadow-soft backdrop-blur">
        <CardHeader className="border-b">
          <CardTitle>Winner</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-5">
          <WinnerConfetti />
          <div className="flex items-center gap-3">
            <Avatar className="h-14 w-14 border">
              <AvatarFallback>{initials(winner?.username ?? "Winner")}</AvatarFallback>
            </Avatar>
            <div>
              <div className="text-xl font-semibold">{winner?.username ?? "No winner"}</div>
              <div className="text-sm text-muted-foreground">
                {room.mode} / {room.difficulty.toUpperCase()}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Metric label="XP earned" value={`+${winner?.xp ?? 0}`} />
            <Metric label="Accuracy" value={`${winner?.accuracy ?? 0}%`} />
          </div>
          <Button className="w-full" onClick={rematch}>
            <RefreshCcw className="h-4 w-4" />
            Play Again
          </Button>
          <Button className="w-full" variant="outline" onClick={rematch}>
            Return to Lobby
          </Button>
          <Button className="w-full" variant="ghost" onClick={leaveRoom}>
            Share Result
          </Button>
        </CardContent>
      </Card>
      <Card className="bg-card/88 shadow-soft backdrop-blur">
        <CardHeader>
          <CardTitle>Ranking table</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="text-muted-foreground">
              <tr className="border-b">
                <th className="py-2 text-start">Rank</th>
                <th className="py-2 text-start">Player</th>
                <th className="py-2 text-start">Finish time</th>
                <th className="py-2 text-start">Mistakes</th>
                <th className="py-2 text-start">Accuracy</th>
                <th className="py-2 text-start">Hints</th>
                <th className="py-2 text-start">XP</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map((player, index) => (
                <tr key={player.id} className="border-b last:border-0">
                  <td className="py-3">#{index + 1}</td>
                  <td className="py-3 font-medium">{player.username}</td>
                  <td className="py-3 font-mono">{player.finishTime ? formatSeconds(player.finishTime) : "-"}</td>
                  <td className="py-3">{player.mistakes}</td>
                  <td className="py-3">{player.accuracy}%</td>
                  <td className="py-3">{player.hintsUsed}</td>
                  <td className="py-3">+{player.xp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

function FriendsPanel({
  friends,
  friendName,
  setFriendName,
  addFriend
}: {
  friends: Friend[];
  friendName: string;
  setFriendName: (value: string) => void;
  addFriend: () => void;
}) {
  return (
    <Card className="bg-card/88 shadow-soft backdrop-blur">
      <CardHeader>
        <CardTitle>Friends</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input placeholder="Add friend by username" value={friendName} onChange={(event) => setFriendName(event.target.value)} />
          <Button onClick={addFriend} size="icon" aria-label="Add friend">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="grid gap-2 md:grid-cols-2">
          {friends.map((friend) => (
            <div key={friend.username} className="flex items-center justify-between rounded-lg border bg-background/60 p-3">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback>{initials(friend.username)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2 font-medium">
                    {friend.username}
                    {friend.online ? <Wifi className="h-3.5 w-3.5 text-primary" /> : <WifiOff className="h-3.5 w-3.5 text-muted-foreground" />}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {friend.city} / {friend.rank} / {friend.wins} wins
                  </div>
                </div>
              </div>
              <Button variant="outline" size="sm">
                <Send className="h-4 w-4" />
                Invite
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function BattleStatsPanel({ history }: { history: BattlePlayer[][] }) {
  const wins = history.filter((ranking) => ranking[0]?.id === "you").length;
  const achievements = [
    "First Battle Win",
    "Beat a Friend",
    "No Mistake Duel",
    "Speed Demon",
    "Comeback Win",
    "3 Wins in a Row",
    "Almaty Champion"
  ];
  return (
    <Card className="bg-card/88 shadow-soft backdrop-blur">
      <CardHeader>
        <CardTitle>Battle rank</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <Metric label="Wins" value={wins} />
          <Metric label="Losses" value={Math.max(0, history.length - wins)} />
          <Metric label="Rank" value="Gold II" />
        </div>
        <div className="space-y-2">
          <div className="text-sm font-medium">Achievements</div>
          <div className="flex flex-wrap gap-2">
            {achievements.map((item, index) => (
              <Badge key={item} variant={index < Math.max(1, wins + 1) ? "default" : "outline"} className="gap-1">
                {index < 3 ? <Medal className="h-3.5 w-3.5" /> : <Flame className="h-3.5 w-3.5" />}
                {item}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border bg-background/65 p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 font-mono text-lg font-semibold">{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: PlayerStatus }) {
  const variant = status === "finished" ? "default" : status === "disconnected" ? "destructive" : "outline";
  return <Badge variant={variant}>{status}</Badge>;
}

function WinnerConfetti() {
  const colors = ["bg-primary", "bg-emerald-400", "bg-sky-400", "bg-amber-400", "bg-rose-400"];
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-center gap-4">
      {Array.from({ length: 22 }).map((_, index) => (
        <span
          key={index}
          className={["confetti-piece block h-2 w-1 rounded-sm", colors[index % colors.length]].join(" ")}
          style={{
            animationDelay: `${index * 34}ms`,
            transform: `translateX(${(index - 11) * 7}px)`
          }}
        />
      ))}
    </div>
  );
}
