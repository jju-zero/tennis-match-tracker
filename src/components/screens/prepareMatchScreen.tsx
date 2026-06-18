import { Play, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  AppShell,
  Field,
  FixedAction,
  ScreenHeader,
  SectionTitle,
  inputClass,
} from "@/components/tennis/appLayout";
import { drawSizeLabel, roundLabel } from "@/lib/tennis";
import type { MatchRecord, PrepareMatchForm } from "@/types/tennis";

export function PrepareMatchScreen({
  match,
  form,
  errors,
  onBack,
  onChange,
  onStart,
  onSaveDraft,
}: {
  match: MatchRecord;
  form: PrepareMatchForm;
  errors: Record<string, string>;
  onBack: () => void;
  onChange: (next: PrepareMatchForm) => void;
  onStart: () => void;
  onSaveDraft: () => void;
}) {
  return (
    <AppShell bottomPadding>
      <ScreenHeader title="記録開始" subtitle={`${roundLabel(match.round)} · ${match.tournament}`} onBack={onBack} />

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
                {drawSizeLabel(match.drawSize)} · {roundLabel(match.round)}
              </dd>
            </div>
          </dl>
        </section>

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
