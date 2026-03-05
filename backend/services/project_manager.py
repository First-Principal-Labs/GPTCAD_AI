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
