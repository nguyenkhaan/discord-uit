import uvicorn

from src.config.settings import get_settings


if __name__ == "__main__":
    uvicorn.run(
        "src.app:create_app",
        factory=True,
        host="127.0.0.1",
        port=get_settings().port,
    )
