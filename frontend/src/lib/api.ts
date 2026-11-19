import {
  CollectionLogItem,
  DashboardFilterParams,
  DashboardOverviewResponse,
  HealthStatus,
  PaginatedReviewResponse,
  PropertyItem,
} from "./types";

const API_BASE_URL =
  typeof window !== "undefined"
    ? process.env.NEXT_PUBLIC_API_BASE_URL || "/api/v1"
    : process.env.BACKEND_INTERNAL_URL
    ? `${process.env.BACKEND_INTERNAL_URL}/api/v1`
    : "http://127.0.0.1:8000/api/v1";

function buildQueryString(params: Record<string, string | number | boolean | undefined | null>): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (
      value !== undefined &&
      value !== null &&
      value !== "" &&
      value !== "all"
    ) {
      searchParams.set(key, String(value));
    }
  }
  const qs = searchParams.toString();
  return qs ? `?${qs}` : "";
}

export async function fetchHealth(): Promise<HealthStatus | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/health`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as HealthStatus;
  } catch {
    return null;
  }
}

export async function fetchProperties(): Promise<PropertyItem[]> {
  const res = await fetch(`${API_BASE_URL}/properties`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch properties (HTTP ${res.status})`);
  }
  return (await res.json()) as PropertyItem[];
}

export async function fetchPropertyBySlug(slug: string): Promise<PropertyItem> {
  const res = await fetch(`${API_BASE_URL}/properties/${encodeURIComponent(slug)}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Property '${slug}' not found (HTTP ${res.status})`);
  }
  return (await res.json()) as PropertyItem;
}

export async function fetchAnalyticsOverview(
  filters: DashboardFilterParams = {}
): Promise<DashboardOverviewResponse> {
  const qs = buildQueryString({
    property_slug: filters.property_slug,
    sentiment: filters.sentiment,
    topic: filters.topic,
    start_date: filters.start_date,
    end_date: filters.end_date,
    search: filters.search,
    data_source: filters.data_source,
  });
  const res = await fetch(`${API_BASE_URL}/analytics/overview${qs}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Analytics API error (HTTP ${res.status})`);
  }
  return (await res.json()) as DashboardOverviewResponse;
}

export async function fetchReviews(
  filters: DashboardFilterParams & { page?: number; page_size?: number } = {}
): Promise<PaginatedReviewResponse> {
  const qs = buildQueryString({
    property_slug: filters.property_slug,
    sentiment: filters.sentiment,
    topic: filters.topic,
    start_date: filters.start_date,
    end_date: filters.end_date,
    search: filters.search,
    data_source: filters.data_source,
    page: filters.page ?? 1,
    page_size: filters.page_size ?? 8,
  });
  const res = await fetch(`${API_BASE_URL}/reviews${qs}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Reviews API error (HTTP ${res.status})`);
  }
  return (await res.json()) as PaginatedReviewResponse;
}

export async function seedSampleData(propertySlug?: string): Promise<{
  status: string;
  reviews_found: number;
  reviews_inserted: number;
  reviews_duplicated: number;
}> {
  const qs = buildQueryString({ property_slug: propertySlug });
  const res = await fetch(`${API_BASE_URL}/collections/seed-sample${qs}`, {
    method: "POST",
  });
  if (!res.ok) {
    throw new Error(`Failed to seed sample data (HTTP ${res.status})`);
  }
  return await res.json();
}

export async function clearSampleData(): Promise<{
  status: string;
  deleted_sample_reviews: number;
}> {
  const res = await fetch(`${API_BASE_URL}/collections/sample-data`, {
    method: "DELETE",
  });
  if (!res.ok) {
    throw new Error(`Failed to clear sample data (HTTP ${res.status})`);
  }
  return await res.json();
}

export async function triggerPublicCollection(
  propertySlug?: string,
  useSampleFallback: boolean = true
): Promise<CollectionLogItem[]> {
  const qs = buildQueryString({
    property_slug: propertySlug,
    use_sample_fallback: useSampleFallback,
  });
  const res = await fetch(`${API_BASE_URL}/collections/collect${qs}`, {
    method: "POST",
  });
  if (!res.ok) {
    throw new Error(`Collection request failed (HTTP ${res.status})`);
  }
  return (await res.json()) as CollectionLogItem[];
}

export async function fetchCollectionLogs(
  limit: number = 12
): Promise<CollectionLogItem[]> {
  const res = await fetch(`${API_BASE_URL}/collections/logs?limit=${limit}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Failed to load collection logs (HTTP ${res.status})`);
  }
  return (await res.json()) as CollectionLogItem[];
}
