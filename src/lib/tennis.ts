import type {
  DrawSize,
  EditMatchForm,
  EventType,
  Grade,
  MatchRecord,
  MatchStatus,
  PrepareMatchForm,
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
  returnIn: 0,
  returnOut: 0,
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
export const drawSizeOptions: DrawSize[] = ["qualifying", "main"];
export const mainRoundOptions: Round[] = ["R128", "R64", "R32", "R16", "QF", "SF", "F"];

export function createDefaultTournamentForm(): TournamentForm {
  return {
    date: getTodayString(),
    tournament: "",
    grade: "4C",
    event: "U12男子シングルス",
    drawUrl: "",
    memo: "",
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
    drawUrl: "",
    memo: "",
    drawSize: match?.drawSize ?? "main",
    round: match?.round ?? "R128",
    opponentRegistrationNumber: match?.opponentRegistrationNumber ?? "",
    opponent: match?.opponent ?? "",
    opponentMemo: match?.opponentMemo ?? "",
    status: match?.status ?? "draft",
    result: match?.result ?? "win",
    score: match?.score ?? "",
    note: match?.note ?? "",
    stats: normalizeStats(match?.stats),
  };
}

export function createTournament(form: TournamentForm, status: TournamentStatus = "draft"): Tournament {
  const tournamentId = `t-${Date.now()}`;
  return {
    id: tournamentId,
    name: form.tournament.trim(),
    date: form.date,
    grade: form.grade,
    event: form.event,
    drawUrl: normalizeTournamentUrl(form.drawUrl),
    memo: form.memo.trim(),
    drawSize: "main",
    status,
    matches: [],
  };
}

export function normalizeTournamentUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function createMatchForTournament(
  tournament: Tournament,
  input: {
    status: MatchStatus;
    drawSize?: DrawSize;
    round: Round;
    opponentRegistrationNumber?: string;
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
    drawSize: input.drawSize ?? tournament.drawSize,
    round: input.round,
    opponentRegistrationNumber: input.opponentRegistrationNumber ?? "",
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

export function validateTournamentForm(form: TournamentForm) {
  const errors: Record<string, string> = {};
  if (!form.date) errors.date = "日付を入力してください。";
  if (!form.tournament.trim()) errors.tournament = "大会名を入力してください。";
  if (!form.grade) errors.grade = "グレードを選択してください。";
  if (!form.event) errors.event = "種目を選択してください。";
  return errors;
}

export function validateEditMatchForm(form: EditMatchForm) {
  const errors: Record<string, string> = {};
  if (!form.opponent.trim()) {
    errors.opponent = "相手の名前を入力してください。";
  }
  return errors;
}

export function validatePrepareMatchForm(form: PrepareMatchForm) {
  const errors: Record<string, string> = {};
  if (!form.opponent.trim()) {
    errors.opponent = "相手の名前を入力してください。";
  }
  return errors;
}

export function flattenMatches(tournaments: Tournament[]) {
  return tournaments.flatMap((tournament) => tournament.matches);
}

export function sortMatchesByRecent(matches: MatchRecord[]) {
  return [...matches].sort((a, b) => {
    const dateDiff = matchDateTime(b) - matchDateTime(a);
    if (dateDiff !== 0) return dateDiff;

    return matchCreatedAt(b) - matchCreatedAt(a);
  });
}

function matchDateTime(match: MatchRecord) {
  const value = Date.parse(match.date);
  return Number.isNaN(value) ? 0 : value;
}

function matchCreatedAt(match: MatchRecord) {
  const timestamp = match.id.match(/^m-(\d+)/)?.[1];
  return timestamp ? Number(timestamp) : 0;
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

    const matches = tournament.matches.map((match) =>
      match.id === updatedMatch.id ? updatedMatch : match,
    );

    return {
      ...tournament,
      status: status ?? getTournamentStatus({ ...tournament, matches }),
      matches,
    };
  });
}

export function updateTournamentMetadataAndMatch(
  tournaments: Tournament[],
  updatedMatch: MatchRecord,
  meta: Pick<Tournament, "name" | "date" | "grade" | "event">,
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
        };
      }),
    };
  });

  return {
    tournaments: nextTournaments,
    tournament: nextTournaments.find((item) => item.id === updatedMatch.tournamentId) ?? null,
  };
}

export function firstRound(draw: DrawSize | Pick<PrepareMatchForm, "drawSize" | "round">): Round {
  if (typeof draw === "string") return draw === "qualifying" ? "QUALIFYING" : "R128";
  return draw.drawSize === "qualifying" ? "QUALIFYING" : draw.round;
}

export function roundOptionsForDraw(drawSize: DrawSize): Round[] {
  if (drawSize === "qualifying") return ["QUALIFYING"];
  return mainRoundOptions;
}

export function roundLabel(round: Round) {
  const labels: Record<Round, string> = {
    QUALIFYING: "予選",
    R128: "128強",
    R64: "64強",
    R32: "32強",
    R16: "16強",
    QF: "8強",
    SF: "4強",
    F: "決勝",
  };
  return labels[round];
}

export function drawSizeLabel(drawSize: DrawSize) {
  return drawSize === "qualifying" ? "予選" : "本戦";
}

export function nextRound(round: Round): Round | null {
  const order = mainRoundOptions;
  if (round === "QUALIFYING") return round;
  const index = order.indexOf(round);
  if (index < 0 || index === order.length - 1) return null;
  return order[index + 1];
}

export function nextRoundForTournament(tournament: Tournament) {
  const sorted = sortMatchesByRound(tournament.matches, tournament.drawSize);
  const latestDone = sorted.filter((match) => match.status === "done").at(-1);
  if (latestDone?.drawSize === "qualifying") return "QUALIFYING";

  const latestDoneWin = sorted
    .filter((match) => match.status === "done" && match.result === "win")
    .at(-1);
  if (!latestDoneWin) return firstRound(tournament.drawSize);
  return nextRoundInDraw(latestDoneWin.round, latestDoneWin.drawSize);
}

export function sortMatchesByRound(matches: MatchRecord[], drawSize?: DrawSize) {
  const drawOrder: Record<DrawSize, number> = {
    qualifying: 0,
    main: 1,
  };
  const mainOrder = roundOptionsForDraw("main");
  return matches
    .slice()
    .sort((a, b) => {
      const drawDiff = drawOrder[a.drawSize ?? drawSize ?? "main"] - drawOrder[b.drawSize ?? drawSize ?? "main"];
      if (drawDiff !== 0) return drawDiff;
      return mainOrder.indexOf(a.round) - mainOrder.indexOf(b.round);
    });
}

export function tournamentProgressText(tournament: Tournament) {
  const status = getTournamentStatus(tournament);
  if (status === "champion") return "優勝";
  if (status === "eliminated") return "大会終了";
  const sorted = sortMatchesByRound(tournament.matches, tournament.drawSize);
  const latest = sorted[sorted.length - 1];
  if (!latest) return "試合未作成";
  if (latest.status !== "done") return `${roundLabel(latest.round)} ${matchStatusText(latest)}`;
  if (latest.result === "win" && latest.round !== "F") {
    const next = nextRoundInDraw(latest.round, latest.drawSize);
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
    returnRate: returnRate(stats),
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
    returnRate: returnRate(stats),
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
    returnIn: left.returnIn + right.returnIn,
    returnOut: left.returnOut + right.returnOut,
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

export function returnRate(stats: Stats) {
  return successRate(stats.returnIn, stats.returnIn + stats.returnOut);
}

export function successRate(success: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((success / total) * 100);
}

export function totalMisses(stats: Stats) {
  return stats.net + stats.baseOut + stats.sideOut;
}

export function totalGames(match: MatchRecord) {
  return match.playerGames + match.opponentGames;
}

export function perTen(value: number, games: number) {
  if (!games) return "0.0";
  return ((value / games) * 10).toFixed(1);
}

export function normalizeStats(stats?: Partial<Stats> | null): Stats {
  return {
    ...emptyStats,
    ...stats,
  };
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
  if (match.result === "loss" && match.drawSize === "main") return "eliminated";
  if (match.result === "win" && match.round === "F") return "champion";
  return "active";
}

export function getTournamentStatus(tournament: Tournament): TournamentStatus {
  const sorted = sortMatchesByRound(tournament.matches, tournament.drawSize);
  const latest = sorted.at(-1);
  if (!latest) return "draft";
  if (sorted.some((match) => match.status !== "done")) return "active";
  if (latest.result === "loss" && latest.drawSize === "main") return "eliminated";
  if (latest.result === "win" && latest.round === "F") return "champion";
  return "active";
}

function round(value: number, decimals: number) {
  return Number(value.toFixed(decimals));
}

function nextRoundInDraw(round: Round, drawSize: DrawSize): Round | null {
  const order = roundOptionsForDraw(drawSize);
  if (round === "QUALIFYING") return round;
  const index = order.indexOf(round);
  if (index < 0 || index === order.length - 1) return null;
  return order[index + 1];
}

function getTodayString() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}
