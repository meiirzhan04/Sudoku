"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BadgeCheck, Copy, Crown, Gamepad2, Plus, RefreshCcw, Search, Send, ShieldCheck, Swords, Trophy, Users, Wifi } from "lucide-react";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { apiClient, hasAuthToken } from "@/lib/api-client";
import { Board, Difficulty, boardComplete, cloneBoard, relatedCell } from "@/lib/sudoku";
import { formatSeconds, initials } from "@/lib/utils";

type RoomStatus = "WAITING" | "ACTIVE" | "FINISHED" | "CANCELLED";
type BattleMode = "CLASSIC" | "HARDCORE" | "TIME_ATTACK";
type Stage = "setup" | "lobby" | "playing" | "results";

type RoomPlayer = {
  userId: string;
  username: string;
  avatarUrl?: string | null;
  mistakes: number;
  elapsedSeconds: number;
  progressPercent: number;
  connected: boolean;
  finishedAt?: string | null;
};

type RoomResponse = {
  id: string;
  roomCode: string;
  status: RoomStatus;
  hostUserId: string;
  winnerUserId?: string | null;
  puzzle: Board;
  solution: Board;
  currentBoard: Board;
  difficulty: string;
  mode: string;
  players: RoomPlayer[];
};

type FriendResponse = {
  user: {
    id: string;
    username: string;
    fullName: string;
    city?: string | null;
    avatarUrl?: string | null;
    stats: {
      wins: number;
      bestTimeSeconds?: number | null;
    };
  };
  online: boolean;
};

type UserSuggestion = FriendResponse["user"];

type FriendRequestResponse = {
  id: string;
  sender: { username: string };
  receiver: { username: string };
  status: string;
};

type GameInviteResponse = {
  id: string;
  senderId: string;
  senderUsername: string;
  receiverId: string;
  receiverUsername: string;
  roomId: string;
  roomCode: string;
  status: string;
  expiresAt: string;
};

type OnlinePlayer = {
  id: string;
  username: string;
  city?: string | null;
  avatarUrl?: string | null;
  status: string;
};

type MoveEvent = {
  correct: boolean;
  progressPercent: number;
  mistakes: number;
  type: string;
};

const difficulties: Difficulty[] = ["easy", "medium", "hard", "expert"];
const modes: Array<{ value: BattleMode; label: string }> = [
  { value: "CLASSIC", label: "Классика" },
  { value: "HARDCORE", label: "Хардкор" },
  { value: "TIME_ATTACK", label: "На время" }
];
const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9];

function emptyBoard(): Board {
  return Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => 0)) as Board;
}

function filledPercent(board: Board) {
  return Math.round((board.flat().filter(Boolean).length / 81) * 100);
}

export function BattleClient() {
  const { toast } = useToast();
  const [authed, setAuthed] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<UserSuggestion | null>(null);
  const [stage, setStage] = useState<Stage>("setup");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [mode, setMode] = useState<BattleMode>("CLASSIC");
  const [joinCode, setJoinCode] = useState("");
  const [room, setRoom] = useState<RoomResponse | null>(null);
  const [entries, setEntries] = useState<Board>(() => emptyBoard());
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [friends, setFriends] = useState<FriendResponse[]>([]);
  const [incoming, setIncoming] = useState<FriendRequestResponse[]>([]);
  const [gameInvites, setGameInvites] = useState<GameInviteResponse[]>([]);
  const [onlinePlayers, setOnlinePlayers] = useState<OnlinePlayer[]>([]);
  const [friendQuery, setFriendQuery] = useState("");
  const [friendSuggestions, setFriendSuggestions] = useState<UserSuggestion[]>([]);
  const [friendSearching, setFriendSearching] = useState(false);
  const [busy, setBusy] = useState(false);

  const given = useMemo(() => (room ? room.puzzle.map((row) => row.map((value) => value !== 0)) : []), [room]);
  const me = useMemo(() => {
    if (!room) return undefined;
    return room.players.find((player) => player.userId === currentUserId) ?? room.players[0];
  }, [currentUserId, room]);
  const solved = room ? boardComplete(entries, room.solution) : false;
  const inviteLink = room ? `${window.location.origin}/battle?room=${room.roomCode}` : "";
  const isHost = Boolean(room && me?.userId === room.hostUserId);

  const loadFriends = useCallback(async () => {
    if (!hasAuthToken()) return;
    const [friendsResponse, incomingResponse, gameInvitesResponse, onlineResponse] = await Promise.all([
      apiClient.get<FriendResponse[]>("/friends"),
      apiClient.get<FriendRequestResponse[]>("/friends/requests/incoming"),
      apiClient.get<GameInviteResponse[]>("/game-invites/incoming"),
      apiClient.get<OnlinePlayer[]>("/stats/players/online")
    ]);
    setFriends(friendsResponse.data);
    setIncoming(incomingResponse.data);
    setGameInvites(gameInvitesResponse.data);
    setOnlinePlayers(onlineResponse.data);
  }, []);

  const refreshRoom = useCallback(async () => {
    if (!room) return;
    const response = await apiClient.get<RoomResponse>(`/multiplayer/rooms/${room.id}`);
    setRoom(response.data);
    setEntries(cloneBoard(response.data.currentBoard));
    if (response.data.status === "ACTIVE") setStage("playing");
    if (response.data.status === "FINISHED") setStage("results");
  }, [room]);

  useEffect(() => {
    setAuthed(hasAuthToken());
    const params = new URLSearchParams(window.location.search);
    const code = params.get("room");
    if (code) setJoinCode(code.toUpperCase());
    if (hasAuthToken()) {
      void apiClient.get<UserSuggestion>("/users/me").then((response) => {
        setCurrentUserId(response.data.id);
        setCurrentUser(response.data);
      }).catch(() => undefined);
    }
  }, []);

  useEffect(() => {
    const value = friendQuery.trim();
    if (!authed || value.length < 2) {
      setFriendSuggestions([]);
      setFriendSearching(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setFriendSearching(true);
      apiClient
        .get<UserSuggestion[]>(`/friends/search?username=${encodeURIComponent(value)}`, { signal: controller.signal })
        .then((response) => {
          const friendIds = new Set(friends.map((friend) => friend.user.id));
          setFriendSuggestions(response.data.filter((user) => user.id !== currentUserId && !friendIds.has(user.id)).slice(0, 5));
        })
        .catch(() => {
          if (!controller.signal.aborted) setFriendSuggestions([]);
        })
        .finally(() => {
          if (!controller.signal.aborted) setFriendSearching(false);
        });
    }, 250);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [authed, currentUserId, friendQuery, friends]);

  useEffect(() => {
    if (!authed) return;
    void loadFriends();
    const timer = window.setInterval(() => void loadFriends(), 5000);
    return () => window.clearInterval(timer);
  }, [authed, loadFriends]);

  useEffect(() => {
    if (!room || stage === "setup") return;
    const timer = window.setInterval(() => void refreshRoom(), 2500);
    return () => window.clearInterval(timer);
  }, [refreshRoom, room, stage]);

  useEffect(() => {
    if (!room || stage !== "playing" || solved) return;
    const timer = window.setInterval(() => {
      setElapsed((value) => value + 1);
      void apiClient.put(`/multiplayer/rooms/${room.id}/progress`, {
        roomId: room.id,
        currentBoard: entries,
        elapsedSeconds: elapsed + 1,
        mistakes: me?.mistakes ?? 0
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [elapsed, entries, me?.mistakes, room, solved, stage]);

  useEffect(() => {
    if (!room || !solved || stage !== "playing") return;
    void refreshRoom();
  }, [refreshRoom, room, solved, stage]);

  async function createRoom() {
    setBusy(true);
    try {
      const response = await apiClient.post<{ roomId: string }>("/multiplayer/rooms", {
        difficulty: difficulty.toUpperCase(),
        mode
      });
      const roomResponse = await apiClient.get<RoomResponse>(`/multiplayer/rooms/${response.data.roomId}`);
      setRoom(roomResponse.data);
      setEntries(cloneBoard(roomResponse.data.currentBoard));
      setElapsed(0);
      setStage("lobby");
    } catch {
      toast({ title: "Сессия не подтверждена. Войди ещё раз и попробуй создать комнату.", variant: "info" });
    } finally {
      setBusy(false);
    }
  }

  async function joinRoom(code = joinCode) {
    if (!code.trim()) return;
    setBusy(true);
    try {
      const response = await apiClient.post<RoomResponse>("/multiplayer/rooms/join", { roomCode: code.trim().toUpperCase() });
      setRoom(response.data);
      setEntries(cloneBoard(response.data.currentBoard));
      setElapsed(0);
      setStage(response.data.status === "ACTIVE" ? "playing" : response.data.status === "FINISHED" ? "results" : "lobby");
    } catch {
      toast({ title: "Комната не найдена или уже заполнена", variant: "error" });
    } finally {
      setBusy(false);
    }
  }

  async function startBattle() {
    if (!room) return;
    const response = await apiClient.post<RoomResponse>(`/multiplayer/rooms/${room.id}/start`);
    setRoom(response.data);
    setStage("playing");
  }

  async function sendMove(row: number, col: number, value: number) {
    if (!room || stage !== "playing" || given[row][col]) return;
    const next = cloneBoard(entries);
    next[row][col] = value;
    setEntries(next);
    try {
      const response = await apiClient.put<MoveEvent>(`/multiplayer/rooms/${room.id}/move`, {
        roomId: room.id,
        row,
        col,
        value
      });
      if (!response.data.correct) toast({ title: "Ошибка засчитана", variant: "error" });
      await refreshRoom();
    } catch {
      toast({ title: "Ход не отправился", variant: "error" });
    }
  }

  async function leaveRoom() {
    if (room) await apiClient.post(`/multiplayer/rooms/${room.id}/leave`).catch(() => undefined);
    setRoom(null);
    setStage("setup");
    setEntries(emptyBoard());
  }

  async function copyInvite() {
    await navigator.clipboard?.writeText(inviteLink);
    toast({ title: "Ссылка приглашения скопирована", variant: "success" });
  }

  async function sendFriendRequest(username: string) {
    if (!username.trim()) return;
    try {
      await apiClient.post("/friends/requests", { receiverUsername: username.trim() });
      toast({ title: "Заявка в друзья отправлена", variant: "success" });
      setFriendQuery("");
      setFriendSuggestions([]);
      await loadFriends();
    } catch {
      toast({ title: "Пользователь не найден или заявка уже отправлена", variant: "info" });
    }
  }

  async function acceptRequest(id: string) {
    await apiClient.put(`/friends/requests/${id}/accept`);
    toast({ title: "Друг добавлен", variant: "success" });
    await loadFriends();
  }

  async function inviteFriend(friendId: string) {
    if (!room) {
      toast({ title: "Сначала создай комнату, потом отправь приглашение другу.", variant: "info" });
      return;
    }
    try {
      await apiClient.post("/game-invites", { friendId, roomId: room.id });
      toast({ title: "Invite sent", variant: "success" });
      await loadFriends();
    } catch {
      toast({ title: "Invite was not sent", variant: "error" });
    }
  }

  async function acceptGameInvite(invite: GameInviteResponse) {
    try {
      await apiClient.put(`/game-invites/${invite.id}/accept`);
      const response = await apiClient.get<RoomResponse>(`/multiplayer/rooms/${invite.roomId}`);
      setRoom(response.data);
      setEntries(cloneBoard(response.data.currentBoard));
      setElapsed(0);
      setStage(response.data.status === "ACTIVE" ? "playing" : response.data.status === "FINISHED" ? "results" : "lobby");
      await loadFriends();
    } catch {
      toast({ title: "Could not join invite", variant: "error" });
    }
  }

  async function declineGameInvite(id: string) {
    await apiClient.put(`/game-invites/${id}/decline`).catch(() => undefined);
    await loadFriends();
  }

  if (!authed) {
    return (
      <div className="page-shell">
        <Card className="mx-auto max-w-xl bg-card/90 shadow-soft">
          <CardContent className="space-y-4 p-6 text-center">
            <Swords className="mx-auto h-10 w-10 text-primary" />
            <h1 className="text-2xl font-semibold">Battle with Friends</h1>
            <p className="text-muted-foreground">Войди, чтобы добавлять друзей, видеть онлайн и играть в общей комнате.</p>
            <Button asChild className="w-full">
              <Link href="/login?next=/battle">Войти</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden">
      <div className="premium-grid pointer-events-none absolute inset-x-0 top-0 h-[420px]" />
      <div className="page-shell relative space-y-6">
        <section className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <Badge variant="outline" className="mb-3 gap-2">
              <Wifi className="h-3.5 w-3.5 text-primary" />
              Live Battle
            </Badge>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Battle with Friends</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">Создай комнату, пригласи друга и решайте одну Sudoku-доску одновременно.</p>
          </div>
          <Button asChild variant="outline">
            <Link href="/leaderboard">
              <Trophy className="h-4 w-4" />
              Рейтинг
            </Link>
          </Button>
        </section>

        {stage === "setup" ? (
          <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
            <Card className="bg-card/90 shadow-soft backdrop-blur">
              <CardHeader>
                <CardTitle>Новая комната</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Сложность</Label>
                  <Select value={difficulty} onValueChange={(value) => setDifficulty(value as Difficulty)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {difficulties.map((item) => <SelectItem key={item} value={item}>{labelDifficulty(item)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Режим</Label>
                  <Select value={mode} onValueChange={(value) => setMode(value as BattleMode)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {modes.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Button className="sm:col-span-2" size="lg" onClick={createRoom} disabled={busy}>
                  <Plus className="h-4 w-4" />
                  Создать комнату
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-card/90 shadow-soft backdrop-blur">
              <CardHeader>
                <CardTitle>Войти по коду</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input value={joinCode} onChange={(event) => setJoinCode(event.target.value.toUpperCase())} placeholder="ROOM CODE" />
                <Button variant="outline" className="w-full" onClick={() => void joinRoom()} disabled={busy}>
                  <Gamepad2 className="h-4 w-4" />
                  Присоединиться
                </Button>
              </CardContent>
            </Card>
          </section>
        ) : null}

        {room && stage === "lobby" ? (
          <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
            <Card className="bg-card/90 shadow-soft backdrop-blur">
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <CardTitle>Комната {room.roomCode}</CardTitle>
                  <Badge variant="outline">{labelDifficulty(room.difficulty)} / {labelMode(room.mode)}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {room.players.map((player) => <PlayerRow key={player.userId} player={player} host={player.userId === room.hostUserId} winner={false} />)}
              </CardContent>
            </Card>
            <Card className="bg-card/90 shadow-soft backdrop-blur">
              <CardHeader><CardTitle>Приглашение</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Input value={inviteLink} readOnly />
                <Button variant="outline" className="w-full" onClick={copyInvite}>
                  <Copy className="h-4 w-4" />
                  Скопировать ссылку
                </Button>
                {isHost ? (
                  <Button className="w-full" onClick={startBattle}>
                    <Swords className="h-4 w-4" />
                    Начать игру
                  </Button>
                ) : (
                  <div className="rounded-lg border bg-background/60 p-3 text-sm text-muted-foreground">Ждём, пока host начнёт игру.</div>
                )}
                <Button variant="ghost" className="w-full" onClick={leaveRoom}>Выйти</Button>
              </CardContent>
            </Card>
          </section>
        ) : null}

        {room && stage === "playing" ? (
          <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
            <BattleBoard room={room} entries={entries} selected={selected} given={given} elapsed={elapsed} setSelected={setSelected} sendMove={sendMove} />
            <LivePlayers room={room} elapsed={elapsed} />
          </section>
        ) : null}

        {room && stage === "results" ? (
          <ResultPanel room={room} leaveRoom={leaveRoom} rematch={createRoom} />
        ) : null}

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <FriendsPanel
            friends={friends}
            incoming={incoming}
            gameInvites={gameInvites}
            currentUser={currentUser}
            friendQuery={friendQuery}
            setFriendQuery={setFriendQuery}
            friendSuggestions={friendSuggestions}
            friendSearching={friendSearching}
            sendFriendRequest={sendFriendRequest}
            acceptRequest={acceptRequest}
            inviteFriend={inviteFriend}
            acceptGameInvite={acceptGameInvite}
            declineGameInvite={declineGameInvite}
          />
          <OnlinePanel players={onlinePlayers} />
        </section>
      </div>
    </div>
  );
}

function BattleBoard({
  room,
  entries,
  selected,
  given,
  elapsed,
  setSelected,
  sendMove
}: {
  room: RoomResponse;
  entries: Board;
  selected: [number, number] | null;
  given: boolean[][];
  elapsed: number;
  setSelected: (value: [number, number]) => void;
  sendMove: (row: number, col: number, value: number) => void;
}) {
  const selectedValue = selected ? entries[selected[0]][selected[1]] : 0;
  return (
    <Card className="overflow-hidden bg-card/90 shadow-soft backdrop-blur">
      <CardHeader className="border-b">
        <div className="grid gap-2 sm:grid-cols-4">
          <Metric label="Время" value={formatSeconds(elapsed)} />
          <Metric label="Заполнено" value={`${filledPercent(entries)}%`} />
          <Metric label="Статус" value={room.status} />
          <Metric label="Игроков" value={room.players.length} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-3 sm:p-5">
        <div className="mx-auto grid w-full max-w-[min(94vw,620px)] grid-cols-9 overflow-hidden rounded-lg border">
          {entries.map((row, rowIndex) =>
            row.map((value, colIndex) => {
              const isSelected = selected?.[0] === rowIndex && selected?.[1] === colIndex;
              const isRelated = selected ? relatedCell(selected, [rowIndex, colIndex]) : false;
              const sameValue = selectedValue && value === selectedValue;
              return (
                <motion.button
                  key={`${rowIndex}-${colIndex}`}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setSelected([rowIndex, colIndex])}
                  className={[
                    "aspect-square border bg-background/85 text-base font-semibold transition-colors sm:text-2xl",
                    given[rowIndex]?.[colIndex] ? "text-foreground" : "text-primary",
                    isRelated ? "bg-accent/70" : "",
                    sameValue ? "bg-primary/10 text-primary" : "",
                    isSelected ? "z-10 bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2 ring-offset-card" : ""
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
        <div className="mx-auto grid w-full max-w-[min(94vw,620px)] grid-cols-9 gap-1 sm:gap-2">
          {digits.map((digit) => (
            <Button key={digit} variant="secondary" className="aspect-square h-auto px-0 text-lg" onClick={() => selected && sendMove(selected[0], selected[1], digit)}>
              {digit}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function LivePlayers({ room, elapsed }: { room: RoomResponse; elapsed: number }) {
  return (
    <Card className="bg-card/90 shadow-soft backdrop-blur">
      <CardHeader><CardTitle>Онлайн в комнате</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {room.players.map((player) => (
          <div key={player.userId} className="rounded-lg border bg-background/60 p-3">
            <PlayerRow player={player} host={player.userId === room.hostUserId} winner={player.userId === room.winnerUserId} />
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${player.progressPercent}%` }} />
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
              <span>{player.progressPercent}%</span>
              <span>{formatSeconds(player.elapsedSeconds || elapsed)}</span>
              <span>{player.mistakes} ошибок</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function ResultPanel({ room, leaveRoom, rematch }: { room: RoomResponse; leaveRoom: () => void; rematch: () => void }) {
  const winner = room.players.find((player) => player.userId === room.winnerUserId);
  const ranking = [...room.players].sort((a, b) => b.progressPercent - a.progressPercent || a.mistakes - b.mistakes);
  return (
    <Card className="bg-card/90 shadow-soft backdrop-blur">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          Победитель: {winner?.username ?? "ещё не определён"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {ranking.map((player, index) => (
          <div key={player.userId} className="grid gap-2 rounded-lg border bg-background/60 p-3 sm:grid-cols-[80px_minmax(0,1fr)_120px_100px]">
            <span className="font-mono">#{index + 1}</span>
            <span className="font-medium">{player.username}</span>
            <span>{player.progressPercent}%</span>
            <span>{player.mistakes} ошибок</span>
          </div>
        ))}
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button onClick={rematch}><RefreshCcw className="h-4 w-4" /> Реванш</Button>
          <Button variant="outline" onClick={leaveRoom}>Выйти</Button>
        </div>
      </CardContent>
    </Card>
  );
}

function FriendsPanel({
  friends,
  incoming,
  gameInvites,
  currentUser,
  friendQuery,
  setFriendQuery,
  friendSuggestions,
  friendSearching,
  sendFriendRequest,
  acceptRequest,
  inviteFriend,
  acceptGameInvite,
  declineGameInvite
}: {
  friends: FriendResponse[];
  incoming: FriendRequestResponse[];
  gameInvites: GameInviteResponse[];
  currentUser: UserSuggestion | null;
  friendQuery: string;
  setFriendQuery: (value: string) => void;
  friendSuggestions: UserSuggestion[];
  friendSearching: boolean;
  sendFriendRequest: (username: string) => void;
  acceptRequest: (id: string) => void;
  inviteFriend: (friendId: string) => void;
  acceptGameInvite: (invite: GameInviteResponse) => void;
  declineGameInvite: (id: string) => void;
}) {
  return (
    <Card className="bg-card/90 shadow-soft backdrop-blur">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-primary" /> Друзья</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="ps-9" placeholder="username друга" value={friendQuery} onChange={(event) => setFriendQuery(event.target.value)} />
            {(friendSearching || friendSuggestions.length > 0 || friendQuery.trim().length >= 2) ? (
              <div className="absolute inset-x-0 top-12 z-20 overflow-hidden rounded-md border bg-card shadow-soft">
                {friendSearching ? <div className="px-3 py-2 text-sm text-muted-foreground">Ищем игроков...</div> : null}
                {!friendSearching && friendSuggestions.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground">Игроков с таким username не найдено.</div>
                ) : null}
                {friendSuggestions.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition hover:bg-muted"
                    onClick={() => setFriendQuery(user.username)}
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <Avatar className="h-7 w-7"><AvatarImage src={user.avatarUrl ?? undefined} /><AvatarFallback>{initials(user.username)}</AvatarFallback></Avatar>
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{user.username}</span>
                        <span className="block truncate text-xs text-muted-foreground">{user.city ?? "Global"} / {user.stats.wins} wins</span>
                      </span>
                    </span>
                    <Badge variant="outline">Выбрать</Badge>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <Button size="icon" onClick={() => sendFriendRequest(friendQuery)} aria-label="Добавить друга"><Plus className="h-4 w-4" /></Button>
        </div>
        {currentUser ? (
          <div className="rounded-lg border bg-background/60 p-3 text-xs text-muted-foreground">
            Ты онлайн как <span className="font-medium text-foreground">{currentUser.username}</span>. Друг должен войти в аккаунт и открыть сайт, тогда появится в онлайн.
          </div>
        ) : null}
        {incoming.length ? (
          <div className="space-y-2">
            {incoming.map((request) => (
              <div key={request.id} className="flex items-center justify-between rounded-lg border bg-background/60 p-3 text-sm">
                <span>{request.sender.username} хочет добавить тебя</span>
                <Button size="sm" onClick={() => acceptRequest(request.id)}>Принять</Button>
              </div>
            ))}
          </div>
        ) : null}
        {gameInvites.length ? (
          <div className="space-y-2">
            {gameInvites.map((invite) => (
              <div key={invite.id} className="flex items-center justify-between gap-3 rounded-lg border bg-background/60 p-3 text-sm">
                <span>{invite.senderUsername} invites you to {invite.roomCode}</span>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => acceptGameInvite(invite)}>Join</Button>
                  <Button size="sm" variant="ghost" onClick={() => declineGameInvite(invite.id)}>Decline</Button>
                </div>
              </div>
            ))}
          </div>
        ) : null}
        <div className="grid gap-2 md:grid-cols-2">
          {friends.map((friend) => (
            <div key={friend.user.id} className="flex items-center justify-between gap-3 rounded-lg border bg-background/60 p-3">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar><AvatarImage src={friend.user.avatarUrl ?? undefined} /><AvatarFallback>{initials(friend.user.username)}</AvatarFallback></Avatar>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 font-medium">
                    <span className="truncate">{friend.user.username}</span>
                    {friend.online ? <Wifi className="h-3.5 w-3.5 text-primary" /> : null}
                  </div>
                  <div className="truncate text-xs text-muted-foreground">{friend.user.city ?? "Global"} / {friend.user.stats.wins} wins</div>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => inviteFriend(friend.user.id)}>
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

function OnlinePanel({ players }: { players: OnlinePlayer[] }) {
  return (
    <Card className="bg-card/90 shadow-soft backdrop-blur">
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-3">
          <span>Онлайн сейчас</span>
          <Badge variant="outline" className="gap-1"><Wifi className="h-3.5 w-3.5 text-primary" /> {players.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {players.length === 0 ? <div className="rounded-lg border bg-background/60 p-3 text-sm text-muted-foreground">Онлайн появится, когда игрок войдёт в аккаунт и откроет сайт. Телефон и ноутбук лучше проверить под разными аккаунтами.</div> : null}
        {players.map((player) => (
          <div key={player.id} className="flex items-center justify-between rounded-lg border bg-background/60 p-3">
            <div className="flex items-center gap-3">
              <Avatar><AvatarImage src={player.avatarUrl ?? undefined} /><AvatarFallback>{initials(player.username)}</AvatarFallback></Avatar>
              <div>
                <div className="font-medium">{player.username}</div>
                <div className="text-xs text-muted-foreground">{player.city ?? "Global"}</div>
              </div>
            </div>
            <Badge className="gap-1"><Wifi className="h-3.5 w-3.5" /> online</Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function PlayerRow({ player, host, winner }: { player: RoomPlayer; host: boolean; winner: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <Avatar><AvatarImage src={player.avatarUrl ?? undefined} /><AvatarFallback>{initials(player.username)}</AvatarFallback></Avatar>
        <div className="min-w-0">
          <div className="flex items-center gap-2 font-medium">
            <span className="truncate">{player.username}</span>
            {host ? <Crown className="h-4 w-4 text-amber-400" /> : null}
            {winner ? <Trophy className="h-4 w-4 text-primary" /> : null}
          </div>
          <div className="text-xs text-muted-foreground">{player.connected ? "online" : "offline"}</div>
        </div>
      </div>
      <Badge variant={player.finishedAt ? "default" : player.connected ? "outline" : "secondary"}>
        {player.finishedAt ? <BadgeCheck className="mr-1 h-3.5 w-3.5" /> : <ShieldCheck className="mr-1 h-3.5 w-3.5" />}
        {player.finishedAt ? "finished" : player.connected ? "playing" : "offline"}
      </Badge>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border bg-background/60 p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 font-mono text-lg font-semibold">{value}</div>
    </div>
  );
}

function labelDifficulty(value: string) {
  const difficulty = value.toLowerCase();
  if (difficulty === "easy") return "Лёгкая";
  if (difficulty === "medium") return "Средняя";
  if (difficulty === "hard") return "Сложная";
  if (difficulty === "expert") return "Эксперт";
  return value;
}

function labelMode(value: string) {
  if (value === "HARDCORE") return "Хардкор";
  if (value === "TIME_ATTACK") return "На время";
  return "Классика";
}
