"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  CalendarDays,
  CirclePlus,
  Flag,
  Minus,
  RotateCcw,
  Save,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

type Screen = "home" | "new" | "record" | "finish" | "report" | "detail";
type Grade = "4A" | "4B" | "4C" | "4D";
type EventType = "U12男子シングルス" | "U14シングルス";
type Result = "win" | "loss" | null;
type Trend = "up" | "down" | "flat";

type Stats = {
  firstIn: number;
  firstOut: number;
  deuceIn: number;
  deuceOut: number;
  adIn: number;
  adOut: number;
  doubleFaults: number;
  chances: number;
  chanceWins: number;
  volleyTries: number;
  volleyWins: number;
  net: number;
  baseOut: number;
  sideOut: number;
};

type Match = {
  id: string;
  date: string;
  tournament: string;
  grade: Grade;
  event: EventType;
  opponent: string;
  opponentMemo: string;
  result: Result;
  score: string;
  status: "done" | "recording";
  note: string;
  playerGames: number;
  opponentGames: number;
  stats: Stats;
};

const emptyStats: Stats = {
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

const initialMatches: Match[] = [];
const storageKey = "tennis-match-tracker:v1";

type StoredState = {
  matches: Match[];
  activeMatchId: string | null;
  stats: Stats;
  finishResult: Result;
  finishScore: string;
  finishNote: string;
  finishOpponentMemo: string;
};

const gradeOptions: Grade[] = ["4A", "4B", "4C", "4D"];
const eventOptions: EventType[] = ["U12男子シングルス", "U14シングルス"];

export default function Home() {
  const [screen, setScreen] = useState<Screen>("home");
  const [matches, setMatches] = useState<Match[]>(initialMatches);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [activeMatch, setActiveMatch] = useState<Match | null>(null);
  const [stats, setStats] = useState<Stats>({ ...emptyStats });
  const [history, setHistory] = useState<Stats[]>([]);
  const [form, setForm] = useState(() => ({
    date: getTodayString(),
    tournament: "",
    grade: "4C" as Grade,
    event: "U12男子シングルス" as EventType,
    opponent: "",
    opponentMemo: "",
  }));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [finishResult, setFinishResult] = useState<Result>("win");
  const [finishScore, setFinishScore] = useState("");
  const [finishNote, setFinishNote] = useState("");
  const [finishOpponentMemo, setFinishOpponentMemo] = useState("");
  const [storageReady, setStorageReady] = useState(false);

  const completedMatches = useMemo(
    () => matches.filter((match) => match.status === "done"),
    [matches],
  );
  const lastFive = useMemo(() => completedMatches.slice(0, 5), [completedMatches]);
  const summary = useMemo(() => buildSummary(lastFive), [lastFive]);
  const liveSummary = buildLiveSummary(stats);
  const parsedScore = parseScore(finishScore);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const stored = readStoredState();

      if (stored) {
        const storedActiveMatch = stored.activeMatchId
          ? stored.matches.find((match) => match.id === stored.activeMatchId) ?? null
          : null;

        setMatches(stored.matches);
        setActiveMatch(storedActiveMatch);
        setStats(storedActiveMatch ? storedActiveMatch.stats : stored.stats);
        setFinishResult(stored.finishResult);
        setFinishScore(stored.finishScore);
        setFinishNote(stored.finishNote);
        setFinishOpponentMemo(stored.finishOpponentMemo);
      }

      setStorageReady(true);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (!storageReady) return;

    writeStoredState({
      matches,
      activeMatchId: activeMatch?.id ?? null,
      stats,
      finishResult,
      finishScore,
      finishNote,
      finishOpponentMemo,
    });
  }, [
    activeMatch?.id,
    finishNote,
    finishOpponentMemo,
    finishResult,
    finishScore,
    matches,
    stats,
    storageReady,
  ]);

  function navigateHome() {
    setScreen("home");
  }

  function openMatch(match: Match) {
    if (match.status === "recording") {
      setActiveMatch(match);
      setStats(match.stats);
      setFinishOpponentMemo(match.opponentMemo);
      setScreen("record");
      return;
    }
    setSelectedMatch(match);
    setScreen("detail");
  }

  function startNewMatch() {
    const nextErrors: Record<string, string> = {};
    if (!form.date) nextErrors.date = "日付を入力してください。";
    if (!form.tournament.trim()) nextErrors.tournament = "大会名を入力してください。";
    if (!form.grade) nextErrors.grade = "グレードを選択してください。";
    if (!form.event) nextErrors.event = "種目を選択してください。";
    if (!form.opponent.trim()) nextErrors.opponent = "相手の名前を入力してください。";
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    const nextMatch: Match = {
      id: `m-${Date.now()}`,
      date: form.date,
      tournament: form.tournament,
      grade: form.grade,
      event: form.event,
      opponent: form.opponent,
      opponentMemo: form.opponentMemo,
      result: null,
      score: "",
      status: "recording",
      note: "",
      playerGames: 0,
      opponentGames: 0,
      stats: { ...emptyStats },
    };

    setActiveMatch(nextMatch);
    setStats({ ...emptyStats });
    setHistory([]);
    setFinishResult("win");
    setFinishScore("");
    setFinishNote("");
    setFinishOpponentMemo(form.opponentMemo);
    setMatches((current) => [nextMatch, ...current]);
    setScreen("record");
  }

  function addStat(key: keyof Stats) {
    const nextStats = { ...stats, [key]: stats[key] + 1 };

    setHistory((current) => [stats, ...current].slice(0, 20));
    syncActiveStats(nextStats);
  }

  function undo() {
    const [previous, ...rest] = history;
    if (!previous) return;
    syncActiveStats(previous);
    setHistory(rest);
  }

  function syncActiveStats(nextStats: Stats) {
    setStats(nextStats);

    if (!activeMatch) return;

    const updatedMatch = { ...activeMatch, stats: nextStats };
    setActiveMatch(updatedMatch);
    setMatches((current) =>
      current.map((match) => (match.id === updatedMatch.id ? updatedMatch : match)),
    );
  }

  function goFinish() {
    if (!activeMatch) return;
    setFinishOpponentMemo(activeMatch.opponentMemo);
    setScreen("finish");
  }

  function saveFinishedMatch() {
    if (!activeMatch) return;

    const saved: Match = {
      ...activeMatch,
      status: "done",
      result: finishResult,
      score: finishScore,
      note: finishNote,
      opponentMemo: finishOpponentMemo,
      playerGames: parsedScore.player,
      opponentGames: parsedScore.opponent,
      stats,
    };

    setMatches((current) =>
      current.map((match) => (match.id === activeMatch.id ? saved : match)),
    );
    setSelectedMatch(saved);
    setActiveMatch(null);
    setScreen("home");
  }

  return (
    <main className="min-h-screen bg-[#0f1726] text-slate-100">
      {screen === "home" && (
        <HomeScreen
          matches={matches}
          summary={summary}
          onNew={() => setScreen("new")}
          onReport={() => setScreen("report")}
          onOpenMatch={openMatch}
        />
      )}
      {screen === "new" && (
        <NewMatchScreen
          form={form}
          errors={errors}
          onBack={navigateHome}
          onChange={setForm}
          onStart={startNewMatch}
        />
      )}
      {screen === "record" && activeMatch && (
        <RecordScreen
          match={activeMatch}
          stats={stats}
          summary={liveSummary}
          canUndo={history.length > 0}
          onBack={navigateHome}
          onUndo={undo}
          onAdd={addStat}
          onFinish={goFinish}
        />
      )}
      {screen === "finish" && activeMatch && (
        <FinishScreen
          match={activeMatch}
          stats={stats}
          result={finishResult}
          score={finishScore}
          note={finishNote}
          opponentMemo={finishOpponentMemo}
          parsedScore={parsedScore}
          onBack={() => setScreen("record")}
          onResult={setFinishResult}
          onScore={setFinishScore}
          onNote={setFinishNote}
          onOpponentMemo={setFinishOpponentMemo}
          onSave={saveFinishedMatch}
        />
      )}
      {screen === "report" && (
        <ReportScreen matches={completedMatches} onBack={navigateHome} />
      )}
      {screen === "detail" && selectedMatch && (
        <DetailScreen
          match={selectedMatch}
          onBack={navigateHome}
          onResume={() => {
            setActiveMatch(selectedMatch);
            setStats(selectedMatch.stats);
            setHistory([]);
            setScreen("record");
          }}
        />
      )}
    </main>
  );
}

function HomeScreen({
  matches,
  summary,
  onNew,
  onReport,
  onOpenMatch,
}: {
  matches: Match[];
  summary: ReturnType<typeof buildSummary>;
  onNew: () => void;
  onReport: () => void;
  onOpenMatch: (match: Match) => void;
}) {
  return (
    <AppShell bottomPadding>
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-400">ジュニアテニス</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-normal">試合記録</h1>
        </div>
        <Button variant="ghost" className="gap-2 text-[#6ee787] hover:bg-slate-800/70 hover:text-[#6ee787]" onClick={onReport}>
          成長レポート
          <ArrowRight className="size-4" />
        </Button>
      </header>

      <section className="space-y-3">
        <SectionTitle>直近5試合まとめ</SectionTitle>
        <div className="grid gap-3 sm:grid-cols-3">
          <SummaryCard label="1stサーブ率" value={`${summary.firstServe}%`} trend="up" />
          <SummaryCard label="チャンスボール" value={`${summary.chanceBall}%`} trend="up" />
          <SummaryCard label="DF平均" value={`${summary.doubleFaults}本`} trend="down" />
        </div>
      </section>

      <section className="space-y-3">
        <SectionTitle>試合一覧</SectionTitle>
        {matches.length === 0 ? (
          <EmptyState
            title="まだ試合記録がありません"
            description="下のボタンから最初の試合を作成して、記録を始めてください。"
          />
        ) : (
          <div className="space-y-3">
            {matches.map((match) => (
              <button
                key={match.id}
                className="w-full rounded-2xl border border-slate-700 bg-[#202b3d] p-4 text-left shadow-sm transition hover:border-[#6ee787]/70 hover:bg-[#26344a]"
                onClick={() => onOpenMatch(match)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{match.tournament}</p>
                      {match.status === "recording" && (
                        <Badge className="bg-amber-400 text-slate-950 hover:bg-amber-400">
                          記録中
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-slate-400">
                      {match.date} · {match.grade} · {match.event}
                    </p>
                    <p className="mt-3 text-lg font-semibold">vs {match.opponent}</p>
                    <p className="mt-1 text-sm text-slate-400">{match.score || "記録を再開"}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-3">
                    <ResultBadge result={match.result} status={match.status} />
                    <div className="text-right">
                      <p className="text-lg font-semibold text-[#6ee787]">
                        {firstServeRate(match.stats)}%
                      </p>
                      <p className="text-xs text-slate-400">1stサーブ率</p>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      <FixedAction>
        <Button className="h-16 w-full gap-2 rounded-2xl bg-[#6ee787] text-base font-semibold text-slate-950 hover:bg-[#5bdd75]" onClick={onNew}>
          <CirclePlus className="size-5" />
          新しい試合を記録
        </Button>
      </FixedAction>
    </AppShell>
  );
}

function NewMatchScreen({
  form,
  errors,
  onBack,
  onChange,
  onStart,
}: {
  form: {
    date: string;
    tournament: string;
    grade: Grade;
    event: EventType;
    opponent: string;
    opponentMemo: string;
  };
  errors: Record<string, string>;
  onBack: () => void;
  onChange: (next: typeof form) => void;
  onStart: () => void;
}) {
  return (
    <AppShell bottomPadding>
      <ScreenHeader title="新しい試合" onBack={onBack} />

      <div className="space-y-5">
        <Field label="日付" required error={errors.date}>
          <div className="relative">
            <Input
              type="date"
              value={form.date}
              onChange={(event) => onChange({ ...form, date: event.target.value })}
              className={inputClass(Boolean(errors.date))}
            />
            <CalendarDays className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          </div>
        </Field>

        <Field label="大会名" required error={errors.tournament}>
          <Input
            value={form.tournament}
            placeholder="例：全国ジュニアテニス選手権"
            onChange={(event) => onChange({ ...form, tournament: event.target.value })}
            className={inputClass(Boolean(errors.tournament))}
          />
        </Field>

        <Field label="グレード" required error={errors.grade}>
          <div className="grid grid-cols-4 gap-2">
            {gradeOptions.map((grade) => (
              <ChoiceButton
                key={grade}
                selected={form.grade === grade}
                onClick={() => onChange({ ...form, grade })}
              >
                {grade}
              </ChoiceButton>
            ))}
          </div>
        </Field>

        <Field label="種目" required error={errors.event}>
          <div className="grid gap-2">
            {eventOptions.map((event) => (
              <ChoiceButton
                key={event}
                selected={form.event === event}
                onClick={() => onChange({ ...form, event })}
              >
                {event}
              </ChoiceButton>
            ))}
          </div>
        </Field>

        <Field label="相手の名前" required error={errors.opponent}>
          <Input
            value={form.opponent}
            placeholder="名前を入力"
            onChange={(event) => onChange({ ...form, opponent: event.target.value })}
            className={inputClass(Boolean(errors.opponent))}
          />
        </Field>

        <Field label="相手メモ" hint="任意">
          <Textarea
            value={form.opponentMemo}
            placeholder="強み、弱み、注意点など"
            onChange={(event) => onChange({ ...form, opponentMemo: event.target.value })}
            className="min-h-36 rounded-2xl border-slate-600 bg-[#34445c] text-slate-100 placeholder:text-slate-400"
          />
        </Field>
      </div>

      <FixedAction>
        <Button className="h-16 w-full rounded-2xl bg-[#49df78] text-base font-semibold text-slate-950 hover:bg-[#5bdd75]" onClick={onStart}>
          試合開始
        </Button>
      </FixedAction>
    </AppShell>
  );
}

function RecordScreen({
  match,
  stats,
  summary,
  canUndo,
  onBack,
  onUndo,
  onAdd,
  onFinish,
}: {
  match: Match;
  stats: Stats;
  summary: ReturnType<typeof buildLiveSummary>;
  canUndo: boolean;
  onBack: () => void;
  onUndo: () => void;
  onAdd: (key: keyof Stats) => void;
  onFinish: () => void;
}) {
  return (
    <AppShell wide bottomPadding>
      <header className="sticky top-0 z-10 -mx-4 border-b border-slate-700 bg-[#202b3d]/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="mx-auto flex max-w-5xl items-start justify-between gap-3">
          <div>
            <button className="mb-2 flex items-center gap-1 text-sm text-slate-400" onClick={onBack}>
              <ArrowLeft className="size-4" />
              ホーム
            </button>
            <p className="text-sm text-slate-400">
              {match.tournament} · {match.grade}
            </p>
            <h1 className="mt-1 text-2xl font-semibold">vs {match.opponent}</h1>
          </div>
          <Button variant="outline" className="h-11 gap-2 rounded-2xl border-slate-600 bg-[#202b3d] text-slate-100 hover:bg-[#34445c]" onClick={onUndo} disabled={!canUndo}>
            <RotateCcw className="size-4" />
            元に戻す
          </Button>
        </div>
        <div className="mx-auto mt-3 grid max-w-5xl grid-cols-4 gap-2">
          <LiveStat label="1stサーブ率" value={`${summary.firstServe}%`} tone="text-[#6ee787]" />
          <LiveStat label="チャンスボール" value={`${summary.chanceBall}%`} tone="text-[#69a9ff]" />
          <LiveStat label="総ミス" value={`${summary.totalMiss}`} tone="text-[#ffbd6e]" />
          <LiveStat label="DF" value={`${stats.doubleFaults}`} tone="text-[#ff7373]" />
        </div>
      </header>

      <div className="space-y-4">
        <RecordGroup title="サーブ" tone="slate">
          <RecordButton code="1st" label="1stサーブ 成功" value={stats.firstIn} tone="green" onClick={() => onAdd("firstIn")} />
          <RecordButton code="1st" label="1stサーブ 失敗" value={stats.firstOut} tone="red" onClick={() => onAdd("firstOut")} />
          <RecordButton code="D" label="デュースサイド 成功" value={stats.deuceIn} tone="green" onClick={() => onAdd("deuceIn")} />
          <RecordButton code="D" label="デュースサイド 失敗" value={stats.deuceOut} tone="red" onClick={() => onAdd("deuceOut")} />
          <RecordButton code="A" label="アドサイド 成功" value={stats.adIn} tone="green" onClick={() => onAdd("adIn")} />
          <RecordButton code="A" label="アドサイド 失敗" value={stats.adOut} tone="red" onClick={() => onAdd("adOut")} />
          <RecordButton code="DF" label="ダブルフォルト" value={stats.doubleFaults} tone="red" wide onClick={() => onAdd("doubleFaults")} />
        </RecordGroup>

        <RecordGroup title="チャンスボール" tone="blue">
          <RecordButton code="OPP" label="チャンスボール 発生" value={stats.chances} tone="blue" onClick={() => onAdd("chances")} />
          <RecordButton code="WIN" label="チャンスボール 成功" value={stats.chanceWins} tone="blue" onClick={() => onAdd("chanceWins")} />
        </RecordGroup>

        <RecordGroup title="ボレー" tone="purple">
          <RecordButton code="VOL" label="ボレー 試み" value={stats.volleyTries} tone="purple" onClick={() => onAdd("volleyTries")} />
          <RecordButton code="V" label="ボレー 成功" value={stats.volleyWins} tone="purple" onClick={() => onAdd("volleyWins")} />
        </RecordGroup>

        <RecordGroup title="ミス" tone="orange">
          <RecordButton code="NET" label="ネット" value={stats.net} tone="orange" onClick={() => onAdd("net")} />
          <RecordButton code="BASE" label="ベースアウト" value={stats.baseOut} tone="orange" onClick={() => onAdd("baseOut")} />
          <RecordButton code="SIDE" label="サイドアウト" value={stats.sideOut} tone="orange" onClick={() => onAdd("sideOut")} />
        </RecordGroup>
      </div>

      <FixedAction>
        <Button className="h-16 w-full gap-2 rounded-2xl border border-slate-600 bg-[#202b3d] text-base font-semibold text-slate-100 hover:bg-[#34445c]" onClick={onFinish}>
          <Flag className="size-5 text-amber-400" />
          試合終了
        </Button>
      </FixedAction>
    </AppShell>
  );
}

function FinishScreen({
  match,
  stats,
  result,
  score,
  note,
  opponentMemo,
  parsedScore,
  onBack,
  onResult,
  onScore,
  onNote,
  onOpponentMemo,
  onSave,
}: {
  match: Match;
  stats: Stats;
  result: Result;
  score: string;
  note: string;
  opponentMemo: string;
  parsedScore: ReturnType<typeof parseScore>;
  onBack: () => void;
  onResult: (result: Result) => void;
  onScore: (score: string) => void;
  onNote: (note: string) => void;
  onOpponentMemo: (memo: string) => void;
  onSave: () => void;
}) {
  const summary = buildLiveSummary(stats);
  const totalGames = parsedScore.total;

  return (
    <AppShell bottomPadding>
      <ScreenHeader title="試合終了" subtitle={`vs ${match.opponent}`} onBack={onBack} />

      <section className="space-y-3">
        <SectionTitle>結果</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          <ChoiceButton selected={result === "win"} onClick={() => onResult("win")}>
            勝利
          </ChoiceButton>
          <ChoiceButton selected={result === "loss"} onClick={() => onResult("loss")}>
            敗北
          </ChoiceButton>
        </div>
      </section>

      <section className="space-y-3">
        <Field label="スコア">
          <Input
            value={score}
            placeholder="例：6-3, 6-4"
            onChange={(event) => onScore(event.target.value)}
            className={inputClass(false)}
          />
        </Field>
        <div className="grid grid-cols-4 gap-2 text-sm">
          <GameCount label="自分" value={`${parsedScore.player}G`} tone="text-[#6ee787]" />
          <GameCount label="相手" value={`${parsedScore.opponent}G`} tone="text-[#ff7373]" />
          <GameCount label="合計" value={`${totalGames}G`} tone="text-slate-100" />
          <GameCount label="10GあたりDF" value={perTen(stats.doubleFaults, totalGames)} tone="text-amber-700" />
        </div>
      </section>

      <Card className="rounded-2xl border-slate-700 bg-[#202b3d] text-slate-100">
        <CardHeader>
          <CardTitle>今試合の記録</CardTitle>
        </CardHeader>
        <CardContent>
          <MetricGrid
            items={[
              ["ダブルフォルト", stats.doubleFaults, "text-rose-600"],
              ["ネット", stats.net, "text-orange-600"],
              ["ベースアウト", stats.baseOut, "text-amber-600"],
              ["サイドアウト", stats.sideOut, "text-yellow-600"],
              ["チャンス", stats.chances, "text-blue-600"],
              ["チャンス成功", stats.chanceWins, "text-emerald-600"],
              ["ボレー", stats.volleyTries, "text-purple-600"],
              ["ボレー成功", stats.volleyWins, "text-purple-600"],
              ["1stサーブ率", `${summary.firstServe}%`, "text-emerald-600"],
            ]}
          />
        </CardContent>
      </Card>

      <Field label="今日のメモ">
        <Textarea value={note} onChange={(event) => onNote(event.target.value)} className="min-h-32 rounded-2xl border-slate-600 bg-[#34445c] text-slate-100" />
      </Field>

      <Field label="相手メモ更新">
        <Textarea value={opponentMemo} onChange={(event) => onOpponentMemo(event.target.value)} className="min-h-32 rounded-2xl border-slate-600 bg-[#34445c] text-slate-100" />
      </Field>

      <FixedAction>
        <Button className="h-16 w-full gap-2 rounded-2xl bg-[#49df78] text-base font-semibold text-slate-950 hover:bg-[#5bdd75]" onClick={onSave}>
          <Save className="size-5" />
          保存する
        </Button>
      </FixedAction>
    </AppShell>
  );
}

function ReportScreen({ matches, onBack }: { matches: Match[]; onBack: () => void }) {
  const [period, setPeriod] = useState("5");
  const scopedMatches = period === "all" ? matches : matches.slice(0, Number(period));
  const summary = buildSummary(scopedMatches);
  const data = scopedMatches
    .slice()
    .reverse()
    .map((match) => {
      const games = totalGames(match);
      return {
        label: `${match.date.slice(5)} ${match.opponent.split(" ")[0]}`,
        firstServe: firstServeRate(match.stats),
        deuce: sideRate(match.stats.deuceIn, match.stats.deuceOut),
        ad: sideRate(match.stats.adIn, match.stats.adOut),
        chance: successRate(match.stats.chanceWins, match.stats.chances),
        volley: successRate(match.stats.volleyWins, match.stats.volleyTries),
        doubleFaults: Number(perTen(match.stats.doubleFaults, games)),
        misses: Number(perTen(totalMisses(match.stats), games)),
      };
    });

  return (
    <AppShell wide>
      <ScreenHeader title="成長レポート" onBack={onBack} />
      <Tabs value={period} onValueChange={setPeriod}>
        <TabsList className="grid h-auto w-full grid-cols-3 rounded-2xl border border-slate-700 bg-[#202b3d] p-1 shadow-sm">
          <TabsTrigger className="h-11" value="5">直近5試合</TabsTrigger>
          <TabsTrigger className="h-11" value="10">直近10試合</TabsTrigger>
          <TabsTrigger className="h-11" value="all">全期間</TabsTrigger>
        </TabsList>
      </Tabs>

      <section className="space-y-3">
        <SectionTitle>指標サマリー</SectionTitle>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <SummaryCard label="1stサーブ率" value={`${summary.firstServe}%`} trend="up" />
          <SummaryCard label="チャンスボール" value={`${summary.chanceBall}%`} trend="down" />
          <SummaryCard label="デュースサイド" value={`${summary.deuce}%`} trend="down" />
          <SummaryCard label="アドサイド率" value={`${summary.ad}%`} trend="up" />
          <SummaryCard label="ボレー率" value={`${summary.volley}%`} trend="up" />
          <SummaryCard label="ダブルフォルト" value={`${summary.doubleFaults}本`} trend="down" />
          <SummaryCard label="ネット" value={`${summary.net}本`} trend="up" />
          <SummaryCard label="10Gあたり DF" value={`${summary.dfPerTen}`} trend="down" />
          <SummaryCard label="10Gあたり ミス" value={`${summary.missPerTen}`} trend="down" />
        </div>
      </section>

      <ChartCard title="サーブ成功率">
        <LineChart data={data} margin={{ left: -18, right: 10, top: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "#94a3b8" }} />
          <YAxis domain={[0, 100]} tickLine={false} axisLine={false} tick={{ fill: "#94a3b8" }} />
          <Tooltip />
          <Line type="monotone" dataKey="firstServe" name="1st" stroke="#49df78" strokeWidth={3} />
          <Line type="monotone" dataKey="deuce" name="デュース" stroke="#69a9ff" strokeWidth={3} />
          <Line type="monotone" dataKey="ad" name="アド" stroke="#b69cff" strokeWidth={3} />
        </LineChart>
      </ChartCard>

      <ChartCard title="チャンスボール・ボレー成功率">
        <LineChart data={data} margin={{ left: -18, right: 10, top: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "#94a3b8" }} />
          <YAxis domain={[0, 100]} tickLine={false} axisLine={false} tick={{ fill: "#94a3b8" }} />
          <Tooltip />
          <Line type="monotone" dataKey="chance" name="チャンス" stroke="#69a9ff" strokeWidth={3} />
          <Line type="monotone" dataKey="volley" name="ボレー" stroke="#b69cff" strokeWidth={3} />
        </LineChart>
      </ChartCard>

      <ChartCard title="ミス推移（10Gあたり）">
        <LineChart data={data} margin={{ left: -18, right: 10, top: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "#94a3b8" }} />
          <YAxis tickLine={false} axisLine={false} tick={{ fill: "#94a3b8" }} />
          <Tooltip />
          <Line type="monotone" dataKey="doubleFaults" name="DF" stroke="#ff7373" strokeWidth={3} />
          <Line type="monotone" dataKey="misses" name="総ミス" stroke="#ff9138" strokeWidth={3} />
        </LineChart>
      </ChartCard>

      <section className="space-y-3">
        <SectionTitle>試合別記録</SectionTitle>
        {scopedMatches.length === 0 ? (
          <EmptyState
            title="表示できる試合がありません"
            description="試合を保存すると、ここに試合別の指標が表示されます。"
          />
        ) : (
          <div className="space-y-3">
            {scopedMatches.map((match) => (
              <div key={match.id} className="flex items-center justify-between rounded-2xl border border-slate-700 bg-[#202b3d] p-4">
                <div>
                  <p className="font-semibold">
                    {match.date.slice(5)} {match.opponent}
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    1st {firstServeRate(match.stats)}% · チャンス {successRate(match.stats.chanceWins, match.stats.chances)}% · DF {match.stats.doubleFaults}
                  </p>
                </div>
                <ResultBadge result={match.result} status={match.status} />
              </div>
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}

function DetailScreen({
  match,
  onBack,
  onResume,
}: {
  match: Match;
  onBack: () => void;
  onResume: () => void;
}) {
  const games = totalGames(match);

  return (
    <AppShell bottomPadding={match.status === "recording"}>
      <ScreenHeader title="試合詳細" subtitle={`vs ${match.opponent}`} onBack={onBack} />

      <Card className="rounded-2xl border-slate-700 bg-[#202b3d] text-slate-100">
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>{match.score || "記録中"}</CardTitle>
              <CardDescription className="mt-2 text-slate-400">
                {match.tournament} · {match.date} · {match.grade} · {match.event}
              </CardDescription>
            </div>
            <ResultBadge result={match.result} status={match.status} />
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-2">
          <GameCount label="自分" value={`${match.playerGames}G`} tone="text-[#6ee787]" />
          <GameCount label="相手" value={`${match.opponentGames}G`} tone="text-[#ff7373]" />
          <GameCount label="合計" value={`${games}G`} tone="text-slate-100" />
        </CardContent>
      </Card>

      <DetailSection
        title="サーブ"
        items={[
          ["1stサーブ率", `${firstServeRate(match.stats)}%`],
          ["デュースサイド", `${sideRate(match.stats.deuceIn, match.stats.deuceOut)}%`],
          ["アドサイド", `${sideRate(match.stats.adIn, match.stats.adOut)}%`],
          ["ダブルフォルト", match.stats.doubleFaults],
          ["10GあたりDF", perTen(match.stats.doubleFaults, games)],
        ]}
      />
      <DetailSection
        title="ミス"
        items={[
          ["ネット", match.stats.net],
          ["ベースアウト", match.stats.baseOut],
          ["サイドアウト", match.stats.sideOut],
          ["総ミス", totalMisses(match.stats)],
          ["10Gあたり総ミス", perTen(totalMisses(match.stats), games)],
        ]}
      />
      <DetailSection
        title="チャンスボール / ボレー"
        items={[
          ["チャンス発生", match.stats.chances],
          ["チャンス成功", match.stats.chanceWins],
          ["チャンス成功率", `${successRate(match.stats.chanceWins, match.stats.chances)}%`],
          ["ボレー試み", match.stats.volleyTries],
          ["ボレー成功率", `${successRate(match.stats.volleyWins, match.stats.volleyTries)}%`],
        ]}
      />

      <MemoBlock title="試合メモ" text={match.note || "メモなし"} />
      <MemoBlock title="相手メモ" text={match.opponentMemo || "メモなし"} />

      {match.status === "recording" && (
        <FixedAction>
          <Button className="h-16 w-full rounded-2xl bg-[#49df78] text-base font-semibold text-slate-950 hover:bg-[#5bdd75]" onClick={onResume}>
            記録を再開する
          </Button>
        </FixedAction>
      )}
    </AppShell>
  );
}

function AppShell({
  children,
  wide = false,
  bottomPadding = false,
}: {
  children: React.ReactNode;
  wide?: boolean;
  bottomPadding?: boolean;
}) {
  return (
    <div className={`mx-auto flex ${wide ? "max-w-5xl" : "max-w-[430px] sm:max-w-3xl"} flex-col gap-7 px-4 py-8 sm:px-6 ${bottomPadding ? "pb-28" : "pb-10"}`}>
      {children}
    </div>
  );
}

function ScreenHeader({
  title,
  subtitle,
  onBack,
}: {
  title: string;
  subtitle?: string;
  onBack: () => void;
}) {
  return (
    <header className="flex items-center gap-4">
      <Button variant="ghost" size="icon" className="text-slate-100 hover:bg-slate-800/70" onClick={onBack} aria-label="戻る">
        <ArrowLeft className="size-6" />
      </Button>
      <div>
        <h1 className="text-3xl font-semibold tracking-normal">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-400">{subtitle}</p>}
      </div>
    </header>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-sm font-semibold text-slate-400">{children}</h2>;
}

function SummaryCard({ label, value, trend }: { label: string; value: string; trend: Trend }) {
  return (
    <Card className="rounded-2xl border-slate-700 bg-[#202b3d] text-slate-100 shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-400">
          <TrendIcon trend={trend} />
          {label}
        </div>
        <p className="mt-3 text-3xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}

function TrendIcon({ trend }: { trend: Trend }) {
  if (trend === "up") return <ArrowUp className="size-4 text-emerald-600" />;
  if (trend === "down") return <ArrowDown className="size-4 text-rose-600" />;
  return <Minus className="size-4 text-slate-400" />;
}

function ResultBadge({ result, status }: { result: Result; status: Match["status"] }) {
  if (status === "recording") {
    return <Badge className="bg-amber-400 text-slate-950 hover:bg-amber-400">記録中</Badge>;
  }
  return (
    <Badge className={result === "win" ? "bg-emerald-600 hover:bg-emerald-600" : "bg-rose-600 hover:bg-rose-600"}>
      {result === "win" ? "勝" : "負"}
    </Badge>
  );
}

function Field({
  label,
  required,
  hint,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-semibold text-slate-400">
        {label} {required && <span className="text-rose-600">*</span>}
        {hint && <span className="ml-2 font-normal text-slate-500">({hint})</span>}
      </Label>
      {children}
      {error && <p className="text-sm text-rose-600">{error}</p>}
    </div>
  );
}

function ChoiceButton({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      variant={selected ? "default" : "outline"}
      className={`h-14 rounded-lg text-base font-semibold ${
        selected
          ? "bg-[#49df78] text-slate-950 hover:bg-[#5bdd75]"
          : "border-slate-600 bg-[#202b3d] text-slate-100 hover:bg-[#34445c]"
      }`}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

function RecordGroup({
  title,
  tone,
  children,
}: {
  title: string;
  tone: "slate" | "blue" | "purple" | "orange";
  children: React.ReactNode;
}) {
  const border = {
    slate: "border-slate-700",
    blue: "border-blue-700/70",
    purple: "border-purple-700/70",
    orange: "border-orange-700/70",
  }[tone];

  return (
    <section className={`rounded-2xl border ${border} bg-[#121d2f] p-4 shadow-sm`}>
      <h2 className="mb-3 text-sm font-semibold text-slate-300">{title}</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{children}</div>
    </section>
  );
}

function RecordButton({
  code,
  label,
  value,
  tone,
  wide,
  onClick,
}: {
  code: string;
  label: string;
  value: number;
  tone: "green" | "red" | "blue" | "purple" | "orange";
  wide?: boolean;
  onClick: () => void;
}) {
  const colors = {
    green: "border-emerald-600/45 bg-emerald-950/35 text-[#6ee787]",
    red: "border-rose-600/45 bg-rose-950/30 text-[#ff7373]",
    blue: "border-blue-600/45 bg-blue-950/30 text-[#7eb6ff]",
    purple: "border-purple-600/45 bg-purple-950/30 text-[#b69cff]",
    orange: "border-orange-600/45 bg-orange-950/30 text-[#ffbd6e]",
  }[tone];

  return (
    <button
      className={`${wide ? "col-span-2 sm:col-span-3" : ""} flex min-h-28 flex-col items-start justify-between rounded-2xl border p-4 text-left transition active:scale-[0.99] ${colors}`}
      onClick={onClick}
    >
      <span className="rounded-md bg-white/10 px-2 py-1 text-xs font-semibold">{code}</span>
      <span className="text-base font-semibold">{label}</span>
      <span className="text-3xl font-semibold">{value}</span>
    </button>
  );
}

function LiveStat({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="rounded-xl border border-slate-700 bg-[#182337] p-3 text-center shadow-sm">
      <p className={`text-xl font-semibold ${tone}`}>{value}</p>
      <p className="mt-1 text-xs text-slate-400">{label}</p>
    </div>
  );
}

function FixedAction({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-700 bg-[#0f1726]/95 p-4 backdrop-blur">
      <div className="mx-auto max-w-3xl">{children}</div>
    </div>
  );
}

function GameCount({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="rounded-2xl border border-slate-700 bg-[#202b3d] p-3">
      <p className="text-xs font-medium text-slate-400">{label}</p>
      <p className={`mt-1 text-xl font-semibold ${tone}`}>{value}</p>
    </div>
  );
}

function MetricGrid({ items }: { items: Array<[string, string | number, string]> }) {
  return (
    <div className="grid grid-cols-3 gap-4 text-center">
      {items.map(([label, value, tone]) => (
        <div key={label}>
          <p className={`text-2xl font-semibold ${tone}`}>{value}</p>
          <p className="mt-1 text-sm text-slate-400">{label}</p>
        </div>
      ))}
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactElement }) {
  return (
    <Card className="rounded-2xl border-slate-700 bg-[#202b3d] text-slate-100">
      <CardHeader>
        <CardTitle className="text-base text-slate-300">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            {children}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function DetailSection({ title, items }: { title: string; items: Array<[string, string | number]> }) {
  return (
    <Card className="rounded-2xl border-slate-700 bg-[#202b3d] text-slate-100">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {items.map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-slate-700 bg-[#182337] p-3">
              <p className="text-sm text-slate-400">{label}</p>
              <p className="mt-1 text-xl font-semibold">{value}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function MemoBlock({ title, text }: { title: string; text: string }) {
  return (
    <section className="space-y-2">
      <SectionTitle>{title}</SectionTitle>
      <div className="min-h-24 rounded-2xl border border-slate-700 bg-[#202b3d] p-4 text-sm leading-6 text-slate-200">{text}</div>
    </section>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-700 bg-[#182337] p-6 text-center">
      <p className="font-semibold text-slate-100">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
    </div>
  );
}

function inputClass(hasError: boolean) {
  return `h-14 rounded-2xl border-slate-600 bg-[#34445c] text-slate-100 placeholder:text-slate-400 ${hasError ? "border-rose-500 ring-1 ring-rose-500" : ""}`;
}

function buildLiveSummary(stats: Stats) {
  return {
    firstServe: firstServeRate(stats),
    chanceBall: successRate(stats.chanceWins, stats.chances),
    totalMiss: totalMisses(stats),
  };
}

function buildSummary(matches: Match[]) {
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

function addStats(left: Stats, right: Stats): Stats {
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

function firstServeRate(stats: Stats) {
  return successRate(stats.firstIn, stats.firstIn + stats.firstOut);
}

function sideRate(success: number, fail: number) {
  return successRate(success, success + fail);
}

function successRate(success: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((success / total) * 100);
}

function totalMisses(stats: Stats) {
  return stats.doubleFaults + stats.net + stats.baseOut + stats.sideOut;
}

function totalGames(match: Match) {
  return match.playerGames + match.opponentGames;
}

function perTen(value: number, games: number) {
  if (!games) return "0.0";
  return ((value / games) * 10).toFixed(1);
}

function round(value: number, decimals: number) {
  return Number(value.toFixed(decimals));
}

function parseScore(score: string) {
  const sets = score
    .split(",")
    .map((set) => set.trim().match(/(\d+)\s*[-–]\s*(\d+)/))
    .filter(Boolean) as RegExpMatchArray[];

  const player = sets.reduce((sum, set) => sum + Number(set[1]), 0);
  const opponent = sets.reduce((sum, set) => sum + Number(set[2]), 0);
  return { player, opponent, total: player + opponent };
}

function readStoredState(): StoredState | null {
  if (typeof window === "undefined") return null;

  try {
    const rawState = window.localStorage.getItem(storageKey);
    if (!rawState) return null;

    const parsedState = JSON.parse(rawState) as Partial<StoredState>;
    if (!Array.isArray(parsedState.matches)) return null;

    return {
      matches: parsedState.matches,
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

function writeStoredState(state: StoredState) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(storageKey, JSON.stringify(state));
  } catch {
    // If storage is unavailable, keep the in-memory session usable.
  }
}

function getTodayString() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}
