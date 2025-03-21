from typing import Optional
from deepseekr1distillqwen32b import DeepSeekProvider
from llama3point3nemotronsuper49bv1 import LlamaProvider

class LLMProvider:
    """
    abstract class for different llms
    """

    def __init__(self, model_name:str, api_key: Optional[str] = None):
        self.model_name = model_name
        self.api_key = api_key or self._get_default_api_key()

    def _get_default_api_key(self) -> str:
        raise NotImplementedError

    async def generate_response(self, prompt:str, temperature:float=0.7) -> str:
        raise NotImplementedError

def create_llm_provider(model_name: str) -> LLMProvider:
    
    if model_name.startswith("deepseek"):
        return DeepSeekProvider(model_name)
    elif model_name.startswith("llama"):
        return LlamaProvider(model_name)
    else:
        raise ValueError(f"Unsupported model: {model_name}")