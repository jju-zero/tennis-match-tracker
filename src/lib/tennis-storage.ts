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
