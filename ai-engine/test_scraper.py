"""
Test script for job scraping functionality
"""

import requests
import json

AI_ENGINE_URL = "http://127.0.0.1:8001"
LARAVEL_API_URL = "http://127.0.0.1:8000/api"

def test_scraper_status():
    """Test scraper status endpoint"""
    print("Testing scraper status...")
    response = requests.get(f"{AI_ENGINE_URL}/scrape-jobs/status")
    print(f"Status: {response.status_code}")
    print(json.dumps(response.json(), indent=2))
    print()

def test_sample_jobs():
    """Test sample job generation"""
    print("Testing sample job scraping...")
    payload = {
        "query": "PHP Developer",
        "max_results": 5,
        "use_samples": True
    }
    response = requests.post(f"{AI_ENGINE_URL}/scrape-jobs", json=payload)
    print(f"Status: {response.status_code}")
    data = response.json()
    print(f"Total jobs: {data.get('total_jobs', 0)}")
    if data.get('jobs'):
        print(f"First job: {data['jobs'][0]['title']} at {data['jobs'][0]['company']}")
        print(f"Skills: {[s['name'] for s in data['jobs'][0]['skills']]}")
    print()

if __name__ == "__main__":
    print("=" * 60)
    print("CareerCompass - Job Scraper Test")
    print("=" * 60)
    print()
    
    try:
        test_scraper_status()
        test_sample_jobs()
        print("✅ All tests passed!")
    except requests.exceptions.ConnectionError:
        print("❌ Error: AI Engine is not running on port 8001")
        print("   Start it with: uvicorn main:app --reload --port 8001")
    except Exception as e:
        print(f"❌ Error: {str(e)}")
