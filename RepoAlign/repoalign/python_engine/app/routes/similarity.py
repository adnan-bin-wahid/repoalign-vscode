from fastapi import APIRouter
from pydantic import BaseModel
from app.services.embedder import compute_similarity

router = APIRouter()


class SimilarityRequest(BaseModel):
    text1: str
    text2: str


@router.post("/similarity")
def calculate_similarity(request: SimilarityRequest):
    score = compute_similarity(request.text1, request.text2)

    return {
        "text1": request.text1,
        "text2": request.text2,
        "similarity": score
    }