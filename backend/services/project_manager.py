import json
import shutil
import uuid
from datetime import datetime, timezone
from pathlib import Path

from backend.config import settings


def _project_meta_path(project_id: str) -> Path:
    return settings.STORAGE_DIR / project_id / "project.json"


def _read_project_meta(project_id: str) -> dict | None:
    meta_path = _project_meta_path(project_id)
    if meta_path.exists():
        return json.loads(meta_path.read_text())
    return None


def _write_project_meta(project_id: str, meta: dict) -> None:
    meta_path = _project_meta_path(project_id)
    meta_path.parent.mkdir(parents=True, exist_ok=True)
    meta_path.write_text(json.dumps(meta))


def _touch_project(project_id: str) -> None:
    """Update the updated_at timestamp for a project."""
    meta = _read_project_meta(project_id)
    if meta:
        meta["updated_at"] = datetime.now(timezone.utc).isoformat()
        _write_project_meta(project_id, meta)


def create_project(project_id: str | None = None, name: str | None = None) -> tuple[str, Path]:
    """Create a new project directory and return (project_id, project_dir)."""
    if not project_id:
        project_id = uuid.uuid4().hex[:12]

    project_dir = settings.STORAGE_DIR / project_id
    project_dir.mkdir(parents=True, exist_ok=True)

    # Initialize project metadata if it doesn't exist
    if not _project_meta_path(project_id).exists():
        now = datetime.now(timezone.utc).isoformat()
        _write_project_meta(project_id, {
            "id": project_id,
            "name": name or "Untitled Project",
            "created_at": now,
            "updated_at": now,
        })

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

    # Update project timestamp
    _touch_project(project_id)

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


def list_projects() -> list[dict]:
    """List all projects with summary info."""
    storage = settings.STORAGE_DIR
    if not storage.exists():
        return []

    projects = []
    for d in storage.iterdir():
        if not d.is_dir():
            continue
        meta = _read_project_meta(d.name)
        if not meta:
            continue
        # Count versions
        version_count = len([
            v for v in d.iterdir()
            if v.is_dir() and v.name.startswith("v")
        ])
        meta["version_count"] = version_count
        projects.append(meta)

    projects.sort(key=lambda p: p.get("updated_at", ""), reverse=True)
    return projects


def get_project(project_id: str) -> dict:
    """Get full project details including version list."""
    meta = _read_project_meta(project_id)
    if not meta:
        raise FileNotFoundError(f"Project {project_id} not found")
    meta["versions"] = list_versions(project_id)
    return meta


def rename_project(project_id: str, name: str) -> dict:
    """Rename a project."""
    meta = _read_project_meta(project_id)
    if not meta:
        raise FileNotFoundError(f"Project {project_id} not found")
    meta["name"] = name
    meta["updated_at"] = datetime.now(timezone.utc).isoformat()
    _write_project_meta(project_id, meta)
    return meta


def delete_project(project_id: str) -> None:
    """Delete a project and all its files."""
    project_dir = settings.STORAGE_DIR / project_id
    if not project_dir.exists():
        raise FileNotFoundError(f"Project {project_id} not found")
    shutil.rmtree(project_dir)
