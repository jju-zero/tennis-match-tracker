import { ArrowRight, CirclePlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  AppShell,
  EmptyState,
  FixedAction,
  SectionTitle,
  SummaryCard,
  TournamentStatusBadge,
} from "@/components/tennis/appLayout";
import {
  firstServeRate,
  drawSizeLabel,
  matchStatusText,
  roundLabel,
  sortMatchesByRound,
  tournamentProgressText,
} from "@/lib/tennis";
import type { MatchRecord, Tournament } from "@/types/tennis";

export function HomeScreen({
  tournaments,
  summary,
  onNew,
  onReport,
  onOpenTournament,
}: {
  tournaments: Tournament[];
  summary: {
    firstServe: number;
    chanceBall: number;
    doubleFaults: number;
  };
  onNew: () => void;
  onReport: () => void;
  onOpenTournament: (tournament: Tournament) => void;
}) {
  return (
    <AppShell bottomPadding>
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-400">ジュニアテニス</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-normal">大会記録</h1>
        </div>
        <Button
          variant="ghost"
          className="gap-2 text-[#6ee787] hover:bg-slate-800/70 hover:text-[#6ee787]"
          onClick={onReport}
        >
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
        <SectionTitle>大会一覧</SectionTitle>
        {tournaments.length === 0 ? (
          <EmptyState
            title="まだ大会記録がありません"
            description="下のボタンから最初の大会を作成して、試合を記録してください。"
          />
        ) : (
          <div className="space-y-3">
            {tournaments.map((tournament) => (
              <TournamentCard
                key={tournament.id}
                tournament={tournament}
                onClick={() => onOpenTournament(tournament)}
              />
            ))}
          </div>
        )}
      </section>

      <FixedAction>
        <Button
          className="h-16 w-full gap-2 rounded-2xl bg-[#6ee787] text-base font-semibold text-slate-950 hover:bg-[#5bdd75]"
          onClick={onNew}
        >
          <CirclePlus className="size-5" />
          新しい大会を記録
        </Button>
      </FixedAction>
    </AppShell>
  );
}

function TournamentCard({
  tournament,
  onClick,
}: {
  tournament: Tournament;
  onClick: () => void;
}) {
  const latestMatch = latestTournamentMatch(tournament);

  return (
    <button
      className="w-full rounded-2xl border border-slate-700 bg-[#202b3d] p-4 text-left shadow-sm transition hover:border-[#6ee787]/70 hover:bg-[#26344a]"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold">{tournament.name}</p>
            <TournamentStatusBadge status={tournament.status} />
          </div>
          <p className="mt-1 text-sm text-slate-400">
            {tournament.date} · {tournament.grade} · {tournament.event} · {drawSizeLabel(tournament.drawSize)}
          </p>
          <p className="mt-3 text-lg font-semibold">{tournamentProgressText(tournament)}</p>
          <p className="mt-1 text-sm text-slate-400">
            {latestMatch
              ? `${roundLabel(latestMatch.round)} · ${latestMatch.opponent || "相手未定"} · ${matchStatusText(latestMatch)}`
              : "試合未作成"}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-3">
          <TournamentStatusBadge status={tournament.status} />
          <div className="text-right">
            <p className="text-lg font-semibold text-[#6ee787]">
              {latestMatch ? firstServeRate(latestMatch.stats) : 0}%
            </p>
            <p className="text-xs text-slate-400">1stサーブ率</p>
          </div>
        </div>
      </div>
    </button>
  );
}

function latestTournamentMatch(tournament: Tournament): MatchRecord | null {
  const sorted = sortMatchesByRound(tournament.matches, tournament.drawSize);
  return sorted[sorted.length - 1] ?? null;
}
