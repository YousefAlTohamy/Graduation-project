# Python AI Engine - CareerCompass

This microservice handles:

- PDF CV parsing
- Skill extraction using NLP
- Job scraping from various platforms

## Setup

```bash
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # macOS/Linux
pip install -r requirements.txt
python -m spacy download en_core_web_sm
```

## Run

```bash
uvicorn main:app --reload --port 8001
```

Access API docs at: http://127.0.0.1:8001/docs
