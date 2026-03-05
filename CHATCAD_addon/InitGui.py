"""FreeCAD GUI initialization for CHATCAD addon."""

import os, sys
import FreeCADGui


def _find_addon_dir():
    """Find the CHATCAD addon directory reliably."""
    try:
        d = os.path.dirname(os.path.abspath(__file__))
        if os.path.isfile(os.path.join(d, "chatcad_panel.py")):
            return d
    except NameError:
        pass
    for p in sys.path:
        if os.path.isfile(os.path.join(p, "chatcad_panel.py")):
            return p
    return ""


def _find_icon():
    d = _find_addon_dir()
    if d:
        return os.path.join(d, "resources", "icons", "chatcad.svg")
    return ""


class ChatCADWorkbench:
    """CHATCAD Workbench — AI-powered CAD from natural language."""

    MenuText = "CHATCAD"
    ToolTip = "Generate CAD models from natural language using AI"
    Icon = _find_icon()

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
