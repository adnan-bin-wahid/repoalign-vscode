from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.profile_builder import build_file_profile
from app.services.embedder import embed_text

router = APIRouter()


class FileProfileRequest(BaseModel):
    file_path: str


@router.post("/profile-file")
def create_file_profile(request: FileProfileRequest):
    try:
        profile = build_file_profile(request.file_path)
        embedding = embed_text(profile["profile_text"])

        return {
            "file_path": profile["file_path"],
            "role": profile["role"],
            "imports": profile["imports"],
            "class_names": profile["class_names"],
            "constructor_injections": profile["constructor_injections"],
            "method_names": profile["method_names"],
            "path_keywords": profile["path_keywords"],
            "profile_text": profile["profile_text"],
            "embedding_dimension": len(embedding),
            "embedding_preview": embedding[:10]
        }
    except Exception as error:
        raise HTTPException(status_code=400, detail=str(error))