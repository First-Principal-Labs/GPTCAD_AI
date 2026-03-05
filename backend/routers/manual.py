from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from backend.services.manual_codegen import generate_manual_code
from backend.services.freecad_runner import execute_freecad_script
from backend.services.mesh_converter import convert_brep_to_glb
from backend.services.project_manager import create_project, get_next_version, save_version

router = APIRouter(prefix="/api", tags=["manual"])


class ManualRequest(BaseModel):
    operation: str  # e.g. "box", "cylinder", "union", "move"
    category: str  # "primitive", "boolean", "transform"
    params: dict  # operation-specific parameters
    project_id: str | None = None
    existing_code: str | None = None


class ManualResponse(BaseModel):
    project_id: str
    model_url: str
    code: str
    version: int


@router.post("/manual", response_model=ManualResponse)
async def manual_operation(req: ManualRequest):
    """Execute a manual modeling operation."""
    try:
        # Generate FreeCAD code from structured operation
        code = generate_manual_code(
            operation=req.operation,
            category=req.category,
            params=req.params,
            existing_code=req.existing_code,
        )

        # Set up project
        project_id, project_dir = create_project(req.project_id)

        # Execute
        brep_path = await execute_freecad_script(code, project_dir)

        # Convert
        glb_path = project_dir / "model.glb"
        await convert_brep_to_glb(brep_path, glb_path)

        # Save version
        version = get_next_version(project_id)
        model_url = f"/storage/{project_id}/model.glb"
        save_version(project_id, version, code, model_url)
        (project_dir / "code.py").write_text(code)

        return ManualResponse(
            project_id=project_id,
            model_url=model_url,
            code=code,
            version=version,
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Manual operation failed: {e}")
