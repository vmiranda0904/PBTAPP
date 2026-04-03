from __future__ import annotations

import tempfile
import uuid
from pathlib import Path

from fastapi import BackgroundTasks, FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from .config import PIPELINE_DEFAULTS, REPORTS_DIR, pipeline_defaults_dict, detect_device
from .job_store import get_job, save_job
from .pipeline import process_video_job
from .schemas import CreateJobResponse, HealthResponse, VideoJob

app = FastAPI(
    title='PBTAPP AI Engine',
    version='0.2.0',
    summary='Video-analysis and coach-scouting service optimized around fast, GPU-ready processing goals.',
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)


@app.get('/health', response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(
        device=detect_device(),
        model=PIPELINE_DEFAULTS.yolo_model,
        pipeline_defaults=pipeline_defaults_dict(),
    )


@app.get('/config')
def config() -> dict[str, object]:
    return {
        'device': detect_device(),
        'pipeline_defaults': pipeline_defaults_dict(),
        'api_contract': {
            'create_job': 'POST /jobs',
            'get_job': 'GET /jobs/{job_id}',
            'download_report': 'GET /jobs/{job_id}/report',
        },
        'coach_features': [
            'opponent tendencies',
            'weakness detection',
            'game plan generation',
            'live coaching preview',
        ],
    }


@app.post('/jobs', response_model=CreateJobResponse, status_code=202)
async def create_job(
    background_tasks: BackgroundTasks,
    video: UploadFile = File(...),
    sport: str = Form('volleyball'),
    team_name: str = Form('Opponent team'),
) -> CreateJobResponse:
    if not video.filename:
        raise HTTPException(status_code=400, detail='A video filename is required.')

    suffix = Path(video.filename).suffix or '.mp4'
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp_file:
        tmp_file.write(await video.read())
        temp_path = Path(tmp_file.name)

    job = VideoJob(
        id=uuid.uuid4().hex,
        status='queued',
        sport=sport.strip() or 'volleyball',
        team_name=team_name.strip() or 'Opponent team',
        file_name=video.filename,
    )
    save_job(job)
    background_tasks.add_task(process_video_job, job, temp_path)
    return CreateJobResponse(job=job, status_url=f'/jobs/{job.id}')


@app.get('/jobs/{job_id}', response_model=VideoJob)
def get_job_by_id(job_id: str) -> VideoJob:
    job = get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail='Job not found.')
    return job


@app.get('/jobs/{job_id}/report')
def download_job_report(job_id: str) -> FileResponse:
    job = get_job(job_id)
    if not job or not job.report:
        raise HTTPException(status_code=404, detail='Report not ready.')

    report_path = (REPORTS_DIR / f'{job.id}.json').resolve()
    if report_path.parent != REPORTS_DIR.resolve():
        raise HTTPException(status_code=400, detail='Invalid report path.')
    if not report_path.exists():
        raise HTTPException(status_code=404, detail='Report file not found.')
    return FileResponse(report_path, media_type='application/json', filename=f'{job.id}-report.json')
