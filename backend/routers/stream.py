"""SSE streaming endpoints for generate and iterate with auto-retry."""

import json
import time
from collections.abc import AsyncGenerator

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from backend.services.llm import generate_freecad_code_stream, _strip_fences
from backend.services.freecad_runner import execute_freecad_script
from backend.services.mesh_converter import convert_brep_to_glb
from backend.services.project_manager import create_project, get_next_version, save_version

router = APIRouter(prefix="/api", tags=["stream"])

MAX_RETRIES = 2


class StreamGenerateRequest(BaseModel):
    prompt: str
    project_id: str | None = None


class StreamIterateRequest(BaseModel):
    project_id: str
    instruction: str
    current_code: str
    history: list[dict] | None = None


def _sse(event: str, data: str) -> str:
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"


def _sse_json(event: str, data: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"


async def _stream_pipeline(
    user_prompt: str,
    project_id: str | None,
    history: list[dict] | None,
    system_prompt_name: str,
    is_iterate: bool,
) -> AsyncGenerator[str, None]:
    """Core streaming pipeline shared by generate and iterate."""

    # Step 1: Stream LLM code generation
    yield _sse("status", "Generating code...")

    tokens: list[str] = []
    async for token in generate_freecad_code_stream(
        user_prompt, history=history, system_prompt_name=system_prompt_name
    ):
        tokens.append(token)
        yield _sse("token", token)

    raw_code = "".join(tokens)
    code = _strip_fences(raw_code)

    yield _sse("status", "Code generated. Executing...")

    # Step 2: Set up project
    pid, project_dir = create_project(project_id)

    # Step 3: Execute FreeCAD with auto-retry
    brep_path = None
    last_error = None

    for attempt in range(1 + MAX_RETRIES):
        try:
            yield _sse("status", f"Executing FreeCAD...{' (retry ' + str(attempt) + ')' if attempt > 0 else ''}")
            brep_path = await execute_freecad_script(code, project_dir)
            break
        except RuntimeError as e:
            last_error = str(e)
            if attempt < MAX_RETRIES:
                yield _sse("status", f"Execution failed. Asking AI to fix (attempt {attempt + 1}/{MAX_RETRIES})...")

                fix_prompt = (
                    f"The following FreeCAD Python code produced an error:\n\n"
                    f"```python\n{code}\n```\n\n"
                    f"Error:\n{last_error}\n\n"
                    f"Fix the code so it runs without errors. Return only the corrected code."
                )

                tokens = []
                async for token in generate_freecad_code_stream(
                    fix_prompt, system_prompt_name=system_prompt_name
                ):
                    tokens.append(token)
                    yield _sse("token", token)

                raw_code = "".join(tokens)
                code = _strip_fences(raw_code)
            else:
                yield _sse_json("error", {"detail": f"FreeCAD execution failed after {MAX_RETRIES} retries: {last_error}"})
                return

    if not brep_path:
        yield _sse_json("error", {"detail": "No output produced"})
        return

    # Step 4: Convert mesh
    yield _sse("status", "Converting mesh...")
    try:
        glb_path = project_dir / "model.glb"
        await convert_brep_to_glb(brep_path, glb_path)
    except Exception as e:
        yield _sse_json("error", {"detail": f"Mesh conversion failed: {e}"})
        return

    # Step 5: Save
    yield _sse("status", "Saving...")
    version = 1 if not is_iterate else get_next_version(pid)
    model_url = f"/storage/{pid}/model.glb"
    save_version(pid, version, code, model_url)
    (project_dir / "code.py").write_text(code)

    # Append cache-buster so Three.js / browser refetches the updated file
    model_url_cachebust = f"{model_url}?v={int(time.time())}"

    # Step 6: Done
    yield _sse_json("result", {
        "project_id": pid,
        "model_url": model_url_cachebust,
        "code": code,
        "version": version,
    })

    yield _sse("status", "Done")


@router.post("/generate/stream")
async def generate_stream(req: StreamGenerateRequest):
    async def event_generator():
        async for chunk in _stream_pipeline(
            user_prompt=req.prompt,
            project_id=req.project_id,
            history=None,
            system_prompt_name="system_prompt.txt",
            is_iterate=False,
        ):
            yield chunk

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.post("/iterate/stream")
async def iterate_stream(req: StreamIterateRequest):
    iteration_prompt = (
        f"Here is the current FreeCAD Python code:\n\n```python\n{req.current_code}\n```\n\n"
        f"Modify it according to this instruction: {req.instruction}"
    )

    async def event_generator():
        async for chunk in _stream_pipeline(
            user_prompt=iteration_prompt,
            project_id=req.project_id,
            history=req.history,
            system_prompt_name="iterate_prompt.txt",
            is_iterate=True,
        ):
            yield chunk

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
