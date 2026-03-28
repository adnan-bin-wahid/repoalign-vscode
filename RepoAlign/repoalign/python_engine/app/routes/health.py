from fastapi import APIRouter

router = APIRouter()


@router.get("/")
def read_root():
    return {"message": "RepoAlign Python engine is running."}


@router.get("/health")
def health_check():
    return {"status": "ok"}