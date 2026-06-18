import { NextRequest, NextResponse } from "next/server";

const defaultStateId = "default";
const defaultTable = "court_note_state";

type SupabaseConfig = {
  url: string;
  key: string;
  table: string;
  stateId: string;
};

export async function GET() {
  const config = getSupabaseConfig();
  if (!config) {
    return NextResponse.json({ state: null, remoteStorage: false }, { status: 200 });
  }

  const response = await fetch(
    `${config.url}/rest/v1/${config.table}?id=eq.${encodeURIComponent(config.stateId)}&select=state`,
    {
      headers: supabaseHeaders(config),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    return NextResponse.json(
      { error: "REMOTE_READ_FAILED", message: await response.text() },
      { status: 502 },
    );
  }

  const rows = (await response.json()) as Array<{ state: unknown }>;
  return NextResponse.json({ state: rows[0]?.state ?? null, remoteStorage: true });
}

export async function PUT(request: NextRequest) {
  const config = getSupabaseConfig();
  if (!config) {
    return NextResponse.json(
      { error: "REMOTE_STORAGE_NOT_CONFIGURED" },
      { status: 503 },
    );
  }

  const adminPin = process.env.COURT_NOTE_ADMIN_PIN;
  if (process.env.NODE_ENV === "production" && !adminPin) {
    return NextResponse.json(
      { error: "ADMIN_PIN_NOT_CONFIGURED" },
      { status: 403 },
    );
  }

  if (adminPin && request.headers.get("x-court-note-pin") !== adminPin) {
    return NextResponse.json(
      { error: "ADMIN_PIN_REQUIRED" },
      { status: 401 },
    );
  }

  const body = (await request.json()) as { state?: unknown };
  if (!body.state || typeof body.state !== "object") {
    return NextResponse.json({ error: "INVALID_STATE" }, { status: 400 });
  }

  const response = await fetch(`${config.url}/rest/v1/${config.table}`, {
    method: "POST",
    headers: {
      ...supabaseHeaders(config),
      "content-type": "application/json",
      prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify({
      id: config.stateId,
      state: body.state,
      updated_at: new Date().toISOString(),
    }),
  });

  if (!response.ok) {
    return NextResponse.json(
      { error: "REMOTE_WRITE_FAILED", message: await response.text() },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}

function getSupabaseConfig(): SupabaseConfig | null {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) return null;

  return {
    url: url.replace(/\/$/, ""),
    key,
    table: process.env.SUPABASE_STATE_TABLE ?? defaultTable,
    stateId: process.env.SUPABASE_STATE_ID ?? defaultStateId,
  };
}

function supabaseHeaders(config: SupabaseConfig) {
  return {
    apikey: config.key,
    authorization: `Bearer ${config.key}`,
  };
}
