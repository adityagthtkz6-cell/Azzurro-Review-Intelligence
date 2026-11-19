# Azzurro Review Intelligence

**Booking.com Guest Review Insights & Operational Intelligence Dashboard for Azzurro Hotels**

Azzurro Review Intelligence is a full-stack hospitality review analytics platform built for **Azzurro Hotels** to collect, deduplicate, classify, and analyze guest feedback across four Sydney properties listed on Booking.com:

1. **Surry Hills** — [Sydney City Stay](https://www.booking.com/hotel/au/sydney-city-stay.html) (`surry-hills`)
2. **Potts Point** — [Venus Potts Point](https://www.booking.com/hotel/au/venus-potts-point-sydney.html) (`potts-point`)
3. **Central Sydney** — [Venus Surry Hills](https://www.booking.com/hotel/au/venus-surry-hills.html) (`central-sydney`)
4. **Darling Harbour** — [Chateau de Venus](https://www.booking.com/hotel/au/chateau-de-venus.html) (`darling-harbour`)

---

## 1. Architecture & Tech Stack

### System Architecture
- **Frontend (`frontend/`)**: Next.js 14 (App Router), TypeScript, Tailwind CSS, `shadcn/ui`-compatible component architecture, Recharts data visualizations, and Lucide Icons.
- **Backend (`backend/`)**: Python FastAPI, SQLAlchemy 2.0 ORM, Pydantic v2 (`pydantic-settings`), `psycopg` v3 binary driver, BeautifulSoup4, and Playwright.
- **Database (`docker-compose.yml`)**: PostgreSQL 16 (`postgres:16-alpine`) storing `properties`, `reviews`, and `collection_logs`.

```text
Azzurro Review Intelligence/
├── .env.example               # Root environment template
├── .gitignore                 # Excludes .env files, venv, node_modules, .next, logs
├── docker-compose.yml         # PostgreSQL 16 database service
├── README.md                  # Project documentation
├── backend/                   # Python FastAPI + SQLAlchemy 2.0 + Playwright
│   ├── .env.example
│   ├── requirements.txt
│   ├── tests/
│   │   └── test_phase4_qa.py  # Automated end-to-end API, deduplication & analytics QA suite
│   └── app/
│       ├── main.py            # FastAPI entrypoint, CORS & lifespan schema initializer
│       ├── config.py          # Environment settings, 4 properties & 8 canonical topics
│       ├── database.py        # SQLAlchemy 2.0 engine, session dependency & health probe
│       ├── models/            # Property, Review, and CollectionLog SQLAlchemy models
│       ├── schemas/           # Typed Pydantic v2 request/response schemas
│       ├── services/
│       │   ├── classifier.py  # SHA-256 deduplication hash, sentiment & 8-topic classifier
│       │   ├── collector.py   # Compliant public-page Playwright collector + audit logging
│       │   ├── seed_sample.py # Explicitly labelled sample dataset seeder (is_sample_data=True)
│       │   └── analytics.py   # Weekly ratings, WoW deltas, sentiment trends & negative-review issue %
│       └── api/routes/        # /api/v1/health, /properties, /reviews, /analytics, /collections
└── frontend/                  # Next.js 14 + TypeScript + Tailwind CSS + Recharts
    ├── .env.example
    ├── components.json        # shadcn/ui configuration
    ├── package.json
    ├── tailwind.config.ts     # Azzurro Navy (#0B1D3A), White, and Gold (#C89D54) tokens
    └── src/
        ├── app/
        │   ├── page.tsx                   # Executive Overview Dashboard
        │   └── properties/[slug]/page.tsx # Individual Property Detail Pages (/properties/[slug])
        ├── components/
        │   ├── layout/                    # Navbar & SAMPLE DATA — DEMO MODE provenance banner
        │   ├── dashboard/                 # FilterBar, KpiRibbon, PropertyCardsGrid, OperationalIssuesPanel
        │   ├── charts/                    # WeeklySentimentChart & RatingDistributionChart
        │   ├── reviews/                   # Paginated ReviewFeed with negative-review visual alerts
        │   └── ui/                        # Core UI primitives (Card, Badge, Button)
        └── lib/                           # Typed API client, TypeScript contracts & formatters
```

---

## 2. Prerequisites & Installation

### Prerequisites
- **Docker Desktop** (for running PostgreSQL 16 via Docker Compose) or a local PostgreSQL 16 server on port `5432`
- **Python 3.11+** (tested with Python 3.14 on Windows)
- **Node.js 18+** and `npm`

### Step 1: Start PostgreSQL via Docker Compose
```powershell
cd "c:\Users\Aditya Singh\Downloads\Azzurro Review Intelligence"
docker compose up -d
docker compose ps
```
Verify PostgreSQL is accepting connections on `127.0.0.1:5432`:
```powershell
docker exec azzurro_review_postgres pg_isready -h 127.0.0.1 -p 5432 -U azzurro -d azzurro_reviews
```

### Step 2: Set Up & Start the FastAPI Backend (`http://127.0.0.1:8000`)
```powershell
cd "c:\Users\Aditya Singh\Downloads\Azzurro Review Intelligence\backend"
Copy-Item .env.example .env -ErrorAction SilentlyContinue
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
.\.venv\Scripts\uvicorn.exe app.main:app --reload --host 127.0.0.1 --port 8000
```
- **Interactive Swagger UI**: `http://127.0.0.1:8000/docs`
- **Health Check**: `http://127.0.0.1:8000/api/v1/health`

### Step 3: Set Up & Start the Next.js Frontend (`http://localhost:3000` or `http://localhost:3005`)
```powershell
cd "c:\Users\Aditya Singh\Downloads\Azzurro Review Intelligence\frontend"
Copy-Item .env.example .env.local -ErrorAction SilentlyContinue
npm install
npm run dev
```
*(If port `3000` is in use on your machine, start on port `3005` via `npm run dev -- --port 3005`.)*

---

## 3. API Endpoints Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/health` | Returns service health and live PostgreSQL connectivity (`database_connected: true`). |
| `GET` | `/api/v1/properties` | Lists all 4 configured Azzurro Hotels properties. |
| `GET` | `/api/v1/properties/{slug}` | Returns metadata for `surry-hills`, `potts-point`, `central-sydney`, or `darling-harbour`. |
| `GET` | `/api/v1/analytics/overview` | Computes executive KPIs, 7-day average rating, previous 7-day rating & WoW delta, sentiment breakdown, 10-pt score distribution, 6-week trends, and 8-category operational issue percentages. Supports `property_slug`, `sentiment`, `topic`, `start_date`, `end_date`, `search`, and `data_source`. |
| `GET` | `/api/v1/reviews` | Returns filtered, paginated guest reviews with sentiment, 8-topic tags, negative-issue tags, and explicit `is_sample_data` / `data_source` provenance flags. |
| `POST` | `/api/v1/collections/seed-sample` | Idempotently seeds 33 clearly labelled sample reviews across the 4 properties with SHA-256 deduplication. |
| `POST` | `/api/v1/collections/collect` | Runs the permitted public-page Playwright collector across all 4 properties (or a single `property_slug`), logs results in `collection_logs`, and optionally activates sample fallback if public review cards are gated. |
| `DELETE` | `/api/v1/collections/sample-data` | Deletes all sample reviews (`is_sample_data = true`) while preserving any live collected reviews. |
| `GET` | `/api/v1/collections/logs` | Returns recent collection and sample-seeding audit logs. |

---

## 4. Review Collection Method, Data Provenance & Sample Data Policy

### Permitted Public Collection & Anti-Bot Compliance
- `app/services/collector.py` uses Playwright (automatically attempting bundled Chromium, system Chrome, or Microsoft Edge) to navigate to each property's public Booking.com URL with configurable timeouts and retries.
- **Strict Compliance Policy**: The collector **never** attempts to bypass CAPTCHA challenges, AWS WAF / Cloudflare anti-bot gates, authentication prompts, or access restrictions.
- When Booking.com gates guest review subpages behind anti-bot challenges or dynamic modal walls without rendering inline public review cards on the landing HTML, the collector halts cleanly, records the exact outcome (`blocked_or_unavailable` or `sample_fallback`) in the `collection_logs` table, and preserves the clearly labelled sample dataset.

### Data Provenance & Sample Data Transparency
- Every record in the `reviews` table carries two mandatory provenance columns:
  - `is_sample_data` (`Boolean`, indexed)
  - `data_source` (`"booking_public"` vs `"sample_seed"`)
- Whenever sample data is present in the active filter scope:
  1. The API returns `data_mode: "sample"` (or `"mixed"`) and `is_sample_data_active: true`.
  2. The frontend renders a prominent amber **`SAMPLE DATA — DEMO MODE`** banner in both the top navigation bar and the executive alert header.
  3. Every individual sample review card displays a **`SAMPLE DATA`** badge so sample data is never misrepresented as live Booking.com data.

### Deduplication & Analytics Methodology
- **SHA-256 Deduplication (`dedup_hash`)**: Computed from normalized property ID, external review ID (or reviewer name + review publication date + title + positive/negative text snippets) with a `UNIQUE` database constraint. Running the seeder or collector repeatedly inserts `0` duplicates.
- **Weekly Ratings**: Calculated using review publication dates (`review_date`) over the rolling 7-day window compared against the immediately preceding 7-day window.
- **Operational Issue Percentage Formula**:
  $$\text{Issue \% (Topic } T\text{)} = \frac{\text{Negative Reviews raising Topic } T \text{ in negative feedback}}{\text{Total Negative Reviews in Scope}} \times 100$$
  across the 8 canonical categories: `Cleanliness`, `Check-in`, `Staff`, `Noise`, `Facilities`, `Location`, `Room condition`, and `Value for money`.

---

## 5. Limitations & Assumptions

1. **Booking.com Anti-Bot & Dynamic Review Subpages**: Booking.com frequently protects full review pagination behind AWS WAF / challenge tokens or asynchronous GraphQL modals. Per compliance rules, our collector does not spoof tokens or bypass challenges; it logs the restriction transparently and uses the sample dataset fallback.
2. **Keyword-Driven Deterministic NLP Classifier**: Sentiment and the 8 operational topics are classified deterministically in `app/services/classifier.py` using Booking.com's 10-point score thresholds (`>= 7.5` Positive, `5.8 – 7.4` Neutral, `< 5.8` Negative) combined with hospitality domain lexicons so classification requires zero paid external LLM API keys.
3. **Rolling 7-Day Window Anchor**: To keep weekly comparisons consistent across static or historical datasets, the 7-day rolling window anchors on the most recent review publication date in the active filter scope.

---

## 6. Troubleshooting

- **`database_connected: false` on `/api/v1/health`**:
  1. Ensure Docker Desktop is running.
  2. Check if another container is using port `5432` (`docker ps`). Stop conflicting containers and run `docker compose up -d --force-recreate`.
  3. Ensure `DATABASE_URL` in `backend/.env` points to `127.0.0.1:5432` rather than `localhost:5432` on Windows to avoid IPv6 loopback delays.
- **`Port 3000 is already in use` when starting Next.js**:
  - Run `npm run dev -- --port 3005`. Both `http://localhost:3000` and `http://localhost:3005` are pre-whitelisted in `CORS_ORIGINS`.
- **Playwright Browser Binary Missing**:
  - The collector automatically falls back to system Chrome (`channel="chrome"`) or Edge (`channel="msedge"`). To install Playwright's standalone Chromium binary, run:
    ```powershell
    cd backend
    .\.venv\Scripts\playwright.exe install chromium
    ```
