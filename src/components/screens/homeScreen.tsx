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
  buildSummary,
  getTournamentStatus,
} from "@/lib/tennis";
import { getApprovedTournamentPoints } from "@/lib/kanto-points";
import type { Tournament } from "@/types/tennis";

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
          新しい大会
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
  const status = getTournamentStatus(tournament);
  const completedMatches = tournament.matches.filter((match) => match.status === "done");
  const tournamentSummary = buildSummary(completedMatches);
  const wins = completedMatches.filter((match) => match.result === "win").length;
  const losses = completedMatches.filter((match) => match.result === "loss").length;
  const pointResult = getApprovedTournamentPoints(tournament);

  return (
    <button
      className="w-full rounded-2xl border border-slate-700 bg-[#202b3d] p-4 text-left shadow-sm transition hover:border-[#6ee787]/70 hover:bg-[#26344a]"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{tournament.name}</p>
          <p className="mt-1 text-sm text-slate-400">
            {tournament.date} · {tournament.grade} · {tournament.event}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <TournamentMetric label="勝敗" value={`${wins}-${losses}`} />
            <TournamentMetric label="1st" value={`${tournamentSummary.firstServe}%`} />
            <TournamentMetric label="チャンス" value={`${tournamentSummary.chanceBall}%`} />
            <TournamentMetric label="DF" value={`${tournamentSummary.doubleFaults}本`} />
          </div>
          
        </div>
        <div className="flex shrink-0 flex-col items-end gap-3">
          <TournamentStatusBadge status={status} />
          {pointResult && (
            <p className="text-lg font-semibold text-[#6ee787]">{pointResult.points}pt</p>
          )}
          <div className="text-right">
            <p className="text-lg font-semibold text-[#6ee787]">{tournament.matches.length}</p>
            <p className="text-xs text-slate-400">試合</p>
          </div>
        </div>
      </div>
    </button>
  );
}

function TournamentMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-700 bg-[#182337] p-2">
      <p className="text-[11px] font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-100">{value}</p>
    </div>
  );
}
