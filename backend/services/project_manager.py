import json
import uuid
from pathlib import Path

from backend.config import settings


def create_project(project_id: str | None = None) -> tuple[str, Path]:
    """Create a new project directory and return (project_id, project_dir)."""
    if not project_id:
        project_id = uuid.uuid4().hex[:12]

    project_dir = settings.STORAGE_DIR / project_id
    project_dir.mkdir(parents=True, exist_ok=True)
    return project_id, project_dir


def get_project_dir(project_id: str) -> Path:
    """Get the directory for an existing project."""
    project_dir = settings.STORAGE_DIR / project_id
    if not project_dir.exists():
        raise FileNotFoundError(f"Project {project_id} not found")
    return project_dir


def get_next_version(project_id: str) -> int:
    """Return the next version number for a project."""
    project_dir = settings.STORAGE_DIR / project_id
    if not project_dir.exists():
        return 1
    existing = sorted(
        [d.name for d in project_dir.iterdir() if d.is_dir() and d.name.startswith("v")]
    )
    if not existing:
        return 1
    last = int(existing[-1][1:])
    return last + 1


def save_version(project_id: str, version: int, code: str, model_url: str) -> Path:
    """Save a version snapshot: code + metadata to v{n}/ subdirectory."""
    project_dir = settings.STORAGE_DIR / project_id
    version_dir = project_dir / f"v{version}"
    version_dir.mkdir(parents=True, exist_ok=True)

    # Save code
    (version_dir / "code.py").write_text(code)

    # Save metadata
    meta = {"version": version, "model_url": model_url}
    (version_dir / "meta.json").write_text(json.dumps(meta))

    return version_dir


def list_versions(project_id: str) -> list[dict]:
    """List all versions for a project."""
    project_dir = settings.STORAGE_DIR / project_id
    if not project_dir.exists():
        return []

    versions = []
    for d in sorted(project_dir.iterdir()):
        if d.is_dir() and d.name.startswith("v"):
            meta_path = d / "meta.json"
            if meta_path.exists():
                meta = json.loads(meta_path.read_text())
                code_path = d / "code.py"
                if code_path.exists():
                    meta["code"] = code_path.read_text()
                versions.append(meta)
    return versions


def get_version(project_id: str, version: int) -> dict:
    """Get a specific version's code and metadata."""
    project_dir = settings.STORAGE_DIR / project_id
    version_dir = project_dir / f"v{version}"
    if not version_dir.exists():
        raise FileNotFoundError(f"Version {version} not found for project {project_id}")

    meta = json.loads((version_dir / "meta.json").read_text())
    code_path = version_dir / "code.py"
    if code_path.exists():
        meta["code"] = code_path.read_text()
    return meta
