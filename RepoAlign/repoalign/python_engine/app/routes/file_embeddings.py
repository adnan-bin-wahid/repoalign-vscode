from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.file_reader import read_text_file
from app.services.embedder import embed_text

router = APIRouter()


class EmbedFileRequest(BaseModel):
    file_path: str


@router.post("/embed-file")
def create_file_embedding(request: EmbedFileRequest):
    try:
        content = read_text_file(request.file_path)
        embedding = embed_text(content)

        return {
            "file_path": request.file_path,
            "content_preview": content[:200],
            "embedding_dimension": len(embedding),
            "embedding_preview": embedding[:10]
        }
    except Exception as error:
        raise HTTPException(status_code=400, detail=str(error))