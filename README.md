# SudokuMind

SudokuMind is a full-stack daily Sudoku and brain-training platform.

The repository now contains:

- `app/`, `components/`, `lib/`: existing Next.js frontend.
- `backend/`: Spring Boot 3 backend for auth, users, games, daily challenge, friends, multiplayer, AI coach, JWT, Google OAuth, WebSocket/STOMP, PostgreSQL and Flyway.

## Backend Stack

- Java 17+
- Spring Boot 3
- Spring Web, Security, Data JPA, Validation
- PostgreSQL
- Flyway migrations
- JWT access token + refresh token
- Google OAuth2 Client
- WebSocket + STOMP
- OpenAPI / Swagger UI
- BCrypt password hashing

## Run With Docker Compose

```bash
docker compose up --build
```

Services:

- Backend: `http://localhost:8080`
- Swagger: `http://localhost:8080/swagger-ui.html`
- WebSocket: `ws://localhost:8080/ws`
- PostgreSQL: `localhost:5432`

Default database:

- DB: `sudokumind`
- User: `sudokumind`
- Password: `sudokumind`

## Run Backend Locally

From `backend/`:

```bash
./mvnw spring-boot:run
```

On Windows:

```powershell
.\mvnw.cmd spring-boot:run
```

The wrapper downloads Maven on first use if Maven is not installed globally.

If Docker/PostgreSQL credentials are not available, use the development-only in-memory profile:

```powershell
.\mvnw.cmd spring-boot:run -Dspring-boot.run.profiles=local
```

This uses H2 and keeps data only while the backend process is running.

Windows shortcuts:

```powershell
.\run-local.cmd
.\run-postgres.cmd
```

If you see `Process terminated with exit code: 1`, check the real error above it. The common causes are:

- Port `8080` is already busy because backend is already running.
- You ran PostgreSQL mode, but local PostgreSQL does not accept `sudokumind/sudokumind`.
- Google OAuth env vars are missing in non-local mode.

## Environment

Backend variables are documented in [backend/.env.example](backend/.env.example).

Frontend should use:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

## Main API Surface

Auth:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `GET /api/auth/me`
- `GET /oauth2/authorization/google`

Users:

- `GET /api/users/me`
- `PUT /api/users/me`
- `DELETE /api/users/me`
- `GET /api/users/search?username=...`
- `GET /api/users/{id}/public-profile`

Games:

- `POST /api/games`
- `GET /api/games/{id}`
- `PUT /api/games/{id}/move`
- `PUT /api/games/{id}/save`
- `POST /api/games/{id}/complete`
- `GET /api/games/history`
- `GET /api/games/resume`

Daily:

- `GET /api/daily/today`
- `POST /api/daily/{id}/submit`
- `GET /api/daily/{id}/leaderboard`
- `GET /api/daily/{id}/leaderboard?city=Almaty`

Friends:

- `POST /api/friends/requests`
- `GET /api/friends/requests/incoming`
- `GET /api/friends/requests/outgoing`
- `PUT /api/friends/requests/{id}/accept`
- `PUT /api/friends/requests/{id}/decline`
- `GET /api/friends`
- `DELETE /api/friends/{friendId}`
- `GET /api/friends/search?username=...`

Multiplayer:

- `POST /api/multiplayer/rooms`
- `POST /api/multiplayer/rooms/join`
- `GET /api/multiplayer/rooms/{roomId}`
- `POST /api/multiplayer/rooms/{roomId}/start`
- `POST /api/multiplayer/rooms/{roomId}/rematch`
- `POST /api/multiplayer/rooms/{roomId}/leave`

WebSocket STOMP:

- Connect: `ws://localhost:8080/ws`
- Subscribe: `/topic/rooms/{roomId}`, `/topic/rooms/{roomId}/moves`, `/topic/rooms/{roomId}/presence`
- Send: `/app/rooms/{roomId}/move`, `/app/rooms/{roomId}/progress`, `/app/rooms/{roomId}/presence`

AI:

- `POST /api/ai/explain-cell`

## Auth Notes

- Access token expires after 15 minutes.
- Refresh token expires after 7 days, or 30 days with `rememberMe=true`.
- Store the access token on the frontend and send it as:

```http
Authorization: Bearer <accessToken>
```

Refresh with:

```http
POST /api/auth/refresh
```

## Localization

Backend accepts:

```http
Accept-Language: en
Accept-Language: ru
Accept-Language: kk
```

Localized message files:

- `backend/src/main/resources/messages_en.properties`
- `backend/src/main/resources/messages_ru.properties`
- `backend/src/main/resources/messages_kk.properties`

## Verification

Backend compile/package:

```powershell
cd backend
.\mvnw.cmd -q -DskipTests package
```

Frontend build:

```bash
npm run build
```
