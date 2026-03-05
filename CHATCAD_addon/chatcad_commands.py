"""FreeCAD GUI commands for CHATCAD addon."""

import os


class ChatCADOpenPanel:
    """Command to open/toggle the CHATCAD prompt panel."""

    def GetResources(self):
        return {
            "Pixmap": os.path.join(os.path.dirname(__file__), "resources", "icons", "chatcad.svg"),
            "MenuText": "Open CHATCAD Panel",
            "ToolTip": "Open the AI prompt panel to generate CAD models",
        }

    def Activated(self):
        from chatcad_panel import show_panel
        show_panel()

    def IsActive(self):
        return True


class ChatCADSettings:
    """Command to open CHATCAD settings dialog."""

    def GetResources(self):
        return {
            "MenuText": "CHATCAD Settings",
            "ToolTip": "Configure API endpoint, model, and API key",
        }

    def Activated(self):
        from chatcad_settings import show_settings
        show_settings()

    def IsActive(self):
        return True
