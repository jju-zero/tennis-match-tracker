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
  firstServeRate,
  mainRoundOptions,
  returnRate,
  roundLabel,
  sideRate,
} from "@/lib/tennis";
import type { EditMatchForm, Stats } from "@/types/tennis";

export function EditMatchScreen({
  form,
  errors,
  lookupMessage,
  lookupLoading,
  onBack,
  onChange,
  onLookupOpponent,
  onSave,
}: {
  form: EditMatchForm;
  errors: Record<string, string>;
  lookupMessage?: string | null;
  lookupLoading?: boolean;
  onBack: () => void;
  onChange: (next: EditMatchForm) => void;
  onLookupOpponent: () => void;
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
                    round: drawSize === "qualifying" ? "QUALIFYING" : "R128",
                  })
                }
              >
                {drawSizeLabel(drawSize)}
              </ChoiceButton>
            ))}
          </div>
        </Field>

        {form.drawSize === "main" && (
          <Field label="ラウンド" hint="実際の開始ラウンドを選択">
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

        <Field label="登録番号" hint="任意">
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <Input
              value={form.opponentRegistrationNumber}
              placeholder="例：3217352"
              inputMode="numeric"
              maxLength={7}
              onChange={(event) =>
                onChange({ ...form, opponentRegistrationNumber: event.target.value })
              }
              className={inputClass(false)}
            />
            <Button
              type="button"
              className="h-14 rounded-2xl bg-[#49df78] px-5 font-semibold text-slate-950 hover:bg-[#5bdd75]"
              disabled={lookupLoading || !form.opponentRegistrationNumber.trim()}
              onClick={onLookupOpponent}
            >
              {lookupLoading ? "検索中" : "検索"}
            </Button>
          </div>
          {lookupMessage && <p className="text-sm text-slate-400">{lookupMessage}</p>}
        </Field>

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
          <ServeStatsEditGroup
            stats={form.stats}
            onChange={(stats) => onChange({ ...form, stats })}
          />
          <ReturnStatsEditGroup
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

function ServeStatsEditGroup({
  stats,
  onChange,
}: {
  stats: Stats;
  onChange: (stats: Stats) => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-slate-300">サーブ</p>
      <div className="grid grid-cols-3 gap-2">
        <ServeRateCard label="1st" value={`${firstServeRate(stats)}%`} />
        <ServeRateCard label="デュース" value={`${sideRate(stats.deuceIn, stats.deuceOut)}%`} />
        <ServeRateCard label="アド" value={`${sideRate(stats.adIn, stats.adOut)}%`} />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <StatNumberInput label="1st IN" statKey="firstIn" stats={stats} onChange={onChange} />
        <StatNumberInput label="1st OUT" statKey="firstOut" stats={stats} onChange={onChange} />
        <StatNumberInput label="DF" statKey="doubleFaults" stats={stats} onChange={onChange} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <ServeSideEditCard
          title="デュース"
          inKey="deuceIn"
          outKey="deuceOut"
          stats={stats}
          onChange={onChange}
        />
        <ServeSideEditCard
          title="アド"
          inKey="adIn"
          outKey="adOut"
          stats={stats}
          onChange={onChange}
        />
      </div>
    </div>
  );
}

function ReturnStatsEditGroup({
  stats,
  onChange,
}: {
  stats: Stats;
  onChange: (stats: Stats) => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-slate-300">リターン</p>
      <div className="grid grid-cols-3 gap-2">
        <ServeRateCard label="成功率" value={`${returnRate(stats)}%`} />
        <ServeRateCard label="IN" value={`${stats.returnIn}`} />
        <ServeRateCard label="OUT" value={`${stats.returnOut}`} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <StatNumberInput label="IN" statKey="returnIn" stats={stats} onChange={onChange} />
        <StatNumberInput label="OUT" statKey="returnOut" stats={stats} onChange={onChange} />
      </div>
    </div>
  );
}

function ServeRateCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-700 bg-[#182337] p-3">
      <p className="text-xs font-medium text-slate-400">{label}</p>
      <p className="mt-1 text-xl font-semibold text-[#6ee787]">{value}</p>
    </div>
  );
}

function ServeSideEditCard({
  title,
  inKey,
  outKey,
  stats,
  onChange,
}: {
  title: string;
  inKey: keyof Stats;
  outKey: keyof Stats;
  stats: Stats;
  onChange: (stats: Stats) => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-700 bg-[#182337] p-3">
      <p className="mb-3 text-sm font-semibold text-slate-300">{title}</p>
      <div className="grid grid-cols-2 gap-3">
        <StatNumberInput label="IN" statKey={inKey} stats={stats} onChange={onChange} />
        <StatNumberInput label="OUT" statKey={outKey} stats={stats} onChange={onChange} />
      </div>
    </div>
  );
}

function StatNumberInput({
  label,
  statKey,
  stats,
  onChange,
}: {
  label: string;
  statKey: keyof Stats;
  stats: Stats;
  onChange: (stats: Stats) => void;
}) {
  return (
    <label className="space-y-1">
      <span className="block text-xs font-medium text-slate-400">{label}</span>
      <Input
        type="number"
        min={0}
        inputMode="numeric"
        value={stats[statKey]}
        onChange={(event) =>
          onChange({
            ...stats,
            [statKey]: normalizeStatValue(event.target.value),
          })
        }
        className="h-12 rounded-xl border-slate-600 bg-[#34445c] text-base font-semibold text-slate-100"
      />
    </label>
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
          <StatNumberInput key={key} label={label} statKey={key} stats={stats} onChange={onChange} />
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
