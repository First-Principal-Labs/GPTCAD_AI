"""Export CAD models to various formats using FreeCAD subprocess."""

import asyncio
from pathlib import Path

from backend.config import settings


async def export_to_format(brep_path: Path, output_path: Path, fmt: str) -> Path:
    """Convert a .brep file to the requested format.

    Supported formats: step, stl, obj
    """
    script = f'''
import sys
import FreeCAD
import Part

try:
    shape = Part.read(r"{brep_path}")
'''

    if fmt == "step":
        script += f'    shape.exportStep(r"{output_path}")\n'
    elif fmt == "stl":
        script += f'''
    import MeshPart, Mesh
    try:
        mesh_data = MeshPart.meshFromShape(
            Shape=shape,
            LinearDeflection=0.01,
            AngularDeflection=0.1,
            Relative=False
        )
        mesh_data.write(r"{output_path}")
    except Exception:
        doc = FreeCAD.newDocument("Export")
        obj = doc.addObject("Part::Feature", "Shape")
        obj.Shape = shape
        doc.recompute()
        Mesh.export([obj], r"{output_path}")
'''
    elif fmt == "obj":
        script += f'''
    import MeshPart, Mesh
    try:
        mesh_data = MeshPart.meshFromShape(
            Shape=shape,
            LinearDeflection=0.01,
            AngularDeflection=0.1,
            Relative=False
        )
        mesh_data.write(r"{output_path}")
    except Exception:
        doc = FreeCAD.newDocument("Export")
        obj = doc.addObject("Part::Feature", "Shape")
        obj.Shape = shape
        doc.recompute()
        Mesh.export([obj], r"{output_path}")
'''
    else:
        raise ValueError(f"Unsupported export format: {fmt}")

    script += '''
    print("EXPORT_OK")
except Exception as e:
    print(f"EXPORT_FAILED: {e}", file=sys.stderr)
    sys.exit(1)
'''

    script_path = brep_path.parent / f"export_{fmt}.py"
    script_path.write_text(script)

    process = await asyncio.create_subprocess_exec(
        settings.FREECAD_CMD,
        str(script_path),
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )

    stdout, stderr = await asyncio.wait_for(process.communicate(), timeout=30)

    # Cleanup script
    script_path.unlink(missing_ok=True)

    if not output_path.exists():
        raise RuntimeError(
            f"Export to {fmt} failed.\nstdout: {stdout.decode().strip()}\nstderr: {stderr.decode().strip()}"
        )

    return output_path
