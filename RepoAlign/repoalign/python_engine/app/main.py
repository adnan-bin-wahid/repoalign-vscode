from fastapi import FastAPI
from app.routes.health import router as health_router
from app.routes.embeddings import router as embeddings_router
from app.routes.similarity import router as similarity_router
from app.routes.file_embeddings import router as file_embeddings_router
from app.routes.file_similarity import router as file_similarity_router
from app.routes.file_retrieval import router as file_retrieval_router

app = FastAPI()

app.include_router(health_router)
app.include_router(embeddings_router)
app.include_router(similarity_router)
app.include_router(file_embeddings_router)
app.include_router(file_similarity_router)
app.include_router(file_retrieval_router)