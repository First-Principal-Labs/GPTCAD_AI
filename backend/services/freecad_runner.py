import asyncio
import tempfile
from pathlib import Path

from backend.config import settings


async def execute_freecad_script(code: str, project_dir: Path) -> Path:
    """Execute a FreeCAD Python script and return the path to the output .brep file.

    The code is expected to export to OUTPUT_PATH, which we inject as a variable.
    """
    project_dir.mkdir(parents=True, exist_ok=True)
    output_path = project_dir / "model.brep"

    # Prepend OUTPUT_PATH variable to the user code
    full_script = f'OUTPUT_PATH = r"{output_path}"\nimport math\n\n{code}'

    script_path = project_dir / "script.py"
    script_path.write_text(full_script)

    process = await asyncio.create_subprocess_exec(
        settings.FREECAD_CMD,
        str(script_path),
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
        cwd=str(project_dir),
    )

    stdout, stderr = await asyncio.wait_for(process.communicate(), timeout=60)

    if process.returncode != 0:
        error_msg = stderr.decode().strip() or stdout.decode().strip()
        raise RuntimeError(f"FreeCAD execution failed (exit {process.returncode}):\n{error_msg}")

    if not output_path.exists():
        # Check if FreeCAD wrote any output - sometimes errors go to stdout
        all_output = stdout.decode() + "\n" + stderr.decode()
        raise RuntimeError(f"FreeCAD did not produce output file.\n{all_output.strip()}")

    return output_path
