export type Screen =
  | "home"
  | "new"
  | "tournament"
  | "record"
  | "prepareMatch"
  | "finish"
  | "report"
  | "matchDetail"
  | "edit";

export type Grade = "4A" | "4B" | "4C" | "4D";
export type EventType = "U12男子シングルス" | "U14シングルス";
export type Result = "win" | "loss" | null;
export type Trend = "up" | "down" | "flat";
export type DrawSize = "qualifying" | "main";
export type Round = "QUALIFYING" | "R128" | "R64" | "R32" | "R16" | "QF" | "SF" | "F";

export type Stats = {
  firstIn: number;
  firstOut: number;
  deuceIn: number;
  deuceOut: number;
  adIn: number;
  adOut: number;
  doubleFaults: number;
  returnIn: number;
  returnOut: number;
  chances: number;
  chanceWins: number;
  volleyTries: number;
  volleyWins: number;
  net: number;
  baseOut: number;
  sideOut: number;
};

export type MatchStatus = "draft" | "done" | "recording";
export type TournamentStatus = "draft" | "active" | "eliminated" | "champion" | "done";

export type MatchRecord = {
  id: string;
  tournamentId: string;
  date: string;
  tournament: string;
  grade: Grade;
  event: EventType;
  drawSize: DrawSize;
  round: Round;
  opponentRegistrationNumber: string;
  opponent: string;
  opponentMemo: string;
  result: Result;
  score: string;
  status: MatchStatus;
  note: string;
  playerGames: number;
  opponentGames: number;
  stats: Stats;
};

export type Tournament = {
  id: string;
  name: string;
  date: string;
  grade: Grade;
  event: EventType;
  drawUrl: string;
  memo: string;
  drawSize: DrawSize;
  status: TournamentStatus;
  matches: MatchRecord[];
};

export type TournamentForm = {
  date: string;
  tournament: string;
  grade: Grade;
  event: EventType;
  drawUrl: string;
  memo: string;
};

export type EditMatchForm = TournamentForm & {
  id: string;
  tournamentId: string;
  status: MatchStatus;
  drawSize: DrawSize;
  round: Round;
  opponentRegistrationNumber: string;
  opponent: string;
  opponentMemo: string;
  result: Result;
  score: string;
  note: string;
  stats: Stats;
};

export type PrepareMatchForm = {
  drawSize: DrawSize;
  round: Round;
  opponentRegistrationNumber: string;
  opponent: string;
  opponentMemo: string;
};

export type StoredState = {
  tournaments: Tournament[];
  activeMatchId: string | null;
  stats: Stats;
  finishResult: Result;
  finishScore: string;
  finishNote: string;
  finishOpponentMemo: string;
};
