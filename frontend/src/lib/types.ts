export type SentimentType = "positive" | "neutral" | "negative";

export type CanonicalTopic =
  | "Cleanliness"
  | "Check-in"
  | "Staff"
  | "Noise"
  | "Facilities"
  | "Location"
  | "Room condition"
  | "Value for money";

export const CANONICAL_TOPICS_LIST: CanonicalTopic[] = [
  "Cleanliness",
  "Check-in",
  "Staff",
  "Noise",
  "Facilities",
  "Location",
  "Room condition",
  "Value for money",
];

export type DataMode = "sample" | "live" | "mixed" | "empty";

export interface PropertyItem {
  id: number;
  slug: string;
  name: string;
  area: string;
  city: string;
  country: string;
  booking_url: string;
  created_at: string;
  updated_at: string;
}

export interface PropertyCardSummary extends PropertyItem {
  total_reviews: number;
  avg_weekly_rating: number | null;
  previous_week_rating: number | null;
  weekly_rating_delta: number | null;
  overall_avg_rating: number | null;
  positive_count: number;
  neutral_count: number;
  negative_count: number;
  top_issue: string | null;
  has_sample_data: boolean;
  has_live_data: boolean;
}

export interface ReviewItem {
  id: number;
  property_id: number;
  property_slug?: string;
  property_name?: string;
  property_area?: string;
  external_review_id?: string | null;
  dedup_hash: string;
  reviewer_name: string;
  reviewer_country?: string | null;
  room_type?: string | null;
  stay_duration?: string | null;
  stay_date?: string | null;
  review_date: string;
  rating: number;
  title?: string | null;
  positive_text?: string | null;
  negative_text?: string | null;
  full_text?: string | null;
  sentiment: SentimentType;
  topics: CanonicalTopic[];
  negative_topics: CanonicalTopic[];
  is_sample_data: boolean;
  data_source: "booking_public" | "sample_seed";
  collected_at: string;
}

export interface PaginatedReviewResponse {
  items: ReviewItem[];
  total: number;
  page: number;
  page_size: number;
  data_mode: DataMode;
}

export interface SentimentSummary {
  positive_count: number;
  neutral_count: number;
  negative_count: number;
  positive_pct: number;
  neutral_pct: number;
  negative_pct: number;
}

export interface RatingBucket {
  bucket_label: string;
  min_score: number;
  max_score: number;
  count: number;
  percentage: number;
}

export interface WeeklyTrendPoint {
  week_start: string;
  week_label: string;
  total_reviews: number;
  avg_rating: number | null;
  positive_count: number;
  neutral_count: number;
  negative_count: number;
}

export interface OperationalIssueMetric {
  topic: CanonicalTopic;
  negative_mentions: number;
  total_negative_reviews_denominator: number;
  issue_percentage_of_negative: number;
  total_mentions_all_sentiments: number;
}

export interface DashboardOverviewResponse {
  data_mode: DataMode;
  is_sample_data_active: boolean;
  total_reviews: number;
  avg_weekly_rating: number | null;
  previous_week_rating: number | null;
  weekly_rating_delta: number | null;
  overall_avg_rating: number | null;
  sentiment: SentimentSummary;
  rating_distribution: RatingBucket[];
  weekly_trends: WeeklyTrendPoint[];
  operational_issues: OperationalIssueMetric[];
  properties: PropertyCardSummary[];
}

export interface CollectionLogItem {
  id: number;
  property_id: number | null;
  property_slug: string | null;
  property_name: string | null;
  started_at: string;
  completed_at: string | null;
  status: string;
  reviews_found: number;
  reviews_inserted: number;
  reviews_duplicated: number;
  error_type: string | null;
  error_message: string | null;
  used_sample_fallback: boolean;
}

export interface HealthStatus {
  status: string;
  service: string;
  environment: string;
  database_connected: boolean;
  timestamp: string;
}

export interface DashboardFilterParams {
  property_slug?: string;
  sentiment?: string;
  topic?: string;
  start_date?: string;
  end_date?: string;
  search?: string;
  data_source?: string;
}
