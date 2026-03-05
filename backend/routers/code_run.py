from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from backend.services.freecad_runner import execute_freecad_script
from backend.services.mesh_converter import convert_brep_to_glb
from backend.services.project_manager import create_project, get_next_version, save_version

router = APIRouter(prefix="/api", tags=["code"])


class CodeRunRequest(BaseModel):
    code: str
    project_id: str | None = None


class CodeRunResponse(BaseModel):
    project_id: str
    model_url: str
    code: str
    version: int


@router.post("/code/run", response_model=CodeRunResponse)
async def run_code(req: CodeRunRequest):
    """Execute user-edited FreeCAD Python code directly."""
    try:
        # Set up project
        project_id, project_dir = create_project(req.project_id)

        # Execute user code
        brep_path = await execute_freecad_script(req.code, project_dir)

        # Convert
        glb_path = project_dir / "model.glb"
        await convert_brep_to_glb(brep_path, glb_path)

        # Save version
        version = get_next_version(project_id)
        model_url = f"/storage/{project_id}/model.glb"
        save_version(project_id, version, req.code, model_url)
        (project_dir / "code.py").write_text(req.code)

        return CodeRunResponse(
            project_id=project_id,
            model_url=model_url,
            code=req.code,
            version=version,
        )

    except RuntimeError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Code execution failed: {e}")
