from typing import Protocol 
class EmbeddingClient(Protocol):  
    def embed(self, texts: list[str]) -> list[list[float]]: ... 

class EmbeddingProviderError(RuntimeError): pass 

class GeminiEmbeddingClient: 
    def __init__(self, api_key: str, model: str): 
        self.model = model 
        from google import genai 
        self.client = genai.Client(api_key=api_key)

    def embed(self, texts: list[str]) -> list[list[float]]: 
        try: 
            vectors: list[list[float]] = [] 
            for text in texts: 
                response = self.client.models.embed_content(
                    model=self.model, contents=text
                ) 
                if response.embeddings and len(response.embeddings) > 0:
                    embedding_obj = response.embeddings[0]
                    if hasattr(embedding_obj, "values") and embedding_obj.values is not None:
                        vector_values: list[float] = list(embedding_obj.values)
                        vectors.append(vector_values)
                    else:
                        raise EmbeddingProviderError("Embedding response missing 'values'")
                else:
                    raise EmbeddingProviderError("Empty embedding response received")
                    
            return vectors
        except Exception as e: 
            if isinstance(e, EmbeddingProviderError):
                raise
            raise EmbeddingProviderError("Gemini embedding request failed") from None