from extractor import extract_skills_from_text
import logging

# Configure logging to see our new format
logging.basicConfig(level=logging.INFO)

test_cases = [
    "I have experience with Laravel Framework and React.js",
    "Skilled in Pythno and Djanog", # Typos for fuzzy matching
    "Expert in C++, C# and .NET", # Punctuation heavy
]

print("--- Testing Fuzzy Matching ---")
for text in test_cases:
    print(f"\nInput: {text}")
    skills = extract_skills_from_text(text, threshold=80)
    print(f"Skills Found: {[s['name'] for s in skills]}")
