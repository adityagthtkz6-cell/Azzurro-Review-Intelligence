"use client";

import React, { useCallback, useEffect, useState } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { RatingDistributionChart } from "@/components/charts/rating-distribution-chart";
import { WeeklySentimentChart } from "@/components/charts/weekly-sentiment-chart";
import { FilterBar } from "@/components/dashboard/filter-bar";
import { KpiRibbon } from "@/components/dashboard/kpi-ribbon";
import { OperationalIssuesPanel } from "@/components/dashboard/operational-issues-panel";
import { PropertyCardsGrid } from "@/components/dashboard/property-cards-grid";
import { DataSourceBanner } from "@/components/layout/data-source-banner";
import { Navbar } from "@/components/layout/navbar";
import { ReviewFeed } from "@/components/reviews/review-feed";
import { Button } from "@/components/ui/button";
import {
  clearSampleData,
  fetchAnalyticsOverview,
  fetchCollectionLogs,
  fetchProperties,
  fetchReviews,
  seedSampleData,
  triggerPublicCollection,
} from "@/lib/api";
import {
  CanonicalTopic,
  CollectionLogItem,
  DashboardFilterParams,
  DashboardOverviewResponse,
  PaginatedReviewResponse,
  PropertyItem,
} from "@/lib/types";

const INITIAL_FILTERS: DashboardFilterParams = {
  property_slug: "all",
  sentiment: "all",
  topic: "all",
  start_date: "",
  end_date: "",
  search: "",
  data_source: "all",
};

export default function ExecutiveDashboardPage() {
  const [filters, setFilters] =
    useState<DashboardFilterParams>(INITIAL_FILTERS);
  const [page, setPage] = useState<number>(1);

  const [properties, setProperties] = useState<PropertyItem[]>([]);
  const [overview, setOverview] = useState<DashboardOverviewResponse | null>(
    null
  );
  const [reviewsData, setReviewsData] =
    useState<PaginatedReviewResponse | null>(null);
  const [logs, setLogs] = useState<CollectionLogItem[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const loadDashboardData = useCallback(
    async (activeFilters: DashboardFilterParams, activePage: number) => {
      setIsLoading(true);
      setApiError(null);
      try {
        const [propsRes, overviewRes, reviewsRes, logsRes] = await Promise.all([
          fetchProperties(),
          fetchAnalyticsOverview(activeFilters),
          fetchReviews({ ...activeFilters, page: activePage, page_size: 8 }),
          fetchCollectionLogs(12),
        ]);
        setProperties(propsRes);
        setOverview(overviewRes);
        setReviewsData(reviewsRes);
        setLogs(logsRes);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Unable to connect to the FastAPI backend.";
        setApiError(message);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    loadDashboardData(filters, page);
  }, [filters, page, loadDashboardData]);

  const handleUpdateFilters = (next: Partial<DashboardFilterParams>) => {
    setPage(1);
    setFilters((prev) => ({ ...prev, ...next }));
  };

  const handleResetFilters = () => {
    setPage(1);
    setFilters(INITIAL_FILTERS);
  };

  const handleSeedSample = async () => {
    setIsActionLoading(true);
    setActionFeedback(null);
    try {
      const targetProp =
        filters.property_slug && filters.property_slug !== "all"
          ? filters.property_slug
          : undefined;
      const res = await seedSampleData(targetProp);
      setActionFeedback(
        `Sample seed complete: ${res.reviews_inserted} inserted, ${res.reviews_duplicated} deduplicated (all tagged is_sample_data=true).`
      );
      await loadDashboardData(filters, 1);
    } catch (err) {
      setActionFeedback(
        err instanceof Error ? err.message : "Failed to seed sample data."
      );
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRunCollector = async () => {
    setIsActionLoading(true);
    setActionFeedback(null);
    try {
      const targetProp =
        filters.property_slug && filters.property_slug !== "all"
          ? filters.property_slug
          : undefined;
      const resLogs = await triggerPublicCollection(targetProp, true);
      const insertedTotal = resLogs.reduce(
        (acc, l) => acc + l.reviews_inserted,
        0
      );
      const fallbackUsed = resLogs.some((l) => l.used_sample_fallback);
      setActionFeedback(
        fallbackUsed
          ? `Public collector completed across ${resLogs.length} property(s): Booking.com inline review cards were gated/unavailable without interactive challenge; sample data fallback verified and logged.`
          : `Public collector completed across ${resLogs.length} property(s): ${insertedTotal} new public reviews inserted.`
      );
      await loadDashboardData(filters, 1);
    } catch (err) {
      setActionFeedback(
        err instanceof Error ? err.message : "Public collection request failed."
      );
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleClearSample = async () => {
    setIsActionLoading(true);
    setActionFeedback(null);
    try {
      const res = await clearSampleData();
      setActionFeedback(
        `Removed ${res.deleted_sample_reviews} sample reviews from PostgreSQL.`
      );
      await loadDashboardData(filters, 1);
    } catch (err) {
      setActionFeedback(
        err instanceof Error ? err.message : "Failed to clear sample data."
      );
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/70">
      <Navbar
        apiOnline={!apiError}
        dataMode={overview?.data_mode ?? "empty"}
      />

      <main className="mx-auto w-full max-w-7xl flex-1 space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-azzurro-navy">
              Executive Review Intelligence Overview
            </h1>
            <p className="text-xs text-slate-600">
              Booking.com guest sentiment, weekly rating comparisons, and
              8-category operational issue diagnostics across Azzurro Hotels
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadDashboardData(filters, page)}
            disabled={isLoading}
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh Data
          </Button>
        </div>

        {/* API Error State (Never shows fabricated data when API is down) */}
        {apiError && (
          <div className="rounded-xl border border-rose-300 bg-rose-50 p-6 text-rose-950 shadow-sm">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
              <div className="space-y-2">
                <h3 className="text-sm font-bold">
                  Backend API Connection Error — No Fabricated Analytics Shown
                </h3>
                <p className="text-xs text-rose-800">
                  Could not load live data from FastAPI ({apiError}). Please
                  ensure PostgreSQL (`docker compose up -d`) and the FastAPI
                  server (`uvicorn app.main:app --port 8000`) are running.
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => loadDashboardData(filters, page)}
                >
                  Retry Connection
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && !overview && !apiError && (
          <div className="space-y-4">
            <div className="h-20 animate-pulse rounded-xl bg-slate-200/70" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className="h-28 animate-pulse rounded-xl bg-slate-200/70"
                />
              ))}
            </div>
            <div className="h-72 animate-pulse rounded-xl bg-slate-200/70" />
          </div>
        )}

        {/* Main Dashboard Content */}
        {overview && !apiError && (
          <>
            {/* Explicit SAMPLE DATA — DEMO MODE or Live Provenance Banner */}
            <DataSourceBanner
              dataMode={overview.data_mode}
              isSampleDataActive={overview.is_sample_data_active}
              totalReviews={overview.total_reviews}
              logs={logs}
              isActionLoading={isActionLoading}
              actionFeedback={actionFeedback}
              onSeedSample={handleSeedSample}
              onRunCollector={handleRunCollector}
              onClearSample={handleClearSample}
            />

            {/* Global Filter Bar */}
            <FilterBar
              filters={filters}
              properties={properties}
              onUpdateFilters={handleUpdateFilters}
              onResetFilters={handleResetFilters}
            />

            {/* Top Executive KPI Cards */}
            <KpiRibbon overview={overview} />

            {/* Four Azzurro Property Cards */}
            <PropertyCardsGrid
              properties={overview.properties}
              selectedSlug={filters.property_slug || "all"}
              onSelectPropertyFilter={(slug) =>
                handleUpdateFilters({ property_slug: slug })
              }
            />

            {/* Weekly Sentiment Trend Chart & Rating Distribution Chart */}
            <div className="grid gap-6 lg:grid-cols-2">
              <WeeklySentimentChart data={overview.weekly_trends} />
              <RatingDistributionChart
                buckets={overview.rating_distribution}
                properties={overview.properties}
              />
            </div>

            {/* Operational Issue Analysis (Negative reviews denominator) */}
            <OperationalIssuesPanel
              issues={overview.operational_issues}
              selectedTopic={filters.topic || "all"}
              onSelectTopic={(topic: CanonicalTopic | "all") =>
                handleUpdateFilters({ topic })
              }
            />

            {/* Paginated Guest Review Feed */}
            {reviewsData && (
              <ReviewFeed
                reviewsData={reviewsData}
                onPageChange={(nextPage) => setPage(nextPage)}
                onTopicClick={(topic) => handleUpdateFilters({ topic })}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
