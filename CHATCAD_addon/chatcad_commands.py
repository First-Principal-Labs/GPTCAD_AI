"""FreeCAD GUI commands for CHATCAD addon."""

import os
import sys

# Resolve addon directory (same logic as InitGui.py)
_addon_dir = os.path.dirname(os.path.abspath(__file__))
if not os.path.isfile(os.path.join(_addon_dir, "chatcad_panel.py")):
    _addon_dir = ""
    for p in sys.path:
        if os.path.isfile(os.path.join(p, "chatcad_panel.py")):
            _addon_dir = p
            break

_icon_path = os.path.join(_addon_dir, "resources", "icons", "chatcad.svg") if _addon_dir else ""


class ChatCADOpenPanel:
    """Command to open/toggle the CHATCAD prompt panel."""

    def GetResources(self):
        return {
            "Pixmap": _icon_path,
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
