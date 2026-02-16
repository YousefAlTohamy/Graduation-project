"""
Skill Extractor Module
Uses NLP and keyword matching to extract skills from CV text
"""

try:
    import spacy
    SPACY_AVAILABLE = True
except ImportError:
    SPACY_AVAILABLE = False

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
    if not SPACY_AVAILABLE:
        logger.warning("spaCy not installed. Using fuzzy matching fallback.")
        return False
    
    if nlp is None:
        try:
            nlp = spacy.load("en_core_web_sm")
            logger.info("spaCy model loaded successfully")
        except OSError:
            logger.warning("spaCy model not found. Using fuzzy matching fallback.")
            return False
    
    return True


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
    # Communication Skills
    "Communication", "Verbal Communication", "Written Communication",
    "Presentation Skills", "Public Speaking", "Active Listening",
    
    # Teamwork & Collaboration
    "Teamwork", "Collaboration", "Team Player", "Cooperative",
    "Interpersonal Skills", "Cross-functional Collaboration",
    
    # Leadership
    "Leadership", "Team Leadership", "Mentoring", "Coaching",
    "Decision Making", "Strategic Thinking", "Vision",
    
    # Problem Solving & Analytical
    "Problem Solving", "Analytical Skills", "Critical Thinking",
    "Troubleshooting", "Problem-Solver", "Analytical Thinking",
    
    # Time & Project Management
    "Time Management", "Organizational Skills", "Planning",
    "Project Management", "Prioritization", "Multitasking",
    
    # Adaptability & Flexibility
    "Adaptability", "Flexibility", "Learning Agility",
    "Open-minded", "Resilience", "Change Management",
    
    # Work Ethic
    "Work Ethic", "Self-Motivation", "Initiative", "Proactive",
    "Attention to Detail", "Reliability", "Dedication",
    
    # Creativity & Innovation
    "Creativity", "Innovation", "Creative Thinking",
    "Out-of-the-box Thinking",
    
    # Conflict Resolution
    "Conflict Resolution", "Negotiation", "Diplomacy",
    "Stakeholder Management"
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
    
    # Normalize text: lowercase and strip extra whitespace
    text_lower = ' '.join(text.lower().split())
    # Pre-tokenize for faster single-word matching
    # Keep punctuation for context, but create a clean token set
    tokens_clean = set(word.strip('.,!?;:()[]{}"\'/\\').lower() for word in text.split())

    found_skills: Set[str] = set()
    
    # Simple keyword matching with fuzzy logic
    for skill in skill_list:
        skill_lower = skill.lower().strip()
        
        # Strategy 1: Multi-word skills (e.g., "React Native") -> Use substring match
        if ' ' in skill_lower:
            if skill_lower in text_lower:
                found_skills.add(skill)
                continue
        
        # Strategy 2: Single-word skills (e.g., "Java", "R") -> Use exact token match
        # This prevents "R" matching inside "Expert" or "C" inside "Back"
        else:
            if skill_lower in tokens_clean:
                found_skills.add(skill)
                continue

            # Strategy 3: Fuzzy matching for variations (only if not found exactly)
            matched_fuzzy = False
            for word in text.split():
                word_clean = word.strip('.,!?;:()[]{}"\'/\\').lower()
                
                # Skip short words for fuzzy matching to reduce noise
                if len(word_clean) < 3 or len(skill_lower) < 3:
                     continue

                if word_clean and fuzz.ratio(skill_lower, word_clean) >= threshold:
                    found_skills.add(skill)
                    matched_fuzzy = True
                    break
            
            if matched_fuzzy:
                continue
    
    # Categorize skills
    result = []
    for skill in found_skills:
        skill_type = "technical" if skill in TECHNICAL_SKILLS else "soft"
        result.append({
            "name": skill,
            "type": skill_type
        })
    
    logger.info(f"Extracted {len(result)} skills from text (threshold={threshold})")
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


def categorize_skill_by_demand(percentage: float) -> str:
    """
    Categorize skill importance based on market demand frequency.
    
    Args:
        percentage: Frequency percentage (0-100) of jobs requiring this skill
        
    Returns:
        Category: 'essential' (>70%), 'important' (40-70%), or 'nice_to_have' (<40%)
    """
    if percentage > 70:
        return 'essential'
    elif percentage >= 40:
        return 'important'
    else:
        return 'nice_to_have'
