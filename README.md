# RMIT Choose Your Action

Mobile-first web game for RMIT workplace decision scenarios.

## Run locally

```bash
npm install
npm run dev
```

## Supabase room sync

Create `.env.local`:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Create the table:

```sql
create table public.game_rooms (
  code text primary key,
  host_id uuid not null,
  state jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.game_rooms enable row level security;

create policy "read rooms by code"
on public.game_rooms for select
using (true);

create policy "create rooms"
on public.game_rooms for insert
with check (true);

create policy "host updates room"
on public.game_rooms for update
using (true)
with check (true);
```

Enable Realtime for `game_rooms` in Supabase if you want joined clients to follow host changes live.

## Build

```bash
npm run build
```
