from __future__ import annotations

import os
from datetime import datetime, timezone

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from pydantic import BaseModel, Field

from save_results import save_results


app = FastAPI(title="PRIMEAthletix AI Engine")


class ResultPayload(BaseModel):
    athlete_id: str
    highlight_url: str = Field(min_length=1)
    stats: dict[str, int]


def _build_live_snapshot() -> dict[str, object]:
    return {
        "alerts": [
            os.environ.get("AI_ALERT_PRIMARY", "Serve zone 5 against their top outside."),
            os.environ.get("AI_ALERT_SECONDARY", "Quick set window open in rotation 3."),
        ],
        "insights": [
            os.environ.get("AI_INSIGHT_PRIMARY", "Opponent tips short under pressure."),
            os.environ.get("AI_INSIGHT_SECONDARY", "Transition kill rate is trending up."),
        ],
        "stats": {
            "touches": os.environ.get("AI_LIVE_TOUCHES", "38"),
            "spikes": os.environ.get("AI_LIVE_SPIKES", "17"),
            "efficiency": os.environ.get("AI_LIVE_EFFICIENCY", ".344"),
            "serve_runs": os.environ.get("AI_LIVE_SERVE_RUNS", "3"),
        },
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }


@app.get("/health")
def healthcheck() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/results")
def persist_results(payload: ResultPayload) -> dict[str, str]:
    save_results(payload.athlete_id, payload.stats, payload.highlight_url)
    return {"status": "saved"}


@app.websocket("/live")
async def live_feed(websocket: WebSocket) -> None:
    await websocket.accept()

    try:
        await websocket.send_json(_build_live_snapshot())

        while True:
            await websocket.receive_text()
            await websocket.send_json(_build_live_snapshot())
    except WebSocketDisconnect:
        return
