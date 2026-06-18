import type { EventType, Grade, Round, Tournament } from "@/types/tennis";

import { getTournamentStatus, sortMatchesByRound } from "@/lib/tennis";

type PointAge = 12 | 14;
type FinishPosition = 1 | 2 | 4 | 8 | 16 | 32 | 64 | 128 | 256 | 512 | 1024;
type GradePointTable = Record<PointAge, Record<FinishPosition, number>>;
type Grade4DResult = "winner" | "runnerUp" | "participant";

export type TournamentPointResult = {
  points: number;
  label: string;
};

const approvedTournamentPoints: Record<Exclude<Grade, "4D">, GradePointTable> = {
  "4A": {
    14: { 1: 150, 2: 113, 4: 84, 8: 63, 16: 47, 32: 36, 64: 27, 128: 20, 256: 15, 512: 11, 1024: 8 },
    12: { 1: 75, 2: 56, 4: 42, 8: 32, 16: 24, 32: 18, 64: 13, 128: 10, 256: 8, 512: 6, 1024: 4 },
  },
  "4B": {
    14: { 1: 100, 2: 75, 4: 56, 8: 42, 16: 32, 32: 24, 64: 18, 128: 13, 256: 10, 512: 8, 1024: 6 },
    12: { 1: 50, 2: 38, 4: 28, 8: 21, 16: 16, 32: 12, 64: 9, 128: 7, 256: 5, 512: 4, 1024: 3 },
  },
  "4C": {
    14: { 1: 75, 2: 56, 4: 42, 8: 32, 16: 24, 32: 18, 64: 13, 128: 10, 256: 8, 512: 6, 1024: 4 },
    12: { 1: 35, 2: 26, 4: 20, 8: 15, 16: 11, 32: 8, 64: 6, 128: 5, 256: 4, 512: 3, 1024: 2 },
  },
};

const approvedTournament4DPoints: Record<PointAge, Record<Grade4DResult, number>> = {
  14: { winner: 6, runnerUp: 4, participant: 2 },
  12: { winner: 3, runnerUp: 2, participant: 1 },
};

export function getApprovedTournamentPoints(tournament: Tournament): TournamentPointResult | null {
  const status = getTournamentStatus(tournament);
  if (status !== "champion" && status !== "eliminated" && status !== "done") return null;

  const age = eventPointAge(tournament.event);
  const mainMatches = sortMatchesByRound(tournament.matches, tournament.drawSize).filter(
    (match) => match.status === "done" && match.drawSize === "main",
  );
  const latestMainMatch = mainMatches.at(-1);
  if (!latestMainMatch) return null;

  if (tournament.grade === "4D") {
    const result = grade4DResult(latestMainMatch.round, status);
    return {
      points: approvedTournament4DPoints[age][result],
      label: grade4DResultLabel(result),
    };
  }

  const position = finishPosition(latestMainMatch.round, status);
  const points = approvedTournamentPoints[tournament.grade][age][position];

  return {
    points,
    label: finishPositionLabel(position),
  };
}

function eventPointAge(event: EventType): PointAge {
  return event === "U14シングルス" ? 14 : 12;
}

function finishPosition(round: Round, status: Tournament["status"]): FinishPosition {
  if (status === "champion") return 1;

  const positions: Record<Round, FinishPosition> = {
    F: 2,
    SF: 4,
    QF: 8,
    R16: 16,
    R32: 32,
    R64: 64,
    R128: 128,
    QUALIFYING: 128,
  };

  return positions[round];
}

function finishPositionLabel(position: FinishPosition) {
  if (position === 1) return "優勝";
  if (position === 2) return "準優勝";
  return `${position}強`;
}

function grade4DResult(round: Round, status: Tournament["status"]): Grade4DResult {
  if (status === "champion") return "winner";
  if (round === "F") return "runnerUp";
  return "participant";
}

function grade4DResultLabel(result: Grade4DResult) {
  const labels: Record<Grade4DResult, string> = {
    winner: "優勝",
    runnerUp: "準優勝",
    participant: "参加者",
  };

  return labels[result];
}
