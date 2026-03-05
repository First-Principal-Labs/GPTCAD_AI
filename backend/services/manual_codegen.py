"""Generate FreeCAD Python code for manual modeling operations."""


def _preamble(existing_code: str | None) -> str:
    if existing_code:
        return existing_code.rstrip() + "\n\n"
    return (
        'import FreeCAD, Part\n'
        'doc = FreeCAD.newDocument("GPTCAD")\n\n'
    )


def _export_block() -> str:
    return (
        '\n# Export result\n'
        'obj = doc.addObject("Part::Feature", "Result")\n'
        'obj.Shape = result_shape\n'
        'doc.recompute()\n'
        'Part.export([obj], OUTPUT_PATH)\n'
    )


def generate_primitive(op: str, params: dict, existing_code: str | None = None) -> str:
    """Generate code for a primitive shape operation."""
    code = _preamble(existing_code)

    if op == "box":
        w = params.get("width", 10)
        h = params.get("height", 10)
        d = params.get("depth", 10)
        code += f"# Create box {w} x {h} x {d} mm\n"
        code += f"result_shape = Part.makeBox({w}, {h}, {d})\n"

    elif op == "cylinder":
        r = params.get("radius", 5)
        h = params.get("height", 10)
        code += f"# Create cylinder r={r} h={h} mm\n"
        code += f"result_shape = Part.makeCylinder({r}, {h})\n"

    elif op == "sphere":
        r = params.get("radius", 5)
        code += f"# Create sphere r={r} mm\n"
        code += f"result_shape = Part.makeSphere({r})\n"

    elif op == "cone":
        r1 = params.get("radius1", 5)
        r2 = params.get("radius2", 0)
        h = params.get("height", 10)
        code += f"# Create cone r1={r1} r2={r2} h={h} mm\n"
        code += f"result_shape = Part.makeCone({r1}, {r2}, {h})\n"

    elif op == "torus":
        r1 = params.get("major_radius", 10)
        r2 = params.get("minor_radius", 3)
        code += f"# Create torus R={r1} r={r2} mm\n"
        code += f"result_shape = Part.makeTorus({r1}, {r2})\n"

    else:
        raise ValueError(f"Unknown primitive: {op}")

    code += _export_block()
    return code


def generate_boolean(op: str, params: dict, existing_code: str) -> str:
    """Generate code for a boolean operation appended to existing code."""
    # We need to add a second shape and boolean it with the result
    tool_type = params.get("tool_type", "box")
    tool_params = params.get("tool_params", {})

    code = existing_code.rstrip() + "\n\n"
    code += f"# Boolean {op}\n"
    code += f"existing_shape = result_shape\n"

    # Generate tool shape
    if tool_type == "box":
        w = tool_params.get("width", 10)
        h = tool_params.get("height", 10)
        d = tool_params.get("depth", 10)
        x = tool_params.get("x", 0)
        y = tool_params.get("y", 0)
        z = tool_params.get("z", 0)
        code += f"tool_shape = Part.makeBox({w}, {h}, {d}, FreeCAD.Vector({x}, {y}, {z}))\n"
    elif tool_type == "cylinder":
        r = tool_params.get("radius", 5)
        ht = tool_params.get("height", 20)
        x = tool_params.get("x", 0)
        y = tool_params.get("y", 0)
        z = tool_params.get("z", 0)
        code += f"tool_shape = Part.makeCylinder({r}, {ht}, FreeCAD.Vector({x}, {y}, {z}))\n"
    else:
        code += f"tool_shape = Part.makeSphere(5)\n"

    if op == "union":
        code += "result_shape = existing_shape.fuse(tool_shape)\n"
    elif op == "cut":
        code += "result_shape = existing_shape.cut(tool_shape)\n"
    elif op == "intersect":
        code += "result_shape = existing_shape.common(tool_shape)\n"

    code += _export_block()
    return code


def generate_transform(op: str, params: dict, existing_code: str) -> str:
    """Generate code for a transform operation on existing shape."""
    code = existing_code.rstrip() + "\n\n"

    if op == "move":
        x = params.get("x", 0)
        y = params.get("y", 0)
        z = params.get("z", 0)
        code += f"# Move by ({x}, {y}, {z})\n"
        code += f"result_shape = result_shape.translated(FreeCAD.Vector({x}, {y}, {z}))\n"

    elif op == "rotate":
        axis = params.get("axis", "z")
        angle = params.get("angle", 45)
        axis_map = {"x": "(1,0,0)", "y": "(0,1,0)", "z": "(0,0,1)"}
        axis_vec = axis_map.get(axis, "(0,0,1)")
        code += f"# Rotate {angle} deg around {axis}\n"
        code += f"import math\n"
        code += f"result_shape = result_shape.rotated(FreeCAD.Vector(0,0,0), FreeCAD.Vector{axis_vec}, {angle})\n"

    elif op == "mirror":
        plane = params.get("plane", "xy")
        plane_map = {
            "xy": "FreeCAD.Vector(0,0,0), FreeCAD.Vector(0,0,1)",
            "xz": "FreeCAD.Vector(0,0,0), FreeCAD.Vector(0,1,0)",
            "yz": "FreeCAD.Vector(0,0,0), FreeCAD.Vector(1,0,0)",
        }
        code += f"# Mirror across {plane} plane\n"
        code += f"result_shape = result_shape.mirror({plane_map.get(plane, plane_map['xy'])})\n"

    code += _export_block()
    return code


def generate_manual_code(operation: str, category: str, params: dict, existing_code: str | None = None) -> str:
    """Main entry point: route to the correct generator."""
    if category == "primitive":
        return generate_primitive(operation, params, existing_code)
    elif category == "boolean":
        if not existing_code:
            raise ValueError("Boolean operations require existing code")
        return generate_boolean(operation, params, existing_code)
    elif category == "transform":
        if not existing_code:
            raise ValueError("Transform operations require existing code")
        return generate_transform(operation, params, existing_code)
    else:
        raise ValueError(f"Unknown category: {category}")
