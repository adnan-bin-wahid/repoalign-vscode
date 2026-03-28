from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.profile_indexer import build_profile_index, save_profile_index

router = APIRouter()


class BuildProfileIndexRequest(BaseModel):
    workspace_path: str
    output_path: str = "data/profile_index.json"


@router.post("/build-profile-index")
def create_profile_index(request: BuildProfileIndexRequest):
    try:
        index_data = build_profile_index(request.workspace_path)
        save_profile_index(index_data, request.output_path)

        return {
            "workspace_path": index_data["workspace_path"],
            "total_files": index_data["total_files"],
            "output_path": request.output_path
        }
    except Exception as error:
        raise HTTPException(status_code=400, detail=str(error))