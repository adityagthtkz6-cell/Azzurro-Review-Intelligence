"use client";

import React from "react";
import Link from "next/link";
import {
  AlertOctagon,
  BedDouble,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Globe2,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CanonicalTopic, PaginatedReviewResponse } from "@/lib/types";

interface ReviewFeedProps {
  reviewsData: PaginatedReviewResponse;
  onPageChange: (nextPage: number) => void;
  onTopicClick?: (topic: CanonicalTopic) => void;
  hidePropertyLink?: boolean;
}

export function ReviewFeed({
  reviewsData,
  onPageChange,
  onTopicClick,
  hidePropertyLink = false,
}: ReviewFeedProps) {
  const { items, total, page, page_size } = reviewsData;
  const totalPages = Math.max(1, Math.ceil(total / page_size));

  return (
    <Card className="border-slate-200/90">
      <CardHeader className="pb-3">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <div>
            <CardTitle className="text-base">
              Guest Review Intelligence Feed ({total})
            </CardTitle>
            <CardDescription>
              Classified guest reviews with positive/negative text extraction,
              8-topic operational tags, and provenance verification
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>
              Page <strong className="text-azzurro-navy">{page}</strong> of{" "}
              <strong className="text-azzurro-navy">{totalPages}</strong>
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-10 text-center">
            <p className="text-sm font-semibold text-azzurro-navy">
              No Guest Reviews Match Your Current Filters
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Try widening your date range, resetting topic or sentiment
              filters, or loading the sample dataset.
            </p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {items.map((review) => {
              const isNegative = review.sentiment === "negative";
              const isPositive = review.sentiment === "positive";

              return (
                <article
                  key={review.id}
                  data-testid="review-card"
                  className={`rounded-xl border p-4 transition-all ${
                    isNegative
                      ? "border-l-4 border-rose-300 border-l-rose-600 bg-rose-50/35"
                      : "border-slate-200/90 bg-white hover:border-slate-300"
                  }`}
                >
                  {/* Top Header Row: Property, Score, Sentiment, Sample/Live Badge */}
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {!hidePropertyLink && review.property_slug ? (
                          <Link
                            href={`/properties/${review.property_slug}`}
                            className="rounded-md bg-azzurro-navy px-2 py-0.5 text-xs font-semibold text-white hover:bg-azzurro-ocean"
                          >
                            {review.property_area || review.property_name}
                          </Link>
                        ) : (
                          <span className="rounded-md bg-azzurro-navy px-2 py-0.5 text-xs font-semibold text-white">
                            {review.property_area || review.property_name}
                          </span>
                        )}

                        <Badge
                          tone={
                            isPositive
                              ? "positive"
                              : isNegative
                              ? "negative"
                              : "neutral"
                          }
                        >
                          {isNegative && (
                            <AlertOctagon className="h-3 w-3 text-rose-700" />
                          )}
                          {review.sentiment.toUpperCase()}
                        </Badge>

                        {/* Explicit Sample vs Live Provenance Badge */}
                        {review.is_sample_data ? (
                          <Badge
                            tone="sample"
                            title="Explicitly tagged sample review (is_sample_data=true)"
                          >
                            SAMPLE DATA
                          </Badge>
                        ) : (
                          <Badge tone="positive">LIVE BOOKING.COM</Badge>
                        )}
                      </div>

                      <h4 className="text-sm font-semibold text-azzurro-navy">
                        {review.title || "Guest Review"}
                      </h4>
                    </div>

                    {/* Score Pill */}
                    <div
                      className={`flex h-10 min-w-[3.2rem] items-center justify-center rounded-lg px-2.5 text-sm font-bold text-white shadow-sm ${
                        review.rating >= 7.5
                          ? "bg-azzurro-navy"
                          : review.rating >= 5.8
                          ? "bg-amber-600"
                          : "bg-rose-600"
                      }`}
                    >
                      {review.rating.toFixed(1)}
                    </div>
                  </div>

                  {/* Guest & Stay Metadata */}
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span className="font-medium text-slate-700">
                      {review.reviewer_name}
                    </span>
                    {review.reviewer_country && (
                      <span className="inline-flex items-center gap-1">
                        <Globe2 className="h-3 w-3 text-slate-400" />
                        {review.reviewer_country}
                      </span>
                    )}
                    {review.room_type && (
                      <span className="inline-flex items-center gap-1">
                        <BedDouble className="h-3 w-3 text-slate-400" />
                        {review.room_type}
                        {review.stay_duration
                          ? ` (${review.stay_duration})`
                          : ""}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-slate-400" />
                      Reviewed {review.review_date}
                    </span>
                  </div>

                  {/* Positive & Negative Review Text Sections */}
                  <div className="mt-3 space-y-2 text-xs leading-relaxed">
                    {review.positive_text && (
                      <div className="flex items-start gap-2 rounded-lg border border-emerald-100 bg-emerald-50/50 p-2.5 text-slate-700">
                        <ThumbsUp className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                        <div>
                          <span className="font-semibold text-emerald-900">
                            Positive:{" "}
                          </span>
                          <span>{review.positive_text}</span>
                        </div>
                      </div>
                    )}

                    {review.negative_text && (
                      <div
                        className={`flex items-start gap-2 rounded-lg border p-2.5 ${
                          isNegative
                            ? "border-rose-200 bg-rose-100/70 text-rose-950 font-medium"
                            : "border-rose-100 bg-rose-50/40 text-slate-700"
                        }`}
                      >
                        <ThumbsDown className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-600" />
                        <div>
                          <span className="font-semibold text-rose-900">
                            Operational Issue / Disliked:{" "}
                          </span>
                          <span>{review.negative_text}</span>
                        </div>
                      </div>
                    )}

                    {!review.positive_text &&
                      !review.negative_text &&
                      review.full_text && (
                        <p className="text-slate-700">{review.full_text}</p>
                      )}
                  </div>

                  {/* Classified Topic Labels */}
                  <div className="mt-3 flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="mr-1 text-[11px] font-medium text-slate-400">
                      Classified Topics:
                    </span>
                    {review.topics.map((topic) => {
                      const isNegIssue =
                        review.negative_topics &&
                        review.negative_topics.includes(topic);
                      return (
                        <button
                          key={topic}
                          type="button"
                          onClick={() => onTopicClick && onTopicClick(topic)}
                          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-colors ${
                            isNegIssue
                              ? "border-rose-300 bg-rose-100 text-rose-800 hover:bg-rose-200"
                              : "border-slate-200 bg-slate-50 text-azzurro-navy hover:bg-slate-100"
                          }`}
                          title={
                            isNegIssue
                              ? "Flagged as an operational issue in negative feedback"
                              : "Topic mentioned in review"
                          }
                        >
                          {topic}
                          {isNegIssue && (
                            <span className="text-[10px] font-bold text-rose-700">
                              !
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Pagination Bar */}
        {total > 0 && (
          <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 pt-4 sm:flex-row">
            <span className="text-xs text-slate-500">
              Showing{" "}
              <strong className="text-azzurro-navy">
                {(page - 1) * page_size + 1}
              </strong>{" "}
              to{" "}
              <strong className="text-azzurro-navy">
                {Math.min(page * page_size, total)}
              </strong>{" "}
              of <strong className="text-azzurro-navy">{total}</strong> reviews
            </span>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => onPageChange(page - 1)}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Previous
              </Button>
              <span className="px-2 text-xs font-medium text-azzurro-navy">
                Page {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => onPageChange(page + 1)}
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
