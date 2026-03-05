"""LLM communication and FreeCAD code execution engine for CHATCAD addon."""

import json
import traceback
import urllib.request
import urllib.error

import FreeCAD
import Part

import chatcad_config as cfg

SYSTEM_PROMPT = """You are a FreeCAD Python code generator. You write Python scripts that run inside FreeCAD.

RULES:
1. Always start with: import FreeCAD, Part
2. Create a new document: doc = FreeCAD.newDocument("CHATCAD")
3. Use the Part workbench for solid modeling (Part.makeBox, Part.makeCylinder, Part.makeSphere, Part.makeCone, Part.makeTorus)
4. For complex shapes, use boolean operations: .fuse(), .cut(), .common()
5. For fillets: .makeFillet(), for chamfers: .makeChamfer()
6. Always add the final shape to the document:
   obj = doc.addObject("Part::Feature", "Result")
   obj.Shape = final_shape
   doc.recompute()
7. Use variables for all dimensions so they're easy to modify.
8. Add brief comments explaining each modeling step.
9. NEVER use any GUI or FreeCADGui commands - this runs in a non-GUI context.
10. NEVER use import FreeCADGui or Gui commands.
11. Use millimeters as the default unit.
12. Make sure the shape is valid and watertight.
13. Return ONLY the Python code, no explanations or markdown fences.
14. Do NOT include any Part.export() or OUTPUT_PATH lines — the host will handle export."""

ITERATE_PROMPT = """You are a FreeCAD Python code modifier. You receive existing FreeCAD Python code and a user instruction to modify it.

RULES:
1. You will receive the CURRENT working FreeCAD Python code and a modification instruction.
2. Return the COMPLETE modified Python script - not a diff or partial code.
3. Preserve the overall structure: imports, document creation.
4. Keep all existing features unless the user explicitly asks to remove them.
5. Use the same variable naming conventions as the original code.
6. Maintain parametric dimensions as variables.
7. Add brief comments for new/modified sections.
8. NEVER use GUI or FreeCADGui commands.
9. NEVER import FreeCADGui.
10. Use millimeters as the default unit.
11. Make sure the final shape is valid and watertight.
12. Return ONLY the Python code, no explanations or markdown fences.
13. Do NOT include any Part.export() or OUTPUT_PATH lines — the host will handle export."""


def _strip_fences(code: str) -> str:
    """Strip markdown code fences if present."""
    code = code.strip()
    if code.startswith("```"):
        lines = code.split("\n")
        lines = [l for l in lines if not l.strip().startswith("```")]
        code = "\n".join(lines)
    return code.strip()


def call_llm(prompt: str, existing_code: str = "") -> str:
    """Call the OpenAI-compatible API and return the generated code.

    Uses urllib so there are zero external dependencies beyond Python stdlib.
    """
    base_url = cfg.get_base_url().rstrip("/")
    api_key = cfg.get_api_key()
    model = cfg.get_model()
    temperature = cfg.get_temperature()

    if not base_url or not api_key:
        raise RuntimeError(
            "CHATCAD is not configured. Go to CHATCAD > Settings and enter "
            "your Base URL and API Key."
        )

    # Build messages
    if existing_code:
        system = ITERATE_PROMPT
        user_content = (
            f"CURRENT CODE:\n```python\n{existing_code}\n```\n\n"
            f"INSTRUCTION: {prompt}"
        )
    else:
        system = SYSTEM_PROMPT
        user_content = prompt

    messages = [
        {"role": "system", "content": system},
        {"role": "user", "content": user_content},
    ]

    payload = json.dumps({
        "model": model,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": 4096,
    }).encode("utf-8")

    url = f"{base_url}/chat/completions"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}",
    }

    req = urllib.request.Request(url, data=payload, headers=headers, method="POST")

    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"LLM API error {e.code}: {body}")
    except urllib.error.URLError as e:
        raise RuntimeError(f"Cannot reach LLM API at {base_url}: {e.reason}")

    content = data["choices"][0]["message"]["content"]
    return _strip_fences(content)


def execute_code(code: str) -> str:
    """Execute FreeCAD Python code in the current FreeCAD environment.

    Returns a status message. On success, the model will be visible in the
    active 3D view.
    """
    # Close any existing CHATCAD document to avoid duplicates
    for doc_name in list(FreeCAD.listDocuments().keys()):
        if doc_name == "CHATCAD":
            FreeCAD.closeDocument("CHATCAD")
            break

    # Execute the generated code
    try:
        exec(code, {"__builtins__": __builtins__})
    except Exception:
        return f"Execution failed:\n{traceback.format_exc()}"

    # Verify a document was created
    doc = FreeCAD.getDocument("CHATCAD")
    if doc is None:
        return "Error: Code did not create the expected 'CHATCAD' document."

    # Recompute and activate
    doc.recompute()

    try:
        import FreeCADGui
        FreeCADGui.ActiveDocument = FreeCADGui.getDocument("CHATCAD")
        FreeCADGui.SendMsgToActiveView("ViewFit")
    except Exception:
        pass

    # Count objects
    obj_count = len(doc.Objects)
    return f"Success: created {obj_count} object(s) in document."
