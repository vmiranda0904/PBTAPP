from __future__ import annotations

from datetime import datetime
from threading import Lock

from .schemas import VideoJob

_JOBS: dict[str, VideoJob] = {}
_LOCK = Lock()


def save_job(job: VideoJob) -> VideoJob:
    with _LOCK:
        job.updated_at = datetime.utcnow()
        _JOBS[job.id] = job
        return job



def get_job(job_id: str) -> VideoJob | None:
    with _LOCK:
        job = _JOBS.get(job_id)
        return job.model_copy(deep=True) if job else None
