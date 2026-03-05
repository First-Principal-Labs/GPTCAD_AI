# GPTCAD

AI-powered CAD platform that generates 3D models from natural language prompts. FreeCAD runs entirely on the backend — the frontend delivers a premium, dark-themed CAD experience with a Three.js viewport, Monaco code editor, and conversational prompt interface.

## Architecture

```
Frontend (React + Three.js)       Backend (FastAPI)            FreeCAD (headless)
     Port 5175                        Port 8080
 +-----------------+            +------------------+         +----------------+
 | 3D Viewport     |   /api     | LLM Service      |  CLI    | freecadcmd     |
 | Code Panel      | --------> | FreeCAD Runner   | ------> | Python script  |
 | Prompt Chat     |   /storage | Mesh Converter   |         | .brep export   |
 +-----------------+            +------------------+         +----------------+
                                        |
                                        | OpenAI-compatible API
                                        v
                                 +-------------+
                                 | LLM Gateway |
                                 +-------------+
```

**Pipeline:** Prompt --> LLM generates FreeCAD Python code --> FreeCAD executes headlessly --> .brep --> .stl --> .glb --> Three.js viewport

## Prerequisites

- **Python 3.11+**
- **Node.js 18+**
- **FreeCAD** (installed with command-line access to `freecadcmd`)
  - macOS: Install from [freecad.org](https://www.freecad.org/downloads.php)
  - Linux: `sudo apt install freecad`
- **An OpenAI-compatible LLM endpoint** (OpenAI, Azure OpenAI, Ollama, LM Studio, Groq, etc.)

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/First-Principal-Labs/GPTCAD_AI.git
cd GPTCAD_AI
```

### 2. Configure environment

Create a `.env` file in the project root:

```env
# FreeCAD
FREECAD_CMD=/Applications/FreeCAD.app/Contents/Resources/bin/freecadcmd

# Backend
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8080
STORAGE_DIR=./storage

# CORS
CORS_ORIGINS=http://localhost:3005,http://localhost:5175

# OpenAI-compatible API settings
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_API_KEY=your-api-key-here
OPENAI_MODEL=gpt-4
```

**FreeCAD paths by platform:**

| Platform | Typical `FREECAD_CMD` path |
|---|---|
| macOS | `/Applications/FreeCAD.app/Contents/Resources/bin/freecadcmd` |
| Linux | `/usr/bin/freecadcmd` |
| Windows | `C:\Program Files\FreeCAD\bin\freecadcmd.exe` |

### 3. Install backend dependencies

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
```

### 4. Install frontend dependencies

```bash
cd frontend
npm install
cd ..
```

## Running

### Quick start (both servers)

```bash
./dev.sh
```

This starts both the backend and frontend concurrently. Open **http://localhost:5175** in your browser.

### Run servers individually

**Backend:**

```bash
source .venv/bin/activate
uvicorn backend.main:app --host 0.0.0.0 --port 8080 --reload
```

**Frontend:**

```bash
cd frontend
npm run dev
```

### Production build

```bash
cd frontend
npm run build
```

The built files will be in `frontend/dist/`.

## Usage

1. Open **http://localhost:5175**
2. Type a prompt in the right panel, e.g. *"Create a flanged bearing housing with 4 bolt holes and 50mm bore diameter"*
3. Press Enter or click Send
4. The AI generates FreeCAD Python code, executes it, and renders the 3D model
5. The generated code appears in the left panel
6. The 3D model appears in the center viewport with orbit/pan/zoom controls

## Project Structure

```
GPTCAD_AI/
  .env                              # Environment configuration
  dev.sh                            # Development launcher (both servers)
  PLAN.md                           # Full project plan and feature specs
  backend/
    main.py                         # FastAPI app, CORS, static files, router
    config.py                       # Loads .env settings
    requirements.txt                # Python dependencies
    routers/
      generate.py                   # POST /api/generate endpoint
    services/
      llm.py                       # OpenAI-compatible LLM client
      freecad_runner.py             # Headless FreeCAD script execution
      mesh_converter.py             # .brep -> .stl -> .glb conversion
      project_manager.py            # Project directory management
    prompts/
      system_prompt.txt             # LLM system prompt for code generation
    storage/                        # Runtime: generated models and projects
  frontend/
    index.html                      # Entry HTML with fonts and favicon
    vite.config.ts                  # Vite config (port 5175, API proxy)
    src/
      App.tsx                       # Root component
      index.css                     # Tailwind CSS with dark theme tokens
      api/
        client.ts                   # Axios client for backend API
      stores/
        appStore.ts                 # Zustand global state
      types/
        index.ts                    # TypeScript interfaces
      components/
        Layout.tsx                  # Three-panel resizable layout
        Viewport/
          Viewport.tsx              # Three.js canvas with R3F
          SceneSetup.tsx            # PBR lighting (key, fill, rim, ambient)
          InfiniteGrid.tsx          # Fading ground grid
          ModelRenderer.tsx         # glTF loader with PBR material
          ViewCube.tsx              # Orientation gizmo
        CodePanel/
          CodePanel.tsx             # Monaco editor (Python, read-only)
        PromptPanel/
          PromptPanel.tsx           # Chat panel container
          ChatHistory.tsx           # Message bubbles with auto-scroll
          PromptInput.tsx           # Text input wired to /api/generate
        Toolbar/
          TopBar.tsx                # Logo, project name, action buttons
          StatusBar.tsx             # Generation status indicator
      hooks/
        useResizable.ts            # Panel resize drag logic
```

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check, returns `{"status": "ok"}` |
| `POST` | `/api/generate` | Generate a 3D model from a prompt |

### POST /api/generate

**Request:**

```json
{
  "prompt": "Create a box with a cylindrical hole through the center",
  "project_id": null
}
```

**Response:**

```json
{
  "project_id": "a1b2c3d4e5f6",
  "model_url": "/storage/a1b2c3d4e5f6/model.glb",
  "code": "import FreeCAD, Part\n..."
}
```

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite |
| 3D Rendering | Three.js, @react-three/fiber, @react-three/drei |
| Code Editor | Monaco Editor |
| State | Zustand |
| Styling | Tailwind CSS v4 |
| Backend | FastAPI, Python |
| CAD Engine | FreeCAD (headless via freecadcmd) |
| LLM | Any OpenAI-compatible API |
| Mesh Pipeline | trimesh (STL to glTF conversion) |

## Troubleshooting

**FreeCAD not found:**
Verify the `FREECAD_CMD` path in `.env` is correct. Test it directly:
```bash
/path/to/freecadcmd --version
```

**LLM connection errors:**
Check that `OPENAI_BASE_URL` and `OPENAI_API_KEY` in `.env` are correct and the endpoint is reachable:
```bash
curl -s $OPENAI_BASE_URL/models -H "Authorization: Bearer $OPENAI_API_KEY"
```

**Port already in use:**
Kill existing processes on ports 8080 or 5175:
```bash
lsof -ti:8080 | xargs kill -9
lsof -ti:5175 | xargs kill -9
```

**Frontend can't reach backend:**
The Vite dev server proxies `/api` and `/storage` to `http://localhost:8080`. Make sure the backend is running before the frontend.

## License

MIT
