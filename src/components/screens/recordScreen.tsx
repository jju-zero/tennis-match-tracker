import { useState } from "react";
import { ArrowLeft, Flag, RotateCcw, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AppShell, FixedAction } from "@/components/tennis/appLayout";
import { roundLabel, sideRate } from "@/lib/tennis";
import type { MatchRecord, Stats } from "@/types/tennis";

type ServeSide = "deuce" | "ad";

export function RecordScreen({
  match,
  stats,
  summary,
  canUndo,
  onBack,
  onUndo,
  onAdd,
  onTemporarySave,
  onFinish,
}: {
  match: MatchRecord;
  stats: Stats;
  summary: { firstServe: number; returnRate: number; chanceBall: number; totalMiss: number };
  canUndo: boolean;
  onBack: () => void;
  onUndo: () => void;
  onAdd: (delta: Partial<Record<keyof Stats, number>>) => void;
  onTemporarySave: () => void;
  onFinish: () => void;
}) {
  const [serveSide, setServeSide] = useState<ServeSide>("deuce");

  function addServe(result: "in" | "out" | "df") {
    const isDeuce = serveSide === "deuce";
    const sideInKey = isDeuce ? "deuceIn" : "adIn";
    const sideOutKey = isDeuce ? "deuceOut" : "adOut";

    if (result === "in") {
      onAdd({ firstIn: 1, [sideInKey]: 1 });
    } else if (result === "out") {
      onAdd({ firstOut: 1, [sideOutKey]: 1 });
    } else {
      onAdd({ firstOut: 1, [sideOutKey]: 1, doubleFaults: 1 });
    }

    setServeSide(isDeuce ? "ad" : "deuce");
  }

  return (
    <AppShell wide bottomPadding>
      <header className="sticky top-0 z-10 -mx-4 border-b border-slate-700 bg-[#202b3d]/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="mx-auto flex max-w-5xl items-start justify-between gap-3">
          <div>
            <button className="mb-2 flex items-center gap-1 text-sm text-slate-400" onClick={onBack}>
              <ArrowLeft className="size-4" />
              大会
            </button>
            <p className="text-sm text-slate-400">
              {match.tournament} · {roundLabel(match.round)} · {match.grade}
            </p>
            <h1 className="mt-1 text-2xl font-semibold">vs {match.opponent}</h1>
          </div>
          <Button
            variant="outline"
            className="h-11 gap-2 rounded-2xl border-slate-600 bg-[#202b3d] text-slate-100 hover:bg-[#34445c]"
            onClick={onUndo}
            disabled={!canUndo}
          >
            <RotateCcw className="size-4" />
            元に戻す
          </Button>
        </div>
        <div className="mx-auto mt-3 grid max-w-5xl grid-cols-5 gap-2">
          <LiveStat label="1stサーブ率" value={`${summary.firstServe}%`} tone="text-[#4ade80]" />
          <LiveStat label="リターン" value={`${summary.returnRate}%`} tone="text-[#69a9ff]" />
          <LiveStat label="チャンスボール" value={`${summary.chanceBall}%`} tone="text-[#69a9ff]" />
          <LiveStat label="ミス" value={`${summary.totalMiss}`} tone="text-[#ffbd6e]" />
          <LiveStat label="DF" value={`${stats.doubleFaults}`} tone="text-[#ff7373]" />
        </div>
      </header>

      <div className="space-y-4">
        <ServeRecordGroup
          stats={stats}
          serveSide={serveSide}
          onServeSide={setServeSide}
          onAddServe={addServe}
        />

        <RecordGroup title="リターン" tone="blue">
          <RecordButton code="IN" label="リターン IN" value={stats.returnIn} tone="green" onClick={() => onAdd({ returnIn: 1 })} />
          <RecordButton code="OUT" label="リターン OUT" value={stats.returnOut} tone="red" onClick={() => onAdd({ returnOut: 1 })} />
        </RecordGroup>

        <RecordGroup title="チャンスボール" tone="blue">
          <RecordButton code="OPP" label="チャンスボール 発生" value={stats.chances} tone="blue" onClick={() => onAdd({ chances: 1 })} />
          <RecordButton code="WIN" label="チャンスボール 成功" value={stats.chanceWins} tone="blue" onClick={() => onAdd({ chanceWins: 1 })} />
        </RecordGroup>
        
        <RecordGroup title="ボレー" tone="purple">
          <RecordButton code="VOL" label="ボレー 試み" value={stats.volleyTries} tone="purple" onClick={() => onAdd({ volleyTries: 1 })} />
          <RecordButton code="V" label="ボレー 成功" value={stats.volleyWins} tone="purple" onClick={() => onAdd({ volleyWins: 1 })} />
        </RecordGroup>

        <RecordGroup title="ミス" tone="orange">
          <RecordButton code="NET" label="ネット" value={stats.net} tone="orange" onClick={() => onAdd({ net: 1 })} />
          <RecordButton code="BASE" label="ベースアウト" value={stats.baseOut} tone="orange" onClick={() => onAdd({ baseOut: 1 })} />
          <RecordButton code="SIDE" label="サイドアウト" value={stats.sideOut} tone="orange" onClick={() => onAdd({ sideOut: 1 })} />
        </RecordGroup>
      </div>

      <FixedAction>
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            className="h-16 gap-2 rounded-2xl border-slate-600 bg-[#202b3d] text-base font-semibold text-slate-100 hover:bg-[#34445c]"
            onClick={onTemporarySave}
          >
            <Save className="size-5 text-[#4ade80]" />
            一時保存
          </Button>
          <Button
            className="h-16 gap-2 rounded-2xl bg-[#16a34a] text-base font-semibold text-white hover:bg-[#15803d]"
            onClick={onFinish}
          >
            <Flag className="size-5" />
            試合終了
          </Button>
        </div>
      </FixedAction>
    </AppShell>
  );
}

function ServeRecordGroup({
  stats,
  serveSide,
  onServeSide,
  onAddServe,
}: {
  stats: Stats;
  serveSide: ServeSide;
  onServeSide: (side: ServeSide) => void;
  onAddServe: (result: "in" | "out" | "df") => void;
}) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold text-slate-300">サーブ</h2>
      <div className="mb-3 grid grid-cols-2 gap-3">
        <ServeSideButton
          label="デュース"
          rate={sideRate(stats.deuceIn, stats.deuceOut)}
          selected={serveSide === "deuce"}
          onClick={() => onServeSide("deuce")}
        />
        <ServeSideButton
          label="アド"
          rate={sideRate(stats.adIn, stats.adOut)}
          selected={serveSide === "ad"}
          onClick={() => onServeSide("ad")}
        />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <RecordButton code="IN" label="1st IN" value={stats.firstIn} tone="green" onClick={() => onAddServe("in")} />
        <RecordButton code="OUT" label="1st OUT" value={stats.firstOut} tone="red" onClick={() => onAddServe("out")} />
        <RecordButton code="DF" label="DF" value={stats.doubleFaults} tone="red" onClick={() => onAddServe("df")} />
      </div>
    </section>
  );
}

function ServeSideButton({
  label,
  rate,
  selected,
  onClick,
}: {
  label: string;
  rate: number;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`min-h-20 rounded-2xl border p-4 text-left transition active:scale-[0.99] ${
        selected
          ? "border-[#4ade80] bg-emerald-950/40 text-[#4ade80]"
          : "border-slate-700 bg-[#202b3d] text-slate-300"
      }`}
      onClick={onClick}
    >
      <span className="text-sm font-semibold">{label}</span>
      <span className="mt-2 block text-2xl font-semibold">{rate}%</span>
    </button>
  );
}

function RecordGroup({
  title,
  children,
}: {
  title: string;
  tone: "slate" | "blue" | "purple" | "orange";
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold text-slate-300">{title}</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{children}</div>
    </section>
  );
}

function RecordButton({
  code,
  label,
  value,
  tone,
  wide,
  onClick,
}: {
  code: string;
  label: string;
  value: number;
  tone: "green" | "red" | "blue" | "purple" | "orange";
  wide?: boolean;
  onClick: () => void;
}) {
  const colors = {
    green: "border-emerald-600/45 bg-emerald-950/35 text-[#4ade80]",
    red: "border-rose-600/45 bg-rose-950/30 text-[#ff7373]",
    blue: "border-blue-600/45 bg-blue-950/30 text-[#7eb6ff]",
    purple: "border-purple-600/45 bg-purple-950/30 text-[#b69cff]",
    orange: "border-orange-600/45 bg-orange-950/30 text-[#ffbd6e]",
  }[tone];

  return (
    <button
      className={`${wide ? "col-span-2 sm:col-span-3" : ""} flex min-h-28 flex-col items-start justify-between rounded-2xl border p-4 text-left transition active:scale-[0.99] ${colors}`}
      onClick={onClick}
    >
      <span className="rounded-md bg-white/10 px-2 py-1 text-xs font-semibold">{code}</span>
      <span className="text-base font-semibold">{label}</span>
      <span className="text-3xl font-semibold">{value}</span>
    </button>
  );
}

function LiveStat({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="rounded-xl border border-slate-700 bg-[#182337] p-3 text-center shadow-sm">
      <p className={`text-xl font-semibold ${tone}`}>{value}</p>
      <p className="mt-1 text-xs text-slate-400">{label}</p>
    </div>
  );
}
