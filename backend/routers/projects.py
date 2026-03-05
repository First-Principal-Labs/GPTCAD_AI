from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from backend.services.project_manager import (
    create_project,
    list_projects,
    get_project,
    rename_project,
    delete_project,
)

router = APIRouter(prefix="/api", tags=["projects"])


class CreateProjectRequest(BaseModel):
    name: str | None = None


class RenameProjectRequest(BaseModel):
    name: str


class ProjectSummary(BaseModel):
    id: str
    name: str
    created_at: str
    updated_at: str
    version_count: int


class ProjectDetail(BaseModel):
    id: str
    name: str
    created_at: str
    updated_at: str
    versions: list[dict]


@router.get("/projects", response_model=list[ProjectSummary])
async def list_all_projects():
    return list_projects()


@router.post("/projects", response_model=ProjectSummary)
async def create_new_project(req: CreateProjectRequest):
    project_id, _ = create_project(name=req.name)
    project = get_project(project_id)
    return ProjectSummary(
        id=project["id"],
        name=project["name"],
        created_at=project["created_at"],
        updated_at=project["updated_at"],
        version_count=0,
    )


@router.get("/projects/{project_id}", response_model=ProjectDetail)
async def get_project_detail(project_id: str):
    try:
        project = get_project(project_id)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.patch("/projects/{project_id}", response_model=ProjectSummary)
async def rename(project_id: str, req: RenameProjectRequest):
    try:
        meta = rename_project(project_id, req.name)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Project not found")
    return ProjectSummary(
        id=meta["id"],
        name=meta["name"],
        created_at=meta["created_at"],
        updated_at=meta["updated_at"],
        version_count=0,
    )


@router.delete("/projects/{project_id}")
async def delete(project_id: str):
    try:
        delete_project(project_id)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"status": "deleted"}
