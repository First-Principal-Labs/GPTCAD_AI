"""FreeCAD GUI initialization for CHATCAD addon."""

import os, sys
import FreeCADGui


# --- Resolve icon path inline (no helper functions) ---
# FreeCAD exec()s this file with separate globals/locals dicts. Functions
# defined here get __globals__ bound to the globals dict, but their names
# live in locals — so one function calling another fails. Inline code at
# the top level of exec() can access locals normally.
_icon = ""
try:
    _d = os.path.dirname(os.path.abspath(__file__))
    if os.path.isfile(os.path.join(_d, "chatcad_panel.py")):
        _icon = os.path.join(_d, "resources", "icons", "chatcad.svg")
except NameError:
    pass
if not _icon:
    for _p in sys.path:
        if os.path.isfile(os.path.join(_p, "chatcad_panel.py")):
            _icon = os.path.join(_p, "resources", "icons", "chatcad.svg")
            break


class ChatCADWorkbench:
    """CHATCAD Workbench — AI-powered CAD from natural language."""

    MenuText = "CHATCAD"
    ToolTip = "Generate CAD models from natural language using AI"
    Icon = ""

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


ChatCADWorkbench.Icon = _icon
FreeCADGui.addWorkbench(ChatCADWorkbench())
