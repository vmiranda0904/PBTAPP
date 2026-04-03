from __future__ import annotations

from functools import lru_cache
from typing import Any

from supabase import Client, create_client

from .config import SUPABASE_STORAGE_BUCKET, ensure_supabase_configured

MAX_PUBLIC_URL_DEPTH = 5


@lru_cache(maxsize=1)
def get_supabase_client() -> Client:
    ensure_supabase_configured()
    from .config import SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL

    return create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)


def upload_bytes(storage_path: str, payload: bytes, content_type: str) -> str:
    storage = get_supabase_client().storage.from_(SUPABASE_STORAGE_BUCKET)
    storage.upload(
        storage_path,
        payload,
        file_options={'content-type': content_type, 'upsert': 'true'},
    )
    return storage_path


def download_bytes(storage_path: str) -> bytes:
    return get_supabase_client().storage.from_(SUPABASE_STORAGE_BUCKET).download(storage_path)


def _extract_public_url(value: Any, depth: int = 0) -> str | None:
    if depth > MAX_PUBLIC_URL_DEPTH:
        return None

    if isinstance(value, str):
        candidate = value.strip()
        return candidate or None

    if isinstance(value, dict):
        candidate = value.get('publicURL') or value.get('publicUrl') or value.get('public_url')
        if isinstance(candidate, str) and candidate.strip():
            return candidate.strip()
        data = value.get('data')
        if data is not None:
            return _extract_public_url(data, depth + 1)

    for attribute in ('publicURL', 'publicUrl', 'public_url', 'data'):
        if hasattr(value, attribute):
            candidate = getattr(value, attribute)
            extracted = _extract_public_url(candidate, depth + 1)
            if extracted:
                return extracted

    return None


def get_public_url(storage_path: str) -> str | None:
    public_url = get_supabase_client().storage.from_(SUPABASE_STORAGE_BUCKET).get_public_url(storage_path)
    return _extract_public_url(public_url)
