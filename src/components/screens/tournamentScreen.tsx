import { Pencil, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TournamentFormFields } from "@/components/screens/newTournamentScreen";
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
  getTournamentStatus,
  matchStatusText,
  roundLabel,
  sortMatchesByRound,
  tournamentProgressText,
} from "@/lib/tennis";
import type { MatchRecord, Tournament, TournamentForm } from "@/types/tennis";

export function TournamentScreen({
  tournament,
  editForm,
  editErrors,
  isEditing,
  onBack,
  onEditChange,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
  onOpenMatch,
  onAddNextMatch,
}: {
  tournament: Tournament;
  editForm: TournamentForm;
  editErrors: Record<string, string>;
  isEditing: boolean;
  onBack: () => void;
  onEditChange: (next: TournamentForm) => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onDelete: () => void;
  onOpenMatch: (match: MatchRecord) => void;
  onAddNextMatch: () => void;
}) {
  const sortedMatches = sortMatchesByRound(tournament.matches, tournament.drawSize);
  const displayMatches = sortedMatches.slice().reverse();
  const latestMatch = sortedMatches[sortedMatches.length - 1] ?? null;
  const status = getTournamentStatus(tournament);
  const tournamentFinished =
    status === "eliminated" || status === "champion" || status === "done";
  const canAddNextMatch =
    !tournamentFinished &&
    (!latestMatch ||
      (latestMatch.status === "done" &&
        (latestMatch.drawSize === "qualifying" ||
          (latestMatch.result === "win" && latestMatch.round !== "F"))));
  const hasOpenMatch = tournament.matches.some((match) => match.status !== "done");

  return (
    <AppShell bottomPadding={(canAddNextMatch && !hasOpenMatch) || isEditing}>
      <ScreenHeader
        title={tournament.name}
        subtitle={`${tournament.date} · ${tournament.grade} · ${tournament.event}`}
        onBack={isEditing ? onCancelEdit : onBack}
        action={
          isEditing ? (
            <Button
              variant="outline"
              size="icon"
              className="rounded-2xl border-slate-600 bg-[#202b3d] text-slate-100 hover:bg-[#34445c]"
              onClick={onCancelEdit}
              aria-label="編集を閉じる"
            >
              <X className="size-4" />
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                className="rounded-2xl border-slate-600 bg-[#202b3d] text-slate-100 hover:bg-[#34445c]"
                onClick={onStartEdit}
                aria-label="大会情報を編集"
              >
                <Pencil className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="rounded-2xl border-rose-500/60 bg-[#202b3d] text-rose-300 hover:bg-rose-950/30"
                onClick={onDelete}
                aria-label="大会を削除"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          )
        }
      />

      {isEditing ? (
        <>
          <Card className="rounded-2xl border-slate-700 bg-[#202b3d] text-slate-100">
            <CardContent>
              <TournamentFormFields form={editForm} errors={editErrors} onChange={onEditChange} />
            </CardContent>
          </Card>

          <FixedAction>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-16 rounded-2xl border-slate-600 bg-[#202b3d] text-base font-semibold text-slate-100 hover:bg-[#34445c]"
                onClick={onCancelEdit}
              >
                キャンセル
              </Button>
              <Button
                className="h-16 rounded-2xl bg-[#49df78] text-base font-semibold text-slate-950 hover:bg-[#5bdd75]"
                onClick={onSaveEdit}
              >
                保存する
              </Button>
            </div>
          </FixedAction>
        </>
      ) : (
        <>

      <Card className="rounded-2xl border-slate-700 bg-[#202b3d] text-slate-100">
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>{tournamentProgressText(tournament)}</CardTitle>
              <CardDescription className="mt-2 text-slate-400">
                {tournament.date} · {tournament.grade} · {tournament.event}
              </CardDescription>
            </div>
            <TournamentStatusBadge status={status} />
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-2">
          <GameCount label="試合数" value={`${tournament.matches.length}`} tone="text-slate-100" />
          <GameCount label="勝利" value={`${tournament.matches.filter((match) => match.result === "win").length}`} tone="text-[#6ee787]" />
          <GameCount label="敗戦" value={`${tournament.matches.filter((match) => match.result === "loss").length}`} tone="text-[#ff7373]" />
        </CardContent>
      </Card>

      {tournament.drawUrl && (
        <a
          className="block rounded-2xl border border-[#6ee787]/40 bg-[#142a26] p-4 text-sm font-semibold text-[#6ee787] transition hover:bg-[#18352f]"
          href={tournament.drawUrl}
          target="_blank"
          rel="noreferrer"
        >
          ドローを見る
        </a>
      )}

      {tournament.memo && (
        <section className="space-y-2">
          <SectionTitle>大会メモ</SectionTitle>
          <div className="rounded-2xl border border-slate-700 bg-[#202b3d] p-4 text-sm leading-6 text-slate-200">
            {tournament.memo}
          </div>
        </section>
      )}

      <section className="space-y-3">
        <SectionTitle>試合</SectionTitle>
        {sortedMatches.length === 0 ? (
          <EmptyState
            title="まだ試合がありません"
            description="最初の試合を追加して、相手が決まったら記録を始めてください。"
          />
        ) : (
          <div className="space-y-3">
            {displayMatches.map((match) => (
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
        </>
      )}
    </AppShell>
  );
}
