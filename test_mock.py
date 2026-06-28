import urllib.request
import json
import time

req = urllib.request.Request(
    'http://localhost:8000/generate-path',
    data=json.dumps({'concept': 'test'}).encode('utf-8'),
    headers={'Content-Type': 'application/json'}
)

print("Starting request...")
try:
    with urllib.request.urlopen(req) as response:
        print("Status:", response.status)
        while True:
            chunk = response.read(15)
            if not chunk:
                break
            print("CHUNK:", chunk.decode('utf-8'), end="", flush=True)
            time.sleep(0.01)
except Exception as e:
    print("Error:", e)
print("\nDone")
