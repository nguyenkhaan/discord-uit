import asyncio

from httpx import ASGITransport, AsyncClient
from src.app import create_app


async def request_health() -> tuple[int, dict[str, str]]:
    app = create_app()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/health")
    return response.status_code, response.json()


def test_health_returns_ok() -> None:
    status_code, body = asyncio.run(request_health())

    assert status_code == 200
    assert body == {"status": "ok"}
