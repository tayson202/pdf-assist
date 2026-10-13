"""
Storage Service
Abstracts file persistence across local filesystem and S3/MinIO object storage.
"""

import os
from pathlib import Path
from typing import Optional
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


class StorageService:
    def __init__(self):
        self.backend = settings.STORAGE_BACKEND
        if self.backend == "local":
            self.base_path = Path(settings.LOCAL_STORAGE_PATH)
            self.base_path.mkdir(parents=True, exist_ok=True)

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
        Generates pre-signed URL (or direct gateway URL for local storage).
        """
        if self.backend == "local":
            return f"{settings.API_V1_STR}/documents/download/{storage_key}"
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
