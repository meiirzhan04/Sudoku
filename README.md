# SudokuMind

SudokuMind is a modern web platform for playing, learning and competing in Sudoku. It combines classic Sudoku gameplay with daily challenges, AI coaching, leaderboards, personal statistics, Google authentication, premium customization ideas and a competitive friend battle mode.

> Train your brain. One grid at a time.

## Product Idea

SudokuMind turns a simple Sudoku board into a startup-style brain training product. Players can solve generated puzzles, keep progress in their profile, compare daily challenge results, ask an AI Coach for strategy explanations and race friends in Sudoku Battle.

The product is built for:

- Casual Sudoku players who want a polished daily habit.
- Students and learners who want explanations instead of raw answers.
- Competitive players who care about time, accuracy and rankings.
- Demo/recruiting contexts where the app should feel like a real product, not a small exercise.

## Key Features

- Premium landing page with SudokuMind branding, dark/light mode and responsive UI.
- Email/password auth, Google OAuth, JWT sessions and user profiles.
- Generated Sudoku puzzles with Easy, Medium, Hard, Expert and Insane difficulty.
- Timer, mistakes, notes mode, undo/redo, hints, pause and autosave.
- Daily Challenge with shared puzzle, city/global leaderboard and streak-oriented UX.
- AI Coach architecture with local fallback and Anthropic/OpenAI-ready integration style.
- Global and city leaderboard mock page for empty-production states.
- Profile with saved user data, stats and backend game history.
- Pro/Pricing page with Stripe-ready mock checkout positioning.
- Sudoku Battle mock realtime mode with rooms, lobby, invite links, ready/start flow, live opponent progress, results, XP, friends and achievements.

## Multiplayer Battle Mode

SudokuMind includes a competitive friend battle mode where users can create private rooms, invite friends with a room code, and race to solve the same Sudoku puzzle. The winner is determined by completion time, mistakes and hints used.

This feature adds social retention and makes the product more than a simple Sudoku board. It turns Sudoku into a competitive brain-training experience.

Current implementation:

- Frontend mock realtime room engine stored in `localStorage`.
- Fake room code and invite link generation.
- Lobby with host badge, player list, ready status, difficulty and battle mode.
- Animated `3, 2, 1, Go` countdown.
- Same Sudoku puzzle for all players.
- Live progress bars, opponent status, timer, mistakes and hints.
- Result screen with winner card, ranking table, XP, rematch and share actions.
- Friends list, add friend by username, invite action, battle history, rank and achievements.
- Refresh recovery through saved room state.

Realtime-ready data model:

```ts
rooms: {
  id: string
  roomCode: string
  hostId: string
  difficulty: "easy" | "medium" | "hard" | "expert" | "insane"
  mode: "1v1 Race" | "Group Race" | "No Mistakes Challenge" | "Fastest Time Wins"
  status: "waiting" | "playing" | "finished"
  puzzle: number[][]
  solution: number[][]
  createdAt: string
  startedAt?: string
  finishedAt?: string
}

roomPlayers: {
  roomId: string
  userId: string
  username: string
  avatarUrl?: string
  city: string
  isHost: boolean
  isReady: boolean
  progress: number
  mistakes: number
  hintsUsed: number
  finishTime?: number
  status: "online" | "playing" | "finished" | "disconnected"
}

moves: {
  roomId: string
  userId: string
  cellIndex: number
  value: number
  isCorrect: boolean
  createdAt: string
}
```

Future realtime adapters can use Spring WebSocket/STOMP, Firebase Firestore `onSnapshot`, or Supabase Realtime channels.

## Habit & Streak System

SudokuMind includes a habit-building streak system that encourages users to return every day. Players can complete daily challenges, build streaks, earn XP, unlock achievements and track weekly progress.

This turns Sudoku from a one-time puzzle into a daily brain-training habit.

The dashboard shows:

- Current Streak with a weekly completion line.
- Daily Challenge status and Share Streak action.
- XP, level progress and rewards.
- Continue Game card from local autosave.
- Daily Goal with XP reward.
- Weekly Progress chart.
- Streak milestones: 3, 7, 14, 30 and 100 days.
- Pro-oriented Streak Freeze UI.

Guest users store habit data in `localStorage`. The storage service in `lib/streak.ts` is intentionally isolated so it can later be backed by PostgreSQL, Firestore or Supabase without rewriting the dashboard UI.

## Tech Stack

Frontend:

- Next.js 14 App Router
- React 18
- TypeScript
- Tailwind CSS
- Framer Motion
- lucide-react
- next-themes

Backend:

- Spring Boot 3
- Java 17
- Spring Security
- JWT access/refresh tokens
- Google OAuth2
- PostgreSQL
- Flyway
- WebSocket/STOMP foundation
- Render deployment

Deployment:

- Frontend: Vercel
- Backend: Render
- Database: PostgreSQL

## Database Structure

Core backend tables/entities:

- `users`: id, username, email, avatarUrl, city, role, provider, createdAt.
- `game_sessions`: userId, puzzle, solution, currentBoard, difficulty, elapsedSeconds, mistakes, hintsUsed, status.
- `daily_challenges`: date, puzzle, solution, difficulty.
- `daily_results`: userId, challengeId, timeSeconds, mistakes, accuracy, completedAt.
- `friends`: friendship and friend request records.
- `ai_hint_logs`: prompt/response logs for coach explanations.

Planned battle persistence:

- `battle_rooms`
- `battle_room_players`
- `battle_moves`
- `battle_results`
- `battle_achievements`

## Environment Variables

Frontend `.env`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_SITE_URL=http://localhost:3000
ANTHROPIC_API_KEY=
```

Backend variables:

```env
FRONTEND_URL=http://localhost:3000
JWT_SECRET=replace-with-a-long-secret
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/sudokumind
SPRING_DATASOURCE_USERNAME=sudokumind
SPRING_DATASOURCE_PASSWORD=sudokumind
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
ANTHROPIC_API_KEY=
```

Production:

- Vercel `NEXT_PUBLIC_API_URL` should point to Render backend.
- Render `FRONTEND_URL` should point to the Vercel production domain.
- Google OAuth redirect URI should be:

```txt
https://your-render-backend.onrender.com/login/oauth2/code/google
```

## How To Run Locally

Install frontend dependencies:

```bash
npm install
```

Run frontend:

```bash
npm run dev
```

Run backend:

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

Or with local helper:

```powershell
.\run-local.cmd
```

## Verification

Frontend production build:

```bash
npm run build
```

Backend package:

```powershell
cd backend
.\mvnw.cmd -q -DskipTests package
```

## API Surface

Auth:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /oauth2/authorization/google`

Users:

- `GET /api/users/me`
- `PUT /api/users/me`
- `DELETE /api/users/me`
- `GET /api/users/search?username=...`

Games:

- `POST /api/games`
- `PUT /api/games/{id}/save`
- `POST /api/games/{id}/complete`
- `GET /api/games/history`

Daily:

- `GET /api/daily/today`
- `POST /api/daily/{id}/submit`
- `GET /api/daily/{id}/leaderboard`

AI:

- `POST /api/ai/explain-cell`
- Frontend fallback route: `POST /api/ai/hint`

## Business Potential

SudokuMind is positioned as a retention-focused brain training platform:

- Daily challenges create habit loops.
- Friend battles create social retention.
- AI Coach creates learning value.
- Pro plan supports unlimited hints, premium themes, advanced stats and expert puzzles.
- City leaderboards make the product feel local and competitive.

## Future Improvements

- Replace mock Battle adapter with Spring WebSocket or Firestore/Supabase Realtime.
- Persist battle rooms, moves and results in PostgreSQL.
- Add Stripe Checkout and subscription webhooks.
- Add premium board skins and Kids Mode.
- Add Morning Brain Mode with short focus sessions.
- Add real global leaderboard endpoint.
- Add avatar upload storage.

## Links

- Deployment: add your Vercel production URL here.
- Backend: add your Render backend URL here.
- GitHub: https://github.com/meiirzhan04/Sudoku
