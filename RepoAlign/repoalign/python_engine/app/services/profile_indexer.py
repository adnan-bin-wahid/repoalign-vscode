import json
from pathlib import Path
from datetime import datetime
from app.services.profile_builder import build_file_profile
from app.services.embedder import embed_text


ALLOWED_EXTENSIONS = {".ts"}


def scan_typescript_files(workspace_path: str) -> list[str]:
    workspace = Path(workspace_path)

    if not workspace.exists():
        raise FileNotFoundError(f"Workspace path not found: {workspace_path}")

    file_paths = []

    for file_path in workspace.rglob("*"):
        if not file_path.is_file():
            continue

        if file_path.suffix.lower() not in ALLOWED_EXTENSIONS:
            continue

        parts = {part.lower() for part in file_path.parts}

        if "node_modules" in parts or ".git" in parts or "dist" in parts or "out" in parts:
            continue

        file_paths.append(str(file_path.resolve()))

    return file_paths


def get_latest_file_mtime(file_paths: list[str]) -> float:
    if not file_paths:
        return 0.0

    latest_mtime = 0.0

    for file_path in file_paths:
        mtime = Path(file_path).stat().st_mtime
        if mtime > latest_mtime:
            latest_mtime = mtime

    return latest_mtime


def build_profile_index(workspace_path: str) -> dict:
    file_paths = scan_typescript_files(workspace_path)

    indexed_files = []

    for file_path in file_paths:
        profile = build_file_profile(file_path)
        embedding = embed_text(profile["profile_text"])

        indexed_files.append({
            "file_path": profile["file_path"],
            "role": profile["role"],
            "imports": profile["imports"],
            "class_names": profile["class_names"],
            "constructor_injections": profile["constructor_injections"],
            "injection_variables": profile["injection_variables"],
            "method_names": profile["method_names"],
            "service_calls": profile["service_calls"],
            "path_keywords": profile["path_keywords"],
            "profile_text": profile["profile_text"],
            "embedding": embedding
        })

    latest_mtime = get_latest_file_mtime(file_paths)

    return {
        "workspace_path": str(Path(workspace_path).resolve()),
        "total_files": len(indexed_files),
        "indexed_at": datetime.utcnow().isoformat(),
        "latest_workspace_mtime": latest_mtime,
        "files": indexed_files
    }


def save_profile_index(index_data: dict, output_path: str):
    output_file = Path(output_path)
    output_file.parent.mkdir(parents=True, exist_ok=True)

    with output_file.open("w", encoding="utf-8") as f:
        json.dump(index_data, f, indent=2)