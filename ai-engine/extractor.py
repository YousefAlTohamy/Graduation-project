"""
Skill Extractor Module
Uses NLP and keyword matching to extract skills from CV text
"""

try:
    import spacy
    SPACY_AVAILABLE = True
except ImportError:
    SPACY_AVAILABLE = False

from typing import List, Dict, Set, Optional
import re
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


# ---------------------------------------------------------------------------
# Job Title & Experience Patterns
# ---------------------------------------------------------------------------

JOB_TITLE_PATTERNS = [
    # Full-stack
    r"\bfull[\s\-]?stack\s+(?:web\s+)?developer\b",
    r"\bfull[\s\-]?stack\s+engineer\b",
    # Frontend / UI
    r"\bfront[\s\-]?end\s+(?:web\s+)?developer\b",
    r"\bfront[\s\-]?end\s+engineer\b",
    r"\bui\s*[/&]\s*ux\s+(?:designer|developer|engineer)\b",
    r"\bui\s+developer\b",
    r"\breact\s+developer\b",
    r"\bangular\s+developer\b",
    r"\bvue(?:\.js)?\s+developer\b",
    # Backend
    r"\bback[\s\-]?end\s+(?:web\s+)?developer\b",
    r"\bback[\s\-]?end\s+engineer\b",
    r"\blaravel\s+developer\b",
    r"\bdjango\s+developer\b",
    r"\bnode(?:\.js)?\s+developer\b",
    r"\bphp\s+developer\b",
    r"\bpython\s+developer\b",
    r"\bjava\s+(?:se\s+)?developer\b",
    # Mobile
    r"\bmobile\s+(?:app\s+)?developer\b",
    r"\bios\s+developer\b",
    r"\bandroid\s+developer\b",
    r"\bflutter\s+developer\b",
    r"\breact\s+native\s+developer\b",
    # Data / AI / ML
    r"\bdata\s+scientist\b",
    r"\bdata\s+analyst\b",
    r"\bdata\s+engineer\b",
    r"\bmachine\s+learning\s+engineer\b",
    r"\bml\s+engineer\b",
    r"\bai\s+engineer\b",
    # DevOps / Cloud
    r"\bdevops\s+engineer\b",
    r"\bsite\s+reliability\s+engineer\b",
    r"\bcloud\s+engineer\b",
    r"\bsre\b",
    # General software
    r"\bsoftware\s+engineer\b",
    r"\bsoftware\s+developer\b",
    r"\bweb\s+developer\b",
    r"\b(?:senior|junior|mid[\s\-]?level)\s+(?:software\s+)?(?:engineer|developer)\b",
    # Security & QA
    r"\bcyber[\s\-]?security\s+(?:engineer|analyst|specialist)\b",
    r"\bqa\s+(?:automation\s+)?engineer\b",
    # Architecture / Management
    r"\bsoftware\s+architect\b",
    r"\btech(?:nical)?\s+lead\b",
    r"\bengineering\s+manager\b",
    # Generic fallback
    r"\b(?:senior|lead|principal|junior|associate)\s+(?:\w+\s+)?(?:engineer|developer)\b",
    r"\b\w+\s+developer\b",
    r"\b\w+\s+engineer\b",
]

TITLE_SECTION_HEADERS = [
    r"(?:professional\s+)?(?:title|profile|summary|objective|headline|position|role|designation)",
    r"about\s+me",
    r"current\s+(?:position|role|title)",
]


def extract_job_title(text: str) -> Optional[str]:
    """
    Infer the candidate's current job title from CV text.

    Strategy:
    1. Look for a title immediately after known section headers (top 30 lines).
    2. Scan the first ~600 characters (name + summary block).
    3. Fall back to a full-document scan.
    """
    lines = text.split("\n")

    # Strategy 1: After section headers
    header_re = re.compile(
        r"(?:" + "|".join(TITLE_SECTION_HEADERS) + r")\s*[:\-]?\s*(.+)",
        re.IGNORECASE,
    )
    for line in lines[:30]:
        m = header_re.search(line)
        if m:
            title = _match_title_in_text(m.group(1).strip())
            if title:
                logger.info(f"Job title found via header: {title}")
                return title

    # Strategy 2: First ~600 chars
    head_text = " ".join(text.split()[:120])
    title = _match_title_in_text(head_text)
    if title:
        logger.info(f"Job title found in document head: {title}")
        return title

    # Strategy 3: Full document scan
    title = _match_title_in_text(text)
    if title:
        logger.info(f"Job title found via full scan: {title}")
        return title

    logger.info("No job title detected")
    return None


def _match_title_in_text(text: str) -> Optional[str]:
    """Return the first pattern match from JOB_TITLE_PATTERNS."""
    for pattern in JOB_TITLE_PATTERNS:
        m = re.search(pattern, text, re.IGNORECASE)
        if m:
            return m.group(0).strip().title()
    return None


def extract_experience_years(text: str) -> Optional[str]:
    """
    Infer years of experience from CV text.
    Detects explicit mentions and calculates from work-history date spans.
    """
    explicit_patterns = [
        r"(\d+)\+?\s*(?:to|\-|\u2013)?\s*(\d+)?\s*years?\s+(?:of\s+)?(?:professional\s+)?experience",
        r"over\s+(\d+)\s*years?\s+(?:of\s+)?experience",
        r"more\s+than\s+(\d+)\s*years?\s+(?:of\s+)?experience",
        r"(\d+)\s*years?\s+(?:of\s+)?(?:hands[\s\-]on\s+)?experience",
        r"experience\s+(?:of\s+)?(?:over\s+)?(\d+)\+?\s*years?",
    ]
    for pattern in explicit_patterns:
        m = re.search(pattern, text, re.IGNORECASE)
        if m:
            groups = [g for g in m.groups() if g is not None]
            if len(groups) >= 2:
                return f"{groups[0]}-{groups[1]} years"
            elif groups:
                years = int(groups[0])
                return f"{years}+ years" if years > 0 else None

    # Calculate from work history date spans
    year_spans = re.findall(
        r"\b(20\d{2}|19\d{2})\s*(?:\u2013|-|to)\s*(20\d{2}|19\d{2}|present|current|now)\b",
        text,
        re.IGNORECASE,
    )
    if year_spans:
        import datetime
        current_year = datetime.datetime.now().year
        total_months = 0
        for start_str, end_str in year_spans:
            try:
                start = int(start_str)
                end = current_year if end_str.lower() in ("present", "current", "now") else int(end_str)
                if 1990 <= start <= current_year and start <= end <= current_year + 1:
                    total_months += (end - start) * 12
            except ValueError:
                continue
        if total_months > 0:
            years = total_months // 12
            if years == 0:
                return "< 1 year"
            elif years == 1:
                return "1 year"
            else:
                return f"{years} years"

    return None


def extract_full_profile(text: str) -> Dict:
    """
    Extract a complete profile from CV text: job_title, experience_years, and skills.

    Returns:
        {"job_title": str | None, "experience_years": str | None, "skills": [...]}
    """
    job_title = extract_job_title(text)
    experience_years = extract_experience_years(text)
    skills = extract_skills_from_text(text)

    logger.info(
        f"Full profile: title='{job_title}', experience='{experience_years}', skills={len(skills)}"
    )
    return {
        "job_title": job_title,
        "experience_years": experience_years,
        "skills": skills,
    }
