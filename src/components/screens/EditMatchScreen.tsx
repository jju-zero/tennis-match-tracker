import { CalendarDays, Save } from "lucide-react";

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
  eventOptions,
  gradeOptions,
  roundLabel,
  roundOptionsForDraw,
} from "@/lib/tennis";
import type { EditMatchForm } from "@/types/tennis";

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

        <Field label="ドロー" required>
          <div className="grid grid-cols-3 gap-2">
            {drawSizeOptions.map((drawSize) => (
              <ChoiceButton
                key={drawSize}
                selected={form.drawSize === drawSize}
                onClick={() => onChange({ ...form, drawSize })}
              >
                {drawSizeLabel(drawSize)}
              </ChoiceButton>
            ))}
          </div>
        </Field>

        <Field label="ラウンド">
          <div className="grid grid-cols-3 gap-2">
            {roundOptionsForDraw(form.drawSize).map((round) => (
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
