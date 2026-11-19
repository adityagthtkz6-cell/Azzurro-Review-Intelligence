"use client";

import React from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  MessageSquareText,
  Minus,
  Star,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { DashboardOverviewResponse } from "@/lib/types";
import { formatDelta, formatScore } from "@/lib/utils";

interface KpiRibbonProps {
  overview: DashboardOverviewResponse;
}

export function KpiRibbon({ overview }: KpiRibbonProps) {
  const delta = overview.weekly_rating_delta;
  const isPositiveDelta = delta !== null && delta > 0;
  const isNegativeDelta = delta !== null && delta < 0;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* 1. Current Week Average Rating */}
      <Card className="border-slate-200/90">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Avg Weekly Rating
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-azzurro-sky text-azzurro-navy">
              <Star className="h-4 w-4 fill-azzurro-gold text-azzurro-gold" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-azzurro-navy">
              {formatScore(overview.avg_weekly_rating)}
            </span>
            <span className="text-xs font-medium text-slate-400">/ 10.0</span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Overall period average:{" "}
            <span className="font-semibold text-azzurro-navy">
              {formatScore(overview.overall_avg_rating)} / 10
            </span>
          </p>
        </CardContent>
      </Card>

      {/* 2. Previous Week Comparison & WoW Delta */}
      <Card className="border-slate-200/90">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Previous Week Comparison
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-azzurro-sky text-azzurro-navy">
              <TrendingUp className="h-4 w-4 text-azzurro-ocean" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2.5">
            <span className="text-3xl font-bold tracking-tight text-azzurro-navy">
              {formatScore(overview.previous_week_rating)}
            </span>
            {delta !== null ? (
              <Badge
                tone={
                  isPositiveDelta
                    ? "positive"
                    : isNegativeDelta
                    ? "negative"
                    : "neutral"
                }
                className="px-2 py-0.5 text-xs font-semibold"
              >
                {isPositiveDelta ? (
                  <ArrowUpRight className="h-3.5 w-3.5" />
                ) : isNegativeDelta ? (
                  <ArrowDownRight className="h-3.5 w-3.5" />
                ) : (
                  <Minus className="h-3.5 w-3.5" />
                )}
                {formatDelta(delta)} WoW
              </Badge>
            ) : (
              <Badge tone="neutral">No prior week</Badge>
            )}
          </div>
          <p className="mt-2 text-xs text-slate-500">
            7-day rolling benchmark vs prior 7 days
          </p>
        </CardContent>
      </Card>

      {/* 3. Total Reviews */}
      <Card className="border-slate-200/90">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Reviews
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-azzurro-sky text-azzurro-navy">
              <MessageSquareText className="h-4 w-4 text-azzurro-navy" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2.5">
            <span className="text-3xl font-bold tracking-tight text-azzurro-navy">
              {overview.total_reviews}
            </span>
            <Badge
              tone={
                overview.data_mode === "sample"
                  ? "sample"
                  : overview.data_mode === "live"
                  ? "positive"
                  : "neutral"
              }
            >
              {overview.data_mode === "sample"
                ? "Sample Data"
                : overview.data_mode === "live"
                ? "Live Data"
                : overview.data_mode}
            </Badge>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Deduplicated via SHA-256 content fingerprint
          </p>
        </CardContent>
      </Card>

      {/* 4. Positive, Neutral & Negative Sentiment Breakdown */}
      <Card className="border-slate-200/90">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Sentiment Breakdown
            </span>
            <span className="text-xs font-semibold text-emerald-700">
              {overview.sentiment.positive_pct}% Positive
            </span>
          </div>

          {/* Multi-segment bar */}
          <div className="mt-3.5 flex h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              style={{ width: `${overview.sentiment.positive_pct}%` }}
              className="bg-emerald-500 transition-all"
              title={`Positive: ${overview.sentiment.positive_count} (${overview.sentiment.positive_pct}%)`}
            />
            <div
              style={{ width: `${overview.sentiment.neutral_pct}%` }}
              className="bg-amber-400 transition-all"
              title={`Neutral: ${overview.sentiment.neutral_count} (${overview.sentiment.neutral_pct}%)`}
            />
            <div
              style={{ width: `${overview.sentiment.negative_pct}%` }}
              className="bg-rose-500 transition-all"
              title={`Negative: ${overview.sentiment.negative_count} (${overview.sentiment.negative_pct}%)`}
            />
          </div>

          <div className="mt-3 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="font-medium text-slate-700">
                Pos: {overview.sentiment.positive_count}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              <span className="font-medium text-slate-700">
                Neu: {overview.sentiment.neutral_count}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-rose-500" />
              <span className="font-medium text-rose-700">
                Neg: {overview.sentiment.negative_count}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
