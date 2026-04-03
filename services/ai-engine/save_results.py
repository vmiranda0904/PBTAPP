from __future__ import annotations

import os
from uuid import uuid4

from supabase import Client, create_client

SCORE_PER_SPIKE = 2


def _create_supabase_client() -> Client:
    supabase_url = os.environ["SUPABASE_URL"]
    supabase_key = os.environ["SUPABASE_KEY"]
    return create_client(supabase_url, supabase_key)


def save_results(athlete_id: str, stats: dict[str, int], highlight_url: str) -> None:
    """Persist AI pipeline results for an athlete into Supabase."""
    supabase = _create_supabase_client()

    existing_stats = (
        supabase.table("stats")
        .select("id")
        .eq("athlete_id", athlete_id)
        .limit(1)
        .execute()
    )

    payload = {
        "athlete_id": athlete_id,
        "spikes": stats.get("spikes", 0),
        "sets": stats.get("sets", 0),
        "serves": stats.get("serves", 0),
        "errors": stats.get("errors", 0),
    }

    if existing_stats.data:
        supabase.table("stats").update(payload).eq("athlete_id", athlete_id).execute()
    else:
        supabase.table("stats").insert({"id": str(uuid4()), **payload}).execute()

    supabase.table("athletes").update(
        {
            "highlight_url": highlight_url,
            "score": payload["spikes"] * SCORE_PER_SPIKE,
        }
    ).eq("id", athlete_id).execute()
