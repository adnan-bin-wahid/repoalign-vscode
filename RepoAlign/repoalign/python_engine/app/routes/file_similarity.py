from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.file_reader import read_text_file
from app.services.embedder import compute_similarity

router = APIRouter()


class FileSimilarityRequest(BaseModel):
    file_path_1: str
    file_path_2: str


@router.post("/similarity-file")
def calculate_file_similarity(request: FileSimilarityRequest):
    try:
        content_1 = read_text_file(request.file_path_1)
        content_2 = read_text_file(request.file_path_2)

        similarity = compute_similarity(content_1, content_2)

        return {
            "file_path_1": request.file_path_1,
            "file_path_2": request.file_path_2,
            "similarity": similarity
        }
    except Exception as error:
        raise HTTPException(status_code=400, detail=str(error))