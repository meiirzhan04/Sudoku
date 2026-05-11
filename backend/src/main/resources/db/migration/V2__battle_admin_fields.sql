alter table users add column if not exists xp_override int;
alter table users add column if not exists streak_override int;

alter table multiplayer_rooms add column if not exists difficulty varchar(24) not null default 'MEDIUM';
alter table multiplayer_rooms add column if not exists mode varchar(40) not null default 'CLASSIC';
