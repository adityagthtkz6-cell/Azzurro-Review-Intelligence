"use client";

import React from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  ExternalLink,
  MapPin,
  Minus,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PropertyCardSummary } from "@/lib/types";
import { formatDelta, formatScore } from "@/lib/utils";

interface PropertyCardsGridProps {
  properties: PropertyCardSummary[];
  selectedSlug?: string;
  onSelectPropertyFilter?: (slug: string) => void;
}

export function PropertyCardsGrid({
  properties,
  selectedSlug = "all",
  onSelectPropertyFilter,
}: PropertyCardsGridProps) {
  return (
    <section className="space-y-3.5">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-lg font-semibold text-azzurro-navy">
            Azzurro Hotels — Portfolio Property Performance
          </h2>
          <p className="text-xs text-slate-500">
            Weekly rating benchmarks, week-over-week comparison, sentiment mix,
            and primary operational issue across all 4 Sydney properties
          </p>
        </div>
        {selectedSlug && selectedSlug !== "all" && onSelectPropertyFilter && (
          <button
            type="button"
            onClick={() => onSelectPropertyFilter("all")}
            className="text-xs font-semibold text-azzurro-ocean hover:underline"
          >
            Show All 4 Properties
          </button>
        )}
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {properties.map((prop) => {
          const isSelected = selectedSlug === prop.slug;
          const delta = prop.weekly_rating_delta;
          const posPct =
            prop.total_reviews > 0
              ? Math.round((prop.positive_count / prop.total_reviews) * 100)
              : 0;
          const neuPct =
            prop.total_reviews > 0
              ? Math.round((prop.neutral_count / prop.total_reviews) * 100)
              : 0;
          const negPct =
            prop.total_reviews > 0
              ? Math.max(0, 100 - posPct - neuPct)
              : 0;

          return (
            <Card
              key={prop.slug}
              className={`flex flex-col justify-between transition-all ${
                isSelected
                  ? "border-azzurro-navy ring-2 ring-azzurro-navy/15 shadow-md"
                  : "border-slate-200/90 hover:border-azzurro-navy/40"
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2">
                  <Badge tone="outline" className="font-semibold">
                    <MapPin className="h-3 w-3 text-azzurro-gold" />
                    {prop.area}
                  </Badge>
                  {prop.has_sample_data ? (
                    <Badge tone="sample" className="text-[10px]">
                      Sample
                    </Badge>
                  ) : prop.has_live_data ? (
                    <Badge tone="positive" className="text-[10px]">
                      Live
                    </Badge>
                  ) : (
                    <Badge tone="neutral" className="text-[10px]">
                      0 Reviews
                    </Badge>
                  )}
                </div>

                <CardTitle className="mt-2 text-base leading-snug">
                  <Link
                    href={`/properties/${prop.slug}`}
                    className="hover:text-azzurro-ocean hover:underline"
                  >
                    {prop.name}
                  </Link>
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-3.5 pb-4 pt-0">
                {/* Weekly Score & WoW Delta */}
                <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/90 p-3">
                  <div>
                    <div className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                      Weekly Avg
                    </div>
                    <div className="mt-0.5 flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-azzurro-navy">
                        {formatScore(prop.avg_weekly_rating)}
                      </span>
                      <span className="text-xs text-slate-400">/10</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-[11px] text-slate-500">
                      Prev: {formatScore(prop.previous_week_rating)}
                    </div>
                    {delta !== null ? (
                      <span
                        className={`mt-1 inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold ${
                          delta > 0
                            ? "bg-emerald-50 text-emerald-700"
                            : delta < 0
                            ? "bg-rose-50 text-rose-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {delta > 0 ? (
                          <ArrowUpRight className="h-3 w-3" />
                        ) : delta < 0 ? (
                          <ArrowDownRight className="h-3 w-3" />
                        ) : (
                          <Minus className="h-3 w-3" />
                        )}
                        {formatDelta(delta)}
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400">—</span>
                    )}
                  </div>
                </div>

                {/* Overall Rating & Total Reviews */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">
                    Overall Avg:{" "}
                    <strong className="text-azzurro-navy">
                      {formatScore(prop.overall_avg_rating)}
                    </strong>
                  </span>
                  <span className="text-slate-500">
                    Reviews:{" "}
                    <strong className="text-azzurro-navy">
                      {prop.total_reviews}
                    </strong>
                  </span>
                </div>

                {/* Sentiment Mini Progress Bar */}
                <div className="space-y-1">
                  <div className="flex h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      style={{ width: `${posPct}%` }}
                      className="bg-emerald-500"
                    />
                    <div
                      style={{ width: `${neuPct}%` }}
                      className="bg-amber-400"
                    />
                    <div
                      style={{ width: `${negPct}%` }}
                      className="bg-rose-500"
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span className="text-emerald-700">
                      +{prop.positive_count} Pos
                    </span>
                    <span>{prop.neutral_count} Neu</span>
                    <span className="text-rose-700 font-medium">
                      {prop.negative_count} Neg
                    </span>
                  </div>
                </div>

                {/* Top Operational Issue */}
                <div className="flex items-center justify-between rounded-md border border-slate-100 bg-white px-2.5 py-1.5 text-xs">
                  <span className="flex items-center gap-1 text-slate-500">
                    <AlertCircle className="h-3.5 w-3.5 text-rose-600" />
                    Top Issue:
                  </span>
                  <span className="font-semibold text-azzurro-navy">
                    {prop.top_issue || "None flagged"}
                  </span>
                </div>
              </CardContent>

              <CardFooter className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                {onSelectPropertyFilter ? (
                  <button
                    type="button"
                    onClick={() =>
                      onSelectPropertyFilter(isSelected ? "all" : prop.slug)
                    }
                    className={`font-medium ${
                      isSelected
                        ? "text-azzurro-gold font-semibold"
                        : "text-slate-600 hover:text-azzurro-navy"
                    }`}
                  >
                    {isSelected ? "Filtered ✓" : "Filter Overview"}
                  </button>
                ) : (
                  <a
                    href={prop.booking_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-slate-500 hover:text-azzurro-navy"
                  >
                    Booking.com
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}

                <Link
                  href={`/properties/${prop.slug}`}
                  className="inline-flex items-center gap-1 font-semibold text-azzurro-ocean hover:underline"
                >
                  <span>Property Detail</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
