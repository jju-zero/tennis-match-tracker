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
  eventOptions,
  gradeOptions,
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

      <TournamentFormFields form={form} errors={errors} onChange={onChange} />

      <FixedAction>
        <div className="space-y-3">
          <Button
            className="h-16 w-full rounded-2xl bg-[#16a34a] text-base font-semibold text-white hover:bg-[#15803d]"
            onClick={onStart}
          >
            大会を作成して試合登録
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

export function TournamentFormFields({
  form,
  errors,
  onChange,
}: {
  form: TournamentForm;
  errors: Record<string, string>;
  onChange: (next: TournamentForm) => void;
}) {
  return (
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

      <Field label="ドローURL" hint="任意">
        <Input
          value={form.drawUrl}
          placeholder="https://..."
          inputMode="url"
          onChange={(event) => onChange({ ...form, drawUrl: event.target.value })}
          className={inputClass(false)}
        />
      </Field>

      <Field label="大会メモ" hint="任意">
        <Textarea
          value={form.memo}
          placeholder="集合時間、会場、注意事項など"
          onChange={(event) => onChange({ ...form, memo: event.target.value })}
          className="min-h-32 rounded-2xl border-slate-600 bg-[#34445c] text-slate-100 placeholder:text-slate-400"
        />
      </Field>
    </div>
  );
}
