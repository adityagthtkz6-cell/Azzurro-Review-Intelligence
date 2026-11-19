import json
import httpx

BASE_URL = "http://127.0.0.1:8000/api/v1"


def run_phase4_qa() -> None:
    with httpx.Client(timeout=120.0) as client:
        print("=== 1. REVIEW COLLECTION VERIFICATION (ALL 4 PROPERTIES) ===")
        r_col = client.post(f"{BASE_URL}/collections/collect?use_sample_fallback=true")
        print(f"POST /collections/collect -> HTTP {r_col.status_code}")
        assert r_col.status_code == 200
        col_logs = r_col.json()
        assert len(col_logs) == 4
        for log in col_logs:
            print(
                json.dumps(
                    {
                        "property_slug": log["property_slug"],
                        "status": log["status"],
                        "reviews_found": log["reviews_found"],
                        "reviews_inserted": log["reviews_inserted"],
                        "reviews_duplicated": log["reviews_duplicated"],
                        "error_type": log["error_type"],
                        "error_message": log["error_message"],
                        "used_sample_fallback": log["used_sample_fallback"],
                    }
                )
            )

        print("\n=== 2. LIVE VS SAMPLE PROVENANCE CHECK ===")
        r_live = client.get(f"{BASE_URL}/reviews?data_source=live").json()
        r_samp = client.get(f"{BASE_URL}/reviews?data_source=sample").json()
        print(
            f"Live reviews (is_sample_data=false): {r_live['total']} (data_mode={r_live['data_mode']})"
        )
        print(
            f"Sample reviews (is_sample_data=true): {r_samp['total']} (data_mode={r_samp['data_mode']})"
        )
        assert all(item["is_sample_data"] is True for item in r_samp["items"])
        assert all(item["data_source"] == "sample_seed" for item in r_samp["items"])

        print("\n=== 3. DUPLICATE PREVENTION QA (RUN SEED TWICE) ===")
        s1 = client.post(f"{BASE_URL}/collections/seed-sample").json()
        s2 = client.post(f"{BASE_URL}/collections/seed-sample").json()
        print("Seed Run 1:", json.dumps(s1))
        print("Seed Run 2:", json.dumps(s2))
        assert s1["reviews_inserted"] == 0 and s1["reviews_duplicated"] == 33
        assert s2["reviews_inserted"] == 0 and s2["reviews_duplicated"] == 33

        print("\n=== 4. PROPERTY COUNTS & WEEKLY RATING QA ===")
        ov = client.get(f"{BASE_URL}/analytics/overview").json()
        print(
            f"Overview total_reviews={ov['total_reviews']}, data_mode={ov['data_mode']}, "
            f"avg_weekly={ov['avg_weekly_rating']}, prev_weekly={ov['previous_week_rating']}, "
            f"delta={ov['weekly_rating_delta']}, overall_avg={ov['overall_avg_rating']}"
        )
        assert ov["total_reviews"] == 33
        expected_counts = {
            "surry-hills": 9,
            "potts-point": 8,
            "central-sydney": 8,
            "darling-harbour": 8,
        }
        for p in ov["properties"]:
            slug = p["slug"]
            print(
                f"Property {slug}: total={p['total_reviews']} (expected {expected_counts[slug]}), "
                f"weekly={p['avg_weekly_rating']}, prev={p['previous_week_rating']}, "
                f"delta={p['weekly_rating_delta']}, top_issue={p['top_issue']}, "
                f"has_sample={p['has_sample_data']}, has_live={p['has_live_data']}"
            )
            assert p["total_reviews"] == expected_counts[slug]

        print("\n=== 5. NEGATIVE-TOPIC DENOMINATOR QA ===")
        neg_total = ov["sentiment"]["negative_count"]
        for iss in ov["operational_issues"]:
            assert iss["total_negative_reviews_denominator"] == neg_total
            expected_pct = round((iss["negative_mentions"] / neg_total) * 100, 1)
            assert iss["issue_percentage_of_negative"] == expected_pct
            print(
                f"Topic '{iss['topic']}': {iss['negative_mentions']}/{iss['total_negative_reviews_denominator']} "
                f"negative reviews = {iss['issue_percentage_of_negative']}% "
                f"(all-sentiment mentions: {iss['total_mentions_all_sentiments']})"
            )

        print("\n=== 6. FILTER & EDGE-CASE QA ===")
        f_prop = client.get(
            f"{BASE_URL}/analytics/overview?property_slug=surry-hills"
        ).json()
        print(f"Filter property_slug=surry-hills -> total_reviews={f_prop['total_reviews']}")
        assert f_prop["total_reviews"] == 9

        f_sent = client.get(
            f"{BASE_URL}/analytics/overview?sentiment=negative"
        ).json()
        print(
            f"Filter sentiment=negative -> total_reviews={f_sent['total_reviews']}, "
            f"negative_pct={f_sent['sentiment']['negative_pct']}%"
        )
        assert f_sent["total_reviews"] == 8
        assert f_sent["sentiment"]["negative_pct"] == 100.0

        f_top = client.get(
            f"{BASE_URL}/analytics/overview?topic=Cleanliness"
        ).json()
        print(f"Filter topic=Cleanliness -> total_reviews={f_top['total_reviews']}")
        assert f_top["total_reviews"] == 23

        f_kw = client.get(f"{BASE_URL}/reviews?search=lockbox").json()
        print(f"Filter search=lockbox -> total_reviews={f_kw['total']}")
        assert f_kw["total"] == 2

        f_date = client.get(
            f"{BASE_URL}/analytics/overview?start_date=2026-11-12&end_date=2026-11-19"
        ).json()
        print(
            f"Filter date 2026-11-12..2026-11-19 -> total_reviews={f_date['total_reviews']}"
        )
        assert f_date["total_reviews"] > 0

        f_empty = client.get(
            f"{BASE_URL}/analytics/overview?start_date=2024-01-01&end_date=2024-01-07"
        ).json()
        print(
            f"Filter empty date range 2024-01-01..2024-01-07 -> "
            f"total_reviews={f_empty['total_reviews']}, data_mode={f_empty['data_mode']}, "
            f"avg_weekly_rating={f_empty['avg_weekly_rating']}, "
            f"max_issue_pct={max(i['issue_percentage_of_negative'] for i in f_empty['operational_issues'])}"
        )
        assert f_empty["total_reviews"] == 0
        assert f_empty["data_mode"] == "empty"
        assert f_empty["avg_weekly_rating"] is None
        assert all(
            i["issue_percentage_of_negative"] == 0.0
            for i in f_empty["operational_issues"]
        )

        print("\nALL PHASE 4 BACKEND & ANALYTICS QA ASSERTIONS PASSED.")


if __name__ == "__main__":
    run_phase4_qa()
