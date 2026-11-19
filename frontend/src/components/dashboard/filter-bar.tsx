"use client";

import React from "react";
import { Calendar, Filter, RotateCcw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CANONICAL_TOPICS_LIST,
  DashboardFilterParams,
  PropertyItem,
} from "@/lib/types";

interface FilterBarProps {
  filters: DashboardFilterParams;
  properties: PropertyItem[];
  lockPropertySlug?: string;
  onUpdateFilters: (next: Partial<DashboardFilterParams>) => void;
  onResetFilters: () => void;
}

export function FilterBar({
  filters,
  properties,
  lockPropertySlug,
  onUpdateFilters,
  onResetFilters,
}: FilterBarProps) {
  const applyQuickDays = (days: number | null) => {
    if (days === null) {
      onUpdateFilters({ start_date: "", end_date: "" });
      return;
    }
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    onUpdateFilters({
      start_date: start.toISOString().slice(0, 10),
      end_date: end.toISOString().slice(0, 10),
    });
  };

  return (
    <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-azzurro-navy">
          <Filter className="h-3.5 w-3.5 text-azzurro-gold" />
          <span>Operational Intelligence Filters</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-xs text-slate-500">Quick Range:</span>
          <button
            type="button"
            onClick={() => applyQuickDays(null)}
            className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
          >
            All Dates
          </button>
          <button
            type="button"
            onClick={() => applyQuickDays(7)}
            className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
          >
            Last 7d
          </button>
          <button
            type="button"
            onClick={() => applyQuickDays(14)}
            className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
          >
            Last 14d
          </button>
          <button
            type="button"
            onClick={() => applyQuickDays(30)}
            className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
          >
            Last 30d
          </button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onResetFilters}
            className="ml-1 h-7 px-2 text-xs"
          >
            <RotateCcw className="h-3 w-3" />
            Reset
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        {/* Property Filter */}
        {!lockPropertySlug && (
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-slate-500">
              Property
            </label>
            <select
              aria-label="Filter by Property"
              value={filters.property_slug || "all"}
              onChange={(e) =>
                onUpdateFilters({ property_slug: e.target.value })
              }
              className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-azzurro-navy focus:border-azzurro-navy focus:outline-none"
            >
              <option value="all">All 4 Azzurro Properties</option>
              {properties.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.area} — {p.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Sentiment Filter */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-medium text-slate-500">
            Guest Sentiment
          </label>
          <select
            aria-label="Filter by Sentiment"
            value={filters.sentiment || "all"}
            onChange={(e) => onUpdateFilters({ sentiment: e.target.value })}
            className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-azzurro-navy focus:border-azzurro-navy focus:outline-none"
          >
            <option value="all">All Sentiments</option>
            <option value="positive">Positive (7.5 – 10)</option>
            <option value="neutral">Neutral (5.8 – 7.4)</option>
            <option value="negative">Negative (&lt; 5.8)</option>
          </select>
        </div>

        {/* Operational Topic Filter */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-medium text-slate-500">
            Operational Topic
          </label>
          <select
            aria-label="Filter by Operational Topic"
            value={filters.topic || "all"}
            onChange={(e) => onUpdateFilters({ topic: e.target.value })}
            className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-azzurro-navy focus:border-azzurro-navy focus:outline-none"
          >
            <option value="all">All 8 Operational Topics</option>
            {CANONICAL_TOPICS_LIST.map((topic) => (
              <option key={topic} value={topic}>
                {topic}
              </option>
            ))}
          </select>
        </div>

        {/* Start Date */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-medium text-slate-500">
            From Date
          </label>
          <div className="relative">
            <Calendar className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="date"
              aria-label="From Date"
              value={filters.start_date || ""}
              onChange={(e) => onUpdateFilters({ start_date: e.target.value })}
              className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-8 pr-2 text-xs text-azzurro-navy focus:border-azzurro-navy focus:outline-none"
            />
          </div>
        </div>

        {/* End Date */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-medium text-slate-500">
            To Date
          </label>
          <div className="relative">
            <Calendar className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="date"
              aria-label="To Date"
              value={filters.end_date || ""}
              onChange={(e) => onUpdateFilters({ end_date: e.target.value })}
              className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-8 pr-2 text-xs text-azzurro-navy focus:border-azzurro-navy focus:outline-none"
            />
          </div>
        </div>

        {/* Search Input */}
        <div
          className={`flex flex-col gap-1 ${
            lockPropertySlug ? "lg:col-span-2" : ""
          }`}
        >
          <label className="text-[11px] font-medium text-slate-500">
            Keyword Search
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              aria-label="Search reviews"
              placeholder="Search guest feedback..."
              value={filters.search || ""}
              onChange={(e) => onUpdateFilters({ search: e.target.value })}
              className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-8 pr-2.5 text-xs text-azzurro-navy placeholder:text-slate-400 focus:border-azzurro-navy focus:outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
