import type {
  DrawSize,
  EditMatchForm,
  EventType,
  Grade,
  MatchRecord,
  MatchStatus,
  Round,
  Stats,
  Tournament,
  TournamentForm,
  TournamentStatus,
} from "@/types/tennis";

export const emptyStats: Stats = {
  firstIn: 0,
  firstOut: 0,
  deuceIn: 0,
  deuceOut: 0,
  adIn: 0,
  adOut: 0,
  doubleFaults: 0,
  chances: 0,
  chanceWins: 0,
  volleyTries: 0,
  volleyWins: 0,
  net: 0,
  baseOut: 0,
  sideOut: 0,
};

export const gradeOptions: Grade[] = ["4A", "4B", "4C", "4D"];
export const eventOptions: EventType[] = ["U12男子シングルス", "U14シングルス"];
export const drawSizeOptions: DrawSize[] = ["qualifying", 16, 32, 64];

export function createDefaultTournamentForm(): TournamentForm {
  return {
    date: getTodayString(),
    tournament: "",
    grade: "4C",
    event: "U12男子シングルス",
    drawSize: 16,
    opponent: "",
    opponentMemo: "",
  };
}

export function createEditMatchForm(match?: MatchRecord | null): EditMatchForm {
  return {
    id: match?.id ?? "",
    tournamentId: match?.tournamentId ?? "",
    date: match?.date ?? getTodayString(),
    tournament: match?.tournament ?? "",
    grade: match?.grade ?? "4C",
    event: match?.event ?? "U12男子シングルス",
    drawSize: match?.drawSize ?? 16,
    round: match?.round ?? "R16",
    opponent: match?.opponent ?? "",
    opponentMemo: match?.opponentMemo ?? "",
    status: match?.status ?? "draft",
    result: match?.result ?? "win",
    score: match?.score ?? "",
    note: match?.note ?? "",
  };
}

export function createTournament(form: TournamentForm, status: MatchStatus): Tournament {
  const tournamentId = `t-${Date.now()}`;
  const tournament: Tournament = {
    id: tournamentId,
    name: form.tournament.trim(),
    date: form.date,
    grade: form.grade,
    event: form.event,
    drawSize: form.drawSize,
    status: status === "recording" ? "active" : "draft",
    matches: [],
  };

  const shouldCreateFirstMatch = status === "recording" || Boolean(form.opponent.trim());
  if (!shouldCreateFirstMatch) return tournament;

  return {
    ...tournament,
    matches: [
      createMatchForTournament(tournament, {
        status,
        round: firstRound(form.drawSize),
        opponent: form.opponent.trim(),
        opponentMemo: form.opponentMemo.trim(),
      }),
    ],
  };
}

export function createMatchForTournament(
  tournament: Tournament,
  input: {
    status: MatchStatus;
    round: Round;
    opponent: string;
    opponentMemo: string;
  },
): MatchRecord {
  return {
    id: `m-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    tournamentId: tournament.id,
    date: tournament.date,
    tournament: tournament.name,
    grade: tournament.grade,
    event: tournament.event,
    drawSize: tournament.drawSize,
    round: input.round,
    opponent: input.opponent,
    opponentMemo: input.opponentMemo,
    result: null,
    score: "",
    status: input.status,
    note: "",
    playerGames: 0,
    opponentGames: 0,
    stats: { ...emptyStats },
  };
}

export function validateTournamentForm(form: TournamentForm, requireOpponent: boolean) {
  const errors: Record<string, string> = {};
  if (!form.date) errors.date = "日付を入力してください。";
  if (!form.tournament.trim()) errors.tournament = "大会名を入力してください。";
  if (!form.grade) errors.grade = "グレードを選択してください。";
  if (!form.event) errors.event = "種目を選択してください。";
  if (requireOpponent && !form.opponent.trim()) {
    errors.opponent = "初戦を開始する場合は相手の名前を入力してください。";
  }
  return errors;
}

export function validateEditMatchForm(form: EditMatchForm) {
  const errors: Record<string, string> = validateTournamentForm(form, false);
  if (!form.opponent.trim()) {
    errors.opponent = "相手の名前を入力してください。";
  }
  return errors;
}

export function flattenMatches(tournaments: Tournament[]) {
  return tournaments.flatMap((tournament) => tournament.matches);
}

export function findTournamentById(tournaments: Tournament[], id: string) {
  return tournaments.find((tournament) => tournament.id === id) ?? null;
}

export function findMatchById(tournaments: Tournament[], id: string) {
  return flattenMatches(tournaments).find((match) => match.id === id) ?? null;
}

export function replaceMatchInTournaments(
  tournaments: Tournament[],
  updatedMatch: MatchRecord,
  status?: TournamentStatus,
) {
  return tournaments.map((tournament) => {
    if (tournament.id !== updatedMatch.tournamentId) return tournament;

    return {
      ...tournament,
      status: status ?? tournament.status,
      matches: tournament.matches.map((match) =>
        match.id === updatedMatch.id ? updatedMatch : match,
      ),
    };
  });
}

export function updateTournamentMetadataAndMatch(
  tournaments: Tournament[],
  updatedMatch: MatchRecord,
  meta: Pick<Tournament, "name" | "date" | "grade" | "event" | "drawSize">,
) {
  const nextTournaments = tournaments.map((tournament) => {
    if (tournament.id !== updatedMatch.tournamentId) return tournament;

    return {
      ...tournament,
      ...meta,
      matches: tournament.matches.map((match) => {
        const nextMatch = match.id === updatedMatch.id ? updatedMatch : match;
        return {
          ...nextMatch,
          date: meta.date,
          tournament: meta.name,
          grade: meta.grade,
          event: meta.event,
          drawSize: meta.drawSize,
        };
      }),
    };
  });

  return {
    tournaments: nextTournaments,
    tournament: nextTournaments.find((item) => item.id === updatedMatch.tournamentId) ?? null,
  };
}

export function firstRound(drawSize: DrawSize): Round {
  if (drawSize === "qualifying") return "QUALIFYING";
  if (drawSize === 64) return "R64";
  if (drawSize === 32) return "R32";
  return "R16";
}

export function roundOptionsForDraw(drawSize: DrawSize): Round[] {
  if (drawSize === "qualifying") return ["QUALIFYING", "R16", "QF", "SF", "F"];
  if (drawSize === 64) return ["R64", "R32", "R16", "QF", "SF", "F"];
  if (drawSize === 32) return ["R32", "R16", "QF", "SF", "F"];
  return ["R16", "QF", "SF", "F"];
}

export function roundLabel(round: Round) {
  const labels: Record<Round, string> = {
    QUALIFYING: "予選",
    R64: "本戦64",
    R32: "本戦32",
    R16: "本戦16",
    QF: "8強",
    SF: "4強",
    F: "決勝",
  };
  return labels[round];
}

export function drawSizeLabel(drawSize: DrawSize) {
  return drawSize === "qualifying" ? "予選" : `本戦${drawSize}`;
}

export function nextRound(round: Round): Round | null {
  const order: Round[] = ["QUALIFYING", "R64", "R32", "R16", "QF", "SF", "F"];
  const index = order.indexOf(round);
  if (index < 0 || index === order.length - 1) return null;
  return order[index + 1];
}

export function nextRoundForTournament(tournament: Tournament) {
  const sorted = sortMatchesByRound(tournament.matches, tournament.drawSize);
  const latestDoneWin = sorted
    .filter((match) => match.status === "done" && match.result === "win")
    .at(-1);
  if (!latestDoneWin) return firstRound(tournament.drawSize);
  return nextRoundInDraw(latestDoneWin.round, tournament.drawSize);
}

export function sortMatchesByRound(matches: MatchRecord[], drawSize: DrawSize) {
  const order = roundOptionsForDraw(drawSize);
  return matches
    .slice()
    .sort((a, b) => order.indexOf(a.round) - order.indexOf(b.round));
}

export function tournamentProgressText(tournament: Tournament) {
  if (tournament.status === "champion") return "優勝";
  if (tournament.status === "eliminated") return "大会終了";
  const sorted = sortMatchesByRound(tournament.matches, tournament.drawSize);
  const latest = sorted[sorted.length - 1];
  if (!latest) return `${roundLabel(firstRound(tournament.drawSize))} から開始`;
  if (latest.status !== "done") return `${roundLabel(latest.round)} ${matchStatusText(latest)}`;
  if (latest.result === "win" && latest.round !== "F") {
    const next = nextRoundInDraw(latest.round, tournament.drawSize);
    return next ? `${roundLabel(next)} へ` : roundLabel(latest.round);
  }
  return roundLabel(latest.round);
}

export function matchStatusText(match: MatchRecord) {
  if (match.status === "draft") return match.opponent ? "記録を開始" : "相手を入力して記録開始";
  if (match.status === "recording") return "記録を再開";
  return match.score || "スコア未入力";
}

export function buildLiveSummary(stats: Stats) {
  return {
    firstServe: firstServeRate(stats),
    chanceBall: successRate(stats.chanceWins, stats.chances),
    totalMiss: totalMisses(stats),
  };
}

export function buildSummary(matches: MatchRecord[]) {
  const games = matches.reduce((sum, match) => sum + totalGames(match), 0);
  const stats = matches.reduce(
    (acc, match) => addStats(acc, match.stats),
    { ...emptyStats },
  );
  const count = Math.max(matches.length, 1);

  return {
    firstServe: firstServeRate(stats),
    chanceBall: successRate(stats.chanceWins, stats.chances),
    deuce: sideRate(stats.deuceIn, stats.deuceOut),
    ad: sideRate(stats.adIn, stats.adOut),
    volley: successRate(stats.volleyWins, stats.volleyTries),
    doubleFaults: round(stats.doubleFaults / count, 1),
    net: round(stats.net / count, 1),
    dfPerTen: perTen(stats.doubleFaults, games),
    missPerTen: perTen(totalMisses(stats), games),
  };
}

export function addStats(left: Stats, right: Stats): Stats {
  return {
    firstIn: left.firstIn + right.firstIn,
    firstOut: left.firstOut + right.firstOut,
    deuceIn: left.deuceIn + right.deuceIn,
    deuceOut: left.deuceOut + right.deuceOut,
    adIn: left.adIn + right.adIn,
    adOut: left.adOut + right.adOut,
    doubleFaults: left.doubleFaults + right.doubleFaults,
    chances: left.chances + right.chances,
    chanceWins: left.chanceWins + right.chanceWins,
    volleyTries: left.volleyTries + right.volleyTries,
    volleyWins: left.volleyWins + right.volleyWins,
    net: left.net + right.net,
    baseOut: left.baseOut + right.baseOut,
    sideOut: left.sideOut + right.sideOut,
  };
}

export function firstServeRate(stats: Stats) {
  return successRate(stats.firstIn, stats.firstIn + stats.firstOut);
}

export function sideRate(success: number, fail: number) {
  return successRate(success, success + fail);
}

export function successRate(success: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((success / total) * 100);
}

export function totalMisses(stats: Stats) {
  return stats.doubleFaults + stats.net + stats.baseOut + stats.sideOut;
}

export function totalGames(match: MatchRecord) {
  return match.playerGames + match.opponentGames;
}

export function perTen(value: number, games: number) {
  if (!games) return "0.0";
  return ((value / games) * 10).toFixed(1);
}

export function parseScore(score: string) {
  const sets = score
    .split(",")
    .map((set) => set.trim().match(/(\d+)\s*[-–]\s*(\d+)/))
    .filter(Boolean) as RegExpMatchArray[];

  const player = sets.reduce((sum, set) => sum + Number(set[1]), 0);
  const opponent = sets.reduce((sum, set) => sum + Number(set[2]), 0);
  return { player, opponent, total: player + opponent };
}

export function getTournamentStatusAfterMatch(match: MatchRecord): TournamentStatus {
  if (match.result === "loss") return "eliminated";
  if (match.result === "win" && match.round === "F") return "champion";
  return "active";
}

function round(value: number, decimals: number) {
  return Number(value.toFixed(decimals));
}

function nextRoundInDraw(round: Round, drawSize: DrawSize): Round | null {
  const order = roundOptionsForDraw(drawSize);
  const index = order.indexOf(round);
  if (index < 0 || index === order.length - 1) return null;
  return order[index + 1];
}

function getTodayString() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}
