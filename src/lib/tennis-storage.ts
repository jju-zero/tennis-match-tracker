import { emptyStats, firstRound } from "@/lib/tennis";
import type {
  DrawSize,
  EventType,
  Grade,
  MatchRecord,
  Round,
  StoredState,
  Tournament,
} from "@/types/tennis";

const storageKey = "tennis-match-tracker:v1";
const adminPinStorageKey = "court-note-admin-pin:v1";

let remoteWriteDisabled = false;

type LegacyDrawSize = DrawSize | 16 | 32 | 64;
type LegacyRound = Round | "R64" | "R32";

type LegacyMatch = Omit<MatchRecord, "tournamentId" | "drawSize" | "round"> & {
  tournamentId?: string;
  drawSize?: LegacyDrawSize;
  round?: LegacyRound;
};

export function readStoredState(): StoredState | null {
  if (typeof window === "undefined") return null;

  try {
    const rawState = window.localStorage.getItem(storageKey);
    if (!rawState) return null;

    const parsedState = JSON.parse(rawState) as Partial<StoredState> & {
      matches?: LegacyMatch[];
    };
    const tournaments = Array.isArray(parsedState.tournaments)
      ? normalizeTournaments(parsedState.tournaments)
      : migrateLegacyMatches(parsedState.matches ?? []);

    return {
      tournaments,
      activeMatchId: parsedState.activeMatchId ?? null,
      stats: parsedState.stats ?? { ...emptyStats },
      finishResult: parsedState.finishResult ?? "win",
      finishScore: parsedState.finishScore ?? "",
      finishNote: parsedState.finishNote ?? "",
      finishOpponentMemo: parsedState.finishOpponentMemo ?? "",
    };
  } catch {
    return null;
  }
}

export function writeStoredState(state: StoredState) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(storageKey, JSON.stringify(state));
  } catch {
    // Keep the in-memory session usable if storage is unavailable.
  }
}

export async function readRemoteState(): Promise<StoredState | null> {
  if (typeof window === "undefined") return null;

  try {
    const response = await fetch("/api/state", {
      method: "GET",
      cache: "no-store",
    });
    if (!response.ok) return null;

    const data = (await response.json()) as {
      state?: Partial<StoredState> | null;
      remoteStorage?: boolean;
    };
    if (!data.remoteStorage || !data.state) return null;

    return normalizeStoredState(data.state);
  } catch {
    return null;
  }
}

export async function writeRemoteState(state: StoredState): Promise<boolean> {
  if (typeof window === "undefined" || remoteWriteDisabled) return false;

  const response = await putRemoteState(state, readStoredAdminPin());
  if (response === "ok") return true;

  if (response === "pin-required") {
    const nextPin = window.prompt("記録用PINを入力してください。");
    if (!nextPin) return false;

    writeStoredAdminPin(nextPin);
    return (await putRemoteState(state, nextPin)) === "ok";
  }

  if (response === "not-configured") {
    remoteWriteDisabled = true;
  }

  return false;
}

async function putRemoteState(
  state: StoredState,
  adminPin: string | null,
): Promise<"ok" | "pin-required" | "not-configured" | "failed"> {
  try {
    const response = await fetch("/api/state", {
      method: "PUT",
      headers: {
        "content-type": "application/json",
        ...(adminPin ? { "x-court-note-pin": adminPin } : {}),
      },
      body: JSON.stringify({ state }),
    });

    if (response.ok) return "ok";
    if (response.status === 401 || response.status === 403) return "pin-required";
    if (response.status === 503) return "not-configured";
    return "failed";
  } catch {
    return "failed";
  }
}

function readStoredAdminPin() {
  try {
    return window.localStorage.getItem(adminPinStorageKey);
  } catch {
    return null;
  }
}

function writeStoredAdminPin(pin: string) {
  try {
    window.localStorage.setItem(adminPinStorageKey, pin);
  } catch {
    // The current save still works locally even if the PIN cannot be remembered.
  }
}

function normalizeStoredState(state: Partial<StoredState>): StoredState {
  return {
    tournaments: normalizeTournaments(state.tournaments ?? []),
    activeMatchId: state.activeMatchId ?? null,
    stats: state.stats ?? { ...emptyStats },
    finishResult: state.finishResult ?? "win",
    finishScore: state.finishScore ?? "",
    finishNote: state.finishNote ?? "",
    finishOpponentMemo: state.finishOpponentMemo ?? "",
  };
}

function normalizeTournaments(tournaments: Tournament[]): Tournament[] {
  return tournaments.map((tournament) => {
    const drawSize = normalizeDrawSize(tournament.drawSize as LegacyDrawSize | undefined);

    return {
      ...tournament,
      drawSize,
      status: tournament.status ?? "draft",
      matches: (tournament.matches ?? []).map((match) =>
        normalizeMatch(match as LegacyMatch, tournament.id, drawSize),
      ),
    };
  });
}

function migrateLegacyMatches(matches: LegacyMatch[]): Tournament[] {
  return matches.map((match) => {
    const drawSize = normalizeDrawSize(match.drawSize);
    const tournamentId = match.tournamentId ?? `t-${match.id}`;
    const tournament: Tournament = {
      id: tournamentId,
      name: match.tournament,
      date: match.date,
      grade: match.grade,
      event: match.event,
      drawSize,
      status:
        match.status === "done"
          ? match.result === "loss"
            ? "eliminated"
            : "active"
          : match.status === "recording"
            ? "active"
            : "draft",
      matches: [normalizeMatch(match, tournamentId, drawSize)],
    };

    return tournament;
  });
}

function normalizeMatch(match: LegacyMatch, tournamentId: string, drawSize: DrawSize): MatchRecord {
  return {
    ...match,
    tournamentId,
    drawSize,
    round: normalizeRound(match.round, drawSize),
    grade: match.grade as Grade,
    event: match.event as EventType,
    opponentMemo: match.opponentMemo ?? "",
    result: match.result ?? null,
    score: match.score ?? "",
    note: match.note ?? "",
    playerGames: match.playerGames ?? 0,
    opponentGames: match.opponentGames ?? 0,
    stats: match.stats ?? { ...emptyStats },
  };
}

function normalizeDrawSize(drawSize?: LegacyDrawSize): DrawSize {
  if (drawSize === "qualifying") return "qualifying";
  return "main";
}

function normalizeRound(round: LegacyRound | undefined, drawSize: DrawSize): Round {
  if (drawSize === "qualifying") return "QUALIFYING";
  if (round === "R16" || round === "QF" || round === "SF" || round === "F" || round === "MAIN") {
    return round;
  }
  return firstRound(drawSize);
}
