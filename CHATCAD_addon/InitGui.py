"""FreeCAD GUI initialization for CHATCAD addon."""

import os
import FreeCADGui

import sys

# __file__ is not defined when FreeCAD exec()s this script.
# Derive the addon path from sys.path as a reliable fallback.
try:
    _addon_dir = os.path.dirname(os.path.abspath(__file__))
except NameError:
    _addon_dir = ""

if not _addon_dir or not os.path.isfile(os.path.join(_addon_dir, "chatcad_panel.py")):
    _addon_dir = ""
    for _p in sys.path:
        if os.path.isfile(os.path.join(_p, "chatcad_panel.py")):
            _addon_dir = _p
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
