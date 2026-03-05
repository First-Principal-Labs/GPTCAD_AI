"""FreeCAD GUI initialization for CHATCAD addon."""

import os


class ChatCADWorkbench:
    """CHATCAD Workbench — AI-powered CAD from natural language."""

    MenuText = "CHATCAD"
    ToolTip = "Generate CAD models from natural language using AI"
    Icon = os.path.join(os.path.dirname(__file__), "resources", "icons", "chatcad.svg")

    def Initialize(self):
        """Called when the workbench is first activated."""
        import FreeCADGui
        from chatcad_commands import ChatCADOpenPanel, ChatCADSettings

        self.appendToolbar("CHATCAD", ["ChatCAD_OpenPanel", "ChatCAD_Settings"])
        self.appendMenu("CHATCAD", ["ChatCAD_OpenPanel", "ChatCAD_Settings"])

        FreeCADGui.addCommand("ChatCAD_OpenPanel", ChatCADOpenPanel())
        FreeCADGui.addCommand("ChatCAD_Settings", ChatCADSettings())

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
