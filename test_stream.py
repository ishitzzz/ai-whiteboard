import asyncio
import os
from openai import AsyncOpenAI
from dotenv import load_dotenv
from pathlib import Path

env_path = Path(__file__).parent / "server" / ".env"
load_dotenv(dotenv_path=env_path, override=True)

client = AsyncOpenAI(
    api_key=os.environ.get("API_KEY", "your-api-key"),
    base_url=os.environ.get("BASE_URL", "https://api.openai.com/v1")
)

async def test():
    try:
        response = await client.chat.completions.create(
            model=os.environ.get("MODEL_NAME", "gpt-4o"),
            messages=[{"role": "user", "content": "Draw a cell membrane"}],
            stream=True,
            temperature=0.1,
            max_tokens=2048,
        )
        async for chunk in response:
            if chunk.choices and chunk.choices[0].delta.content:
                print(chunk.choices[0].delta.content, end="", flush=True)
    except Exception as e:
        print(f"Error: {e}")

asyncio.run(test())
