"use client";

import { api } from "@coachi/core";
import { useQuery } from "@tanstack/react-query";
import { LineChartIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { ThenNowSlider } from "@/components/coachi/journey-parts";
import { QueryState } from "@/components/coachi/query-state";
import { SectionTitle } from "@/components/coachi/screen-header";
import { EmptyState } from "@/components/coachi/states";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { useFmt, useLocalName } from "@/lib/format";
import { qk } from "@/lib/query-keys";

const DAY = 86_400_000;

/**
 * One measure per chart (no dual axes), one series each, so the title names it and no legend
 * is needed. Fire Red 2px line, recessive grid, hover tooltip, and a screen-reader table.
 * Time always runs left to right, even in Arabic.
 */
function TrendChart({ title, points, unit }: { title: string; points: { date: string; value: number }[]; unit: (n: number) => string }) {
  const fmt = useFmt();
  const config = { value: { label: title, color: "var(--chart-1)" } } satisfies ChartConfig;
  return (
    <figure className="rounded-lg border bg-card p-4">
      <figcaption className="mb-3 text-sm font-semibold">{title}</figcaption>
      <div dir="ltr">
        <ChartContainer config={config} className="aspect-auto h-48 w-full">
          <LineChart data={points} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={24}
              tickFormatter={(d: string) => fmt.date(d, "short")}
              className="text-xs tabular-nums"
            />
            <YAxis
              width={40}
              tickLine={false}
              axisLine={false}
              domain={["dataMin - 2", "dataMax + 2"]}
              tickFormatter={(v: number) => fmt.num(v, 0)}
              className="text-xs tabular-nums"
            />
            <ChartTooltip
              cursor={{ stroke: "var(--border)" }}
              content={<ChartTooltipContent labelFormatter={(d) => fmt.date(String(d))} formatter={(v) => unit(Number(v))} hideIndicator />}
            />
            <Line dataKey="value" type="monotone" stroke="var(--color-value)" strokeWidth={2} dot={{ r: 4, strokeWidth: 2, fill: "var(--card)" }} activeDot={{ r: 5 }} />
          </LineChart>
        </ChartContainer>
      </div>
      <table className="sr-only">
        <caption>{title}</caption>
        <tbody>
          {points.map((p) => (
            <tr key={p.date}>
              <td>{fmt.date(p.date)}</td>
              <td>{unit(p.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

export function ProgressTab({ clientId }: { clientId: string }) {
  const t = useTranslations("clientFile");
  const fmt = useFmt();
  const name = useLocalName();
  const progress = useQuery({ queryKey: qk.progress(clientId), queryFn: () => api.clients.progress(clientId) });

  return (
    <QueryState query={progress}>
      {(data) => {
        const weights = data.metrics.filter((m) => m.weight_kg != null).map((m) => ({ date: m.date, value: m.weight_kg! }));
        const span = weights.length > 1 ? Date.parse(weights.at(-1)!.date) - Date.parse(weights[0]!.date) : 0;
        if (span < 14 * DAY) return <EmptyState icon={LineChartIcon} title={t("notEnoughData")} />;
        return (
          <div className="flex flex-col gap-6">
            <TrendChart title={t("weightChart")} points={weights} unit={fmt.kg} />
            <section>
              <SectionTitle>{t("liftChart")}</SectionTitle>
              <div className="flex flex-col gap-4">
                {data.lifts.map((lift) => (
                  <TrendChart
                    key={lift.exercise.id}
                    title={name(lift.exercise)}
                    points={lift.points.map((p) => ({ date: p.date, value: p.weight_kg }))}
                    unit={fmt.kg}
                  />
                ))}
              </div>
            </section>
            <section>
              <SectionTitle>{t("photos")}</SectionTitle>
              <div className="max-w-sm">
                <ThenNowSlider before={null} after={null} />
              </div>
            </section>
          </div>
        );
      }}
    </QueryState>
  );
}
