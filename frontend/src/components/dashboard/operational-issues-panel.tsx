"use client";

import React from "react";
import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CanonicalTopic, OperationalIssueMetric } from "@/lib/types";

interface OperationalIssuesPanelProps {
  issues: OperationalIssueMetric[];
  selectedTopic?: string;
  onSelectTopic?: (topic: CanonicalTopic | "all") => void;
}

export function OperationalIssuesPanel({
  issues,
  selectedTopic = "all",
  onSelectTopic,
}: OperationalIssuesPanelProps) {
  const denominator =
    issues.length > 0 ? issues[0].total_negative_reviews_denominator : 0;

  return (
    <Card className="border-slate-200/90">
      <CardHeader className="pb-3">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-rose-600" />
              Operational Issue Analysis (8 Canonical Categories)
            </CardTitle>
            <CardDescription className="mt-1">
              Issue percentage is calculated using{" "}
              <strong className="text-azzurro-navy">
                negative reviews ({denominator}) as the denominator
              </strong>
              : (Negative reviews mentioning topic ÷ Total negative reviews) ×
              100
            </CardDescription>
          </div>

          <Badge tone="negative" className="self-start sm:self-auto">
            Denominator: {denominator} Negative{" "}
            {denominator === 1 ? "Review" : "Reviews"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {denominator === 0 ? (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50/70 p-4 text-xs text-emerald-900">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>
              Zero negative reviews in the current filter scope — 0% operational
              issue rate across all 8 categories.
            </span>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {issues.map((item) => {
              const isSelected = selectedTopic === item.topic;
              const pct = item.issue_percentage_of_negative;
              const barColor =
                pct >= 50
                  ? "bg-rose-600"
                  : pct >= 25
                  ? "bg-amber-500"
                  : pct > 0
                  ? "bg-azzurro-ocean"
                  : "bg-slate-300";

              return (
                <button
                  key={item.topic}
                  type="button"
                  onClick={() =>
                    onSelectTopic &&
                    onSelectTopic(isSelected ? "all" : item.topic)
                  }
                  className={`flex flex-col justify-between rounded-xl border p-3.5 text-left transition-all ${
                    isSelected
                      ? "border-azzurro-navy bg-azzurro-sky/60 ring-2 ring-azzurro-navy/15"
                      : "border-slate-200/80 bg-white hover:border-azzurro-navy/40"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-azzurro-navy">
                      {item.topic}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        pct >= 50
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : pct > 0
                          ? "bg-amber-50 text-amber-800 border border-amber-200"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {pct.toFixed(1)}% of negative
                    </span>
                  </div>

                  <div className="my-2.5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      style={{ width: `${Math.min(100, pct)}%` }}
                      className={`h-full rounded-full transition-all ${barColor}`}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>
                      <strong className="text-rose-700">
                        {item.negative_mentions}
                      </strong>{" "}
                      of {item.total_negative_reviews_denominator} negative
                      reviews
                    </span>
                    <span>
                      Total mentions (all reviews):{" "}
                      <strong className="text-azzurro-navy">
                        {item.total_mentions_all_sentiments}
                      </strong>
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <div className="flex items-center gap-1.5 pt-1 text-[11px] text-slate-500">
          <Info className="h-3.5 w-3.5 text-azzurro-ocean" />
          <span>
            Click any operational category card above to filter the analytics
            and guest review feed by that topic.
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
