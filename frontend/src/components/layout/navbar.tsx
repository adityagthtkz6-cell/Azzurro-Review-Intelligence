"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, LayoutDashboard, ShieldAlert, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DataMode } from "@/lib/types";

interface NavbarProps {
  apiOnline?: boolean;
  dataMode?: DataMode;
}

const PROPERTY_LINKS = [
  { slug: "surry-hills", label: "Surry Hills" },
  { slug: "potts-point", label: "Potts Point" },
  { slug: "central-sydney", label: "Central Sydney" },
  { slug: "darling-harbour", label: "Darling Harbour" },
];

export function Navbar({ apiOnline = true, dataMode = "sample" }: NavbarProps) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-azzurro-navy text-white shadow-md">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3.5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-azzurro-ocean ring-1 ring-white/15">
              <Building2 className="h-5 w-5 text-azzurro-gold" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-semibold tracking-tight text-white">
                  Azzurro Review Intelligence
                </span>
                <span className="hidden rounded bg-azzurro-gold/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-azzurro-gold sm:inline-block">
                  Azzurro Hotels
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Booking.com Guest Sentiment &amp; Operational Insights
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-2 lg:hidden">
            {dataMode === "sample" || dataMode === "mixed" ? (
              <Badge tone="sample">
                <ShieldAlert className="h-3.5 w-3.5" />
                Sample Data
              </Badge>
            ) : dataMode === "live" ? (
              <Badge tone="positive">
                <Sparkles className="h-3.5 w-3.5" />
                Live Data
              </Badge>
            ) : null}
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex flex-wrap items-center gap-1.5 text-xs font-medium">
          <Link
            href="/"
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-colors ${
              pathname === "/"
                ? "bg-white text-azzurro-navy font-semibold shadow-sm"
                : "text-slate-200 hover:bg-white/10"
            }`}
          >
            <LayoutDashboard className="h-3.5 w-3.5" />
            Overview
          </Link>
          {PROPERTY_LINKS.map((prop) => {
            const href = `/properties/${prop.slug}`;
            const active = pathname === href;
            return (
              <Link
                key={prop.slug}
                href={href}
                className={`rounded-lg px-3 py-1.5 transition-colors ${
                  active
                    ? "bg-azzurro-gold text-azzurro-deep font-semibold shadow-sm"
                    : "text-slate-200 hover:bg-white/10"
                }`}
              >
                {prop.label}
              </Link>
            );
          })}
        </nav>

        {/* Status Pills */}
        <div className="hidden items-center gap-3 lg:flex">
          {dataMode === "sample" || dataMode === "mixed" ? (
            <Badge
              tone="sample"
              title="Sample data is currently active and clearly distinguished from live Booking.com data."
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              SAMPLE DATA — DEMO MODE
            </Badge>
          ) : dataMode === "live" ? (
            <Badge tone="positive">
              <Sparkles className="h-3.5 w-3.5" />
              Live Public Data
            </Badge>
          ) : (
            <Badge tone="outline">Empty Dataset</Badge>
          )}

          <div className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-slate-200">
            <span
              className={`h-2 w-2 rounded-full ${
                apiOnline ? "bg-emerald-400" : "bg-rose-400"
              }`}
            />
            <span>{apiOnline ? "API Online" : "API Unreachable"}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
