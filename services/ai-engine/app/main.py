from __future__ import annotations

import re
import uuid
from typing import Annotated

from fastapi import FastAPI, File, Form, Header, HTTPException, Query, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response

from .config import AI_ENGINE_MAX_RETRIES, AI_ENGINE_MAX_UPLOAD_BYTES, ConfigurationError, DEFAULT_SPORT, PIPELINE_DEFAULTS, is_supabase_configured, pipeline_defaults_dict, detect_device
from .job_store import get_job, save_job
from .logger import log_event, log_exception
from .schemas import CreateJobResponse, HealthResponse, VideoJob
from .storage import download_bytes, get_public_url, upload_bytes
from .worker import enqueue_job, recover_pending_jobs, start_worker

JOB_ID_PATTERN = re.compile(r'^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$')
ALLOWED_VIDEO_EXTENSIONS = {'.mp4', '.mov', '.avi', '.mkv', '.webm'}

UserIdHeader = Annotated[str | None, Header(alias='X-User-Id')]
TeamIdHeader = Annotated[str | None, Header(alias='X-Team-Id')]
UserIdQuery = Annotated[str | None, Query(alias='userId')]
TeamIdQuery = Annotated[str | None, Query(alias='teamId')]


class RequestValidationError(HTTPException):
    def __init__(self, detail: str, status_code: int = 400) -> None:
        super().__init__(status_code=status_code, detail=detail)


app = FastAPI(
    title='PBTAPP AI Engine',
    version='0.3.0',
    summary='Video-analysis and coach-scouting service optimized around durable, storage-backed async processing.',
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)


@app.on_event('startup')
def startup() -> None:
    if not is_supabase_configured():
        log_event('startup_supabase_unconfigured')
        return
    start_worker()
    recover_pending_jobs()


@app.exception_handler(ConfigurationError)
async def configuration_exception_handler(_request: Request, exc: ConfigurationError) -> JSONResponse:
    log_exception('configuration_error', detail=str(exc))
    return JSONResponse(status_code=503, content={'detail': str(exc)})


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    log_exception('unhandled_server_error', path=str(request.url.path), method=request.method)
    return JSONResponse(status_code=500, content={'detail': 'Unexpected server error.'})


def _validate_job_id(job_id: str) -> str:
    if not JOB_ID_PATTERN.fullmatch(job_id):
        raise HTTPException(status_code=400, detail='Invalid job id.')
    try:
        uuid.UUID(job_id)
        return job_id
    except ValueError as exc:
        raise HTTPException(status_code=400, detail='Invalid job id.') from exc


def _require_owner(user_id: UserIdHeader, team_id: TeamIdHeader, user_id_query: UserIdQuery = None, team_id_query: TeamIdQuery = None) -> tuple[str, str]:
    normalized_user_id = (user_id or user_id_query or '').strip()
    normalized_team_id = (team_id or team_id_query or '').strip()
    if not normalized_user_id or not normalized_team_id:
        raise HTTPException(status_code=401, detail='Authentication is required to access AI jobs.')
    return normalized_user_id, normalized_team_id


def _normalize_text(value: str, fallback: str, field_name: str, max_length: int) -> str:
    normalized = value.strip() or fallback
    if len(normalized) > max_length:
        raise RequestValidationError(f'{field_name} must be {max_length} characters or fewer.')
    return normalized


async def _read_upload_payload(video: UploadFile) -> bytes:
    content_length = video.headers.get('content-length') if video.headers else None
    if content_length and int(content_length) > AI_ENGINE_MAX_UPLOAD_BYTES:
        raise RequestValidationError('Uploaded video exceeds the configured size limit.', status_code=413)

    buffer = bytearray()
    while chunk := await video.read(1024 * 1024):
        buffer.extend(chunk)
        if len(buffer) > AI_ENGINE_MAX_UPLOAD_BYTES:
            raise RequestValidationError('Uploaded video exceeds the configured size limit.', status_code=413)
    return bytes(buffer)


def _validate_upload(video: UploadFile, payload: bytes) -> tuple[str, str, int]:
    filename = (video.filename or '').strip()
    if not filename:
        raise RequestValidationError('A video filename is required.')

    extension = ''
    if '.' in filename:
        extension = f".{filename.rsplit('.', 1)[1].lower()}"
    if extension not in ALLOWED_VIDEO_EXTENSIONS:
        raise RequestValidationError('Unsupported video format.')

    if not payload:
        raise RequestValidationError('Uploaded video is empty.')
    if len(payload) > AI_ENGINE_MAX_UPLOAD_BYTES:
        raise RequestValidationError('Uploaded video exceeds the configured size limit.', status_code=413)

    content_type = (video.content_type or 'application/octet-stream').strip()
    if content_type != 'application/octet-stream' and not content_type.startswith('video/'):
        raise RequestValidationError('Uploaded file must be a video.')

    return filename, content_type, len(payload)


def _get_authorized_job(job_id: str, user_id: str, team_id: str) -> VideoJob:
    job = get_job(job_id, user_id=user_id, team_id=team_id)
    if not job:
        raise HTTPException(status_code=404, detail='Job not found.')
    return job


@app.get('/health', response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(
        device=detect_device(),
        model=PIPELINE_DEFAULTS.yolo_model,
        pipeline_defaults=pipeline_defaults_dict(),
        storage='supabase' if is_supabase_configured() else 'unconfigured',
    )


@app.get('/config')
def config() -> dict[str, object]:
    return {
        'device': detect_device(),
        'pipeline_defaults': pipeline_defaults_dict(),
        'storage': 'supabase' if is_supabase_configured() else 'unconfigured',
        'api_contract': {
            'create_job': 'POST /jobs',
            'get_job': 'GET /jobs/{job_id}',
            'download_report': 'GET /jobs/{job_id}/report',
            'download_pdf_report': 'GET /jobs/{job_id}/report.pdf',
        },
        'coach_features': [
            'opponent tendencies',
            'matchup analysis',
            'weakness detection',
            'game plan generation',
            'live coaching preview',
            'priority voice alerts',
        ],
    }


@app.post('/jobs', response_model=CreateJobResponse, status_code=202)
async def create_job(
    video: UploadFile = File(...),
    sport: str = Form(DEFAULT_SPORT),
    team_name: str = Form('Opponent team'),
    user_id: UserIdHeader = None,
    team_id: TeamIdHeader = None,
) -> CreateJobResponse:
    owner_user_id, owner_team_id = _require_owner(user_id, team_id)
    normalized_sport = _normalize_text(sport, DEFAULT_SPORT, 'sport', 64)
    normalized_team_name = _normalize_text(team_name, 'Opponent team', 'team_name', 120)
    payload = await _read_upload_payload(video)
    filename, content_type, file_size = _validate_upload(video, payload)

    job = VideoJob(
        id=str(uuid.uuid4()),
        user_id=owner_user_id,
        team_id=owner_team_id,
        status='queued',
        processing_stage='accepted',
        sport=normalized_sport,
        team_name=normalized_team_name,
        file_name=filename,
        content_type=content_type,
        file_size_bytes=file_size,
        max_retries=AI_ENGINE_MAX_RETRIES,
        result_url=f'/jobs/{{job_id}}',
    )
    job.result_url = f'/jobs/{job.id}'
    job.download_url = f'/jobs/{job.id}/report'
    job.pdf_report_url = f'/jobs/{job.id}/report.pdf'
    job = save_job(job)

    try:
        storage_path = upload_bytes(f'uploads/{job.id}/{filename}', payload, content_type)
        job.storage_path = storage_path
        job.video_url = get_public_url(storage_path)
        if not job.video_url:
            log_event('job_public_url_unavailable', job_id=job.id, storage_path=storage_path)
        job.processing_stage = 'uploaded'
        job = save_job(job)
        enqueue_job(job.id)
        job.processing_stage = 'queued'
        job = save_job(job)
        log_event('job_created', job_id=job.id, user_id=owner_user_id, team_id=owner_team_id, file_size_bytes=file_size)
    except Exception as exc:
        job.status = 'failed'
        job.processing_stage = 'upload_failed'
        job.error = str(exc)
        job = save_job(job)
        log_exception('job_creation_failed', job_id=job.id, user_id=owner_user_id, team_id=owner_team_id)
        raise HTTPException(status_code=500, detail='Unable to queue the video job.') from exc

    return CreateJobResponse(job=job, status_url=f'/jobs/{job.id}')


@app.get('/jobs/{job_id}', response_model=VideoJob)
def get_job_by_id(job_id: str, user_id: UserIdHeader = None, team_id: TeamIdHeader = None, user_id_query: UserIdQuery = None, team_id_query: TeamIdQuery = None) -> VideoJob:
    owner_user_id, owner_team_id = _require_owner(user_id, team_id, user_id_query, team_id_query)
    normalized_job_id = _validate_job_id(job_id)
    return _get_authorized_job(normalized_job_id, owner_user_id, owner_team_id)


@app.get('/jobs/{job_id}/report')
def download_job_report(job_id: str, user_id: UserIdHeader = None, team_id: TeamIdHeader = None, user_id_query: UserIdQuery = None, team_id_query: TeamIdQuery = None) -> Response:
    owner_user_id, owner_team_id = _require_owner(user_id, team_id, user_id_query, team_id_query)
    normalized_job_id = _validate_job_id(job_id)
    job = _get_authorized_job(normalized_job_id, owner_user_id, owner_team_id)
    if not job.report_storage_path or not job.report:
        raise HTTPException(status_code=404, detail='Report not ready.')

    payload = download_bytes(job.report_storage_path)
    return Response(
        content=payload,
        media_type='application/json',
        headers={'Content-Disposition': f'attachment; filename="{job.id}-report.json"'},
    )


@app.get('/jobs/{job_id}/report.pdf')
def download_job_pdf_report(job_id: str, user_id: UserIdHeader = None, team_id: TeamIdHeader = None, user_id_query: UserIdQuery = None, team_id_query: TeamIdQuery = None) -> Response:
    owner_user_id, owner_team_id = _require_owner(user_id, team_id, user_id_query, team_id_query)
    normalized_job_id = _validate_job_id(job_id)
    job = _get_authorized_job(normalized_job_id, owner_user_id, owner_team_id)
    if not job.pdf_storage_path or not job.report:
        raise HTTPException(status_code=404, detail='PDF report not ready.')

    payload = download_bytes(job.pdf_storage_path)
    return Response(
        content=payload,
        media_type='application/pdf',
        headers={'Content-Disposition': f'attachment; filename="{job.id}-report.pdf"'},
    )
