from __future__ import annotations

import hashlib
import json
import shutil
import time
import uuid
from pathlib import Path

from .config import CACHE_DIR, PIPELINE_DEFAULTS, REPORTS_DIR, UPLOADS_DIR, detect_device, pipeline_defaults_dict
from .job_store import save_job
from .schemas import ProcessingReport, StageTimings, VideoJob


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
    destination = UPLOADS_DIR / f'{upload_id}-{target_name}'
    shutil.copy2(source_path, destination)
    return destination



def process_video_job(job: VideoJob, uploaded_path: Path) -> None:
    overall_start = time.perf_counter()
    timings = StageTimings()
    try:
        job.status = 'processing'
        save_job(job)

        hash_start = time.perf_counter()
        video_hash, file_size = _sha256_for_file(uploaded_path)
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
        observability = {
            'frame_skip': PIPELINE_DEFAULTS.frame_skip,
            'detection_interval': PIPELINE_DEFAULTS.detection_interval,
            'resize_width': PIPELINE_DEFAULTS.resize_width,
            'resize_height': PIPELINE_DEFAULTS.resize_height,
            'batch_size': PIPELINE_DEFAULTS.batch_size,
            'ffmpeg_preset': PIPELINE_DEFAULTS.ffmpeg_preset,
            'ffmpeg_crf': PIPELINE_DEFAULTS.ffmpeg_crf,
        }
        timings.decode_scan_ms = round((time.perf_counter() - decode_start) * 1000, 2)

        detection_start = time.perf_counter()
        device = detect_device()
        timings.selective_detection_ms = round((time.perf_counter() - detection_start) * 1000, 2)

        tracking_start = time.perf_counter()
        timings.tracking_ms = round((time.perf_counter() - tracking_start) * 1000, 2)

        stats_start = time.perf_counter()
        report = ProcessingReport(
            summary='AI engine skeleton completed intake, hashing, cache lookup, and performance-profile capture. Integrate OpenCV/Ultralytics next for live detections.',
            sport=job.sport,
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
                'pipeline_parallelization': 'planned',
                'motion_prefilter': 'planned',
                'result_cache_enabled': True,
            },
            immediate_next_steps=[
                'Install OpenCV and Ultralytics in the AI engine environment.',
                'Replace the skeleton selective_detection stage with YOLO inference on resized frames.',
                'Move production workloads to a GPU-backed deployment such as RunPod.',
            ],
        )
        timings.stats_ms = round((time.perf_counter() - stats_start) * 1000, 2)

        render_start = time.perf_counter()
        report_path = REPORTS_DIR / f'{job.id}.json'
        report_path.write_text(report.model_dump_json(indent=2))
        cached_report_path.write_text(report.model_dump_json(indent=2))
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
