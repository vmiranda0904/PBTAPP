from __future__ import annotations

import json
import logging
from typing import Any

from .config import AI_ENGINE_LOG_LEVEL

LOGGER_NAME = 'pbtapp.ai_engine'


logging.basicConfig(
    level=getattr(logging, AI_ENGINE_LOG_LEVEL, logging.INFO),
    format='%(asctime)s %(levelname)s %(name)s %(message)s',
)

logger = logging.getLogger(LOGGER_NAME)


def log_event(event: str, **fields: Any) -> None:
    payload = {'event': event, **fields}
    logger.info(json.dumps(payload, default=str, sort_keys=True))


def log_exception(event: str, **fields: Any) -> None:
    payload = {'event': event, **fields}
    logger.exception(json.dumps(payload, default=str, sort_keys=True))
