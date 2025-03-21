import os
from openai import OpenAI
from dotenv import load_dotenv
import asyncio
from typing import Optional
load_dotenv()


class LLMProvider:
  """
  abstract class for different llms
  """

  def __init__(self, model_name: str, api_key: Optional[str] = None):
    self.model_name = model_name
    self.api_key = api_key or self._get_default_api_key()

  def _get_default_api_key(self) -> str:
    raise NotImplementedError

  async def generate_response(self, prompt: str, temperature: float = 0.7) -> str:
    raise NotImplementedError

class DeepSeekProvider(LLMProvider):

  def _get_default_api_key(self) -> str:
    return os.getenv("DEEPSEEK_API_KEY", "")


  async def generate_response(self, prompt: str, temperature: float = 0.7) -> str:
    client = OpenAI(
      base_url = "https://integrate.api.nvidia.com/v1",
      api_key = self.api_key
    )

    completion = await asyncio.to_thread(
      client.chat.completions.create,
      model="deepseek-ai/deepseek-r1-distill-qwen-32b",
      messages=[{"role":"user","content":prompt}],
      temperature=0.6,
      top_p=0.7,
      max_tokens=100,
      # stream=True
    )

    return completion.choices[0].message.content
