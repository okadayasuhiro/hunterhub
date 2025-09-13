#!/usr/bin/env python3
import sys
import time
from datetime import datetime
from typing import Optional, Tuple
from decimal import Decimal

try:
    from zoneinfo import ZoneInfo  # Python 3.9+
except ImportError:
    ZoneInfo = None  # type: ignore

import boto3
from botocore.config import Config

USAGE = (
    "Usage: python scripts/backfill_weekkeys.py <table_name> [batch_limit] [start_key]"\
    "\n  table_name   : DynamoDB GameScore table name (e.g., GameScore-xxxx-prod)"\
    "\n  batch_limit  : Scan page size (default: 200)"\
    "\n  start_key    : JSON string of ExclusiveStartKey to resume (optional)"\
)


def get_tokyo_iso_week_label(dt_utc_iso: str) -> Tuple[int, int]:
    """Return (year, week) for Asia/Tokyo ISO week for a UTC ISO timestamp string."""
    # parse ISO8601 (AppSync stores ISO string)
    try:
        dt_utc = datetime.fromisoformat(dt_utc_iso.replace("Z", "+00:00"))
    except Exception:
        # fallback: try without timezone
        dt_utc = datetime.strptime(dt_utc_iso[:19], "%Y-%m-%dT%H:%M:%S")
    if ZoneInfo is None:
        # Approximate JST by adding 9 hours
        from datetime import timedelta
        dt_jst = dt_utc + timedelta(hours=9)
    else:
        dt_jst = dt_utc.astimezone(ZoneInfo("Asia/Tokyo"))
    # ISO calendar: isocalendar() returns (ISO year, ISO week number, ISO weekday)
    iso_year, iso_week, _ = dt_jst.isocalendar()
    return int(iso_year), int(iso_week)


def make_week_key(year: int, week: int) -> str:
    return f"{year}-{str(week).zfill(2)}"


def compute_sort_score(game_type: str, score_val) -> Decimal:
    try:
        score_d = Decimal(str(score_val))
    except Exception:
        score_d = Decimal(0)
    if game_type == "trigger-timing":
        return Decimal(-1) * score_d
    return score_d


def main():
    if len(sys.argv) < 2:
        print(USAGE)
        sys.exit(1)

    table_name = sys.argv[1]
    limit = int(sys.argv[2]) if len(sys.argv) >= 3 else 200

    session = boto3.Session()
    ddb = session.resource("dynamodb", config=Config(retries={"max_attempts": 10, "mode": "standard"}))
    table = ddb.Table(table_name)

    scan_kwargs = {
        "Limit": limit,
        "ProjectionExpression": "#id, gameType, score, #ts, weekKey, sortScore, gameWeekKey",
        "ExpressionAttributeNames": {"#id": "id", "#ts": "timestamp"},
    }

    last_evaluated_key: Optional[dict] = None
    updated = 0
    scanned = 0

    while True:
        if last_evaluated_key:
            scan_kwargs["ExclusiveStartKey"] = last_evaluated_key
        resp = table.scan(**scan_kwargs)
        items = resp.get("Items", [])
        scanned += len(items)
        for item in items:
            try:
                item_id = item["id"]
                game_type = item.get("gameType")
                score = item.get("score", 0)
                ts = item.get("timestamp")
                wk_existing = item.get("weekKey")
                ss_existing = item.get("sortScore")
                gw_existing = item.get("gameWeekKey")

                if wk_existing and ss_existing is not None and gw_existing:
                    continue  # already backfilled

                if not ts or not game_type:
                    continue

                iso_year, iso_week = get_tokyo_iso_week_label(ts)
                week_key = make_week_key(iso_year, iso_week)
                sort_score = compute_sort_score(game_type, score)
                game_week_key = f"{game_type}#{week_key}"

                # Update only missing attributes
                update_expr_parts = []
                expr_attr_vals = {}
                expr_attr_names = {}

                if not wk_existing:
                    update_expr_parts.append("#wk = :wk")
                    expr_attr_vals[":wk"] = week_key
                    expr_attr_names["#wk"] = "weekKey"
                if ss_existing is None:
                    update_expr_parts.append("#ss = :ss")
                    expr_attr_vals[":ss"] = sort_score
                    expr_attr_names["#ss"] = "sortScore"
                if not gw_existing:
                    update_expr_parts.append("#gw = :gw")
                    expr_attr_vals[":gw"] = game_week_key
                    expr_attr_names["#gw"] = "gameWeekKey"

                if not update_expr_parts:
                    continue

                update_expr = "SET " + ", ".join(update_expr_parts)
                table.update_item(
                    Key={"id": item_id},
                    UpdateExpression=update_expr,
                    ExpressionAttributeValues=expr_attr_vals,
                    ExpressionAttributeNames=expr_attr_names,
                )
                updated += 1
            except Exception as e:
                print(f"[WARN] Failed item update: {e}")
                continue

        last_evaluated_key = resp.get("LastEvaluatedKey")
        print(f"Scanned: {scanned}, Updated: {updated}")
        if not last_evaluated_key:
            break
        time.sleep(0.2)

    print(f"Done. Total scanned={scanned}, updated={updated}")


if __name__ == "__main__":
    main()
