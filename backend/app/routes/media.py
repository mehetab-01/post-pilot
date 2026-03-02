import os
import uuid
from datetime import datetime
from pathlib import Path

import aiofiles
from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models.models import Media, User
from app.schemas.schemas import MediaResponse
from app.security import get_current_user

router = APIRouter(prefix="/api/media", tags=["media"])

_MAX_SIZE_BYTES = 50 * 1024 * 1024  # 50 MB

_ALLOWED_EXTENSIONS = {
    ".jpg": "image",
    ".jpeg": "image",
    ".png": "image",
    ".gif": "image",
    ".webp": "image",
    ".mp4": "video",
    ".webm": "video",
}


def _classify_extension(filename: str) -> str:
    ext = Path(filename).suffix.lower()
    media_type = _ALLOWED_EXTENSIONS.get(ext)
    if not media_type:
        allowed = ", ".join(_ALLOWED_EXTENSIONS.keys())
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type '{ext}'. Allowed: {allowed}",
        )
    return media_type


@router.post("/upload", response_model=MediaResponse, status_code=status.HTTP_201_CREATED)
async def upload_media(
    file: UploadFile,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if file.filename is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No filename provided.")

    media_type = _classify_extension(file.filename)

    # Read file into memory to check size before writing to disk
    contents = await file.read()
    if len(contents) > _MAX_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large. Maximum size is 50 MB.",
        )

    # Build a unique filename to avoid collisions
    ext = Path(file.filename).suffix.lower()
    unique_name = f"{uuid.uuid4().hex}{ext}"

    user_dir = Path(settings.UPLOAD_DIR) / str(current_user.id)
    user_dir.mkdir(parents=True, exist_ok=True)

    dest_path = user_dir / unique_name

    async with aiofiles.open(dest_path, "wb") as f:
        await f.write(contents)

    media = Media(
        user_id=current_user.id,
        filename=file.filename,
        filepath=str(dest_path),
        media_type=media_type,
        created_at=datetime.utcnow(),
    )
    db.add(media)
    db.commit()
    db.refresh(media)

    return media


@router.get("/{media_id}", response_class=FileResponse)
def serve_media(
    media_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    media = (
        db.query(Media)
        .filter(Media.id == media_id, Media.user_id == current_user.id)
        .first()
    )
    if not media:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Media {media_id} not found.",
        )

    if not os.path.exists(media.filepath):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found on disk. It may have been deleted.",
        )

    return FileResponse(path=media.filepath, filename=media.filename)


@router.delete("/{media_id}", status_code=status.HTTP_200_OK)
def delete_media(
    media_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    media = (
        db.query(Media)
        .filter(Media.id == media_id, Media.user_id == current_user.id)
        .first()
    )
    if not media:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Media {media_id} not found.",
        )

    # Delete file from disk if it exists
    if os.path.exists(media.filepath):
        os.remove(media.filepath)

    db.delete(media)
    db.commit()

    return {"deleted": media_id, "filename": media.filename, "message": f"Media {media_id} deleted."}
