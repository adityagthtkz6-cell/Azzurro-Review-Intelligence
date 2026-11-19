"use client";

import React from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { WeeklyTrendPoint } from "@/lib/types";

interface WeeklySentimentChartProps {
  data: WeeklyTrendPoint[];
}

export function WeeklySentimentChart({ data }: WeeklySentimentChartProps) {
  const hasAnyReviews = data.some((d) => d.total_reviews > 0);

  return (
    <Card className="border-slate-200/90">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">
          Weekly Sentiment &amp; Rating Trend (6-Week Window)
        </CardTitle>
        <CardDescription>
          Weekly positive, neutral, and negative review volume overlaid with
          average weekly score (/10)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!hasAnyReviews ? (
          <div className="flex h-72 items-center justify-center rounded-lg border border-dashed border-slate-200 text-xs text-slate-500">
            No weekly review trend data available for the active filter scope.
          </div>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={data}
                margin={{ top: 12, right: 12, left: -12, bottom: 4 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#E2E8F0"
                />
                <XAxis
                  dataKey="week_label"
                  tick={{ fontSize: 12, fill: "#475569" }}
                  axisLine={{ stroke: "#CBD5E1" }}
                />
                <YAxis
                  yAxisId="left"
                  allowDecimals={false}
                  tick={{ fontSize: 12, fill: "#475569" }}
                  axisLine={false}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[0, 10]}
                  tick={{ fontSize: 12, fill: "#0B1D3A" }}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#FFFFFF",
                    borderColor: "#E2E8F0",
                    borderRadius: "0.5rem",
                    fontSize: "12px",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
                <Bar
                  yAxisId="left"
                  dataKey="positive_count"
                  name="Positive"
                  stackId="sentiment"
                  fill="#10B981"
                  radius={[0, 0, 0, 0]}
                  barSize={26}
                />
                <Bar
                  yAxisId="left"
                  dataKey="neutral_count"
                  name="Neutral"
                  stackId="sentiment"
                  fill="#F59E0B"
                  barSize={26}
                />
                <Bar
                  yAxisId="left"
                  dataKey="negative_count"
                  name="Negative"
                  stackId="sentiment"
                  fill="#F43F5E"
                  radius={[4, 4, 0, 0]}
                  barSize={26}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="avg_rating"
                  name="Avg Rating (/10)"
                  stroke="#0B1D3A"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "#C89D54", stroke: "#0B1D3A" }}
                  connectNulls
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
