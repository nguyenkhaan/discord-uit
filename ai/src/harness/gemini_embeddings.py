from typing import Protocol


class EmbeddingClient(Protocol):
    def embed(self, texts: list[str]) -> list[list[float]]: ...


class EmbeddingProviderError(RuntimeError):
    pass


class GeminiEmbeddingClient:
    def __init__(self, api_key: str, model: str = "gemini-embedding-2") -> None:
        from google import genai

        self._client = genai.Client(api_key=api_key)
        self._model = model

    def embed(self, texts: list[str]) -> list[list[float]]:
        try:
            vectors: list[list[float]] = []
            for text in texts:
                response = self._client.models.embed_content(model=self._model, contents=text)
                vectors.append(list(response.embeddings[0].values))
            return vectors
        except Exception:
            raise EmbeddingProviderError("Gemini embedding request failed") from None
