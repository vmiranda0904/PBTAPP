from __future__ import annotations

import hashlib
import json
import random
import time
from urllib.request import urlopen
from datetime import datetime, timezone

from .config import AI_ENGINE_MAX_RETRIES, PIPELINE_DEFAULTS, detect_device, pipeline_defaults_dict
from .defense_engine import defensive_scheme
from .job_store import find_cached_job, get_job, save_job
from .live_insights import generate_live_insights
from .logger import log_event, log_exception
from .priority_engine import prioritize_insights
from .report_generator import generate_report
from .scoring_engine import calculate_score, rank_athletes
from .schemas import AthleteRanking, MatchupInsight, PlayEvent, PlaybookItem, PriorityAlert, ProcessingReport, StageTimings, VideoJob
from .playbook_engine import generate_playbook
from .scouting_engine import build_scouting_report
from .storage import upload_bytes
from .team_matchup import team_matchup

DEMO_PLAYER_IDS = range(1, 5)
PRESSURE_WEIGHTS = [0.25, 0.45, 0.30]
PLAY_TYPE_WEIGHTS = [0.65, 0.2, 0.15]
NORMAL_RESULT_WEIGHTS = [0.42, 0.24, 0.16, 0.1, 0.08]
HIGH_PRESSURE_RESULT_WEIGHTS = [0.28, 0.22, 0.3, 0.08, 0.12]
MIN_TENDENCY_PCT = 0.15
RIGHT_PCT_ADJUSTMENT_FACTOR = 2


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _sha256_for_bytes(payload: bytes) -> tuple[str, int]:
    return hashlib.sha256(payload).hexdigest(), len(payload)


def _download_video_bytes(video_url: str) -> bytes:
    with urlopen(video_url) as response:  # nosec B310 - URL comes from Supabase storage under app control
        return response.read()


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

    for player_id in DEMO_PLAYER_IDS:
        for _ in range(18):
            pressure_level = rng.choices(['low', 'medium', 'high'], weights=PRESSURE_WEIGHTS, k=1)[0]
            play_type = rng.choices(['spike', 'serve', 'dig'], weights=PLAY_TYPE_WEIGHTS, k=1)[0]
            bias = biases[player_id] if play_type == 'spike' else rng.choice(['left', 'middle', 'right'])
            result = rng.choices(
                ['kill', 'continuation', 'error', 'ace', 'blocked'],
                weights=NORMAL_RESULT_WEIGHTS if pressure_level != 'high' else HIGH_PRESSURE_RESULT_WEIGHTS,
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


def _build_player_stats(events: list[PlayEvent]) -> dict[int, dict[str, float]]:
    stats: dict[int, dict[str, float]] = {}

    for event in events:
        player_stats = stats.setdefault(event.player_id, {'spikes': 0, 'sets': 0, 'serves': 0, 'errors': 0, 'blocks': 0})
        if event.play_type == 'spike':
            player_stats['spikes'] += 1
        elif event.play_type == 'set':
            player_stats['sets'] += 1
        elif event.play_type == 'serve':
            player_stats['serves'] += 1
        elif event.play_type == 'block':
            player_stats['blocks'] += 1

        if event.result == 'error':
            player_stats['errors'] += 1

    return stats


def _build_matchup_teams(
    player_stats: dict[int, dict[str, float]],
    opponent_profile,
) -> tuple[list[dict[str, object]], list[dict[str, object]]]:
    tendencies_by_player = {summary.player_id: summary for summary in opponent_profile.tendencies}
    own_team: list[dict[str, object]] = []
    opponent_team: list[dict[str, object]] = []

    for player_id, summary in tendencies_by_player.items():
        own_team.append(
            {
                'id': f'Prime-{player_id}',
                'tendencies': {
                    'left_pct': round(max(MIN_TENDENCY_PCT, 1 - summary.right_pct), 2),
                    'right_pct': round(max(MIN_TENDENCY_PCT, summary.right_pct / RIGHT_PCT_ADJUSTMENT_FACTOR), 2),
                },
                'stats': {
                    'spikes': player_stats.get(player_id, {}).get('spikes', 0) + 3,
                    'blocks': player_stats.get(player_id, {}).get('blocks', 0) + 1,
                },
                'weakness': 'balanced_defense',
            }
        )
        opponent_team.append(
            {
                'id': f'Opponent-{player_id}',
                'tendencies': {
                    'left_pct': summary.left_pct,
                    'right_pct': summary.right_pct,
                    'serve_target': 'zone_1' if summary.under_pressure_rate > 0.4 else 'zone_5',
                },
                'stats': {
                    'spikes': player_stats.get(player_id, {}).get('spikes', 0),
                    'blocks': player_stats.get(player_id, {}).get('blocks', 0),
                },
                'weakness': 'right_defense' if summary.right_pct < 0.25 else 'balanced_defense',
            }
        )

    return own_team, opponent_team


def _complete_from_cached_job(job: VideoJob, cached_job: VideoJob, video_hash: str, file_size: int, timings: StageTimings, overall_start: float) -> VideoJob:
    cached_report = cached_job.report.model_copy(deep=True) if cached_job.report else None
    if cached_report:
        cached_report.pdf_report_url = f'/jobs/{job.id}/report.pdf'

    job.video_hash = video_hash
    job.file_size_bytes = file_size
    job.report = cached_report
    job.status = 'completed'
    job.processing_stage = 'completed_from_cache'
    job.video_url = cached_job.video_url or job.video_url
    job.report_storage_path = cached_job.report_storage_path
    job.pdf_storage_path = cached_job.pdf_storage_path
    job.download_url = f'/jobs/{job.id}/report'
    job.result_url = f'/jobs/{job.id}'
    job.pdf_report_url = f'/jobs/{job.id}/report.pdf' if cached_job.pdf_storage_path else None
    job.completed_at = _utcnow()
    timings.total_ms = round((time.perf_counter() - overall_start) * 1000, 2)
    job.timings_ms = timings
    log_event('job_cache_hit', job_id=job.id, cached_job_id=cached_job.id, video_hash=video_hash)
    return save_job(job)


def _run_processing(job: VideoJob, attempt: int) -> VideoJob:
    overall_start = time.perf_counter()
    timings = job.timings_ms or StageTimings()
    job.status = 'processing'
    job.processing_stage = 'processing_started'
    job.retry_count = attempt
    if not job.started_at:
        job.started_at = _utcnow()
    job = save_job(job)
    log_event('job_processing_started', job_id=job.id, attempt=attempt, storage_path=job.storage_path, video_url=job.video_url)

    if not job.video_url:
        raise RuntimeError('Missing video URL for queued job.')

    ingest_start = time.perf_counter()
    job.processing_stage = 'reading_storage'
    video_bytes = _download_video_bytes(job.video_url)
    timings.ingest_ms = round((time.perf_counter() - ingest_start) * 1000, 2)
    job.file_size_bytes = len(video_bytes)
    job = save_job(job)

    hash_start = time.perf_counter()
    video_hash, file_size = _sha256_for_bytes(video_bytes)
    timings.hash_ms = round((time.perf_counter() - hash_start) * 1000, 2)
    job.video_hash = video_hash
    job.file_size_bytes = file_size
    job.processing_stage = 'cache_lookup'
    job = save_job(job)

    cache_start = time.perf_counter()
    cached_job = find_cached_job(video_hash=video_hash, sport=job.sport, team_name=job.team_name, exclude_job_id=job.id)
    timings.cache_lookup_ms = round((time.perf_counter() - cache_start) * 1000, 2)
    if cached_job and cached_job.report:
        return _complete_from_cached_job(job, cached_job, video_hash, file_size, timings, overall_start)

    decode_start = time.perf_counter()
    events = _generate_demo_events(video_hash)
    observability = {
        'estimated_total_frames': len(events) * PIPELINE_DEFAULTS.frame_skip,
        'effective_skip_ratio': PIPELINE_DEFAULTS.frame_skip,
        'frame_skip': PIPELINE_DEFAULTS.frame_skip,
        'detection_interval': PIPELINE_DEFAULTS.detection_interval,
        'resize_width': PIPELINE_DEFAULTS.resize_width,
        'resize_height': PIPELINE_DEFAULTS.resize_height,
        'batch_size': PIPELINE_DEFAULTS.batch_size,
        'ffmpeg_preset': PIPELINE_DEFAULTS.ffmpeg_preset,
        'ffmpeg_crf': PIPELINE_DEFAULTS.ffmpeg_crf,
        'team_name': job.team_name,
        'queue_wait_ms': round((job.started_at - job.created_at).total_seconds() * 1000, 2) if job.started_at else 0,
    }
    timings.decode_scan_ms = round((time.perf_counter() - decode_start) * 1000, 2)

    detection_start = time.perf_counter()
    device = detect_device()
    timings.selective_detection_ms = round((time.perf_counter() - detection_start) * 1000, 2)

    tracking_start = time.perf_counter()
    timings.tracking_ms = round((time.perf_counter() - tracking_start) * 1000, 2)

    tendency_start = time.perf_counter()
    opponent_profile, game_plan, live_adjustments = build_scouting_report(job.team_name, events)
    player_stats = _build_player_stats(events)
    tendency_map = {
        summary.player_id: {
            'left_pct': summary.left_pct,
            'middle_pct': summary.middle_pct,
            'right_pct': summary.right_pct,
            'kill_rate': summary.kill_rate,
            'error_rate': summary.error_rate,
            'under_pressure_rate': summary.under_pressure_rate,
        }
        for summary in opponent_profile.tendencies
    }
    own_team, opponent_team = _build_matchup_teams(player_stats, opponent_profile)
    matchup_data = [MatchupInsight(**entry) for entry in team_matchup(own_team, opponent_team)]
    live_insights = generate_live_insights(tendency_map, player_stats)
    priority_alerts = [PriorityAlert(**entry) for entry in prioritize_insights(live_insights)]
    playbook = [PlaybookItem(**entry) for entry in generate_playbook(tendency_map)]
    defense_plan = defensive_scheme(tendency_map)
    athlete_rankings = rank_athletes(
        [
            AthleteRanking(
                id=f'player-{player_id}',
                name=f'Player {player_id}',
                score=calculate_score(stats),
                stats=stats,
            )
            for player_id, stats in player_stats.items()
        ]
    )
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
            'priority_alerts': len(priority_alerts),
            'payload_bytes': file_size,
        },
        immediate_next_steps=[
            'Replace the demo scouting event generator with tracked detections from OpenCV and Ultralytics.',
            'Feed live tendency deltas through WebSocket updates for in-game coaching alerts and Bluetooth voice playback.',
            'Swap storage-backed artifacts for signed share links when the delivery layer is ready.',
        ],
        play_events=events,
        opponent_profile=opponent_profile,
        game_plan=game_plan,
        live_adjustments=live_adjustments,
        matchup_analysis=matchup_data,
        live_insights=live_insights,
        priority_alerts=priority_alerts,
        athlete_rankings=athlete_rankings,
        playbook=playbook,
        defensive_scheme=defense_plan,
        pdf_report_url=f'/jobs/{job.id}/report.pdf',
    )
    timings.stats_ms = round((time.perf_counter() - stats_start) * 1000, 2)

    render_start = time.perf_counter()
    report_storage_path = f'reports/{job.id}.json'
    pdf_storage_path = f'reports/{job.id}.pdf'
    report_json_bytes = report.model_dump_json(indent=2).encode('utf-8')
    pdf_bytes = generate_report(
        {
            'team_name': job.team_name,
            'summary': report.summary,
            'stats': {ranking.name: ranking.stats for ranking in athlete_rankings},
            'insights': [alert.text for alert in priority_alerts] or live_insights,
        }
    )
    upload_bytes(report_storage_path, report_json_bytes, 'application/json')
    upload_bytes(pdf_storage_path, pdf_bytes, 'application/pdf')
    timings.render_ms = round((time.perf_counter() - render_start) * 1000, 2)

    job.report = report
    job.status = 'completed'
    job.processing_stage = 'completed'
    job.report_storage_path = report_storage_path
    job.pdf_storage_path = pdf_storage_path
    job.result_url = f'/jobs/{job.id}'
    job.download_url = f'/jobs/{job.id}/report'
    job.pdf_report_url = f'/jobs/{job.id}/report.pdf'
    job.completed_at = _utcnow()
    timings.total_ms = round((time.perf_counter() - overall_start) * 1000, 2)
    job.timings_ms = timings
    completed_job = save_job(job)
    log_event(
        'job_processing_completed',
        job_id=completed_job.id,
        total_ms=completed_job.timings_ms.total_ms,
        queue_wait_ms=observability['queue_wait_ms'],
        payload_bytes=file_size,
    )
    return completed_job


def process_video_job(job_id: str) -> None:
    attempt = 0
    while True:
        job = get_job(job_id)
        if not job:
            log_event('job_missing_before_processing', job_id=job_id)
            return
        try:
            _run_processing(job, attempt)
            return
        except Exception as exc:
            current_job = get_job(job_id) or job
            current_job.error = str(exc)
            current_job.last_error_at = _utcnow()
            current_job.retry_count = attempt + 1
            current_job.timings_ms.total_ms = round(current_job.timings_ms.total_ms, 2)
            if attempt < current_job.max_retries:
                current_job.status = 'queued'
                current_job.processing_stage = 'retry_scheduled'
                save_job(current_job)
                log_exception('job_processing_retry', job_id=job_id, attempt=attempt + 1, max_retries=current_job.max_retries)
                time.sleep(min(2 ** attempt, 5))
                attempt += 1
                continue

            current_job.status = 'failed'
            current_job.processing_stage = 'failed'
            save_job(current_job)
            log_exception('job_processing_failed', job_id=job_id, attempt=attempt + 1)
            return
