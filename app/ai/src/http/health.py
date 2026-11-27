from fastapi import APIRouter, HTTPException, Request

router = APIRouter(tags=["internal-health"])

@router.get("/health/live")
async def live() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/health/ready")
async def ready(request: Request) -> dict[str, str]:
    worker = request.app.state.worker
    if not worker.is_ready:
        raise HTTPException(status_code=503, detail="worker is not ready")
    return {"status": "ready"}