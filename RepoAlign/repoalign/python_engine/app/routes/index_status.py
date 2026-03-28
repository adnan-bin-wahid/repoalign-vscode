from fastapi import APIRouter, HTTPException
from app.services.index_status_service import get_index_status

router = APIRouter()


@router.get("/index-status")
def read_index_status():
    try:
        return get_index_status("data/profile_index.json")
    except Exception as error:
        raise HTTPException(status_code=400, detail=str(error))