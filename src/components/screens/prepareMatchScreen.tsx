import { Play, Save } from "lucide-react";

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
  drawSizeLabel,
  drawSizeOptions,
  mainRoundOptions,
  roundLabel,
} from "@/lib/tennis";
import type { MatchRecord, PrepareMatchForm } from "@/types/tennis";

export function PrepareMatchScreen({
  match,
  form,
  errors,
  lookupMessage,
  lookupLoading,
  onBack,
  onChange,
  onLookupOpponent,
  onStart,
  onSaveDraft,
}: {
  match: MatchRecord;
  form: PrepareMatchForm;
  errors: Record<string, string>;
  lookupMessage?: string | null;
  lookupLoading?: boolean;
  onBack: () => void;
  onChange: (next: PrepareMatchForm) => void;
  onLookupOpponent: () => void;
  onStart: () => void;
  onSaveDraft: () => void;
}) {
  return (
    <AppShell bottomPadding>
      <ScreenHeader title="記録開始" subtitle={`${roundLabel(form.round)} · ${match.tournament}`} onBack={onBack} />

      <div className="space-y-5">
        <section className="space-y-3 rounded-2xl border border-slate-700 bg-[#202b3d] p-4">
          <SectionTitle>試合情報</SectionTitle>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-slate-500">日付</dt>
              <dd className="mt-1 font-semibold text-slate-100">{match.date}</dd>
            </div>
            <div>
              <dt className="text-slate-500">グレード</dt>
              <dd className="mt-1 font-semibold text-slate-100">{match.grade}</dd>
            </div>
            <div>
              <dt className="text-slate-500">種目</dt>
              <dd className="mt-1 font-semibold text-slate-100">{match.event}</dd>
            </div>
            <div>
              <dt className="text-slate-500">ドロー</dt>
              <dd className="mt-1 font-semibold text-slate-100">
                {drawSizeLabel(form.drawSize)} · {roundLabel(form.round)}
              </dd>
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
        <div className="space-y-3">
          <Button
            className="h-16 w-full gap-2 rounded-2xl bg-[#49df78] text-base font-semibold text-slate-950 hover:bg-[#5bdd75]"
            onClick={onStart}
          >
            <Play className="size-5" />
            記録開始
          </Button>
          <Button
            variant="outline"
            className="h-14 w-full gap-2 rounded-2xl border-slate-600 bg-[#202b3d] text-base font-semibold text-slate-100 hover:bg-[#34445c]"
            onClick={onSaveDraft}
          >
            <Save className="size-5" />
            保存して戻る
          </Button>
        </div>
      </FixedAction>
    </AppShell>
  );
}
