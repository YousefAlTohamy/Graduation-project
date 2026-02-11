"""
Skill Extractor Module
Uses NLP and keyword matching to extract skills from CV text
"""

import spacy
from typing import List, Dict, Set
from fuzzywuzzy import fuzz
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load spaCy model (make sure to run: python -m spacy download en_core_web_sm)
nlp = None

def load_nlp_model():
    """Load spaCy NLP model (lazy loading)"""
    global nlp
    if nlp is None:
        try:
            nlp = spacy.load("en_core_web_sm")
            logger.info("spaCy model loaded successfully")
        except OSError:
            logger.error("spaCy model not found. Run: python -m spacy download en_core_web_sm")
            raise


# Predefined skill database (can be loaded from database in production)
TECHNICAL_SKILLS = [
    # Programming Languages
    "PHP", "Python", "JavaScript", "Java", "C++", "C#", "Ruby", "Go", "Rust", 
    "TypeScript", "Swift", "Kotlin", "Scala", "R", "MATLAB",
    
    # Web Frameworks
    "Laravel", "Django", "Flask", "FastAPI", "React", "Vue.js", "Angular", 
    "Node.js", "Express.js", "Spring Boot", "ASP.NET", "Ruby on Rails",
    
    # Databases
    "MySQL", "PostgreSQL", "MongoDB", "Redis", "SQLite", "Oracle", 
    "SQL Server", "MariaDB", "Cassandra", "DynamoDB",
    
    # DevOps & Tools
    "Docker", "Kubernetes", "Git", "GitHub", "GitLab", "Jenkins", "CI/CD",
    "AWS", "Azure", "Google Cloud", "Terraform", "Ansible",
    
    # Frontend
    "HTML", "CSS", "SASS", "LESS", "Bootstrap", "Tailwind CSS", "jQuery",
    "Webpack", "Vite", "Next.js", "Nuxt.js",
    
    # Mobile
    "React Native", "Flutter", "iOS", "Android", "Xamarin",
    
    # Other
    "REST API", "GraphQL", "WebSockets", "Microservices", "OAuth",
    "JWT", "Testing", "Unit Testing", "TDD", "Agile", "Scrum"
]

SOFT_SKILLS = [
    "Communication", "Teamwork", "Leadership", "Problem Solving",
    "Time Management", "Critical Thinking", "Creativity", "Adaptability",
    "Work Ethic", "Attention to Detail", "Collaboration", "Interpersonal Skills",
    "Organizational Skills", "Decision Making", "Conflict Resolution",
    "Presentation Skills", "Analytical Skills", "Self-Motivation"
]


def extract_skills_from_text(text: str, skill_list: List[str] = None, threshold: int = 80) -> List[Dict[str, str]]:
    """
    Extract skills from text using fuzzy matching.
    
    Args:
        text: The CV text to analyze
        skill_list: Custom list of skills to search for (optional)
        threshold: Fuzzy matching threshold (0-100), higher = stricter
        
    Returns:
        List of dictionaries containing found skills with their types
    """
    if not text:
        return []
    
    if skill_list is None:
        skill_list = TECHNICAL_SKILLS + SOFT_SKILLS
    
    text_lower = text.lower()
    found_skills: Set[str] = set()
    
    # Simple keyword matching with fuzzy logic
    for skill in skill_list:
        skill_lower = skill.lower()
        
        # Exact match (case-insensitive)
        if skill_lower in text_lower:
            found_skills.add(skill)
            continue
        
        # Fuzzy matching for variations
        for word in text.split():
            word_clean = word.strip('.,!?;:()[]{}"\'/\\')
            if fuzz.ratio(skill_lower, word_clean.lower()) >= threshold:
                found_skills.add(skill)
                break
    
    # Categorize skills
    result = []
    for skill in found_skills:
        skill_type = "technical" if skill in TECHNICAL_SKILLS else "soft"
        result.append({
            "name": skill,
            "type": skill_type
        })
    
    logger.info(f"Extracted {len(result)} skills from text")
    return result


def extract_skills_with_nlp(text: str, skill_list: List[str] = None) -> List[Dict[str, str]]:
    """
    Extract skills using spaCy NLP for better context understanding.
    
    Args:
        text: The CV text to analyze
        skill_list: Custom list of skills to search for (optional)
        
    Returns:
        List of dictionaries containing found skills with their types
    """
    load_nlp_model()
    
    if not text:
        return []
    
    if skill_list is None:
        skill_list = TECHNICAL_SKILLS + SOFT_SKILLS
    
    # Process text with spaCy
    doc = nlp(text)
    
    found_skills: Set[str] = set()
    skill_list_lower = [s.lower() for s in skill_list]
    
    # Extract noun phrases and tokens
    for chunk in doc.noun_chunks:
        chunk_text = chunk.text.lower()
        for skill in skill_list:
            if skill.lower() in chunk_text:
                found_skills.add(skill)
    
    # Also check individual tokens
    for token in doc:
        token_text = token.text.lower()
        for skill in skill_list:
            if skill.lower() == token_text:
                found_skills.add(skill)
    
    # Categorize skills
    result = []
    for skill in found_skills:
        skill_type = "technical" if skill in TECHNICAL_SKILLS else "soft"
        result.append({
            "name": skill,
            "type": skill_type
        })
    
    logger.info(f"Extracted {len(result)} skills using NLP")
    return result


def get_predefined_skills() -> Dict[str, List[str]]:
    """
    Get the complete list of predefined skills.
    
    Returns:
        Dictionary with 'technical' and 'soft' skill lists
    """
    return {
        "technical": TECHNICAL_SKILLS,
        "soft": SOFT_SKILLS
    }
