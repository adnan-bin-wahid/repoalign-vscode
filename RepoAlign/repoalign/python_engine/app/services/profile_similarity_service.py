from app.services.profile_builder import build_file_profile
from app.services.embedder import compute_similarity


def compare_file_profiles(file_path_1: str, file_path_2: str):
    profile_1 = build_file_profile(file_path_1)
    profile_2 = build_file_profile(file_path_2)

    similarity = compute_similarity(
        profile_1["profile_text"],
        profile_2["profile_text"]
    )

    return {
        "file_path_1": file_path_1,
        "file_path_2": file_path_2,
        "profile_text_1": profile_1["profile_text"],
        "profile_text_2": profile_2["profile_text"],
        "similarity": similarity
    }