create extension if not exists "pgcrypto";

create table users (
  id uuid primary key default gen_random_uuid(),
  full_name varchar(160) not null,
  username varchar(80) not null unique,
  email varchar(180) not null unique,
  password_hash varchar(255),
  city varchar(120),
  avatar_url text,
  language varchar(8) not null default 'en',
  provider varchar(24) not null default 'LOCAL',
  role varchar(24) not null default 'USER',
  is_email_verified boolean not null default false,
  created_at timestamp not null default now(),
  updated_at timestamp not null default now()
);

create table refresh_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  token varchar(255) not null unique,
  expires_at timestamp not null,
  revoked boolean not null default false,
  created_at timestamp not null default now()
);

create table game_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  puzzle jsonb not null,
  solution jsonb not null,
  current_board jsonb not null,
  difficulty varchar(24) not null,
  status varchar(24) not null,
  mistakes int not null default 0,
  hints_used int not null default 0,
  elapsed_seconds int not null default 0,
  accuracy numeric(6,2) not null default 100,
  is_daily boolean not null default false,
  created_at timestamp not null default now(),
  updated_at timestamp not null default now(),
  completed_at timestamp
);

create table daily_challenges (
  id uuid primary key default gen_random_uuid(),
  challenge_date date not null unique,
  puzzle jsonb not null,
  solution jsonb not null,
  difficulty varchar(24) not null,
  created_at timestamp not null default now()
);

create table daily_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  daily_challenge_id uuid not null references daily_challenges(id) on delete cascade,
  time_seconds int not null,
  mistakes int not null,
  accuracy numeric(6,2) not null,
  completed_at timestamp not null default now(),
  unique (user_id, daily_challenge_id)
);

create table friend_requests (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references users(id) on delete cascade,
  receiver_id uuid not null references users(id) on delete cascade,
  status varchar(24) not null default 'PENDING',
  created_at timestamp not null default now(),
  updated_at timestamp not null default now(),
  unique (sender_id, receiver_id)
);

create table friends (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  friend_id uuid not null references users(id) on delete cascade,
  created_at timestamp not null default now(),
  unique (user_id, friend_id)
);

create table multiplayer_rooms (
  id uuid primary key default gen_random_uuid(),
  room_code varchar(16) not null unique,
  host_user_id uuid not null references users(id) on delete cascade,
  guest_user_id uuid references users(id) on delete set null,
  puzzle jsonb not null,
  solution jsonb not null,
  status varchar(24) not null default 'WAITING',
  winner_user_id uuid references users(id) on delete set null,
  created_at timestamp not null default now(),
  started_at timestamp,
  finished_at timestamp
);

create table multiplayer_players (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references multiplayer_rooms(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  current_board jsonb not null,
  mistakes int not null default 0,
  elapsed_seconds int not null default 0,
  progress_percent int not null default 0,
  is_connected boolean not null default true,
  finished_at timestamp,
  unique (room_id, user_id)
);

create table multiplayer_moves (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references multiplayer_rooms(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  row_index int not null,
  col_index int not null,
  value int not null,
  is_correct boolean not null,
  created_at timestamp not null default now()
);

create table game_invites (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references users(id) on delete cascade,
  receiver_id uuid not null references users(id) on delete cascade,
  room_id uuid references multiplayer_rooms(id) on delete cascade,
  status varchar(24) not null default 'PENDING',
  created_at timestamp not null default now(),
  expires_at timestamp not null
);

create table ai_hint_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  game_session_id uuid references game_sessions(id) on delete set null,
  prompt text not null,
  response text not null,
  language varchar(8) not null,
  created_at timestamp not null default now()
);

create index idx_users_username_lower on users (lower(username));
create index idx_users_email_lower on users (lower(email));
create index idx_game_sessions_user_status on game_sessions (user_id, status, updated_at desc);
create index idx_daily_results_rank on daily_results (daily_challenge_id, time_seconds asc, mistakes asc, accuracy desc);
create index idx_friend_requests_receiver on friend_requests (receiver_id, status);
create index idx_friends_user on friends (user_id);
create index idx_multiplayer_room_code on multiplayer_rooms (room_code);
create index idx_game_invites_receiver on game_invites (receiver_id, status);

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_users_updated before update on users for each row execute function set_updated_at();
create trigger trg_friend_requests_updated before update on friend_requests for each row execute function set_updated_at();
create trigger trg_game_sessions_updated before update on game_sessions for each row execute function set_updated_at();
