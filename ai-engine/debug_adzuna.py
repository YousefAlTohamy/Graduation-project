"""
Quick diagnostic: tests the Adzuna API connection directly.
Run from ai-engine/ directory: python debug_adzuna.py
"""
import os, sys

# ── 1. Try loading .env ──────────────────────────────────────────────────────
try:
    from dotenv import load_dotenv
    load_dotenv()
    print("[OK]  python-dotenv is installed and .env was loaded")
except ImportError:
    print("[FAIL] python-dotenv is NOT installed — run: pip install python-dotenv==1.0.1")
    sys.exit(1)

# ── 2. Check credentials ─────────────────────────────────────────────────────
app_id  = os.environ.get("ADZUNA_APP_ID", "")
app_key = os.environ.get("ADZUNA_APP_KEY", "")
print(f"[INFO] ADZUNA_APP_ID  = {'[SET] ' + app_id[:4] + '...' if app_id  else '[MISSING]'}")
print(f"[INFO] ADZUNA_APP_KEY = {'[SET] ' + app_key[:4] + '...' if app_key else '[MISSING]'}")

if not app_id or not app_key:
    print("\n[FAIL] Credentials missing — check ai-engine/.env")
    sys.exit(1)

# ── 3. Raw HTTP call with full response ──────────────────────────────────────
import httpx

url = "https://api.adzuna.com/v1/api/jobs/us/search/1"
params = {
    "app_id":           app_id,
    "app_key":          app_key,
    "what":             "developer",
    "results_per_page": 2,
}
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Accept":     "application/json",
}

print(f"\n[INFO] Calling: GET {url}")
print(f"[INFO] Params:  {params}")

try:
    with httpx.Client(timeout=20, headers=headers) as client:
        resp = client.get(url, params=params)
    print(f"\n[INFO] HTTP Status : {resp.status_code}")
    print(f"[INFO] Content-Type: {resp.headers.get('content-type', 'N/A')}")

    body = resp.text
    print(f"[INFO] Response body (first 500 chars):\n{body[:500]}")

    if resp.status_code == 200:
        data = resp.json()
        results = data.get("results", [])
        print(f"\n[OK]  SUCCESS — {len(results)} result(s) returned")
    else:
        print(f"\n[FAIL] HTTP {resp.status_code}")
except Exception as e:
    print(f"\n[FAIL] Exception: {e}")
