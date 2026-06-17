import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AppShell,
  EmptyState,
  FixedAction,
  GameCount,
  ResultBadge,
  ScreenHeader,
  SectionTitle,
  TournamentStatusBadge,
} from "@/components/tennis/appLayout";
import {
  drawSizeLabel,
  matchStatusText,
  roundLabel,
  sortMatchesByRound,
  tournamentProgressText,
} from "@/lib/tennis";
import type { MatchRecord, Tournament } from "@/types/tennis";

export function TournamentScreen({
  tournament,
  onBack,
  onOpenMatch,
  onAddNextMatch,
}: {
  tournament: Tournament;
  onBack: () => void;
  onOpenMatch: (match: MatchRecord) => void;
  onAddNextMatch: () => void;
}) {
  const sortedMatches = sortMatchesByRound(tournament.matches, tournament.drawSize);
  const latestMatch = sortedMatches[sortedMatches.length - 1] ?? null;
  const canAddNextMatch =
    !latestMatch || (latestMatch.status === "done" && latestMatch.result === "win" && latestMatch.round !== "F");
  const hasOpenMatch = tournament.matches.some((match) => match.status !== "done");

  return (
    <AppShell bottomPadding={canAddNextMatch && !hasOpenMatch}>
      <ScreenHeader title="大会詳細" subtitle={tournament.name} onBack={onBack} />

      <Card className="rounded-2xl border-slate-700 bg-[#202b3d] text-slate-100">
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>{tournamentProgressText(tournament)}</CardTitle>
              <CardDescription className="mt-2 text-slate-400">
                {tournament.date} · {tournament.grade} · {tournament.event} · {drawSizeLabel(tournament.drawSize)}
              </CardDescription>
            </div>
            <TournamentStatusBadge status={tournament.status} />
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-2">
          <GameCount label="試合数" value={`${tournament.matches.length}`} tone="text-slate-100" />
          <GameCount label="勝利" value={`${tournament.matches.filter((match) => match.result === "win").length}`} tone="text-[#6ee787]" />
          <GameCount label="敗戦" value={`${tournament.matches.filter((match) => match.result === "loss").length}`} tone="text-[#ff7373]" />
        </CardContent>
      </Card>

      <section className="space-y-3">
        <SectionTitle>試合</SectionTitle>
        {sortedMatches.length === 0 ? (
          <EmptyState
            title="まだ試合がありません"
            description="最初の試合を追加して、相手が決まったら記録を始めてください。"
          />
        ) : (
          <div className="space-y-3">
            {sortedMatches.map((match) => (
              <button
                key={match.id}
                className="w-full rounded-2xl border border-slate-700 bg-[#202b3d] p-4 text-left transition hover:border-[#6ee787]/70 hover:bg-[#26344a]"
                onClick={() => onOpenMatch(match)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-400">{roundLabel(match.round)}</p>
                    <p className="mt-2 text-lg font-semibold">vs {match.opponent || "相手未定"}</p>
                    <p className="mt-1 text-sm text-slate-400">{matchStatusText(match)}</p>
                  </div>
                  <ResultBadge result={match.result} status={match.status} />
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {canAddNextMatch && !hasOpenMatch && (
        <FixedAction>
          <Button
            className="h-16 w-full rounded-2xl bg-[#49df78] text-base font-semibold text-slate-950 hover:bg-[#5bdd75]"
            onClick={onAddNextMatch}
          >
            {latestMatch ? "次の試合を追加" : "最初の試合を追加"}
          </Button>
        </FixedAction>
      )}
    </AppShell>
  );
}
