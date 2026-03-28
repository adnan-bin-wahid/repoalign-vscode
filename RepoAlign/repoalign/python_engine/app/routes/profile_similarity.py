from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.profile_similarity_service import compare_file_profiles

router = APIRouter()


class ProfileSimilarityRequest(BaseModel):
    file_path_1: str
    file_path_2: str


@router.post("/similarity-profile-file")
def calculate_profile_similarity(request: ProfileSimilarityRequest):
    try:
        result = compare_file_profiles(
            request.file_path_1,
            request.file_path_2
        )

        return result
    except Exception as error:
        raise HTTPException(status_code=400, detail=str(error))