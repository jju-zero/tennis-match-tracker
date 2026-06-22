import { ArrowDown, ArrowLeft, ArrowUp, Minus } from "lucide-react";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import type { MatchRecord, Tournament, Trend } from "@/types/tennis";

export function AppShell({
  children,
  wide = false,
  bottomPadding = false,
}: {
  children: ReactNode;
  wide?: boolean;
  bottomPadding?: boolean;
}) {
  return (
    <div
      className={`mx-auto flex ${wide ? "max-w-5xl" : "max-w-[430px] sm:max-w-3xl"} flex-col gap-7 px-4 py-8 sm:px-6 ${bottomPadding ? "pb-40" : "pb-10"}`}
    >
      {children}
    </div>
  );
}

export function ScreenHeader({
  title,
  subtitle,
  onBack,
  action,
}: {
  title: string;
  subtitle?: string;
  onBack: () => void;
  action?: ReactNode;
}) {
  return (
    <header className="flex items-start justify-between gap-3">
      <div className="flex min-w-0 items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 text-slate-100 hover:bg-slate-800/70"
          onClick={onBack}
          aria-label="戻る"
        >
          <ArrowLeft className="size-6" />
        </Button>
        <div className="min-w-0">
          <h1 className="text-3xl font-semibold tracking-normal">{title}</h1>
          {subtitle && <p className="mt-1 truncate text-sm text-slate-400">{subtitle}</p>}
        </div>
      </div>
      {action}
    </header>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="text-sm font-semibold text-slate-400">{children}</h2>;
}

export function FixedAction({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-700 bg-[#0f1726]/95 p-4 backdrop-blur">
      <div className="mx-auto max-w-3xl">{children}</div>
    </div>
  );
}

export function SummaryCard({ label, value, trend }: { label: string; value: string; trend?: Trend }) {
  return (
    <Card className="rounded-2xl border-slate-700 bg-[#202b3d] text-slate-100 shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-400">
          {trend && <TrendIcon trend={trend} />}
          {label}
        </div>
        <p className="mt-3 text-3xl font-semibold text-[#4ade80]">{value}</p>
      </CardContent>
    </Card>
  );
}

export function TrendIcon({ trend }: { trend: Trend }) {
  if (trend === "up") return <ArrowUp className="size-4 text-emerald-600" />;
  if (trend === "down") return <ArrowDown className="size-4 text-rose-600" />;
  return <Minus className="size-4 text-slate-400" />;
}

export function Field({
  label,
  required,
  hint,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-semibold text-slate-400">
        {label} {required && <span className="text-rose-600">*</span>}
        {hint && <span className="ml-2 font-normal text-slate-500">({hint})</span>}
      </Label>
      {children}
      {error && <p className="text-sm text-rose-600">{error}</p>}
    </div>
  );
}

export function ChoiceButton({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Button
      type="button"
      variant={selected ? "default" : "outline"}
      className={`h-14 rounded-lg text-base font-semibold ${
        selected
          ? "bg-[#16a34a] text-white hover:bg-[#15803d]"
          : "border-slate-600 bg-[#202b3d] text-slate-100 hover:bg-[#34445c]"
      }`}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

export function ResultBadge({ result, status }: { result: MatchRecord["result"]; status: MatchRecord["status"] }) {
  if (status === "draft") {
    return <Badge className="bg-slate-600 text-slate-100 hover:bg-slate-600">未記録</Badge>;
  }
  if (status === "recording") {
    return <Badge className="bg-amber-400 text-slate-950 hover:bg-amber-400">記録中</Badge>;
  }
  return (
    <Badge className={result === "win" ? "bg-emerald-600 hover:bg-emerald-600" : "bg-rose-600 hover:bg-rose-600"}>
      {result === "win" ? "勝" : result === "loss" ? "負" : "未"}
    </Badge>
  );
}

export function TournamentStatusBadge({ status }: { status: Tournament["status"] }) {
  const isFinished = status === "eliminated" || status === "champion" || status === "done";
  const styles = isFinished
    ? "bg-slate-600 text-slate-100 hover:bg-slate-600"
    : "bg-amber-400 text-slate-950 hover:bg-amber-400";
  const label = isFinished ? "終了" : "進行中";

  return <Badge className={styles}>{label}</Badge>;
}

export function GameCount({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="rounded-2xl border border-slate-700 bg-[#202b3d] p-3">
      <p className="text-xs font-medium text-slate-400">{label}</p>
      <p className={`mt-1 text-xl font-semibold ${tone}`}>{value}</p>
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-700 bg-[#182337] p-6 text-center">
      <p className="font-semibold text-slate-100">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
    </div>
  );
}

export function inputClass(hasError: boolean) {
  return `h-14 rounded-2xl border-slate-600 bg-[#34445c] text-slate-100 placeholder:text-slate-400 ${hasError ? "border-rose-500 ring-1 ring-rose-500" : ""}`;
}
