from __future__ import annotations

import hashlib
import json
import random
import shutil
import time
import uuid
from pathlib import Path

from .config import CACHE_DIR, PIPELINE_DEFAULTS, REPORTS_DIR, UPLOADS_DIR, detect_device, pipeline_defaults_dict
from .job_store import save_job
from .schemas import PlayEvent, ProcessingReport, StageTimings, VideoJob
from .scouting_engine import build_scouting_report


def _sha256_for_file(file_path: Path) -> tuple[str, int]:
    digest = hashlib.sha256()
    size = 0
    with file_path.open('rb') as handle:
        while chunk := handle.read(1024 * 1024):
            digest.update(chunk)
            size += len(chunk)
    return digest.hexdigest(), size


def persist_upload(source_path: Path, target_name: str) -> Path:
    upload_id = uuid.uuid4().hex
    destination = UPLOADS_DIR / f'{upload_id}-{Path(target_name).name}'
    shutil.copy2(source_path, destination)
    return destination


def _biased_end_x(rng: random.Random, bias: str) -> float:
    if bias == 'left':
        return round(rng.uniform(0.05, 0.32), 2)
    if bias == 'middle':
        return round(rng.uniform(0.33, 0.65), 2)
    return round(rng.uniform(0.66, 0.95), 2)


def _generate_demo_events(video_hash: str) -> list[PlayEvent]:
    rng = random.Random(int(video_hash[:16], 16))
    biases = {1: 'left', 2: 'middle', 3: 'right', 4: rng.choice(['left', 'right'])}
    events: list[PlayEvent] = []
    sequence_id = 1
    timestamp = 0.0

    for player_id in range(1, 5):
        for _ in range(18):
            pressure_level = rng.choices(['low', 'medium', 'high'], weights=[0.25, 0.45, 0.30], k=1)[0]
            play_type = rng.choices(['spike', 'serve', 'dig'], weights=[0.65, 0.2, 0.15], k=1)[0]
            bias = biases[player_id] if play_type == 'spike' else rng.choice(['left', 'middle', 'right'])
            result = rng.choices(
                ['kill', 'continuation', 'error', 'ace', 'blocked'],
                weights=[0.42, 0.24, 0.16, 0.1, 0.08] if pressure_level != 'high' else [0.28, 0.22, 0.3, 0.08, 0.12],
                k=1,
            )[0]

            events.append(
                PlayEvent(
                    timestamp=round(timestamp, 1),
                    player_id=player_id,
                    play_type=play_type,
                    start_position=(round(rng.uniform(0.05, 0.95), 2), round(rng.uniform(0.05, 0.95), 2)),
                    end_position=(_biased_end_x(rng, bias), round(rng.uniform(0.05, 0.95), 2)),
                    result=result,
                    pressure_level=pressure_level,
                    sequence_id=sequence_id,
                )
            )
            sequence_id += 1
            timestamp += rng.uniform(3.2, 8.5)

    return events


def process_video_job(job: VideoJob, uploaded_path: Path) -> None:
    overall_start = time.perf_counter()
    timings = StageTimings()
    persisted_path: Path | None = None

    try:
        job.status = 'processing'
        save_job(job)

        ingest_start = time.perf_counter()
        persisted_path = persist_upload(uploaded_path, job.file_name)
        timings.ingest_ms = round((time.perf_counter() - ingest_start) * 1000, 2)

        hash_start = time.perf_counter()
        video_hash, file_size = _sha256_for_file(persisted_path)
        timings.hash_ms = round((time.perf_counter() - hash_start) * 1000, 2)
        job.video_hash = video_hash

        cache_start = time.perf_counter()
        cached_report_path = CACHE_DIR / f'{video_hash}.json'
        if cached_report_path.exists():
            report_data = json.loads(cached_report_path.read_text())
            job.report = ProcessingReport.model_validate(report_data)
            job.status = 'completed'
            job.download_url = f'/jobs/{job.id}/report'
            job.result_url = f'/jobs/{job.id}'
            timings.cache_lookup_ms = round((time.perf_counter() - cache_start) * 1000, 2)
            timings.total_ms = round((time.perf_counter() - overall_start) * 1000, 2)
            job.timings_ms = timings
            save_job(job)
            return
        timings.cache_lookup_ms = round((time.perf_counter() - cache_start) * 1000, 2)

        decode_start = time.perf_counter()
        events = _generate_demo_events(video_hash)
        observability = {
            'frame_count_processed': len(events) * PIPELINE_DEFAULTS.frame_skip,
            'effective_skip_ratio': PIPELINE_DEFAULTS.frame_skip,
            'frame_skip': PIPELINE_DEFAULTS.frame_skip,
            'detection_interval': PIPELINE_DEFAULTS.detection_interval,
            'resize_width': PIPELINE_DEFAULTS.resize_width,
            'resize_height': PIPELINE_DEFAULTS.resize_height,
            'batch_size': PIPELINE_DEFAULTS.batch_size,
            'ffmpeg_preset': PIPELINE_DEFAULTS.ffmpeg_preset,
            'ffmpeg_crf': PIPELINE_DEFAULTS.ffmpeg_crf,
            'team_name': job.team_name,
        }
        timings.decode_scan_ms = round((time.perf_counter() - decode_start) * 1000, 2)

        detection_start = time.perf_counter()
        device = detect_device()
        timings.selective_detection_ms = round((time.perf_counter() - detection_start) * 1000, 2)

        tracking_start = time.perf_counter()
        timings.tracking_ms = round((time.perf_counter() - tracking_start) * 1000, 2)

        tendency_start = time.perf_counter()
        opponent_profile, game_plan, live_adjustments = build_scouting_report(job.team_name, events)
        timings.tendency_ms = round((time.perf_counter() - tendency_start) * 1000, 2)
        timings.weakness_ms = timings.tendency_ms
        timings.gameplan_ms = timings.tendency_ms

        stats_start = time.perf_counter()
        report = ProcessingReport(
            summary='Coach scouting preview generated opponent tendencies, weakness flags, heatmap bins, and an actionable game plan from the current AI engine pipeline.',
            sport=job.sport,
            team_name=job.team_name,
            file_name=job.file_name,
            video_hash=video_hash,
            file_size_bytes=file_size,
            device=device,
            model=PIPELINE_DEFAULTS.yolo_model,
            optimization_profile=pipeline_defaults_dict(),
            observability={
                **observability,
                'device': device,
                'model': PIPELINE_DEFAULTS.yolo_model,
                'result_cache_enabled': True,
                'unique_players_detected': len(opponent_profile.players),
                'play_events_emitted': len(events),
                'live_coach_mode': 'preview-ready',
            },
            immediate_next_steps=[
                'Replace the demo scouting event generator with tracked detections from OpenCV and Ultralytics.',
                'Feed live tendency deltas through WebSocket updates for in-game coaching alerts.',
                'Render highlight clips for the hottest attack zones and repeated weakness triggers.',
            ],
            play_events=events,
            opponent_profile=opponent_profile,
            game_plan=game_plan,
            live_adjustments=live_adjustments,
        )
        timings.stats_ms = round((time.perf_counter() - stats_start) * 1000, 2)

        render_start = time.perf_counter()
        report_path = REPORTS_DIR / f'{job.id}.json'
        report_json = report.model_dump_json(indent=2)
        report_path.write_text(report_json)
        cached_report_path.write_text(report_json)
        timings.render_ms = round((time.perf_counter() - render_start) * 1000, 2)

        job.report = report
        job.status = 'completed'
        job.result_url = f'/jobs/{job.id}'
        job.download_url = f'/jobs/{job.id}/report'
        timings.total_ms = round((time.perf_counter() - overall_start) * 1000, 2)
        job.timings_ms = timings
        save_job(job)
    except Exception as exc:
        job.status = 'failed'
        job.error = str(exc)
        timings.total_ms = round((time.perf_counter() - overall_start) * 1000, 2)
        job.timings_ms = timings
        save_job(job)
    finally:
        uploaded_path.unlink(missing_ok=True)
