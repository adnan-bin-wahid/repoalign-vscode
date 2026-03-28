import json
from pathlib import Path
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity


def load_profile_index(index_path: str) -> dict:
    """Load profile index from JSON file."""
    index_file = Path(index_path)
    
    if not index_file.exists():
        raise FileNotFoundError(f"Profile index file not found: {index_path}")
    
    with index_file.open("r", encoding="utf-8") as f:
        return json.load(f)


def find_similar_files(query_file_path: str, candidate_file_paths: list[str], top_k: int = 3):
    normalized_query_path = str(Path(query_file_path).resolve())
    normalized_candidate_paths = {
        str(Path(candidate_path).resolve()) for candidate_path in candidate_file_paths
    }

    index_data = load_profile_index("data/profile_index.json")
    indexed_files = index_data.get("files", [])

    query_entry = None
    candidate_entries = []

    for entry in indexed_files:
        indexed_file_path = str(Path(entry["file_path"]).resolve())

        if indexed_file_path == normalized_query_path:
            query_entry = entry
            continue

        if indexed_file_path in normalized_candidate_paths:
            candidate_entries.append(entry)

    if query_entry is None:
        raise ValueError(f"Query file not found in profile index: {query_file_path}")

    query_embedding = np.array(query_entry["embedding"]).reshape(1, -1)

    results = []

    for entry in candidate_entries:
        candidate_embedding = np.array(entry["embedding"]).reshape(1, -1)
        similarity = cosine_similarity(query_embedding, candidate_embedding)[0][0]

        results.append({
            "file_path": entry["file_path"],
            "similarity": float(similarity),
            "role": entry.get("role"),
            "class_names": entry.get("class_names", []),
            "constructor_injections": entry.get("constructor_injections", [])
        })

    results.sort(key=lambda item: item["similarity"], reverse=True)

    return results[:top_k]