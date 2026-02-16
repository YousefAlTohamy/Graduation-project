"""
Job Scraper Module
Scrapes job listings from Wuzzuf and other job boards
"""

import requests
from bs4 import BeautifulSoup
import time
import random
import logging
from typing import List, Dict, Optional
from fastapi import HTTPException
from extractor import extract_skills_from_text

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuration
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
REQUEST_DELAY = 2  # seconds between requests (pages)
CARD_DELAY_MIN = 0.5  # minimum delay between processing cards
CARD_DELAY_MAX = 2.0  # maximum delay between processing cards
TIMEOUT = 10  # request timeout in seconds


def scrape_wuzzuf(query: str, max_pages: int = 3) -> List[Dict]:
    """
    Scrape job listings from Wuzzuf.
    
    Args:
        query: Search query (e.g., "PHP Developer")
        max_pages: Maximum number of pages to scrape
        
    Returns:
        List of job dictionaries with title, company, description, url, and skills
    """
    jobs = []
    base_url = "https://wuzzuf.net/search/jobs/"
    
    logger.info(f"Starting Wuzzuf scrape for query: '{query}', max_pages: {max_pages}")
    
    for page in range(max_pages):
        try:
            # Construct URL with pagination
            params = {
                'q': query,
                'start': page * 15  # Wuzzuf shows ~15 jobs per page
            }
            
            headers = {
                'User-Agent': USER_AGENT,
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
            }
            
            logger.info(f"Fetching page {page + 1}/{max_pages}...")
            
            response = requests.get(base_url, params=params, headers=headers, timeout=TIMEOUT)
            response.raise_for_status()
            
            # Parse HTML
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Find job listings - using multiple selectors as fallback
            job_cards = soup.find_all('div', class_='css-1gatmva')
            
            if not job_cards:
                # Fallback: try alternative selector
                job_cards = soup.find_all('div', {'data-test': 'job-card'})
            
            if not job_cards:
                logger.warning(f"No job cards found on page {page + 1}. Selectors may need updating.")
                break
            
            logger.info(f"Found {len(job_cards)} job listings on page {page + 1}")
            
            for idx, card in enumerate(job_cards):
                try:
                    job_data = parse_job_card(card)
                    if job_data:
                        jobs.append(job_data)
                    
                    # Random delay between processing each card (except the last one)
                    if idx < len(job_cards) - 1:
                        delay = random.uniform(CARD_DELAY_MIN, CARD_DELAY_MAX)
                        time.sleep(delay)
                        
                except Exception as e:
                    logger.error(f"Error parsing job card: {str(e)}")
                    continue
            
            # Respectful scraping: delay between pages
            if page < max_pages - 1:
                time.sleep(REQUEST_DELAY)
                
        except requests.HTTPError as e:
            if e.response.status_code == 403:
                logger.error(f"Wuzzuf blocked the request (403 Forbidden) on page {page + 1}")
                raise HTTPException(
                    status_code=503, 
                    detail="Wuzzuf blocked the request. The service is temporarily unavailable."
                )
            logger.error(f"HTTP error on page {page + 1}: {str(e)}")
            break
        except requests.RequestException as e:
            logger.error(f"Request error on page {page + 1}: {str(e)}")
            break
        except Exception as e:
            logger.error(f"Unexpected error on page {page + 1}: {str(e)}")
            break
    
    logger.info(f"Scraping complete. Total jobs found: {len(jobs)}")
    return jobs


def parse_job_card(card) -> Optional[Dict]:
    """
    Parse a single job card element.
    
    Args:
        card: BeautifulSoup element representing a job card
        
    Returns:
        Dictionary with job data or None if parsing fails
    """
    try:
        # Extract title
        title_elem = card.find('h2', class_='css-m604qf')
        if not title_elem:
            title_elem = card.find('a', class_='css-o171kl')
        title = title_elem.get_text(strip=True) if title_elem else "Unknown Title"
        
        # Extract company
        company_elem = card.find('a', class_='css-17s97q8')
        if not company_elem:
            company_elem = card.find('div', class_='css-d7j1kk')
        company = company_elem.get_text(strip=True) if company_elem else "Unknown Company"
        
        # Extract description/summary
        desc_elem = card.find('div', class_='css-y4udm8')
        if not desc_elem:
            desc_elem = card.find('p', class_='css-y4udm8')
        description = desc_elem.get_text(strip=True) if desc_elem else ""
        
        # Extract URL
        link_elem = card.find('a', href=True)
        url = None
        if link_elem and link_elem['href']:
            href = link_elem['href']
            if href.startswith('/'):
                url = f"https://wuzzuf.net{href}"
            elif href.startswith('http'):
                url = href
        
        # Combine title and description for skill extraction
        full_text = f"{title} {description}"
        
        # Extract skills from job text
        skills = extract_skills_from_text(full_text, threshold=85)
        
        job_data = {
            'title': title,
            'company': company,
            'description': description if description else title,
            'url': url,
            'source': 'wuzzuf',
            'skills': skills
        }
        
        logger.debug(f"Parsed job: {title} at {company}")
        return job_data
        
    except Exception as e:
        logger.error(f"Error parsing job card: {str(e)}")
        return None


def scrape_sample_jobs(count: int = 10) -> List[Dict]:
    """
    Generate sample job listings for testing (when scraping is not available).
    
    Args:
        count: Number of sample jobs to generate
        
    Returns:
        List of sample job dictionaries
    """
    sample_jobs = []
    
    job_templates = [
        {
            'title': 'Senior PHP Developer',
            'company': 'TechCorp Egypt',
            'description': 'We are looking for a Senior PHP Developer with Laravel experience. Must have strong knowledge of MySQL, Docker, and Git. Good communication skills required.',
            'skills': ['PHP', 'Laravel', 'MySQL', 'Docker', 'Git', 'Communication']
        },
        {
            'title': 'Full Stack Developer',
            'company': 'Digital Solutions',
            'description': 'Full stack position requiring React, Node.js, and MongoDB experience. FastAPI knowledge is a plus. Teamwork and problem solving essential.',
            'skills': ['React', 'Node.js', 'MongoDB', 'FastAPI', 'Teamwork', 'Problem Solving']
        },
        {
            'title': 'Python Backend Developer',
            'company': 'AI Innovations',
            'description': 'Python developer needed for microservices development. Experience with FastAPI, PostgreSQL, and AWS required. Leadership qualities valued.',
            'skills': ['Python', 'FastAPI', 'PostgreSQL', 'AWS', 'Microservices', 'Leadership']
        },
        {
            'title': 'DevOps Engineer',
            'company': 'Cloud Systems',
            'description': 'DevOps role focusing on Kubernetes, Docker, and CI/CD pipelines. Jenkins and Terraform experience required.',
            'skills': ['Kubernetes', 'Docker', 'CI/CD', 'Jenkins', 'Terraform', 'AWS']
        },
        {
            'title': 'Frontend Developer',
            'company': 'WebDev Studio',
            'description': 'Frontend developer with Vue.js and React expertise. HTML, CSS, and JavaScript fundamentals required. Creativity important.',
            'skills': ['Vue.js', 'React', 'HTML', 'CSS', 'JavaScript', 'Creativity']
        },
    ]
    
    for i in range(min(count, len(job_templates) * 2)):
        template = job_templates[i % len(job_templates)]
        job = {
            'title': template['title'],
            'company': f"{template['company']} #{i // len(job_templates) + 1}",
            'description': template['description'],
            'url': f"https://wuzzuf.net/jobs/sample-{i}",
            'source': 'wuzzuf',
            'skills': [{'name': skill, 'type': 'technical' if skill not in ['Communication', 'Teamwork', 'Problem Solving', 'Leadership', 'Creativity'] else 'soft'} 
                      for skill in template['skills']]
        }
        sample_jobs.append(job)
    
    return sample_jobs[:count]


def calculate_skill_frequencies(jobs: List[Dict]) -> Dict:
    """
    Calculate skill frequency analysis from a list of jobs.
    
    Args:
        jobs: List of job dictionaries with 'skills' key
        
    Returns:
        Dictionary with skill statistics including frequency and importance
    """
    if not jobs:
        return {}
    
    total_jobs = len(jobs)
    skill_counts = {}
    
    # Count occurrences of each skill
    for job in jobs:
        if 'skills' in job and isinstance(job['skills'], list):
            for skill in job['skills']:
                skill_name = skill['name'] if isinstance(skill, dict) else skill
                skill_type = skill['type'] if isinstance(skill, dict) and 'type' in skill else 'technical'
                
                if skill_name not in skill_counts:
                    skill_counts[skill_name] = {
                        'count': 0,
                        'type': skill_type
                    }
                skill_counts[skill_name]['count'] += 1
    
    # Calculate percentages and importance
    skill_stats = {}
    for skill_name, data in skill_counts.items():
        count = data['count']
        percentage = (count / total_jobs) * 100
        importance = categorize_skill_by_demand(percentage)
        
        skill_stats[skill_name] = {
            'count': count,
            'percentage': round(percentage, 2),
            'importance': importance,
            'type': data['type']
        }
    
    # Sort by percentage descending
    sorted_stats = dict(sorted(skill_stats.items(), key=lambda x: x[1]['percentage'], reverse=True))
    
    logger.info(f"Calculated skill frequencies for {total_jobs} jobs, found {len(sorted_stats)} unique skills")
    
    return sorted_stats


def categorize_skill_by_demand(percentage: float) -> str:
    """
    Categorize skill importance based on demand frequency.
    
    Args:
        percentage: Frequency percentage (0-100)
        
    Returns:
        Category: 'essential', 'important', or 'nice_to_have'
    """
    if percentage > 70:
        return 'essential'
    elif percentage >= 40:
        return 'important'
    else:
        return 'nice_to_have'
