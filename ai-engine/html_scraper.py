"""
HTML Scraper Module
Scrapes job listings from HTML-based job boards using undetected-chromedriver
(bypasses anti-bot detection) with fallback to plain requests+BeautifulSoup.

Key Memory-Management Rules:
  - driver.quit() is ALWAYS called in a finally block.
  - gc.collect() is called after the driver is closed.
  - Random delays between pages reduce server load and detection risk.
  - One WebDriver instance per source call; never shared across threads.
"""

import gc
import logging
import random
import time
from typing import Dict, List, Optional

import requests
from bs4 import BeautifulSoup

from extractor import extract_skills_from_text

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# User-Agent pool for rotation
# ---------------------------------------------------------------------------

USER_AGENTS: List[str] = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_3_1) AppleWebKit/605.1.15 "
    "(KHTML, like Gecko) Version/17.3 Safari/605.1.15",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36 Edg/121.0.0.0",
]

# Page delay range (seconds) – randomised to avoid patterns
PAGE_DELAY_MIN = 3.0
PAGE_DELAY_MAX = 8.0

# Max HTML pages to scrape per source to avoid excessive run time
MAX_PAGES = 3


def _random_user_agent() -> str:
    return random.choice(USER_AGENTS)


# ---------------------------------------------------------------------------
# undetected-chromedriver scraping
# ---------------------------------------------------------------------------

def _try_import_uc():
    """Lazy import so the server doesn't crash if uc is not installed."""
    try:
        import undetected_chromedriver as uc  # noqa: F401
        return uc
    except ImportError:
        logger.warning(
            "undetected_chromedriver not installed. "
            "Falling back to requests + BeautifulSoup for HTML sources."
        )
        return None


def _scrape_with_uc(url: str, source_name: str) -> Optional[str]:
    """
    Fetch page HTML using undetected-chromedriver.
    Returns raw HTML string or None on failure.
    Always calls driver.quit() + gc.collect() in finally.
    """
    uc = _try_import_uc()
    if uc is None:
        return None

    driver = None
    try:
        options = uc.ChromeOptions()
        options.add_argument("--headless=new")
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--disable-gpu")
        options.add_argument("--window-size=1920,1080")
        options.add_argument(f"--user-agent={_random_user_agent()}")

        driver = uc.Chrome(options=options, use_subprocess=True)
        driver.set_page_load_timeout(30)

        logger.info("undetected-chromedriver: loading %s", url)
        driver.get(url)

        # ─── IMPLICIT WAIT / DEBUGGING ───────────────────────────────────────
        # Wait up to 15s for any common job card container to appear
        from selenium.webdriver.common.by import By
        from selenium.webdriver.support.ui import WebDriverWait
        from selenium.webdriver.support import expected_conditions as EC

        # Common CSS selectors for job cards (broad match + Wuzzuf structural)
        common_selectors = [
            'div[data-test="job-card"]',
            'article',
            '.job-card',
            'div[class*="job"]',
            'li[class*="job"]',
            'a[href*="/jobs/p/"]'        # Wuzzuf job links (anchor for structural parsing)
        ]
        
        found = False
        for selector in common_selectors:
            try:
                WebDriverWait(driver, 3).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, selector))
                )
                found = True
                break
            except Exception:
                continue

        if not found:
            logger.warning("No common job cards found on page '%s' – site may be blocking.", url)

        # ────────────────────────────────────────────────────────────────────

        # Random sleep still useful for behavior simulation
        time.sleep(random.uniform(2.0, 4.0))

        return driver.page_source

    except Exception as exc:
        logger.error("undetected-chromedriver error for '%s': %s", source_name, exc)
        return None

    finally:
        if driver is not None:
            try:
                driver.quit()
                logger.debug("Browser closed for source '%s'", source_name)
            except Exception as quit_err:
                logger.warning("Error closing browser: %s", quit_err)
        # Explicit garbage collection to free Chrome subprocess memory
        gc.collect()


def _scrape_with_requests(url: str, source_name: str) -> Optional[str]:
    """
    Fallback: fetch page HTML using the requests library.
    """
    try:
        headers = {
            "User-Agent": _random_user_agent(),
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
        }
        response = requests.get(url, headers=headers, timeout=15)
        response.raise_for_status()
        return response.text
    except Exception as exc:
        logger.error("requests fallback error for '%s': %s", source_name, exc)
        return None


# ---------------------------------------------------------------------------
# Generic HTML parser – tries common job-card patterns
# ---------------------------------------------------------------------------

def _parse_job_cards(html: str, source_name: str, base_url: str) -> List[Dict]:
    """
    Parse job cards from raw HTML.
    Uses several selector patterns as cascaded fallbacks.
    """
    jobs: List[Dict] = []

    try:
        soup = BeautifulSoup(html, "lxml")

        # ─── WUZZUF ROBUST STRUCTURAL PARSING ────────────────────────────────
        # Strategy: Find all <a> tags that look like job links, then traverse up
        # to find the container and sibling elements (company, location, etc.)
        if "wuzzuf" in source_name.lower() or "wuzzuf" in base_url.lower():
            # Find all anchors containing "/jobs/p/" (standard Wuzzuf job pattern)
            job_links = soup.find_all("a", href=lambda h: h and "/jobs/p/" in h)
            
            seen_urls = set()
            for link in job_links:
                try:
                    href = link.get("href")
                    if not href or href in seen_urls:
                        continue
                    seen_urls.add(href)
                    
                    # Title is the link text
                    title = link.get_text(strip=True)
                    url = "https://wuzzuf.net" + href if not href.startswith("http") else href
                    
                    # Traverse up to find the container (usually a parent div/article)
                    # Wuzzuf structure is usually: Container > Header > Title Link
                    # So we go up 2-3 levels to find the "Card"
                    container = link.find_parent("div")
                    # If the immediate parent is just a heading or small wrapper, go up again
                    if container and len(container.get_text(strip=True)) < len(title) + 5:
                         container = container.find_parent("div")
                    
                    # If we still don't have a substantial container, try the next parent
                    if container and len(container.text) < 50:
                         container = container.find_parent("div")

                    if not container:
                        continue

                    # Company: Find anchor with "/jobs/company/" or "/company/" in href within this container
                    company_tag = container.find("a", href=lambda h: h and ("/jobs/company/" in h or "/company/" in h))
                    company = company_tag.get_text(strip=True).rstrip(" -") if company_tag else "Unknown"

                    # Location: Text node or span near company?
                    # Wuzzuf often puts location in a span. Let's grab all text and try to parse, 
                    # or find the text node that contains 'Cairo', 'Giza', etc.
                    # Robust fail-safe: Get all text from container, remove title/company, treat rest as description info.
                    description_text = container.get_text(" | ", strip=True)
                    
                    # Skills: Find anchors with "/a/" (tags/skills usually have this pattern on Wuzzuf)
                    # Note: company links also sometimes have /a/ if they are branded, so we exclude company href
                    skill_tags = container.find_all("a", href=lambda h: h and "/a/" in h and (not company_tag or h != company_tag.get("href")))
                    skills = [s.get_text(strip=True) for s in skill_tags if len(s.get_text(strip=True)) > 1]
                    
                    # Fallback description
                    description = f"{title} at {company}. {description_text[:200]}..."

                    jobs.append({
                        "title":       title,
                        "company":     company,
                        "description": description,
                        "url":         url,
                        "source":      source_name,
                        "skills":      skills,
                    })
                except Exception as w_err:
                    logger.warning("Error parsing structural Wuzzuf card: %s", w_err)
                    continue
            
            if jobs:
                return jobs
        
        # ─── GENERIC FALLBACK (EXISTING LOGIC) ───────────────────────────────

        # Common card selectors (add more patterns as needed)
        card_selectors = [
            ("div", {"data-test": "job-card"}),
            ("article", {"class": lambda c: c and "job" in " ".join(c).lower()}),
            ("li",  {"class": lambda c: c and "job" in " ".join(c).lower()}),
            ("div", {"class": lambda c: c and "job-card" in " ".join(c).lower()}),
        ]

        cards = []
        for tag, attrs in card_selectors:
            cards = soup.find_all(tag, attrs)
            if cards:
                logger.debug("Matched selector <%s %s>: %d cards", tag, attrs, len(cards))
                break

        if not cards:
            logger.warning("No job cards found in HTML from '%s'", source_name)
            return jobs

        for card in cards:
            try:
                # Title: look for h1/h2/h3 or anchor
                title_tag = (
                    card.find(["h1", "h2", "h3"])
                    or card.find("a")
                )
                title = title_tag.get_text(strip=True) if title_tag else ""

                if not title:
                    continue

                # Company
                company_tag = card.find(attrs={"class": lambda c: c and "company" in " ".join(c).lower()})
                company = company_tag.get_text(strip=True) if company_tag else "Unknown Company"

                # Description/snippet
                desc_tag = card.find("p") or card.find(attrs={"class": lambda c: c and "desc" in " ".join(c).lower()})
                description = desc_tag.get_text(strip=True) if desc_tag else ""

                # URL
                link_tag = card.find("a", href=True)
                url = None
                if link_tag:
                    href = link_tag["href"]
                    if href.startswith("http"):
                        url = href
                    elif href.startswith("/"):
                        url = base_url.rstrip("/") + href
                
                # Extract skills
                skills = extract_skills_from_text(f"{title} {description}", threshold=80)

                jobs.append({
                    "title":       title,
                    "company":     company,
                    "description": description or title,
                    "url":         url,
                    "source":      source_name,
                    "skills":      skills,
                })

            except Exception as card_err:
                logger.warning("Error parsing card from '%s': %s", source_name, card_err)
                continue

    except Exception as parse_err:
        logger.error("HTML parse error for '%s': %s", source_name, parse_err)

    return jobs


# ---------------------------------------------------------------------------
# Public entry point
# ---------------------------------------------------------------------------

def scrape_html_source(source: Dict, query: str, max_results: int = 30) -> List[Dict]:
    """
    Scrape jobs from an HTML-based job board using the source config dict.

    Args:
        source:      Dict with keys: name, endpoint, headers, params.
        query:       Job search term.
        max_results: Maximum jobs to collect.

    Returns:
        Normalised job list (may be empty on failure).
    """
    all_jobs: List[Dict] = []
    source_name = source.get("name", "unknown_html")
    base_url    = source.get("endpoint", "")

    if not base_url:
        logger.error("HTML source '%s' has no endpoint configured.", source_name)
        return all_jobs

    # Build page URLs (simple ?page=N or ?start=N pagination)
    for page in range(MAX_PAGES):
        if len(all_jobs) >= max_results:
            break

        # Naïve pagination – works for many boards; extend per-source as needed
        page_url = f"{base_url}?q={query}&page={page + 1}"

        logger.info("Scraping HTML page %d/%d: %s", page + 1, MAX_PAGES, page_url)

        html = _scrape_with_uc(page_url, source_name)
        if html is None:
            html = _scrape_with_requests(page_url, source_name)

        if not html:
            logger.warning("No HTML returned for page %d of '%s'. Stopping.", page + 1, source_name)
            break

        page_jobs = _parse_job_cards(html, source_name, base_url)

        if not page_jobs:
            logger.info("No jobs on page %d of '%s'. Stopping pagination.", page + 1, source_name)
            break

        all_jobs.extend(page_jobs)
        logger.info("Collected %d jobs so far from '%s'", len(all_jobs), source_name)

        # Rate limiting: random delay between pages
        if page < MAX_PAGES - 1 and len(all_jobs) < max_results:
            sleep_time = random.uniform(PAGE_DELAY_MIN, PAGE_DELAY_MAX)
            logger.debug("Sleeping %.1fs before next page", sleep_time)
            time.sleep(sleep_time)

    # Trim to max_results and run final gc
    result = all_jobs[:max_results]
    gc.collect()

    logger.info(
        "HTML scraper finished for '%s': %d jobs collected.", source_name, len(result)
    )
    return result
