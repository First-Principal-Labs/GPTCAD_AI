import asyncio
from pathlib import Path

from backend.config import settings


async def convert_brep_to_glb(brep_path: Path, output_path: Path) -> Path:
    """Convert a .brep file to .glb using FreeCAD's mesh export.

    Runs a small FreeCAD script that loads the .brep and exports as mesh.
    Then converts the mesh to glTF using trimesh.
    """
    # First export to STL via FreeCAD, then convert STL to GLB via trimesh
    stl_path = output_path.with_suffix(".stl")

    convert_script = f'''
import FreeCAD
import Part
import Mesh

shape = Part.read(r"{brep_path}")
mesh = Mesh.Mesh()
# Tessellate with 0.1mm tolerance for good quality
mesh.addFacets(shape.tessellate(0.1))
mesh.write(r"{stl_path}")
'''

    script_path = brep_path.parent / "convert.py"
    script_path.write_text(convert_script)

    process = await asyncio.create_subprocess_exec(
        settings.FREECAD_CMD,
        str(script_path),
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )

    stdout, stderr = await asyncio.wait_for(process.communicate(), timeout=30)

    if not stl_path.exists():
        # Fallback: try trimesh directly if it can read .brep
        raise RuntimeError(
            f"Mesh conversion failed.\n{stderr.decode().strip()}"
        )

    # Convert STL to GLB using trimesh
    import trimesh
    mesh = trimesh.load(str(stl_path))
    mesh.export(str(output_path), file_type="glb")

    # Cleanup intermediate STL
    stl_path.unlink(missing_ok=True)
    script_path.unlink(missing_ok=True)

    return output_path
