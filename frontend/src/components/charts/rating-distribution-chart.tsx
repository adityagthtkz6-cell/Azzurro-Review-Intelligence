"use client";

import React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
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
import { PropertyCardSummary, RatingBucket } from "@/lib/types";

interface RatingDistributionChartProps {
  buckets: RatingBucket[];
  properties?: PropertyCardSummary[];
}

const BUCKET_COLORS = ["#10B981", "#153668", "#F59E0B", "#F43F5E"];

export function RatingDistributionChart({
  buckets,
  properties,
}: RatingDistributionChartProps) {
  const totalCount = buckets.reduce((acc, b) => acc + b.count, 0);

  return (
    <Card className="border-slate-200/90">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">
          Booking.com Score Distribution &amp; Property Benchmark
        </CardTitle>
        <CardDescription>
          Guest score bands (0–10 scale) and property-wise average rating
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {totalCount === 0 ? (
          <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-slate-200 text-xs text-slate-500">
            No reviews in current filter scope.
          </div>
        ) : (
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={buckets}
                layout="vertical"
                margin={{ top: 4, right: 20, left: 20, bottom: 4 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                  stroke="#E2E8F0"
                />
                <XAxis
                  type="number"
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "#475569" }}
                />
                <YAxis
                  dataKey="bucket_label"
                  type="category"
                  width={125}
                  tick={{ fontSize: 11, fill: "#0B1D3A", fontWeight: 500 }}
                />
                <Tooltip
                  formatter={(value: number, _name, item) => [
                    `${value} reviews (${item.payload.percentage}%)`,
                    "Count",
                  ]}
                  contentStyle={{
                    backgroundColor: "#FFFFFF",
                    borderColor: "#E2E8F0",
                    borderRadius: "0.5rem",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={20}>
                  {buckets.map((_, index) => (
                    <Cell
                      key={`bucket-cell-${index}`}
                      fill={BUCKET_COLORS[index % BUCKET_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Property-wise rating comparison mini bars */}
        {properties && properties.length > 0 && (
          <div className="border-t border-slate-100 pt-3.5">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Property-Wise Rating Comparison
            </div>
            <div className="space-y-2">
              {properties.map((p) => {
                const score = p.overall_avg_rating ?? 0;
                const widthPct = Math.min(100, Math.round((score / 10) * 100));
                return (
                  <div key={p.slug} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-azzurro-navy">
                        {p.area}
                      </span>
                      <span className="font-mono font-semibold text-azzurro-navy">
                        {p.overall_avg_rating !== null
                          ? `${p.overall_avg_rating.toFixed(2)} / 10`
                          : "—"}{" "}
                        <span className="font-normal text-slate-400">
                          ({p.total_reviews} rev)
                        </span>
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        style={{ width: `${widthPct}%` }}
                        className="h-full rounded-full bg-azzurro-navy transition-all"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
