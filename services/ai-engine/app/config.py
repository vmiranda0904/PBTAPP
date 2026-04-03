from __future__ import annotations

import os
from dataclasses import asdict, dataclass
from pathlib import Path


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


BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = Path(os.environ.get('AI_ENGINE_DATA_DIR', BASE_DIR / 'data')).resolve()
UPLOADS_DIR = DATA_DIR / 'uploads'
CACHE_DIR = DATA_DIR / 'cache'
REPORTS_DIR = DATA_DIR / 'reports'

for directory in (UPLOADS_DIR, CACHE_DIR, REPORTS_DIR):
    directory.mkdir(parents=True, exist_ok=True)


def detect_device() -> str:
    try:
        import torch  # type: ignore

        return 'cuda' if torch.cuda.is_available() else 'cpu'
    except Exception:
        return 'cpu'


PIPELINE_DEFAULTS = PipelineDefaults()
DEFAULT_SPORT = os.environ.get('AI_ENGINE_DEFAULT_SPORT', 'soccer')
AI_ENGINE_PORT = int(os.environ.get('AI_ENGINE_PORT', '8000'))


def pipeline_defaults_dict() -> dict[str, int | float | str]:
    return asdict(PIPELINE_DEFAULTS)
