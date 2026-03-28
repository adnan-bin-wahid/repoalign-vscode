from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.similarity_service import find_similar_files

router = APIRouter()


class SimilarFilesRequest(BaseModel):
    query_file_path: str
    candidate_file_paths: list[str]
    top_k: int = 3


@router.post("/find-similar-files")
def find_similar_repository_files(request: SimilarFilesRequest):
    try:
        results = find_similar_files(
            query_file_path=request.query_file_path,
            candidate_file_paths=request.candidate_file_paths,
            top_k=request.top_k
        )

        return {
            "query_file_path": request.query_file_path,
            "top_k": request.top_k,
            "results": results
        }
    except Exception as error:
        raise HTTPException(status_code=400, detail=str(error))