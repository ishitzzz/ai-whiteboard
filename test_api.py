import asyncio
import os
import re
from openai import AsyncOpenAI
from dotenv import load_dotenv
from pathlib import Path

env_path = Path(__file__).parent / "server" / ".env"
load_dotenv(dotenv_path=env_path, override=True)

client = AsyncOpenAI(
    api_key=os.environ.get("API_KEY", "your-api-key"),
    base_url=os.environ.get("BASE_URL", "https://api.openai.com/v1")
)

SYSTEM_PROMPT = """You are an expert mathematical graphics engine. Translate educational concepts into pure HTML5 Canvas 2D Javascript code.
RULES:
1. Output ONLY raw, executable javascript code. No markdown, no HTML, no explanations.
2. CRITICAL: DO NOT use template syntax like {{var}} or jinja. You MUST use standard Javascript variable declarations (e.g. const centerX = 400;).
3. Implicit canvas size: 800x500. Center the drawing.
4. Use ONLY: ctx.moveTo(), ctx.lineTo(), ctx.bezierCurveTo(). Do not use rect() or arc().
5. Draw continuous center-line strokes. Do not draw hollow bounding boxes for lines. Connect intersecting points perfectly.

EXAMPLE OUTPUT:
const cx = 400;
const cy = 250;
ctx.beginPath();
ctx.moveTo(cx - 50, cy);
ctx.lineTo(cx + 50, cy);
ctx.stroke();
"""

async def test_generation():
    print("Testing generation...")
    try:
        response = await client.chat.completions.create(
            model=os.environ.get("MODEL_NAME", "google/gemini-2.5-flash-lite"),
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": "a cell membrane"}
            ],
            temperature=0.1,
            max_tokens=2048,
        )
        raw_output = response.choices[0].message.content
        print("RAW OUTPUT:")
        print("===")
        print(raw_output)
        print("===")
        
        cleaned_output = re.sub(r'```(?:javascript|js)?\n?', '', raw_output)
        cleaned_output = cleaned_output.replace('```', '').strip()
        print("CLEANED OUTPUT:")
        print("===")
        print(cleaned_output)
        print("===")
    except Exception as e:
        print(f"Error: {e}")

asyncio.run(test_generation())
