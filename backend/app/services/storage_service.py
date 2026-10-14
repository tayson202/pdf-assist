"""
Storage Service
Abstracts file persistence across local filesystem, S3/MinIO, and Supabase Object Storage.
"""

import os
from pathlib import Path
from typing import Optional
import urllib.request
import urllib.parse
import json
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)


class StorageService:
    @property
    def backend(self) -> str:
        return settings.STORAGE_BACKEND

    @property
    def base_path(self) -> Path:
        p = Path(settings.LOCAL_STORAGE_PATH)
        p.mkdir(parents=True, exist_ok=True)
        return p

    async def save_file(self, content: bytes, storage_key: str) -> str:
        """
        Saves binary payload to configured storage backend.
        Returns the canonical storage key.
        """
        if self.backend == "local":
            file_path = self.base_path / storage_key
            file_path.parent.mkdir(parents=True, exist_ok=True)
            with open(file_path, "wb") as f:
                f.write(content)
            return storage_key

        elif self.backend == "supabase":
            bucket = urllib.parse.quote(settings.SUPABASE_BUCKET_NAME)
            key = urllib.parse.quote(storage_key)
            url = f"{settings.SUPABASE_URL}/storage/v1/object/{bucket}/{key}"
            headers = {
                "apikey": settings.SUPABASE_SERVICE_ROLE_KEY,
                "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",
                "Content-Type": "application/pdf",
                "x-upsert": "true",
            }
            req = urllib.request.Request(url, data=content, headers=headers, method="POST")
            with urllib.request.urlopen(req) as resp:
                if resp.status in (200, 201):
                    logger.info("Saved %s to Supabase bucket '%s'", storage_key, settings.SUPABASE_BUCKET_NAME)
                    return storage_key
                raise RuntimeError(f"Supabase storage upload failed with status {resp.status}")

        else:
            # S3 / MinIO backend using boto3
            import boto3
            from botocore.client import Config
            s3_client = boto3.client(
                "s3",
                endpoint_url=settings.S3_ENDPOINT_URL,
                aws_access_key_id=settings.S3_ACCESS_KEY_ID,
                aws_secret_access_key=settings.S3_SECRET_ACCESS_KEY,
                region_name=settings.S3_REGION,
                config=Config(signature_version="s3v4"),
            )
            s3_client.put_object(
                Bucket=settings.S3_BUCKET_NAME,
                Key=storage_key,
                Body=content,
                ContentType="application/pdf",
            )
            return storage_key

    async def get_file(self, storage_key: str) -> Optional[bytes]:
        """
        Retrieves file bytes from storage.
        """
        if self.backend == "local":
            file_path = self.base_path / storage_key
            if not file_path.exists():
                return None
            with open(file_path, "rb") as f:
                return f.read()

        elif self.backend == "supabase":
            bucket = urllib.parse.quote(settings.SUPABASE_BUCKET_NAME)
            key = urllib.parse.quote(storage_key)
            url = f"{settings.SUPABASE_URL}/storage/v1/object/{bucket}/{key}"
            headers = {
                "apikey": settings.SUPABASE_SERVICE_ROLE_KEY,
                "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",
            }
            req = urllib.request.Request(url, headers=headers)
            try:
                with urllib.request.urlopen(req) as resp:
                    return resp.read()
            except urllib.error.HTTPError as e:
                logger.error("Supabase get_file failed: %s", e)
                return None

        else:
            import boto3
            s3_client = boto3.client(
                "s3",
                endpoint_url=settings.S3_ENDPOINT_URL,
                aws_access_key_id=settings.S3_ACCESS_KEY_ID,
                aws_secret_access_key=settings.S3_SECRET_ACCESS_KEY,
            )
            response = s3_client.get_object(
                Bucket=settings.S3_BUCKET_NAME,
                Key=storage_key,
            )
            return response["Body"].read()

    async def delete_file(self, storage_key: str) -> bool:
        """
        Deletes stored file.
        """
        try:
            if self.backend == "local":
                file_path = self.base_path / storage_key
                if file_path.exists():
                    file_path.unlink()
                return True

            elif self.backend == "supabase":
                bucket = urllib.parse.quote(settings.SUPABASE_BUCKET_NAME)
                url = f"{settings.SUPABASE_URL}/storage/v1/object/{bucket}"
                headers = {
                    "apikey": settings.SUPABASE_SERVICE_ROLE_KEY,
                    "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",
                    "Content-Type": "application/json",
                }
                data = json.dumps({"prefixes": [storage_key]}).encode()
                req = urllib.request.Request(url, data=data, headers=headers, method="DELETE")
                with urllib.request.urlopen(req) as resp:
                    return resp.status in (200, 204)

            else:
                import boto3
                s3_client = boto3.client(
                    "s3",
                    endpoint_url=settings.S3_ENDPOINT_URL,
                    aws_access_key_id=settings.S3_ACCESS_KEY_ID,
                    aws_secret_access_key=settings.S3_SECRET_ACCESS_KEY,
                )
                s3_client.delete_object(
                    Bucket=settings.S3_BUCKET_NAME,
                    Key=storage_key,
                )
                return True
        except Exception as e:
            logger.error(f"Failed to delete storage key {storage_key}: {e}")
            return False

    def generate_download_url(self, storage_key: str, expires_in: int = 900) -> str:
        """
        Generates pre-signed URL (or direct gateway URL for local / Supabase storage).
        """
        if self.backend == "local":
            return f"{settings.API_V1_STR}/documents/download/{storage_key}"
        elif self.backend == "supabase":
            bucket = urllib.parse.quote(settings.SUPABASE_BUCKET_NAME)
            key = urllib.parse.quote(storage_key)
            return f"{settings.SUPABASE_URL}/storage/v1/object/public/{bucket}/{key}"
        else:
            import boto3
            s3_client = boto3.client(
                "s3",
                endpoint_url=settings.S3_ENDPOINT_URL,
                aws_access_key_id=settings.S3_ACCESS_KEY_ID,
                aws_secret_access_key=settings.S3_SECRET_ACCESS_KEY,
            )
            return s3_client.generate_presigned_url(
                "get_object",
                Params={"Bucket": settings.S3_BUCKET_NAME, "Key": storage_key},
                ExpiresIn=expires_in,
            )


storage_service = StorageService()
