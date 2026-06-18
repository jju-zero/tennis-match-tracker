# Court Note

Junior tennis match tracker built with Next.js, TypeScript, Tailwind CSS, shadcn/ui, and Recharts.

## Local Development

```bash
pnpm install
pnpm run dev
```

Open `http://localhost:3000`.

## Supabase Storage

The app can read and write a single shared state row from Supabase. If Supabase environment variables are missing, it falls back to browser `localStorage`.

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the Supabase SQL editor.
3. Add these environment variables to Vercel:

```bash
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-server-only-service-role-key
COURT_NOTE_ADMIN_PIN=change-this-pin
```

Optional:

```bash
SUPABASE_STATE_TABLE=court_note_state
SUPABASE_STATE_ID=default
```

Public screens can read the shared data. Save operations use `/api/state` and require `COURT_NOTE_ADMIN_PIN` in production.
