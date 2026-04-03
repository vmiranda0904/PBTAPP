from __future__ import annotations

from queue import Empty, Queue
from threading import Lock, Thread

from .job_store import requeue_incomplete_jobs
from .logger import log_event
from .pipeline import process_video_job

_QUEUE: Queue[str] = Queue()
_PENDING: set[str] = set()
_LOCK = Lock()
_WORKER_THREAD: Thread | None = None


def _worker_loop() -> None:
    while True:
        try:
            job_id = _QUEUE.get(timeout=1)
        except Empty:
            continue

        try:
            log_event('job_processing_dequeued', job_id=job_id, queue_size=_QUEUE.qsize())
            process_video_job(job_id)
        finally:
            with _LOCK:
                _PENDING.discard(job_id)
            _QUEUE.task_done()


def start_worker() -> None:
    global _WORKER_THREAD
    if _WORKER_THREAD and _WORKER_THREAD.is_alive():
        return

    _WORKER_THREAD = Thread(target=_worker_loop, name='ai-job-worker', daemon=True)
    _WORKER_THREAD.start()
    log_event('job_worker_started')


def enqueue_job(job_id: str) -> None:
    with _LOCK:
        if job_id in _PENDING:
            return
        _PENDING.add(job_id)
    _QUEUE.put(job_id)
    log_event('job_enqueued', job_id=job_id, queue_size=_QUEUE.qsize())


def recover_pending_jobs() -> int:
    recovered_jobs = requeue_incomplete_jobs()
    for job in recovered_jobs:
        enqueue_job(job.id)
    log_event('job_recovery_completed', recovered_jobs=len(recovered_jobs))
    return len(recovered_jobs)
