import { Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  AppShell,
  ChoiceButton,
  Field,
  FixedAction,
  GameCount,
  ScreenHeader,
  inputClass,
} from "@/components/tennis/appLayout";
import { buildLiveSummary, perTen } from "@/lib/tennis";
import type { MatchRecord, Result, Stats } from "@/types/tennis";

export function FinishScreen({
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
  match: MatchRecord;
  stats: Stats;
  result: Result;
  score: string;
  note: string;
  opponentMemo: string;
  parsedScore: { player: number; opponent: number; total: number };
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
        <Field label="結果">
          <div className="grid grid-cols-2 gap-3">
            <ChoiceButton selected={result === "win"} onClick={() => onResult("win")}>
              勝利
            </ChoiceButton>
            <ChoiceButton selected={result === "loss"} onClick={() => onResult("loss")}>
              敗北
            </ChoiceButton>
          </div>
        </Field>
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
              ["リターンIN", stats.returnIn, "text-emerald-600"],
              ["リターンOUT", stats.returnOut, "text-rose-600"],
              ["リターン成功率", `${summary.returnRate}%`, "text-emerald-600"],
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
        <Textarea
          value={note}
          onChange={(event) => onNote(event.target.value)}
          className="min-h-32 rounded-2xl border-slate-600 bg-[#34445c] text-slate-100"
        />
      </Field>

      <Field label="相手メモ更新">
        <Textarea
          value={opponentMemo}
          onChange={(event) => onOpponentMemo(event.target.value)}
          className="min-h-32 rounded-2xl border-slate-600 bg-[#34445c] text-slate-100"
        />
      </Field>

      <FixedAction>
        <Button
          className="h-16 w-full gap-2 rounded-2xl bg-[#49df78] text-base font-semibold text-slate-950 hover:bg-[#5bdd75]"
          onClick={onSave}
        >
          <Save className="size-5" />
          保存する
        </Button>
      </FixedAction>
    </AppShell>
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
