from pathlib import Path
from app.services.profile_builder import build_file_profile
from app.services.embedder import compute_similarity


def find_similar_files(query_file_path: str, candidate_file_paths: list[str], top_k: int = 3):
    normalized_query_path = str(Path(query_file_path).resolve())
    query_profile = build_file_profile(normalized_query_path)
    query_profile_text = query_profile["profile_text"]

    results = []

    for candidate_file_path in candidate_file_paths:
        normalized_candidate_path = str(Path(candidate_file_path).resolve())

        if normalized_candidate_path == normalized_query_path:
            continue

        candidate_profile = build_file_profile(normalized_candidate_path)
        candidate_profile_text = candidate_profile["profile_text"]

        similarity = compute_similarity(query_profile_text, candidate_profile_text)

        results.append({
            "file_path": normalized_candidate_path,
            "similarity": similarity,
            "role": candidate_profile["role"],
            "class_names": candidate_profile["class_names"],
            "constructor_injections": candidate_profile["constructor_injections"]
        })

    results.sort(key=lambda item: item["similarity"], reverse=True)

    return results[:top_k]