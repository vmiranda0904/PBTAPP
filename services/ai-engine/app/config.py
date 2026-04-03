from __future__ import annotations

import os
from dataclasses import asdict, dataclass


@dataclass(frozen=True)
class PipelineDefaults:
    frame_skip: int = 3
    detection_interval: int = 5
    resize_width: int = 640
    resize_height: int = 360
    yolo_model: str = 'yolov8n.pt'
    batch_size: int = 8
    ffmpeg_preset: str = 'ultrafast'
    ffmpeg_crf: int = 28
    motion_threshold: float = 0.35


PIPELINE_DEFAULTS = PipelineDefaults()
DEFAULT_SPORT = os.environ.get('AI_ENGINE_DEFAULT_SPORT', 'volleyball')
AI_ENGINE_PORT = int(os.environ.get('AI_ENGINE_PORT', '8000'))
AI_ENGINE_LOG_LEVEL = os.environ.get('AI_ENGINE_LOG_LEVEL', 'INFO').upper()
AI_ENGINE_MAX_UPLOAD_BYTES = int(os.environ.get('AI_ENGINE_MAX_UPLOAD_BYTES', str(1024 * 1024 * 512)))
AI_ENGINE_MAX_RETRIES = int(os.environ.get('AI_ENGINE_MAX_RETRIES', '2'))
SUPABASE_URL = os.environ.get('SUPABASE_URL', '').strip()
SUPABASE_SERVICE_ROLE_KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY', '').strip()
SUPABASE_STORAGE_BUCKET = os.environ.get('SUPABASE_STORAGE_BUCKET', 'videos').strip() or 'videos'


class ConfigurationError(RuntimeError):
    pass


REQUIRED_SUPABASE_ENV_VARS = {
    'SUPABASE_URL': SUPABASE_URL,
    'SUPABASE_SERVICE_ROLE_KEY': SUPABASE_SERVICE_ROLE_KEY,
    'SUPABASE_STORAGE_BUCKET': SUPABASE_STORAGE_BUCKET,
}


def ensure_supabase_configured() -> None:
    missing = [name for name, value in REQUIRED_SUPABASE_ENV_VARS.items() if not value]
    if missing:
        joined = ', '.join(missing)
        raise ConfigurationError(f'Missing required Supabase configuration: {joined}.')


def is_supabase_configured() -> bool:
    return bool(SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY and SUPABASE_STORAGE_BUCKET)


def detect_device() -> str:
    try:
        import torch  # type: ignore

        return 'cuda' if torch.cuda.is_available() else 'cpu'
    except Exception:
        return 'cpu'


def pipeline_defaults_dict() -> dict[str, int | float | str]:
    return asdict(PIPELINE_DEFAULTS)
