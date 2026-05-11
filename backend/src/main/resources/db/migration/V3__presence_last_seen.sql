alter table users add column if not exists last_seen_at timestamp;

update users
set last_seen_at = updated_at
where last_seen_at is null;
