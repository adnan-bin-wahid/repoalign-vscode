from fastapi import APIRouter
from pydantic import BaseModel
from app.services.embedder import embed_text

router = APIRouter()


class EmbedTextRequest(BaseModel):
    text: str


@router.post("/embed-text")
def create_text_embedding(request: EmbedTextRequest):
    embedding = embed_text(request.text)

    return {
        "text": request.text,
        "embedding_dimension": len(embedding),
        "embedding_preview": embedding[:10]
    }