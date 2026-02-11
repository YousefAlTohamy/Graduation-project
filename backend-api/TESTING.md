# Test CV Upload API

This document provides testing instructions for the CV Upload API.

## Prerequisites

1. **AI Engine Running**: Ensure the Python AI Engine is running on port 8001

    ```bash
    cd ai-engine
    venv\Scripts\activate
    uvicorn main:app --reload --port 8001
    ```

2. **Laravel Server Running**:

    ```bash
    cd backend-api
    php artisan serve
    ```

3. **Database Seeded**: Ensure skills are seeded
    ```bash
    php artisan db:seed --class=SkillSeeder
    ```

## Authentication Setup

Since we're using Sanctum, you need an API token. For testing, create a simple token:

```bash
php artisan tinker
```

In Tinker:

```php
$user = User::first();
$token = $user->createToken('test-token')->plainTextToken;
echo $token;
```

Copy the token for use in API requests.

## API Endpoints

### 1. Health Check (No Auth)

```bash
curl http://127.0.0.1:8000/api/health
```

**Expected Response:**

```json
{
    "status": "ok",
    "service": "CareerCompass API",
    "version": "1.0.0"
}
```

### 2. Upload CV (Requires Auth)

```bash
curl -X POST http://127.0.0.1:8000/api/upload-cv \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "cv=@path/to/your/cv.pdf"
```

**Expected Success Response (200):**

```json
{
    "success": true,
    "message": "CV analyzed successfully",
    "data": {
        "total_skills_extracted": 15,
        "skills_matched": 12,
        "new_skills_added": 10,
        "existing_skills": 2,
        "total_user_skills": 12,
        "skills": [
            {
                "id": 1,
                "name": "PHP",
                "type": "technical"
            }
        ],
        "unmatched_skills": ["Some Rare Skill"]
    }
}
```

### 3. Get User Skills (Requires Auth)

```bash
curl http://127.0.0.1:8000/api/user/skills \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Response:**

```json
{
  "success": true,
  "data": {
    "total": 12,
    "technical": 10,
    "soft": 2,
    "skills": [...]
  }
}
```

### 4. Remove Skill (Requires Auth)

```bash
curl -X DELETE http://127.0.0.1:8000/api/user/skills/1 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Response:**

```json
{
    "success": true,
    "message": "Skill removed successfully."
}
```

## Using Postman

1. Create a new request
2. Set Authorization Type to "Bearer Token"
3. Paste your token
4. For CV upload:
    - Method: POST
    - URL: `http://127.0.0.1:8000/api/upload-cv`
    - Body: form-data
    - Key: `cv` (type: File)
    - Value: Select your PDF file

## Sample Test CV Content

Create a simple PDF with this content for testing:

```
John Doe
Full Stack Developer

SKILLS:
- PHP
- Laravel
- Python
- FastAPI
- React
- MySQL
- Docker
- Git
- Communication
- Teamwork

EXPERIENCE:
- Built microservices with Laravel and Python
- Developed REST APIs with FastAPI
- Managed databases with MySQL
```

## Troubleshooting

### 401 Unauthorized

- Check if token is correct
- Verify Sanctum is installed: `composer show laravel/sanctum`
- Clear config cache: `php artisan config:clear`

### 422 Validation Error

- Ensure file is PDF format
- Check file size is under 5MB
- Verify field name is `cv`

### 500 Server Error

- Check Laravel logs: `storage/logs/laravel.log`
- Verify AI Engine is running on port 8001
- Check database connection in `.env`

### 503 Service Unavailable

- AI Engine is not running or unreachable
- Check `AI_ENGINE_URL` in `.env`
