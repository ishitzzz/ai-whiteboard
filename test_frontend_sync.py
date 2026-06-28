import requests

response = requests.post(
    'http://localhost:8000/generate-path',
    json={'concept': 'a cell membrane'},
    stream=True
)
print("Status:", response.status_code)
for chunk in response.iter_content(chunk_size=1024):
    if chunk:
        print("CHUNK:", chunk.decode('utf-8'))
