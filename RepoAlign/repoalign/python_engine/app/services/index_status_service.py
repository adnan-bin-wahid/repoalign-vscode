from pathlib import Path
from app.services.index_loader import load_profile_index
from app.services.profile_indexer import scan_typescript_files, get_latest_file_mtime


def get_index_status(index_path: str = "data/profile_index.json") -> dict:
    index_data = load_profile_index(index_path)

    workspace_path = index_data["workspace_path"]
    indexed_at = index_data.get("indexed_at")
    indexed_latest_mtime = index_data.get("latest_workspace_mtime", 0.0)

    current_files = scan_typescript_files(workspace_path)
    current_latest_mtime = get_latest_file_mtime(current_files)

    is_stale = current_latest_mtime > indexed_latest_mtime

    return {
        "workspace_path": workspace_path,
        "indexed_at": indexed_at,
        "indexed_total_files": index_data.get("total_files", 0),
        "current_total_files": len(current_files),
        "indexed_latest_mtime": indexed_latest_mtime,
        "current_latest_mtime": current_latest_mtime,
        "is_stale": is_stale
    }