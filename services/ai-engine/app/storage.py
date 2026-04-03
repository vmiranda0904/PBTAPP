from __future__ import annotations

from functools import lru_cache

from supabase import Client, create_client

from .config import SUPABASE_STORAGE_BUCKET, ensure_supabase_configured


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


def get_public_url(storage_path: str) -> str:
    public_url = get_supabase_client().storage.from_(SUPABASE_STORAGE_BUCKET).get_public_url(storage_path)
    if isinstance(public_url, str):
        return public_url
    if isinstance(public_url, dict):
        return str(public_url.get('publicURL') or public_url.get('publicUrl') or '')
    return str(public_url)
