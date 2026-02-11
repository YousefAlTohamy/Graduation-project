"""
PDF Parser Module
Extracts raw text from PDF files using pdfminer.six
"""

from pdfminer.high_level import extract_text
from pdfminer.layout import LAParams
from typing import Optional
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def extract_text_from_pdf(pdf_path: str) -> Optional[str]:
    """
    Extract text content from a PDF file.
    
    Args:
        pdf_path: Path to the PDF file
        
    Returns:
        Extracted text as a string, or None if extraction fails
    """
    try:
        # Configure layout analysis parameters
        laparams = LAParams(
            line_margin=0.5,
            word_margin=0.1,
            char_margin=2.0,
            boxes_flow=0.5,
            detect_vertical=False,
            all_texts=False
        )
        
        # Extract text with custom parameters
        text = extract_text(pdf_path, laparams=laparams)
        
        if not text or not text.strip():
            logger.warning(f"No text extracted from {pdf_path}")
            return None
            
        logger.info(f"Successfully extracted {len(text)} characters from PDF")
        return text.strip()
        
    except FileNotFoundError:
        logger.error(f"PDF file not found: {pdf_path}")
        return None
    except Exception as e:
        logger.error(f"Error extracting text from PDF: {str(e)}")
        return None


def clean_text(text: str) -> str:
    """
    Clean extracted text by removing excessive whitespace and special characters.
    
    Args:
        text: Raw extracted text
        
    Returns:
        Cleaned text
    """
    if not text:
        return ""
    
    # Remove multiple spaces and normalize whitespace
    lines = [line.strip() for line in text.split('\n')]
    lines = [line for line in lines if line]  # Remove empty lines
    
    return '\n'.join(lines)
