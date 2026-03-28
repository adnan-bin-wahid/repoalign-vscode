from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

_model = None


def get_model():
    global _model

    if _model is None:
        _model = SentenceTransformer("all-MiniLM-L6-v2")

    return _model


def embed_text(text: str):
    model = get_model()
    embedding = model.encode(text)
    return embedding.tolist()


def compute_similarity(text1: str, text2: str):
    model = get_model()

    emb1 = model.encode(text1)
    emb2 = model.encode(text2)

    emb1 = np.array(emb1).reshape(1, -1)
    emb2 = np.array(emb2).reshape(1, -1)

    score = cosine_similarity(emb1, emb2)[0][0]

    return float(score)