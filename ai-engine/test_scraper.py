"""
test_scraper.py
Exposes a FastAPI router with POST /test-source used by the Laravel
`php artisan scrape:test-sources` command to probe a single source.

Also usable as a standalone CLI tool:
    python test_scraper.py --endpoint "https://remotive.com/api/remote-jobs" --type api --query python
    python test_scraper.py --endpoint "https://wuzzuf.net/search/jobs/" --type html --query laravel
"""

import argparse
import gc
import json
import logging
import sys
from typing import Dict, List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

# ── Reuse the existing scraper modules (lazy so server stays up even if absent)
try:
    from html_scraper import scrape_html_source
    _HTML_OK = True
except ImportError:
    _HTML_OK = False

try:
    from api_fetcher import fetch_remotive, fetch_adzuna, fetch_generic_api
    _API_OK = True
except ImportError:
    _API_OK = False

logging.basicConfig(level=logging.INFO, format="%(levelname)s  %(message)s")
logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────────────────────────────────────
# Pydantic models
# ─────────────────────────────────────────────────────────────────────────────

class SourcePayload(BaseModel):
    id:       Optional[int]  = None
    name:     str
    endpoint: str
    type:     str               # 'api' | 'html'
    headers:  Optional[Dict] = None
    params:   Optional[Dict] = None


class TestSourceRequest(BaseModel):
    source:      SourcePayload
    query:       str = "developer"
    max_results: int = 2        # keep tiny – connectivity test only


# ─────────────────────────────────────────────────────────────────────────────
# FastAPI router  (registered in main.py via app.include_router)
# ─────────────────────────────────────────────────────────────────────────────

router = APIRouter()


@router.post("/test-source")
def test_source(request: TestSourceRequest):
    """
    Lightweight probe for a single scraping source.
    Returns: {success, source_name, total_fetched, jobs, message}
    """
    src   = request.source
    stype = src.type.lower()
    name  = src.name

    logger.info("test-source: probing '%s' (%s)", name, stype)

    try:
        jobs: List[Dict] = []

        if stype == "api":
            if not _API_OK:
                raise RuntimeError("api_fetcher module not available on this server.")

            endpoint_lower = src.endpoint.lower()
            name_lower     = name.lower()
            params         = src.params or {}

            if "remotive" in endpoint_lower or "remotive" in name_lower:
                jobs = fetch_remotive(request.query, params=params, max_results=request.max_results)
            elif "adzuna" in endpoint_lower or "adzuna" in name_lower:
                jobs = fetch_adzuna(request.query, params=params, max_results=request.max_results)
            else:
                source_dict = {
                    "name":     src.name,
                    "endpoint": src.endpoint,
                    "headers":  src.headers or {},
                    "params":   params,
                }
                jobs = fetch_generic_api(source_dict, request.query, max_results=request.max_results)

        elif stype == "html":
            if not _HTML_OK:
                raise RuntimeError("html_scraper module not available on this server.")

            source_dict = {
                "name":     src.name,
                "endpoint": src.endpoint,
                "headers":  src.headers or {},
                "params":   src.params  or {},
            }
            jobs = scrape_html_source(source_dict, request.query, max_results=request.max_results)

        else:
            raise ValueError(f"Unknown source type: {stype!r}")

        jobs = jobs[:request.max_results]

        if not jobs:
            return {
                "success":       False,
                "source_name":   name,
                "total_fetched": 0,
                "jobs":          [],
                "message":       "Source responded but returned 0 jobs – site may be blocking or query matched nothing.",
            }

        return {
            "success":       True,
            "source_name":   name,
            "total_fetched": len(jobs),
            "jobs":          jobs,
            "message":       f"OK – {len(jobs)} job(s) fetched successfully.",
        }

    except Exception as exc:
        logger.error("test-source failed for '%s': %s", name, exc, exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))

    finally:
        gc.collect()


# ─────────────────────────────────────────────────────────────────────────────
# Standalone CLI
# ─────────────────────────────────────────────────────────────────────────────

def _cli():
    parser = argparse.ArgumentParser(
        description="Quick connectivity probe for a single scraping source.",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    parser.add_argument("--endpoint", required=True, help="Full URL to test")
    parser.add_argument("--type",     default="api", choices=["api", "html"])
    parser.add_argument("--name",     default="CLI Test")
    parser.add_argument("--query",    default="developer")
    parser.add_argument("--max",      default=2, type=int)
    parser.add_argument("--params",   default="{}", help='JSON string, e.g. {"app_id":"..."}')
    args = parser.parse_args()

    print(f"\n{'─'*55}")
    print(f"  Source   : {args.name}")
    print(f"  Endpoint : {args.endpoint}")
    print(f"  Type     : {args.type}   Query: {args.query}")
    print(f"{'─'*55}\n")

    source_dict = {
        "name":     args.name,
        "endpoint": args.endpoint,
        "headers":  {},
        "params":   json.loads(args.params),
    }

    jobs: List[Dict] = []

    if args.type == "api":
        if not _API_OK:
            print("✘  FAIL – api_fetcher not importable.")
            sys.exit(1)
        endpoint_lower = args.endpoint.lower()
        if "remotive" in endpoint_lower:
            jobs = fetch_remotive(args.query, max_results=args.max)
        elif "adzuna" in endpoint_lower:
            jobs = fetch_adzuna(args.query, params=source_dict["params"], max_results=args.max)
        else:
            jobs = fetch_generic_api(source_dict, args.query, max_results=args.max)
    else:
        if not _HTML_OK:
            print("✘  FAIL – html_scraper not importable.")
            sys.exit(1)
        jobs = scrape_html_source(source_dict, args.query, max_results=args.max)

    gc.collect()

    if not jobs:
        print("✘  FAIL – No jobs returned (site may be blocking or query matched nothing).")
        sys.exit(1)

    print(f"✔  PASS – {len(jobs)} job(s) fetched.\n")
    for i, job in enumerate(jobs[:args.max], 1):
        print(f"  [{i}] {job.get('title', '(no title)')} @ {job.get('company', '(no company)')}")
        skills = [s["name"] if isinstance(s, dict) else s for s in job.get("skills", [])[:5]]
        if skills:
            print(f"      Skills: {', '.join(skills)}")
    print()


if __name__ == "__main__":
    _cli()
