import { Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AppShell,
  FixedAction,
  GameCount,
  ResultBadge,
  ScreenHeader,
  SectionTitle,
} from "@/components/tennis/appLayout";
import {
  firstServeRate,
  matchStatusText,
  perTen,
  roundLabel,
  sideRate,
  successRate,
  totalGames,
  totalMisses,
} from "@/lib/tennis";
import type { MatchRecord } from "@/types/tennis";

export function MatchDetailScreen({
  match,
  onBack,
  onEdit,
  onResume,
}: {
  match: MatchRecord;
  onBack: () => void;
  onEdit: () => void;
  onResume: () => void;
}) {
  const games = totalGames(match);

  return (
    <AppShell bottomPadding={match.status !== "done"}>
      <ScreenHeader
        title="試合詳細"
        subtitle={`${roundLabel(match.round)} · vs ${match.opponent || "相手未定"}`}
        onBack={onBack}
        action={
          <Button
            variant="outline"
            className="gap-2 rounded-2xl border-slate-600 bg-[#202b3d] text-slate-100 hover:bg-[#34445c]"
            onClick={onEdit}
          >
            <Pencil className="size-4" />
            編集
          </Button>
        }
      />

      <Card className="rounded-2xl border-slate-700 bg-[#202b3d] text-slate-100">
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>{match.score || matchStatusText(match)}</CardTitle>
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

      {match.status !== "done" && (
        <FixedAction>
          <Button
            className="h-16 w-full rounded-2xl bg-[#49df78] text-base font-semibold text-slate-950 hover:bg-[#5bdd75]"
            onClick={onResume}
          >
            {match.status === "draft" ? "記録を開始する" : "記録を再開する"}
          </Button>
        </FixedAction>
      )}
    </AppShell>
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
      <div className="min-h-24 rounded-2xl border border-slate-700 bg-[#202b3d] p-4 text-sm leading-6 text-slate-200">
        {text}
      </div>
    </section>
  );
}
