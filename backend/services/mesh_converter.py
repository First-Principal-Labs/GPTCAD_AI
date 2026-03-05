import asyncio
from pathlib import Path

from backend.config import settings


async def convert_brep_to_glb(brep_path: Path, output_path: Path) -> Path:
    """Convert a .brep file to .glb using FreeCAD's mesh export + trimesh.

    Two-stage pipeline:
    1. FreeCAD reads .brep shape and exports triangulated .stl
    2. trimesh converts .stl to .glb (binary glTF)
    """
    stl_path = output_path.with_suffix(".stl")

    convert_script = f'''
import sys
import FreeCAD
import Part
import MeshPart
import Mesh

try:
    shape = Part.read(r"{brep_path}")

    # Tessellate using MeshPart for better quality
    mesh_data = MeshPart.meshFromShape(
        Shape=shape,
        LinearDeflection=0.01,
        AngularDeflection=0.1,
        Relative=False
    )
    mesh_data.write(r"{stl_path}")
    print("MESH_EXPORT_OK")
except Exception as e:
    # Fallback: use basic Mesh tessellation
    try:
        shape = Part.read(r"{brep_path}")
        doc = FreeCAD.newDocument("Convert")
        obj = doc.addObject("Part::Feature", "Shape")
        obj.Shape = shape
        doc.recompute()
        Mesh.export([obj], r"{stl_path}")
        print("MESH_EXPORT_OK_FALLBACK")
    except Exception as e2:
        print(f"MESH_EXPORT_FAILED: {{e2}}", file=sys.stderr)
        sys.exit(1)
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
        raise RuntimeError(
            f"Mesh conversion failed.\nstdout: {stdout.decode().strip()}\nstderr: {stderr.decode().strip()}"
        )

    # Convert STL to GLB using trimesh
    import trimesh
    mesh = trimesh.load(str(stl_path))

    # Merge duplicate vertices so GLB gets smooth vertex normals
    # instead of flat per-face normals from STL triangle soup
    mesh.merge_vertices()

    mesh.export(str(output_path), file_type="glb")

    # Cleanup intermediate files
    stl_path.unlink(missing_ok=True)
    script_path.unlink(missing_ok=True)

    return output_path
