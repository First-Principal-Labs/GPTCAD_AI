# GPTCAD - AI-Powered CAD Platform

## Vision

GPTCAD is a professional-grade, browser-based CAD application that lets users generate and iterate on 3D models through natural language prompts. FreeCAD runs entirely on the backend — the user never sees or interacts with FreeCAD directly. The frontend delivers a premium, dark-themed CAD experience rivaling commercial tools.

---

## Architecture Overview

```
+------------------+         +-------------------+         +------------------+
|    Frontend      |  REST/  |    Backend         |  CLI    |    FreeCAD       |
|  (React + Three) | <-----> |  (FastAPI/Python)  | <-----> |  (headless)      |
|    Port: 5175    |  WS     |    Port: 8080      |         |  freecadcmd      |
+------------------+         +-------------------+         +------------------+
                                      |
                                      | OpenAI-compatible API
                                      v
                              +------------------+
                              |   LLM Gateway    |
                              | 34.100.238.183   |
                              | azure-gpt-5.2    |
                              +------------------+
```

### Execution Parameters (from `.env`)

| Parameter | Value | Purpose |
|---|---|---|
| `FREECAD_CMD` | `/Applications/FreeCAD.app/Contents/Resources/bin/freecadcmd` | Headless FreeCAD binary |
| `BACKEND_HOST` | `0.0.0.0` | Backend bind address |
| `BACKEND_PORT` | `8080` | Backend API port |
| `STORAGE_DIR` | `./storage` | Project/model file storage |
| `CORS_ORIGINS` | `http://localhost:3005,http://localhost:5175` | Allowed frontend origins |
| `OPENAI_BASE_URL` | `http://34.100.238.183:4000/` | LLM API endpoint |
| `OPENAI_API_KEY` | `sk-teamvizuara1234` | LLM API key |
| `OPENAI_MODEL` | `azure-gpt-5.2` | Model for code generation |

---

## Project Structure

```
GPTCAD_AI/
├── .env
├── PLAN.md
├── backend/
│   ├── main.py                  # FastAPI app entry point
│   ├── requirements.txt
│   ├── config.py                # Loads .env, app settings
│   ├── routers/
│   │   ├── generate.py          # POST /generate — prompt-to-CAD
│   │   ├── iterate.py           # POST /iterate — refine existing model
│   │   ├── export.py            # GET  /export/{id} — STEP/STL/OBJ download
│   │   ├── projects.py          # CRUD for saved projects
│   │   └── manual.py            # POST /manual — manual modeling operations
│   ├── services/
│   │   ├── llm.py               # OpenAI-compatible client (prompt → FreeCAD Python code)
│   │   ├── freecad_runner.py    # Executes FreeCAD scripts via freecadcmd subprocess
│   │   ├── mesh_converter.py    # Converts FreeCAD output → glTF/GLB for frontend
│   │   └── project_manager.py   # Manages storage directory, versioning
│   ├── prompts/
│   │   ├── system_prompt.txt    # System prompt for FreeCAD code generation
│   │   └── iterate_prompt.txt   # System prompt for iterative refinement
│   ├── scripts/
│   │   └── freecad_exec.py      # Template script executed inside FreeCAD
│   └── storage/                 # Runtime: saved projects, meshes, exports
│       └── .gitkeep
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   ├── index.html
│   ├── public/
│   │   └── favicon.svg
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── styles/
│   │   │   └── globals.css       # Dark theme, premium styling
│   │   ├── components/
│   │   │   ├── Layout.tsx        # Three-panel layout shell
│   │   │   ├── Viewport/
│   │   │   │   ├── Viewport.tsx          # Three.js canvas + controls
│   │   │   │   ├── SceneSetup.tsx        # Lights, environment, grid
│   │   │   │   ├── ModelRenderer.tsx     # Loads & displays glTF model
│   │   │   │   ├── ViewCube.tsx          # Orientation cube (top-right)
│   │   │   │   ├── MeasureTool.tsx       # Click-to-measure overlay
│   │   │   │   └── ManualTools.tsx       # Toolbar for manual 3D ops
│   │   │   ├── CodePanel/
│   │   │   │   ├── CodePanel.tsx         # Left panel: generated code
│   │   │   │   ├── CodeEditor.tsx        # Monaco editor (read + edit)
│   │   │   │   └── CodeActions.tsx       # Run / Copy / Reset buttons
│   │   │   ├── PromptPanel/
│   │   │   │   ├── PromptPanel.tsx       # Right panel: chat + prompt
│   │   │   │   ├── PromptInput.tsx       # Text input + send button
│   │   │   │   ├── ChatHistory.tsx       # Scrollable iteration history
│   │   │   │   └── SuggestionChips.tsx   # Quick-action suggestions
│   │   │   ├── Toolbar/
│   │   │   │   ├── TopBar.tsx            # Logo, project name, export, settings
│   │   │   │   └── StatusBar.tsx         # Bottom: generation status, model info
│   │   │   └── Shared/
│   │   │       ├── Button.tsx
│   │   │       ├── Panel.tsx
│   │   │       └── Spinner.tsx
│   │   ├── hooks/
│   │   │   ├── useGenerate.ts    # API call: prompt → model
│   │   │   ├── useIterate.ts     # API call: refine model
│   │   │   ├── useModel.ts       # Three.js model loader
│   │   │   └── useProject.ts     # Project save/load
│   │   ├── stores/
│   │   │   └── appStore.ts       # Zustand: global app state
│   │   ├── api/
│   │   │   └── client.ts         # Axios/fetch wrapper for backend
│   │   └── types/
│   │       └── index.ts          # TypeScript types
│   └── tsconfig.json
└── docker-compose.yml            # Optional: containerized setup
```

---

## Tech Stack

### Backend
| Component | Technology | Reason |
|---|---|---|
| Web framework | **FastAPI** (Python) | Async, fast, native Python (matches FreeCAD scripting) |
| FreeCAD execution | **subprocess** → `freecadcmd` | Headless execution of generated Python scripts |
| LLM client | **openai** Python SDK | Compatible with the OpenAI-format endpoint in `.env` |
| Mesh conversion | **FreeCAD → glTF/GLB** | Via FreeCAD's mesh export + trimesh/pygltflib |
| File storage | **Local filesystem** (`./storage`) | Per `.env` STORAGE_DIR |
| WebSocket | **FastAPI WebSocket** | Real-time generation status streaming |

### Frontend
| Component | Technology | Reason |
|---|---|---|
| Framework | **React 18 + TypeScript** | Industry standard, component-based |
| Build tool | **Vite** | Fast dev server on port 5175 |
| 3D rendering | **Three.js + @react-three/fiber + @react-three/drei** | Premium WebGL rendering with React bindings |
| Code editor | **Monaco Editor** (@monaco-editor/react) | VS Code-quality code display |
| State management | **Zustand** | Lightweight, minimal boilerplate |
| Styling | **Tailwind CSS** | Rapid, consistent dark-theme styling |
| HTTP client | **Axios** | Clean API calls |
| Icons | **Lucide React** | Clean, professional icon set |

---

## Feature Specification

### F1: AI Prompt-to-CAD Generation (Core)

**Flow:**
1. User types a natural language prompt (e.g., "Create a flanged bearing housing with 4 bolt holes, 50mm bore diameter")
2. Frontend sends prompt to `POST /api/generate`
3. Backend constructs a system prompt + user prompt and calls the LLM (`azure-gpt-5.2` via gateway)
4. LLM returns FreeCAD Python code (Part/PartDesign workbench)
5. Backend writes the script to a temp file and executes it via `freecadcmd`
6. FreeCAD produces a `.FCStd` file + exports `.glb` mesh
7. Backend returns the `.glb` URL + the generated Python code to frontend
8. Frontend renders the model in the 3D viewport, shows code in the left panel

**API:**
```
POST /api/generate
Body: { "prompt": string, "project_id"?: string }
Response: {
  "project_id": string,
  "model_url": "/storage/{id}/model.glb",
  "code": string,
  "metadata": { "faces": int, "vertices": int, "bounding_box": [x,y,z] }
}
```

### F2: Iterative Refinement

**Flow:**
1. User views the generated model and types a follow-up (e.g., "Make it 20mm taller and add fillets on all edges")
2. Frontend sends to `POST /api/iterate` with the existing code + new instruction
3. LLM receives the current code + modification request and returns updated code
4. Backend re-executes via FreeCAD, returns updated model
5. Frontend updates the viewport + code panel, appends to chat history

**API:**
```
POST /api/iterate
Body: {
  "project_id": string,
  "instruction": string,
  "current_code": string,
  "history": [{ "role": string, "content": string }]
}
Response: { same as /generate }
```

**Version History:**
- Each iteration is stored as a version in the project directory
- User can click any past version in the chat history to view/restore it

### F3: Premium 3D Viewport (Center Panel)

**Rendering features:**
- **PBR materials** — metallic/roughness shading for realistic CAD look
- **Environment map** — subtle HDR environment for reflections (studio lighting)
- **Ambient occlusion** — SSAO post-processing for depth
- **Edge rendering** — optional wireframe/edge overlay for engineering look
- **Anti-aliasing** — MSAA or FXAA for crisp edges
- **Soft shadows** — from directional + ambient lights
- **Ground plane** — infinite grid with fade, subtle shadow catcher

**Navigation:**
- Orbit (left-click drag)
- Pan (middle-click drag or Shift + left-click)
- Zoom (scroll wheel)
- Fit-to-view (double-click or `F` key)
- View presets: Front / Back / Left / Right / Top / Bottom / Isometric

**Viewport UI overlays:**
- **View Cube** (top-right corner) — clickable orientation indicator
- **Axis indicator** (bottom-left) — RGB XYZ arrows
- **Model info** (bottom bar) — face/vertex count, bounding box dimensions
- **Render mode toggle** — Shaded / Wireframe / Shaded+Wireframe / X-Ray

### F4: Code Panel (Left Panel)

- **Monaco Editor** with Python syntax highlighting
- **Read-only by default** — shows the AI-generated FreeCAD code
- **Editable mode** — toggle to manually edit the code
- **Run button** — sends edited code to backend for execution (without LLM)
- **Diff view** — on iteration, highlights what changed from previous version
- **Copy to clipboard** button
- **Line numbers, minimap, bracket matching** — full IDE feel
- **Collapsible** — can hide/minimize the panel for more viewport space

### F5: Prompt / Chat Panel (Right Panel)

- **Chat-style interface** — shows full conversation history with the AI
- **User messages** as prompt bubbles
- **AI responses** as assistant bubbles (with "View Code" link)
- **Model thumbnails** — small 3D preview or screenshot next to each iteration
- **Prompt input** at the bottom with:
  - Multi-line text area (Shift+Enter for newline, Enter to send)
  - Send button
  - "Generating..." spinner during processing
- **Suggestion chips** — context-aware quick actions:
  - "Add fillets", "Make it hollow", "Add mounting holes", "Scale up 2x"
- **Version restore** — click any past message to restore that version's model + code

### F6: Manual 3D Modeling Tools

A floating toolbar over the viewport for basic parametric operations without AI:

| Tool | Description |
|---|---|
| **Box** | Create a box with editable dimensions (X, Y, Z inputs) |
| **Cylinder** | Create a cylinder (radius, height) |
| **Sphere** | Create a sphere (radius) |
| **Cone** | Create a cone (top radius, bottom radius, height) |
| **Torus** | Create a torus (major radius, minor radius) |
| **Extrude** | Select a face → extrude by distance |
| **Fillet** | Select edges → apply fillet radius |
| **Chamfer** | Select edges → apply chamfer distance |
| **Boolean Union** | Combine two bodies |
| **Boolean Cut** | Subtract one body from another |
| **Boolean Intersect** | Keep intersection of two bodies |
| **Move** | Translate selected body (X, Y, Z) |
| **Rotate** | Rotate selected body (axis + angle) |
| **Mirror** | Mirror across a plane |
| **Pattern** | Linear or circular pattern of a feature |

**How it works:**
- User picks a tool and fills in parameters via a popover form
- Frontend sends a structured operation to `POST /api/manual`
- Backend generates FreeCAD code for that operation, executes it, returns updated model
- The generated code is appended to the code panel

### F7: Project Management

- **New Project** — fresh canvas
- **Save Project** — persists to `STORAGE_DIR` with all versions
- **Open Project** — load from saved projects list
- **Project list** — sidebar or modal showing all saved projects with thumbnails
- **Auto-save** — after every successful generation/iteration

### F8: Export

| Format | Method |
|---|---|
| **STEP (.step)** | Native FreeCAD export — industry standard for CAD interchange |
| **STL (.stl)** | Mesh export for 3D printing |
| **OBJ (.obj)** | Mesh export with materials |
| **glTF (.glb)** | Web-optimized 3D format |
| **FreeCAD (.FCStd)** | Native FreeCAD file for further editing |
| **Python script (.py)** | The generated FreeCAD Python code |
| **PNG screenshot** | Viewport screenshot at current view angle |

**API:**
```
GET /api/export/{project_id}?format=step
Response: file download
```

### F9: Real-Time Status & Streaming

- WebSocket connection for live status updates during generation:
  - "Sending prompt to AI..."
  - "Generating FreeCAD code..."
  - "Executing in FreeCAD..."
  - "Converting mesh..."
  - "Done!"
- Streamed LLM output shown in real-time in the prompt panel (token by token)
- Progress bar in the status bar

### F10: Error Handling & Recovery

- If FreeCAD execution fails:
  - Show the error in the code panel (highlighted)
  - Automatically send the error back to the LLM for a fix attempt (up to 2 retries)
  - User can also manually fix the code and re-run
- If LLM returns invalid code:
  - Syntax check before execution
  - Clear error message with suggestion to rephrase

---

## UI Design Specification

### Layout

```
+-----------------------------------------------------------------------+
|  [GPTCAD Logo]   Project: Untitled    [Save] [Export v] [Settings]    |  <- TopBar (48px)
+------------------+-------------------------------+--------------------+
|                  |                               |                    |
|   CODE PANEL     |        3D VIEWPORT            |   PROMPT PANEL     |
|   (Monaco)       |                               |   (Chat + Input)   |
|                  |     [View Cube]               |                    |
|   ~300px wide    |                               |   ~350px wide      |
|   Resizable      |   [Manual Tools Toolbar]      |   Resizable        |
|                  |                               |                    |
|                  |   [Axis]                      |   [Suggestions]    |
|                  |                               |   [Input Box]      |
+------------------+-------------------------------+--------------------+
|  Status: Ready   |  Faces: 1,204  Verts: 602    |  v3 of 3           |  <- StatusBar (28px)
+-----------------------------------------------------------------------+
```

### Theme

- **Background:** `#0a0a0f` (near-black with blue tint)
- **Panel backgrounds:** `#12121a` with subtle `1px` border `#1e1e2e`
- **Accent color:** `#6366f1` (indigo-500) for buttons, highlights, active states
- **Text primary:** `#e2e8f0` (slate-200)
- **Text secondary:** `#94a3b8` (slate-400)
- **Success:** `#22c55e`
- **Error:** `#ef4444`
- **Font:** `Inter` for UI, `JetBrains Mono` for code
- **Border radius:** `8px` for cards, `6px` for buttons
- **Shadows:** subtle `box-shadow` with blue-tinted glow on focused elements

### Viewport Rendering Style

- Default material: **light steel gray** (`#b0bec5`) with metallic=0.6, roughness=0.35
- Environment: **Studio HDRI** — soft, even lighting with gentle reflections
- Background: **gradient** from `#1a1a2e` to `#0a0a14`
- Grid: **infinite ground grid** with `#1e1e2e` lines, fading with distance
- Edges: optional **black edge lines** for engineering drawing feel

---

## Backend Pipeline Detail

### LLM System Prompt Strategy

The system prompt instructs the LLM to:
1. Write FreeCAD Python code using `Part` and `PartDesign` workbenches
2. Always create a `FreeCAD.newDocument("GPTCAD")`
3. Always export the result as:
   - `.FCStd` (native)
   - `.brep` (for mesh conversion)
4. Use parametric features (Sketch → Pad → Fillet, etc.) over raw shapes when possible
5. Include comments in the code
6. Use variables for dimensions (easy to modify)
7. Never use GUI commands (since FreeCAD runs headless)

### FreeCAD Execution Pipeline

```
1. Write generated Python code to: storage/{project_id}/v{n}/script.py
2. Append export commands to script (save .FCStd + .brep)
3. Execute: subprocess.run([FREECAD_CMD, script.py], timeout=30)
4. Convert .brep → .glb using trimesh or FreeCAD mesh export
5. Return .glb URL to frontend
```

### Mesh Conversion for Frontend

FreeCAD `.brep` → tessellate to mesh → export as `.glb` (binary glTF):
- Use FreeCAD's built-in `Mesh.export()` or `trimesh` library
- Target: < 1MB for typical parts, LOD for complex assemblies
- Include vertex normals for smooth shading

---

## API Endpoints Summary

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/generate` | Generate CAD from prompt |
| `POST` | `/api/iterate` | Refine existing model with instruction |
| `POST` | `/api/manual` | Execute a manual modeling operation |
| `POST` | `/api/code/run` | Run user-edited code directly |
| `GET` | `/api/export/{id}` | Export in specified format |
| `GET` | `/api/projects` | List all projects |
| `POST` | `/api/projects` | Create new project |
| `GET` | `/api/projects/{id}` | Get project details + versions |
| `DELETE` | `/api/projects/{id}` | Delete project |
| `GET` | `/api/projects/{id}/versions` | List all versions |
| `GET` | `/api/projects/{id}/versions/{v}` | Get specific version |
| `WS` | `/ws/status/{id}` | Real-time generation status |

---

## Implementation Phases

### Phase 1: Foundation (MVP)
- [ ] Backend: FastAPI app, config loader, health endpoint
- [ ] Backend: LLM service (prompt → FreeCAD code)
- [ ] Backend: FreeCAD runner (execute script, get output)
- [ ] Backend: Mesh converter (FreeCAD output → glTF)
- [ ] Backend: `/api/generate` endpoint
- [ ] Frontend: Vite + React + Tailwind scaffold
- [ ] Frontend: Three-panel layout with resizable panels
- [ ] Frontend: 3D Viewport with glTF loader, orbit controls, grid, lights
- [ ] Frontend: Prompt panel with input and send
- [ ] Frontend: Code panel with Monaco (read-only)
- [ ] End-to-end: prompt → model displayed in browser

### Phase 2: Iteration & Polish
- [ ] Backend: `/api/iterate` endpoint with conversation history
- [ ] Backend: Version storage per project
- [ ] Frontend: Chat history in prompt panel
- [ ] Frontend: Version navigation (click to restore)
- [ ] Frontend: View Cube + axis indicator
- [ ] Frontend: Render mode toggle (shaded/wireframe/x-ray)
- [ ] Frontend: Premium rendering (SSAO, environment map, edge lines)
- [ ] Frontend: Status bar with model info

### Phase 3: Manual Tools & Code Editing
- [ ] Backend: `/api/manual` endpoint for parametric operations
- [ ] Backend: `/api/code/run` for user-edited code execution
- [ ] Frontend: Manual tools toolbar (primitives, booleans, transforms)
- [ ] Frontend: Editable code panel with Run button
- [ ] Frontend: Diff view on iteration

### Phase 4: Project Management & Export
- [ ] Backend: Project CRUD endpoints
- [ ] Backend: Export in all formats (STEP, STL, OBJ, glTF, FCStd, PNG)
- [ ] Frontend: Project save/load/list UI
- [ ] Frontend: Export dropdown with format selection
- [ ] Frontend: Auto-save

### Phase 5: Real-Time & UX Refinements
- [ ] Backend: WebSocket for live generation status
- [ ] Backend: LLM streaming support
- [ ] Frontend: Token-by-token streaming in prompt panel
- [ ] Frontend: Progress indicators
- [ ] Backend: Auto-retry on FreeCAD execution failure (send error to LLM)
- [ ] Frontend: Suggestion chips
- [ ] Frontend: Keyboard shortcuts (F = fit view, Ctrl+Enter = send prompt)
- [ ] Frontend: Responsive panel resizing with collapse

---

## Key Design Decisions

1. **FreeCAD is invisible** — Users never see FreeCAD UI, error messages reference "the engine" not "FreeCAD"
2. **Code is a first-class citizen** — Always visible, always editable, bridges AI and manual workflows
3. **Iteration is conversational** — Chat-style UX with full history, not a single prompt box
4. **Premium feel** — Dark theme, smooth animations, studio-quality 3D rendering
5. **Parametric by default** — LLM is instructed to generate parametric (feature-based) code, not raw mesh operations
6. **Offline-capable LLM** — The OpenAI-compatible endpoint means any LLM backend works (Ollama, LM Studio, etc.)

---

## Dependencies

### Backend (`requirements.txt`)
```
fastapi>=0.115.0
uvicorn>=0.34.0
python-dotenv>=1.0.0
openai>=1.60.0
trimesh>=4.5.0
numpy>=2.0.0
pygltflib>=1.16.0
websockets>=14.0
python-multipart>=0.0.18
```

### Frontend (`package.json` key deps)
```
react, react-dom (^18)
@react-three/fiber (^8)
@react-three/drei (^9)
@react-three/postprocessing (^2)
three (^0.170)
@monaco-editor/react (^4)
zustand (^5)
tailwindcss (^4)
axios (^1)
lucide-react (^0.460)
```
