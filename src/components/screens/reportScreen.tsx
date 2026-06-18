import { useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AppShell,
  EmptyState,
  ResultBadge,
  ScreenHeader,
  SectionTitle,
  SummaryCard,
} from "@/components/tennis/appLayout";
import {
  buildSummary,
  firstServeRate,
  perTen,
  sideRate,
  successRate,
  totalGames,
  totalMisses,
} from "@/lib/tennis";
import type { MatchRecord } from "@/types/tennis";

export function ReportScreen({ matches, onBack }: { matches: MatchRecord[]; onBack: () => void }) {
  const [period, setPeriod] = useState("5");
  const periodCount = period === "all" ? null : Number(period);
  const scopedMatches = periodCount === null ? matches : matches.slice(0, periodCount);
  const summary = buildSummary(scopedMatches);
  const data = scopedMatches
    .slice()
    .reverse()
    .map((match) => {
      const games = totalGames(match);
      return {
        label: `${match.date.slice(5)} ${match.opponent.split(" ")[0]}`,
        firstServe: firstServeRate(match.stats),
        deuce: sideRate(match.stats.deuceIn, match.stats.deuceOut),
        ad: sideRate(match.stats.adIn, match.stats.adOut),
        chance: successRate(match.stats.chanceWins, match.stats.chances),
        volley: successRate(match.stats.volleyWins, match.stats.volleyTries),
        doubleFaults: Number(perTen(match.stats.doubleFaults, games)),
        misses: Number(perTen(totalMisses(match.stats), games)),
      };
    });

  return (
    <AppShell wide>
      <ScreenHeader title="成長レポート" onBack={onBack} />
      <PeriodSegmentedControl value={period} onChange={setPeriod} />

      <section className="space-y-3">
        <SectionTitle>指標サマリー</SectionTitle>
        <div className="grid grid-cols-3 gap-3">
          <SummaryCard label="1stサーブ成功率" value={`${summary.firstServe}%`} />
          <SummaryCard label="デュースサイド成功率" value={`${summary.deuce}%`} />
          <SummaryCard label="アドサイド成功率" value={`${summary.ad}%`} />
          <SummaryCard label="チャンスボール成功率" value={`${summary.chanceBall}%`} />
          <SummaryCard label="ボレー成功率" value={`${summary.volley}%`} />
          <SummaryCard label="ダブルフォルト" value={`${summary.doubleFaults}本`} />
          <SummaryCard label="ネットミス" value={`${summary.net}本`} />
          <SummaryCard label="10Gあたり DF" value={`${summary.dfPerTen}`} />
          <SummaryCard label="10Gあたり ミス" value={`${summary.missPerTen}`} />
        </div>
      </section>

      <ChartCard title="サーブ成功率">
        <LineChart data={data} margin={{ left: -18, right: 10, top: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "#94a3b8" }} />
          <YAxis domain={[0, 100]} tickLine={false} axisLine={false} tick={{ fill: "#94a3b8" }} />
          <Tooltip />
          <Line type="monotone" dataKey="firstServe" name="1st" stroke="#49df78" strokeWidth={3} />
          <Line type="monotone" dataKey="deuce" name="デュース" stroke="#69a9ff" strokeWidth={3} />
          <Line type="monotone" dataKey="ad" name="アド" stroke="#b69cff" strokeWidth={3} />
        </LineChart>
      </ChartCard>

      <ChartCard title="チャンスボール・ボレー成功率">
        <LineChart data={data} margin={{ left: -18, right: 10, top: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "#94a3b8" }} />
          <YAxis domain={[0, 100]} tickLine={false} axisLine={false} tick={{ fill: "#94a3b8" }} />
          <Tooltip />
          <Line type="monotone" dataKey="chance" name="チャンス" stroke="#69a9ff" strokeWidth={3} />
          <Line type="monotone" dataKey="volley" name="ボレー" stroke="#b69cff" strokeWidth={3} />
        </LineChart>
      </ChartCard>

      <ChartCard title="ミス推移（10Gあたり）">
        <LineChart data={data} margin={{ left: -18, right: 10, top: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "#94a3b8" }} />
          <YAxis tickLine={false} axisLine={false} tick={{ fill: "#94a3b8" }} />
          <Tooltip />
          <Line type="monotone" dataKey="doubleFaults" name="DF" stroke="#ff7373" strokeWidth={3} />
          <Line type="monotone" dataKey="misses" name="ミス" stroke="#ff9138" strokeWidth={3} />
        </LineChart>
      </ChartCard>

      <section className="space-y-3">
        <SectionTitle>試合別記録</SectionTitle>
        {scopedMatches.length === 0 ? (
          <EmptyState
            title="表示できる試合がありません"
            description="試合を保存すると、ここに試合別の指標が表示されます。"
          />
        ) : (
          <div className="space-y-3">
            {scopedMatches.map((match) => (
              <div key={match.id} className="flex items-center justify-between rounded-2xl border border-slate-700 bg-[#202b3d] p-4">
                <div>
                  <p className="font-semibold">
                    {match.date.slice(5)} {match.opponent}
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    1st {firstServeRate(match.stats)}% · チャンス {successRate(match.stats.chanceWins, match.stats.chances)}% · DF {match.stats.doubleFaults}
                  </p>
                </div>
                <ResultBadge result={match.result} status={match.status} />
              </div>
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}

function PeriodSegmentedControl({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const options = [
    ["5", "直近5試合"],
    ["10", "直近10試合"],
    ["all", "全期間"],
  ];

  return (
    <div className="grid w-full grid-cols-3 rounded-[28px] border border-slate-600/80 bg-[#202b3d] p-2 shadow-sm">
      {options.map(([optionValue, label]) => {
        const selected = value === optionValue;

        return (
          <button
            key={optionValue}
            type="button"
            className={`h-16 rounded-[22px] text-base font-semibold transition sm:h-20 sm:text-xl ${
              selected
                ? "bg-[#49df78] text-slate-950 shadow-sm"
                : "text-slate-400 hover:bg-[#2b3950] hover:text-slate-100"
            }`}
            onClick={() => onChange(optionValue)}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactElement }) {
  return (
    <Card className="rounded-2xl border-slate-700 bg-[#202b3d] text-slate-100">
      <CardHeader>
        <CardTitle className="text-base text-slate-300">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            {children}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
