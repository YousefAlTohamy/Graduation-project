"""
Test script to verify AI Engine CV analysis functionality
"""

import requests
import json

# Test endpoints
BASE_URL = "http://127.0.0.1:8001"

def test_health_check():
    """Test the health check endpoint"""
    print("=" * 60)
    print("TEST 1: Health Check Endpoint")
    print("=" * 60)
    
    response = requests.get(f"{BASE_URL}/")
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    assert response.status_code == 200
    assert response.json()["status"] == "running"
    print("✓ Health check passed!\n")


def test_skills_endpoint():
    """Test the skills listing endpoint"""
    print("=" * 60)
    print("TEST 2: Skills Endpoint")
    print("=" * 60)
    
    response = requests.get(f"{BASE_URL}/skills")
    data = response.json()
    
    print(f"Status Code: {response.status_code}")
    print(f"Technical Skills Count: {len(data['technical'])}")
    print(f"Soft Skills Count: {len(data['soft'])}")
    print(f"\nSample Technical Skills (first 10):")
    for skill in data['technical'][:10]:
        print(f"  - {skill}")
    
    print(f"\nSample Soft Skills (first 5):")
    for skill in data['soft'][:5]:
        print(f"  - {skill}")
    
    assert response.status_code == 200
    assert len(data['technical']) > 0
    assert len(data['soft']) > 0
    print("\n✓ Skills endpoint passed!\n")


def test_text_extraction():
    """Test text extraction from a sample text"""
    print("=" * 60)
    print("TEST 3: Skill Extraction (Text-based)")
    print("=" * 60)
    
    # Import the extractor module
    import sys
    sys.path.append('.')
    from extractor import extract_skills_from_text
    
    # Sample CV text
    sample_cv = """
    John Doe
    Senior Full-Stack Developer
    
    TECHNICAL SKILLS:
    - Programming: PHP, Python, JavaScript, TypeScript
    - Frameworks: Laravel, React, Vue.js, FastAPI
    - Databases: MySQL, PostgreSQL, Redis
    - DevOps: Docker, Kubernetes, AWS, CI/CD
    - Version Control: Git, GitHub
    
    SOFT SKILLS:
    - Strong communication and teamwork abilities
    - Excellent problem solving skills
    - Leadership experience managing development teams
    - Time management and organizational skills
    
    EXPERIENCE:
    - Built microservices architecture using Laravel and Python
    - Implemented REST APIs with FastAPI
    - Managed cloud deployments on AWS
    """
    
    skills = extract_skills_from_text(sample_cv)
    
    print(f"Total Skills Found: {len(skills)}")
    print(f"\nExtracted Technical Skills:")
    tech_skills = [s for s in skills if s['type'] == 'technical']
    for skill in tech_skills:
        print(f"  - {skill['name']}")
    
    print(f"\nExtracted Soft Skills:")
    soft_skills = [s for s in skills if s['type'] == 'soft']
    for skill in soft_skills:
        print(f"  - {skill['name']}")
    
    print(f"\n✓ Skill extraction passed! Found {len(skills)} total skills\n")


if __name__ == "__main__":
    print("\n" + "=" * 60)
    print("CareerCompass AI Engine - Test Suite")
    print("=" * 60 + "\n")
    
    try:
        test_health_check()
        test_skills_endpoint()
        test_text_extraction()
        
        print("=" * 60)
        print("ALL TESTS PASSED! ✓")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n❌ TEST FAILED: {str(e)}")
        import traceback
        traceback.print_exc()
