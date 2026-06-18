import { CalendarDays } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  AppShell,
  ChoiceButton,
  Field,
  FixedAction,
  ScreenHeader,
  inputClass,
} from "@/components/tennis/appLayout";
import {
  drawSizeLabel,
  drawSizeOptions,
  eventOptions,
  gradeOptions,
  mainRoundOptions,
  roundLabel,
} from "@/lib/tennis";
import type { TournamentForm } from "@/types/tennis";

export function NewTournamentScreen({
  form,
  errors,
  onBack,
  onChange,
  onStart,
  onSaveDraft,
}: {
  form: TournamentForm;
  errors: Record<string, string>;
  onBack: () => void;
  onChange: (next: TournamentForm) => void;
  onStart: () => void;
  onSaveDraft: () => void;
}) {
  return (
    <AppShell bottomPadding>
      <ScreenHeader title="新しい大会" onBack={onBack} />

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

        <Field label="初戦の相手" hint="あとで入力可" error={errors.opponent}>
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
            className="h-16 w-full rounded-2xl bg-[#49df78] text-base font-semibold text-slate-950 hover:bg-[#5bdd75]"
            onClick={onStart}
          >
            初戦を開始
          </Button>
          <Button
            variant="outline"
            className="h-14 w-full rounded-2xl border-slate-600 bg-[#202b3d] text-base font-semibold text-slate-100 hover:bg-[#34445c]"
            onClick={onSaveDraft}
          >
            大会だけ保存
          </Button>
        </div>
      </FixedAction>
    </AppShell>
  );
}
