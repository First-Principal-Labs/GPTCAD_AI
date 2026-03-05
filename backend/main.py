from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.config import settings
from backend.routers import generate, iterate, manual, code_run, projects

app = FastAPI(title="GPTCAD", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure storage directory exists
settings.STORAGE_DIR.mkdir(parents=True, exist_ok=True)

# Serve generated model files
app.mount("/storage", StaticFiles(directory=str(settings.STORAGE_DIR)), name="storage")


app.include_router(generate.router)
app.include_router(iterate.router)
app.include_router(manual.router)
app.include_router(code_run.router)
app.include_router(projects.router)


@app.get("/api/health")
async def health():
    return {"status": "ok"}
