import { Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  AppShell,
  ChoiceButton,
  Field,
  FixedAction,
  ScreenHeader,
  SectionTitle,
  inputClass,
} from "@/components/tennis/appLayout";
import {
  drawSizeOptions,
  drawSizeLabel,
  mainRoundOptions,
  roundLabel,
} from "@/lib/tennis";
import type { EditMatchForm, Stats } from "@/types/tennis";

export function EditMatchScreen({
  form,
  errors,
  onBack,
  onChange,
  onSave,
}: {
  form: EditMatchForm;
  errors: Record<string, string>;
  onBack: () => void;
  onChange: (next: EditMatchForm) => void;
  onSave: () => void;
}) {
  return (
    <AppShell bottomPadding>
      <ScreenHeader title="試合を編集" subtitle={`vs ${form.opponent || "相手未入力"}`} onBack={onBack} />

      <div className="space-y-5">
        <section className="space-y-3 rounded-2xl border border-slate-700 bg-[#202b3d] p-4">
          <SectionTitle>大会情報</SectionTitle>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div className="col-span-2">
              <dt className="text-slate-500">大会名</dt>
              <dd className="mt-1 font-semibold text-slate-100">{form.tournament}</dd>
            </div>
            <div>
              <dt className="text-slate-500">日付</dt>
              <dd className="mt-1 font-semibold text-slate-100">{form.date}</dd>
            </div>
            <div>
              <dt className="text-slate-500">グレード</dt>
              <dd className="mt-1 font-semibold text-slate-100">{form.grade}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-slate-500">種目</dt>
              <dd className="mt-1 font-semibold text-slate-100">{form.event}</dd>
            </div>
          </dl>
        </section>

        <Field label="ドロー" required>
          <div className="grid grid-cols-2 gap-2">
            {drawSizeOptions.map((drawSize) => (
              <ChoiceButton
                key={drawSize}
                selected={form.drawSize === drawSize}
                onClick={() =>
                  onChange({
                    ...form,
                    drawSize,
                    round: drawSize === "qualifying" ? "QUALIFYING" : "MAIN",
                  })
                }
              >
                {drawSizeLabel(drawSize)}
              </ChoiceButton>
            ))}
          </div>
        </Field>

        {form.drawSize === "main" && (
          <Field label="ラウンド" hint="本戦128などは本戦を選択">
            <div className="grid grid-cols-3 gap-2">
              {mainRoundOptions.map((round) => (
                <ChoiceButton
                  key={round}
                  selected={form.round === round}
                  onClick={() => onChange({ ...form, round })}
                >
                  {roundLabel(round)}
                </ChoiceButton>
              ))}
            </div>
          </Field>
        )}

        <Field label="相手の名前" required error={errors.opponent}>
          <Input
            value={form.opponent}
            placeholder="名前を入力"
            onChange={(event) => onChange({ ...form, opponent: event.target.value })}
            className={inputClass(Boolean(errors.opponent))}
          />
        </Field>

        {form.status === "done" && (
          <>
            <section className="space-y-3">
              <SectionTitle>結果</SectionTitle>
              <div className="grid grid-cols-2 gap-3">
                <ChoiceButton selected={form.result === "win"} onClick={() => onChange({ ...form, result: "win" })}>
                  勝利
                </ChoiceButton>
                <ChoiceButton selected={form.result === "loss"} onClick={() => onChange({ ...form, result: "loss" })}>
                  敗北
                </ChoiceButton>
              </div>
            </section>

            <Field label="スコア">
              <Input
                value={form.score}
                placeholder="例：6-3, 6-4"
                onChange={(event) => onChange({ ...form, score: event.target.value })}
                className={inputClass(false)}
              />
            </Field>

            <Field label="今日のメモ">
              <Textarea
                value={form.note}
                onChange={(event) => onChange({ ...form, note: event.target.value })}
                className="min-h-32 rounded-2xl border-slate-600 bg-[#34445c] text-slate-100"
              />
            </Field>
          </>
        )}

        <section className="space-y-4 rounded-2xl border border-slate-700 bg-[#202b3d] p-4">
          <SectionTitle>記録を編集</SectionTitle>
          <StatsEditGroup
            title="サーブ"
            items={[
              ["firstIn", "1st成功"],
              ["firstOut", "1st失敗"],
              ["deuceIn", "デュース成功"],
              ["deuceOut", "デュース失敗"],
              ["adIn", "アド成功"],
              ["adOut", "アド失敗"],
              ["doubleFaults", "DF"],
            ]}
            stats={form.stats}
            onChange={(stats) => onChange({ ...form, stats })}
          />
          <StatsEditGroup
            title="チャンスボール"
            items={[
              ["chances", "発生"],
              ["chanceWins", "成功"],
            ]}
            stats={form.stats}
            onChange={(stats) => onChange({ ...form, stats })}
          />
          <StatsEditGroup
            title="ボレー"
            items={[
              ["volleyTries", "試み"],
              ["volleyWins", "成功"],
            ]}
            stats={form.stats}
            onChange={(stats) => onChange({ ...form, stats })}
          />
          <StatsEditGroup
            title="ミス"
            items={[
              ["net", "ネット"],
              ["baseOut", "ベースアウト"],
              ["sideOut", "サイドアウト"],
            ]}
            stats={form.stats}
            onChange={(stats) => onChange({ ...form, stats })}
          />
        </section>

        <Field label="相手メモ">
          <Textarea
            value={form.opponentMemo}
            placeholder="強み、弱み、注意点など"
            onChange={(event) => onChange({ ...form, opponentMemo: event.target.value })}
            className="min-h-36 rounded-2xl border-slate-600 bg-[#34445c] text-slate-100 placeholder:text-slate-400"
          />
        </Field>
      </div>

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

function StatsEditGroup({
  title,
  items,
  stats,
  onChange,
}: {
  title: string;
  items: Array<[keyof Stats, string]>;
  stats: Stats;
  onChange: (stats: Stats) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-slate-300">{title}</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {items.map(([key, label]) => (
          <label key={key} className="space-y-1">
            <span className="block text-xs font-medium text-slate-400">{label}</span>
            <Input
              type="number"
              min={0}
              inputMode="numeric"
              value={stats[key]}
              onChange={(event) =>
                onChange({
                  ...stats,
                  [key]: normalizeStatValue(event.target.value),
                })
              }
              className="h-12 rounded-xl border-slate-600 bg-[#34445c] text-base font-semibold text-slate-100"
            />
          </label>
        ))}
      </div>
    </div>
  );
}

function normalizeStatValue(value: string) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue) || numberValue < 0) return 0;
  return Math.floor(numberValue);
}
