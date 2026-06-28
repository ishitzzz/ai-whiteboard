import asyncio
import os
import aiohttp

async def main():
    async with aiohttp.ClientSession() as session:
        async with session.post(
            'http://localhost:8000/generate-path',
            json={'concept': 'a cell membrane'}
        ) as response:
            print("Status:", response.status)
            async for data in response.content.iter_any():
                print("CHUNK:", data.decode('utf-8'))

if __name__ == '__main__':
    asyncio.run(main())
