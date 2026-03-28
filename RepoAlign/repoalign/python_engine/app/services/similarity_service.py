from pathlib import Path
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from app.services.index_loader import load_profile_index


def compute_pattern_overlap_score(query_patterns: list[str], candidate_patterns: list[str]) -> float:
    query_set = set(query_patterns)
    candidate_set = set(candidate_patterns)

    if not query_set and not candidate_set:
        return 0.0

    intersection = len(query_set.intersection(candidate_set))
    union = len(query_set.union(candidate_set))

    if union == 0:
        return 0.0

    return intersection / union


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
    query_patterns = query_entry.get("pattern_set", [])

    results = []

    for entry in candidate_entries:
        candidate_embedding = np.array(entry["embedding"]).reshape(1, -1)
        embedding_similarity = cosine_similarity(query_embedding, candidate_embedding)[0][0]

        candidate_patterns = entry.get("pattern_set", [])
        graph_overlap_score = compute_pattern_overlap_score(query_patterns, candidate_patterns)

        final_score = (0.75 * float(embedding_similarity)) + (0.25 * float(graph_overlap_score))

        results.append({
            "file_path": entry["file_path"],
            "similarity": float(final_score),
            "embedding_similarity": float(embedding_similarity),
            "graph_overlap_score": float(graph_overlap_score),
            "role": entry.get("role"),
            "class_names": entry.get("class_names", []),
            "constructor_injections": entry.get("constructor_injections", []),
            "pattern_set": candidate_patterns
        })

    results.sort(key=lambda item: item["similarity"], reverse=True)

    return results[:top_k]