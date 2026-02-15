#!/usr/bin/env python
"""Script to scrape jobs from Wuzzuf"""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from scraper import scrape_sample_jobs, scrape_wuzzuf
import json

def main():
    # Use samples for now (real scraping requires the FastAPI server running)
    print("Scraping sample jobs...")
    jobs = scrape_sample_jobs(count=20)
    
    print(f"\nTotal jobs scraped: {len(jobs)}")
    print("\nFirst job sample:")
    print(json.dumps(jobs[0], indent=2))
    
    # Save to file
    with open('scraped_jobs.json', 'w', encoding='utf-8') as f:
        json.dump(jobs, f, indent=2, ensure_ascii=False)
    
    print(f"\nJobs saved to scraped_jobs.json")

if __name__ == '__main__':
    main()
