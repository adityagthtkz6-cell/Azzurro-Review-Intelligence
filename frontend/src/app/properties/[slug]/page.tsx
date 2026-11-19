"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  ExternalLink,
  MapPin,
  RefreshCw,
} from "lucide-react";
import { RatingDistributionChart } from "@/components/charts/rating-distribution-chart";
import { WeeklySentimentChart } from "@/components/charts/weekly-sentiment-chart";
import { FilterBar } from "@/components/dashboard/filter-bar";
import { KpiRibbon } from "@/components/dashboard/kpi-ribbon";
import { OperationalIssuesPanel } from "@/components/dashboard/operational-issues-panel";
import { DataSourceBanner } from "@/components/layout/data-source-banner";
import { Navbar } from "@/components/layout/navbar";
import { ReviewFeed } from "@/components/reviews/review-feed";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  clearSampleData,
  fetchAnalyticsOverview,
  fetchCollectionLogs,
  fetchProperties,
  fetchPropertyBySlug,
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

export default function PropertyDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug || "";

  const [filters, setFilters] = useState<DashboardFilterParams>({
    property_slug: slug,
    sentiment: "all",
    topic: "all",
    start_date: "",
    end_date: "",
    search: "",
    data_source: "all",
  });
  const [page, setPage] = useState<number>(1);

  const [property, setProperty] = useState<PropertyItem | null>(null);
  const [allProperties, setAllProperties] = useState<PropertyItem[]>([]);
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

  const loadPropertyPage = useCallback(
    async (
      targetSlug: string,
      activeFilters: DashboardFilterParams,
      activePage: number
    ) => {
      if (!targetSlug) return;
      setIsLoading(true);
      setApiError(null);
      try {
        const scopedFilters = { ...activeFilters, property_slug: targetSlug };
        const [propRes, allPropsRes, overviewRes, reviewsRes, logsRes] =
          await Promise.all([
            fetchPropertyBySlug(targetSlug),
            fetchProperties(),
            fetchAnalyticsOverview(scopedFilters),
            fetchReviews({ ...scopedFilters, page: activePage, page_size: 8 }),
            fetchCollectionLogs(12),
          ]);
        setProperty(propRes);
        setAllProperties(allPropsRes);
        setOverview(overviewRes);
        setReviewsData(reviewsRes);
        setLogs(logsRes.filter((l) => !l.property_slug || l.property_slug === targetSlug));
      } catch (err) {
        setApiError(
          err instanceof Error
            ? err.message
            : "Failed to load property insights."
        );
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    setFilters((prev) => ({ ...prev, property_slug: slug }));
    setPage(1);
  }, [slug]);

  useEffect(() => {
    loadPropertyPage(slug, filters, page);
  }, [slug, filters, page, loadPropertyPage]);

  const handleUpdateFilters = (next: Partial<DashboardFilterParams>) => {
    setPage(1);
    setFilters((prev) => ({ ...prev, ...next, property_slug: slug }));
  };

  const handleResetFilters = () => {
    setPage(1);
    setFilters({
      property_slug: slug,
      sentiment: "all",
      topic: "all",
      start_date: "",
      end_date: "",
      search: "",
      data_source: "all",
    });
  };

  const handleSeedSample = async () => {
    setIsActionLoading(true);
    setActionFeedback(null);
    try {
      const res = await seedSampleData(slug);
      setActionFeedback(
        `Sample seed for ${property?.name || slug}: ${res.reviews_inserted} inserted, ${res.reviews_duplicated} deduplicated.`
      );
      await loadPropertyPage(slug, filters, 1);
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
      const resLogs = await triggerPublicCollection(slug, true);
      const firstLog = resLogs[0];
      setActionFeedback(
        firstLog?.used_sample_fallback
          ? `Collection run for ${property?.name || slug}: Public page reviews gated/unavailable; clearly labelled sample fallback verified.`
          : `Collection run for ${property?.name || slug}: ${firstLog?.reviews_inserted ?? 0} live reviews inserted.`
      );
      await loadPropertyPage(slug, filters, 1);
    } catch (err) {
      setActionFeedback(
        err instanceof Error ? err.message : "Collection trigger failed."
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
        `Cleared ${res.deleted_sample_reviews} sample reviews from database.`
      );
      await loadPropertyPage(slug, filters, 1);
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
        {/* Top Breadcrumb & Property Switcher */}
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-azzurro-navy hover:text-azzurro-ocean"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Executive Overview Dashboard
          </Link>

          <div className="flex flex-wrap items-center gap-1.5">
            {allProperties.map((p) => (
              <Link
                key={p.slug}
                href={`/properties/${p.slug}`}
                className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
                  p.slug === slug
                    ? "border-azzurro-navy bg-azzurro-navy text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:border-azzurro-navy/40"
                }`}
              >
                {p.area}
              </Link>
            ))}
          </div>
        </div>

        {/* Property Hero Header */}
        {property && (
          <div className="rounded-xl border border-slate-200/90 bg-white p-6 shadow-sm">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="navy">
                    <MapPin className="h-3 w-3 text-azzurro-gold" />
                    {property.area}, {property.city}
                  </Badge>
                  <Badge tone="outline">Property ID #{property.id}</Badge>
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-azzurro-navy">
                  {property.name}
                </h1>
                <p className="text-xs text-slate-500">
                  Dedicated Booking.com review intelligence, weekly sentiment
                  trajectory, and negative-review issue breakdown
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <a
                  href={property.booking_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-azzurro-navy hover:bg-slate-100"
                >
                  <span>Open Booking.com Listing</span>
                  <ExternalLink className="h-3.5 w-3.5 text-azzurro-ocean" />
                </a>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadPropertyPage(slug, filters, page)}
                  disabled={isLoading}
                >
                  <RefreshCw
                    className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`}
                  />
                  Refresh
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {apiError && (
          <div className="rounded-xl border border-rose-300 bg-rose-50 p-6 text-rose-950 shadow-sm">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
              <div className="space-y-2">
                <h3 className="text-sm font-bold">
                  Unable to Load Property Analytics
                </h3>
                <p className="text-xs text-rose-800">{apiError}</p>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => loadPropertyPage(slug, filters, page)}
                >
                  Retry
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && !overview && !apiError && (
          <div className="space-y-4">
            <div className="h-24 animate-pulse rounded-xl bg-slate-200/70" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className="h-28 animate-pulse rounded-xl bg-slate-200/70"
                />
              ))}
            </div>
          </div>
        )}

        {/* Property Analytics Content */}
        {overview && !apiError && (
          <>
            <DataSourceBanner
              dataMode={overview.data_mode}
              isSampleDataActive={overview.is_sample_data_active}
              totalReviews={overview.total_reviews}
              propertySlug={slug}
              logs={logs}
              isActionLoading={isActionLoading}
              actionFeedback={actionFeedback}
              onSeedSample={handleSeedSample}
              onRunCollector={handleRunCollector}
              onClearSample={handleClearSample}
            />

            <FilterBar
              filters={filters}
              properties={allProperties}
              lockPropertySlug={slug}
              onUpdateFilters={handleUpdateFilters}
              onResetFilters={handleResetFilters}
            />

            <KpiRibbon overview={overview} />

            <div className="grid gap-6 lg:grid-cols-2">
              <WeeklySentimentChart data={overview.weekly_trends} />
              <RatingDistributionChart buckets={overview.rating_distribution} />
            </div>

            <OperationalIssuesPanel
              issues={overview.operational_issues}
              selectedTopic={filters.topic || "all"}
              onSelectTopic={(topic: CanonicalTopic | "all") =>
                handleUpdateFilters({ topic })
              }
            />

            {reviewsData && (
              <ReviewFeed
                reviewsData={reviewsData}
                onPageChange={(nextPage) => setPage(nextPage)}
                onTopicClick={(topic) => handleUpdateFilters({ topic })}
                hidePropertyLink={true}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
