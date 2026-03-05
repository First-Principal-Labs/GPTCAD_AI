"""CHATCAD prompt panel — dockable right-side panel with chat interface."""

try:
    from PySide6 import QtWidgets, QtCore, QtGui
except ImportError:
    from PySide2 import QtWidgets, QtCore, QtGui

import FreeCADGui

from chatcad_engine import call_llm, execute_code

# Keep a single global reference so the panel isn't garbage-collected
_panel_instance = None


class ChatMessage(QtWidgets.QFrame):
    """Single chat bubble for user or assistant message."""

    def __init__(self, text: str, role: str = "user", parent=None):
        super().__init__(parent)
        self.setFrameShape(QtWidgets.QFrame.StyledPanel)

        if role == "user":
            bg = "#2d3748"
            fg = "#e2e8f0"
            label_text = "You"
            label_color = "#a0aec0"
        elif role == "error":
            bg = "#4a1c1c"
            fg = "#feb2b2"
            label_text = "Error"
            label_color = "#fc8181"
        else:
            bg = "#1a365d"
            fg = "#bee3f8"
            label_text = "CHATCAD"
            label_color = "#63b3ed"

        self.setStyleSheet(
            f"QFrame {{ background: {bg}; border: 1px solid #4a5568; "
            f"border-radius: 8px; padding: 8px; }}"
        )

        layout = QtWidgets.QVBoxLayout(self)
        layout.setContentsMargins(8, 6, 8, 6)
        layout.setSpacing(4)

        header = QtWidgets.QLabel(label_text)
        header.setStyleSheet(
            f"color: {label_color}; font-size: 10px; font-weight: bold; "
            f"border: none; padding: 0px;"
        )
        layout.addWidget(header)

        body = QtWidgets.QLabel(text)
        body.setWordWrap(True)
        body.setTextInteractionFlags(QtCore.Qt.TextSelectableByMouse)
        body.setStyleSheet(
            f"color: {fg}; font-size: 12px; border: none; padding: 0px;"
        )
        layout.addWidget(body)


class CodeViewer(QtWidgets.QPlainTextEdit):
    """Read-only code viewer with monospace font."""

    def __init__(self, parent=None):
        super().__init__(parent)
        self.setReadOnly(True)
        font = QtGui.QFont("Consolas, Monaco, Courier New", 10)
        font.setStyleHint(QtGui.QFont.Monospace)
        self.setFont(font)
        self.setStyleSheet(
            "QPlainTextEdit { background: #1a1a2e; color: #a5b4fc; "
            "border: 1px solid #4a5568; border-radius: 4px; padding: 8px; }"
        )
        self.setMaximumHeight(200)
        self.hide()


class ChatCADPanel(QtWidgets.QDockWidget):
    """Main CHATCAD dock panel with chat + prompt interface."""

    def __init__(self, parent=None):
        super().__init__("CHATCAD", parent or FreeCADGui.getMainWindow())
        self.setAllowedAreas(
            QtCore.Qt.RightDockWidgetArea | QtCore.Qt.LeftDockWidgetArea
        )
        self.setMinimumWidth(320)

        self._current_code = ""
        self._history = []

        self._build_ui()

    def _build_ui(self):
        container = QtWidgets.QWidget()
        main_layout = QtWidgets.QVBoxLayout(container)
        main_layout.setContentsMargins(8, 8, 8, 8)
        main_layout.setSpacing(8)

        # Header
        header_layout = QtWidgets.QHBoxLayout()
        title = QtWidgets.QLabel("CHATCAD")
        title.setStyleSheet(
            "font-size: 14px; font-weight: bold; color: #a5b4fc;"
        )
        header_layout.addWidget(title)
        header_layout.addStretch()

        settings_btn = QtWidgets.QPushButton("Settings")
        settings_btn.setFixedWidth(70)
        settings_btn.setStyleSheet(
            "QPushButton { background: #4a5568; color: #e2e8f0; border: none; "
            "border-radius: 4px; padding: 4px 8px; font-size: 11px; } "
            "QPushButton:hover { background: #6366f1; }"
        )
        settings_btn.clicked.connect(self._open_settings)
        header_layout.addWidget(settings_btn)

        clear_btn = QtWidgets.QPushButton("Clear")
        clear_btn.setFixedWidth(50)
        clear_btn.setStyleSheet(
            "QPushButton { background: #4a5568; color: #e2e8f0; border: none; "
            "border-radius: 4px; padding: 4px 8px; font-size: 11px; } "
            "QPushButton:hover { background: #ef4444; }"
        )
        clear_btn.clicked.connect(self._clear_chat)
        header_layout.addWidget(clear_btn)

        main_layout.addLayout(header_layout)

        # Chat scroll area
        self._chat_scroll = QtWidgets.QScrollArea()
        self._chat_scroll.setWidgetResizable(True)
        self._chat_scroll.setHorizontalScrollBarPolicy(QtCore.Qt.ScrollBarAlwaysOff)
        self._chat_scroll.setStyleSheet(
            "QScrollArea { border: none; background: transparent; }"
        )

        self._chat_widget = QtWidgets.QWidget()
        self._chat_layout = QtWidgets.QVBoxLayout(self._chat_widget)
        self._chat_layout.setAlignment(QtCore.Qt.AlignTop)
        self._chat_layout.setSpacing(8)
        self._chat_layout.setContentsMargins(0, 0, 0, 0)

        self._chat_scroll.setWidget(self._chat_widget)
        main_layout.addWidget(self._chat_scroll, 1)

        # Code viewer (collapsible)
        self._code_toggle = QtWidgets.QPushButton("Show Code")
        self._code_toggle.setCheckable(True)
        self._code_toggle.setStyleSheet(
            "QPushButton { background: #2d3748; color: #a0aec0; border: 1px solid #4a5568; "
            "border-radius: 4px; padding: 4px; font-size: 11px; } "
            "QPushButton:checked { background: #4a5568; color: #e2e8f0; }"
        )
        self._code_toggle.toggled.connect(self._toggle_code)
        main_layout.addWidget(self._code_toggle)

        self._code_viewer = CodeViewer()
        main_layout.addWidget(self._code_viewer)

        # Prompt input area
        input_layout = QtWidgets.QHBoxLayout()
        input_layout.setSpacing(6)

        self._prompt_input = QtWidgets.QLineEdit()
        self._prompt_input.setPlaceholderText("Describe the CAD model you want...")
        self._prompt_input.setStyleSheet(
            "QLineEdit { background: #2d3748; color: #e2e8f0; border: 1px solid #4a5568; "
            "border-radius: 6px; padding: 8px 12px; font-size: 12px; } "
            "QLineEdit:focus { border-color: #6366f1; }"
        )
        self._prompt_input.returnPressed.connect(self._on_send)
        input_layout.addWidget(self._prompt_input)

        self._send_btn = QtWidgets.QPushButton("Send")
        self._send_btn.setFixedWidth(60)
        self._send_btn.setStyleSheet(
            "QPushButton { background: #6366f1; color: white; border: none; "
            "border-radius: 6px; padding: 8px; font-size: 12px; font-weight: bold; } "
            "QPushButton:hover { background: #4f46e5; } "
            "QPushButton:disabled { background: #4a5568; }"
        )
        self._send_btn.clicked.connect(self._on_send)
        input_layout.addWidget(self._send_btn)

        main_layout.addLayout(input_layout)

        # Status label
        self._status = QtWidgets.QLabel("")
        self._status.setStyleSheet("color: #a0aec0; font-size: 10px;")
        main_layout.addWidget(self._status)

        self.setWidget(container)

        # Global stylesheet for the dock widget
        container.setStyleSheet(
            "QWidget { background: #1a202c; }"
        )

    def _add_message(self, text: str, role: str = "user"):
        msg = ChatMessage(text, role)
        self._chat_layout.addWidget(msg)
        # Scroll to bottom
        QtCore.QTimer.singleShot(50, lambda: self._chat_scroll.verticalScrollBar().setValue(
            self._chat_scroll.verticalScrollBar().maximum()
        ))

    def _on_send(self):
        prompt = self._prompt_input.text().strip()
        if not prompt:
            return

        self._prompt_input.clear()
        self._add_message(prompt, "user")
        self._set_busy(True)
        self._status.setText("Generating code...")

        # Run LLM call in a thread to keep UI responsive
        self._worker = LLMWorker(prompt, self._current_code)
        self._worker.finished.connect(self._on_llm_result)
        self._worker.error.connect(self._on_llm_error)
        self._worker.start()

    def _on_llm_result(self, code: str):
        self._status.setText("Executing code...")
        self._current_code = code
        self._code_viewer.setPlainText(code)

        # Execute in FreeCAD
        result = execute_code(code)

        if result.startswith("Success"):
            self._add_message(result, "assistant")
            self._status.setText("Ready")
        else:
            self._add_message(result, "error")
            self._status.setText("Execution failed — try again or modify prompt")

        self._set_busy(False)

    def _on_llm_error(self, error_msg: str):
        self._add_message(error_msg, "error")
        self._status.setText("Error — check settings")
        self._set_busy(False)

    def _set_busy(self, busy: bool):
        self._send_btn.setEnabled(not busy)
        self._prompt_input.setEnabled(not busy)
        if busy:
            self._send_btn.setText("...")
        else:
            self._send_btn.setText("Send")

    def _toggle_code(self, checked: bool):
        self._code_viewer.setVisible(checked)
        self._code_toggle.setText("Hide Code" if checked else "Show Code")

    def _clear_chat(self):
        while self._chat_layout.count():
            item = self._chat_layout.takeAt(0)
            if item.widget():
                item.widget().deleteLater()
        self._current_code = ""
        self._code_viewer.clear()
        self._status.setText("Chat cleared")

    def _open_settings(self):
        from chatcad_settings import show_settings
        show_settings()


class LLMWorker(QtCore.QThread):
    """Background thread for LLM API calls."""

    finished = QtCore.Signal(str)
    error = QtCore.Signal(str)

    def __init__(self, prompt: str, existing_code: str = ""):
        super().__init__()
        self.prompt = prompt
        self.existing_code = existing_code

    def run(self):
        try:
            code = call_llm(self.prompt, self.existing_code)
            self.finished.emit(code)
        except Exception as e:
            self.error.emit(str(e))


def show_panel():
    """Show or raise the CHATCAD panel as a right dock widget."""
    global _panel_instance

    main_window = FreeCADGui.getMainWindow()

    if _panel_instance is not None:
        # If it still exists, just show/raise it
        if _panel_instance.isVisible():
            _panel_instance.raise_()
        else:
            _panel_instance.show()
        return

    _panel_instance = ChatCADPanel(main_window)
    main_window.addDockWidget(QtCore.Qt.RightDockWidgetArea, _panel_instance)
    _panel_instance.show()
