from contextlib import asynccontextmanager

from fastapi import FastAPI

from src.http.health import router as health_router
from src.worker.runtime import ClassificationWorker


@asynccontextmanager
async def lifespan(app: FastAPI):
    worker = ClassificationWorker()
    await worker.start()
    app.state.worker = worker
    try:
        yield
    finally:
        await worker.stop()


app = FastAPI(
    title="Document classification worker",
    docs_url=None,
    redoc_url=None,
    openapi_url=None,
    lifespan=lifespan,
)

app.include_router(health_router)