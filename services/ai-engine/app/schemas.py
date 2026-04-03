from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

JobStatus = Literal['queued', 'processing', 'completed', 'failed']


class StageTimings(BaseModel):
    hash_ms: float = 0
    cache_lookup_ms: float = 0
    decode_scan_ms: float = 0
    selective_detection_ms: float = 0
    tracking_ms: float = 0
    stats_ms: float = 0
    render_ms: float = 0
    total_ms: float = 0


class ProcessingReport(BaseModel):
    pipeline_mode: Literal['skeleton'] = 'skeleton'
    summary: str
    sport: str
    file_name: str
    video_hash: str
    file_size_bytes: int
    device: str
    model: str
    optimization_profile: dict[str, int | float | str]
    observability: dict[str, int | float | str]
    immediate_next_steps: list[str]
    recommended_gpu_provider: str = 'RunPod'
    created_at: datetime = Field(default_factory=datetime.utcnow)


class VideoJob(BaseModel):
    id: str
    status: JobStatus
    sport: str
    file_name: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    video_hash: str | None = None
    error: str | None = None
    report: ProcessingReport | None = None
    timings_ms: StageTimings = Field(default_factory=StageTimings)
    result_url: str | None = None
    download_url: str | None = None


class CreateJobResponse(BaseModel):
    job: VideoJob
    status_url: str


class HealthResponse(BaseModel):
    status: Literal['ok'] = 'ok'
    device: str
    model: str
    pipeline_defaults: dict[str, int | float | str]
