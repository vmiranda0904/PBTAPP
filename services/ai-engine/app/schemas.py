from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

JobStatus = Literal['queued', 'processing', 'completed', 'failed']
PlayType = Literal['serve', 'spike', 'set', 'dig', 'block']
PlayResult = Literal['kill', 'error', 'continuation', 'ace', 'blocked']
PressureLevel = Literal['low', 'medium', 'high']


class StageTimings(BaseModel):
    ingest_ms: float = 0
    hash_ms: float = 0
    cache_lookup_ms: float = 0
    decode_scan_ms: float = 0
    selective_detection_ms: float = 0
    tracking_ms: float = 0
    tendency_ms: float = 0
    weakness_ms: float = 0
    gameplan_ms: float = 0
    stats_ms: float = 0
    render_ms: float = 0
    total_ms: float = 0


class PlayEvent(BaseModel):
    timestamp: float
    player_id: int
    play_type: PlayType
    start_position: tuple[float, float]
    end_position: tuple[float, float]
    result: PlayResult
    pressure_level: PressureLevel = 'medium'
    sequence_id: int


class HeatmapCell(BaseModel):
    x_bin: int
    y_bin: int
    count: int


class PlayerScoutingSummary(BaseModel):
    player_id: int
    player_label: str
    total_events: int
    spike_count: int
    preferred_attack_zone: Literal['left', 'middle', 'right']
    left_pct: float
    middle_pct: float
    right_pct: float
    kill_rate: float
    error_rate: float
    under_pressure_rate: float
    strengths: list[str]
    weakness: str | None = None
    heatmap: list[HeatmapCell] = Field(default_factory=list)


class OpponentProfile(BaseModel):
    id: str
    team_name: str
    players: list[str]
    tendencies: list[PlayerScoutingSummary]
    weaknesses: list[str]
    strengths: list[str]


class ProcessingReport(BaseModel):
    pipeline_mode: Literal['coach_scouting_preview'] = 'coach_scouting_preview'
    summary: str
    sport: str
    team_name: str
    file_name: str
    video_hash: str
    file_size_bytes: int
    device: str
    model: str
    optimization_profile: dict[str, int | float | str]
    observability: dict[str, int | float | str | bool]
    immediate_next_steps: list[str]
    recommended_gpu_provider: str = 'RunPod'
    play_events: list[PlayEvent] = Field(default_factory=list)
    opponent_profile: OpponentProfile | None = None
    game_plan: list[str] = Field(default_factory=list)
    live_adjustments: list[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class VideoJob(BaseModel):
    id: str
    status: JobStatus
    sport: str
    team_name: str = 'Opponent team'
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
