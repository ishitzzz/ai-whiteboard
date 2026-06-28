import os
import re
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import AsyncOpenAI
import uvicorn
from dotenv import load_dotenv
from pathlib import Path

env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path, override=True)

app = FastAPI()

# Allow CORS from React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ConceptRequest(BaseModel):
    concept: str

# Use the OpenAI SDK since it supports OpenRouter, Groq, and standard OpenAI interchangeably
# by configuring the base_url.
# Example for Groq: BASE_URL="https://api.groq.com/openai/v1"
client = AsyncOpenAI(
    api_key=os.environ.get("API_KEY", "your-api-key"),
    base_url=os.environ.get("BASE_URL", "https://api.openai.com/v1")
)

SYSTEM_PROMPT = """You are an expert mathematical graphics engine. Translate educational concepts into pure HTML5 Canvas 2D Javascript code.

RULES:
1. Output ONLY raw, executable javascript code. No markdown, no HTML.
2. DO NOT use template syntax. Use standard Javascript variables (e.g., const cx = 400;).
3. Canvas size is 800x500. Center the drawing around (cx=400, cy=250).
4. FORBIDDEN METHODS: Do NOT use ctx.arc(), ctx.rect(), ctx.ellipse(), or ctx.fill(). 
   - CRITICAL RULE FOR BIOLOGY: You are FORBIDDEN from using `ctx.lineTo()` for any biological, organic, or cellular shapes (membranes, organelles, proteins, lipids). You MUST use `ctx.bezierCurveTo()` or `ctx.quadraticCurveTo()` for ALL lines in a biological drawing to guarantee smooth, curved organic structures.
5. STRICT ADHERENCE: If the user asks for "cell membrane" (even with adjectives like "detailed"), start by copying EXAMPLE 1 exactly, then use bezier/quadratic loops to add extra details inside the bounds.
6. SPATIAL CONSISTENCY: Mathematically guarantee that internal components (like organelles) never float outside the main boundary by basing them on a central radius variable.

EXAMPLE 1 (BIOLOGICAL/ORGANIC): "a cell membrane"
const cx = 400;
const cy = 250;

// Outer boundary
ctx.beginPath();
ctx.moveTo(cx - 150, cy - 100);
ctx.bezierCurveTo(cx - 150, cy - 150, cx + 150, cy - 150, cx + 150, cy - 100);
ctx.bezierCurveTo(cx + 200, cy - 50, cx + 200, cy + 50, cx + 150, cy + 100);
ctx.bezierCurveTo(cx + 150, cy + 150, cx - 150, cy + 150, cx - 150, cy + 100);
ctx.bezierCurveTo(cx - 200, cy + 50, cx - 200, cy - 50, cx - 150, cy - 100);
ctx.stroke();

// Inner boundary (slightly smaller)
ctx.beginPath();
ctx.moveTo(cx - 130, cy - 80);
ctx.bezierCurveTo(cx - 130, cy - 120, cx + 130, cy - 120, cx + 130, cy - 80);
ctx.bezierCurveTo(cx + 160, cy - 30, cx + 160, cy + 30, cx + 130, cy + 80);
ctx.bezierCurveTo(cx + 130, cy + 120, cx - 130, cy + 120, cx - 130, cy + 80);
ctx.bezierCurveTo(cx - 160, cy + 30, cx - 160, cy - 30, cx - 130, cy - 80);
ctx.stroke();

// Phospholipid bilayer loops
const numPhospholipids = 20;
for (let i = 0; i < numPhospholipids; i++) {
    const angle = (i / numPhospholipids) * 2 * Math.PI;
    const outerX = cx + (140 * Math.cos(angle));
    const outerY = cy + (90 * Math.sin(angle));
    const innerX = cx + (120 * Math.cos(angle));
    const innerY = cy + (70 * Math.sin(angle));

    // Head
    ctx.beginPath();
    ctx.moveTo(outerX + 5, outerY);
    ctx.bezierCurveTo(outerX + 5, outerY - 5, outerX - 5, outerY - 5, outerX - 5, outerY);
    ctx.bezierCurveTo(outerX - 5, outerY + 5, outerX + 5, outerY + 5, outerX + 5, outerY);
    ctx.stroke();

    // Tail
    ctx.beginPath();
    ctx.moveTo(outerX, outerY);
    ctx.lineTo(innerX, innerY);
    ctx.stroke();
}

EXAMPLE 2 (MECHANICAL/CIRCUIT): "a wheatstone bridge"
const cx = 400; const cy = 250;
const size = 100;
// Full diamond structure
ctx.beginPath();
ctx.moveTo(cx, cy - size);
ctx.lineTo(cx + size, cy);
ctx.lineTo(cx, cy + size);
ctx.lineTo(cx - size, cy);
ctx.lineTo(cx, cy - size);
ctx.stroke();

// Detailed zig-zag resistor on one arm
ctx.beginPath();
ctx.moveTo(cx - size/2, cy - size/2);
ctx.lineTo(cx - size/2 + 10, cy - size/2 - 10);
ctx.lineTo(cx - size/2 - 10, cy - size/2 - 20);
ctx.lineTo(cx - size/2 + 10, cy - size/2 - 30);
ctx.lineTo(cx - size/2, cy - size/2 - 40);
ctx.stroke();
"""

@app.post("/generate-path")
async def generate_path(request: ConceptRequest):
    async def stream_generator():
        # Free test mode to prove the canvas works without burning tokens
        if request.concept.strip().lower() == "test":
            test_code = """
const cx = 400; const cy = 250;
ctx.beginPath();
ctx.moveTo(cx - 150, cy);
ctx.bezierCurveTo(cx - 150, cy - 100, cx + 150, cy - 100, cx + 150, cy);
ctx.bezierCurveTo(cx + 150, cy + 100, cx - 150, cy + 100, cx - 150, cy);
ctx.stroke();
"""
            # Stream it in small chunks to simulate LLM typing
            import asyncio
            for i in range(0, len(test_code), 15):
                yield test_code[i:i+15]
                await asyncio.sleep(0.05)
            return

        try:
            response = await client.chat.completions.create(
                model=os.environ.get("MODEL_NAME", "gpt-4o"), # e.g. "llama3-70b-8192" for Groq
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": request.concept}
                ],
                temperature=0.0, # Zero creativity to force exact template matching
                max_tokens=2048,
                stream=True,
            )
            
            async for chunk in response:
                if chunk.choices and chunk.choices[0].delta.content:
                    content = chunk.choices[0].delta.content
                    # Minor cleanup on the fly
                    content = content.replace("```javascript\n", "").replace("```js\n", "").replace("```", "")
                    yield content
        except Exception as e:
            yield f"// Error: {str(e)}"
            
    return StreamingResponse(stream_generator(), media_type="text/plain")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
