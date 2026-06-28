import urllib.request
import json

req = urllib.request.Request(
    'http://localhost:8000/generate-path',
    data=json.dumps({'concept': 'highly detailed cell membrane'}).encode('utf-8'),
    headers={'Content-Type': 'application/json'}
)

try:
    with urllib.request.urlopen(req) as response:
        print("Status:", response.status)
        while True:
            chunk = response.read(1024)
            if not chunk:
                break
            print("CHUNK:", chunk.decode('utf-8'))
except Exception as e:
    print("Error:", e)
