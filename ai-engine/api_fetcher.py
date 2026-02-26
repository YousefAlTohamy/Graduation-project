"""
API Fetcher Module
Fetches and normalises job listings from free REST APIs (Remotive, Adzuna).
Each public function returns a List[Dict] in the standard job schema:
  {title, company, description, url, source, skills}

All functions are wrapped in try/except – a failing source returns []
so the caller can continue to the next source without crashing.
"""

import logging
import os
from typing import Any, Dict, List, Optional

import httpx  # async-capable, modern HTTP client
from dotenv import load_dotenv

from extractor import extract_skills_from_text

# Load credentials from ai-engine/.env (overrides nothing if already set in the shell)
load_dotenv()

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Common helpers
# ---------------------------------------------------------------------------

def _normalize_job(
    raw: Dict[str, Any],
    source_name: str,
    title_key: str = "title",
    company_key: str = "company_name",
    desc_key: str = "description",
    url_key: str = "url",
) -> Optional[Dict]:
    """
    Convert a raw API job dict into the standard internal schema.
    Returns None if title or company are missing.
    """
    try:
        title = (raw.get(title_key) or "").strip()
        company = (raw.get(company_key) or "").strip()

        if not title:
            return None

        description = (raw.get(desc_key) or "").strip()
        url = (raw.get(url_key) or "").strip() or None

        # Extract skills from combined text
        full_text = f"{title} {description}"
        try:
            from extractor import extract_skills_with_nlp
            skills = extract_skills_with_nlp(full_text)
        except Exception as e:
            logger.warning(f"NLP extraction failed, using fallback: {e}")
            skills = extract_skills_from_text(full_text, threshold=70)

        return {
            "title":       title,
            "company":     company or "Unknown Company",
            "description": description or title,
            "url":         url,
            "source":      source_name,
            "skills":      skills,
        }
    except Exception as exc:
        logger.warning("Failed to normalise job from %s: %s", source_name, exc)
        return None


# ---------------------------------------------------------------------------
# Remotive  (https://remotive.com/api/remote-jobs)
# ---------------------------------------------------------------------------

REMOTIVE_BASE = "https://remotive.com/api/remote-jobs"


def fetch_remotive(query: str, params: Dict = None, max_results: int = 30) -> List[Dict]:
    """
    Fetch remote jobs from the Remotive public API.

    Args:
        query:       Search term (e.g. "Python Developer").
        params:      Extra query params from the DB source record (not required).
        max_results: Maximum number of jobs to return.

    Returns:
        Normalised list of job dicts.
    """
    params = params or {}
    jobs: List[Dict] = []

    try:
        query_params = {"search": query, "limit": max_results}
        query_params.update({k: v for k, v in params.items() if k not in query_params})

        logger.info("Fetching from Remotive: query=%s", query)

        with httpx.Client(timeout=20) as client:
            response = client.get(REMOTIVE_BASE, params=query_params)
            response.raise_for_status()
            data = response.json()

        raw_jobs = data.get("jobs", [])
        logger.info("Remotive returned %d raw jobs", len(raw_jobs))

        for raw in raw_jobs[:max_results]:
            job = _normalize_job(
                raw,
                source_name="remotive",
                title_key="title",
                company_key="company_name",
                desc_key="description",
                url_key="url",
            )
            if job:
                jobs.append(job)

    except httpx.HTTPStatusError as exc:
        logger.error("Remotive HTTP error %s: %s", exc.response.status_code, exc)
    except httpx.RequestError as exc:
        logger.error("Remotive network error: %s", exc)
    except Exception as exc:
        logger.error("Unexpected error fetching from Remotive: %s", exc)

    logger.info("Remotive: %d normalised jobs for query '%s'", len(jobs), query)
    return jobs


# ---------------------------------------------------------------------------
# Adzuna  (https://api.adzuna.com/v1/api/jobs/{country}/search/)
# ---------------------------------------------------------------------------

ADZUNA_BASE = "https://api.adzuna.com/v1/api/jobs/us/search/1"

def fetch_adzuna(query: str, params: Dict = None, max_results: int = 30) -> List[Dict]:
    """
    Fetch jobs from the Adzuna API.
    """
    params = params or {}
    jobs: List[Dict] = []

    # Accept credentials from DB params OR environment variables
    app_id  = params.get("app_id")  or os.environ.get("ADZUNA_APP_ID", "")
    app_key = params.get("app_key") or os.environ.get("ADZUNA_APP_KEY", "")

    if not app_id or not app_key:
        logger.warning(
            "Adzuna credentials missing – skipping Adzuna source. "
            "Set ADZUNA_APP_ID and ADZUNA_APP_KEY in .env or in the source params."
        )
        return jobs

    try:
        query_params = {
            "app_id":           app_id,
            "app_key":          app_key,
            "what":             query,
            "results_per_page": min(max_results, 50),
        }

        # إعدادات التمويه عشان الفايرول ميقفلش في وشنا
        custom_headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            "Accept": "application/json"
        }

        logger.info("Fetching from Adzuna: query=%s", query)

        # تمرير الـ custom_headers للكلينت
        with httpx.Client(timeout=20, headers=custom_headers) as client:
            response = client.get(ADZUNA_BASE, params=query_params)
            response.raise_for_status()
            data = response.json()

        raw_jobs = data.get("results", [])
        logger.info("Adzuna returned %d raw jobs", len(raw_jobs))

        for raw in raw_jobs[:max_results]:
            company_name = ""
            if isinstance(raw.get("company"), dict):
                company_name = raw["company"].get("display_name", "")

            job = _normalize_job(
                {**raw, "company_name": company_name},
                source_name="adzuna",
                title_key="title",
                company_key="company_name",
                desc_key="description",
                url_key="redirect_url",
            )
            if job:
                jobs.append(job)

    except httpx.HTTPStatusError as exc:
        logger.error("Adzuna HTTP error %s: %s", exc.response.status_code, exc)
    except httpx.RequestError as exc:
        logger.error("Adzuna network error: %s", exc)
    except Exception as exc:
        logger.error("Unexpected error fetching from Adzuna: %s", exc)

    logger.info("Adzuna: %d normalised jobs for query '%s'", len(jobs), query)
    return jobs

# ---------------------------------------------------------------------------
# Generic JSON API dispatcher
# ---------------------------------------------------------------------------

def fetch_generic_api(source: Dict, query: str, max_results: int = 30) -> List[Dict]:
    """
    Generic fallback for API-type sources that match no specific handler.
    Sends a GET to the endpoint with `query` injected and tries to find
    a 'jobs', 'results', or 'data' key in the response.
    """
    jobs: List[Dict] = []
    endpoint = source.get("endpoint", "")
    name     = source.get("name", "unknown")
    params   = source.get("params") or {}
    headers  = source.get("headers") or {}

    try:
        query_params = {**params, "query": query, "q": query, "limit": max_results}

        logger.info("Generic API fetch from '%s': %s", name, endpoint)

        with httpx.Client(timeout=20, headers=headers) as client:
            response = client.get(endpoint, params=query_params)
            response.raise_for_status()
            data = response.json()

        # Try common container keys
        raw_jobs = (
            data.get("jobs")
            or data.get("results")
            or data.get("data")
            or (data if isinstance(data, list) else [])
        )

        for raw in raw_jobs[:max_results]:
            if not isinstance(raw, dict):
                continue
            job = _normalize_job(raw, source_name=name)
            if job:
                jobs.append(job)

    except httpx.HTTPStatusError as exc:
        logger.error("Generic API '%s' HTTP error %s", name, exc.response.status_code)
    except Exception as exc:
        logger.error("Generic API '%s' error: %s", name, exc)

    logger.info("Generic API '%s': %d jobs for query '%s'", name, len(jobs), query)
    return jobs
