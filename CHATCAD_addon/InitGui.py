"""FreeCAD GUI initialization for CHATCAD addon."""

import os
import FreeCADGui

# __file__ is not always defined when FreeCAD exec()s this script,
# so derive the addon path from the module search path instead.
_addon_dir = os.path.dirname(os.path.abspath(__file__)) if "__file__" in dir() else ""
if not _addon_dir:
    # Fallback: scan sys.path for our directory
    import sys
    for p in sys.path:
        if os.path.isfile(os.path.join(p, "chatcad_panel.py")):
            _addon_dir = p
            break

_icon_path = os.path.join(_addon_dir, "resources", "icons", "chatcad.svg") if _addon_dir else ""


class ChatCADWorkbench:
    """CHATCAD Workbench — AI-powered CAD from natural language."""

    MenuText = "CHATCAD"
    ToolTip = "Generate CAD models from natural language using AI"
    Icon = _icon_path

    def Initialize(self):
        """Called when the workbench is first activated."""
        from chatcad_commands import ChatCADOpenPanel, ChatCADSettings

        FreeCADGui.addCommand("ChatCAD_OpenPanel", ChatCADOpenPanel())
        FreeCADGui.addCommand("ChatCAD_Settings", ChatCADSettings())

        self.appendToolbar("CHATCAD", ["ChatCAD_OpenPanel", "ChatCAD_Settings"])
        self.appendMenu("CHATCAD", ["ChatCAD_OpenPanel", "ChatCAD_Settings"])

    def Activated(self):
        """Called when switching to this workbench."""
        from chatcad_panel import show_panel
        show_panel()

    def Deactivated(self):
        """Called when leaving this workbench."""
        pass

    def GetClassName(self):
        return "Gui::PythonWorkbench"


FreeCADGui.addWorkbench(ChatCADWorkbench())
