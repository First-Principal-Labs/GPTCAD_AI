from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import FileResponse

from backend.services.project_manager import get_project_dir
from backend.services.exporter import export_to_format

router = APIRouter(prefix="/api", tags=["export"])

SUPPORTED_FORMATS = {"step", "stl", "obj", "glb", "py"}

MIME_TYPES = {
    "step": "application/step",
    "stl": "application/sla",
    "obj": "text/plain",
    "glb": "model/gltf-binary",
    "py": "text/x-python",
}

EXTENSIONS = {
    "step": ".step",
    "stl": ".stl",
    "obj": ".obj",
    "glb": ".glb",
    "py": ".py",
}


@router.get("/export/{project_id}")
async def export_model(project_id: str, format: str = Query("glb")):
    """Export a project's model in the requested format."""
    fmt = format.lower()
    if fmt not in SUPPORTED_FORMATS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported format '{fmt}'. Supported: {', '.join(sorted(SUPPORTED_FORMATS))}",
        )

    try:
        project_dir = get_project_dir(project_id)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Project not found")

    # For .py, return the code file
    if fmt == "py":
        code_path = project_dir / "code.py"
        if not code_path.exists():
            raise HTTPException(status_code=404, detail="No code found for this project")
        return FileResponse(
            path=str(code_path),
            media_type=MIME_TYPES["py"],
            filename=f"{project_id}{EXTENSIONS['py']}",
        )

    # For .glb, return existing file
    if fmt == "glb":
        glb_path = project_dir / "model.glb"
        if not glb_path.exists():
            raise HTTPException(status_code=404, detail="No model found for this project")
        return FileResponse(
            path=str(glb_path),
            media_type=MIME_TYPES["glb"],
            filename=f"{project_id}{EXTENSIONS['glb']}",
        )

    # For step/stl/obj, convert from .brep
    brep_path = project_dir / "model.brep"
    if not brep_path.exists():
        raise HTTPException(status_code=404, detail="No model data found for this project")

    output_path = project_dir / f"export{EXTENSIONS[fmt]}"

    try:
        await export_to_format(brep_path, output_path, fmt)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Export failed: {e}")

    return FileResponse(
        path=str(output_path),
        media_type=MIME_TYPES[fmt],
        filename=f"{project_id}{EXTENSIONS[fmt]}",
    )
