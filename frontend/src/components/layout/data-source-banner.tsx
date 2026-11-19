"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  Database,
  History,
  Play,
  RefreshCw,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CollectionLogItem, DataMode } from "@/lib/types";

interface DataSourceBannerProps {
  dataMode: DataMode;
  isSampleDataActive: boolean;
  totalReviews: number;
  propertySlug?: string;
  logs: CollectionLogItem[];
  isActionLoading: boolean;
  actionFeedback: string | null;
  onSeedSample: () => Promise<void>;
  onRunCollector: () => Promise<void>;
  onClearSample: () => Promise<void>;
}

export function DataSourceBanner({
  dataMode,
  isSampleDataActive,
  totalReviews,
  logs,
  isActionLoading,
  actionFeedback,
  onSeedSample,
  onRunCollector,
  onClearSample,
}: DataSourceBannerProps) {
  const [showLogs, setShowLogs] = useState(false);

  return (
    <div className="space-y-3">
      {/* Visible SAMPLE DATA — DEMO MODE banner whenever sample data is active */}
      {isSampleDataActive || dataMode === "sample" || dataMode === "mixed" ? (
        <div
          data-testid="sample-data-banner"
          className="rounded-xl border border-amber-300 bg-amber-50/95 px-4 py-3.5 text-amber-950 shadow-sm"
        >
          <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
              <div className="space-y-0.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
                    SAMPLE DATA — DEMO MODE
                  </span>
                  <Badge tone="sample">
                    Explicitly Labelled Sample Dataset ({totalReviews} reviews in
                    scope)
                  </Badge>
                </div>
                <p className="text-xs text-amber-800/90">
                  These reviews are tagged with{" "}
                  <code className="rounded bg-amber-100 px-1 py-0.5 font-mono text-[11px]">
                    is_sample_data = true
                  </code>{" "}
                  and{" "}
                  <code className="rounded bg-amber-100 px-1 py-0.5 font-mono text-[11px]">
                    data_source = &quot;sample_seed&quot;
                  </code>{" "}
                  in PostgreSQL. They are never presented as live Booking.com
                  reviews.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={isActionLoading}
                onClick={onRunCollector}
                title="Attempt permitted public-page review collection via Playwright"
              >
                <Play className="h-3.5 w-3.5 text-azzurro-navy" />
                {isActionLoading ? "Running..." : "Run Public Collector"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={isActionLoading}
                onClick={onSeedSample}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Verify Sample Seed
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={isActionLoading}
                onClick={onClearSample}
                className="text-rose-700 hover:bg-rose-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Clear Sample Data
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowLogs((prev) => !prev)}
              >
                <History className="h-3.5 w-3.5" />
                Logs ({logs.length})
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm">
          <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-azzurro-navy">
                    {dataMode === "live"
                      ? "LIVE PUBLIC BOOKING.COM DATA"
                      : "NO REVIEWS IN CURRENT SCOPE"}
                  </span>
                  <Badge tone={dataMode === "live" ? "positive" : "neutral"}>
                    {totalReviews} reviews
                  </Badge>
                </div>
                <p className="text-xs text-slate-600">
                  {dataMode === "live"
                    ? "Displaying publicly collected Booking.com guest reviews."
                    : "Database currently has 0 reviews matching these filters. You can load the clearly labelled sample dataset or run the public collector."}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                disabled={isActionLoading}
                onClick={onSeedSample}
              >
                <Database className="h-3.5 w-3.5" />
                Load Sample Data
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={isActionLoading}
                onClick={onRunCollector}
              >
                <Play className="h-3.5 w-3.5" />
                Run Public Collector
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowLogs((prev) => !prev)}
              >
                <History className="h-3.5 w-3.5" />
                Logs ({logs.length})
              </Button>
            </div>
          </div>
        </div>
      )}

      {actionFeedback && (
        <div className="rounded-lg border border-azzurro-navy/20 bg-azzurro-sky/70 px-3.5 py-2 text-xs font-medium text-azzurro-navy">
          {actionFeedback}
        </div>
      )}

      {showLogs && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-2.5 flex items-center justify-between">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-azzurro-navy">
              Recent Collection &amp; Sample Seeding Audit Logs
            </h4>
            <button
              onClick={() => setShowLogs(false)}
              className="text-xs text-slate-500 hover:text-azzurro-navy"
            >
              Close
            </button>
          </div>
          {logs.length === 0 ? (
            <p className="text-xs text-slate-500">No collection logs recorded yet.</p>
          ) : (
            <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 text-xs">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex flex-col justify-between gap-1 py-2 sm:flex-row sm:items-center"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-azzurro-navy">
                        {log.property_name || "All Properties"}
                      </span>
                      <Badge
                        tone={
                          log.status === "success"
                            ? "positive"
                            : log.status === "sample_fallback"
                            ? "sample"
                            : "neutral"
                        }
                      >
                        {log.status}
                      </Badge>
                    </div>
                    {log.error_message && (
                      <p className="text-slate-500">{log.error_message}</p>
                    )}
                  </div>
                  <div className="shrink-0 text-right font-mono text-[11px] text-slate-500">
                    <div>
                      Found: {log.reviews_found} • Inserted:{" "}
                      {log.reviews_inserted} • Deduped: {log.reviews_duplicated}
                    </div>
                    <div>{new Date(log.started_at).toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
