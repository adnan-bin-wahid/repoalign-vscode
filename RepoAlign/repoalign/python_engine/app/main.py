from fastapi import FastAPI
from app.routes.health import router as health_router
from app.routes.embeddings import router as embeddings_router
from app.routes.similarity import router as similarity_router
from app.routes.file_embeddings import router as file_embeddings_router
from app.routes.file_similarity import router as file_similarity_router
from app.routes.file_retrieval import router as file_retrieval_router
from app.routes.file_profile import router as file_profile_router
from app.routes.profile_similarity import router as profile_similarity_router
from app.routes.profile_index import router as profile_index_router
from app.routes.index_status import router as index_status_router

app = FastAPI()

app.include_router(health_router)
app.include_router(embeddings_router)
app.include_router(similarity_router)
app.include_router(file_embeddings_router)
app.include_router(file_similarity_router)
app.include_router(file_retrieval_router)
app.include_router(file_profile_router)
app.include_router(profile_similarity_router)
app.include_router(profile_index_router)
app.include_router(index_status_router)