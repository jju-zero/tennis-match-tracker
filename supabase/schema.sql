create table if not exists public.court_note_state (
  id text primary key,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.court_note_state enable row level security;

drop policy if exists "court_note_state_public_read" on public.court_note_state;
create policy "court_note_state_public_read"
  on public.court_note_state
  for select
  to anon
  using (id = 'default');

insert into public.court_note_state (id, state)
values (
  'default',
  '{
    "tournaments": [],
    "activeMatchId": null,
    "stats": {
      "firstIn": 0,
      "firstOut": 0,
      "deuceIn": 0,
      "deuceOut": 0,
      "adIn": 0,
      "adOut": 0,
      "doubleFaults": 0,
      "chances": 0,
      "chanceWins": 0,
      "volleyTries": 0,
      "volleyWins": 0,
      "net": 0,
      "baseOut": 0,
      "sideOut": 0
    },
    "finishResult": "win",
    "finishScore": "",
    "finishNote": "",
    "finishOpponentMemo": ""
  }'::jsonb
)
on conflict (id) do nothing;
