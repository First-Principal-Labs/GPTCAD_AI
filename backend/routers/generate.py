import time

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from backend.services.llm import generate_freecad_code
from backend.services.freecad_runner import execute_freecad_script
from backend.services.mesh_converter import convert_brep_to_glb
from backend.services.project_manager import create_project, save_version

router = APIRouter(prefix="/api", tags=["generate"])


class GenerateRequest(BaseModel):
    prompt: str
    project_id: str | None = None


class GenerateResponse(BaseModel):
    project_id: str
    model_url: str
    code: str
    version: int


@router.post("/generate", response_model=GenerateResponse)
async def generate(req: GenerateRequest):
    """Generate a CAD model from a natural language prompt."""
    try:
        # 1. Generate FreeCAD code via LLM
        code = await generate_freecad_code(req.prompt)

        # 2. Set up project directory
        project_id, project_dir = create_project(req.project_id)

        # 3. Execute FreeCAD script
        brep_path = await execute_freecad_script(code, project_dir)

        # 4. Convert to glTF
        glb_path = project_dir / "model.glb"
        await convert_brep_to_glb(brep_path, glb_path)

        # 5. Save as version 1 and current code
        model_url = f"/storage/{project_id}/model.glb"
        save_version(project_id, 1, code, model_url)
        (project_dir / "code.py").write_text(code)

        return GenerateResponse(
            project_id=project_id,
            model_url=f"{model_url}?v={int(time.time())}",
            code=code,
            version=1,
        )

    except RuntimeError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Generation failed: {e}")
