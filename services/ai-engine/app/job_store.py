from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Iterable

from .logger import log_event
from .schemas import VideoJob
from .storage import get_supabase_client

TABLE_NAME = 'jobs'


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _job_to_record(job: VideoJob) -> dict[str, Any]:
    payload = job.model_dump(mode='json')
    return {
        'id': payload['id'],
        'user_id': payload['user_id'],
        'team_id': payload['team_id'],
        'status': payload['status'],
        'progress': payload['progress'],
        'processing_stage': payload['processing_stage'],
        'sport': payload['sport'],
        'team_name': payload['team_name'],
        'file_name': payload['file_name'],
        'content_type': payload['content_type'],
        'file_size_bytes': payload['file_size_bytes'],
        'storage_path': payload['storage_path'],
        'video_url': payload['video_url'],
        'report_storage_path': payload['report_storage_path'],
        'pdf_storage_path': payload['pdf_storage_path'],
        'created_at': payload['created_at'],
        'updated_at': payload['updated_at'],
        'started_at': payload['started_at'],
        'completed_at': payload['completed_at'],
        'last_error_at': payload['last_error_at'],
        'video_hash': payload['video_hash'],
        'error': payload['error'],
        'retry_count': payload['retry_count'],
        'max_retries': payload['max_retries'],
        'timings_ms': payload['timings_ms'],
        'result': payload['report'],
        'result_url': payload['result_url'],
        'download_url': payload['download_url'],
        'pdf_report_url': payload['pdf_report_url'],
    }


def _record_to_job(record: dict[str, Any]) -> VideoJob:
    payload = {
        'id': record['id'],
        'user_id': record['user_id'],
        'team_id': record['team_id'],
        'status': record['status'],
        'progress': record.get('progress') or 0,
        'processing_stage': record.get('processing_stage') or 'accepted',
        'sport': record['sport'],
        'team_name': record.get('team_name') or 'Opponent team',
        'file_name': record['file_name'],
        'content_type': record.get('content_type') or 'application/octet-stream',
        'file_size_bytes': record.get('file_size_bytes') or 0,
        'storage_path': record.get('storage_path'),
        'video_url': record.get('video_url'),
        'report_storage_path': record.get('report_storage_path'),
        'pdf_storage_path': record.get('pdf_storage_path'),
        'created_at': record.get('created_at'),
        'updated_at': record.get('updated_at'),
        'started_at': record.get('started_at'),
        'completed_at': record.get('completed_at'),
        'last_error_at': record.get('last_error_at'),
        'video_hash': record.get('video_hash'),
        'error': record.get('error'),
        'retry_count': record.get('retry_count') or 0,
        'max_retries': record.get('max_retries') or 0,
        'report': record.get('result'),
        'timings_ms': record.get('timings_ms') or {},
        'result_url': record.get('result_url'),
        'download_url': record.get('download_url'),
        'pdf_report_url': record.get('pdf_report_url'),
    }
    return VideoJob.model_validate(payload)


def save_job(job: VideoJob) -> VideoJob:
    job.updated_at = _utcnow()
    record = _job_to_record(job)
    response = get_supabase_client().table(TABLE_NAME).upsert(record).execute()
    saved = response.data[0] if response.data else record
    saved_job = _record_to_job(saved)
    log_event('job_saved', job_id=saved_job.id, status=saved_job.status, stage=saved_job.processing_stage)
    return saved_job


def get_job(job_id: str, user_id: str | None = None, team_id: str | None = None) -> VideoJob | None:
    query = get_supabase_client().table(TABLE_NAME).select('*').eq('id', job_id)
    if user_id:
        query = query.eq('user_id', user_id)
    if team_id:
        query = query.eq('team_id', team_id)
    response = query.limit(1).execute()
    if not response.data:
        return None
    return _record_to_job(response.data[0])


def list_jobs_by_status(statuses: Iterable[str]) -> list[VideoJob]:
    response = get_supabase_client().table(TABLE_NAME).select('*').in_('status', list(statuses)).execute()
    return [_record_to_job(record) for record in response.data or []]


def find_cached_job(video_hash: str, sport: str, team_name: str, exclude_job_id: str | None = None) -> VideoJob | None:
    query = (
        get_supabase_client()
        .table(TABLE_NAME)
        .select('*')
        .eq('status', 'completed')
        .eq('video_hash', video_hash)
        .eq('sport', sport)
        .eq('team_name', team_name)
        .order('completed_at', desc=True)
        .limit(5)
    )
    response = query.execute()
    for record in response.data or []:
        if exclude_job_id and record.get('id') == exclude_job_id:
            continue
        if not record.get('result'):
            continue
        return _record_to_job(record)
    return None


def requeue_incomplete_jobs() -> list[VideoJob]:
    jobs = list_jobs_by_status(['queued', 'processing'])
    recovered: list[VideoJob] = []
    for job in jobs:
        if job.status == 'processing':
            job.status = 'queued'
            job.processing_stage = 'recovered_after_restart'
            job.error = 'Recovered queued job after service restart.' if not job.error else job.error
            recovered.append(save_job(job))
        else:
            recovered.append(job)
    return recovered
