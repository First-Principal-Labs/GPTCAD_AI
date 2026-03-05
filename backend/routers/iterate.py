from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from backend.services.llm import generate_freecad_code
from backend.services.freecad_runner import execute_freecad_script
from backend.services.mesh_converter import convert_brep_to_glb
from backend.services.project_manager import (
    create_project,
    get_next_version,
    save_version,
)

router = APIRouter(prefix="/api", tags=["iterate"])


class IterateRequest(BaseModel):
    project_id: str
    instruction: str
    current_code: str
    history: list[dict] | None = None


class IterateResponse(BaseModel):
    project_id: str
    model_url: str
    code: str
    version: int


@router.post("/iterate", response_model=IterateResponse)
async def iterate(req: IterateRequest):
    """Refine an existing CAD model with a follow-up instruction."""
    try:
        # Build conversation history for iteration context
        history = []
        if req.history:
            history.extend(req.history)

        # Add the current code as context
        iteration_prompt = (
            f"Here is the current FreeCAD Python code:\n\n```python\n{req.current_code}\n```\n\n"
            f"Modify it according to this instruction: {req.instruction}"
        )

        code = await generate_freecad_code(
            iteration_prompt,
            history=history,
            system_prompt_name="iterate_prompt.txt",
        )

        # Set up project directory
        project_id, project_dir = create_project(req.project_id)

        # Execute FreeCAD script
        brep_path = await execute_freecad_script(code, project_dir)

        # Convert to glTF
        glb_path = project_dir / "model.glb"
        await convert_brep_to_glb(brep_path, glb_path)

        # Save version
        version = get_next_version(project_id)
        model_url = f"/storage/{project_id}/model.glb"
        save_version(project_id, version, code, model_url)

        # Also save as current code
        (project_dir / "code.py").write_text(code)

        return IterateResponse(
            project_id=project_id,
            model_url=model_url,
            code=code,
            version=version,
        )

    except RuntimeError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Iteration failed: {e}")
