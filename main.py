import os

from backend.app import app


if __name__ == "__main__":
    import uvicorn

    host = os.getenv("HOST", "127.0.0.1")
    port = int(os.getenv("PORT", "8000"))
    reload_enabled = os.getenv("UVICORN_RELOAD", "false").lower() == "true"

    uvicorn.run("main:app", host=host, port=port, reload=reload_enabled)
