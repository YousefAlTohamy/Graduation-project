"""
FastAPI Main Application
Provides REST API endpoints for CV analysis
"""

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict
import os
import tempfile
import logging

from parser import extract_text_from_pdf, clean_text
from extractor import extract_skills_from_text, extract_skills_with_nlp, get_predefined_skills
from scraper import scrape_wuzzuf, scrape_sample_jobs, calculate_skill_frequencies

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="CareerCompass AI Engine",
    description="Microservice for CV parsing and skill extraction",
    version="1.0.0"
)

# Configure CORS to allow Laravel backend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your Laravel domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    """Health check endpoint"""
    return {
        "service": "CareerCompass AI Engine",
        "status": "running",
        "version": "1.0.0"
    }


@app.get("/skills")
def get_skills():
    """
    Get the complete list of predefined skills.
    
    Returns:
        Dictionary containing technical and soft skills
    """
    return get_predefined_skills()


@app.post("/analyze")
async def analyze_cv(file: UploadFile = File(...), use_nlp: bool = False):
    """
    Analyze a CV (PDF) and extract skills.
    
    Args:
        file: PDF file upload
        use_nlp: Whether to use NLP-based extraction (default: False, uses fuzzy matching)
        
    Returns:
        JSON with extracted skills and metadata
    """
    # Validate file type
    if not file.filename.endswith('.pdf'):
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are supported"
        )
    
    # Create temporary file to save upload
    temp_file = None
    try:
        # Save uploaded file to temp location
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp:
            content = await file.read()
            temp.write(content)
            temp_file = temp.name
        
        logger.info(f"Processing file: {file.filename}")
        
        # Extract text from PDF
        raw_text = extract_text_from_pdf(temp_file)
        
        if not raw_text:
            raise HTTPException(
                status_code=422,
                detail="Could not extract text from PDF. The file may be corrupted or image-based."
            )
        
        # Clean extracted text
        cleaned_text = clean_text(raw_text)
        
        # Extract skills
        if use_nlp:
            skills = extract_skills_with_nlp(cleaned_text)
        else:
            skills = extract_skills_from_text(cleaned_text)
        
        # Prepare response
        response = {
            "filename": file.filename,
            "skills": skills,
            "total_skills": len(skills),
            "technical_skills": [s for s in skills if s["type"] == "technical"],
            "soft_skills": [s for s in skills if s["type"] == "soft"],
            "text_length": len(cleaned_text),
            "status": "success"
        }
        
        logger.info(f"Successfully extracted {len(skills)} skills from {file.filename}")
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error analyzing CV: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )
    finally:
        # Clean up temporary file
        if temp_file and os.path.exists(temp_file):
            try:
                os.unlink(temp_file)
            except Exception as e:
                logger.warning(f"Could not delete temp file: {str(e)}")


@app.post("/extract-text")
async def extract_text(file: UploadFile = File(...)):
    """
    Extract raw text from a PDF file without skill analysis.
    
    Args:
        file: PDF file upload
        
    Returns:
        JSON with extracted text
    """
    if not file.filename.endswith('.pdf'):
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are supported"
        )
    
    temp_file = None
    try:
        # Save uploaded file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp:
            content = await file.read()
            temp.write(content)
            temp_file = temp.name
        
        # Extract and clean text
        raw_text = extract_text_from_pdf(temp_file)
        
        if not raw_text:
            raise HTTPException(
                status_code=422,
                detail="Could not extract text from PDF"
            )
        
        cleaned_text = clean_text(raw_text)
        
        return {
            "filename": file.filename,
            "text": cleaned_text,
            "length": len(cleaned_text),
            "status": "success"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error extracting text: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )
    finally:
        if temp_file and os.path.exists(temp_file):
            try:
                os.unlink(temp_file)
            except Exception as e:
                logger.warning(f"Could not delete temp file: {str(e)}")


# Pydantic models for request validation
class ScrapeJobsRequest(BaseModel):
    query: str
    max_results: int = 20
    use_samples: bool = False  # For testing without actual scraping
    calculate_statistics: bool = True  # Calculate skill frequency statistics


@app.post("/scrape-jobs")
def scrape_jobs(request: ScrapeJobsRequest):
    """
    Scrape job listings from Wuzzuf.
    
    Args:
        request: Contains query, max_results, and use_samples flag
        
    Returns:
        List of job dictionaries with skills
    """
    try:
        logger.info(f"Job scraping requested: query='{request.query}', max_results={request.max_results}")
        
        if request.use_samples:
            # Use sample jobs for testing
            jobs = scrape_sample_jobs(count=request.max_results)
            logger.info(f"Returning {len(jobs)} sample jobs")
        else:
            # Actual scraping
            max_pages = max(1, request.max_results // 15)  # ~15 jobs per page
            jobs = scrape_wuzzuf(request.query, max_pages=max_pages)
            
            # Limit to requested number
            jobs = jobs[:request.max_results]
        
        # Calculate skill statistics if requested
        statistics = {}
        if request.calculate_statistics and jobs:
            skill_stats = calculate_skill_frequencies(jobs)
            
            # Prepare statistics summary
            statistics = {
                'skills': skill_stats,
                'total_unique_skills': len(skill_stats),
                'average_skills_per_job': sum(len(job.get('skills', [])) for job in jobs) / len(jobs) if jobs else 0
            }
            
            logger.info(f"Calculated statistics for {len(jobs)} jobs: {len(skill_stats)} unique skills")
        
        return {
            "success": True,
            "query": request.query,
            "total_jobs": len(jobs),
            "jobs": jobs,
            "source": "samples" if request.use_samples else "wuzzuf",
            "statistics": statistics if request.calculate_statistics else None
        }
        
    except Exception as e:
        logger.error(f"Error scraping jobs: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to scrape jobs: {str(e)}"
        )


@app.get("/scrape-jobs/status")
def scraper_status():
    """Check if the scraper service is operational."""
    return {
        "service": "Job Scraper",
        "status": "operational",
        "supported_sources": ["wuzzuf", "samples"],
        "rate_limit": "2 seconds between requests",
        "max_pages": 10
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001, reload=True)
