from pathlib import Path
from app.services.file_reader import read_text_file
from app.services.embedder import compute_similarity


def find_similar_files(query_file_path: str, candidate_file_paths: list[str], top_k: int = 3):
    normalized_query_path = str(Path(query_file_path).resolve())
    query_content = read_text_file(normalized_query_path)

    results = []

    for candidate_file_path in candidate_file_paths:
        normalized_candidate_path = str(Path(candidate_file_path).resolve())

        if normalized_candidate_path == normalized_query_path:
            continue

        candidate_content = read_text_file(normalized_candidate_path)
        similarity = compute_similarity(query_content, candidate_content)

        results.append({
            "file_path": normalized_candidate_path,
            "similarity": similarity
        })

    results.sort(key=lambda item: item["similarity"], reverse=True)

    return results[:top_k]