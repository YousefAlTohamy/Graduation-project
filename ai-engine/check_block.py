import requests
import random
import time

# الرابط اللي بنجرب عليه
TARGET_URL = "https://wuzzuf.net/search/jobs/?q=Laravel&a=hpb"

def test_request(name, headers):
    print(f"\n--- Testing: {name} ---")
    try:
        response = requests.get(TARGET_URL, headers=headers, timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Final URL: {response.url}")
        
        if response.status_code == 200:
            print("✅ SUCCESS: Access Granted!")
            # نتأكد إنه مش صفحة Captcha
            if "captcha" in response.text.lower() or "challenge" in response.text.lower():
                print("⚠️ WARNING: Got 200 OK, but it looks like a Captcha/Challenge page.")
            else:
                print(f"📄 Content Length: {len(response.text)} bytes (Looks like real data)")
        elif response.status_code == 403:
            print("🚫 BLOCKED: 403 Forbidden (WAF Blocked this request)")
        elif response.status_code == 503:
            print("🛡️ BLOCKED: 503 Service Unavailable (Cloudflare Protection)")
        else:
            print(f"⚠️ Unexpected Status: {response.status_code}")
            
    except Exception as e:
        print(f"❌ ERROR: Connection Failed -> {str(e)}")

# 1. التجربة بالإعدادات الحالية (Current Scraper Config)
current_headers = {
    'User-Agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
}
test_request("Current Project Configuration", current_headers)

time.sleep(2) # استنى ثانيتين

# 2. التجربة بإعدادات جديدة (New 'Stealth' Config)
# بنحاول نقلد متصفح حقيقي جداً (Real Browser Headers)
new_headers = {
    'User-Agent': f"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.{random.randint(100, 999)} Safari/537.36",
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Cache-Control': 'max-age=0',
}
test_request("New 'Stealth' Configuration", new_headers)
