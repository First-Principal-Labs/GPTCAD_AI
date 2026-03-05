"""Settings dialog for CHATCAD addon."""

try:
    from PySide6 import QtWidgets, QtCore
except ImportError:
    from PySide2 import QtWidgets, QtCore

import FreeCADGui
import chatcad_config as cfg


class SettingsDialog(QtWidgets.QDialog):
    """Dialog to configure API endpoint, model, and API key."""

    def __init__(self, parent=None):
        super().__init__(parent or FreeCADGui.getMainWindow())
        self.setWindowTitle("CHATCAD Settings")
        self.setMinimumWidth(420)
        self.setWindowFlags(self.windowFlags() & ~QtCore.Qt.WindowContextHelpButtonHint)
        self._build_ui()
        self._load()

    def _build_ui(self):
        layout = QtWidgets.QVBoxLayout(self)
        layout.setSpacing(12)

        # Title
        title = QtWidgets.QLabel("CHATCAD Configuration")
        title.setStyleSheet("font-size: 14px; font-weight: bold; margin-bottom: 4px;")
        layout.addWidget(title)

        form = QtWidgets.QFormLayout()
        form.setSpacing(8)

        # Base URL
        self.base_url = QtWidgets.QLineEdit()
        self.base_url.setPlaceholderText("https://api.openai.com/v1")
        form.addRow("Base URL:", self.base_url)

        # Model
        self.model = QtWidgets.QLineEdit()
        self.model.setPlaceholderText("gpt-4")
        form.addRow("Model:", self.model)

        # API Key
        self.api_key = QtWidgets.QLineEdit()
        self.api_key.setEchoMode(QtWidgets.QLineEdit.Password)
        self.api_key.setPlaceholderText("sk-...")
        form.addRow("API Key:", self.api_key)

        # Temperature
        self.temperature = QtWidgets.QDoubleSpinBox()
        self.temperature.setRange(0.0, 2.0)
        self.temperature.setSingleStep(0.1)
        self.temperature.setDecimals(1)
        form.addRow("Temperature:", self.temperature)

        layout.addLayout(form)

        # Info label
        info = QtWidgets.QLabel(
            "Works with any OpenAI-compatible API (OpenAI, OpenRouter, local Ollama, etc.)"
        )
        info.setStyleSheet("color: gray; font-size: 11px;")
        info.setWordWrap(True)
        layout.addWidget(info)

        # Buttons
        buttons = QtWidgets.QDialogButtonBox(
            QtWidgets.QDialogButtonBox.Save | QtWidgets.QDialogButtonBox.Cancel
        )
        buttons.accepted.connect(self._save_and_close)
        buttons.rejected.connect(self.reject)
        layout.addWidget(buttons)

    def _load(self):
        self.base_url.setText(cfg.get_base_url())
        self.model.setText(cfg.get_model())
        self.api_key.setText(cfg.get_api_key())
        self.temperature.setValue(cfg.get_temperature())

    def _save_and_close(self):
        cfg.set_base_url(self.base_url.text().strip())
        cfg.set_model(self.model.text().strip())
        cfg.set_api_key(self.api_key.text().strip())
        cfg.set_temperature(self.temperature.value())
        self.accept()


def show_settings():
    dlg = SettingsDialog()
    dlg.exec_()
